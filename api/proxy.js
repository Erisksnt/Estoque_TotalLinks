// api/proxy.js
const { getEstoque, registrarRetirada, registrarInclusao, getTecnicos } = require('./sheets.js');

module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Processar GET
  if (req.method === 'GET') {
    const { action } = req.query;
    
    console.log(`📥 GET request: action=${action}`);
    
    try {
      let result;
      if (action === 'getEstoque') {
        result = await getEstoque();
      } else if (action === 'getTecnicos') {
        result = await getTecnicos();
      } else {
        result = { success: false, error: 'Ação não reconhecida' };
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro no handler GET:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // Processar POST
  if (req.method === 'POST') {
    const data = req.body;
    
    console.log(`📥 POST request: action=${data.action}`);
    
    try {
      let result;
      if (data.action === 'registrarRetirada') {
        result = await registrarRetirada(data);
      } else if (data.action === 'registrarInclusao') {
        result = await registrarInclusao(data);
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