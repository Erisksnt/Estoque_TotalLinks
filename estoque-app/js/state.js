// estoque-app/js/state.js

export let dadosEstoque = [];
export let categoriasLista = [];
export let categoriaAtual = null;
export let itemAtual = null;
export let tecnicoAtual = null;
export let movimentacoesRecentes = [];
export let perfilAtual = null;
export let telaAnterior = 'mainScreen';

// Carrega o técnico logado e perfil do sessionStorage
const savedTecnico = sessionStorage.getItem('tecnicoLogado');
const savedPerfil = sessionStorage.getItem('perfilLogado');

if (savedTecnico) {
  tecnicoAtual = savedTecnico;
  perfilAtual = savedPerfil || 'tecnico'; // padrão é técnico
}

// Carrega as movimentações do localStorage ao iniciar
try {
  const savedMovimentacoes = localStorage.getItem('movimentacoesRecentes');
  if (savedMovimentacoes) {
    movimentacoesRecentes = JSON.parse(savedMovimentacoes);
  } else {
    // Migração de dados antigos (retiradasRecentes)
    const oldRetiradas = localStorage.getItem('retiradasRecentes');
    if (oldRetiradas) {
      const retiradas = JSON.parse(oldRetiradas);
      movimentacoesRecentes = retiradas.map(r => ({ ...r, tipo: 'retirada' }));
      localStorage.setItem('movimentacoesRecentes', JSON.stringify(movimentacoesRecentes));
      localStorage.removeItem('retiradasRecentes');
    }
  }
} catch (e) {
  console.warn('Erro ao carregar movimentações:', e);
  movimentacoesRecentes = [];
}

// ============================================
// FUNÇÕES PARA MODIFICAR O ESTADO
// ============================================

export function setDadosEstoque(data) {
  dadosEstoque = data;
}

export function setCategoriasLista(lista) {
  categoriasLista = lista;
}

export function setCategoriaAtual(cat) {
  categoriaAtual = cat;
}

export function setItemAtual(item) {
  itemAtual = item;
}

export function setTecnicoAtual(tecnico, perfil = 'tecnico') {
  tecnicoAtual = tecnico;
  perfilAtual = perfil;
  if (tecnico) {
    sessionStorage.setItem('tecnicoLogado', tecnico);
    sessionStorage.setItem('perfilLogado', perfil);
  } else {
    sessionStorage.removeItem('tecnicoLogado');
    sessionStorage.removeItem('perfilLogado');
  }
}

export function setTelaAnterior(tela) {
  telaAnterior = tela;
}

// ============================================
// FUNÇÕES PARA MOVIMENTAÇÕES RECENTES E BADGE
// ============================================

export function getMovimentacoesRecentes() {
  return movimentacoesRecentes;
}

export function setMovimentacoesRecentes(lista) {
  movimentacoesRecentes = lista;
  localStorage.setItem('movimentacoesRecentes', JSON.stringify(lista));
  atualizarBadgeRecentes();
}

// Data da última vez que o usuário visualizou a aba "Recentes"
let ultimaVisualizacaoRecentes = localStorage.getItem('ultimaVisualizacaoRecentes') 
  ? new Date(localStorage.getItem('ultimaVisualizacaoRecentes')) 
  : new Date();

export function marcarRecentesComoVistos() {
  ultimaVisualizacaoRecentes = new Date();
  localStorage.setItem('ultimaVisualizacaoRecentes', ultimaVisualizacaoRecentes.toISOString());
  atualizarBadgeRecentes();
}

// Converte string "dd/mm/aaaa, HH:MM:SS" para objeto Date
function parseDataMovimentacao(dataStr) {
  const [dataPart, horaPart] = dataStr.split(', ');
  const [dia, mes, ano] = dataPart.split('/');
  return new Date(`${ano}-${mes}-${dia}T${horaPart}`);
}

export function contarNovasMovimentacoes() {
  if (!movimentacoesRecentes.length) return 0;
  return movimentacoesRecentes.filter(m => {
    const dataMov = parseDataMovimentacao(m.data);
    return dataMov > ultimaVisualizacaoRecentes;
  }).length;
}

export function atualizarBadgeRecentes() {
  const badge = document.getElementById('badge-recentes');
  if (!badge) return;
  const count = contarNovasMovimentacoes();
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// Adiciona uma nova movimentação e atualiza o badge
export function addMovimentacaoRecente(movimentacao) {
  // Garante que a movimentação tem uma data válida no formato correto
  if (!movimentacao.data) {
    movimentacao.data = new Date().toLocaleString('pt-BR'); // "dd/mm/aaaa, HH:MM:SS"
  }
  
  movimentacoesRecentes.unshift(movimentacao);
  // Limita a 50 movimentações (pode ajustar)
  if (movimentacoesRecentes.length > 50) movimentacoesRecentes.pop();
  localStorage.setItem('movimentacoesRecentes', JSON.stringify(movimentacoesRecentes));
  
  // Atualiza o badge de notificações
  atualizarBadgeRecentes();
}

// ============================================
// EXPORTA FUNÇÕES PARA O ESCOPO GLOBAL (OPCIONAL, PARA DEBUG)
// ============================================
if (typeof window !== 'undefined') {
  window.atualizarBadgeRecentes = atualizarBadgeRecentes;
  window.addMovimentacaoRecente = addMovimentacaoRecente;
  window.marcarRecentesComoVistos = marcarRecentesComoVistos;
}