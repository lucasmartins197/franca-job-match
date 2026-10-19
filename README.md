# FreLa — marketplace de freelancers presenciais em Franca/SP

## Configuração do banco (obrigatório)

1. O schema (11 tabelas) já está no Supabase `modnamtaatcafqtjfzsd`.
2. **Rode uma vez no SQL Editor** o arquivo
   `supabase/migrations/20261016120000_fase1_automacoes.sql`.
   Ele não cria tabelas — só adiciona triggers que o app precisa:
   - notificações (candidatura, confirmação, finalização, avaliação) — o RLS não deixa o app inserir em `notificacoes`;
   - média de avaliações no perfil de quem recebeu (`avaliacao_media` / `total_avaliacoes`);
   - trava no banco: empresa não cria vaga com contratação `em_andamento`;
   - realtime da tabela `notificacoes` (sino atualiza na hora).
3. **Fase 2 — rode também, nesta ordem:**
   - `supabase/migrations/20261017120000_fase2_perfil.sql` — colunas `instagram`/`linkedin` em `profissional_dados`, bucket `avatars` (fotos) com policies, funções de histórico de trabalhos;
   - `supabase/migrations/20261018120000_fase2_chat.sql` — validação de mensagens, notificação de nova mensagem, realtime de `mensagens`.
4. **Fase 3 — rode:** `supabase/migrations/20261019120000_fase3.sql` (selos/ADM/demo no perfil + proteção desses campos, bio e lat/long da empresa, `portfolio_fotos`, `suporte_mensagens`, `admin_set_verificado`). Depois defina os ADMs:
   ```sql
   update public.profiles set is_admin = true where email in ('email-do-lucas@...', 'email-do-socio@...');
   ```
5. **Fase 4 — rode:** `supabase/migrations/20261020120000_fase4_taxas.sql` (sistema de taxas de 5%: confirmação de valor pelo profissional, saldo, trava no teto de R$ 50, divergências, quitação pelo ADM, cancelamento de vaga). Para mudar o teto ou a porcentagem: `frela_teto_taxas()` / `frela_taxa_percentual()` no SQL e `TETO_TAXAS` / `TAXA_PLATAFORMA` em `src/lib/pagamentos.ts`.
6. **Fase 5 — rode:** `supabase/migrations/20261021120000_fase5_gestao.sql` (funções do painel de gestão, colunas de destaque/selos/metas/indicação). Depois disso, o painel fica em **`/gestao`** (só para `is_admin = true`).
7. **Auth → URL Configuration:** coloque a URL do app em *Site URL* e adicione em *Redirect URLs* `<url-do-app>/auth` (confirmação de email) e `<url-do-app>/redefinir-senha` (esqueci minha senha).
8. As migrations antigas (`20260324…`, `20260404…`, `20260618…`) são do projeto Supabase anterior — **não rode** no FreLa.

## Dados de demonstração (apresentação)

- **Popular:** rode `supabase/demo/seed_demo.sql` (6 empresas, 6 profissionais com foto e portfólio, 10 vagas abertas, 20 trabalhos finalizados com avaliações, candidaturas). As datas são relativas a hoje — rode na véspera.
- **Logins demo** (senha `demo1234`): `bar@demo.frela` (empresa), `ana@demo.frela` (profissional); outros: `calcados@`, `ecommerce@`, `cantina@`, `mercado@`, `eventos@`, `carlos@`, `juliana@`, `rafael@`, `mariana@`, `diego@` — todos `@demo.frela`.
- **Limpar:** rode `supabase/demo/seed_demo_LIMPAR.sql`. Remove tudo de usuários `@demo.frela` / `is_demo` (e interações de usuários reais com dados demo), sem tocar no resto.

## Pagamentos (preparado, desativado)

Ver `src/lib/pagamentos.ts`: mensalidade via IAP (App Store/Google Play) e quitação das taxas via Stripe (Pix/cartão) com baixa pelo webhook chamando `frela_quitar_taxas` — pontos de integração marcados com `TODO`. Nada é cobrado hoje; o ADM pode registrar pagamentos recebidos manualmente em `/admin/taxas`.

### Ciclo da taxa de 5%
1. Empresa confirma a finalização **declarando o valor pago** → taxa = 5% (status `pendente`).
2. Profissional **confirma** (`confirmada`) ou **contesta** (`em_divergencia`, fora do saldo até um ADM resolver).
3. Saldo = `pendente` + `confirmada` não pagas. **Saldo ≥ R$ 50 → trava**: sem novas vagas e sem confirmar finalizações (garantido no banco).
4. Renovação da assinatura só com zero taxas em aberto.
5. Quitação → `paga` (hoje manual pelo ADM; depois automática pelo Stripe).

## Rotas

| Rota | Quem | O quê |
|---|---|---|
| `/auth` | todos | cadastro (empresa/profissional) e login |
| `/` | profissional | feed, busca, trabalhos (candidaturas + contratações), chat (Fase 2), perfil |
| `/dashboard` | empresa | painel, trava, contratações em andamento, minhas vagas por status |
| `/job/:id` | todos | detalhe da vaga / candidatar-se |
| `/job/:id/candidates` | empresa | candidatos → aceitar/recusar |
| `/contratacao/:id` | as duas partes | confirmar finalização, avaliações |
| `/notificacoes` | todos | lista, marcar como lida |
| `/profile` | empresa | meu perfil (o profissional usa a aba Perfil) |
| `/completar-perfil` | todos | obrigatório após o cadastro (foto + campos essenciais) |
| `/perfil/editar` | todos | editar meu perfil |
| `/perfil/:id` | todos | perfil público (currículo do profissional / perfil da empresa) |
| `/chat` | todos | lista de conversas (uma por contratação) |
| `/chat/:id` | as duas partes | conversa em tempo real |
| `/taxas` | empresa | saldo da taxa de 5%, teto, histórico, "Quitar" (em breve) |
| `/admin/taxas` | ADM | divergências de valor e saldos por empresa (registrar pagamento) |
| `/gestao` | ADM | painel de gestão: visão geral, financeiro, empresas, profissionais, crescimento, operação (tudo exporta para Excel) |
| `/gestao/usuario/:id` | ADM | tudo sobre um usuário + promover/selos/meta |
| `/redefinir-senha` | todos | destino do link "esqueci minha senha" |
| `/planos` | todos | planos e modelo de receita ("assinar" → em breve) |
| `/suporte` | todos | chat com a equipe FreLa |
| `/admin/suporte` | ADM | chamados de suporte; `/admin/suporte/:userId` responde |

---

# Franca Jobs Now

Criar aplicativo Freelancer Franca

Crie um aplicativo mobile-first chamado Freelancer Franca.

O objetivo é criar um marketplace de freelancers da cidade de Franca, São Paulo (Brasil) que conecta empresas locais com trabalhadores freelancers para trabalhos por turno ou temporários.

O aplicativo deve funcionar parecido com:

Uber (match de trabalhadores)

iFood (publicação de demandas)

GetNinjas (profissionais por habilidade)

Mas focado em trabalhos presenciais rápidos dentro da cidade de Franca SP.

1 CONTEXTO DO PRODUTO

A cidade de Franca SP possui mais de 70 mil empresas ativas e forte atividade em:

comércio varejista

bares e restaurantes

indústria de calçados

logística

serviços

construção civil

beleza e estética

Empresas frequentemente precisam de trabalhadores temporários, como:

garçom

vendedor

caixa

promotor

segurança

recepcionista

auxiliar de cozinha

carregador

atendente

Hoje essas vagas são preenchidas via:

WhatsApp

indicação

grupos informais

O aplicativo resolverá esse problema conectando:

freelancers disponíveis
com
empresas que precisam de pessoas em datas específicas.

2 IMPORTAÇÃO AUTOMÁTICA DE EMPRESAS DE FRANCA (FEATURE IMPORTANTE)

O sistema deve automaticamente popular o banco de dados com empresas reais da cidade de Franca.

Criar um processo automático de coleta de empresas locais.

Fontes possíveis:

Google Maps API

OpenStreetMap

dados públicos de empresas (CNPJ / CNAE)

diretórios empresariais

APIs de geolocalização

Processo:

Buscar empresas dentro do raio da cidade de Franca SP Brasil

Coletar:

nome da empresa
categoria
endereço
bairro
telefone (se disponível)
website (se disponível)

Salvar no banco de dados.

Criar pelo menos 10.000 empresas iniciais no sistema.

3 CATEGORIZAÇÃO AUTOMÁTICA DAS EMPRESAS

Criar sistema de classificação automática baseado em:

categoria do Google Maps

CNAE

palavras-chave

Categorias principais no aplicativo:

Bares e Restaurantes

bar

restaurante

pizzaria

hamburgueria

cafeteria

casa noturna

Comércio

loja de roupas

loja de calçados

loja de eletrônicos

loja de celular

shopping

Eventos

buffet

casa de eventos

eventos corporativos

shows

festas

casamentos

Beleza e Estética

salão de beleza

barbearia

clínica estética

Indústria

fábrica de calçados

indústria

produção

Construção Civil

construtora

obras

reformas

Logística

transportadora

centro de distribuição

Marketing e Promoção

ações promocionais

degustação

agência

Serviços Gerais

limpeza

manutenção

portaria

4 TIPOS DE USUÁRIO

O sistema terá dois tipos de usuários.

Freelancer

Pessoa que quer trabalhar.

Empresa

Estabelecimento que publica vagas.

Empresas importadas automaticamente podem reivindicar o perfil da empresa.

5 REIVINDICAR EMPRESA

Se uma empresa já existir no banco:

Usuário pode clicar:

"Esta empresa é minha"

Sistema pede:

CNPJ

telefone

verificação SMS

Após validação, o usuário vira administrador da empresa.

6 CADASTRO DE USUÁRIO

Campos:

nome
email
telefone
senha
tipo de conta:

freelancer

empresa

Login com:

email

Google

Apple

7 PERFIL DO FREELANCER

Campos:

foto
nome
idade
telefone
cidade
bairro
bio profissional
habilidades
experiência
avaliações
rating médio

8 HABILIDADES DOS FREELANCERS

Criar lista padrão de habilidades:

garçom

bartender

caixa

atendente

vendedor

repositor

segurança

recepcionista

promotor

panfleteiro

auxiliar de cozinha

cozinheiro

faxineiro

porteiro

carregador

motorista

ajudante geral

pedreiro

pintor

eletricista

manicure

cabeleireiro

barbeiro

Freelancers podem selecionar múltiplas habilidades.

9 DISPONIBILIDADE DO FREELANCER

Criar calendário semanal.

Dias:

segunda
terça
quarta
quinta
sexta
sábado
domingo

Períodos:

manhã
tarde
noite

10 PERFIL DA EMPRESA

Campos:

nome da empresa
CNPJ
endereço
bairro
telefone
responsável
categoria do negócio
descrição

11 CRIAÇÃO DE VAGAS

Empresas podem criar vagas.

Campos:

título
categoria
habilidade necessária
descrição
data
horário início
horário fim
valor do pagamento
quantidade de vagas
endereço
bairro

Exemplo:

Garçom para evento

Data: 12/05
Horário: 18h – 02h
Pagamento: R$150
Vagas: 3

12 MATCH ENTRE FREELANCERS E VAGAS

Freelancers podem:

ver vagas disponíveis

se candidatar

aceitar convites

Empresas podem:

ver candidatos

aceitar freelancers

convidar freelancers

Status da vaga:

aberta

candidatos

confirmada

concluída

13 SISTEMA DE AVALIAÇÃO

Após o trabalho:

Empresa avalia freelancer.

Campos:

nota (1 a 5 estrelas)
comentário

Freelancer também pode avaliar empresa.

14 CHAT INTERNO

Criar chat entre:

empresa
freelancer

Funcionalidades:

enviar mensagens

enviar localização

enviar instruções

15 NOTIFICAÇÕES

Notificações push quando:

nova vaga próxima

empresa convidar freelancer

freelancer aceito

nova mensagem

nova avaliação

16 GEOLOCALIZAÇÃO

Mostrar vagas perto do freelancer.

Baseado em:

GPS
bairro
cidade

17 BANCO DE DADOS

Criar tabelas:

Users
Freelancers
Companies
Jobs
Applications
Reviews
Messages

Companies deve permitir dados importados automaticamente.

18 ADMIN PANEL

Criar painel admin com:

usuários

empresas

freelancers

vagas

avaliações

relatórios

Admin pode:

remover vagas

banir usuários

editar empresas

aprovar empresas verificadas

19 MONETIZAÇÃO

Plano empresa:

Plano básico
R$49/mês
10 vagas

Plano profissional
R$99/mês
vagas ilimitadas

Também permitir:

taxa por vaga publicada.

20 TECNOLOGIA SUGERIDA

Frontend

React Native

Backend

Node.js

Banco

PostgreSQL

Cloud

Supabase

21 DESIGN

Estilo:

moderno
clean
minimalista

Cores:

azul
branco

Referências:

Uber
Airbnb
iFood

22 OBJETIVO DO MVP

O MVP deve permitir:

1 cadastro de freelancer
2 cadastro de empresa
3 importação automática de empresas de Franca
4 criação de vagas
5 candidatura
6 seleção de freelancer
7 avaliação após trabalho

23 NOME DO APP

Freelancer Franca

Slogan:

Trabalhos rápidos na sua cidade

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://franca-job-match.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f560b1a9-a467-4c6f-ac0b-61d24514eb8e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
