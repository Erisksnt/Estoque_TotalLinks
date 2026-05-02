// estoque-app/js/categories.js

import { dadosEstoque, categoriaAtual, setCategoriaAtual } from './state.js';
import { mostrarTela } from './navigation.js';
import { abrirRetirada } from './withdrawal.js';

// Abre a tela de itens de uma categoria
export function abrirCategoria(categoria) {
  setCategoriaAtual(categoria);
  renderizarItensPorCategoria(categoria);
  mostrarTela('itemsScreen');
}

// Renderiza a lista de itens da categoria selecionada
export function renderizarItensPorCategoria(categoria) {
  const categoryTitle = document.getElementById('categoryTitle');
  if (categoryTitle) categoryTitle.textContent = categoria;
  
  const itens = dadosEstoque.filter(item => item[0] === categoria);
  const container = document.getElementById('itemsContainer');
  if (!container) return;
  
  container.innerHTML = itens.map(item => {
    const atual = Number(item[3]) || 0;
    const minimo = Number(item[4]) || 0;
    const status = atual <= minimo ? 'Crítico' : 'Normal';

    const nomeItemEscapado = item[1].replace(/'/g, "\\'");
    
    return `
      <div class="item-card" onclick="abrirRetirada('${nomeItemEscapado}')">
        <div>
          <div class="item-name">${item[1]}</div>
          <div class="item-stock-mini">Estoque: ${atual} / ${minimo} ${item[2]} • ${status}</div>
        </div>
        <div>→</div>
      </div>
    `;
  }).join('');
}

// Mostra a tela com todos os itens críticos (estoque <= mínimo)
export function verTodosCriticos() {
  // 1. Filtrar itens críticos
  let criticos = dadosEstoque.filter(item => {
    const atual = Number(item[3]) || 0;
    const minimo = Number(item[4]) || 0;
    return atual <= minimo;
  });
  
  // 2. Ordenar por criticidade (mais crítico primeiro)
  criticos.sort((a, b) => {
    const atualA = Number(a[3]) || 0;
    const minimoA = Number(a[4]) || 0;
    const atualB = Number(b[3]) || 0;
    const minimoB = Number(b[4]) || 0;
    
    // Para itens zerados (atual = 0), considerar como -1 (mais crítico)
    const ratioA = atualA === 0 ? -1 : atualA / minimoA;
    const ratioB = atualB === 0 ? -1 : atualB / minimoB;
    
    // Zerados vêm primeiro
    if (ratioA === -1 && ratioB !== -1) return -1;
    if (ratioA !== -1 && ratioB === -1) return 1;
    
    // Ordenar por ratio (menor primeiro = mais crítico)
    if (ratioA !== ratioB) {
      return ratioA - ratioB;
    }
    
    // Ordenar por nome
    return a[1].localeCompare(b[1]);
  });
  
  const container = document.getElementById('criticosList');
  if (!container) return;
  
  if (criticos.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#718096;">Nenhum item crítico</div>';
    return;
  }
  
  container.innerHTML = criticos.map(item => {
    const atual = Number(item[3]) || 0;
    const minimo = Number(item[4]) || 0;
    const isZerado = atual === 0;
    const isNoLimite = atual === minimo && atual > 0;
    const isAbaixo = atual < minimo && atual > 0;
    
    let statusTexto = '';
    let statusClass = '';
    
    if (isZerado) {
      statusTexto = 'ESGOTADO';
      statusClass = 'danger';
    } else if (isNoLimite) {
      statusTexto = 'ATENÇÃO';
      statusClass = 'warning-no-limite';
    } else if (isAbaixo) {
      const percentual = Math.round((1 - atual / minimo) * 100);
      statusTexto = `CRÍTICO`;
      statusClass = 'warning-critico';
    }
    
    const nomeItemEscapado = item[1].replace(/'/g, "\\'");
    return `
      <div class="critical-item ${statusClass}" onclick="abrirRetirada('${nomeItemEscapado}')">
        <div>
          <div class="critical-name">${item[1]}</div>
          <div class="critical-stock">Estoque: ${atual} / Mínimo: ${minimo} ${item[2]}</div>
        </div>
        <div class="critical-value ${statusClass}">${statusTexto}</div>
      </div>
    `;
  }).join('');
  
  mostrarTela('criticosScreen');
}