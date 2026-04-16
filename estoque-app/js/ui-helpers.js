// estoque-app/js/ui-helpers.js

import { dadosEstoque, categoriasLista, setCategoriasLista } from './state.js';

// Função auxiliar local para escapar aspas simples (evita erros no onclick)
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'");
}

export function processarCategorias() {
  const cats = new Set();
  dadosEstoque.forEach(item => {
    if (item[0]) cats.add(item[0]);
  });
  const lista = Array.from(cats).sort();
  setCategoriasLista(lista);
  const totalCategorias = document.getElementById('totalCategorias');
  if (totalCategorias) totalCategorias.textContent = lista.length;
}

export function carregarMetricas() {
  const criticos = dadosEstoque.filter(item => {
    const atual = Number(item[3]) || 0;
    const minimo = Number(item[4]) || 0;
    return atual <= minimo && atual > 0;
  });
  const totalCriticos = document.getElementById('totalCriticos');
  if (totalCriticos) totalCriticos.textContent = criticos.length;
}

export function atualizarStatusSync(online) {
  const dot = document.querySelector('.sync-dot');
  const text = document.querySelector('.sync-text');
  const badge = document.getElementById('syncBadge');
  const lastSyncSpan = document.getElementById('lastSync');
  
  if (online) {
    if (dot) {
      dot.classList.remove('offline');
      dot.classList.add('online');
    }
    if (text) text.textContent = 'Online';
    if (badge) badge.textContent = 'Online';
    if (lastSyncSpan) lastSyncSpan.textContent = new Date().toLocaleString();
  } else {
    if (dot) {
      dot.classList.remove('online');
      dot.classList.add('offline');
    }
    if (text) text.textContent = 'Offline';
    if (badge) badge.textContent = 'Offline';
  }
}

export function carregarCategoriasRapidas() {
  const principais = categoriasLista.slice(0, 8);
  const container = document.getElementById('quickCategories');
  if (!container) return;
  
  container.innerHTML = principais.map(cat => `
    <div class="quick-card" onclick="abrirCategoria('${escapeHtml(cat)}')">
      <div class="quick-label">${cat.substring(0, 14)}</div>
    </div>
  `).join('');
}

export function carregarListaCritica() {
  const criticos = dadosEstoque.filter(item => {
    const atual = Number(item[3]) || 0;
    const minimo = Number(item[4]) || 0;
    return atual <= minimo;
  }).slice(0, 5);
  
  const container = document.getElementById('criticalList');
  if (!container) return;
  
  if (criticos.length === 0) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:#718096;">Nenhum item crítico</div>';
    return;
  }
  
  container.innerHTML = criticos.map(item => {
    const atual = Number(item[3]) || 0;
    const minimo = Number(item[4]) || 0;
    const isZerado = atual === 0;
    return `
      <div class="critical-item ${isZerado ? '' : 'warning'}" onclick="abrirRetirada('${escapeHtml(item[1])}')">
        <div>
          <div class="critical-name">${item[1]}</div>
          <div class="critical-stock">Estoque: ${atual} / Mínimo: ${minimo} ${item[2]}</div>
        </div>
        <div class="critical-value ${isZerado ? 'danger' : ''}">${isZerado ? 'ESGOTADO' : Math.round((atual/minimo)*100) + '%'}</div>
      </div>
    `;
  }).join('');
}