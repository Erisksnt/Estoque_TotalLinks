// estoque-app/js/menu.js
import { mostrarTelaPrincipal, mostrarTela } from './navigation.js';
import { carregarRecentes } from './recentes.js';
import { verTodosCriticos } from './categories.js';
import { carregarEquipamentos } from './equipamentos.js';
import { setTecnicoAtual, perfilAtual } from './state.js';

export function atualizarVisibilidadeMenu() {
  const isAdmin = perfilAtual === 'adm' || perfilAtual === 'gerente';
  const itemCriticos = document.querySelector('.side-item[data-nav="criticos"]');
  if (itemCriticos) {
    itemCriticos.style.display = isAdmin ? 'flex' : 'none';
  }
}

export function initMenu() {
  const toggleBtn = document.getElementById('menuToggle');
  const sideMenu = document.getElementById('sideMenu');
  const closeBtn = document.getElementById('closeMenu');
  const overlay = document.createElement('div');
  overlay.id = 'menuOverlay';
  overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; display:none;';
  document.body.appendChild(overlay);

  function openMenu() {
    sideMenu.classList.add('open');
    overlay.style.display = 'block';
  }
  function closeMenu() {
    sideMenu.classList.remove('open');
    overlay.style.display = 'none';
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);

  // Aplica a visibilidade inicial
  atualizarVisibilidadeMenu();

  const sideItems = document.querySelectorAll('.side-item');
  sideItems.forEach(item => {
    // Ignora se o item estiver oculto
    if (item.style.display === 'none') return;

    item.addEventListener('click', async (e) => {
      const tela = item.dataset.nav;
      switch(tela) {
        case 'home':
          mostrarTelaPrincipal();
          break;
        case 'search':
          mostrarTela('searchScreen');
          break;
        case 'recentes':
          await carregarRecentes();
          mostrarTela('recentesScreen');
          break;
        case 'criticos':
          verTodosCriticos();
          break;
        case 'equipamentos':
          await carregarEquipamentos();
          mostrarTela('equipamentosScreen');
          break;
        case 'retirar':
          mostrarTela('withdrawScreen');
          break;
        case 'incluir':
          mostrarTela('inclusaoScreen');
          break;
        case 'devolucao':
          mostrarTela('devolucaoScreen');
          break;
        case 'logout':
          setTecnicoAtual(null);
          const badge = document.getElementById('badge-recentes');
          if (badge) badge.style.display = 'none';
          atualizarVisibilidadeMenu();
          mostrarTela('loginScreen');
          break;
      }
      closeMenu();
    });
  });
}