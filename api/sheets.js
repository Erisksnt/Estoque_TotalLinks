// api/sheets.js
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Carregar as credenciais da Conta de Serviço
let auth;

// Cache para getMovimentacoesGerais
let cacheMovimentacoes = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minuto

async function getAuth() {
  if (auth) return auth;
  
  try {
    let credentials;
    
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      console.log('✅ Usando credenciais da variável de ambiente');
    } else {
      const keyPath = path.join(process.cwd(), 'service-account-key.json');
      const keyContent = fs.readFileSync(keyPath, 'utf8');
      credentials = JSON.parse(keyContent);
      console.log('✅ Usando credenciais do arquivo local');
    }
    
    auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    return auth;
  } catch (error) {
    console.error('Erro ao carregar credenciais:', error);
    throw error;
  }
}

async function getSheet() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

// ============================================
// FUNÇÕES DE ESTOQUE, RETIRADA, INCLUSÃO
// ============================================

async function getEstoque() {
  try {
    const sheets = await getSheet();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'CVS'
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { success: false, error: 'Nenhum dado encontrado na planilha CVS' };
    }

    const items = rows.filter(row => {
      const categoria = row[0] ? String(row[0]).trim() : '';
      const nomeItem = row[1] ? String(row[1]).trim() : '';
      if (categoria === '' || categoria.toLowerCase() === 'categoria') return false;
      if (nomeItem === '') return false;
      return true;
    });

    const headers = [];

    return { success: true, data: { headers, items } };
  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
    return { success: false, error: error.message };
  }
}

async function registrarRetirada(data) {
  try {
    const { 
      itemNome, quantidade, tecnico, observacao, patrimonios, 
      destino_tipo, destino_valor 
    } = data;

    const sheets = await getSheet();
    
    // 1. Buscar o item na planilha CVS
    const estoqueRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'CVS'
    });
    const rows = estoqueRes.data.values;
    if (!rows || rows.length === 0) {
      return { success: false, error: 'Planilha de estoque vazia' };
    }
    
    let linhaItem = -1;
    let estoqueAtual = 0;
    let unidade = '';
    let categoria = '';
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === itemNome) {
        linhaItem = i + 1;
        estoqueAtual = Number(rows[i][3]) || 0;
        unidade = rows[i][2] || 'un';
        categoria = rows[i][0] || '';
        break;
      }
    }
    if (linhaItem === -1) {
      return { success: false, error: `Item "${itemNome}" não encontrado` };
    }
    if (quantidade > estoqueAtual) {
      return { success: false, error: `Estoque insuficiente. Disponível: ${estoqueAtual} ${unidade}` };
    }
    
    const novoEstoque = estoqueAtual - quantidade;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `CVS!D${linhaItem}`,
      valueInputOption: 'RAW',
      resource: { values: [[novoEstoque]] }
    });
    
    // 2. Registrar no log (LOG_RETIRADAS)
    const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const logRow = [
      timestamp,
      categoria,
      itemNome,
      quantidade,
      unidade,
      (patrimonios || []).join(', '),
      tecnico,
      destino_valor || '',
      observacao || '',  
      estoqueAtual,
      novoEstoque
    ];

    await getOrCreateLogSheet('LOG_RETIRADAS', [
      "Timestamp", "Categoria", "Item", "Quantidade", "Unidade",
      "Patrimônios", "Técnico", "Destino", "Observação", "Estoque Anterior", "Estoque Novo"
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'LOG_RETIRADAS',
      valueInputOption: 'RAW',
      resource: { values: [logRow] }
    });
    
    // 3. Se o destino for "tecnico", registrar no controle de equipamentos com técnicos
    if (destino_tipo === 'tecnico') {
      const patrimonioStr = (patrimonios || []).join(', ');
      await adicionarEquipamentoComTecnico(
        itemNome, 
        patrimonioStr, 
        tecnico, 
        observacao,
        destino_valor
      );
    }
    
    // 4. Incrementa o contador global
    await incrementarContadorGlobal();
    
    return {
      success: true,
      data: {
        item: itemNome,
        quantidadeRetirada: quantidade,
        estoqueAnterior: estoqueAtual,
        estoqueAtual: novoEstoque
      }
    };
  } catch (error) {
    console.error('Erro ao registrar retirada:', error);
    return { success: false, error: error.message };
  }
}

async function registrarInclusao(data) {
  try {
    const { categoria, item, quantidade, patrimonio, observacao, tecnico } = data;
    const sheets = await getSheet();
    
    const estoqueRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'CVS'
    });
    const rows = estoqueRes.data.values;
    if (!rows || rows.length === 0) {
      return { success: false, error: 'Planilha de estoque vazia' };
    }
    
    let linhaItem = -1;
    let estoqueAtual = 0;
    let unidade = '';
    let categoriaExistente = '';
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === item) {
        linhaItem = i + 1;
        estoqueAtual = Number(rows[i][3]) || 0;
        unidade = rows[i][2] || 'un';
        categoriaExistente = rows[i][0] || '';
        break;
      }
    }
    if (linhaItem === -1) {
      return { success: false, error: `Item "${item}" não encontrado no estoque` };
    }
    
    const novoEstoque = estoqueAtual + quantidade;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `CVS!D${linhaItem}`,
      valueInputOption: 'RAW',
      resource: { values: [[novoEstoque]] }
    });
    
    const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const logRow = [
      timestamp, categoriaExistente, item, quantidade, unidade,
      patrimonio || '', observacao || '', tecnico || 'Sistema',
      estoqueAtual, novoEstoque
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'LOG_INCLUIDOS',
      valueInputOption: 'RAW',
      resource: { values: [logRow] }
    });
    
    await incrementarContadorGlobal();
    
    return {
      success: true,
      message: 'Inclusão registrada com sucesso',
      data: {
        item,
        quantidadeIncluida: quantidade,
        estoqueAnterior: estoqueAtual,
        estoqueAtual: novoEstoque
      }
    };
  } catch (error) {
    console.error('Erro ao registrar inclusão:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// CONTADOR GLOBAL E BADGE
// ============================================

async function obterContadorGlobal() {
  const sheets = await getSheet();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'CONTROLE!B1'
  });
  const valor = parseInt(res.data.values?.[0]?.[0] || '0');
  return valor;
}

async function incrementarContadorGlobal() {
  const sheets = await getSheet();
  const atual = await obterContadorGlobal();
  const novo = atual + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'CONTROLE!B1',
    valueInputOption: 'RAW',
    resource: { values: [[novo]] }
  });
  return novo;
}

async function obterUltimoContadorPorNome(nome) {
  const sheets = await getSheet();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'TECNICOS'
  });
  const rows = res.data.values || [];
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === nome) {
      const ultimo = parseInt(rows[i][4] || '0');
      return ultimo;
    }
  }
  console.warn(`⚠️ Nome "${nome}" não encontrado na planilha TECNICOS`);
  return 0;
}

async function atualizarUltimoContadorPorNome(nome, novoValor) {
  const sheets = await getSheet();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'TECNICOS'
  });
  const rows = res.data.values || [];
  let linha = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === nome) {
      linha = i + 1;
      break;
    }
  }
  if (linha !== -1) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `TECNICOS!E${linha}`,
      valueInputOption: 'RAW',
      resource: { values: [[novoValor]] }
    });
  } else {
    console.error(`❌ Nome "${nome}" não encontrado para atualização`);
  }
}

async function obterBadge(nome) {
  const global = await obterContadorGlobal();
  const ultimo = await obterUltimoContadorPorNome(nome);
  const badge = Math.max(0, global - ultimo);
  return { badge, global };
}

// ============================================
// TÉCNICOS
// ============================================

async function getTecnicos() {
  try {
    const sheets = await getSheet();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'TECNICOS'
    });
    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return { success: false, error: 'Aba "TECNICOS" não encontrada ou vazia' };
    }
    const tecnicos = rows.slice(1)
      .filter(row => row[2] !== 'NÃO')
      .map(row => {
        let perfil = 'tecnico';
        const perfilRaw = row[3] ? String(row[3]).trim().toLowerCase() : '';
        if (perfilRaw === 'adm' || perfilRaw === 'gerente' || perfilRaw === 'admin') {
          perfil = 'gerente';
        }
        return {
          pin: String(row[0]).trim(),
          nome: row[1],
          ativo: row[2] === 'SIM',
          perfil: perfil
        };
      });
    if (tecnicos.length === 0) {
      return { success: false, error: 'Nenhum técnico ativo encontrado' };
    }
    return { success: true, data: tecnicos };
  } catch (error) {
    console.error('Erro ao buscar técnicos:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// MOVIMENTAÇÕES GLOBAIS COM CACHE
// ============================================

async function getMovimentacoesGerais() {
  if (cacheMovimentacoes && (Date.now() - cacheTimestamp) < CACHE_TTL) {
    console.log('✅ Usando cache de movimentações gerais');
    return { success: true, data: cacheMovimentacoes };
  }
  try {
    const sheets = await getSheet();
    const retiradasRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'LOG_RETIRADAS'
    });
    const retiradas = (retiradasRes.data.values || []).slice(1).map(row => ({
      tipo: 'retirada',
      data: row[0],
      categoria: row[1],
      item: row[2],
      quantidade: row[3],
      unidade: row[4],
      patrimonio: row[5],
      tecnico: row[6],
      observacao: row[7],
      estoqueAnterior: row[8],
      estoqueNovo: row[9]
    }));
    const inclusoesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'LOG_INCLUIDOS'
    });
    const inclusoes = (inclusoesRes.data.values || []).slice(1).map(row => ({
      tipo: 'inclusao',
      data: row[0],
      categoria: row[1],
      item: row[2],
      quantidade: row[3],
      unidade: row[4],
      patrimonio: row[5],
      observacao: row[6],
      tecnico: row[7],
      estoqueAnterior: row[8],
      estoqueNovo: row[9]
    }));
    const todas = [...retiradas, ...inclusoes];
    todas.sort((a, b) => new Date(b.data) - new Date(a.data));
    const dados = todas.slice(0, 100);
    cacheMovimentacoes = dados;
    cacheTimestamp = Date.now();
    return { success: true, data: dados };
  } catch (error) {
    console.error('Erro ao buscar movimentações gerais:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// FUNÇÕES PARA EQUIPAMENTOS (RETIRADA COM TÉCNICO E DEVOLUÇÃO)
// ============================================

async function getOrCreateLogSheet(sheetName, headers) {
  const sheets = await getSheet();
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    includeGridData: false
  });
  const sheetExists = spreadsheet.data.sheets.some(
    sheet => sheet.properties.title === sheetName
  );
  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          addSheet: { properties: { title: sheetName } }
        }]
      }
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1`,
      valueInputOption: 'RAW',
      resource: { values: [headers] }
    });
  }
  return sheets;
}

async function adicionarEquipamentoComTecnico(itemNome, patrimonio, tecnico, observacao, destinoValor) {
  const sheets = await getSheet();
  const sheetName = 'EQUIPAMENTOS_COM_TECNICOS';
  
  // Verificar/criar a aba
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    includeGridData: false
  });
  const sheetExists = spreadsheet.data.sheets.some(
    sheet => sheet.properties.title === sheetName
  );
  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          addSheet: { properties: { title: sheetName } }
        }]
      }
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:H1`,
      valueInputOption: 'RAW',
      resource: {
        values: [['Timestamp', 'Item', 'Patrimônio', 'Técnico', 'Destino', 'Data Saída', 'Observação', 'Devolvido']]
      }
    });
  }
  
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const dataSaida = timestamp;
  const devolvido = 'NÃO';
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}`,
    valueInputOption: 'RAW',
    resource: {
      values: [[
        timestamp,
        itemNome,
        patrimonio,
        tecnico,
        destinoValor,
        dataSaida,
        observacao,
        devolvido
      ]]
    }
  });
}

async function getEquipamentosComTecnico(tecnico) {
  const sheets = await getSheet();
  const sheetName = 'EQUIPAMENTOS_COM_TECNICOS';
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName
    });
    const rows = res.data.values || [];
    if (rows.length <= 1) return [];

    const pendentes = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const tecnicoNaPlanilha = row[3] ? String(row[3]).trim() : '';
      const devolvido = row[7] ? String(row[7]).trim() : '';
      if (tecnicoNaPlanilha === tecnico && devolvido !== 'SIM') {
        pendentes.push({
          linhaIndex: i + 1,
          timestamp: row[0],
          item: row[1],
          patrimonio: row[2],
          tecnico: row[3],
          destino: row[4],
          dataSaida: row[5],
          observacao: row[6],
          devolvido: row[7]
        });
      }
    }
    return { success: true, data: pendentes };
  } catch (err) {
    console.error('Erro ao buscar equipamentos do técnico:', err);
    return [];
  }
}

async function getEquipamentosGeral() {
  try {
    const sheets = await getSheet();
    const estoqueRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'CVS'
    });
    let estoqueRows = estoqueRes.data.values || [];
    estoqueRows = estoqueRows.filter(row => {
      const cat = row[0] ? String(row[0]).trim() : '';
      const item = row[1] ? String(row[1]).trim() : '';
      return cat !== '' && cat.toLowerCase() !== 'categoria' && item !== '';
    });
    const estoqueItems = estoqueRows.map(row => ({
      tipo: 'estoque',
      categoria: row[0] || '',
      item: row[1] || '',
      unidade: row[2] || 'un',
      quantidade: Number(row[3]) || 0,
      minimo: Number(row[4]) || 0,
      patrimonio: ''
    }));
    
    let equipamentosComTecnicos = [];
    try {
      const tecnicosRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'EQUIPAMENTOS_COM_TECNICOS'
      });
      const rows = tecnicosRes.data.values || [];
      if (rows.length > 1) {
        equipamentosComTecnicos = rows.slice(1)
          .filter(row => row[7] !== 'SIM')
          .map(row => ({
            tipo: 'com_tecnico',
            timestamp: row[0],
            item: row[1],
            patrimonio: row[2],
            tecnico: row[3],
            destino: row[4],
            dataSaida: row[5],
            observacao: row[6],
            devolvido: row[7]
          }));
      }
    } catch (err) {
    }
    
    return {
      success: true,
      data: {
        estoque: estoqueItems,
        comTecnicos: equipamentosComTecnicos
      }
    };
  } catch (error) {
    console.error('Erro ao buscar equipamentos gerais:', error);
    return { success: false, error: error.message };
  }
}

async function registrarDevolucao(data) {
  const { itemNome, quantidade, tecnico, observacao, patrimonio, linhaId } = data;
  const sheets = await getSheet();

  // 1. Marcar como devolvido na planilha de controle
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `EQUIPAMENTOS_COM_TECNICOS!H${linhaId}`,
    valueInputOption: 'RAW',
    resource: { values: [['SIM']] }
  });

  // 2. Atualizar o estoque na planilha CVS e obter a categoria
  const estoqueRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'CVS'
  });
  const rows = estoqueRes.data.values || [];
  let linhaItem = -1;
  let novaQuantidade = 0;
  let quantidadeAtual = 0;
  let categoria = '';

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === itemNome) {
      linhaItem = i + 1;
      categoria = rows[i][0] || '';
      quantidadeAtual = Number(rows[i][3]) || 0;
      novaQuantidade = quantidadeAtual + quantidade;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `CVS!D${linhaItem}`,
        valueInputOption: 'RAW',
        resource: { values: [[novaQuantidade]] }
      });
      break;
    }
  }

  if (linhaItem === -1) {
    console.warn(`Item "${itemNome}" não encontrado na planilha CVS. Estoque não atualizado.`);
  }

  // 3. Registrar no log de inclusões
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'LOG_INCLUIDOS',
    valueInputOption: 'RAW',
    resource: {
      values: [[
        timestamp, categoria, itemNome, quantidade, 'un',
        patrimonio, observacao, tecnico, quantidadeAtual, novaQuantidade
      ]]
    }
  });

  return { success: true, message: 'Equipamento devolvido com sucesso' };
}

async function getOrCreateSolicitacoesSheet() {
  const sheets = await getSheet();
  const sheetName = 'SOLICITACOES_COMPRA';
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    includeGridData: false
  });
  const sheetExists = spreadsheet.data.sheets.some(s => s.properties.title === sheetName);
  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{ addSheet: { properties: { title: sheetName } } }]
      }
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:E1`,
      valueInputOption: 'RAW',
      resource: { values: [['Timestamp', 'Técnico', 'Itens', 'Observação', 'Status']] }
    });
  }
}

async function registrarSolicitacao(data) {
  const { tecnico, itens, observacao } = data;
  const sheets = await getSheet();
  const sheetName = 'SOLICITACOES_COMPRA';
  
  // Garantir que a aba existe
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    includeGridData: false
  });
  const sheetExists = spreadsheet.data.sheets.some(s => s.properties.title === sheetName);
  if (!sheetExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{ addSheet: { properties: { title: sheetName } } }]
      }
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:E1`,
      valueInputOption: 'RAW',
      resource: { values: [['Timestamp', 'Técnico', 'Itens', 'Observação', 'Status']] }
    });
  }
  
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const status = 'Pendente';
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
    valueInputOption: 'RAW',
    resource: { values: [[timestamp, tecnico, itens, observacao, status]] }
  });
  return { success: true, message: 'Solicitação registrada com sucesso' };
}

async function registrarDevolucaoMultipla(data) {
  const { equipamentos, observacao, tecnico } = data;
  const sheets = await getSheet();
  let devolvidos = 0;
  let erros = [];

  for (const eq of equipamentos) {
    try {
      // 1. Marcar como devolvido na planilha de controle
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `EQUIPAMENTOS_COM_TECNICOS!H${eq.linhaId}`,
        valueInputOption: 'RAW',
        resource: { values: [['SIM']] }
      });

      // 2. Atualizar o estoque na planilha CVS
      const estoqueRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'CVS'
      });
      const rows = estoqueRes.data.values || [];
      let linhaItem = -1;
      let categoria = '';
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === eq.itemNome) {
          linhaItem = i + 1;
          categoria = rows[i][0] || '';
          const quantidadeAtual = Number(rows[i][3]) || 0;
          const novaQuantidade = quantidadeAtual + 1;
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `CVS!D${linhaItem}`,
            valueInputOption: 'RAW',
            resource: { values: [[novaQuantidade]] }
          });
          break;
        }
      }

      // 3. Registrar no log de inclusões (opcional)
      const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'LOG_INCLUIDOS',
        valueInputOption: 'RAW',
        resource: {
          values: [[
            timestamp, categoria, eq.itemNome, 1, 'un',
            eq.patrimonio, observacao, tecnico, 0, 0
          ]]
        }
      });
      devolvidos++;
    } catch (err) {
      erros.push(eq.itemNome);
      console.error(`Erro ao devolver ${eq.itemNome}:`, err);
    }
  }

  if (erros.length > 0) {
    return { success: false, error: `Falha ao devolver: ${erros.join(', ')}` };
  }
  return { success: true, devolvidos };
}

module.exports = {
  getEstoque,
  registrarRetirada,
  registrarInclusao,
  getTecnicos,
  getMovimentacoesGerais,
  obterBadge,
  atualizarUltimoContadorPorNome,
  getEquipamentosGeral,
  getEquipamentosComTecnico,
  registrarDevolucao,
  registrarDevolucaoMultipla,
  registrarSolicitacao
};