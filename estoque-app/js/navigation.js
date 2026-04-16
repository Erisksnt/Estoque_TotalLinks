// estoque-app/js/navigation.js (versão corrigida)

import { telaAnterior, setTelaAnterior } from './state.js';
import { carregarRecentes } from './recentes.js';
import { verTodosCriticos } from './categories.js';
import { carregarMetricas, carregarCategoriasRapidas, carregarListaCritica } from './ui-helpers.js';

export function mostrarTelaPrincipal() {
  const mainScreen = document.getElementById('mainScreen');
  const loginScreen = document.getElementById('loginScreen');
  const itemsScreen = document.getElementById('itemsScreen');
  const withdrawScreen = document.getElementById('withdrawScreen');
  const searchScreen = document.getElementById('searchScreen');
  const recentesScreen = document.getElementById('recentesScreen');
  const criticosScreen = document.getElementById('criticosScreen');
  
  if (mainScreen) mainScreen.classList.add('active');
  if (loginScreen) loginScreen.classList.remove('active');
  if (itemsScreen) itemsScreen.classList.remove('active');
  if (withdrawScreen) withdrawScreen.classList.remove('active');
  if (searchScreen) searchScreen.classList.remove('active');
  if (recentesScreen) recentesScreen.classList.remove('active');
  if (criticosScreen) criticosScreen.classList.remove('active');
  
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
  const homeNav = document.querySelector('.nav-item[data-nav="home"]');
  if (homeNav) homeNav.classList.add('active');
  
  // ← ATUALIZA OS DADOS DA TELA PRINCIPAL (como no original)
  carregarMetricas();
  carregarCategoriasRapidas();
  carregarListaCritica();
}

export function mostrarTela(telaId) {
  const telas = ['mainScreen', 'loginScreen', 'itemsScreen', 'withdrawScreen', 'searchScreen', 'recentesScreen', 'criticosScreen'];
  telas.forEach(tela => {
    const el = document.getElementById(tela);
    if (el) el.classList.remove('active');
  });
  const telaAtiva = document.getElementById(telaId);
  if (telaAtiva) telaAtiva.classList.add('active');
}

export function voltarDaRetirada() {
  if (telaAnterior && telaAnterior !== 'withdrawScreen') {
    mostrarTela(telaAnterior);
    if (telaAnterior === 'searchScreen') {
      const termo = document.getElementById('globalSearchInput')?.value;
      if (termo && termo.length >= 2) {
        const event = new Event('input');
        document.getElementById('globalSearchInput').dispatchEvent(event);
      }
    }
  } else {
    mostrarTela('mainScreen');
  }
}

export function initNavigation() {
  // Navegação inferior
  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.addEventListener('click', () => {
      const tela = nav.dataset.nav;
      if (tela === 'home') {
        mostrarTelaPrincipal();
      } else if (tela === 'search') {
        mostrarTela('searchScreen');
      } else if (tela === 'recentes') {
        carregarRecentes();
        mostrarTela('recentesScreen');
      } else if (tela === 'criticos') {
        verTodosCriticos();
      }
    });
  });

  // Ajusta o botão voltar na tela de retirada (onclick)
  const backBtn = document.querySelector('#withdrawScreen .back-btn');
  if (backBtn) {
    backBtn.setAttribute('onclick', 'voltarDaRetirada()');
  }
}