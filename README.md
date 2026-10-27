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
7. **Fase 6 — rode:** `supabase/migrations/20261022120000_fase6_crescimento.sql` (selo Indicado automático, recomendações, Indique e Ganhe com crédito nas taxas). O `seed_demo.sql` agora requer as Fases 1–6.
8. **Fase 7 — rode:** `supabase/migrations/20261023120000_fase7_ajustes_finais.sql` (profissional grátis nas métricas, código de confirmação cruzado, avaliação obrigatória, travas, aviso de vagas nos dias disponíveis, Verificado exige currículo completo).
9. **Fase 8 — rode:** `supabase/migrations/20261024120000_fase8_geolocalizacao.sql` (latitude/longitude nas vagas — herdam o ponto da empresa —, região aproximada do usuário, tabela `lista_espera` para quem está fora de Franca e região).
10. **Auth → URL Configuration:** coloque a URL do app em *Site URL* e adicione em *Redirect URLs* `<url-do-app>/auth` (confirmação de email) e `<url-do-app>/redefinir-senha` (esqueci minha senha).
11. As migrations antigas (`20260324…`, `20260404…`, `20260618…`) são do projeto Supabase anterior — **não rode** no FreLa.

## Dados de demonstração (apresentação)

- **Popular:** rode `supabase/demo/seed_demo.sql` (6 empresas, 6 profissionais com foto e portfólio, 10 vagas abertas, 20 trabalhos finalizados com avaliações, candidaturas). As datas são relativas a hoje — rode na véspera.
- **Logins demo** (senha `demo1234`): `bar@demo.frela` (empresa), `ana@demo.frela` (profissional); outros: `calcados@`, `ecommerce@`, `cantina@`, `mercado@`, `eventos@`, `carlos@`, `juliana@`, `rafael@`, `mariana@`, `diego@` — todos `@demo.frela`.
- **Limpar:** rode `supabase/demo/seed_demo_LIMPAR.sql`. Remove tudo de usuários `@demo.frela` / `is_demo` (e interações de usuários reais com dados demo), sem tocar no resto.

## Pagamentos (preparado, desativado)

**Profissional é grátis.** Só a empresa paga: assinatura de R$ 89,90/mês + 5% por contratação.
Ver `src/lib/pagamentos.ts`: mensalidade da empresa via IAP (App Store/Google Play) e quitação das taxas via Stripe (Pix/cartão) com baixa pelo webhook chamando `frela_quitar_taxas` — pontos de integração marcados com `TODO`. Nada é cobrado hoje; o ADM pode registrar pagamentos recebidos manualmente em `/admin/taxas`.

### Indique e Ganhe
Empresa compartilha o código/link (perfil da empresa). Quando a empresa indicada se cadastra com o código e **ativa a assinatura**, quem indicou ganha **R$ 50 de crédito** que abate o saldo de taxas (e, portanto, o teto/trava). O crédito é consumido na quitação. Status: `pendente` → `cadastrou` (perfil completo) → `pagou` (assinatura ativa) → `recompensado`.

### Selos
`Indicado` (automático: 10 trabalhos + nota ≥ 4,5 com 3+ avaliações, ou concedido pelo ADM), `Verificado` (ADM), `Top avaliado` (3+ avaliações e nota ≥ 4,7), `Destaque` (ADM), `Novo`. Quem tem selo aparece primeiro nas recomendações e na lista de candidatos.

### Ciclo da taxa de 5% (com código de confirmação — Fase 7)
1. Depois do serviço, a empresa toca em **Serviço realizado** e **declara o valor pago** → o app gera um **código de 4 dígitos** que só ela vê.
2. A empresa passa o código ao profissional **pessoalmente**. Ele digita no app (5 erros bloqueiam; a empresa gera outro) e confirma o valor — ou contesta (`em_divergencia`, fora do saldo até um ADM resolver).
3. Código certo → contratação finalizada, taxa de 5% no saldo (`confirmada`) e **avaliação obrigatória** (estrelas + comentário) para os dois.
4. Travas: empresa sem nova vaga com serviço em andamento, avaliação pendente ou saldo ≥ R$ 50; profissional sem se candidatar com serviço não confirmado pelo código (código gerado ou dia já passou) ou avaliação pendente.
5. Travou (profissional sem celular, não compareceu)? O ADM abre a contratação e usa **Encerrar** (valor 0 = sem taxa).

Contratações finalizadas antes da Fase 7 continuam no fluxo antigo (profissional confirma o valor pelo cartão "Confirme o valor recebido").
- Renovação da assinatura só com zero taxas em aberto.
- Quitação → `paga` (hoje manual pelo ADM; depois automática pelo Stripe).

## Mapa e localização (Fase 8)

- Mapa com **Leaflet + OpenStreetMap** (sem chave). Os blocos do mapa vêm de `tile.openstreetmap.org`, que é gratuito para uso moderado; com muito tráfego, trocar a URL em `src/components/vagas/MapaVagas.tsx` por um provedor de tiles (ex.: MapTiler/Stadia, plano gratuito).
- Geocodificação (endereço → ponto) pelo Nominatim (OpenStreetMap), feita ao publicar a vaga.
- O app pede a localização ao abrir (profissional). A posição exata fica só no aparelho; no banco vai só a região (~1 km).
- Área atendida: raio de 60 km de Franca (`RAIO_COBERTURA_KM` em `src/lib/geo.ts`). Fora dela → tela "O FreLa ainda não chegou na sua região" + lista de espera (Gestão → Crescimento → Lista de espera).

## Publicar nas lojas (Capacitor)

O app nativo usa **Capacitor 8** (`capacitor.config.ts`, pastas `android/` e `ios/`). `appId`: `br.com.frela.app` (troque antes da 1ª publicação se quiser outro — depois não muda).

1. `npm run cap:sync` (build + copia para Android/iOS) → `npm run cap:android` (Android Studio) / `npm run cap:ios` (Xcode, no Mac).
2. Ícone e splash: edite `assets/icon-only.png`, `assets/icon-foreground.png`, `assets/icon-background.png`, `assets/splash.png` e rode `npm run cap:icones`.
3. Antes de enviar:
   - preencher `src/lib/legal.ts` (razão social/CNPJ e e-mail) e informar a URL pública de `/privacidade` nas lojas;
   - **Supabase Auth → Redirect URLs**: os links de e-mail (confirmação e "esqueci a senha") abrem no navegador; para abrirem no app, configurar deep link (App Links/Universal Links) — TODO;
   - versão em `android/app/build.gradle` (`versionCode`/`versionName`) e no Xcode.
4. **Assinatura da empresa = In-App Purchase** (Apple/Google), nunca Stripe — ponto marcado em `iniciarAssinatura()` (`src/lib/pagamentos.ts`). A taxa de 5% é cobrada fora do app (backend).
5. Push nativo: passo a passo em `src/lib/push.ts` (hoje as notificações são internas, no sino).
6. Exclusão de conta: Perfil → "Excluir minha conta" (vira pedido no suporte; concluir em até 7 dias).

## Rotas

| Rota | Quem | O quê |
|---|---|---|
| `/auth` | todos | cadastro (empresa/profissional) e login |
| `/` | profissional | feed, busca, trabalhos (candidaturas + contratações), chat (Fase 2), perfil |
| `/dashboard` | empresa | painel, trava, contratações em andamento, minhas vagas por status |
| `/job/:id` | todos | detalhe da vaga / candidatar-se |
| `/job/:id/candidates` | empresa | candidatos → aceitar/recusar |
| `/contratacao/:id` | as duas partes | código de confirmação (empresa gera, profissional digita), avaliações obrigatórias |
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
| `/recomendados` | empresa | vitrine "Melhores profissionais" (selo > avaliação > trabalhos) |
| `/melhores-lugares` | profissional | empresas mais bem avaliadas e que mais contratam |
| `/auth?indicacao=CODIGO` | todos | link de indicação (preenche o código no cadastro) |
| `/redefinir-senha` | todos | destino do link "esqueci minha senha" |
| `/planos` | todos | empresa: plano e taxa ("assinar" → em breve); profissional: "grátis" |
| `/privacidade`, `/termos` | público | política de privacidade e termos (exigidos pelas lojas) |
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
