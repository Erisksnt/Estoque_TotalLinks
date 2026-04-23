// api/proxy.js
const {
  getEstoque,
  registrarRetirada,
  registrarInclusao,
  getTecnicos,
  getMovimentacoesGerais,
  obterBadge,
  atualizarUltimoContadorPorNome
} = require('./sheets.js');

module.exports = async function handler(req, res) {
  // Lista de origens permitidas
  const allowedOrigins = [
    'https://totallinks-estoque.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  } else if (origin) {
    return res.status(403).json({ error: 'Origem não autorizada' });
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET
  if (req.method === 'GET') {
    const { action, nome } = req.query;
    
    try {
      let result;
      if (action === 'getEstoque') {
        result = await getEstoque();
      } else if (action === 'getTecnicos') {
        result = await getTecnicos();
      } else if (action === 'getMovimentacoesGerais') {
        result = await getMovimentacoesGerais();
      } else if (action === 'obterBadge') {
        if (!nome) {
          return res.status(400).json({ success: false, error: 'Nome não fornecido' });
        }
        result = await obterBadge(nome);
      } else {
        result = { success: false, error: 'Ação não reconhecida' };
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro no handler GET:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // POST
  if (req.method === 'POST') {
    const data = req.body;
    
    try {
      let result;
      if (data.action === 'registrarRetirada') {
        result = await registrarRetirada(data);
      } else if (data.action === 'registrarInclusao') {
        result = await registrarInclusao(data);
      } else if (data.action === 'atualizarVisualizacao') {
        const { nome, contadorGlobal } = data;
        if (!nome) {
          return res.status(400).json({ success: false, error: 'Nome não fornecido' });
        }
        await atualizarUltimoContadorPorNome(nome, contadorGlobal);
        result = { success: true, message: 'Visualização atualizada' };
      } else {
        result = { success: false, error: 'Ação não reconhecida' };
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro no handler POST:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  return res.status(405).json({ success: false, error: 'Método não permitido' });
};