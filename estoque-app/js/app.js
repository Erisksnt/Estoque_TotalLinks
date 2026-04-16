// estoque-app/js/app.js (versão final corrigida)

import { initLogin } from './login.js';
import { initNavigation, mostrarTela, mostrarTelaPrincipal, voltarDaRetirada } from './navigation.js';
import { initSearch } from './search.js';
import { initRetirada, abrirRetirada } from './withdrawal.js';
import { initSyncButton } from './sync.js';
import { abrirCategoria, verTodosCriticos } from './categories.js';

// Exporta funções globais para os onclick do HTML
window.abrirCategoria = abrirCategoria;
window.verTodosCriticos = verTodosCriticos;
window.abrirRetirada = abrirRetirada;
window.voltarDaRetirada = voltarDaRetirada;  // vem do navigation.js
window.mostrarTelaPrincipal = mostrarTelaPrincipal;
window.mostrarTela = mostrarTela;

// Inicializar todos os módulos após o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initNavigation();
  initSearch();
  initRetirada();
  initSyncButton();
});