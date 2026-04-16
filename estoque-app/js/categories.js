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
    
    // Escapa aspas simples para não quebrar o onclick
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
  const criticos = dadosEstoque.filter(item => {
    const atual = Number(item[3]) || 0;
    const minimo = Number(item[4]) || 0;
    return atual <= minimo;
  });
  
  const container = document.getElementById('criticosList');
  if (!container) return;
  
  if (criticos.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#718096;">Nenhum item crítico</div>';
    return;
  }
  
  container.innerHTML = criticos.map(item => {
    const nomeItemEscapado = item[1].replace(/'/g, "\\'");
    return `
      <div class="critico-item" onclick="abrirRetirada('${nomeItemEscapado}')">
        <div>
          <strong>${item[1]}</strong>
          <div style="font-size:12px;color:#718096;">Estoque: ${item[3]} / Mínimo: ${item[4]} ${item[2]}</div>
        </div>
        <div>→</div>
      </div>
    `;
  }).join('');
  
  mostrarTela('criticosScreen');
}