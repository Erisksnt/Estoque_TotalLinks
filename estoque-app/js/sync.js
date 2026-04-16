// estoque-app/js/sync.js

import { carregarEstoque } from './cache.js';

// Inicializa o botão de sincronização manual
export function initSyncButton() {
  const syncNowBtn = document.getElementById('syncNowBtn');
  if (syncNowBtn) {
    syncNowBtn.addEventListener('click', async () => {
      // Altera texto do botão para indicar carregamento
      const textoOriginal = syncNowBtn.textContent;
      syncNowBtn.textContent = 'Sincronizando...';
      syncNowBtn.disabled = true;

      await carregarEstoque(true); // força refresh ignorando cache

      // Restaura o botão
      syncNowBtn.textContent = textoOriginal;
      syncNowBtn.disabled = false;
    });
  }
}