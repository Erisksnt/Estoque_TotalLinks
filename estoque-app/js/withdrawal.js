// estoque-app/js/withdrawal.js

import { dadosEstoque, tecnicoAtual, addMovimentacaoRecente, atualizarBadgeGlobal } from './state.js';
import { apiRegistrarRetirada } from './api.js';
import { carregarEstoque } from './cache.js';
import { mostrarTela } from './navigation.js';
import { CATEGORIAS_COM_PATRIMONIO } from './config.js';

// ============================================
// VARIÁVEIS DE CONTROLE
// ============================================
let currentFocus = -1;
let itemSelecionado = null;      // guarda o objeto do item selecionado

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function renderizarPatrimoniosRetirada() {
  const qtdeValor = document.getElementById('qtdeRetiradaValor');
  const qtde = qtdeValor ? parseInt(qtdeValor.textContent) : 1;
  const container = document.getElementById('patrimoniosRetiradaList');
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

function itemPrecisaPatrimonioRetirada(item) {
  if (!item) return false;
  const categoria = item[0];
  const unidade = item[2];
  return CATEGORIAS_COM_PATRIMONIO.includes(categoria) && unidade === 'un';
}

function atualizarInterfacePorItemRetirada(item) {
  if (!item) return;
  // Preenche categoria (readonly)
  const categoriaInput = document.getElementById('categoriaRetirada');
  if (categoriaInput) categoriaInput.value = item[0];
  // Armazena o nome do item no campo hidden
  const hiddenItem = document.getElementById('itemRetiradaHidden');
  if (hiddenItem) hiddenItem.value = item[1];
  itemSelecionado = item;

  // Gerencia campo patrimônio
  const precisa = itemPrecisaPatrimonioRetirada(item);
  const patrimonioContainer = document.getElementById('patrimoniosRetiradaContainer');
  if (precisa) {
    patrimonioContainer.style.display = 'block';
    renderizarPatrimoniosRetirada();
  } else {
    patrimonioContainer.style.display = 'none';
    const patrimonioList = document.getElementById('patrimoniosRetiradaList');
    if (patrimonioList) patrimonioList.innerHTML = '';
  }
}

function showItemBuscaSuggestionsRetirada() {
  const input = document.getElementById('itemBuscaRetirada');
  const suggestionBox = document.getElementById('itemBuscaRetiradaAutocompleteList');
  const termo = input.value.trim().toLowerCase();
  if (termo.length < 2) {
    suggestionBox.style.display = 'none';
    return;
  }
  const itensFiltrados = dadosEstoque.filter(item => item[1].toLowerCase().includes(termo));
  const nomesUnicos = [...new Set(itensFiltrados.map(item => item[1]))];
  if (nomesUnicos.length === 0) {
    suggestionBox.style.display = 'none';
    return;
  }
  suggestionBox.innerHTML = nomesUnicos.map(nome => `<div>${nome}</div>`).join('');
  suggestionBox.style.display = 'block';
  currentFocus = -1;

  const items = suggestionBox.querySelectorAll('div');
  items.forEach(div => {
    div.addEventListener('click', (e) => {
      const nomeItem = e.target.textContent;
      input.value = nomeItem;
      suggestionBox.style.display = 'none';
      const itemEncontrado = dadosEstoque.find(item => item[1] === nomeItem);
      if (itemEncontrado) {
        atualizarInterfacePorItemRetirada(itemEncontrado);
      } else {
        alert('Item não encontrado no estoque');
      }
    });
  });
}

function handleItemBuscaKeydownRetirada(e) {
  const suggestionBox = document.getElementById('itemBuscaRetiradaAutocompleteList');
  if (!suggestionBox) return;
  const items = suggestionBox.querySelectorAll('div');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    currentFocus++;
    if (currentFocus >= items.length) currentFocus = 0;
    highlightSuggestionRetirada(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    currentFocus--;
    if (currentFocus < 0) currentFocus = items.length - 1;
    highlightSuggestionRetirada(items);
  } else if (e.key === 'Enter') {
    if (currentFocus >= 0 && items[currentFocus]) {
      e.preventDefault();
      const nomeItem = items[currentFocus].textContent;
      document.getElementById('itemBuscaRetirada').value = nomeItem;
      suggestionBox.style.display = 'none';
      const itemEncontrado = dadosEstoque.find(item => item[1] === nomeItem);
      if (itemEncontrado) atualizarInterfacePorItemRetirada(itemEncontrado);
      currentFocus = -1;
    }
  } else if (e.key === 'Escape') {
    suggestionBox.style.display = 'none';
    currentFocus = -1;
  }
}

function highlightSuggestionRetirada(items) {
  items.forEach((item, idx) => {
    if (idx === currentFocus) item.classList.add('selected');
    else item.classList.remove('selected');
  });
}

function initQuantidadeRetirada() {
  const qtdeMenos = document.getElementById('qtdeRetiradaMenos');
  const qtdeMais = document.getElementById('qtdeRetiradaMais');
  const qtdeValor = document.getElementById('qtdeRetiradaValor');
  if (qtdeMenos) {
    qtdeMenos.addEventListener('click', () => {
      let val = parseInt(qtdeValor.textContent);
      if (val > 1) {
        qtdeValor.textContent = val - 1;
        if (itemSelecionado && itemPrecisaPatrimonioRetirada(itemSelecionado)) {
          renderizarPatrimoniosRetirada();
        }
      }
    });
  }
  if (qtdeMais) {
    qtdeMais.addEventListener('click', () => {
      let val = parseInt(qtdeValor.textContent);
      const maxEstoque = itemSelecionado ? (Number(itemSelecionado[3]) || 0) : Infinity;
      if (val < maxEstoque) {
        qtdeValor.textContent = val + 1;
        if (itemSelecionado && itemPrecisaPatrimonioRetirada(itemSelecionado)) {
          renderizarPatrimoniosRetirada();
        }
      } else {
        const errorDiv = document.getElementById('withdrawError');
        if (errorDiv) errorDiv.textContent = `Máximo disponível: ${maxEstoque}`;
        setTimeout(() => {
          if (errorDiv) errorDiv.textContent = '';
        }, 3000);
      }
    });
  }
}

function limparFormularioRetirada() {
  document.getElementById('itemBuscaRetirada').value = '';
  document.getElementById('categoriaRetirada').value = '';
  document.getElementById('itemRetiradaHidden').value = '';
  document.getElementById('qtdeRetiradaValor').textContent = '1';
  document.getElementById('patrimoniosRetiradaList').innerHTML = '';
  document.getElementById('observacaoRetirada').value = '';
  document.getElementById('patrimoniosRetiradaContainer').style.display = 'none';
  document.getElementById('itemBuscaRetiradaAutocompleteList').style.display = 'none';
  itemSelecionado = null;
  const errorDiv = document.getElementById('withdrawError');
  if (errorDiv) errorDiv.textContent = '';
}

function validarFormularioRetirada() {
  const itemHidden = document.getElementById('itemRetiradaHidden').value;
  const quantidade = parseInt(document.getElementById('qtdeRetiradaValor').textContent);
  if (!itemHidden) {
    alert('Selecione um item válido');
    return false;
  }
  if (isNaN(quantidade) || quantidade <= 0) {
    alert('Informe uma quantidade válida');
    return false;
  }
  // Validação de estoque (já feita no backend, mas podemos fazer frontend)
  if (itemSelecionado && quantidade > (Number(itemSelecionado[3]) || 0)) {
    alert(`Estoque insuficiente. Disponível: ${itemSelecionado[3]} ${itemSelecionado[2]}`);
    return false;
  }
  if (itemSelecionado && itemPrecisaPatrimonioRetirada(itemSelecionado)) {
    const patrimonios = [];
    document.querySelectorAll('#patrimoniosRetiradaList input').forEach(input => {
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

async function confirmarRetirada() {
  if (!validarFormularioRetirada()) return;
  const itemNome = document.getElementById('itemRetiradaHidden').value;
  const quantidade = parseInt(document.getElementById('qtdeRetiradaValor').textContent);
  const observacao = document.getElementById('observacaoRetirada').value.trim();
  const patrimonios = [];
  document.querySelectorAll('#patrimoniosRetiradaList input').forEach(input => {
    if (input.value.trim()) patrimonios.push(input.value.trim());
  });

  const dados = {
    action: 'registrarRetirada',
    itemNome,
    quantidade,
    tecnico: tecnicoAtual,
    observacao,
    patrimonios
  };

  const btn = document.getElementById('btnConfirmarRetirada');
  const textoOriginal = btn.textContent;
  btn.textContent = 'Processando...';
  btn.disabled = true;

  try {
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const resultado = await response.json();

    if (resultado.success) {
      addMovimentacaoRecente({
        tipo: 'retirada',
        item: itemNome,
        quantidade,
        data: new Date().toLocaleString(),
        tecnico: tecnicoAtual,
        observacao,
        patrimonio: patrimonios.join(', ')
      });

      await carregarEstoque(true);
      await atualizarBadgeGlobal();

      const retirarMais = confirm(`✅ Retirada registrada!\nItem: ${itemNome}\nQuantidade: ${quantidade}\n\nDeseja retirar outro item?`);

      if (retirarMais) {
        limparFormularioRetirada();
        const btnConfirm = document.getElementById('btnConfirmarRetirada');
        if (btnConfirm) {
          btnConfirm.disabled = false;
          btnConfirm.textContent = 'Confirmar retirada';
        }
        mostrarTela('withdrawScreen');
      } else {
        mostrarTela('mainScreen');
      }
    } else {
      alert('❌ Erro ao retirar: ' + (resultado.error || 'Tente novamente'));
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    alert('❌ Erro de conexão. Verifique sua internet e tente novamente.');
  } finally {
    btn.textContent = textoOriginal;
    btn.disabled = false;
  }
}

// ============================================
// FUNÇÕES EXPORTADAS (mantidas para compatibilidade)
// ============================================

export function abrirRetirada(nomeItem) {
  // Para compatibilidade com chamadas antigas (ex: clicar em item em outras telas)
  const inputBusca = document.getElementById('itemBuscaRetirada');
  if (inputBusca && nomeItem) {
    inputBusca.value = nomeItem;
    const itemEncontrado = dadosEstoque.find(item => item[1] === nomeItem);
    if (itemEncontrado) {
      atualizarInterfacePorItemRetirada(itemEncontrado);
    }
  }
  mostrarTela('withdrawScreen');
}

export function initRetirada() {
  initQuantidadeRetirada();

  const buscaInput = document.getElementById('itemBuscaRetirada');
  if (buscaInput) {
    buscaInput.addEventListener('input', showItemBuscaSuggestionsRetirada);
    buscaInput.addEventListener('keydown', handleItemBuscaKeydownRetirada);
    document.addEventListener('click', (e) => {
      const suggestionBox = document.getElementById('itemBuscaRetiradaAutocompleteList');
      if (!buscaInput.contains(e.target) && suggestionBox && !suggestionBox.contains(e.target)) {
        suggestionBox.style.display = 'none';
      }
    });
  }

  const backBtn = document.getElementById('backFromWithdraw');
  if (backBtn) backBtn.addEventListener('click', () => mostrarTela('mainScreen'));

  const confirmBtn = document.getElementById('btnConfirmarRetirada');
  if (confirmBtn) confirmBtn.addEventListener('click', confirmarRetirada);
}