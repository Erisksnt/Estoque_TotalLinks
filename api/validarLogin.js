// api/validarLogin.js
export default async function handler(req, res) {
  // Habilitar CORS para desenvolvimento (opcional)
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

    // 2. Obter URL do Google Apps Script
    const GS_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (!GS_URL) {
      console.error('GOOGLE_APPS_SCRIPT_URL não configurada');
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno: URL do Apps Script ausente' });
    }

    // 3. Chamar o Apps Script para obter a lista de técnicos
    const urlTecnicos = `${GS_URL}?action=getTecnicos`;
    console.log(`Chamando Apps Script: ${urlTecnicos}`);

    const response = await fetch(urlTecnicos);
    if (!response.ok) {
      console.error(`Erro HTTP ao chamar Apps Script: ${response.status}`);
      return res.status(502).json({ sucesso: false, mensagem: 'Erro ao comunicar com servidor de autenticação' });
    }

    const data = await response.json();
    console.log('Resposta do Apps Script:', data);

    if (!data.success) {
      console.error('Apps Script retornou sucesso=false:', data.error);
      return res.status(502).json({ sucesso: false, mensagem: 'Erro na autenticação dos técnicos' });
    }

    // 4. Procurar técnico pelo PIN
    const tecnico = data.data.find(t => t.pin === pin);
    if (!tecnico) {
      return res.status(401).json({ sucesso: false, mensagem: 'PIN inválido' });
    }

    // 5. Login bem-sucedido
    return res.status(200).json({
      sucesso: true,
      tecnicoNome: tecnico.nome
    });

  } catch (error) {
    console.error('Erro não tratado em validarLogin:', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor' });
  }
}