// estoque-app/js/login.js

import { setTecnicoAtual } from './state.js';
import { carregarEstoque } from './cache.js';
import { mostrarTela, mostrarTelaPrincipal } from './navigation.js';

export function initLogin() {
  const btnLogin = document.getElementById('btnLogin');
  if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
      const senha = document.getElementById('senhaEquipe').value;
      const pin = document.getElementById('pinTecnico').value;
      const errorDiv = document.getElementById('loginError');

      try {
        const response = await fetch('/api/validarLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senha, pin })
        });
        const data = await response.json();

        if (data.sucesso) {
          setTecnicoAtual(data.tecnicoNome);
          const nomeSpan = document.getElementById('tecnicoNome');
          if (nomeSpan) nomeSpan.textContent = data.tecnicoNome;
          await carregarEstoque();
          mostrarTelaPrincipal();
        } else {
          if (errorDiv) errorDiv.textContent = data.mensagem || 'Senha ou PIN inválidos';
        }
      } catch (error) {
        console.error('Erro ao validar login:', error);
        if (errorDiv) errorDiv.textContent = 'Erro de conexão. Tente novamente.';
      }
    });
  }

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      setTecnicoAtual(null);
      mostrarTela('loginScreen');
    });
  }
}