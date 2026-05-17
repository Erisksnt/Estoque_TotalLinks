// estoque-app/js/equipamentos.js
import { mostrarTela } from './navigation.js';
import { refreshCategoriasInclusao } from './inclusao.js';

let dadosGlobais = { estoque: [], comTecnicos: [] };
let abaAtiva = 'estoque';
let termoBusca = '';

export async function carregarEquipamentos() {
  const container = document.getElementById('equipamentosList');
  if (!container) return;
  container.innerHTML = '<div class="equipamento-item">Carregando...</div>';
  try {
    const response = await fetch('/api/proxy?action=getEquipamentosGeral');
    const resultado = await response.json();
    if (!resultado.success) throw new Error(resultado.error);
    dadosGlobais = resultado.data;
    aplicarFiltroErenderizar();
  } catch (error) {
    console.error('Erro ao carregar equipamentos:', error);
    container.innerHTML = '<div class="equipamento-item">Erro ao carregar dados</div>';
  }
}

function aplicarFiltroErenderizar() {
  const dados = abaAtiva === 'estoque' ? dadosGlobais.estoque : dadosGlobais.comTecnicos;
  let filtrados = dados;
  if (termoBusca.trim() !== '') {
    const termo = termoBusca.toLowerCase();
    filtrados = dados.filter(item => {
      const nome = (item.item || '').toLowerCase();
      const patrimonio = (item.patrimonio || '').toLowerCase();
      const tecnico = (item.tecnico || '').toLowerCase();
      return nome.includes(termo) || patrimonio.includes(termo) || tecnico.includes(termo);
    });
  }
  const container = document.getElementById('equipamentosList');
  if (!container) return;
  if (filtrados.length === 0) {
    container.innerHTML = '<div class="equipamento-item">Nenhum equipamento encontrado</div>';
    return;
  }
  if (abaAtiva === 'estoque') {
    container.innerHTML = filtrados.map(item => `
      <div class="equipamento-item">
        <div class="equipamento-info">
          <strong>${item.item}</strong>
          <div>Categoria: ${item.categoria} | Quantidade: ${item.quantidade} ${item.unidade} | Mínimo: ${item.minimo}</div>
        </div>
      </div>
    `).join('');
  } else {
    container.innerHTML = filtrados.map(eq => `
      <div class="equipamento-item">
        <div class="equipamento-info">
          <strong>${eq.item}</strong>
          <div>Patrimônio: ${eq.patrimonio || 'N/A'} | Técnico: ${eq.tecnico} | Saída: ${eq.dataSaida}</div>
          <div class="equipamento-status">Obs: ${eq.observacao || '-'}</div>
        </div>
        <div class="equipamento-badge"></div>
      </div>
    `).join('');
  }
}

function configurarEventos() {
  const tabEstoque = document.getElementById('tabEstoqueBtn');
  const tabTecnicos = document.getElementById('tabTecnicosBtn');
  const buscaInput = document.getElementById('equipamentosSearchInput');
  if (tabEstoque) {
    tabEstoque.addEventListener('click', () => {
      abaAtiva = 'estoque';
      tabEstoque.classList.add('active');
      tabTecnicos.classList.remove('active');
      termoBusca = '';
      if (buscaInput) buscaInput.value = '';
      aplicarFiltroErenderizar();
    });
  }
  if (tabTecnicos) {
    tabTecnicos.addEventListener('click', () => {
      abaAtiva = 'tecnicos';
      tabTecnicos.classList.add('active');
      tabEstoque.classList.remove('active');
      termoBusca = '';
      if (buscaInput) buscaInput.value = '';
      aplicarFiltroErenderizar();
    });
  }
  if (buscaInput) {
    buscaInput.addEventListener('input', (e) => {
      termoBusca = e.target.value;
      aplicarFiltroErenderizar();
    });
  }
}

export function initEquipamentos() {
  const backBtn = document.getElementById('backFromEquipamentos');
  if (backBtn) backBtn.addEventListener('click', () => mostrarTela('mainScreen'));
  configurarEventos();

  const fab = document.getElementById('fabIncluir');
  if (fab) {

    const novoFab = fab.cloneNode(true);
    fab.parentNode.replaceChild(novoFab, fab);
    novoFab.addEventListener('click', () => {
      refreshCategoriasInclusao();
      mostrarTela('inclusaoScreen');
    });
  }
}