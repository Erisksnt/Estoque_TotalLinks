// api/proxy.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // A URL do Google Apps Script virá da variável de ambiente
  const GS_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!GS_URL) {
    return res.status(500).json({ error: 'URL do Apps Script não configurada' });
  }

  try {
    // Constrói a URL com os mesmos parâmetros que o frontend enviaria
    const targetUrl = new URL(GS_URL);
    // Copia os query params da requisição original
    Object.keys(req.query).forEach(key => {
      targetUrl.searchParams.append(key, req.query[key]);
    });

    // Se for POST, pega o body
    let fetchOptions = { method: req.method };
    if (req.method === 'POST') {
      fetchOptions.body = JSON.stringify(req.body);
      fetchOptions.headers = { 'Content-Type': 'application/json' };
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);
    const data = await response.text();

    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Erro ao comunicar com o Apps Script' });
  }
}