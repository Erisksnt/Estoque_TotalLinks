// estoque-app/js/devolucao.js
import { mostrarTela } from './navigation.js';
import { tecnicoAtual, atualizarBadgeGlobal } from './state.js';
import { API_URL } from './config.js';

let equipamentoSelecionado = null; // (não usado mais, mas mantido)

export async function carregarEquipamentos() {
  const select = document.getElementById('selectEquipamentoDevolucao');
  if (!select) {
    console.error('Elemento selectEquipamentoDevolucao não encontrado');
    return;
  }

  if (!tecnicoAtual) {
    select.innerHTML = '<option>Aguardando técnico...</option>';
    setTimeout(carregarEquipamentos, 500);
    return;
  }

  select.innerHTML = '<option>Carregando...</option>';
  try {
    const url = `/api/proxy?action=getEquipamentosComTecnico&tecnico=${encodeURIComponent(tecnicoAtual)}`;
    const response = await fetch(url);
    const resultado = await response.json();

    if (!resultado.success || !resultado.data || resultado.data.length === 0) {
      select.innerHTML = '<option>Nenhum equipamento pendente com você</option>';
      return;
    }

    select.innerHTML = '';
    resultado.data.forEach(eq => {
      const option = document.createElement('option');
      option.value = eq.item;
      option.dataset.patrimonio = eq.patrimonio || '';
      option.dataset.linha = eq.linhaIndex;
      option.textContent = `${eq.item} - PAT: ${eq.patrimonio || 'sem patrimônio'}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error(error);
    select.innerHTML = '<option>Erro ao carregar dados</option>';
  }
}

async function confirmarDevolucao() {
  const select = document.getElementById('selectEquipamentoDevolucao');
  const selectedOptions = Array.from(select.selectedOptions);
  if (selectedOptions.length === 0) {
    alert('Selecione pelo menos um equipamento para devolver');
    return;
  }

  const equipamentos = selectedOptions.map(opt => ({
    itemNome: opt.value,
    patrimonio: opt.dataset.patrimonio,
    linhaId: parseInt(opt.dataset.linha)
  }));

  const observacao = document.getElementById('obsDevolucao').value.trim();
  const dados = {
    action: 'registrarDevolucaoMultipla',
    equipamentos,
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
      alert(`✅ ${resultado.devolvidos} equipamento(s) devolvido(s) com sucesso!`);
      await atualizarBadgeGlobal();
      await carregarEquipamentos(); // recarrega a lista
      document.getElementById('obsDevolucao').value = '';

      const continuar = confirm('Deseja devolver mais equipamentos?');
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
    alert('❌ Erro de conexão');
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
  carregarEquipamentos();
}