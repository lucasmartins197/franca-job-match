-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 6: CRESCIMENTO (Metas/Selos, Recomendações, Indique e Ganhe)
-- Rodar UMA vez no SQL Editor do Supabase (modnamtaatcafqtjfzsd),
-- depois do SQL da Fase 5. Idempotente.
--
-- B) SELO "INDICADO" (automático): profissional com >= 10 trabalhos
--    finalizados (+ ajuste do ADM) e nota média >= 4,5 (com >= 3 avaliações).
--    O ADM também pode conceder manualmente (selos_extras = {indicado}).
--    Calculado só a partir de contratações finalizadas — o usuário não altera.
-- C) RECOMENDAÇÕES: funções públicas (só dados de vitrine) que ordenam por
--    selo > avaliação > nº de trabalhos.
-- A) INDIQUE E GANHE: tabela indicacoes + créditos de taxas. Quando a empresa
--    indicada ativa a assinatura, quem indicou (empresa) ganha R$ 50 de crédito,
--    que abate o saldo de taxas (mesmo mecanismo da Fase 4: saldo, teto, trava).
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 0. Constantes
-- ─────────────────────────────────────────────
create or replace function public.frela_nota_minima_indicado() returns numeric
language sql immutable as $$ select 4.5::numeric $$;

create or replace function public.frela_recompensa_indicacao() returns numeric
language sql immutable as $$ select 50.00::numeric $$;

-- Regra do selo "Indicado" (a mesma usada no app em src/hooks/usePerfil.ts)
create or replace function public.frela_eh_indicado(
  p_trabalhos integer, p_ajuste integer, p_media numeric, p_total_avaliacoes integer, p_selos text[]
) returns boolean
language sql immutable as $$
  select coalesce('indicado' = any(p_selos), false)
      or (coalesce(p_trabalhos, 0) + coalesce(p_ajuste, 0) >= public.frela_meta_trabalhos()
          and coalesce(p_total_avaliacoes, 0) >= 3
          and coalesce(p_media, 0) >= public.frela_nota_minima_indicado());
$$;

-- ─────────────────────────────────────────────
-- 1. RECOMENDAÇÕES (vitrine) — só campos públicos
-- ─────────────────────────────────────────────
create or replace function public.recomendados_profissionais(p_limite integer default 50)
returns table (
  id uuid, nome text, foto_url text, cidade text, profissoes text[], disponibilidade text,
  avaliacao_media numeric, total_avaliacoes integer, trabalhos integer,
  verificado boolean, destaque boolean, indicado boolean, top_avaliado boolean, relevancia integer
)
language sql
stable
security definer set search_path = public
as $$
  with base as (
    select p.id, p.nome, p.foto_url, p.cidade, d.profissoes, d.disponibilidade,
           coalesce(p.avaliacao_media, 0) as media, coalesce(p.total_avaliacoes, 0) as total,
           (select count(*)::int from public.contratacoes c where c.profissional_id = p.id and c.status = 'finalizada') as trabalhos,
           p.verificado, p.destaque, p.meta_ajuste_trabalhos, p.selos_extras
      from public.profiles p
      left join public.profissional_dados d on d.profile_id = p.id
     where p.tipo = 'freelancer' and not p.is_admin and p.foto_url is not null
  ),
  s as (
    select b.*,
           public.frela_eh_indicado(b.trabalhos, b.meta_ajuste_trabalhos, b.media, b.total, b.selos_extras) as indicado,
           (b.total >= 3 and b.media >= 4.7) as top
      from base b
  )
  select s.id, s.nome, s.foto_url, s.cidade, s.profissoes, s.disponibilidade, s.media, s.total, s.trabalhos,
         s.verificado, s.destaque, s.indicado, s.top,
         (case when s.indicado then 4 else 0 end) + (case when s.verificado then 2 else 0 end)
           + (case when s.destaque then 2 else 0 end) + (case when s.top then 1 else 0 end) as relevancia
    from s
   order by relevancia desc, s.media desc, s.trabalhos desc, s.total desc
   limit greatest(1, least(p_limite, 200));
$$;

create or replace function public.recomendadas_empresas(p_limite integer default 50)
returns table (
  id uuid, nome_empresa text, foto_url text, ramo text, cidade text, endereco text,
  avaliacao_media numeric, total_avaliacoes integer, contratacoes integer, vagas_abertas integer,
  verificado boolean, destaque boolean, top_avaliada boolean, relevancia integer
)
language sql
stable
security definer set search_path = public
as $$
  with base as (
    select p.id, coalesce(nullif(e.nome_empresa, ''), p.nome) as nome, p.foto_url, e.ramo, p.cidade, e.endereco,
           coalesce(p.avaliacao_media, 0) as media, coalesce(p.total_avaliacoes, 0) as total,
           (select count(*)::int from public.contratacoes c where c.empresa_id = p.id and c.status = 'finalizada') as contratacoes,
           (select count(*)::int from public.jobs j where j.user_id = p.id and j.status = 'aberta' and j.date >= current_date) as abertas,
           p.verificado, p.destaque
      from public.profiles p
      left join public.empresa_dados e on e.profile_id = p.id
     where p.tipo = 'empresa' and not p.is_admin and p.foto_url is not null
  )
  select b.id, b.nome, b.foto_url, b.ramo, b.cidade, b.endereco, b.media, b.total, b.contratacoes, b.abertas,
         b.verificado, b.destaque, (b.total >= 3 and b.media >= 4.7),
         (case when b.verificado then 2 else 0 end) + (case when b.destaque then 2 else 0 end)
           + (case when b.total >= 3 and b.media >= 4.7 then 1 else 0 end) as relevancia
    from base b
   order by relevancia desc, b.media desc, b.contratacoes desc, b.abertas desc
   limit greatest(1, least(p_limite, 200));
$$;

grant execute on function public.recomendados_profissionais(integer) to authenticated;
grant execute on function public.recomendadas_empresas(integer) to authenticated;

-- ─────────────────────────────────────────────
-- 2. INDICAÇÕES
-- ─────────────────────────────────────────────
create table if not exists public.indicacoes (
  id uuid primary key default gen_random_uuid(),
  indicador_id uuid not null references public.profiles(id) on delete cascade,
  indicado_id uuid not null unique references public.profiles(id) on delete cascade,
  codigo text not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'cadastrou', 'pagou', 'recompensado')),
  recompensa_valor numeric,
  recompensado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (indicador_id <> indicado_id)
);
create index if not exists indicacoes_indicador_idx on public.indicacoes (indicador_id);
alter table public.indicacoes enable row level security;

-- Só leitura: quem indicou vê as próprias indicações; ADM vê todas. Ninguém escreve pelo app.
drop policy if exists "indicador ve suas indicacoes" on public.indicacoes;
create policy "indicador ve suas indicacoes" on public.indicacoes
  for select to authenticated using (auth.uid() = indicador_id or public.is_admin());

-- Créditos que abatem o saldo de taxas (ex.: recompensa de indicação)
create table if not exists public.creditos_taxas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.profiles(id) on delete cascade,
  valor numeric not null check (valor > 0),
  saldo numeric not null check (saldo >= 0),          -- quanto ainda não foi usado
  origem text not null default 'indicacao',
  indicacao_id uuid references public.indicacoes(id) on delete set null,
  descricao text,
  created_at timestamptz not null default now()
);
create index if not exists creditos_taxas_empresa_idx on public.creditos_taxas (empresa_id);
create unique index if not exists creditos_taxas_indicacao_key on public.creditos_taxas (indicacao_id) where indicacao_id is not null;
alter table public.creditos_taxas enable row level security;

drop policy if exists "empresa ve seus creditos" on public.creditos_taxas;
create policy "empresa ve seus creditos" on public.creditos_taxas
  for select to authenticated using (auth.uid() = empresa_id or public.is_admin());

-- Validar código no cadastro (mostra "Indicado por <empresa>")
create or replace function public.validar_codigo_indicacao(p_codigo text)
returns text
language sql
stable
security definer set search_path = public
as $$
  select coalesce(nullif(e.nome_empresa, ''), p.nome)
    from public.profiles p left join public.empresa_dados e on e.profile_id = p.id
   where p.codigo_indicacao = upper(btrim(p_codigo)) and not p.is_admin
   limit 1;
$$;
grant execute on function public.validar_codigo_indicacao(text) to anon, authenticated;

-- Cadastro: além do que já fazia, registra a indicação (status 'pendente')
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_indicador uuid;
  v_codigo text := upper(btrim(coalesce(new.raw_user_meta_data->>'indicacao', '')));
begin
  if v_codigo <> '' then
    select id into v_indicador from public.profiles where codigo_indicacao = v_codigo;
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

  if v_indicador is not null then
    insert into public.indicacoes (indicador_id, indicado_id, codigo, status)
    values (v_indicador, new.id, v_codigo, 'pendente')
    on conflict (indicado_id) do nothing;
  end if;
  return new;
end;
$$;

-- Indicações antigas (Fase 5) entram na tabela
insert into public.indicacoes (indicador_id, indicado_id, codigo, status, created_at)
select p.indicado_por, p.id, coalesce(r.codigo_indicacao, ''),
       case when p.foto_url is not null then 'cadastrou' else 'pendente' end, p.created_at
  from public.profiles p join public.profiles r on r.id = p.indicado_por
 where p.indicado_por is not null
on conflict (indicado_id) do nothing;

-- Concede a recompensa: crédito de R$ 50 nas taxas de quem indicou (empresa → empresa)
create or replace function public.frela_conceder_recompensa(p_indicacao uuid, p_forcar boolean default false)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  i record;
  v_valor numeric := public.frela_recompensa_indicacao();
  v_nome text;
begin
  select ind.*, r.tipo as tipo_indicador, d.tipo as tipo_indicado, coalesce(nullif(ed.nome_empresa, ''), d.nome) as nome_indicado
    into i
    from public.indicacoes ind
    join public.profiles r on r.id = ind.indicador_id
    join public.profiles d on d.id = ind.indicado_id
    left join public.empresa_dados ed on ed.profile_id = d.id
   where ind.id = p_indicacao
   for update of ind;

  if i.id is null or i.status = 'recompensado' then return 0; end if;
  -- Regra do programa: empresa indicando empresa que ASSINOU
  if not p_forcar and (i.tipo_indicador <> 'empresa' or i.tipo_indicado <> 'empresa' or i.status <> 'pagou') then
    return 0;
  end if;

  insert into public.creditos_taxas (empresa_id, valor, saldo, origem, indicacao_id, descricao)
  values (i.indicador_id, v_valor, v_valor, 'indicacao', i.id, 'Indicação: ' || coalesce(i.nome_indicado, 'empresa'))
  on conflict do nothing;

  update public.indicacoes
     set status = 'recompensado', recompensa_valor = v_valor, recompensado_em = now(), updated_at = now()
   where id = i.id;
  update public.profiles
     set indicacao_recompensa_liberada = true, indicacao_recompensa_em = now()
   where id = i.indicado_id;

  insert into public.notificacoes (user_id, tipo, texto, link)
  values (i.indicador_id, 'indicacao',
          'Você ganhou ' || public.frela_brl(v_valor) || ' de desconto nas taxas! ' || coalesce(i.nome_indicado, 'Sua indicação') || ' assinou o FreLa.',
          '/taxas');
  return v_valor;
end;
$$;
revoke all on function public.frela_conceder_recompensa(uuid, boolean) from public;
revoke all on function public.frela_conceder_recompensa(uuid, boolean) from anon, authenticated;

-- Avança o status da indicação conforme o indicado evolui:
--   perfil completo (foto) → 'cadastrou'; assinatura ativa → 'pagou' → recompensa.
-- TODO (PAGAMENTO): hoje a assinatura vira 'active' manualmente/ADM. Quando o IAP
--   estiver ligado, a Edge Function `validar-assinatura` grava subscription_status =
--   'active' e este trigger dispara a recompensa automaticamente — nada a mudar aqui.
create or replace function public.frela_indicacao_progresso()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_ind uuid;
begin
  if new.foto_url is not null and old.foto_url is null then
    update public.indicacoes set status = 'cadastrou', updated_at = now()
     where indicado_id = new.id and status = 'pendente';
  end if;

  if new.subscription_status = 'active' and old.subscription_status is distinct from 'active' then
    update public.indicacoes set status = 'pagou', updated_at = now()
     where indicado_id = new.id and status in ('pendente', 'cadastrou')
     returning id into v_ind;
    if v_ind is not null then
      perform public.frela_conceder_recompensa(v_ind);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists frela_after_profile_indicacao on public.profiles;
create trigger frela_after_profile_indicacao
  after update on public.profiles
  for each row execute function public.frela_indicacao_progresso();

-- ─────────────────────────────────────────────
-- 3. Saldo de taxas passa a ser LÍQUIDO de créditos
--    (trava, teto e quitação da Fase 4 usam estas funções)
-- ─────────────────────────────────────────────
create or replace function public.creditos_disponiveis(p_empresa uuid)
returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(saldo), 0) from public.creditos_taxas where empresa_id = p_empresa;
$$;
revoke all on function public.creditos_disponiveis(uuid) from public;
revoke all on function public.creditos_disponiveis(uuid) from anon, authenticated;

create or replace function public.saldo_taxas_empresa(p_empresa uuid)
returns numeric
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() <> p_empresa and not public.is_admin() then
    raise exception 'Sem permissão para ver o saldo desta empresa';
  end if;
  return greatest(0, coalesce((
    select sum(taxa_5pct) from public.contratacoes
     where empresa_id = p_empresa
       and status = 'finalizada'
       and status_taxa in ('pendente', 'confirmada')
       and not coalesce(taxa_cobrada, false)
  ), 0) - public.creditos_disponiveis(p_empresa));
end;
$$;

create or replace view public.taxas_saldo_empresas
with (security_invoker = true) as
select c.empresa_id,
       greatest(0, coalesce(sum(c.taxa_5pct) filter (where c.status_taxa in ('pendente', 'confirmada') and not coalesce(c.taxa_cobrada, false)), 0)
                   - coalesce((select sum(k.saldo) from public.creditos_taxas k where k.empresa_id = c.empresa_id), 0)) as saldo,
       coalesce(sum(c.taxa_5pct) filter (where c.status_taxa = 'pendente'), 0)       as a_confirmar,
       coalesce(sum(c.taxa_5pct) filter (where c.status_taxa = 'confirmada' and not coalesce(c.taxa_cobrada, false)), 0) as confirmado,
       coalesce(sum(c.taxa_5pct) filter (where c.status_taxa = 'em_divergencia'), 0) as em_divergencia,
       coalesce(sum(c.taxa_5pct) filter (where c.status_taxa = 'paga'), 0)           as pago,
       coalesce((select sum(k.saldo) from public.creditos_taxas k where k.empresa_id = c.empresa_id), 0) as creditos
  from public.contratacoes c
 where c.status = 'finalizada'
 group by c.empresa_id;
grant select on public.taxas_saldo_empresas to authenticated;

drop function if exists public.minhas_taxas_resumo();
create function public.minhas_taxas_resumo()
returns table (
  saldo numeric, a_confirmar numeric, confirmado numeric, em_divergencia numeric, pago numeric,
  teto numeric, bloqueado boolean, pode_renovar boolean, creditos numeric, bruto numeric
)
language sql
stable
security definer set search_path = public
as $$
  with t as (
    select
      coalesce(sum(taxa_5pct) filter (where status_taxa in ('pendente', 'confirmada') and not coalesce(taxa_cobrada, false)), 0) as bruto,
      coalesce(sum(taxa_5pct) filter (where status_taxa = 'pendente'), 0) as a_confirmar,
      coalesce(sum(taxa_5pct) filter (where status_taxa = 'confirmada' and not coalesce(taxa_cobrada, false)), 0) as confirmado,
      coalesce(sum(taxa_5pct) filter (where status_taxa = 'em_divergencia'), 0) as em_divergencia,
      coalesce(sum(taxa_5pct) filter (where status_taxa = 'paga'), 0) as pago
    from public.contratacoes
    where empresa_id = auth.uid() and status = 'finalizada'
  ), k as (
    select public.creditos_disponiveis(auth.uid()) as creditos
  )
  select greatest(0, t.bruto - k.creditos), t.a_confirmar, t.confirmado, t.em_divergencia, t.pago,
         public.frela_teto_taxas(),
         greatest(0, t.bruto - k.creditos) >= public.frela_teto_taxas(),
         greatest(0, t.bruto - k.creditos) = 0 and t.em_divergencia = 0,
         k.creditos, t.bruto
    from t, k;
$$;
grant execute on function public.minhas_taxas_resumo() to authenticated;

-- Renovação: taxas cobertas pelo crédito não impedem
create or replace function public.pode_renovar_assinatura()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.saldo_taxas_empresa(auth.uid()) = 0
     and not exists (
       select 1 from public.contratacoes
        where empresa_id = auth.uid() and status = 'finalizada' and status_taxa = 'em_divergencia'
     );
$$;

-- Quitação: usa primeiro os créditos (mais antigos primeiro), registra o restante como pago
create or replace function public.frela_quitar_taxas(p_empresa uuid, p_referencia text default null)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_bruto numeric := 0;
  v_credito_usado numeric := 0;
  v_resta numeric;
  r record;
  k record;
begin
  for r in
    select id, taxa_5pct from public.contratacoes
     where empresa_id = p_empresa and status = 'finalizada'
       and status_taxa in ('pendente', 'confirmada') and not coalesce(taxa_cobrada, false)
     for update
  loop
    insert into public.pagamentos (user_id, tipo, valor, status, stripe_id, contratacao_id)
    values (p_empresa, 'taxa_5pct', r.taxa_5pct, 'pago', p_referencia, r.id);
    update public.contratacoes
       set status_taxa = 'paga', taxa_cobrada = true, taxa_paga_em = now()
     where id = r.id;
    v_bruto := v_bruto + r.taxa_5pct;
  end loop;

  -- consome créditos
  v_resta := v_bruto;
  for k in select id, saldo from public.creditos_taxas where empresa_id = p_empresa and saldo > 0 order by created_at for update loop
    exit when v_resta <= 0;
    if k.saldo >= v_resta then
      update public.creditos_taxas set saldo = saldo - v_resta where id = k.id;
      v_credito_usado := v_credito_usado + v_resta;
      v_resta := 0;
    else
      update public.creditos_taxas set saldo = 0 where id = k.id;
      v_credito_usado := v_credito_usado + k.saldo;
      v_resta := v_resta - k.saldo;
    end if;
  end loop;

  if v_credito_usado > 0 then
    insert into public.pagamentos (user_id, tipo, valor, status, stripe_id)
    values (p_empresa, 'credito_indicacao', -v_credito_usado, 'aplicado', p_referencia);
  end if;

  if v_bruto > 0 then
    insert into public.notificacoes (user_id, tipo, texto, link)
    values (p_empresa, 'taxa',
            'Taxas de ' || public.frela_brl(v_bruto) || ' quitadas' ||
              case when v_credito_usado > 0 then ' (' || public.frela_brl(v_credito_usado) || ' com crédito de indicação)' else '' end ||
              '. Obrigado! Sua conta está liberada.',
            '/taxas');
  end if;
  return v_bruto - v_credito_usado;   -- valor efetivamente cobrado
end;
$$;
revoke all on function public.frela_quitar_taxas(uuid, text) from public;
revoke all on function public.frela_quitar_taxas(uuid, text) from anon, authenticated;

-- Listagem do ADM (Fase 5): saldo líquido + créditos
drop function if exists public.admin_listar_empresas(boolean);
create function public.admin_listar_empresas(p_incluir_demo boolean default true)
returns table (
  id uuid, nome_empresa text, responsavel text, email text, telefone text, ramo text, cidade text, endereco text, cnpj text,
  assinatura_status text, assinatura_fim timestamptz, assinante boolean,
  vagas integer, vagas_abertas integer, contratacoes integer, contratacoes_finalizadas integer, movimentado numeric,
  saldo_taxas numeric, taxas_abertas integer, taxa_aberta_desde timestamptz, em_divergencia numeric, taxas_pagas numeric,
  travada boolean, perto_teto boolean, inadimplente boolean,
  avaliacao_media numeric, total_avaliacoes integer, verificado boolean, destaque boolean, selos_extras text[],
  ultima_atividade timestamptz, ativo boolean, created_at timestamptz, is_demo boolean,
  creditos numeric, indicacoes integer
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
           greatest(0, coalesce(ct.bruto, 0) - coalesce(kr.creditos, 0)), coalesce(ct.abertas, 0), ct.desde,
           coalesce(ct.divergencia, 0), coalesce(ct.pagas, 0),
           greatest(0, coalesce(ct.bruto, 0) - coalesce(kr.creditos, 0)) >= public.frela_teto_taxas(),
           greatest(0, coalesce(ct.bruto, 0) - coalesce(kr.creditos, 0)) >= public.frela_teto_taxas() * 0.7
             and greatest(0, coalesce(ct.bruto, 0) - coalesce(kr.creditos, 0)) < public.frela_teto_taxas(),
           greatest(0, coalesce(ct.bruto, 0) - coalesce(kr.creditos, 0)) >= public.frela_teto_taxas()
             or (ct.desde is not null and ct.desde < now() - interval '30 days' and coalesce(ct.bruto, 0) > coalesce(kr.creditos, 0)),
           p.avaliacao_media, p.total_avaliacoes, p.verificado, p.destaque, p.selos_extras,
           ua.ultima_atividade, ua.ultima_atividade >= now() - interval '30 days', p.created_at, p.is_demo,
           coalesce(kr.creditos, 0), coalesce(ix.qtd, 0)
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
               sum(c.taxa_5pct) filter (where c.status_taxa in ('pendente','confirmada') and not coalesce(c.taxa_cobrada, false)) as bruto,
               count(*) filter (where c.status_taxa in ('pendente','confirmada') and not coalesce(c.taxa_cobrada, false))::int as abertas,
               min(c.finalizada_em) filter (where c.status_taxa in ('pendente','confirmada') and not coalesce(c.taxa_cobrada, false)) as desde,
               sum(c.taxa_5pct) filter (where c.status_taxa = 'em_divergencia') as divergencia,
               sum(c.taxa_5pct) filter (where c.status_taxa = 'paga') as pagas
          from public.contratacoes c where c.empresa_id = p.id
      ) ct on true
      left join lateral (select sum(k.saldo) as creditos from public.creditos_taxas k where k.empresa_id = p.id) kr on true
      left join lateral (select count(*)::int as qtd from public.indicacoes i where i.indicador_id = p.id) ix on true
     where p.tipo = 'empresa' and not p.is_admin and (p_incluir_demo or not p.is_demo)
     order by p.created_at desc;
end;
$$;
grant execute on function public.admin_listar_empresas(boolean) to authenticated;

-- Indicações no painel (Fase 5) passam a ler a tabela nova
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
    select d.id, coalesce(nullif(ed.nome_empresa, ''), d.nome), d.tipo, d.email, ind.created_at,
           ind.status in ('cadastrou', 'pagou', 'recompensado'),
           ind.status in ('pagou', 'recompensado'),
           ind.status = 'recompensado', ind.recompensado_em,
           r.id, coalesce(nullif(er.nome_empresa, ''), r.nome), ind.codigo
      from public.indicacoes ind
      join public.profiles d on d.id = ind.indicado_id
      left join public.empresa_dados ed on ed.profile_id = d.id
      join public.profiles r on r.id = ind.indicador_id
      left join public.empresa_dados er on er.profile_id = r.id
     where p_incluir_demo or not d.is_demo
     order by ind.created_at desc;
end;
$$;

-- ADM concede manualmente (ex.: cortesia) — usa o mesmo crédito
create or replace function public.admin_liberar_recompensa(p_indicado uuid, p_liberada boolean default true)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_ind uuid;
begin
  perform public.frela_exige_admin();
  select id into v_ind from public.indicacoes where indicado_id = p_indicado;
  if v_ind is null then raise exception 'Este usuário não veio de indicação'; end if;
  if p_liberada then
    perform public.frela_conceder_recompensa(v_ind, true);
  else
    -- desfaz apenas se o crédito ainda não foi usado
    if exists (select 1 from public.creditos_taxas where indicacao_id = v_ind and saldo < valor) then
      raise exception 'O crédito desta indicação já foi usado e não pode ser desfeito';
    end if;
    delete from public.creditos_taxas where indicacao_id = v_ind;
    update public.indicacoes set status = 'pagou', recompensa_valor = null, recompensado_em = null, updated_at = now() where id = v_ind;
    update public.profiles set indicacao_recompensa_liberada = false, indicacao_recompensa_em = null where id = p_indicado;
  end if;
end;
$$;

-- Resumo do programa para a empresa logada
create or replace function public.minhas_indicacoes()
returns table (
  id uuid, indicado_nome text, indicado_tipo text, status text, recompensa_valor numeric, created_at timestamptz, recompensado_em timestamptz
)
language sql
stable
security definer set search_path = public
as $$
  select i.id, coalesce(nullif(e.nome_empresa, ''), p.nome), p.tipo, i.status, i.recompensa_valor, i.created_at, i.recompensado_em
    from public.indicacoes i
    join public.profiles p on p.id = i.indicado_id
    left join public.empresa_dados e on e.profile_id = p.id
   where i.indicador_id = auth.uid()
   order by i.created_at desc;
$$;
grant execute on function public.minhas_indicacoes() to authenticated;
