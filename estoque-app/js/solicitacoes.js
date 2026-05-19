// estoque-app/js/solicitacoes.js
import { mostrarTela } from './navigation.js';
import { API_URL } from './config.js';

let todasSolicitacoes = [];

async function carregarSolicitacoes() {
  const container = document.getElementById('solicitacoesList');
  if (!container) return;
  container.innerHTML = '<div class="loading">Carregando...</div>';
  try {
    const response = await fetch('/api/proxy?action=getSolicitacoesCompra');
    const resultado = await response.json();
    if (!resultado.success) {
      container.innerHTML = '<div class="error">Erro ao carregar solicitações</div>';
      return;
    }
    todasSolicitacoes = resultado.data;
    aplicarFiltro();
  } catch (error) {
    console.error(error);
    container.innerHTML = '<div class="error">Erro de conexão</div>';
  }
}

function aplicarFiltro() {
  const filtro = document.getElementById('filtroStatusSolicitacoes').value;
  let filtradas = todasSolicitacoes;
  if (filtro !== 'todas') {
    filtradas = todasSolicitacoes.filter(s => s.status === filtro);
  }
  const container = document.getElementById('solicitacoesList');
  if (filtradas.length === 0) {
    container.innerHTML = '<div class="empty">Nenhuma solicitação encontrada</div>';
    return;
  }
  container.innerHTML = filtradas.map(s => `
    <div class="solicitacao-item" data-linha="${s.linhaIndex}">
      <div class="solicitacao-info">
        <strong>${s.tecnico}</strong> - ${s.timestamp}
        <div class="solicitacao-itens">Itens: ${s.itens}</div>
        <div class="solicitacao-obs">Obs: ${s.observacao || '-'}</div>
        <div class="solicitacao-status">Status: <span class="status-badge ${s.status === 'Pendente' ? 'pendente' : 'atendida'}">${s.status}</span></div>
      </div>
      ${s.status === 'Pendente' ? `<button class="btn-marcar-atendida" data-linha="${s.linhaIndex}">Solicitação Atendida</button>` : ''}
    </div>
  `).join('');

  // Adiciona eventos aos botões
  document.querySelectorAll('.btn-marcar-atendida').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const linhaId = btn.dataset.linha;
      if (confirm('Marcar esta solicitação como atendida?')) {
        await marcarAtendida(linhaId);
      }
    });
  });
}

async function marcarAtendida(linhaId) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'atualizarStatusSolicitacao',
        linhaId: parseInt(linhaId),
        status: 'Atendida'
      })
    });
    const resultado = await response.json();
    if (resultado.success) {
      alert('✅ Solicitação marcada como atendida!');
      carregarSolicitacoes(); // recarrega a lista
    } else {
      alert('❌ Erro: ' + (resultado.error || 'Tente novamente'));
    }
  } catch (error) {
    console.error(error);
    alert('❌ Erro de conexão');
  }
}

export function initSolicitacoes() {
  const backBtn = document.getElementById('backFromSolicitacoes');
  if (backBtn) backBtn.addEventListener('click', () => mostrarTela('mainScreen'));
  const filtro = document.getElementById('filtroStatusSolicitacoes');
  if (filtro) filtro.addEventListener('change', aplicarFiltro);
  carregarSolicitacoes();
}