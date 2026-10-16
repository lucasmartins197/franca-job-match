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
