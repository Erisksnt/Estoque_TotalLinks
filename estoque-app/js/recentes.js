// estoque-app/js/recentes.js

import { movimentacoesRecentes } from './state.js';

// Carrega e exibe a lista de movimentações recentes (retiradas e inclusões)
export function carregarRecentes() {
  const container = document.getElementById('recentesList');
  if (!container) return;
  
  if (movimentacoesRecentes.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#718096;">Nenhuma movimentação recente</div>';
    return;
  }
  
  container.innerHTML = movimentacoesRecentes.map(m => {
    const tipoIcon = m.tipo === 'retirada' ? '-' : '+';
    const tipoTexto = m.tipo === 'retirada' ? 'Retirada' : 'Inclusão';
    const observacaoHtml = m.observacao ? `<div style="font-size:11px; color:#718096; margin-top:4px;"> Obs: ${m.observacao}</div>` : '';

    return `
      <div class="recente-item">
        <div>
          <strong>${m.item}</strong>
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