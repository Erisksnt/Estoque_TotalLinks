// api/validarLogin.js
const { getTecnicos } = require('./sheets.js');

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ sucesso: false, mensagem: 'Método não permitido' });
  }

  try {
    const { senha, pin } = req.body;

    // Validação básica de entrada
    if (!senha || !pin) {
      return res.status(400).json({ sucesso: false, mensagem: 'Senha e PIN são obrigatórios' });
    }

    // 1. Verificar senha da equipe
    const SENHA_CORRETA = process.env.SENHA_EQUIPE;
    if (!SENHA_CORRETA) {
      console.error('SENHA_EQUIPE não configurada no ambiente');
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno: configuração ausente' });
    }

    if (senha !== SENHA_CORRETA) {
      return res.status(401).json({ sucesso: false, mensagem: 'Senha da equipe inválida' });
    }

    // 2. Buscar técnicos usando o Node.js (não mais Apps Script)
    const resultado = await getTecnicos();
    
    if (!resultado.success) {
      console.error('Erro ao buscar técnicos:', resultado.error);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro ao validar técnicos' });
    }

    // 3. Procurar técnico pelo PIN
    const tecnico = resultado.data.find(t => t.pin === pin);
    if (!tecnico) {
      return res.status(401).json({ sucesso: false, mensagem: 'PIN inválido' });
    }

    // 4. Login bem-sucedido
    return res.status(200).json({
      sucesso: true,
      tecnicoNome: tecnico.nome
    });

  } catch (error) {
    console.error('Erro não tratado em validarLogin:', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor' });
  }
}