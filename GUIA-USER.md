# Guia do Usuário - Estoque Total

Sistema de gestão de estoque para controle de materiais, retiradas, inclusões, devoluções e solicitações de compra.

---

## 🚀 Acesso e Navegação

### 🔐 Login

1. **Senha da equipe** – Senha geral
2. **PIN do técnico** – Código pessoal
3. Clique em **"Acessar"**

### 📱 Menu Lateral (☰)

- Clique no ícone **☰** no canto superior esquerdo para abrir o menu.
- Opções disponíveis conforme seu perfil:

| Perfil Técnico | Perfil Administrador |
|----------------|----------------------|
| Início | Início |
| Retirar Equipamento | Retirar Equipamento |
| Incluir Equipamento | Incluir Equipamento |
| Movimentações Recentes | Movimentações Recentes |
| Devolver Equipamento | Devolver Equipamento |
| Solicitar Compra | Solicitar Compra |
| Sair | Itens Críticos |

---

## 📱 Telas Principais

### 🏠 Home (Início)

- **Indicadores** (apenas administrador) – Total de categorias e itens críticos
- **Busca rápida** – Localiza itens pelo nome
- **Fluxo rápido** – Atalhos para as principais categorias
- **Estoque crítico** (apenas administrador) – Itens mais urgentes
- **Status de sincronização** – Online/Offline e última atualização

### 📋 Movimentações Recentes

- Histórico de retiradas e inclusões (🔻 Retirada / 🟢 Inclusão)
- Mostra item, quantidade, técnico, data/hora e observação
- Limite de 50 registros

### ⚠️ Itens Críticos (apenas administrador)

- Lista completa de itens com estoque ≤ mínimo
- Ordenados por criticidade (mais urgentes primeiro)
- Status: `ESGOTADO` (vermelho), `NO LIMITE` (amarelo) ou `XX%` (amarelo)

### 📦 Estoque (apenas administrador)

- Visão completa do estoque: equipamentos em almoxarifado e equipamentos com técnicos.
- Abas: **Estoque** (itens no almoxarifado) e **Técnicos** (itens retirados com técnicos).
- Campo de busca para filtrar por nome ou patrimônio.

---

## 🔻 Retirada de Itens

1. **Acesse o item** – Clique em qualquer item (home, busca, categorias) ou use o menu lateral → "Retirar Equipamento"
2. **Confirme a quantidade** – Botões `-` e `+`
3. **Informe patrimônios** (se aplicável) – Campos aparecem automaticamente
4. **Destino** – Obrigatório:
   - **Cliente** → informe o nome do cliente
   - **Técnico (manutenção/precaução)** → equipamento fica com o técnico
5. **Adicione observação** (opcional)
6. **Confirme** – Após a retirada, será perguntado se deseja retirar outro item.

> ⚠️ O sistema verifica estoque disponível antes de permitir a retirada.

---

## 🟢 Inclusão de Itens

1. Menu lateral → **"Incluir Equipamento"**
2. **Busque o item** – Digite o nome (autocomplete em todo estoque)
3. **Categoria** – Preenchida automaticamente
4. **Quantidade** – Botões `-` e `+`
5. **Patrimônios** (se exigido) – Um campo por unidade
6. **Observação** (opcional)
7. **Confirme** – Ao final, perguntará se deseja incluir outro item.

> ✅ A inclusão aumenta o estoque e registra o log.

---

## 🔄 Devolução de Equipamentos

> **Apenas para técnicos** – devolver equipamentos que estavam com você.

1. Menu lateral → **"Devolver Equipamento"**
2. Selecione **um ou mais equipamentos** (pressione Ctrl/Cmd para múltiplos)
3. Adicione **observação** (opcional)
4. Clique em **"Confirmar devolução"**
5. Os equipamentos são removidos da sua lista, o estoque é atualizado e o status na planilha de controle muda para "DEVOLVIDO".

---

## 🛒 Solicitação de Compra

> Para técnicos e administradores – solicitar a compra de itens em falta.

1. Menu lateral → **"Solicitar Compra"**
2. Descreva os itens necessários no campo **Itens** (um por linha ou texto livre)
3. Adicione **observação** (opcional, ex: urgência)
4. Clique em **"Enviar Solicitação"**
5. A solicitação é registrada na planilha `SOLICITACOES_COMPRA` com status **"Pendente"**.
6. O administrador poderá visualizar e atender a solicitação.

---

## 🔄 Sincronização

- Cache local do estoque por **5 minutos**.
- Para atualizar manualmente, clique em **"Sincronizar agora"** no card de status.
- Indicador **Online/Offline** mostra o estado da conexão.

---

## ❓ Dúvidas Frequentes

**Posso retirar mais itens que o disponível?**  
Não. O sistema bloqueia.

**E se a internet cair?**  
O cache local mantém os dados; na próxima sincronização, as informações são atualizadas.

**Como sei se um item exige patrimônio?**  
Os campos de patrimônio aparecem automaticamente quando necessário.

**Posso editar uma movimentação após registrada?**  
Não. As movimentações são permanentes. Corrija com uma nova movimentação (ex: inclusão para ajustar estoque).

**O que acontece ao devolver um equipamento?**  
Ele é removido da lista de equipamentos com técnicos, o estoque é aumentado e registrado no log de inclusões.

**O administrador pode ver as solicitações de compra?**  
Sim, diretamente na planilha `SOLICITACOES_COMPRA` do Google Sheets (acesso exclusivo).

---

**Versão:** 2.0  
**Última atualização:** Maio/2026  
**Principais novidades:** Devolução múltipla, solicitação de compra, menu lateral, tela de estoque para administrador.