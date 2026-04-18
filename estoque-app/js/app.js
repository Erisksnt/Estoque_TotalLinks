// estoque-app/js/app.js

import { initLogin } from './login.js';
import { initInclusao, refreshCategoriasInclusao } from './inclusao.js';
import { initNavigation, mostrarTela, mostrarTelaPrincipal, voltarDaRetirada } from './navigation.js';
import { initSearch } from './search.js';
import { initRetirada, abrirRetirada } from './withdrawal.js';
import { initSyncButton } from './sync.js';
import { abrirCategoria, verTodosCriticos } from './categories.js';
import { tecnicoAtual } from './state.js';
import { carregarEstoque } from './cache.js';

// Exporta funções globais para os onclick do HTML
window.abrirCategoria = abrirCategoria;
window.verTodosCriticos = verTodosCriticos;
window.abrirRetirada = abrirRetirada;
window.voltarDaRetirada = voltarDaRetirada;
window.mostrarTelaPrincipal = mostrarTelaPrincipal;
window.mostrarTela = mostrarTela;

// Inicializar todos os módulos após o DOM carregar
document.addEventListener('DOMContentLoaded', async () => {
  initLogin();
  initNavigation();
  initSearch();
  initRetirada();
  initSyncButton();
  initInclusao();

  // Verifica se há um técnico logado na sessão
  if (tecnicoAtual) {
    // Restaura o nome do técnico na tela
    const nomeSpan = document.getElementById('tecnicoNome');
    if (nomeSpan) nomeSpan.textContent = tecnicoAtual;
    // Carrega o estoque e vai para a tela principal
    await carregarEstoque();
    mostrarTelaPrincipal();
  } else {
    // Mostra a tela de login (já escondida pelo CSS)
    mostrarTela('loginScreen');
  }

  // Evento BotaoIncluir (botão flutuante)
  const fab = document.getElementById('fabIncluir');
  if (fab) {
    fab.addEventListener('click', () => {
      refreshCategoriasInclusao();
      mostrarTela('inclusaoScreen');
    });
  }
});