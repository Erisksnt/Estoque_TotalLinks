// estoque-app/js/state.js

export let dadosEstoque = [];
export let categoriasLista = [];
export let categoriaAtual = null;
export let itemAtual = null;
export let tecnicoAtual = null;
export let movimentacoesRecentes = [];
export let telaAnterior = 'mainScreen';

// Carrega o técnico logado do sessionStorage
const savedTecnico = sessionStorage.getItem('tecnicoLogado');
if (savedTecnico) {
  tecnicoAtual = savedTecnico;
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

export function setTecnicoAtual(tecnico) {
  tecnicoAtual = tecnico;
  if (tecnico) {
    sessionStorage.setItem('tecnicoLogado', tecnico);
  } else {
    sessionStorage.removeItem('tecnicoLogado');
  }
}

export function setTelaAnterior(tela) {
  telaAnterior = tela;
}

// ============================================
// FUNÇÕES PARA MOVIMENTAÇÕES RECENTES
// ============================================

export function getMovimentacoesRecentes() {
  return movimentacoesRecentes;
}

export function setMovimentacoesRecentes(lista) {
  movimentacoesRecentes = lista;
  localStorage.setItem('movimentacoesRecentes', JSON.stringify(lista));
}

export function addMovimentacaoRecente(movimentacao) {
  // Garante que a movimentação tem uma data válida
  if (!movimentacao.data) {
    movimentacao.data = new Date().toLocaleString();
  }
  
  movimentacoesRecentes.unshift(movimentacao);
  // Limita a 50 movimentações
  if (movimentacoesRecentes.length > 50) movimentacoesRecentes.pop();
  localStorage.setItem('movimentacoesRecentes', JSON.stringify(movimentacoesRecentes));
}