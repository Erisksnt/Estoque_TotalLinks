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
    const headers = rows[0];
    const items = rows.slice(1);
    return { success: true, data: { headers, items } };
  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
    return { success: false, error: error.message };
  }
}

async function registrarRetirada(data) {
  try {
    const { itemNome, quantidade, tecnico, observacao, patrimonios } = data;
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
    
    const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const logRow = [
      timestamp, categoria, itemNome, quantidade, unidade,
      (patrimonios || []).join(', '), tecnico, observacao || '',
      estoqueAtual, novoEstoque
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'LOG_RETIRADAS',
      valueInputOption: 'RAW',
      resource: { values: [logRow] }
    });
    
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

// Busca o último contador do técnico pelo NOME
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

// Atualiza o último contador do técnico pelo NOME
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

// Função pública para obter badge usando NOME
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

module.exports = {
  getEstoque,
  registrarRetirada,
  registrarInclusao,
  getTecnicos,
  getMovimentacoesGerais,
  obterBadge,
  atualizarUltimoContadorPorNome 
};