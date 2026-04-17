// estoque-app/js/app.js

import { initLogin } from './login.js';
import { initInclusao, refreshCategoriasInclusao } from './inclusao.js';
import { initNavigation, mostrarTela, mostrarTelaPrincipal, voltarDaRetirada } from './navigation.js';
import { initSearch } from './search.js';
import { initRetirada, abrirRetirada } from './withdrawal.js';
import { initSyncButton } from './sync.js';
import { abrirCategoria, verTodosCriticos } from './categories.js';

// Exporta funções globais para os onclick do HTML
window.abrirCategoria = abrirCategoria;
window.verTodosCriticos = verTodosCriticos;
window.abrirRetirada = abrirRetirada;
window.voltarDaRetirada = voltarDaRetirada;
window.mostrarTelaPrincipal = mostrarTelaPrincipal;
window.mostrarTela = mostrarTela;

// Inicializar todos os módulos após o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initNavigation();
  initSearch();
  initRetirada();
  initSyncButton();
  initInclusao();

  // Evento BotaoIncluir (botão flutuante)
  const fab = document.getElementById('fabIncluir');
  if (fab) {
    fab.addEventListener('click', () => {
      // Atualiza as categorias no select (caso tenha havido sincronização)
      refreshCategoriasInclusao();
      // Abre a tela de inclusão
      mostrarTela('inclusaoScreen');
    });
  }
});