# Estoque Pro - Sistema de Gestão de Estoque

Sistema completo de gestão de estoque com frontend responsivo e backend em Node.js integrado ao Google Sheets. Desenvolvido para controle de materiais, retiradas e inclusões com suporte a patrimônios.

## ✨ Funcionalidades

- 🔐 **Login seguro** – Senha da equipe + PIN do técnico (validado via backend)
- 📦 **Controle de estoque** – Visualização em tempo real com cache local (5 min)
- 🔻 **Retirada de itens** – Registro com quantidade, observação e patrimônios dinâmicos
- 🟢 **Inclusão de itens** – Adicionar itens de volta ao estoque com registro em log
- 🔍 **Busca rápida** – Filtro instantâneo por nome do item
- 📊 **Itens críticos** – Lista automática de itens com estoque abaixo do mínimo
- 📜 **Histórico unificado** – Movimentações (retiradas e inclusões) em uma única lista
- 💾 **Cache local** – Reduz chamadas à API, melhora performance offline
- 📱 **Design responsivo** – Interface adaptada para mobile e desktop
- 🏷️ **Patrimônios dinâmicos** – Campos de patrimônio aparecem conforme a quantidade e categoria do item

## 🏗️ Arquitetura

| Camada       | Tecnologia                          | Hospedagem                     |
|--------------|-------------------------------------|--------------------------------|
| Frontend     | HTML, CSS, JavaScript (modular)     | Vercel (via GitHub)            |
| Backend API  | Node.js (serverless functions)      | Vercel                         |
| Banco de Dados | Google Sheets (API v4)            | Google Drive                   |
| Autenticação | Service Account (Google Cloud)      | GCP + Vercel (env vars)        |

## 🚀 Deploy

### 1. Backend (Node.js na Vercel)

O backend já está incluso no repositório na pasta `/api`. As funções serverless são:

- `GET /api/proxy?action=getEstoque` – Busca estoque
- `GET /api/proxy?action=getTecnicos` – Busca técnicos
- `POST /api/proxy` – Registra retirada ou inclusão
- `POST /api/validarLogin` – Valida login

### 2. Google Sheets (Configuração)

1. Crie uma planilha com as seguintes abas:
   - `CVS` – Estoque principal (colunas: Categoria, Item, Unidade, Quantidade, Mínimo)
   - `TECNICOS` – Com Tecnicos que acessarão
   - `LOG_RETIRADAS` – Log automático de retiradas
   - `LOG_INCLUIDOS` – Log automático de inclusões

2. Compartilhe a planilha com o email da Service Account (criada no passo 3)

### 3. Service Account (Google Cloud)

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto e ative a **Google Sheets API**
3. Crie uma **Service Account** e gere uma chave JSON
4. Copie o conteúdo do JSON para a variável de ambiente `GOOGLE_SERVICE_ACCOUNT_KEY`

### 4. Vercel (Deploy do Frontend)

1. Conecte o repositório à [Vercel](https://vercel.com)
2. Adicione as variáveis de ambiente:
   - `SENHA` – Senha de acesso da equipe (ex: '`Teste`')
   - `GOOGLE_SERVICE_ACCOUNT_KEY` – Conteúdo do JSON da Service Account
3. Faça o deploy – a Vercel detectará automaticamente os arquivos estáticos e as serverless functions

A cada `git push` na branch `main`, a Vercel fará um novo deploy automático.

## 💻 Desenvolvimento Local

### Pré-requisitos
- Node.js (v18 ou superior)
- Navegador (Chrome recomendado)
- Arquivo `service-account-key.json` (da Service Account) na raiz do projeto

### Passo a passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/Erisksnt/Estoque_Totallinks.git
   cd Estoque_CSV
   ```
2. **Instale as dependências**

    ```bash
    npm install
    ```
3. **Configure as variáveis de ambiente**
    Crie um arquivo .env.local na raiz e configure as variaveis que serão utilizadas para acesso.

4. **Execute o servidor de desenvolvimento**

5. **Acesse o sistema**

- Frontend: http://localhost:3000

# 📁 Estrutura do Projeto

    Estoque_Totallinks/
    ├── api/ # Backend serverless (Node.js)
    │ ├── proxy.js # Roteador principal das APIs
    │ ├── sheets.js # Integração com Google Sheets API
    │ └── validarLogin.js # Validação de login
    ├── estoque-app/ # Frontend modular
    │ ├── css/
    │ │ └── style.css # Estilos responsivos
    │ ├── js/ # Módulos JavaScript
    │ │ ├── app.js # Ponto de entrada
    │ │ ├── config.js # Configurações 
    │ │ ├── state.js # Estado global
    │ │ ├── api.js # Chamadas à API
    │ │ ├── cache.js # Gerenciamento de cache
    │ │ ├── login.js # Login/logout
    │ │ ├── navigation.js # Navegação entre telas
    │ │ ├── categories.js # Categorias e listagem
    │ │ ├── withdrawal.js # Retirada de itens
    │ │ ├── inclusao.js # Inclusão de itens
    │ │ ├── search.js # Busca de itens
    │ │ ├── recentes.js # Histórico de movimentações
    │ │ ├── sync.js # Sincronização manual
    │ │ └── ui-helpers.js # Funções de UI compartilhadas
    │ └── index.html # Estrutura HTML das telas
    ├── Guia-Usuario.md # Um guia de como usar 
    ├── .gitignore
    ├── package.json # Dependências (googleapis, etc.)
    ├── vercel.json # Configuração de rotas da Vercel
    └── README.md # Este arquivo


## 🔧 Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript ES Modules
- **Backend:** Node.js, Google Sheets API v4, Google Auth Library
- **Infraestrutura:** Vercel (serverless functions + static hosting)
- **Integração:** Service Account (Google Cloud)

## 📝 Licença

Este projeto é privado e de uso interno da equipe de suporte técnico.

## 👨‍💻 Autor

Erick Santos - Total Links