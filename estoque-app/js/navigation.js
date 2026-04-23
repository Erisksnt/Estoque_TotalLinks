// estoque-app/js/navigation.js

import { telaAnterior, setTelaAnterior, perfilAtual, marcarRecentesComoVistos, atualizarBadgeGlobal } from './state.js';
import { carregarRecentes } from './recentes.js';
import { verTodosCriticos } from './categories.js';
import { carregarMetricas, carregarCategoriasRapidas, carregarListaCritica } from './ui-helpers.js';

// Atualiza o ícone ativo do bottom navigation
function atualizarBottomNavActive(telaId) {
  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.classList.remove('active');
  });
  const mapa = {
    'mainScreen': 'home',
    'searchScreen': 'search',
    'recentesScreen': 'recentes',
    'criticosScreen': 'criticos'
  };
  const navTarget = mapa[telaId];
  if (navTarget) {
    const botao = document.querySelector(`.nav-item[data-nav="${navTarget}"]`);
    if (botao) botao.classList.add('active');
  }
}

function aplicarAdaptacaoPorPerfil() {
  const isGerente = perfilAtual === 'adm' || perfilAtual === 'gerente';
  const elementosGerente = [
    document.getElementById('totalCategorias'),
    document.getElementById('totalCriticos'),
    document.querySelector('.metrics-grid'),
    document.getElementById('criticalList')
  ];
  elementosGerente.forEach(el => {
    if (el) el.style.display = isGerente ? '' : 'none';
  });
  const sectionLink = document.querySelector('.section-header .section-link');
  if (sectionLink) sectionLink.style.display = isGerente ? '' : 'none';
  const syncCard = document.querySelector('.sync-card');
  if (syncCard) syncCard.style.marginTop = isGerente ? '0' : '20px';
  if (isGerente) {
    document.body.classList.add('gerente');
    document.body.classList.remove('tecnico');
  } else {
    document.body.classList.add('tecnico');
    document.body.classList.remove('gerente');
  }
  const navCritico = document.querySelector('.nav-item[data-nav="criticos"]');
  if (navCritico) navCritico.style.display = isGerente ? 'flex' : 'none';
}

export function atualizarNavegacao() {
  const navItems = document.querySelectorAll('.nav-item');
  const isGerente = perfilAtual === 'adm' || perfilAtual === 'gerente';
  navItems.forEach(nav => {
    const tela = nav.dataset.nav;
    if (tela === 'criticos') {
      nav.style.display = isGerente ? 'flex' : 'none';
    } else {
      nav.style.display = 'flex';
    }
    const newNav = nav.cloneNode(true);
    nav.parentNode.replaceChild(newNav, nav);
    newNav.addEventListener('click', async () => {
      const navTela = newNav.dataset.nav;
      if (navTela === 'home') {
        mostrarTelaPrincipal();
      } else if (navTela === 'search') {
        mostrarTela('searchScreen');
      } else if (navTela === 'recentes') {
        await carregarRecentes();
        mostrarTela('recentesScreen');
      } else if (navTela === 'criticos') {
        if (isGerente) verTodosCriticos();
      }
    });
  });
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav && perfilAtual !== null) {
    bottomNav.style.display = 'flex';
    bottomNav.style.visibility = 'visible';
  }
  aplicarAdaptacaoPorPerfil();
}

export function mostrarTelaPrincipal() {
  const mainScreen = document.getElementById('mainScreen');
  const loginScreen = document.getElementById('loginScreen');
  const itemsScreen = document.getElementById('itemsScreen');
  const withdrawScreen = document.getElementById('withdrawScreen');
  const searchScreen = document.getElementById('searchScreen');
  const recentesScreen = document.getElementById('recentesScreen');
  const criticosScreen = document.getElementById('criticosScreen');
  const inclusaoScreen = document.getElementById('inclusaoScreen');
  if (mainScreen) mainScreen.classList.add('active');
  if (loginScreen) loginScreen.classList.remove('active');
  if (itemsScreen) itemsScreen.classList.remove('active');
  if (withdrawScreen) withdrawScreen.classList.remove('active');
  if (searchScreen) searchScreen.classList.remove('active');
  if (recentesScreen) recentesScreen.classList.remove('active');
  if (criticosScreen) criticosScreen.classList.remove('active');
  if (inclusaoScreen) inclusaoScreen.classList.remove('active');
  atualizarBottomNavActive('mainScreen');
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) {
    bottomNav.style.display = 'flex';
    bottomNav.style.visibility = 'visible';
  }
  aplicarAdaptacaoPorPerfil();
  carregarMetricas();
  carregarCategoriasRapidas();
  carregarListaCritica();
  
  // Atualiza a navegação (eventos de clique) APÓS a tela estar carregada
  atualizarNavegacao();
}

export async function mostrarTela(telaId) {
  const telas = ['mainScreen', 'loginScreen', 'itemsScreen', 'withdrawScreen', 'searchScreen', 'recentesScreen', 'criticosScreen', 'inclusaoScreen'];
  telas.forEach(tela => {
    const el = document.getElementById(tela);
    if (el) el.classList.remove('active');
  });
  const telaAtiva = document.getElementById(telaId);
  if (telaAtiva) telaAtiva.classList.add('active');
  atualizarBottomNavActive(telaId);
  
  // Se for a tela de recentes, zera o badge imediatamente e depois atualiza o servidor
  if (telaId === 'recentesScreen') {
    // 1. Zera o badge instantaneamente (feedback visual)
    const badge = document.getElementById('badge-recentes');
    if (badge) badge.style.display = 'none';
    
    // 2. Envia a atualização ao backend em segundo plano (não espera)
    marcarRecentesComoVistos().catch(console.error);
  }
  
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) {
    if (telaId === 'loginScreen') {
      bottomNav.style.display = 'none';
    } else {
      bottomNav.style.display = 'flex';
      bottomNav.style.visibility = 'visible';
    }
  }
  if (telaId === 'loginScreen') {
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
      btnLogin.textContent = 'Acessar';
      btnLogin.disabled = false;
    }
    const senhaInput = document.getElementById('senhaEquipe');
    const pinInput = document.getElementById('pinTecnico');
    const errorDiv = document.getElementById('loginError');
    if (senhaInput) senhaInput.value = '';
    if (pinInput) pinInput.value = '';
    if (errorDiv) errorDiv.textContent = '';
  }
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
  // Não chama atualizarNavegacao() aqui – será chamada por mostrarTelaPrincipal após o login
  const backBtn = document.querySelector('#withdrawScreen .back-btn');
  if (backBtn) {
    backBtn.setAttribute('onclick', 'voltarDaRetirada()');
  }
  // Atualiza o badge global ao carregar a navegação (assíncrono)
  atualizarBadgeGlobal().catch(console.error);
}