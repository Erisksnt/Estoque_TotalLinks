# Guia do Usuário - Estoque Total

Sistema de gestão de estoque para controle de materiais, retiradas e inclusões.

---

## 📱 Telas Principais

### 🏠 Home (Início)

A tela inicial apresenta:

- **Saudação** – Olá, [Nome do Técnico]
- **Indicadores** – Total de categorias e itens críticos
- **Busca rápida** – Campo para localizar itens pelo nome
- **Fluxo rápido** – Atalhos para as principais categorias
- **Estoque crítico** – Lista dos 5 itens mais urgentes (abaixo do mínimo)
- **Status de sincronização** – Online/Offline e última atualização

### 🔍 Buscar

- Digite o nome do item desejado
- Os resultados aparecem automaticamente à medida que você digita
- Clique no resultado para abrir a tela de retirada

### 📋 Recentes

- Exibe o histórico das últimas movimentações (retiradas e inclusões)
- Cada registro mostra: item, quantidade, técnico, data/hora e tipo (🔻 Retirada / 🟢 Inclusão)
- Limite de 50 movimentações

### ⚠️ Crítico

- Lista completa de todos os itens com estoque abaixo ou igual ao mínimo
- Itens são exibidos em ordem de criticidade (mais urgentes primeiro)
- Status disponíveis:
  - `ESGOTADO` – Estoque zerado (fundo vermelho)
  - `NO LIMITE` – Estoque igual ao mínimo (fundo amarelo)
  - `XX%` – Porcentagem crítica (fundo amarelo)

---

## 🔻 Retirada de Itens

1. **Acesse o item** – Clique no item desejado em qualquer lista (home, busca, categorias)
2. **Confirme a quantidade** – Use os botões `-` e `+` para ajustar
3. **Informe patrimônios** (se aplicável) – Para categorias que exigem, campos de patrimônio aparecem automaticamente
4. **Adicione observação** (opcional) – Motivo da retirada, local de instalação, etc.
5. **Confirme** – Clique em "Confirmar retirada"

> ⚠️ O sistema verifica se há estoque disponível antes de permitir a retirada.

---

## 🟢 Inclusão de Itens

1. **Acesse a tela de inclusão** – Clique no botão `+` (flutuante) no canto inferior direito da tela home
2. **Selecione a categoria** – Escolha a categoria do item no menu suspenso
3. **Selecione o item** – Digite ou escolha na lista de sugestões (apenas itens da categoria selecionada)
4. **Informe a quantidade** – Use os botões `-` e `+` para ajustar
5. **Informe patrimônios** (se aplicável) – Campos aparecem automaticamente conforme a quantidade
6. **Adicione observação** (opcional) – Motivo da inclusão
7. **Confirme** – Clique em "Confirmar inclusão"

> ✅ A inclusão aumenta o estoque do item e registra a movimentação no log.

---

## 🔐 Login

1. **Senha da equipe** – Senha geral da equipe (fornecida pelo administrador)
2. **PIN do técnico** – Código pessoal de 4 dígitos (fornecido pelo administrador)
3. Clique em **"Acessar"**

> 💡 A sessão permanece ativa mesmo se você recarregar a página. Para sair, clique em **"Sair"** no canto superior direito.

---

## 📊 Indicadores

| Indicador | O que significa |
|-----------|-----------------|
| Categorias | Total de categorias cadastradas no estoque |
| Críticos | Itens com estoque **abaixo do mínimo** (exclui zerados) |
| ESGOTADO | Item sem estoque disponível |
| NO LIMITE | Estoque exatamente igual ao mínimo |

---

## 🔄 Sincronização

- O sistema mantém um cache local do estoque por **5 minutos**
- Para forçar uma atualização manual, clique em **"Sincronizar agora"** no card de status
- O indicador de conexão mostra **Online** ou **Offline** conforme sua internet

---

## 📱 Navegação Inferior

| Ícone | Tela | Função |
|-------|------|--------|
| 🏠 | Início | Tela principal com resumo do estoque |
| 🔍 | Buscar | Localizar itens pelo nome |
| 📋 | Recentes | Histórico de movimentações |
| ⚠️ | Crítico | Todos os itens com estoque crítico |

---

## ❓ Dúvidas Frequentes

**Posso retirar mais itens do que o estoque disponível?**  
Não. O sistema bloqueia a retirada se a quantidade solicitada for maior que o estoque.

**O que acontece se eu perder a conexão?**  
O sistema continua funcionando com o cache local. Na próxima sincronização, os dados serão atualizados.

**Como sei se um item exige patrimônio?**  
Os campos de patrimônio aparecem automaticamente quando necessário.

**Posso editar uma movimentação depois de registrada?**  
Não. As movimentações são registros permanentes. Em caso de erro, faça uma nova movimentação para corrigir o estoque.

---

**Versão:** 1.0  
**Última atualização:** Abril/2026