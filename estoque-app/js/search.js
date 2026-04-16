// estoque-app/js/search.js

import { dadosEstoque } from './state.js';
import { abrirRetirada } from './withdrawal.js';
import { carregarCategoriasRapidas } from './ui-helpers.js';

// Inicializa os eventos de busca (busca rápida na tela principal e busca global)
export function initSearch() {
  // Busca rápida (campo na tela principal)
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const termo = e.target.value.toLowerCase();
      if (termo.length < 2) {
        carregarCategoriasRapidas();
        return;
      }
      
      const resultados = dadosEstoque.filter(item => 
        item[1].toLowerCase().includes(termo)
      );
      
      const container = document.getElementById('quickCategories');
      if (!container) return;
      
      if (resultados.length === 0) {
        container.innerHTML = '<div class="quick-card" style="grid-column:span 4">Nenhum item encontrado</div>';
      } else {
        container.innerHTML = resultados.map(item => {
          const nomeEscapado = item[1].replace(/'/g, "\\'");
          return `
            <div class="quick-card" onclick="abrirRetirada('${nomeEscapado}')">
              <div class="quick-label">${item[1].substring(0, 20)}</div>
            </div>
          `;
        }).join('');
      }
    });
  }

  // Busca global (tela de busca)
  const globalSearchInput = document.getElementById('globalSearchInput');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
      const termo = e.target.value.toLowerCase();
      const searchResults = document.getElementById('searchResults');
      if (!searchResults) return;
      
      if (termo.length < 2) {
        searchResults.innerHTML = '';
        return;
      }
      
      const resultados = dadosEstoque.filter(item => 
        item[1].toLowerCase().includes(termo)
      );
      
      if (resultados.length === 0) {
        searchResults.innerHTML = '<div style="text-align:center;padding:40px;color:#718096;">Nenhum item encontrado</div>';
      } else {
        searchResults.innerHTML = resultados.map(item => {
          const nomeEscapado = item[1].replace(/'/g, "\\'");
          return `
            <div class="search-result-item" onclick="abrirRetirada('${nomeEscapado}')">
              <div>
                <strong>${item[1]}</strong>
                <div style="font-size:12px;color:#718096;">Estoque: ${item[3]} ${item[2]}</div>
              </div>
              <div>→</div>
            </div>
          `;
        }).join('');
      }
    });
  }
}