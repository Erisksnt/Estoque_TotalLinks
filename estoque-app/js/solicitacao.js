// estoque-app/js/solicitacao.js
import { mostrarTela } from './navigation.js';
import { tecnicoAtual } from './state.js';
import { API_URL } from './config.js';

async function enviarSolicitacao() {
  const itens = document.getElementById('itensSolicitacao').value.trim();
  const observacao = document.getElementById('obsSolicitacao').value.trim();
  if (!itens) {
    alert('Informe os itens necessários');
    return;
  }
  const btn = document.getElementById('btnEnviarSolicitacao');
  const textoOriginal = btn.textContent;
  btn.textContent = 'Enviando...';
  btn.disabled = true;
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'registrarSolicitacao',
        tecnico: tecnicoAtual,
        itens,
        observacao
      })
    });
    const resultado = await response.json();
    if (resultado.success) {
      alert('✅ Solicitação enviada com sucesso!');
      limparFormulario();
      mostrarTela('mainScreen');
    } else {
      alert('❌ Erro ao enviar: ' + (resultado.error || 'Tente novamente'));
    }
  } catch (error) {
    console.error(error);
    alert('❌ Erro de conexão');
  } finally {
    btn.textContent = textoOriginal;
    btn.disabled = false;
  }
}

function limparFormulario() {
  document.getElementById('itensSolicitacao').value = '';
  document.getElementById('obsSolicitacao').value = '';
}

export function initSolicitacao() {
  const backBtn = document.getElementById('backFromSolicitacao');
  if (backBtn) backBtn.addEventListener('click', () => mostrarTela('mainScreen'));
  const btnEnviar = document.getElementById('btnEnviarSolicitacao');
  if (btnEnviar) btnEnviar.addEventListener('click', enviarSolicitacao);
}