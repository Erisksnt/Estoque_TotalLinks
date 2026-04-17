// estoque-app/js/withdrawal.js

import { dadosEstoque, itemAtual, tecnicoAtual, setItemAtual, setTelaAnterior, addMovimentacaoRecente } from './state.js';
import { apiRegistrarRetirada } from './api.js';
import { carregarEstoque } from './cache.js';
import { mostrarTela, mostrarTelaPrincipal } from './navigation.js';
import { CATEGORIAS_COM_PATRIMONIO } from './config.js';

// Abre a tela de retirada para um item específico
export function abrirRetirada(nomeItem) {
  // Guarda a tela ativa antes de abrir a retirada
  const telas = ['mainScreen', 'itemsScreen', 'searchScreen', 'recentesScreen', 'criticosScreen'];
  for (let tela of telas) {
    const el = document.getElementById(tela);
    if (el && el.classList.contains('active')) {
      setTelaAnterior(tela);
      break;
    }
  }
  
  const item = dadosEstoque.find(item => item[1] === nomeItem);
  if (!item) return;
  setItemAtual(item);
  
  const withdrawItemName = document.getElementById('withdrawItemName');
  const withdrawItemStock = document.getElementById('withdrawItemStock');
  
  if (withdrawItemName) withdrawItemName.textContent = item[1];
  if (withdrawItemStock) withdrawItemStock.innerHTML = `Estoque atual: ${item[3]} ${item[2]} | Mínimo: ${item[4]} ${item[2]}`;
  
  const qtdeValor = document.getElementById('qtdeValor');
  if (qtdeValor) qtdeValor.textContent = '1';
  
  const observacao = document.getElementById('observacao');
  if (observacao) observacao.value = '';
  
  const withdrawError = document.getElementById('withdrawError');
  if (withdrawError) withdrawError.textContent = '';
  
  const precisaPatrimonio = CATEGORIAS_COM_PATRIMONIO.includes(item[0]) && item[2] === 'un';
  const containerPatri = document.getElementById('patrimoniosContainer');
  
  if (containerPatri) {
    containerPatri.style.display = precisaPatrimonio ? 'block' : 'none';
    if (precisaPatrimonio) renderizarPatrimonios();
  }
  
  mostrarTela('withdrawScreen');
}

// Renderiza os campos de patrimônio conforme a quantidade
function renderizarPatrimonios() {
  const qtdeValor = document.getElementById('qtdeValor');
  const qtde = qtdeValor ? parseInt(qtdeValor.textContent) : 1;
  const container = document.getElementById('patrimoniosList');
  const addBtn = document.getElementById('addPatrimonio');
  
  if (!container) return;
  
  if (addBtn) {
    addBtn.style.display = 'none';
  }
  
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

// Inicializa os controles da tela de retirada (quantidade, confirmação)
export function initRetirada() {
  // Botão de diminuir quantidade
  const qtdeMenos = document.getElementById('qtdeMenos');
  if (qtdeMenos) {
    qtdeMenos.addEventListener('click', () => {
      const qtdeValor = document.getElementById('qtdeValor');
      let val = qtdeValor ? parseInt(qtdeValor.textContent) : 1;
      if (val > 1) {
        if (qtdeValor) qtdeValor.textContent = val - 1;
        const containerPatri = document.getElementById('patrimoniosContainer');
        if (containerPatri && containerPatri.style.display === 'block') renderizarPatrimonios();
      }
    });
  }

  // Botão de aumentar quantidade
  const qtdeMais = document.getElementById('qtdeMais');
  if (qtdeMais) {
    qtdeMais.addEventListener('click', () => {
      const qtdeValor = document.getElementById('qtdeValor');
      let val = qtdeValor ? parseInt(qtdeValor.textContent) : 1;
      const maxEstoque = Number(itemAtual?.[3]) || 0;
      if (val < maxEstoque) {
        if (qtdeValor) qtdeValor.textContent = val + 1;
        const containerPatri = document.getElementById('patrimoniosContainer');
        if (containerPatri && containerPatri.style.display === 'block') renderizarPatrimonios();
      } else {
        const withdrawError = document.getElementById('withdrawError');
        if (withdrawError) withdrawError.textContent = `Máximo disponível: ${maxEstoque}`;
        setTimeout(() => {
          if (withdrawError) withdrawError.textContent = '';
        }, 3000);
      }
    });
  }

  // Botão confirmar retirada
  const btnConfirmar = document.getElementById('btnConfirmar');
  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', async () => {
      const qtdeValor = document.getElementById('qtdeValor');
      const quantidade = qtdeValor ? parseInt(qtdeValor.textContent) : 1;
      const observacao = document.getElementById('observacao');
      const obsValue = observacao ? observacao.value : '';
      
      const patrimonios = [];
      document.querySelectorAll('#patrimoniosList input').forEach(input => {
        if (input.value.trim()) patrimonios.push(input.value.trim());
      });
      
      const precisaPatrimonio = document.getElementById('patrimoniosContainer').style.display === 'block';
      const withdrawError = document.getElementById('withdrawError');
      
      if (precisaPatrimonio && patrimonios.length !== quantidade) {
        if (withdrawError) withdrawError.textContent = `Informe exatamente ${quantidade} patrimônio(s)`;
        return;
      }
      
      if (precisaPatrimonio) {
        const algumVazio = patrimonios.some(p => p === '');
        if (algumVazio) {
          if (withdrawError) withdrawError.textContent = `Preencha todos os patrimônios`;
          return;
        }
      }
      
      const btn = document.getElementById('btnConfirmar');
      if (btn) {
        btn.textContent = 'Processando...';
        btn.disabled = true;
      }
      
      const resultado = await apiRegistrarRetirada({
        action: 'registrarRetirada',
        itemNome: itemAtual[1],
        quantidade: quantidade,
        tecnico: tecnicoAtual,
        observacao: obsValue,
        patrimonios: patrimonios
      });
      
      if (resultado.success) {
        addMovimentacaoRecente({ 
          tipo: 'retirada',
          item: itemAtual[1], 
          quantidade: quantidade, 
          data: new Date().toLocaleString(), 
          tecnico: tecnicoAtual 
        });
        alert(`✅ Retirada registrada!\nItem: ${itemAtual[1]}\nQuantidade: ${quantidade}`);
        await carregarEstoque(true);
        mostrarTelaPrincipal();
      } else {
        if (withdrawError) withdrawError.textContent = resultado.error;
      }
      
      if (btn) {
        btn.textContent = 'Confirmar retirada';
        btn.disabled = false;
      }
    });
  }
}