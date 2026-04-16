// estoque-app/js/state.js

export let dadosEstoque = [];
export let categoriasLista = [];
export let categoriaAtual = null;
export let itemAtual = null;
export let tecnicoAtual = null;
export let retiradasRecentes = JSON.parse(localStorage.getItem('retiradasRecentes') || '[]');
export let telaAnterior = 'mainScreen';

// Funções para modificar o estado (controle consistente)
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
}

export function setRetiradasRecentes(lista) {
  retiradasRecentes = lista;
  localStorage.setItem('retiradasRecentes', JSON.stringify(lista));
}

export function addRetiradaRecente(retirada) {
  retiradasRecentes.unshift(retirada);
  if (retiradasRecentes.length > 20) retiradasRecentes.pop();
  localStorage.setItem('retiradasRecentes', JSON.stringify(retiradasRecentes));
}

export function setTelaAnterior(tela) {
  telaAnterior = tela;
}