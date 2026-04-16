// estoque-app/js/recentes.js

import { retiradasRecentes } from './state.js';

// Carrega e exibe a lista de retiradas recentes na tela correspondente
export function carregarRecentes() {
  const container = document.getElementById('recentesList');
  if (!container) return;
  
  if (retiradasRecentes.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#718096;">Nenhuma retirada recente</div>';
    return;
  }
  
  container.innerHTML = retiradasRecentes.map(r => `
    <div class="recente-item">
      <div>
        <strong>${r.item}</strong>
        <div style="font-size:12px;color:#718096;">${r.quantidade} un • ${r.tecnico}</div>
      </div>
      <div style="font-size:12px;color:#718096;">${r.data}</div>
    </div>
  `).join('');
}