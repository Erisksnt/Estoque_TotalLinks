import { setTecnicoAtual } from './state.js';
import { carregarEstoque } from './cache.js';
import { mostrarTela, mostrarTelaPrincipal } from './navigation.js';
import { atualizarBadgeGlobal } from './state.js';   // ← adicionar

export function initLogin() {
  const btnLogin = document.getElementById('btnLogin');
  if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
      const senha = document.getElementById('senhaEquipe').value;
      const pin = document.getElementById('pinTecnico').value;
      const errorDiv = document.getElementById('loginError');
      
      const textoOriginal = btnLogin.textContent;
      btnLogin.textContent = 'Processando...';
      btnLogin.disabled = true;

      try {
        const response = await fetch('/api/validarLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senha, pin })
        });
        const data = await response.json();

        if (data.sucesso) {
          setTecnicoAtual(data.tecnicoNome, data.perfil);
          await atualizarBadgeGlobal();
          const nomeSpan = document.getElementById('tecnicoNome');
          if (nomeSpan) nomeSpan.textContent = data.tecnicoNome;
          await carregarEstoque();
          mostrarTelaPrincipal();
        } else {
          if (errorDiv) errorDiv.textContent = data.mensagem || 'Senha ou PIN inválidos';
          btnLogin.textContent = textoOriginal;
          btnLogin.disabled = false;
        }
      } catch (error) {
        console.error('Erro ao validar login:', error);
        if (errorDiv) errorDiv.textContent = 'Erro de conexão. Tente novamente.';
        btnLogin.textContent = textoOriginal;
        btnLogin.disabled = false;
      }
    });
  }

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      setTecnicoAtual(null);
      
      const btnLogin = document.getElementById('btnLogin');
      if (btnLogin) {
        btnLogin.textContent = 'Acessar';
        btnLogin.disabled = false;
      }
      
      const senhaInput = document.getElementById('senhaEquipe');
      const pinInput = document.getElementById('pinTecnico');
      const errorDiv = document.getElementById('loginError');
      if (senhaInput) senhaInput.value = '';
      if (pinInput) pinInput.value = '';
      if (errorDiv) errorDiv.textContent = '';
      
      mostrarTela('loginScreen');
    });
  }
}