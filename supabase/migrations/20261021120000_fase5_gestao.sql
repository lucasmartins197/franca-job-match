-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 5: PAINEL DE GESTÃO (ADM)
-- Rodar UMA vez no SQL Editor do Supabase (modnamtaatcafqtjfzsd),
-- depois do SQL da Fase 4. Idempotente.
--
--  • Colunas de promoção/metas/indicação em profiles (protegidas contra
--    edição pelo próprio usuário)
--  • Funções de LEITURA para o painel (security definer + checagem de ADM):
--    visão geral, crescimento, receita mensal, listas de empresas,
--    profissionais, vagas, contratações, detalhe do usuário, indicações
--  • Funções de AÇÃO do ADM: promover (selos/destaque), ajustar meta,
--    liberar recompensa de indicação
--
-- Definições usadas nos números (também explicadas no painel):
--   ativo        = alguma atividade nos últimos 30 dias (cadastro, vaga,
--                  candidatura ou contratação)
--   assinante    = subscription_status = 'active' e não vencida
--   MRR          = soma do preço do plano de cada assinante
--   receita      = PROJETADA: MRR + taxas de 5% geradas (pendente,
--                  confirmada ou paga); pagamento real ainda não está ligado
--   inadimplente = empresa travada (saldo >= teto) ou com taxa em aberto
--                  há mais de 30 dias
--   ADMs não entram nas contagens.
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Colunas novas em profiles
-- ─────────────────────────────────────────────
alter table public.profiles add column if not exists destaque boolean not null default false;
alter table public.profiles add column if not exists selos_extras text[] not null default '{}';   -- ex.: {indicado}
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

-- Cadastro: mesmo comportamento de antes + código de indicação próprio e,
-- se o signUp mandar { indicacao: 'CODIGO' } no metadata, liga ao indicador.
-- (O "Indique e Ganhe" do app só precisa enviar esse campo no cadastro.)
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

-- ─────────────────────────────────────────────
-- 2. Constantes e auxiliares
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- 3. VISÃO GERAL
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- 4. LISTAS
-- ─────────────────────────────────────────────
create or replace function public.admin_listar_empresas(p_incluir_demo boolean default true)
returns table (
  id uuid, nome_empresa text, responsavel text, email text, telefone text, ramo text, cidade text, endereco text, cnpj text,
  assinatura_status text, assinatura_fim timestamptz, assinante boolean,
  vagas integer, vagas_abertas integer, contratacoes integer, contratacoes_finalizadas integer, movimentado numeric,
  saldo_taxas numeric, taxas_abertas integer, taxa_aberta_desde timestamptz, em_divergencia numeric, taxas_pagas numeric,
  travada boolean, perto_teto boolean, inadimplente boolean,
  avaliacao_media numeric, total_avaliacoes integer, verificado boolean, destaque boolean, selos_extras text[],
  ultima_atividade timestamptz, ativo boolean, created_at timestamptz, is_demo boolean
)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  perform public.frela_exige_admin();
  return query
    select p.id, coalesce(nullif(e.nome_empresa, ''), p.nome), p.nome, p.email, p.telefone, e.ramo, p.cidade, e.endereco, e.cnpj,
           coalesce(p.subscription_status, 'inactive'), p.subscription_end,
           (p.subscription_status = 'active' and (p.subscription_end is null or p.subscription_end > now())),
           coalesce(jv.vagas, 0), coalesce(jv.abertas, 0),
           coalesce(ct.total, 0), coalesce(ct.finalizadas, 0), coalesce(ct.movimentado, 0),
           coalesce(ct.saldo, 0), coalesce(ct.abertas, 0), ct.desde, coalesce(ct.divergencia, 0), coalesce(ct.pagas, 0),
           coalesce(ct.saldo, 0) >= public.frela_teto_taxas(),
           coalesce(ct.saldo, 0) >= public.frela_teto_taxas() * 0.7 and coalesce(ct.saldo, 0) < public.frela_teto_taxas(),
           coalesce(ct.saldo, 0) >= public.frela_teto_taxas() or (ct.desde is not null and ct.desde < now() - interval '30 days'),
           p.avaliacao_media, p.total_avaliacoes, p.verificado, p.destaque, p.selos_extras,
           ua.ultima_atividade, ua.ultima_atividade >= now() - interval '30 days', p.created_at, p.is_demo
      from public.profiles p
      left join public.empresa_dados e on e.profile_id = p.id
      join public.frela_ultima_atividade ua on ua.id = p.id
      left join lateral (
        select count(*)::int as vagas, count(*) filter (where j.status = 'aberta')::int as abertas
          from public.jobs j where j.user_id = p.id
      ) jv on true
      left join lateral (
        select count(*)::int as total,
               count(*) filter (where c.status = 'finalizada')::int as finalizadas,
               sum(c.valor) filter (where c.status = 'finalizada') as movimentado,
               sum(c.taxa_5pct) filter (where c.status_taxa in ('pendente','confirmada') and not coalesce(c.taxa_cobrada, false)) as saldo,
               count(*) filter (where c.status_taxa in ('pendente','confirmada') and not coalesce(c.taxa_cobrada, false))::int as abertas,
               min(c.finalizada_em) filter (where c.status_taxa in ('pendente','confirmada') and not coalesce(c.taxa_cobrada, false)) as desde,
               sum(c.taxa_5pct) filter (where c.status_taxa = 'em_divergencia') as divergencia,
               sum(c.taxa_5pct) filter (where c.status_taxa = 'paga') as pagas
          from public.contratacoes c where c.empresa_id = p.id
      ) ct on true
     where p.tipo = 'empresa' and not p.is_admin and (p_incluir_demo or not p.is_demo)
     order by p.created_at desc;
end;
$$;

create or replace function public.admin_listar_profissionais(p_incluir_demo boolean default true)
returns table (
  id uuid, nome text, email text, telefone text, profissoes text[], cidade text, disponibilidade text,
  assinatura_status text, assinatura_fim timestamptz, assinante boolean,
  avaliacao_media numeric, total_avaliacoes integer,
  candidaturas integer, trabalhos integer, meta_ajuste_trabalhos integer, meta_trabalhos integer, ganhos numeric,
  fotos_portfolio integer, verificado boolean, destaque boolean, selos_extras text[],
  indicado_por uuid, codigo_indicacao text,
  ultima_atividade timestamptz, ativo boolean, created_at timestamptz, is_demo boolean
)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  perform public.frela_exige_admin();
  return query
    select p.id, p.nome, p.email, p.telefone, d.profissoes, p.cidade, d.disponibilidade,
           coalesce(p.subscription_status, 'inactive'), p.subscription_end,
           (p.subscription_status = 'active' and (p.subscription_end is null or p.subscription_end > now())),
           p.avaliacao_media, p.total_avaliacoes,
           (select count(*)::int from public.applications a where a.user_id = p.id),
           (select count(*)::int from public.contratacoes c where c.profissional_id = p.id and c.status = 'finalizada'),
           p.meta_ajuste_trabalhos, public.frela_meta_trabalhos(),
           coalesce((select sum(c.valor) from public.contratacoes c where c.profissional_id = p.id and c.status = 'finalizada'), 0),
           (select count(*)::int from public.portfolio_fotos f where f.profile_id = p.id),
           p.verificado, p.destaque, p.selos_extras, p.indicado_por, p.codigo_indicacao,
           ua.ultima_atividade, ua.ultima_atividade >= now() - interval '30 days', p.created_at, p.is_demo
      from public.profiles p
      left join public.profissional_dados d on d.profile_id = p.id
      join public.frela_ultima_atividade ua on ua.id = p.id
     where p.tipo = 'freelancer' and not p.is_admin and (p_incluir_demo or not p.is_demo)
     order by p.created_at desc;
end;
$$;

create or replace function public.admin_listar_vagas(p_incluir_demo boolean default true)
returns table (
  id uuid, titulo text, empresa_id uuid, empresa text, categoria text, funcao text, data date, horario text,
  valor numeric, bairro text, status text, candidaturas integer, candidaturas_pendentes integer,
  profissional text, status_contratacao text, created_at timestamptz, is_demo boolean
)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  perform public.frela_exige_admin();
  return query
    select j.id, j.title, j.user_id, j.company_name, j.category, j.skill, j.date, j.time_start || '–' || j.time_end,
           j.payment, j.neighborhood, j.status,
           (select count(*)::int from public.applications a where a.job_id = j.id),
           (select count(*)::int from public.applications a where a.job_id = j.id and a.status = 'pendente'),
           (select pp.nome from public.contratacoes c join public.profiles pp on pp.id = c.profissional_id where c.job_id = j.id limit 1),
           (select c.status from public.contratacoes c where c.job_id = j.id limit 1),
           j.created_at, e.is_demo
      from public.jobs j
      join public.profiles e on e.id = j.user_id
     where p_incluir_demo or not e.is_demo
     order by j.created_at desc;
end;
$$;

create or replace function public.admin_listar_contratacoes(p_incluir_demo boolean default true)
returns table (
  id uuid, vaga text, empresa_id uuid, empresa text, profissional_id uuid, profissional text,
  valor numeric, status text, status_taxa text, taxa numeric, taxa_cobrada boolean, valor_contestado numeric,
  criada_em timestamptz, finalizada_em timestamptz, taxa_paga_em timestamptz, is_demo boolean
)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  perform public.frela_exige_admin();
  return query
    select c.id, j.title, c.empresa_id, coalesce(nullif(ed.nome_empresa, ''), e.nome), c.profissional_id, p.nome,
           c.valor, c.status, c.status_taxa, c.taxa_5pct, coalesce(c.taxa_cobrada, false), c.valor_contestado,
           c.created_at, c.finalizada_em, c.taxa_paga_em, e.is_demo
      from public.contratacoes c
      join public.jobs j on j.id = c.job_id
      join public.profiles e on e.id = c.empresa_id
      left join public.empresa_dados ed on ed.profile_id = c.empresa_id
      join public.profiles p on p.id = c.profissional_id
     where p_incluir_demo or not e.is_demo
     order by c.created_at desc;
end;
$$;

-- Tudo sobre um usuário (tela de detalhe do painel)
create or replace function public.admin_usuario_detalhe(p_id uuid)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  r jsonb;
begin
  perform public.frela_exige_admin();
  select jsonb_build_object(
    'profile', to_jsonb(p) || jsonb_build_object('ultima_atividade', ua.ultima_atividade),
    'empresa', (select to_jsonb(e) from public.empresa_dados e where e.profile_id = p.id),
    'profissional', (select to_jsonb(d) from public.profissional_dados d where d.profile_id = p.id),
    'contratacoes', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'vaga', j.title, 'valor', c.valor, 'status', c.status, 'status_taxa', c.status_taxa,
               'taxa', c.taxa_5pct, 'criada_em', c.created_at, 'finalizada_em', c.finalizada_em,
               'outra_parte', case when c.empresa_id = p.id then pp.nome else coalesce(nullif(ed.nome_empresa, ''), pe.nome) end
             ) order by c.created_at desc)
        from public.contratacoes c
        join public.jobs j on j.id = c.job_id
        join public.profiles pe on pe.id = c.empresa_id
        left join public.empresa_dados ed on ed.profile_id = c.empresa_id
        join public.profiles pp on pp.id = c.profissional_id
       where c.empresa_id = p.id or c.profissional_id = p.id), '[]'::jsonb),
    'vagas', coalesce((
      select jsonb_agg(jsonb_build_object('id', j.id, 'titulo', j.title, 'data', j.date, 'valor', j.payment, 'status', j.status,
                                          'candidaturas', (select count(*) from public.applications a where a.job_id = j.id))
                       order by j.created_at desc)
        from public.jobs j where j.user_id = p.id), '[]'::jsonb),
    'candidaturas', coalesce((
      select jsonb_agg(jsonb_build_object('vaga', j.title, 'empresa', j.company_name, 'status', a.status, 'criada_em', a.created_at)
                       order by a.created_at desc)
        from public.applications a join public.jobs j on j.id = a.job_id where a.user_id = p.id), '[]'::jsonb),
    'avaliacoes', coalesce((
      select jsonb_agg(jsonb_build_object('nota', a.nota, 'comentario', a.comentario, 'de', d.nome, 'criada_em', a.created_at)
                       order by a.created_at desc)
        from public.avaliacoes a join public.profiles d on d.id = a.de_id where a.para_id = p.id), '[]'::jsonb),
    'pagamentos', coalesce((
      select jsonb_agg(jsonb_build_object('tipo', g.tipo, 'valor', g.valor, 'status', g.status, 'referencia', g.stripe_id, 'criado_em', g.created_at)
                       order by g.created_at desc)
        from public.pagamentos g where g.user_id = p.id), '[]'::jsonb),
    'indicados', coalesce((
      select jsonb_agg(jsonb_build_object('id', i.id, 'nome', i.nome, 'tipo', i.tipo, 'criado_em', i.created_at) order by i.created_at desc)
        from public.profiles i where i.indicado_por = p.id), '[]'::jsonb),
    'indicado_por_nome', (select i.nome from public.profiles i where i.id = p.indicado_por),
    'suporte_mensagens', (select count(*) from public.suporte_mensagens s where s.user_id = p.id),
    'saldo_taxas', (select coalesce(sum(c.taxa_5pct), 0) from public.contratacoes c
                     where c.empresa_id = p.id and c.status_taxa in ('pendente','confirmada') and not coalesce(c.taxa_cobrada, false))
  ) into r
  from public.profiles p
  join public.frela_ultima_atividade ua on ua.id = p.id
  where p.id = p_id;

  return r;
end;
$$;

-- ─────────────────────────────────────────────
-- 5. INDICAÇÕES
-- ─────────────────────────────────────────────
create or replace function public.admin_indicacoes(p_incluir_demo boolean default true)
returns table (
  indicado_id uuid, indicado_nome text, indicado_tipo text, indicado_email text, cadastrado_em timestamptz,
  perfil_completo boolean, pagou boolean, recompensa_liberada boolean, recompensa_em timestamptz,
  indicador_id uuid, indicador_nome text, indicador_codigo text
)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  perform public.frela_exige_admin();
  return query
    select i.id, i.nome, i.tipo, i.email, i.created_at,
           i.foto_url is not null and coalesce(i.nome, '') <> '',
           (i.subscription_status = 'active') or exists (select 1 from public.pagamentos g where g.user_id = i.id and g.status = 'pago'),
           i.indicacao_recompensa_liberada, i.indicacao_recompensa_em,
           r.id, r.nome, r.codigo_indicacao
      from public.profiles i
      join public.profiles r on r.id = i.indicado_por
     where p_incluir_demo or not i.is_demo
     order by i.created_at desc;
end;
$$;

create or replace function public.admin_liberar_recompensa(p_indicado uuid, p_liberada boolean default true)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.frela_exige_admin();
  -- TODO (PAGAMENTO): quando o "Indique e Ganhe" tiver recompensa financeira, creditar aqui.
  update public.profiles
     set indicacao_recompensa_liberada = p_liberada,
         indicacao_recompensa_em = case when p_liberada then now() end
   where id = p_indicado and indicado_por is not null;
end;
$$;

-- ─────────────────────────────────────────────
-- 6. PROMOÇÃO E METAS (ações do ADM)
-- ─────────────────────────────────────────────
create or replace function public.admin_promover(
  p_id uuid,
  p_verificado boolean default null,
  p_destaque boolean default null,
  p_selos_extras text[] default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.frela_exige_admin();
  update public.profiles
     set verificado = coalesce(p_verificado, verificado),
         destaque = coalesce(p_destaque, destaque),
         selos_extras = coalesce(p_selos_extras, selos_extras)
   where id = p_id;
end;
$$;

create or replace function public.admin_ajustar_meta(p_id uuid, p_ajuste integer)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.frela_exige_admin();
  update public.profiles set meta_ajuste_trabalhos = coalesce(p_ajuste, 0) where id = p_id;
end;
$$;

-- ─────────────────────────────────────────────
-- 7. Permissões (todas as funções checam ADM por dentro)
-- ─────────────────────────────────────────────
grant execute on function public.admin_visao_geral(boolean) to authenticated;
grant execute on function public.admin_crescimento(integer, boolean) to authenticated;
grant execute on function public.admin_receita_mensal(integer, boolean) to authenticated;
grant execute on function public.admin_listar_empresas(boolean) to authenticated;
grant execute on function public.admin_listar_profissionais(boolean) to authenticated;
grant execute on function public.admin_listar_vagas(boolean) to authenticated;
grant execute on function public.admin_listar_contratacoes(boolean) to authenticated;
grant execute on function public.admin_usuario_detalhe(uuid) to authenticated;
grant execute on function public.admin_indicacoes(boolean) to authenticated;
grant execute on function public.admin_liberar_recompensa(uuid, boolean) to authenticated;
grant execute on function public.admin_promover(uuid, boolean, boolean, text[]) to authenticated;
grant execute on function public.admin_ajustar_meta(uuid, integer) to authenticated;
