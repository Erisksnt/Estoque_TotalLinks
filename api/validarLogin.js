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

    if (!senha || !pin) {
      return res.status(400).json({ sucesso: false, mensagem: 'Senha e PIN são obrigatórios' });
    }

    const SENHA_CORRETA = process.env.SENHA_EQUIPE;
    if (!SENHA_CORRETA) {
      console.error('SENHA_EQUIPE não configurada');
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno de configuração' });
    }

    // Verifica senha da equipe
    if (senha !== SENHA_CORRETA) {
      return res.status(401).json({ sucesso: false, mensagem: 'Senha ou PIN incorreto' });
    }

    // Buscar técnicos via Node.js
    const resultado = await getTecnicos();
    
    if (!resultado.success) {
      console.error('Erro ao buscar técnicos:', resultado.error);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro ao validar credenciais' });
    }

    // Verifica PIN do técnico
    const tecnico = resultado.data.find(t => t.pin === pin);
    if (!tecnico) {
      return res.status(401).json({ sucesso: false, mensagem: 'Senha ou PIN incorreto' });
    }

    // Login bem-sucedido - retorna nome e perfil
    return res.status(200).json({
      sucesso: true,
      tecnicoNome: tecnico.nome,
      perfil: tecnico.perfil || 'tecnico'
    });

  } catch (error) {
    console.error('Erro em validarLogin:', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor' });
  }
}