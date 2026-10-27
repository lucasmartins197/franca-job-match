-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 6: CRESCIMENTO (Metas/Selos, Recomendações, Indique e Ganhe) — parte 1
-- ═══════════════════════════════════════════════════════════════════

-- 0. Constantes
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

-- 1. RECOMENDAÇÕES (vitrine) — só campos públicos
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

-- 2. INDICAÇÕES
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

GRANT SELECT ON public.indicacoes TO authenticated;
GRANT ALL ON public.indicacoes TO service_role;

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
  saldo numeric not null check (saldo >= 0),
  origem text not null default 'indicacao',
  indicacao_id uuid references public.indicacoes(id) on delete set null,
  descricao text,
  created_at timestamptz not null default now()
);
create index if not exists creditos_taxas_empresa_idx on public.creditos_taxas (empresa_id);
create unique index if not exists creditos_taxas_indicacao_key on public.creditos_taxas (indicacao_id) where indicacao_id is not null;

GRANT SELECT ON public.creditos_taxas TO authenticated;
GRANT ALL ON public.creditos_taxas TO service_role;

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
