-- ═══════════════════════════════════════════════════════════════════
-- FRELA — DADOS FICTÍCIOS PARA APRESENTAÇÃO  (seed_demo.sql)
--
-- ⚠️ SÓ PARA DEMONSTRAÇÃO. Para remover tudo depois: seed_demo_LIMPAR.sql
--
-- Pré-requisito: SQLs das Fases 1, 2 e 3 já rodados.
-- Rode no SQL Editor do Supabase. Pode rodar de novo sem duplicar.
--
-- Marcadores dos dados fake (usados pela limpeza):
--   • todos os usuários têm email terminando em  @demo.frela
--   • profiles.is_demo = true
--
-- Contas de demonstração (senha de todas: demo1234):
--   Empresa:      bar@demo.frela        (Bar do Zé)
--   Profissional: ana@demo.frela        (Ana Paula Souza)
--   (lista completa logo abaixo)
--
-- As datas das vagas são relativas a HOJE (current_date), então rode
-- no dia da apresentação ou na véspera para as vagas estarem no futuro.
-- ═══════════════════════════════════════════════════════════════════

-- id determinístico a partir de um apelido → rodar de novo não duplica
create or replace function pg_temp.did(apelido text) returns uuid
language sql immutable as $$ select md5('frela-demo:' || apelido)::uuid $$;

-- ─────────────────────────────────────────────
-- 1. Usuários (auth.users + identities). O trigger cria os profiles.
-- ─────────────────────────────────────────────
with u(apelido, email, tipo, nome, telefone) as (values
  ('e-bar',      'bar@demo.frela',       'empresa',    'José Carlos Mendes', '(16) 99101-1001'),
  ('e-calcados', 'calcados@demo.frela',  'empresa',    'Roberta Faleiros',   '(16) 99101-1002'),
  ('e-shoes',    'ecommerce@demo.frela', 'empresa',    'Thiago Prado',       '(16) 99101-1003'),
  ('e-cantina',  'cantina@demo.frela',   'empresa',    'Giulia Bertolini',   '(16) 99101-1004'),
  ('e-mercado',  'mercado@demo.frela',   'empresa',    'Paulo Andrade',      '(16) 99101-1005'),
  ('e-villa',    'eventos@demo.frela',   'empresa',    'Fernanda Villela',   '(16) 99101-1006'),
  ('p-ana',      'ana@demo.frela',       'freelancer', 'Ana Paula Souza',    '(16) 99202-2001'),
  ('p-carlos',   'carlos@demo.frela',    'freelancer', 'Carlos Henrique Silva', '(16) 99202-2002'),
  ('p-juliana',  'juliana@demo.frela',   'freelancer', 'Juliana Ribeiro',    '(16) 99202-2003'),
  ('p-rafael',   'rafael@demo.frela',    'freelancer', 'Rafael Moreira',     '(16) 99202-2004'),
  ('p-mariana',  'mariana@demo.frela',   'freelancer', 'Mariana Costa',      '(16) 99202-2005'),
  ('p-diego',    'diego@demo.frela',     'freelancer', 'Diego Fernandes',    '(16) 99202-2006')
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select '00000000-0000-0000-0000-000000000000', pg_temp.did(apelido), 'authenticated', 'authenticated', email,
       extensions.crypt('demo1234', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('tipo', tipo, 'nome', nome, 'telefone', telefone),
       now() - interval '90 days', now(),
       '', '', '', ''
  from u
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
  from auth.users u
 where u.email like '%@demo.frela'
   and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

-- ─────────────────────────────────────────────
-- 2. Perfis: foto, cidade, selos, marcador is_demo
-- ─────────────────────────────────────────────
update public.profiles p set
  is_demo = true,
  cidade = 'Franca',
  created_at = now() - interval '90 days',
  verificado = x.verificado,
  foto_url = x.foto
from (values
  ('e-bar',      true,  'https://ui-avatars.com/api/?name=Bar+do+Ze&background=b45309&color=fff&size=256&bold=true&format=png'),
  ('e-calcados', true,  'https://ui-avatars.com/api/?name=Passo+Firme&background=0f766e&color=fff&size=256&bold=true&format=png'),
  ('e-shoes',    false, 'https://ui-avatars.com/api/?name=Franca+Shoes&background=1d4ed8&color=fff&size=256&bold=true&format=png'),
  ('e-cantina',  false, 'https://ui-avatars.com/api/?name=Cantina+Nonna&background=be123c&color=fff&size=256&bold=true&format=png'),
  ('e-mercado',  false, 'https://ui-avatars.com/api/?name=Bom+Preco&background=15803d&color=fff&size=256&bold=true&format=png'),
  ('e-villa',    true,  'https://ui-avatars.com/api/?name=Villa+Eventos&background=7c3aed&color=fff&size=256&bold=true&format=png'),
  ('p-ana',      true,  'https://i.pravatar.cc/400?img=47'),
  ('p-carlos',   true,  'https://i.pravatar.cc/400?img=12'),
  ('p-juliana',  false, 'https://i.pravatar.cc/400?img=45'),
  ('p-rafael',   false, 'https://i.pravatar.cc/400?img=15'),
  ('p-mariana',  true,  'https://i.pravatar.cc/400?img=32'),
  ('p-diego',    false, 'https://i.pravatar.cc/400?img=53')
) as x(apelido, verificado, foto)
where p.id = pg_temp.did(x.apelido);

-- ─────────────────────────────────────────────
-- 3. Dados das empresas (com coordenadas para o mapa)
-- ─────────────────────────────────────────────
insert into public.empresa_dados (profile_id, nome_empresa, cnpj, ramo, endereco, bio, latitude, longitude)
select pg_temp.did(a), n, c, r, e, b, la, lo from (values
  ('e-bar', 'Bar do Zé', '12.345.678/0001-90', 'Bar / Restaurante', 'Av. Champagnat, 1185 - Centro',
   'Bar com música ao vivo no coração de Franca há 12 anos. Equipe animada, refeição no turno e pagamento no mesmo dia.', -20.5383, -47.4011),
  ('e-calcados', 'Calçados Passo Firme', '23.456.789/0001-01', 'Indústria', 'Av. Dr. Ismael Alonso y Alonso, 2500 - Distrito Industrial',
   'Fábrica de calçados masculinos de couro desde 1988. Reforçamos a produção em picos de pedido com profissionais experientes.', -20.5615, -47.4344),
  ('e-shoes', 'Franca Shoes Online', '34.567.890/0001-12', 'Comércio / Loja', 'Rua Major Claudiano, 1700 - Centro',
   'E-commerce de calçados de Franca para todo o Brasil. Em datas como Black Friday precisamos de reforço na separação e expedição.', -20.5365, -47.4030),
  ('e-cantina', 'Cantina da Nonna', null, 'Bar / Restaurante', 'Rua Voluntários da Franca, 1450 - Centro',
   'Cozinha italiana caseira, massas frescas todos os dias. Ambiente familiar e equipe acolhedora.', -20.5350, -47.4000),
  ('e-mercado', 'Supermercado Bom Preço', '45.678.901/0001-23', 'Comércio / Loja', 'Av. Presidente Vargas, 2000 - Cidade Nova',
   'Supermercado de bairro com 3 lojas em Franca. Contratamos repositores, caixas e promotores para ações especiais.', -20.5250, -47.4100),
  ('e-villa', 'Espaço Villa Eventos', '56.789.012/0001-34', 'Eventos', 'Rua Simão Caleiro, 3100 - Jardim Paulista',
   'Casamentos, formaturas e eventos corporativos para até 400 convidados. Buscamos equipe caprichosa e pontual.', -20.5300, -47.3900)
) v(a, n, c, r, e, b, la, lo)
on conflict (profile_id) do update set
  nome_empresa = excluded.nome_empresa, cnpj = excluded.cnpj, ramo = excluded.ramo, endereco = excluded.endereco,
  bio = excluded.bio, latitude = excluded.latitude, longitude = excluded.longitude;

-- ─────────────────────────────────────────────
-- 4. Currículo dos profissionais
-- ─────────────────────────────────────────────
insert into public.profissional_dados (profile_id, profissoes, experiencia, bio, disponibilidade, instagram, linkedin)
select pg_temp.did(a), p, e, b, d, i, l from (values
  ('p-ana', array['Garçom','Bartender','Recepcionista'],
   '4 anos como garçonete no Restaurante Sabor de Minas e em eventos de formatura no Espaço Villa. Curso de bartender pelo SENAC.',
   'Pontual, simpática e organizada. Tenho traje social próprio e adoro trabalhar em equipe.', 'Sex, Sáb, Dom · Tarde, Noite', 'anapaula.eventos', null),
  ('p-carlos', array['Pespontador','Montador','Auxiliar de produção'],
   '9 anos em fábricas de calçados de Franca (pesponto e montagem). Experiência com máquina de coluna e reta.',
   'Trabalho rápido e com capricho no acabamento. Disponível para turnos extras e lotes urgentes.', 'Seg, Ter, Qua, Qui, Sex, Sáb · Manhã, Tarde', null, 'https://www.linkedin.com/in/carlos-pesponto'),
  ('p-juliana', array['Separador de pedidos','Embalador','Conferente','Atendimento ao cliente'],
   '2 anos em e-commerce de moda: separação, conferência e embalagem, com leitor de código de barras e sistema Bling.',
   'Atenta aos detalhes, nunca troquei um pedido! Gosto de ritmo acelerado.', 'Seg, Ter, Qua, Qui, Sex · Manhã, Tarde', 'ju.ribeiro', null),
  ('p-rafael', array['Cozinheiro','Chapeiro','Auxiliar de Cozinha'],
   '6 anos em cozinhas de restaurantes e lanchonetes. Domino chapa, fritadeira e mise en place.',
   'Apaixonado por cozinha, limpo e organizado. Tenho carteira de manipulador de alimentos.', 'Qua, Qui, Sex, Sáb, Dom · Tarde, Noite', 'chef.rafa.franca', null),
  ('p-mariana', array['Manicure','Maquiador','Esteticista'],
   '5 anos atendendo em salão e em domicílio. Especialista em maquiagem para noivas e formandas.',
   'Atendo com hora marcada e levo todo o material. Higiene e capricho em primeiro lugar.', 'Ter, Qua, Qui, Sex, Sáb · Manhã, Tarde, Noite', 'mari.makeup.franca', null),
  ('p-diego', array['Motoboy','Entregador','Ajudante Geral'],
   '3 anos como motoboy em aplicativos e para lojas do centro. Conheço Franca inteira.',
   'Moto própria com baú, CNH A e MEI. Rápido e cuidadoso com as encomendas.', 'Seg, Ter, Qua, Qui, Sex, Sáb · Manhã, Tarde, Noite', 'diego.entregas', null)
) v(a, p, e, b, d, i, l)
on conflict (profile_id) do update set
  profissoes = excluded.profissoes, experiencia = excluded.experiencia, bio = excluded.bio,
  disponibilidade = excluded.disponibilidade, instagram = excluded.instagram, linkedin = excluded.linkedin;

-- Portfólio (imagens ilustrativas)
insert into public.portfolio_fotos (id, profile_id, url, legenda, created_at)
select pg_temp.did(a || '-pf' || n), pg_temp.did(a), 'https://picsum.photos/seed/frela-' || a || '-' || n || '/800/800', null, now() - (n || ' days')::interval
  from (values ('p-ana'), ('p-carlos'), ('p-rafael'), ('p-mariana'), ('p-juliana')) v(a)
 cross join generate_series(1, 5) n
on conflict (id) do nothing;

-- ─────────────────────────────────────────────
-- 5. Trabalhos já finalizados (histórico + avaliações)
-- ─────────────────────────────────────────────
insert into public.jobs (id, user_id, company_name, title, category, skill, description, date, time_start, time_end, payment, slots, slots_remaining, neighborhood, address, status, created_at)
select pg_temp.did(j), pg_temp.did(e), c, t, cat, sk, 'Trabalho realizado pelo FreLa.', current_date - d, hi, hf, v, 1, 0, b, ad, 'finalizada', now() - ((d + 3) || ' days')::interval
from (values
  ('h01', 'e-bar',      'Bar do Zé',            'Garçom - aniversário de 15 anos',  'Garçom / Eventos',       'Garçom',               20, '19:00', '01:00', 160, 'Centro',               'Av. Champagnat, 1185'),
  ('h02', 'e-villa',    'Espaço Villa Eventos', 'Garçom - formatura de Medicina',   'Garçom / Eventos',       'Garçom',               12, '20:00', '03:00', 180, 'Jardim Paulista',      'Rua Simão Caleiro, 3100'),
  ('h03', 'e-calcados', 'Calçados Passo Firme', 'Pesponto - lote extra de inverno', 'Calçados / Indústria',   'Pespontador',          15, '07:00', '17:00', 200, 'Distrito Industrial',  'Av. Dr. Ismael Alonso y Alonso, 2500'),
  ('h04', 'e-shoes',    'Franca Shoes Online',  'Separação de pedidos - Dia dos Pais', 'E-commerce / Logística', 'Separador de pedidos', 9, '08:00', '17:00', 130, 'Centro',               'Rua Major Claudiano, 1700'),
  ('h05', 'e-cantina',  'Cantina da Nonna',     'Cozinheiro - jantar especial',     'Cozinha / Gastronomia',  'Cozinheiro',            7, '16:00', '23:00', 220, 'Centro',               'Rua Voluntários da Franca, 1450'),
  ('h06', 'e-villa',    'Espaço Villa Eventos', 'Maquiagem para noiva e madrinhas', 'Beleza / Estética',      'Maquiador',            25, '13:00', '18:00', 300, 'Jardim Paulista',      'Rua Simão Caleiro, 3100'),
  ('h07', 'e-shoes',    'Franca Shoes Online',  'Entregas de sábado no centro',     'Entregas / Motoboy',     'Motoboy',               5, '09:00', '15:00', 150, 'Centro',               'Rua Major Claudiano, 1700'),
  ('h08', 'e-bar',      'Bar do Zé',            'Chapeiro - happy hour',            'Cozinha / Gastronomia',  'Chapeiro',              3, '17:00', '23:00', 140, 'Centro',               'Av. Champagnat, 1185'),
  ('h09', 'e-mercado',  'Supermercado Bom Preço', 'Repositor - inventário',         'Vendas / Comércio',      'Repositor',            18, '22:00', '05:00', 170, 'Cidade Nova',          'Av. Presidente Vargas, 2000'),
  ('h10', 'e-calcados', 'Calçados Passo Firme', 'Montagem - pedido exportação',     'Calçados / Indústria',   'Montador',             30, '07:00', '17:00', 210, 'Distrito Industrial',  'Av. Dr. Ismael Alonso y Alonso, 2500'),
  ('h11', 'e-bar',      'Bar do Zé',            'Garçom - show de sertanejo',       'Garçom / Eventos',       'Garçom',               35, '19:00', '02:00', 170, 'Centro',               'Av. Champagnat, 1185'),
  ('h12', 'e-villa',    'Espaço Villa Eventos', 'Recepcionista - casamento',        'Garçom / Eventos',       'Recepcionista',        40, '18:00', '23:00', 150, 'Jardim Paulista',      'Rua Simão Caleiro, 3100'),
  ('h13', 'e-calcados', 'Calçados Passo Firme', 'Pesponto - reposição de estoque',  'Calçados / Indústria',   'Pespontador',          45, '07:00', '17:00', 200, 'Distrito Industrial',  'Av. Dr. Ismael Alonso y Alonso, 2500'),
  ('h14', 'e-shoes',    'Franca Shoes Online',  'Expedição - campanha de outono',   'E-commerce / Logística', 'Embalador',            28, '08:00', '17:00', 130, 'Centro',               'Rua Major Claudiano, 1700'),
  ('h15', 'e-cantina',  'Cantina da Nonna',     'Cozinheiro - almoço de domingo',   'Cozinha / Gastronomia',  'Cozinheiro',           33, '09:00', '16:00', 200, 'Centro',               'Rua Voluntários da Franca, 1450'),
  ('h16', 'e-villa',    'Espaço Villa Eventos', 'Maquiagem - formatura',            'Beleza / Estética',      'Maquiador',            38, '14:00', '19:00', 280, 'Jardim Paulista',      'Rua Simão Caleiro, 3100'),
  ('h17', 'e-shoes',    'Franca Shoes Online',  'Entregas - liquidação',            'Entregas / Motoboy',     'Motoboy',              22, '09:00', '18:00', 160, 'Centro',               'Rua Major Claudiano, 1700'),
  ('h18', 'e-mercado',  'Supermercado Bom Preço', 'Entregas de compras do site',    'Entregas / Motoboy',     'Entregador',           26, '08:00', '14:00', 120, 'Cidade Nova',          'Av. Presidente Vargas, 2000'),
  ('h19', 'e-mercado',  'Supermercado Bom Preço', 'Caixa - fim de mês',             'Vendas / Comércio',      'Caixa',                50, '13:00', '21:00', 130, 'Cidade Nova',          'Av. Presidente Vargas, 2000'),
  ('h20', 'e-cantina',  'Cantina da Nonna',     'Chapeiro - festival de massas',    'Cozinha / Gastronomia',  'Chapeiro',             41, '17:00', '23:00', 150, 'Centro',               'Rua Voluntários da Franca, 1450')
) v(j, e, c, t, cat, sk, d, hi, hf, v, b, ad)
on conflict (id) do nothing;

insert into public.applications (id, job_id, user_id, status, created_at)
select pg_temp.did(j || '-app'), pg_temp.did(j), pg_temp.did(p), 'aceita', now() - ((d + 2) || ' days')::interval
from (values ('h01','p-ana',20),('h02','p-ana',12),('h03','p-carlos',15),('h04','p-juliana',9),('h05','p-rafael',7),
             ('h06','p-mariana',25),('h07','p-diego',5),('h08','p-rafael',3),('h09','p-juliana',18),('h10','p-carlos',30),
             ('h11','p-ana',35),('h12','p-ana',40),('h13','p-carlos',45),('h14','p-juliana',28),('h15','p-rafael',33),
             ('h16','p-mariana',38),('h17','p-diego',22),('h18','p-diego',26),('h19','p-juliana',50),('h20','p-rafael',41)) v(j, p, d)
on conflict do nothing;

insert into public.contratacoes (id, job_id, empresa_id, profissional_id, valor, status, taxa_5pct, taxa_cobrada, finalizada_em, created_at)
select pg_temp.did(j || '-c'), pg_temp.did(j), pg_temp.did(e), pg_temp.did(p), v, 'finalizada', round(v * 0.05, 2), false,
       now() - (d || ' days')::interval + interval '8 hours', now() - ((d + 2) || ' days')::interval
from (values ('h01','e-bar','p-ana',160,20),('h02','e-villa','p-ana',180,12),('h03','e-calcados','p-carlos',200,15),
             ('h04','e-shoes','p-juliana',130,9),('h05','e-cantina','p-rafael',220,7),('h06','e-villa','p-mariana',300,25),
             ('h07','e-shoes','p-diego',150,5),('h08','e-bar','p-rafael',140,3),('h09','e-mercado','p-juliana',170,18),
             ('h10','e-calcados','p-carlos',210,30),('h11','e-bar','p-ana',170,35),('h12','e-villa','p-ana',150,40),
             ('h13','e-calcados','p-carlos',200,45),('h14','e-shoes','p-juliana',130,28),('h15','e-cantina','p-rafael',200,33),
             ('h16','e-villa','p-mariana',280,38),('h17','e-shoes','p-diego',160,22),('h18','e-mercado','p-diego',120,26),
             ('h19','e-mercado','p-juliana',130,50),('h20','e-cantina','p-rafael',150,41)) v(j, e, p, v, d)
on conflict (id) do nothing;

-- Avaliações nos dois sentidos (o trigger recalcula as médias)
insert into public.avaliacoes (id, contratacao_id, de_id, para_id, nota, comentario, created_at)
select pg_temp.did(j || '-av-' || de), pg_temp.did(j || '-c'), pg_temp.did(de), pg_temp.did(para), nota, com, now() - (d || ' days')::interval + interval '1 day'
from (values
  ('h01','e-bar','p-ana',5,'Excelente! Atendeu as mesas com muita simpatia, os clientes elogiaram.',20),
  ('h01','p-ana','e-bar',5,'Equipe ótima e pagamento no mesmo dia. Voltaria com certeza!',20),
  ('h02','e-villa','p-ana',5,'Super profissional, chegou antes do horário e com traje impecável.',12),
  ('h02','p-ana','e-villa',4,'Evento grande e bem organizado. Só faltou um intervalo maior para jantar.',12),
  ('h03','e-calcados','p-carlos',5,'Pesponto perfeito, entregou o lote antes do prazo.',15),
  ('h03','p-carlos','e-calcados',5,'Fábrica organizada e pessoal muito respeitoso.',15),
  ('h04','e-shoes','p-juliana',5,'Zero erro na separação. Muito atenta!',9),
  ('h04','p-juliana','e-shoes',4,'Ritmo puxado mas ambiente bom. Recomendo.',9),
  ('h05','e-cantina','p-rafael',4,'Mandou muito bem na cozinha, só precisou de ajuda com as massas frescas.',7),
  ('h05','p-rafael','e-cantina',5,'Cozinha limpa e a Giulia é uma ótima chefe.',7),
  ('h06','e-villa','p-mariana',5,'A noiva amou! Maquiagem durou a festa inteira.',25),
  ('h06','p-mariana','e-villa',5,'Organização impecável, me deram um espaço só para a maquiagem.',25),
  ('h07','e-shoes','p-diego',5,'Todas as entregas no horário. Rápido e educado.',5),
  ('h07','p-diego','e-shoes',4,'Rotas bem planejadas. Pagamento certinho.',5),
  ('h08','e-bar','p-rafael',5,'Chapa voando no happy hour, salvou nossa sexta!',3),
  ('h08','p-rafael','e-bar',5,'Lugar animado, equipe parceira.',3),
  ('h09','e-mercado','p-juliana',4,'Organizada e rápida no inventário.',18),
  ('h10','e-calcados','p-carlos',5,'Já é da casa. Montagem com acabamento excelente.',30),
  ('h10','p-carlos','e-calcados',5,'Sempre um prazer trabalhar com a Passo Firme.',30),
  ('h11','e-bar','p-ana',5,'A Ana já virou nossa primeira opção para dias de casa cheia.',35),
  ('h11','p-ana','e-bar',5,'Melhor lugar pra trabalhar em Franca!',35),
  ('h12','e-villa','p-ana',5,'Recebeu os convidados com muita elegância.',40),
  ('h13','e-calcados','p-carlos',5,'Qualidade de sempre, recomendo de olhos fechados.',45),
  ('h13','p-carlos','e-calcados',4,'Bom ambiente, só o almoço atrasou um pouco.',45),
  ('h14','e-shoes','p-juliana',5,'Embalagem caprichada, nenhuma devolução por avaria.',28),
  ('h14','p-juliana','e-shoes',5,'Time jovem e organizado.',28),
  ('h15','e-cantina','p-rafael',5,'Segurou a cozinha sozinho num domingo lotado!',33),
  ('h15','p-rafael','e-cantina',5,'Receitas da Nonna são incríveis, aprendi muito.',33),
  ('h16','e-villa','p-mariana',5,'As formandas saíram lindas nas fotos.',38),
  ('h16','p-mariana','e-villa',5,'Sempre bem recebida no Villa.',38),
  ('h17','e-shoes','p-diego',5,'Entregou 40 pedidos sem atraso.',22),
  ('h18','e-mercado','p-diego',5,'Clientes elogiaram a educação na entrega.',26),
  ('h18','p-diego','e-mercado',5,'Pagamento rápido e equipe gente boa.',26),
  ('h19','e-mercado','p-juliana',5,'Caixa sem diferença no fechamento. Ótima!',50),
  ('h19','p-juliana','e-mercado',4,'Movimento intenso, mas tudo bem organizado.',50),
  ('h20','e-cantina','p-rafael',5,'Festival foi um sucesso graças à chapa do Rafa.',41),
  ('h20','p-rafael','e-cantina',5,'Evento muito bem planejado.',41)
) v(j, de, para, nota, com, d)
on conflict do nothing;

-- ─────────────────────────────────────────────
-- 6. Vagas abertas (datas a partir de amanhã)
-- ─────────────────────────────────────────────
insert into public.jobs (id, user_id, company_name, title, category, skill, description, date, time_start, time_end, payment, slots, slots_remaining, neighborhood, address, status, created_at)
select pg_temp.did(j), pg_temp.did(e), c, t, cat, sk, descr, current_date + d, hi, hf, v, 1, 1, b, ad, 'aberta', now() - (h || ' hours')::interval
from (values
  ('v01','e-bar','Bar do Zé','Garçom para sexta com música ao vivo','Garçom / Eventos','Garçom',
   'Atendimento às mesas em noite de música ao vivo (casa cheia). Traje: camisa preta e calça escura. Jantar incluso.',1,'18:00','23:30',150,'Centro','Av. Champagnat, 1185',3),
  ('v02','e-calcados','Calçados Passo Firme','Pespontador para coleção de inverno','Calçados / Indústria','Pespontador',
   'Pesponto em calçado masculino de couro, máquina de coluna. Experiência mínima de 2 anos. Café e almoço no local.',2,'07:00','17:00',220,'Distrito Industrial','Av. Dr. Ismael Alonso y Alonso, 2500',5),
  ('v03','e-shoes','Franca Shoes Online','Separador de pedidos — semana Black Friday','E-commerce / Logística','Separador de pedidos',
   'Separação e conferência de pedidos com leitor de código de barras. Treinamento rápido no início do turno.',3,'08:00','17:00',130,'Centro','Rua Major Claudiano, 1700',8),
  ('v04','e-cantina','Cantina da Nonna','Auxiliar de cozinha no fim de semana','Cozinha / Gastronomia','Auxiliar de Cozinha',
   'Pré-preparo, montagem de pratos e organização da cozinha no almoço de domingo. Refeição inclusa.',4,'10:00','16:00',140,'Centro','Rua Voluntários da Franca, 1450',10),
  ('v05','e-mercado','Supermercado Bom Preço','Repositor para inauguração da loja 3','Vendas / Comércio','Repositor',
   'Abastecimento de gôndolas e organização de estoque para a inauguração da nova loja.',5,'07:00','15:00',120,'Cidade Nova','Av. Presidente Vargas, 2000',12),
  ('v06','e-villa','Espaço Villa Eventos','Bartender para casamento','Garçom / Eventos','Bartender',
   'Drinks clássicos e de autoria para 250 convidados. Bar montado pelo espaço; desejável experiência com coquetelaria.',6,'19:00','02:00',250,'Jardim Paulista','Rua Simão Caleiro, 3100',2),
  ('v07','e-mercado','Supermercado Bom Preço','Promotor(a) de degustação de café','Promotor / Panfletagem','Degustação',
   'Ação de degustação de café especial de produtor local da Alta Mogiana. Comunicativo(a) e sorridente.',3,'09:00','15:00',110,'Cidade Nova','Av. Presidente Vargas, 2000',6),
  ('v08','e-shoes','Franca Shoes Online','Motoboy para entregas no centro','Entregas / Motoboy','Motoboy',
   'Entregas rápidas no centro e bairros próximos. Necessário moto própria com baú e CNH A.',2,'09:00','18:00',160,'Centro','Rua Major Claudiano, 1700',4),
  ('v09','e-villa','Espaço Villa Eventos','Equipe de limpeza pós-evento','Limpeza / Doméstica','Auxiliar de limpeza',
   'Limpeza geral do salão e cozinha após festa de formatura. Materiais fornecidos.',7,'08:00','14:00',130,'Jardim Paulista','Rua Simão Caleiro, 3100',1),
  ('v10','e-calcados','Calçados Passo Firme','Porteiro para turno da noite','Segurança / Portaria','Porteiro',
   'Controle de acesso de veículos e visitantes no turno noturno da fábrica.',4,'19:00','07:00',180,'Distrito Industrial','Av. Dr. Ismael Alonso y Alonso, 2500',9)
) v(j, e, c, t, cat, sk, descr, d, hi, hf, v, b, ad, h)
on conflict (id) do update set date = excluded.date, status = 'aberta', slots_remaining = 1;

-- Candidaturas pendentes (deixa os painéis movimentados)
insert into public.applications (id, job_id, user_id, status, created_at)
select pg_temp.did(j || '-' || p), pg_temp.did(j), pg_temp.did(p), 'pendente', now() - (h || ' hours')::interval
from (values ('v01','p-ana',2),('v01','p-rafael',1),('v02','p-carlos',4),('v03','p-juliana',6),('v03','p-diego',3),
             ('v04','p-rafael',8),('v06','p-ana',1),('v06','p-mariana',1),('v08','p-diego',2),('v05','p-juliana',10)) v(j, p, h)
on conflict do nothing;

-- Notificações geradas pelo seed para os próprios usuários demo ficam como lidas
update public.notificacoes set lida = true
 where user_id in (select id from public.profiles where is_demo);

-- Conferência rápida
select 'usuarios demo' as item, count(*) from public.profiles where is_demo
union all select 'vagas abertas demo', count(*) from public.jobs j join public.profiles p on p.id = j.user_id where p.is_demo and j.status = 'aberta'
union all select 'avaliacoes demo', count(*) from public.avaliacoes a join public.profiles p on p.id = a.de_id where p.is_demo;
