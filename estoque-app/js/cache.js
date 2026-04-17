// estoque-app/js/cache.js

import { setDadosEstoque } from './state.js';
import { CACHE_KEY, CACHE_EXPIRY } from './config.js';
import { apiGetEstoque } from './api.js';
import { processarCategorias, carregarMetricas, carregarCategoriasRapidas, carregarListaCritica, atualizarStatusSync } from './ui-helpers.js';

export async function carregarEstoque(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          console.log('✅ Usando cache do estoque');
          setDadosEstoque(data);
          processarCategorias();
          carregarMetricas();
          carregarCategoriasRapidas();
          carregarListaCritica();
          atualizarStatusSync(true);
          // Não há mais necessidade de atualizar datalist
          return true;
        }
      } catch (e) {
        console.warn('Erro ao ler cache:', e);
      }
    }
  }

  console.log('🔄 Buscando estoque da API...');
  const resultado = await apiGetEstoque();
  if (resultado.success) {
    setDadosEstoque(resultado.data.items);
    // Não há mais necessidade de atualizar datalist
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: resultado.data.items,
      timestamp: Date.now()
    }));
    processarCategorias();
    carregarMetricas();
    carregarCategoriasRapidas();
    carregarListaCritica();
    atualizarStatusSync(true);
    return true;
  } else {
    console.error('Erro ao carregar estoque:', resultado.error);
    atualizarStatusSync(false);
    return false;
  }
}