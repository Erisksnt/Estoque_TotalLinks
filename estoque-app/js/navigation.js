// estoque-app/js/navigation.js

import { telaAnterior, setTelaAnterior, perfilAtual, marcarRecentesComoVistos, atualizarBadgeRecentes } from './state.js';
import { carregarRecentes } from './recentes.js';
import { verTodosCriticos } from './categories.js';
import { carregarMetricas, carregarCategoriasRapidas, carregarListaCritica } from './ui-helpers.js';

// Atualiza o ícone ativo do bottom navigation
function atualizarBottomNavActive(telaId) {
  // Remove active de todos os itens
  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.classList.remove('active');
  });
  
  // Mapeamento de telas para botões
  const mapa = {
    'mainScreen': 'home',
    'searchScreen': 'search',
    'recentesScreen': 'recentes',
    'criticosScreen': 'criticos'
  };
  
  const navTarget = mapa[telaId];
  if (navTarget) {
    const botao = document.querySelector(`.nav-item[data-nav="${navTarget}"]`);
    if (botao) {
      botao.classList.add('active');
    }
  }
}

// Função para adaptar a interface conforme o perfil
function aplicarAdaptacaoPorPerfil() {
  const isGerente = perfilAtual === 'adm' || perfilAtual === 'gerente';
  
  // Elementos que apenas o gerente visualiza
  const elementosGerente = [
    document.getElementById('totalCategorias'),
    document.getElementById('totalCriticos'),
    document.querySelector('.metrics-grid'),
    document.getElementById('criticalList')
  ];
  
  // Esconde ou mostra elementos conforme perfil
  elementosGerente.forEach(el => {
    if (el) {
      el.style.display = isGerente ? '' : 'none';
    }
  });
  
  // Esconde o link "Ver todos" dos críticos
  const sectionLink = document.querySelector('.section-header .section-link');
  if (sectionLink) {
    sectionLink.style.display = isGerente ? '' : 'none';
  }
  
  // Ajusta o card de sincronização
  const syncCard = document.querySelector('.sync-card');
  if (syncCard) {
    syncCard.style.marginTop = isGerente ? '0' : '20px';
  }
  
  // Adiciona classe ao body para CSS adicional
  if (isGerente) {
    document.body.classList.add('gerente');
    document.body.classList.remove('tecnico');
  } else {
    document.body.classList.add('tecnico');
    document.body.classList.remove('gerente');
  }
  
  // Ajusta a aba Crítico no bottom navigation conforme perfil
  const navCritico = document.querySelector('.nav-item[data-nav="criticos"]');
  if (navCritico) {
    navCritico.style.display = isGerente ? 'flex' : 'none';
  }
}

// Função pública para atualizar toda a navegação (visibilidade e eventos)
export function atualizarNavegacao() {
  const navItems = document.querySelectorAll('.nav-item');
  const isGerente = perfilAtual === 'adm' || perfilAtual === 'gerente';
  
  navItems.forEach(nav => {
    const tela = nav.dataset.nav;
    
    // Atualiza visibilidade
    if (tela === 'criticos') {
      nav.style.display = isGerente ? 'flex' : 'none';
    } else {
      nav.style.display = 'flex';
    }
    
    // Remove eventos antigos clonando o elemento
    const newNav = nav.cloneNode(true);
    nav.parentNode.replaceChild(newNav, nav);
    
    // Adiciona evento novamente
    newNav.addEventListener('click', () => {
      const navTela = newNav.dataset.nav;
      if (navTela === 'home') {
        mostrarTelaPrincipal();
      } else if (navTela === 'search') {
        mostrarTela('searchScreen');
      } else if (navTela === 'recentes') {
        carregarRecentes();
        mostrarTela('recentesScreen');
      } else if (navTela === 'criticos') {
        if (perfilAtual === 'adm' || perfilAtual === 'gerente') {
          verTodosCriticos();
        }
      }
    });
  });
  
  // Força a exibição do bottom nav (caso esteja oculto)
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav && perfilAtual !== null) {
    bottomNav.style.display = 'flex';
    bottomNav.style.visibility = 'visible';
  }
  
  // Reaplica adaptação da interface
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
  
  // Atualiza o active do bottom navigation
  atualizarBottomNavActive('mainScreen');
  
  // FORÇA A REMOÇÃO DO ESTILO INLINE DO BOTTOM NAVIGATION
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) {
    bottomNav.style.display = 'flex';
    bottomNav.style.visibility = 'visible';
  }
  
  // Aplica adaptação por perfil
  aplicarAdaptacaoPorPerfil();
  
  // Carrega os dados
  carregarMetricas();
  carregarCategoriasRapidas();
  carregarListaCritica();
}

export function mostrarTela(telaId) {
  const telas = ['mainScreen', 'loginScreen', 'itemsScreen', 'withdrawScreen', 'searchScreen', 'recentesScreen', 'criticosScreen', 'inclusaoScreen'];
  telas.forEach(tela => {
    const el = document.getElementById(tela);
    if (el) el.classList.remove('active');
  });
  const telaAtiva = document.getElementById(telaId);
  if (telaAtiva) telaAtiva.classList.add('active');
  
  // Atualiza o active do bottom navigation
  atualizarBottomNavActive(telaId);
  
  // Se for a tela de recentes, marca as movimentações como vistas
  if (telaId === 'recentesScreen') {
    marcarRecentesComoVistos();
  }
  
  // Mostra ou esconde o bottom navigation
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) {
    if (telaId === 'loginScreen') {
      bottomNav.style.display = 'none';
    } else {
      bottomNav.style.display = 'flex';
      bottomNav.style.visibility = 'visible';
    }
  }
  
  // Se for a tela de login, restaura o botão
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
  // Configura a navegação inicial (visibilidade e eventos)
  atualizarNavegacao();
  
  // Ajusta o botão voltar na tela de retirada (onclick)
  const backBtn = document.querySelector('#withdrawScreen .back-btn');
  if (backBtn) {
    backBtn.setAttribute('onclick', 'voltarDaRetirada()');
  }
  
  // Atualiza o badge de recentes ao carregar a navegação
  atualizarBadgeRecentes();
}