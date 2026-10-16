-- ═══════════════════════════════════════════════════════════════════
-- FRELA — REMOVE TODOS OS DADOS FICTÍCIOS  (seed_demo_LIMPAR.sql)
--
-- Apaga tudo que o seed_demo.sql criou: usuários com email @demo.frela
-- (ou profiles.is_demo = true) e TUDO ligado a eles — vagas, candidaturas,
-- contratações, avaliações, mensagens, suporte, notificações, portfólio.
--
-- Dados de usuários reais NÃO são apagados. Se um usuário real interagiu
-- com dados demo (ex.: se candidatou a uma vaga fake), só essa interação
-- some, e a nota média dele é recalculada no final.
--
-- Rode no SQL Editor. Tudo numa transação: ou apaga tudo, ou nada.
-- ═══════════════════════════════════════════════════════════════════
begin;

create temp table _demo_users on commit drop as
  select id from auth.users where email like '%@demo.frela'
  union
  select id from public.profiles where is_demo;

create temp table _demo_jobs on commit drop as
  select id from public.jobs where user_id in (select id from _demo_users);

create temp table _demo_contratacoes on commit drop as
  select id from public.contratacoes
   where empresa_id in (select id from _demo_users)
      or profissional_id in (select id from _demo_users)
      or job_id in (select id from _demo_jobs);

-- notificações de usuários reais que apontam para dados demo
delete from public.notificacoes n
 where n.user_id in (select id from _demo_users)
    or exists (select 1 from _demo_jobs j where n.link like '/job/' || j.id || '%')
    or exists (select 1 from _demo_contratacoes c where n.link in ('/contratacao/' || c.id, '/chat/' || c.id))
    or exists (select 1 from _demo_users u where n.link = '/admin/suporte/' || u.id);

delete from public.avaliacoes
 where contratacao_id in (select id from _demo_contratacoes)
    or de_id in (select id from _demo_users)
    or para_id in (select id from _demo_users);

delete from public.mensagens
 where contratacao_id in (select id from _demo_contratacoes)
    or de_id in (select id from _demo_users)
    or para_id in (select id from _demo_users);

delete from public.pagamentos
 where contratacao_id in (select id from _demo_contratacoes)
    or user_id in (select id from _demo_users);

delete from public.contratacoes where id in (select id from _demo_contratacoes);

delete from public.applications
 where job_id in (select id from _demo_jobs)
    or user_id in (select id from _demo_users);

delete from public.jobs where id in (select id from _demo_jobs);

delete from public.suporte_mensagens
 where user_id in (select id from _demo_users)
    or autor_id in (select id from _demo_users);

-- apaga os usuários (em cascata: profiles, empresa_dados, profissional_dados,
-- portfolio_fotos, identities, notificações restantes)
delete from auth.identities where user_id in (select id from _demo_users);
delete from auth.users where id in (select id from _demo_users);

-- recalcula a reputação de quem sobrou
update public.profiles p
   set avaliacao_media = coalesce(s.media, 0),
       total_avaliacoes = coalesce(s.total, 0)
  from (
    select p2.id, round(avg(a.nota)::numeric, 2) as media, count(a.id)::int as total
      from public.profiles p2
      left join public.avaliacoes a on a.para_id = p2.id
     group by p2.id
  ) s
 where s.id = p.id
   and (p.avaliacao_media is distinct from coalesce(s.media, 0) or p.total_avaliacoes is distinct from coalesce(s.total, 0));

commit;

-- Conferência: deve dar 0
select count(*) as usuarios_demo_restantes
  from auth.users where email like '%@demo.frela';
