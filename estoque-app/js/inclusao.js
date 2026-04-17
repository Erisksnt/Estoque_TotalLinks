// estoque-app/js/inclusao.js

import { categoriasLista, dadosEstoque, tecnicoAtual } from './state.js';
import { mostrarTela } from './navigation.js';
import { API_URL } from './config.js';
import { CATEGORIAS_COM_PATRIMONIO } from './config.js';

// ============================================
// VARIÁVEIS DE CONTROLE
// ============================================
let currentFocus = -1;
let ultimoItemSelecionado = null; // Guarda o último item válido selecionado

// ============================================
// FUNÇÕES AUXILIARES (não exportadas)
// ============================================

function carregarCategoriasNoSelect() {
  const select = document.getElementById('categoriaInclusao');
  if (!select) return;
  select.innerHTML = '<option value="">Selecione uma categoria</option>';
  categoriasLista.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

// Renderiza os campos de patrimônio conforme a quantidade
function renderizarPatrimoniosInclusao() {
  const qtdeValor = document.getElementById('qtdeInclusaoValor');
  const qtde = qtdeValor ? parseInt(qtdeValor.textContent) : 1;
  const container = document.getElementById('patrimoniosInclusaoList');
  if (!container) return;
  
  console.log(`🔄 Renderizando ${qtde} campo(s) de patrimônio`);
  
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

// Verifica se o item selecionado precisa de patrimônio (baseado na categoria + unidade)
function itemPrecisaPatrimonio(categoria, itemNome) {
  if (!categoria || !itemNome) return false;
  
  const itemEncontrado = dadosEstoque.find(item => 
    item[0] === categoria && item[1] === itemNome
  );
  
  if (!itemEncontrado) return false;
  
  return CATEGORIAS_COM_PATRIMONIO.includes(itemEncontrado[0]) && itemEncontrado[2] === 'un';
}

// Mostra/esconde campo patrimônio baseado no item selecionado
function togglePatrimonioField(itemSelecionado = null) {
  const selectCategoria = document.getElementById('categoriaInclusao');
  const inputItem = document.getElementById('itemInclusao');
  const categoriaSelecionada = selectCategoria?.value || '';
  const itemNome = itemSelecionado || inputItem?.value.trim() || '';
  
  const patrimonioGroup = document.getElementById('patrimonioInclusaoGroup');
  
  // Se não tem categoria ou item, esconde patrimônio
  if (!categoriaSelecionada || !itemNome) {
    if (patrimonioGroup) patrimonioGroup.style.display = 'none';
    return;
  }
  
  const precisaPatrimonio = itemPrecisaPatrimonio(categoriaSelecionada, itemNome);
  
  if (patrimonioGroup) {
    if (precisaPatrimonio) {
      // Só atualiza se o item mudou ou se já está visível
      if (ultimoItemSelecionado !== itemNome) {
        ultimoItemSelecionado = itemNome;
        patrimonioGroup.style.display = 'block';
        renderizarPatrimoniosInclusao();
      } else if (patrimonioGroup.style.display === 'block') {
        // Se já está visível, apenas re-renderiza (para caso a quantidade tenha mudado)
        renderizarPatrimoniosInclusao();
      }
    } else {
      ultimoItemSelecionado = null;
      patrimonioGroup.style.display = 'none';
      const patrimonioList = document.getElementById('patrimoniosInclusaoList');
      if (patrimonioList) patrimonioList.innerHTML = '';
    }
  }
}

// Atualiza os campos de patrimônio quando a quantidade muda (se o item exigir patrimônio)
function atualizarPatrimonioPorQuantidade() {
  const categoria = document.getElementById('categoriaInclusao')?.value;
  const item = document.getElementById('itemInclusao')?.value.trim();
  
  console.log(`🔄 atualizarPatrimonioPorQuantidade - Categoria: ${categoria}, Item: ${item}`);
  
  if (categoria && item && itemPrecisaPatrimonio(categoria, item)) {
    const patrimonioGroup = document.getElementById('patrimonioInclusaoGroup');
    if (patrimonioGroup) {
      // Garante que o grupo está visível
      patrimonioGroup.style.display = 'block';
      // Força a re-renderização dos campos
      renderizarPatrimoniosInclusao();
    }
  }
}

// Controles de quantidade na tela de inclusão
function initQuantidadeInclusao() {
  const qtdeMenos = document.getElementById('qtdeInclusaoMenos');
  const qtdeMais = document.getElementById('qtdeInclusaoMais');
  const qtdeValor = document.getElementById('qtdeInclusaoValor');
  
  if (qtdeMenos) {
    qtdeMenos.addEventListener('click', () => {
      let val = parseInt(qtdeValor.textContent);
      if (val > 1) {
        qtdeValor.textContent = val - 1;
        console.log(`➖ Quantidade diminuída para: ${val - 1}`);
        atualizarPatrimonioPorQuantidade();
      }
    });
  }
  
  if (qtdeMais) {
    qtdeMais.addEventListener('click', () => {
      let val = parseInt(qtdeValor.textContent);
      qtdeValor.textContent = val + 1;
      console.log(`➕ Quantidade aumentada para: ${val + 1}`);
      atualizarPatrimonioPorQuantidade();
    });
  }
}

// Exibe sugestões de itens da categoria selecionada
function showItemSuggestions() {
  const input = document.getElementById('itemInclusao');
  const suggestionBox = document.getElementById('itemAutocompleteList');
  const categoria = document.getElementById('categoriaInclusao')?.value;
  
  if (!categoria || !input?.value.trim()) {
    if (suggestionBox) suggestionBox.style.display = 'none';
    return;
  }
  
  const termo = input.value.trim().toLowerCase();
  const itens = dadosEstoque
    .filter(item => item[0] === categoria)
    .map(item => item[1]);
  const itensUnicos = [...new Set(itens)];
  const sugestoes = itensUnicos.filter(nome => nome.toLowerCase().includes(termo));
  
  if (sugestoes.length === 0) {
    if (suggestionBox) suggestionBox.style.display = 'none';
    return;
  }
  
  if (suggestionBox) {
    suggestionBox.innerHTML = sugestoes.map(nome => `<div>${nome}</div>`).join('');
    suggestionBox.style.display = 'block';
    currentFocus = -1;
    
    const items = suggestionBox.querySelectorAll('div');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        const valorSelecionado = e.target.textContent;
        input.value = valorSelecionado;
        suggestionBox.style.display = 'none';
        // Após selecionar o item, verifica se precisa de patrimônio
        togglePatrimonioField(valorSelecionado);
      });
    });
  }
}

function handleItemKeydown(e) {
  const suggestionBox = document.getElementById('itemAutocompleteList');
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
      const valorSelecionado = items[currentFocus].textContent;
      document.getElementById('itemInclusao').value = valorSelecionado;
      suggestionBox.style.display = 'none';
      currentFocus = -1;
      togglePatrimonioField(valorSelecionado);
    }
  } else if (e.key === 'Escape') {
    suggestionBox.style.display = 'none';
    currentFocus = -1;
  }
}

function highlightSuggestion(items) {
  items.forEach((item, idx) => {
    if (idx === currentFocus) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

function limparFormulario() {
  const categoriaSelect = document.getElementById('categoriaInclusao');
  if (categoriaSelect) categoriaSelect.value = '';
  
  const itemInput = document.getElementById('itemInclusao');
  if (itemInput) itemInput.value = '';
  
  const qtdeValor = document.getElementById('qtdeInclusaoValor');
  if (qtdeValor) qtdeValor.textContent = '1';
  
  const patrimonioList = document.getElementById('patrimoniosInclusaoList');
  if (patrimonioList) patrimonioList.innerHTML = '';
  
  const obsInput = document.getElementById('obsInclusao');
  if (obsInput) obsInput.value = '';
  
  const patrimonioGroup = document.getElementById('patrimonioInclusaoGroup');
  if (patrimonioGroup) patrimonioGroup.style.display = 'none';
  
  const suggestionBox = document.getElementById('itemAutocompleteList');
  if (suggestionBox) suggestionBox.style.display = 'none';
  
  ultimoItemSelecionado = null;
}

function validarFormulario() {
  const categoria = document.getElementById('categoriaInclusao')?.value;
  const item = document.getElementById('itemInclusao')?.value.trim();
  const qtdeValor = document.getElementById('qtdeInclusaoValor');
  const quantidade = qtdeValor ? parseInt(qtdeValor.textContent) : 1;
  const precisaPatrimonio = itemPrecisaPatrimonio(categoria, item);
  const patrimonios = [];
  document.querySelectorAll('#patrimoniosInclusaoList input').forEach(input => {
    if (input.value.trim()) patrimonios.push(input.value.trim());
  });

  if (!categoria) { alert('Selecione uma categoria'); return false; }
  if (!item) { alert('Informe o nome do item'); return false; }

  const itemExiste = dadosEstoque.some(i => i[0] === categoria && i[1] === item);
  if (!itemExiste) {
    alert(`O item "${item}" não pertence à categoria "${categoria}". Verifique ou selecione um item da lista.`);
    return false;
  }

  if (!quantidade || quantidade <= 0) { alert('Informe uma quantidade válida'); return false; }
  if (precisaPatrimonio) {
    if (patrimonios.length !== quantidade) {
      alert(`Informe exatamente ${quantidade} patrimônio(s)`);
      return false;
    }
    const algumVazio = patrimonios.some(p => p === '');
    if (algumVazio) {
      alert('Preencha todos os patrimônios');
      return false;
    }
  }
  return true;
}

async function salvarInclusao() {
  if (!validarFormulario()) return;

  const patrimonios = [];
  document.querySelectorAll('#patrimoniosInclusaoList input').forEach(input => {
    if (input.value.trim()) patrimonios.push(input.value.trim());
  });

  const qtdeValor = document.getElementById('qtdeInclusaoValor');
  const quantidade = qtdeValor ? parseInt(qtdeValor.textContent) : 1;

  const dados = {
    action: 'registrarInclusao',
    categoria: document.getElementById('categoriaInclusao').value,
    item: document.getElementById('itemInclusao').value.trim(),
    quantidade: quantidade,
    patrimonio: patrimonios.join(', '),
    observacao: document.getElementById('obsInclusao').value.trim() || null,
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
      alert('✅ Item incluído com sucesso!');
      limparFormulario();
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
  carregarCategoriasNoSelect();
  initQuantidadeInclusao();
  
  const selectCategoria = document.getElementById('categoriaInclusao');
  if (selectCategoria) {
    selectCategoria.addEventListener('change', () => {
      // Limpa campos ao mudar categoria
      const itemInput = document.getElementById('itemInclusao');
      if (itemInput) itemInput.value = '';
      const suggestionBox = document.getElementById('itemAutocompleteList');
      if (suggestionBox) suggestionBox.style.display = 'none';
      // Esconde campo patrimônio
      const patrimonioGroup = document.getElementById('patrimonioInclusaoGroup');
      if (patrimonioGroup) patrimonioGroup.style.display = 'none';
      ultimoItemSelecionado = null;
    });
  }
  
  const itemInput = document.getElementById('itemInclusao');
  if (itemInput) {
    itemInput.addEventListener('input', showItemSuggestions);
    itemInput.addEventListener('keydown', handleItemKeydown);
    document.addEventListener('click', (e) => {
      const suggestionBox = document.getElementById('itemAutocompleteList');
      if (!itemInput.contains(e.target) && suggestionBox && !suggestionBox.contains(e.target)) {
        suggestionBox.style.display = 'none';
      }
    });
  }
  
  const backBtn = document.getElementById('backFromInclusao');
  if (backBtn) {
    backBtn.addEventListener('click', () => mostrarTela('mainScreen'));
  }
  
  const salvarBtn = document.getElementById('salvarInclusao');
  if (salvarBtn) {
    salvarBtn.addEventListener('click', salvarInclusao);
  }
}

export function refreshCategoriasInclusao() {
  carregarCategoriasNoSelect();
  
  const itemInput = document.getElementById('itemInclusao');
  if (itemInput) itemInput.value = '';
  
  const qtdeValor = document.getElementById('qtdeInclusaoValor');
  if (qtdeValor) qtdeValor.textContent = '1';
  
  const patrimonioList = document.getElementById('patrimoniosInclusaoList');
  if (patrimonioList) patrimonioList.innerHTML = '';
  
  const patrimonioGroup = document.getElementById('patrimonioInclusaoGroup');
  if (patrimonioGroup) patrimonioGroup.style.display = 'none';
  
  const suggestionBox = document.getElementById('itemAutocompleteList');
  if (suggestionBox) suggestionBox.style.display = 'none';
  
  ultimoItemSelecionado = null;
}