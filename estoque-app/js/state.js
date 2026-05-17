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
  perfilAtual = savedPerfil || 'tecnico';
}

// Carrega as movimentações do localStorage ao iniciar
try {
  const savedMovimentacoes = localStorage.getItem('movimentacoesRecentes');
  if (savedMovimentacoes) {
    movimentacoesRecentes = JSON.parse(savedMovimentacoes);
  } else {
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
// FUNÇÕES DE MOVIMENTAÇÕES (locais)
// ============================================

export function getMovimentacoesRecentes() {
  return movimentacoesRecentes;
}

export function setMovimentacoesRecentes(lista) {
  movimentacoesRecentes = lista;
  localStorage.setItem('movimentacoesRecentes', JSON.stringify(lista));
}

export function addMovimentacaoRecente(movimentacao) {
  if (!movimentacao.data) {
    movimentacao.data = new Date().toLocaleString();
  }
  movimentacoesRecentes.unshift(movimentacao);
  if (movimentacoesRecentes.length > 50) movimentacoesRecentes.pop();
  localStorage.setItem('movimentacoesRecentes', JSON.stringify(movimentacoesRecentes));
}

// ============================================
// BADGE GLOBAL (usando NOME do técnico)
// ============================================
let ultimoContadorConhecido = 0;

async function buscarBadge() {
  if (!tecnicoAtual) return 0;
  try {
    const response = await fetch(`/api/proxy?action=obterBadge&nome=${encodeURIComponent(tecnicoAtual)}`);
    const data = await response.json();
    if (data.badge !== undefined) return data.badge;
    return 0;
  } catch (error) {
    console.error('Erro ao buscar badge:', error);
    return 0;
  }
}

export async function atualizarBadgeGlobal() {
  const menuBadge = document.getElementById('menuBadgeRecentes');
  if (menuBadge) {
    const count = await buscarBadge();
    if (count > 0) {
      menuBadge.textContent = count > 9 ? '9+' : count;
      menuBadge.style.display = 'inline-block';
    } else {
      menuBadge.style.display = 'none';
    }
  }
}

export async function marcarRecentesComoVistos() {
  if (!tecnicoAtual) return;
  try {
    const response = await fetch(`/api/proxy?action=obterBadge&nome=${encodeURIComponent(tecnicoAtual)}`);
    const data = await response.json();
    if (data.global !== undefined) {
      await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'atualizarVisualizacao',
          nome: tecnicoAtual,
          contadorGlobal: data.global
        })
      });
      await atualizarBadgeGlobal();
    }
  } catch (error) {
    console.error('Erro ao marcar como visto:', error);
  }
}