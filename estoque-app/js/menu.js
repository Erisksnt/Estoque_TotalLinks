// estoque-app/js/menu.js
import { mostrarTelaPrincipal, mostrarTela } from './navigation.js';
import { carregarRecentes } from './recentes.js';
import { verTodosCriticos } from './categories.js';
import { carregarEquipamentos } from './equipamentos.js';
import { setTecnicoAtual, perfilAtual } from './state.js';

export function atualizarVisibilidadeMenu() {
  const isAdmin = perfilAtual === 'adm' || perfilAtual === 'gerente';
  const itemSolicitar = document.querySelector('.side-item[data-nav="solicitacao"]');
  const itemSolicitacoes = document.querySelector('.side-item[data-nav="solicitacoes"]');
  const itemCriticos = document.querySelector('.side-item[data-nav="criticos"]');
  const itemEquipamentos = document.querySelector('.side-item[data-nav="equipamentos"]');

  if (itemSolicitar) itemSolicitar.style.display = !isAdmin ? 'flex' : 'none';
  if (itemSolicitacoes) itemSolicitacoes.style.display = isAdmin ? 'flex' : 'none';
  if (itemCriticos) itemCriticos.style.display = isAdmin ? 'flex' : 'none';
  if (itemEquipamentos) itemEquipamentos.style.display = isAdmin ? 'flex' : 'none';
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

  // Configurar eventos de clique para todos os itens (sem filtrar por display)
  const sideItems = document.querySelectorAll('.side-item');
  sideItems.forEach(item => {
    // Remove eventos antigos para evitar duplicação
    item.removeEventListener('click', item._listener);
    const listener = async (e) => {
      const tela = item.dataset.nav;
      switch(tela) {
        case 'home':
          mostrarTelaPrincipal();
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
        case 'solicitacao':
          mostrarTela('solicitacaoScreen');
          break;
        case 'solicitacoes':
          mostrarTela('solicitacoesScreen');
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
    };
    item.addEventListener('click', listener);
    item._listener = listener;
  });
}