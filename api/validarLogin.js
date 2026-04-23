// api/validarLogin.js
const { getTecnicos } = require('./sheets.js');

export default async function handler(req, res) {
  // Lista de origens permitidas (produção + desenvolvimento local)
  const allowedOrigins = [
    'https://totallinks-estoque.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  const origin = req.headers.origin;

  // Verifica se a origem da requisição está na lista de permitidas
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  } else if (origin) {
    // Origem presente mas não autorizada -> bloqueia
    return res.status(403).json({ sucesso: false, mensagem: 'Origem não autorizada' });
  }
  // Se não houver header Origin (ex: requisição curl), permite (opcional)

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

    if (senha !== SENHA_CORRETA) {
      return res.status(401).json({ sucesso: false, mensagem: 'Senha ou PIN incorreto' });
    }

    const resultado = await getTecnicos();
    if (!resultado.success) {
      console.error('Erro ao buscar técnicos:', resultado.error);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro ao validar credenciais' });
    }

    const tecnico = resultado.data.find(t => t.pin === pin);
    if (!tecnico) {
      return res.status(401).json({ sucesso: false, mensagem: 'Senha ou PIN incorreto' });
    }

    return res.status(200).json({
      sucesso: true,
      tecnicoNome: tecnico.nome,
      perfil: tecnico.perfil || 'tecnico',
      pin: tecnico.pin
      
    });
  } catch (error) {
    console.error('Erro em validarLogin:', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor' });
  }
}