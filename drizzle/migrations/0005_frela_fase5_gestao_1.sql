-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 5: PAINEL DE GESTÃO (ADM) — parte 1
-- ═══════════════════════════════════════════════════════════════════

-- 1. Colunas novas em profiles
alter table public.profiles add column if not exists destaque boolean not null default false;
alter table public.profiles add column if not exists selos_extras text[] not null default '{}';
alter table public.profiles add column if not exists meta_ajuste_trabalhos integer not null default 0;
alter table public.profiles add column if not exists codigo_indicacao text;
alter table public.profiles add column if not exists indicado_por uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists indicacao_recompensa_liberada boolean not null default false;
alter table public.profiles add column if not exists indicacao_recompensa_em timestamptz;

create unique index if not exists profiles_codigo_indicacao_key on public.profiles (codigo_indicacao);
create index if not exists profiles_indicado_por_idx on public.profiles (indicado_por);

update public.profiles
   set codigo_indicacao = upper(substr(md5(id::text), 1, 6))
 where codigo_indicacao is null;

-- Proteção (substitui a da Fase 3, acrescentando os campos novos)
create or replace function public.frela_protege_campos_perfil()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'authenticated' then
    new.tipo                := old.tipo;
    new.email               := old.email;
    new.verificado          := old.verificado;
    new.is_admin            := old.is_admin;
    new.is_demo             := old.is_demo;
    new.avaliacao_media     := old.avaliacao_media;
    new.total_avaliacoes    := old.total_avaliacoes;
    new.subscription_status := old.subscription_status;
    new.subscription_end    := old.subscription_end;
    new.stripe_customer_id  := old.stripe_customer_id;
    new.cartao_cadastrado   := old.cartao_cadastrado;
    new.destaque            := old.destaque;
    new.selos_extras        := old.selos_extras;
    new.meta_ajuste_trabalhos := old.meta_ajuste_trabalhos;
    new.codigo_indicacao    := old.codigo_indicacao;
    new.indicado_por        := old.indicado_por;
    new.indicacao_recompensa_liberada := old.indicacao_recompensa_liberada;
    new.indicacao_recompensa_em := old.indicacao_recompensa_em;
  end if;
  return new;
end;
$$;

-- Cadastro: código de indicação próprio e vínculo com o indicador do metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_indicador uuid;
begin
  if coalesce(new.raw_user_meta_data->>'indicacao', '') <> '' then
    select id into v_indicador from public.profiles
     where codigo_indicacao = upper(btrim(new.raw_user_meta_data->>'indicacao'));
  end if;

  insert into public.profiles (id, email, tipo, nome, telefone, codigo_indicacao, indicado_por)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'tipo', 'freelancer'),
    coalesce(new.raw_user_meta_data->>'nome', ''),
    new.raw_user_meta_data->>'telefone',
    upper(substr(md5(new.id::text), 1, 6)),
    v_indicador
  );
  return new;
end;
$$;

-- 2. Constantes e auxiliares
create or replace function public.frela_preco_assinatura(p_tipo text) returns numeric
language sql immutable as $$ select case when p_tipo = 'empresa' then 89.90 else 39.90 end::numeric $$;

create or replace function public.frela_meta_trabalhos() returns integer
language sql immutable as $$ select 10 $$;

create or replace function public.frela_exige_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Apenas administradores'; end if;
end;
$$;

-- Última atividade de cada usuário (cadastro, vaga, candidatura, contratação)
create or replace view public.frela_ultima_atividade as
select p.id,
       greatest(
         p.created_at,
         (select max(j.created_at) from public.jobs j where j.user_id = p.id),
         (select max(a.created_at) from public.applications a where a.user_id = p.id),
         (select max(greatest(c.created_at, coalesce(c.finalizada_em, c.created_at))) from public.contratacoes c
           where c.empresa_id = p.id or c.profissional_id = p.id)
       ) as ultima_atividade
  from public.profiles p;
revoke all on public.frela_ultima_atividade from anon, authenticated;

-- 3. VISÃO GERAL
create or replace function public.admin_visao_geral(p_incluir_demo boolean default true)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  r jsonb;
  v_mes timestamptz := date_trunc('month', now());
begin
  perform public.frela_exige_admin();

  with u as (
    select p.*, ua.ultima_atividade,
           (p.subscription_status = 'active' and (p.subscription_end is null or p.subscription_end > now())) as assinante
      from public.profiles p
      join public.frela_ultima_atividade ua on ua.id = p.id
     where not p.is_admin and (p_incluir_demo or not p.is_demo)
  ),
  c as (
    select c.* from public.contratacoes c
      join public.profiles e on e.id = c.empresa_id
     where p_incluir_demo or not e.is_demo
  ),
  j as (
    select j.* from public.jobs j
      join public.profiles e on e.id = j.user_id
     where p_incluir_demo or not e.is_demo
  ),
  taxas as (
    select
      coalesce(sum(taxa_5pct) filter (where status = 'finalizada' and status_taxa in ('pendente','confirmada','paga') and finalizada_em >= v_mes), 0) as taxas_mes,
      coalesce(sum(taxa_5pct) filter (where status = 'finalizada' and status_taxa in ('pendente','confirmada','paga')), 0) as taxas_total,
      coalesce(sum(taxa_5pct) filter (where status_taxa = 'paga'), 0) as taxas_pagas,
      coalesce(sum(taxa_5pct) filter (where status_taxa in ('pendente','confirmada') and not coalesce(taxa_cobrada, false)), 0) as taxas_a_receber,
      count(*) filter (where status_taxa = 'em_divergencia') as divergencias,
      count(*) filter (where created_at >= v_mes) as contratacoes_mes,
      count(*) as contratacoes_total,
      coalesce(sum(valor) filter (where status = 'finalizada' and finalizada_em >= v_mes), 0) as movimentado_mes,
      coalesce(sum(valor) filter (where status = 'finalizada'), 0) as movimentado_total
    from c
  ),
  ass as (
    select
      count(*) filter (where tipo = 'empresa') as empresas,
      count(*) filter (where tipo = 'freelancer') as profissionais,
      count(*) filter (where tipo = 'empresa' and ultima_atividade >= now() - interval '30 days') as empresas_ativas,
      count(*) filter (where tipo = 'freelancer' and ultima_atividade >= now() - interval '30 days') as profissionais_ativos,
      count(*) filter (where created_at >= v_mes) as cadastros_mes,
      count(*) filter (where assinante and tipo = 'empresa') as assinantes_empresa,
      count(*) filter (where assinante and tipo = 'freelancer') as assinantes_profissional,
      coalesce(sum(public.frela_preco_assinatura(tipo)) filter (where assinante), 0) as mrr
    from u
  ),
  pag as (
    select coalesce(sum(valor), 0) as assinaturas_registradas
      from public.pagamentos p
      join public.profiles pr on pr.id = p.user_id
     where p.tipo = 'assinatura' and p.status = 'pago' and (p_incluir_demo or not pr.is_demo)
  )
  select jsonb_build_object(
    'empresas', ass.empresas,
    'profissionais', ass.profissionais,
    'cadastros', ass.empresas + ass.profissionais,
    'cadastros_mes', ass.cadastros_mes,
    'empresas_ativas', ass.empresas_ativas,
    'profissionais_ativos', ass.profissionais_ativos,
    'assinantes_empresa', ass.assinantes_empresa,
    'assinantes_profissional', ass.assinantes_profissional,
    'conversao', case when ass.empresas + ass.profissionais = 0 then 0
                      else round((ass.assinantes_empresa + ass.assinantes_profissional)::numeric / (ass.empresas + ass.profissionais), 4) end,
    'mrr', ass.mrr,
    'taxas_mes', t.taxas_mes,
    'taxas_total', t.taxas_total,
    'taxas_pagas', t.taxas_pagas,
    'taxas_a_receber', t.taxas_a_receber,
    'receita_mes', ass.mrr + t.taxas_mes,
    'receita_acumulada', pag.assinaturas_registradas + t.taxas_total,
    'assinaturas_registradas', pag.assinaturas_registradas,
    'contratacoes_mes', t.contratacoes_mes,
    'contratacoes_total', t.contratacoes_total,
    'movimentado_mes', t.movimentado_mes,
    'movimentado_total', t.movimentado_total,
    'divergencias', t.divergencias,
    'vagas', (select jsonb_build_object(
        'aberta', count(*) filter (where status = 'aberta'),
        'preenchida', count(*) filter (where status = 'preenchida'),
        'finalizada', count(*) filter (where status = 'finalizada'),
        'cancelada', count(*) filter (where status = 'cancelada')) from j),
    'suporte_abertos', (select count(distinct s.user_id) from public.suporte_mensagens s
                         where s.autor_id = s.user_id and not s.lida_admin),
    'empresas_travadas', (select count(*) from public.taxas_saldo_empresas x
                           join public.profiles e on e.id = x.empresa_id
                          where x.saldo >= public.frela_teto_taxas() and (p_incluir_demo or not e.is_demo)),
    'teto_taxas', public.frela_teto_taxas(),
    'precos', jsonb_build_object('empresa', public.frela_preco_assinatura('empresa'), 'freelancer', public.frela_preco_assinatura('freelancer'))
  ) into r
  from ass, taxas t, pag;

  return r;
end;
$$;

-- Crescimento por semana (cadastros e contratações)
create or replace function public.admin_crescimento(p_semanas integer default 12, p_incluir_demo boolean default true)
returns table (semana date, empresas integer, profissionais integer, contratacoes integer)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  perform public.frela_exige_admin();
  return query
    with s as (
      select generate_series(date_trunc('week', now()) - make_interval(weeks => p_semanas - 1), date_trunc('week', now()), interval '1 week') as ini
    )
    select s.ini::date,
           (select count(*)::int from public.profiles p where p.tipo = 'empresa' and not p.is_admin and (p_incluir_demo or not p.is_demo)
              and p.created_at >= s.ini and p.created_at < s.ini + interval '1 week'),
           (select count(*)::int from public.profiles p where p.tipo = 'freelancer' and not p.is_admin and (p_incluir_demo or not p.is_demo)
              and p.created_at >= s.ini and p.created_at < s.ini + interval '1 week'),
           (select count(*)::int from public.contratacoes c join public.profiles e on e.id = c.empresa_id
             where (p_incluir_demo or not e.is_demo) and c.created_at >= s.ini and c.created_at < s.ini + interval '1 week')
      from s order by s.ini;
end;
$$;

-- Receita projetada por mês (taxas geradas + MRR atual como referência)
create or replace function public.admin_receita_mensal(p_meses integer default 6, p_incluir_demo boolean default true)
returns table (mes date, taxas numeric, movimentado numeric, contratacoes integer)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  perform public.frela_exige_admin();
  return query
    with m as (
      select generate_series(date_trunc('month', now()) - make_interval(months => p_meses - 1), date_trunc('month', now()), interval '1 month') as ini
    )
    select m.ini::date,
           coalesce((select sum(c.taxa_5pct) from public.contratacoes c join public.profiles e on e.id = c.empresa_id
                      where (p_incluir_demo or not e.is_demo) and c.status = 'finalizada' and c.status_taxa in ('pendente','confirmada','paga')
                        and c.finalizada_em >= m.ini and c.finalizada_em < m.ini + interval '1 month'), 0),
           coalesce((select sum(c.valor) from public.contratacoes c join public.profiles e on e.id = c.empresa_id
                      where (p_incluir_demo or not e.is_demo) and c.status = 'finalizada'
                        and c.finalizada_em >= m.ini and c.finalizada_em < m.ini + interval '1 month'), 0),
           (select count(*)::int from public.contratacoes c join public.profiles e on e.id = c.empresa_id
             where (p_incluir_demo or not e.is_demo) and c.status = 'finalizada'
               and c.finalizada_em >= m.ini and c.finalizada_em < m.ini + interval '1 month')
      from m order by m.ini;
end;
$$;

grant execute on function public.admin_visao_geral(boolean) to authenticated;
grant execute on function public.admin_crescimento(integer, boolean) to authenticated;
grant execute on function public.admin_receita_mensal(integer, boolean) to authenticated;
