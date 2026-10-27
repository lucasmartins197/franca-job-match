-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 1: AUTOMAÇÕES (triggers)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Candidatura nova → notifica a EMPRESA
create or replace function public.frela_notifica_candidatura()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_job record;
  v_nome text;
begin
  select id, user_id, title into v_job from public.jobs where id = new.job_id;
  select coalesce(nullif(nome, ''), 'Um profissional') into v_nome from public.profiles where id = new.user_id;

  insert into public.notificacoes (user_id, tipo, texto, link)
  values (
    v_job.user_id,
    'candidatura',
    coalesce(v_nome, 'Um profissional') || ' se candidatou à vaga "' || v_job.title || '"',
    '/job/' || v_job.id || '/candidates'
  );
  return new;
end;
$$;

drop trigger if exists frela_on_application_insert on public.applications;
create trigger frela_on_application_insert
  after insert on public.applications
  for each row execute function public.frela_notifica_candidatura();

-- 2. Contratação criada/finalizada → notifica o PROFISSIONAL
create or replace function public.frela_notifica_contratacao()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_title text;
begin
  select title into v_title from public.jobs where id = new.job_id;

  if tg_op = 'INSERT' then
    insert into public.notificacoes (user_id, tipo, texto, link)
    values (
      new.profissional_id,
      'confirmacao',
      'Você foi confirmado(a) na vaga "' || v_title || '"!',
      '/contratacao/' || new.id
    );
  elsif tg_op = 'UPDATE' and new.status = 'finalizada' and old.status is distinct from 'finalizada' then
    insert into public.notificacoes (user_id, tipo, texto, link)
    values (
      new.profissional_id,
      'finalizacao',
      'O serviço "' || v_title || '" foi finalizado. Avalie a empresa!',
      '/contratacao/' || new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists frela_on_contratacao_change on public.contratacoes;
create trigger frela_on_contratacao_change
  after insert or update on public.contratacoes
  for each row execute function public.frela_notifica_contratacao();

-- 3. Avaliação nova → recalcula média de quem recebeu + notifica
create or replace function public.frela_valida_avaliacao()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_c record;
begin
  select * into v_c from public.contratacoes where id = new.contratacao_id;
  if v_c.id is null or v_c.status <> 'finalizada' then
    raise exception 'Só é possível avaliar contratações finalizadas';
  end if;
  if not (
    (new.de_id = v_c.empresa_id and new.para_id = v_c.profissional_id) or
    (new.de_id = v_c.profissional_id and new.para_id = v_c.empresa_id)
  ) then
    raise exception 'Avaliação inválida para esta contratação';
  end if;
  return new;
end;
$$;

drop trigger if exists frela_before_avaliacao_insert on public.avaliacoes;
create trigger frela_before_avaliacao_insert
  before insert on public.avaliacoes
  for each row execute function public.frela_valida_avaliacao();

create or replace function public.frela_pos_avaliacao()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles p
     set avaliacao_media = s.media,
         total_avaliacoes = s.total
    from (
      select round(avg(nota)::numeric, 2) as media, count(*)::int as total
        from public.avaliacoes
       where para_id = new.para_id
    ) s
   where p.id = new.para_id;

  insert into public.notificacoes (user_id, tipo, texto, link)
  values (
    new.para_id,
    'avaliacao',
    'Você recebeu uma avaliação de ' || new.nota || ' estrela(s)',
    '/contratacao/' || new.contratacao_id
  );
  return new;
end;
$$;

drop trigger if exists frela_after_avaliacao_insert on public.avaliacoes;
create trigger frela_after_avaliacao_insert
  after insert on public.avaliacoes
  for each row execute function public.frela_pos_avaliacao();

-- 4. TRAVA: empresa não cria vaga com contratação em andamento
create or replace function public.frela_trava_nova_vaga()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (
    select 1 from public.contratacoes
     where empresa_id = new.user_id and status = 'em_andamento'
  ) then
    raise exception 'TRAVA_CONTRATACAO_EM_ANDAMENTO: confirme a finalização da contratação anterior antes de criar uma nova vaga';
  end if;
  return new;
end;
$$;

drop trigger if exists frela_before_job_insert on public.jobs;
create trigger frela_before_job_insert
  before insert on public.jobs
  for each row execute function public.frela_trava_nova_vaga();

-- 5. Realtime para o sino de notificações
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notificacoes'
  ) then
    alter publication supabase_realtime add table public.notificacoes;
  end if;
end $$;
