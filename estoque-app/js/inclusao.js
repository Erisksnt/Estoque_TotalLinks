// estoque-app/js/inclusao.js

import { dadosEstoque, tecnicoAtual, addMovimentacaoRecente, atualizarBadgeGlobal } from './state.js';
import { mostrarTela } from './navigation.js';
import { API_URL } from './config.js';
import { CATEGORIAS_COM_PATRIMONIO } from './config.js';

// ============================================
// VARIÁVEIS DE CONTROLE
// ============================================
let currentFocus = -1;
let itemSelecionado = null;      // guarda o objeto do item selecionado

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Renderiza campos de patrimônio conforme quantidade
function renderizarPatrimoniosInclusao() {
  const qtdeValor = document.getElementById('qtdeInclusaoValor');
  const qtde = qtdeValor ? parseInt(qtdeValor.textContent) : 1;
  const container = document.getElementById('patrimoniosInclusaoList');
  if (!container) return;
  let html = '';
  for (let i = 0; i < qtde; i++) {
    html += `
      <div class="patrimonio-input">
        <input type="text" placeholder="Patrimônio ${i+1}" required>
        <button class="remove-patrimonio" onclick="this.parentElement.remove()">✖</button>
      </div>
    `;
  }
  container.innerHTML = html;
}

// Verifica se o item precisa de patrimônio (categoria + unidade)
function itemPrecisaPatrimonio(item) {
  if (!item) return false;
  const categoria = item[0];
  const unidade = item[2];
  return CATEGORIAS_COM_PATRIMONIO.includes(categoria) && unidade === 'un';
}

// Atualiza a interface com base no item selecionado
function atualizarInterfacePorItem(item) {
  if (!item) return;
  // Preenche categoria
  const categoriaInput = document.getElementById('categoriaInclusao');
  if (categoriaInput) categoriaInput.value = item[0];
  // Armazena o nome do item no campo hidden
  const hiddenItem = document.getElementById('itemInclusaoHidden');
  if (hiddenItem) hiddenItem.value = item[1];
  itemSelecionado = item;

  // Gerencia campo patrimônio
  const precisa = itemPrecisaPatrimonio(item);
  const patrimonioGroup = document.getElementById('patrimonioInclusaoGroup');
  if (precisa) {
    patrimonioGroup.style.display = 'block';
    renderizarPatrimoniosInclusao();
  } else {
    patrimonioGroup.style.display = 'none';
    const patrimonioList = document.getElementById('patrimoniosInclusaoList');
    if (patrimonioList) patrimonioList.innerHTML = '';
  }
}

// Exibe sugestões de itens (busca em todo o estoque)
function showItemBuscaSuggestions() {
  const input = document.getElementById('itemBuscaInclusao');
  const suggestionBox = document.getElementById('itemBuscaAutocompleteList');
  const termo = input.value.trim().toLowerCase();
  if (termo.length < 2) {
    suggestionBox.style.display = 'none';
    return;
  }
  // Filtra itens que contenham o termo no nome
  const itensFiltrados = dadosEstoque.filter(item => item[1].toLowerCase().includes(termo));
  const nomesUnicos = [...new Set(itensFiltrados.map(item => item[1]))];
  if (nomesUnicos.length === 0) {
    suggestionBox.style.display = 'none';
    return;
  }
  suggestionBox.innerHTML = nomesUnicos.map(nome => `<div>${nome}</div>`).join('');
  suggestionBox.style.display = 'block';
  currentFocus = -1;

  // Adiciona evento de clique nas sugestões
  const items = suggestionBox.querySelectorAll('div');
  items.forEach(div => {
    div.addEventListener('click', (e) => {
      const nomeItem = e.target.textContent;
      input.value = nomeItem;
      suggestionBox.style.display = 'none';
      // Procura o item completo em dadosEstoque
      const itemEncontrado = dadosEstoque.find(item => item[1] === nomeItem);
      if (itemEncontrado) {
        atualizarInterfacePorItem(itemEncontrado);
      } else {
        alert('Item não encontrado no estoque');
      }
    });
  });
}

// Navegação por teclado nas sugestões
function handleItemBuscaKeydown(e) {
  const suggestionBox = document.getElementById('itemBuscaAutocompleteList');
  if (!suggestionBox) return;
  const items = suggestionBox.querySelectorAll('div');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    currentFocus++;
    if (currentFocus >= items.length) currentFocus = 0;
    highlightSuggestion(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    currentFocus--;
    if (currentFocus < 0) currentFocus = items.length - 1;
    highlightSuggestion(items);
  } else if (e.key === 'Enter') {
    if (currentFocus >= 0 && items[currentFocus]) {
      e.preventDefault();
      const nomeItem = items[currentFocus].textContent;
      document.getElementById('itemBuscaInclusao').value = nomeItem;
      suggestionBox.style.display = 'none';
      const itemEncontrado = dadosEstoque.find(item => item[1] === nomeItem);
      if (itemEncontrado) atualizarInterfacePorItem(itemEncontrado);
      currentFocus = -1;
    }
  } else if (e.key === 'Escape') {
    suggestionBox.style.display = 'none';
    currentFocus = -1;
  }
}

function highlightSuggestion(items) {
  items.forEach((item, idx) => {
    if (idx === currentFocus) item.classList.add('selected');
    else item.classList.remove('selected');
  });
}

// Controles de quantidade
function initQuantidadeInclusao() {
  const qtdeMenos = document.getElementById('qtdeInclusaoMenos');
  const qtdeMais = document.getElementById('qtdeInclusaoMais');
  const qtdeValor = document.getElementById('qtdeInclusaoValor');
  if (qtdeMenos) {
    qtdeMenos.addEventListener('click', () => {
      let val = parseInt(qtdeValor.textContent);
      if (val > 1) {
        qtdeValor.textContent = val - 1;
        if (itemSelecionado && itemPrecisaPatrimonio(itemSelecionado)) renderizarPatrimoniosInclusao();
      }
    });
  }
  if (qtdeMais) {
    qtdeMais.addEventListener('click', () => {
      let val = parseInt(qtdeValor.textContent);
      qtdeValor.textContent = val + 1;
      if (itemSelecionado && itemPrecisaPatrimonio(itemSelecionado)) renderizarPatrimoniosInclusao();
    });
  }
}

function limparFormulario() {
  document.getElementById('itemBuscaInclusao').value = '';
  document.getElementById('categoriaInclusao').value = '';
  document.getElementById('itemInclusaoHidden').value = '';
  document.getElementById('qtdeInclusaoValor').textContent = '1';
  document.getElementById('patrimoniosInclusaoList').innerHTML = '';
  document.getElementById('obsInclusao').value = '';
  document.getElementById('patrimonioInclusaoGroup').style.display = 'none';
  document.getElementById('itemBuscaAutocompleteList').style.display = 'none';
  itemSelecionado = null;
}

function validarFormulario() {
  const itemHidden = document.getElementById('itemInclusaoHidden').value;
  const categoria = document.getElementById('categoriaInclusao').value;
  const quantidade = parseInt(document.getElementById('qtdeInclusaoValor').textContent);
  if (!itemHidden || !categoria) {
    alert('Selecione um item válido');
    return false;
  }
  if (isNaN(quantidade) || quantidade <= 0) {
    alert('Informe uma quantidade válida');
    return false;
  }
  if (itemSelecionado && itemPrecisaPatrimonio(itemSelecionado)) {
    const patrimonios = [];
    document.querySelectorAll('#patrimoniosInclusaoList input').forEach(input => {
      if (input.value.trim()) patrimonios.push(input.value.trim());
    });
    if (patrimonios.length !== quantidade) {
      alert(`Informe exatamente ${quantidade} patrimônio(s)`);
      return false;
    }
    if (patrimonios.some(p => p === '')) {
      alert('Preencha todos os patrimônios');
      return false;
    }
  }
  return true;
}

async function salvarInclusao() {
  if (!validarFormulario()) return;
  const itemNome = document.getElementById('itemInclusaoHidden').value;
  const categoria = document.getElementById('categoriaInclusao').value;
  const quantidade = parseInt(document.getElementById('qtdeInclusaoValor').textContent);
  const observacao = document.getElementById('obsInclusao').value.trim();
  const patrimonios = [];
  document.querySelectorAll('#patrimoniosInclusaoList input').forEach(input => {
    if (input.value.trim()) patrimonios.push(input.value.trim());
  });

  const dados = {
    action: 'registrarInclusao',
    categoria,
    item: itemNome,
    quantidade,
    patrimonio: patrimonios.join(', '),
    observacao: observacao || null,
    tecnico: tecnicoAtual
  };

  const btnSalvar = document.getElementById('salvarInclusao');
  const textoOriginal = btnSalvar.textContent;
  btnSalvar.textContent = 'Salvando...';
  btnSalvar.disabled = true;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const resultado = await response.json();
    if (resultado.success) {
      addMovimentacaoRecente({
        tipo: 'inclusao',
        item: itemNome,
        quantidade,
        data: new Date().toLocaleString(),
        tecnico: tecnicoAtual,
        observacao,
        patrimonio: patrimonios.join(', ')
      });
      alert('✅ Item incluído com sucesso!');
      limparFormulario();
      await atualizarBadgeGlobal();
      mostrarTela('mainScreen');
    } else {
      alert('❌ Erro ao incluir: ' + (resultado.error || 'Tente novamente'));
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    alert('❌ Erro de conexão. Verifique sua internet e tente novamente.');
  } finally {
    btnSalvar.textContent = textoOriginal;
    btnSalvar.disabled = false;
  }
}

// ============================================
// FUNÇÕES EXPORTADAS
// ============================================

export function initInclusao() {
  // Configura controles de quantidade
  initQuantidadeInclusao();

  // Campo de busca de item
  const buscaInput = document.getElementById('itemBuscaInclusao');
  if (buscaInput) {
    buscaInput.addEventListener('input', showItemBuscaSuggestions);
    buscaInput.addEventListener('keydown', handleItemBuscaKeydown);
    // Fecha sugestões ao clicar fora
    document.addEventListener('click', (e) => {
      const suggestionBox = document.getElementById('itemBuscaAutocompleteList');
      if (!buscaInput.contains(e.target) && suggestionBox && !suggestionBox.contains(e.target)) {
        suggestionBox.style.display = 'none';
      }
    });
  }

  // Botões
  const backBtn = document.getElementById('backFromInclusao');
  if (backBtn) backBtn.addEventListener('click', () => mostrarTela('mainScreen'));

  const salvarBtn = document.getElementById('salvarInclusao');
  if (salvarBtn) salvarBtn.addEventListener('click', salvarInclusao);
}

export function refreshCategoriasInclusao() {
  limparFormulario();
}