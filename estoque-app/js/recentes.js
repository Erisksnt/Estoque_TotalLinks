// estoque-app/js/recentes.js

export async function carregarRecentes() {
  const container = document.getElementById('recentesList');
  if (!container) return;

  const CACHE_KEY = 'movimentacoesCache';
  const CACHE_EXPIRY = 60 * 1000; // 1 minuto

  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_KEY + '_time');
  let dados = null;

  if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime)) < CACHE_EXPIRY) {
    dados = JSON.parse(cachedData);
    console.log('✅ Usando cache de movimentações');
  } else {
    container.innerHTML = '<div style="text-align:center;padding:40px;">Carregando...</div>';
    try {
      const response = await fetch('/api/proxy?action=getMovimentacoesGerais');
      const resultado = await response.json();
      if (!resultado.success || !resultado.data.length) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#718096;">Nenhuma movimentação encontrada</div>';
        return;
      }
      dados = resultado.data;
      localStorage.setItem(CACHE_KEY, JSON.stringify(dados));
      localStorage.setItem(CACHE_KEY + '_time', Date.now().toString());
    } catch (error) {
      console.error('Erro ao carregar movimentações gerais:', error);
      container.innerHTML = '<div style="text-align:center;padding:40px;color:#718096;">Erro ao carregar histórico</div>';
      return;
    }
  }

  // Ordenar por data decrescente (mais recente primeiro)
  const parseData = (str) => {
    const [dataPart, horaPart] = str.split(', ');
    const [dia, mes, ano] = dataPart.split('/');
    return new Date(`${ano}-${mes}-${dia}T${horaPart}`);
  };
  dados.sort((a, b) => parseData(b.data) - parseData(a.data));

  container.innerHTML = dados.map(m => {
    const tipoIcon = m.tipo === 'retirada' ? '-' : '+';
    const tipoTexto = m.tipo === 'retirada' ? 'Retirada' : 'Inclusão';
    const patrimonioHtml = m.patrimonio ? ` (PAT: ${m.patrimonio})` : '';
    const observacaoHtml = m.observacao ? `<div style="font-size:11px; color:#718096; margin-top:4px;"> Obs: ${m.observacao}</div>` : '';
    return `
      <div class="recente-item">
        <div>
          <strong>${m.item}${patrimonioHtml}</strong>
          <div style="font-size:12px;color:#718096;">
            ${tipoIcon} ${tipoTexto} • ${m.quantidade} un • ${m.tecnico}
          </div>
          ${observacaoHtml}
        </div>
        <div style="font-size:12px;color:#718096;">${m.data}</div>
      </div>
    `;
  }).join('');
}