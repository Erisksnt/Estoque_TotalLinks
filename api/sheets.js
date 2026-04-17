// api/sheets.js
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Carregar as credenciais da Conta de Serviço
// Em produção, use variável de ambiente. Em desenvolvimento, use arquivo local.
let auth;

async function getAuth() {
  if (auth) return auth;
  
  try {
    let credentials;
    
    // Em produção (Vercel), usa variável de ambiente
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      console.log('✅ Usando credenciais da variável de ambiente');
    } else {
      // Desenvolvimento local - arquivo local
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

// Função para obter a planilha
async function getSheet() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

// ID da planilha (use variável de ambiente depois)
const SPREADSHEET_ID = '1FulzV2vHEAVCrmSg2jr5ozzXkqlI2cBhD0vqk4McjHY';

// Buscar todos os dados do estoque (planilha CVS)
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
    
    return {
      success: true,
      data: { headers, items }
    };
  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
    return { success: false, error: error.message };
  }
}

// Registrar retirada
async function registrarRetirada(data) {
  try {
    const { itemNome, quantidade, tecnico, observacao, patrimonios } = data;
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
    let itemData = null;
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === itemNome) {
        linhaItem = i + 1; // Linha no Google Sheets (1-indexed)
        estoqueAtual = Number(rows[i][3]) || 0;
        unidade = rows[i][2] || 'un';
        categoria = rows[i][0] || '';
        itemData = rows[i];
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
    
    // 2. Atualizar o estoque na planilha
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `CVS!D${linhaItem}`,
      valueInputOption: 'RAW',
      resource: { values: [[novoEstoque]] }
    });
    
    // 3. Registrar no log (LOG_RETIRADAS)
    const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const logRow = [
      timestamp,
      categoria,
      itemNome,
      quantidade,
      unidade,
      (patrimonios || []).join(', '),
      tecnico,
      observacao || '',
      estoqueAtual,
      novoEstoque
    ];
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'LOG_RETIRADAS',
      valueInputOption: 'RAW',
      resource: { values: [logRow] }
    });
    
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

// Registrar inclusão
async function registrarInclusao(data) {
  try {
    const { categoria, item, quantidade, patrimonio, observacao, tecnico } = data;
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
    
    // 2. Atualizar o estoque na planilha
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `CVS!D${linhaItem}`,
      valueInputOption: 'RAW',
      resource: { values: [[novoEstoque]] }
    });
    
    // 3. Registrar no log (LOG_INCLUIDOS)
    const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const logRow = [
      timestamp,
      categoriaExistente,
      item,
      quantidade,
      unidade,
      patrimonio || '',
      observacao || '',
      tecnico || 'Sistema',
      estoqueAtual,
      novoEstoque
    ];
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'LOG_INCLUIDOS',
      valueInputOption: 'RAW',
      resource: { values: [logRow] }
    });
    
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

// Buscar técnicos - SEM FALLBACK, apenas retorna erro
async function getTecnicos() {
  try {
    const sheets = await getSheet();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'TECNICOS'
    });
    
    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return { 
        success: false, 
        error: 'Aba "TECNICOS" não encontrada ou vazia na planilha. Verifique se a aba existe e tem cabeçalho.' 
      };
    }
    
    const tecnicos = rows.slice(1)
      .filter(row => row[2] !== 'NÃO')
      .map(row => ({
        pin: String(row[0]).trim(),
        nome: row[1],
        ativo: row[2] === 'SIM'
      }));
    
    if (tecnicos.length === 0) {
      return { 
        success: false, 
        error: 'Nenhum técnico ativo encontrado na aba TECNICOS' 
      };
    }
    
    return { success: true, data: tecnicos };
    
  } catch (error) {
    console.error('Erro ao buscar técnicos:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getEstoque,
  registrarRetirada,
  registrarInclusao,
  getTecnicos
};