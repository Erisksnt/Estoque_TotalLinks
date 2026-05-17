// estoque-app/js/devolucao.js
import { mostrarTela } from './navigation.js';
import { tecnicoAtual, atualizarBadgeGlobal } from './state.js';
import { API_URL } from './config.js';

let equipamentoSelecionado = null;

export async function carregarEquipamentosDevolucao() {
  const select = document.getElementById('selectEquipamentoDevolucao');
  if (!select) {
    console.error('Elemento selectEquipamentoDevolucao não encontrado');
    return;
  }

  if (!tecnicoAtual) {
    select.innerHTML = '<option>Aguardando técnico...</option>';
    setTimeout(carregarEquipamentosDevolucao, 500);
    return;
  }

  select.innerHTML = '<option>Carregando...</option>';
  try {
    const url = `/api/proxy?action=getEquipamentosComTecnico&tecnico=${encodeURIComponent(tecnicoAtual)}`;
    const response = await fetch(url);
    const resultado = await response.json();

    if (!resultado.success || !resultado.data || resultado.data.length === 0) {
      select.innerHTML = '<option>Nenhum equipamento pendente com você</option>';
      equipamentoSelecionado = null;
      return;
    }

    select.innerHTML = '';
    resultado.data.forEach(eq => {
      const option = document.createElement('option');
      option.value = eq.item;
      option.dataset.patrimonio = eq.patrimonio || '';
      option.dataset.linha = eq.linhaIndex;
      option.textContent = `${eq.item} - ${eq.patrimonio || 'sem patrimônio'}`;
      select.appendChild(option);
    });

    const primeiro = resultado.data[0];
    equipamentoSelecionado = {
      item: primeiro.item,
      patrimonio: primeiro.patrimonio,
      linha: primeiro.linhaIndex
    };

    select.addEventListener('change', () => {
      const selected = select.options[select.selectedIndex];
      equipamentoSelecionado = {
        item: selected.value,
        patrimonio: selected.dataset.patrimonio,
        linha: parseInt(selected.dataset.linha)
      };
    });
  } catch (error) {
    console.error(error);
    select.innerHTML = '<option>Erro ao carregar dados</option>';
  }
}

async function confirmarDevolucao() {
  if (!equipamentoSelecionado) {
    alert('Selecione um equipamento');
    return;
  }
  const observacao = document.getElementById('obsDevolucao').value.trim();
  const dados = {
    action: 'registrarDevolucao',
    itemNome: equipamentoSelecionado.item,
    quantidade: 1,
    patrimonio: equipamentoSelecionado.patrimonio,
    linhaId: equipamentoSelecionado.linha,
    observacao: observacao || null,
    tecnico: tecnicoAtual
  };
  const btn = document.getElementById('btnConfirmarDevolucao');
  const textoOriginal = btn.textContent;
  btn.textContent = 'Processando...';
  btn.disabled = true;
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const resultado = await response.json();

    if (resultado.success) {
      await atualizarBadgeGlobal();
      await carregarEquipamentosDevolucao(); // recarrega a lista
      document.getElementById('obsDevolucao').value = '';

      const continuar = confirm('✅ Equipamento devolvido com sucesso!\n\nDeseja devolver outro equipamento?');
      if (continuar) {
        mostrarTela('devolucaoScreen');
      } else {
        mostrarTela('mainScreen');
      }
    } else {
      alert('❌ Erro ao devolver: ' + (resultado.error || 'Tente novamente'));
    }
  } catch (error) {
    console.error(error);
    alert('❌ Erro de conexão. Verifique sua internet e tente novamente.');
  } finally {
    btn.textContent = textoOriginal;
    btn.disabled = false;
  }
}

export function initDevolucao() {
  const backBtn = document.getElementById('backFromDevolucao');
  if (backBtn) backBtn.addEventListener('click', () => mostrarTela('mainScreen'));
  const confirmBtn = document.getElementById('btnConfirmarDevolucao');
  if (confirmBtn) confirmBtn.addEventListener('click', confirmarDevolucao);
  carregarEquipamentosDevolucao();
}