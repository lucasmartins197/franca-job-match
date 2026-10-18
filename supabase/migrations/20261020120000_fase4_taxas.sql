-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 4: SISTEMA DE TAXAS (5%) E TRAVAS
-- Rodar UMA vez no SQL Editor do Supabase (modnamtaatcafqtjfzsd),
-- depois do SQL da Fase 3. Idempotente.
--
-- Regras:
--   • Cada contratação finalizada gera taxa de 5% sobre o VALOR DECLARADO
--     pela empresa na finalização. A taxa acumula (não é cobrada na hora).
--   • O profissional confirma o valor recebido. Se contestar → 'em_divergencia'
--     (fora do saldo até um ADM resolver).
--   • SALDO = taxas de contratações finalizadas com status_taxa 'pendente' ou
--     'confirmada' e ainda não pagas.
--   • TETO (frela_teto_taxas, padrão R$ 50): com saldo >= teto a empresa não
--     cria vagas nem confirma finalizações até quitar.
--   • Renovação de assinatura bloqueada com qualquer taxa em aberto.
--
-- status_taxa (em contratacoes):
--   null            → contratação ainda em andamento (sem taxa)
--   'pendente'      → empresa finalizou; aguardando o profissional confirmar o valor
--   'confirmada'    → valor confirmado pelos dois (ou resolvido por ADM)
--   'em_divergencia'→ profissional contestou o valor; ADM decide
--   'paga'          → taxa quitada
--
-- PARA MUDAR O TETO OU A PORCENTAGEM: edite frela_teto_taxas() / frela_taxa_percentual()
-- abaixo (e TETO_TAXAS / TAXA_PLATAFORMA em src/lib/pagamentos.ts, usados só como
-- valor de reserva na interface — o app lê o teto do banco).
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 0. Constantes
-- ─────────────────────────────────────────────
create or replace function public.frela_teto_taxas() returns numeric
language sql immutable as $$ select 50.00::numeric $$;

create or replace function public.frela_taxa_percentual() returns numeric
language sql immutable as $$ select 0.05::numeric $$;

-- "R$ 1234,50" independente do locale do servidor
create or replace function public.frela_brl(v numeric) returns text
language sql immutable as $$ select 'R$ ' || replace(to_char(round(coalesce(v, 0), 2), 'FM9999999990.00'), '.', ',') $$;

-- ─────────────────────────────────────────────
-- 1. Colunas novas em contratacoes
-- ─────────────────────────────────────────────
alter table public.contratacoes add column if not exists valor_confirmado_profissional boolean not null default false;
alter table public.contratacoes add column if not exists status_taxa text;
alter table public.contratacoes add column if not exists valor_contestado numeric;      -- valor que o profissional diz ter recebido
alter table public.contratacoes add column if not exists motivo_divergencia text;
alter table public.contratacoes add column if not exists confirmado_profissional_em timestamptz;
alter table public.contratacoes add column if not exists divergencia_resolvida_em timestamptz;
alter table public.contratacoes add column if not exists taxa_paga_em timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'contratacoes_status_taxa_check') then
    alter table public.contratacoes add constraint contratacoes_status_taxa_check
      check (status_taxa is null or status_taxa in ('pendente', 'confirmada', 'em_divergencia', 'paga'));
  end if;
end $$;

create index if not exists contratacoes_empresa_taxa_idx on public.contratacoes (empresa_id, status_taxa) where status = 'finalizada';

-- Contratações finalizadas antes da Fase 4: valem como confirmadas (ou pagas, se já cobradas)
update public.contratacoes
   set status_taxa = case when coalesce(taxa_cobrada, false) then 'paga' else 'confirmada' end,
       valor_confirmado_profissional = true
 where status = 'finalizada' and status_taxa is null;

-- ADM enxerga todas as contratações (painel de divergências / saldos)
drop policy if exists "admin ve todas contratacoes" on public.contratacoes;
create policy "admin ve todas contratacoes" on public.contratacoes
  for select to authenticated using (public.is_admin());

-- ─────────────────────────────────────────────
-- 2. Saldo de taxas
-- ─────────────────────────────────────────────
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
  return coalesce((
    select sum(taxa_5pct) from public.contratacoes
     where empresa_id = p_empresa
       and status = 'finalizada'
       and status_taxa in ('pendente', 'confirmada')
       and not coalesce(taxa_cobrada, false)
  ), 0);
end;
$$;

-- View por empresa (security_invoker: cada empresa só vê a própria linha; ADM vê todas)
create or replace view public.taxas_saldo_empresas
with (security_invoker = true) as
select empresa_id,
       coalesce(sum(taxa_5pct) filter (where status_taxa in ('pendente', 'confirmada') and not coalesce(taxa_cobrada, false)), 0) as saldo,
       coalesce(sum(taxa_5pct) filter (where status_taxa = 'pendente'), 0)       as a_confirmar,
       coalesce(sum(taxa_5pct) filter (where status_taxa = 'confirmada' and not coalesce(taxa_cobrada, false)), 0) as confirmado,
       coalesce(sum(taxa_5pct) filter (where status_taxa = 'em_divergencia'), 0) as em_divergencia,
       coalesce(sum(taxa_5pct) filter (where status_taxa = 'paga'), 0)           as pago
  from public.contratacoes
 where status = 'finalizada'
 group by empresa_id;
grant select on public.taxas_saldo_empresas to authenticated;

-- Resumo da empresa logada (usado pela tela "Minhas taxas" e pelas travas da interface)
create or replace function public.minhas_taxas_resumo()
returns table (
  saldo numeric, a_confirmar numeric, confirmado numeric, em_divergencia numeric, pago numeric,
  teto numeric, bloqueado boolean, pode_renovar boolean
)
language sql
stable
security definer set search_path = public
as $$
  with t as (
    select
      coalesce(sum(taxa_5pct) filter (where status_taxa in ('pendente', 'confirmada') and not coalesce(taxa_cobrada, false)), 0) as saldo,
      coalesce(sum(taxa_5pct) filter (where status_taxa = 'pendente'), 0) as a_confirmar,
      coalesce(sum(taxa_5pct) filter (where status_taxa = 'confirmada' and not coalesce(taxa_cobrada, false)), 0) as confirmado,
      coalesce(sum(taxa_5pct) filter (where status_taxa = 'em_divergencia'), 0) as em_divergencia,
      coalesce(sum(taxa_5pct) filter (where status_taxa = 'paga'), 0) as pago
    from public.contratacoes
    where empresa_id = auth.uid() and status = 'finalizada'
  )
  select saldo, a_confirmar, confirmado, em_divergencia, pago,
         public.frela_teto_taxas(),
         saldo >= public.frela_teto_taxas(),
         saldo = 0 and em_divergencia = 0
    from t;
$$;

-- Renovação da assinatura: só sem nenhuma taxa em aberto (inclui divergências)
create or replace function public.pode_renovar_assinatura()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select not exists (
    select 1 from public.contratacoes
     where empresa_id = auth.uid()
       and status = 'finalizada'
       and status_taxa in ('pendente', 'confirmada', 'em_divergencia')
       and not coalesce(taxa_cobrada, false)
  );
$$;

grant execute on function public.saldo_taxas_empresa(uuid) to authenticated;
grant execute on function public.minhas_taxas_resumo() to authenticated;
grant execute on function public.pode_renovar_assinatura() to authenticated;

-- ─────────────────────────────────────────────
-- 3. TRAVA: criar vaga (contratação em andamento OU saldo >= teto)
-- ─────────────────────────────────────────────
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
  if public.saldo_taxas_empresa(new.user_id) >= public.frela_teto_taxas() then
    raise exception 'TRAVA_TAXAS: saldo de taxas atingiu o teto de %. Quite as taxas para criar novas vagas.', public.frela_brl(public.frela_teto_taxas());
  end if;
  return new;
end;
$$;
-- (o trigger frela_before_job_insert da Fase 1 já aponta para esta função)

-- ─────────────────────────────────────────────
-- 4. Contratações: proteção dos campos de taxa + finalização com trava
-- ─────────────────────────────────────────────
create or replace function public.frela_contratacao_antes_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user = 'authenticated' then
    -- pelo app, contratação sempre nasce em andamento e sem taxa
    new.status := 'em_andamento';
    new.status_taxa := null;
    new.taxa_cobrada := false;
    new.valor_confirmado_profissional := false;
    new.finalizada_em := null;
  elsif new.status = 'finalizada' and new.status_taxa is null then
    new.status_taxa := 'confirmada';
    new.valor_confirmado_profissional := true;
  end if;
  new.taxa_5pct := round(new.valor * public.frela_taxa_percentual(), 2);
  return new;
end;
$$;

drop trigger if exists frela_before_contratacao_insert on public.contratacoes;
create trigger frela_before_contratacao_insert
  before insert on public.contratacoes
  for each row execute function public.frela_contratacao_antes_insert();

-- Atenção: SEM security definer — precisa enxergar o papel real de quem atualiza
-- ("authenticated" = app). Funções do sistema (security definer) passam livres.
create or replace function public.frela_contratacao_antes_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user = 'authenticated' then
    -- campos que só o sistema (funções/ADM) altera
    new.job_id := old.job_id;
    new.empresa_id := old.empresa_id;
    new.profissional_id := old.profissional_id;
    new.status_taxa := old.status_taxa;
    new.taxa_cobrada := old.taxa_cobrada;
    new.valor_confirmado_profissional := old.valor_confirmado_profissional;
    new.valor_contestado := old.valor_contestado;
    new.motivo_divergencia := old.motivo_divergencia;
    new.confirmado_profissional_em := old.confirmado_profissional_em;
    new.divergencia_resolvida_em := old.divergencia_resolvida_em;
    new.taxa_paga_em := old.taxa_paga_em;

    if old.status = 'finalizada' then
      -- depois de finalizada, a empresa não muda mais nada
      new.status := old.status;
      new.valor := old.valor;
      new.finalizada_em := old.finalizada_em;
    elsif new.status is distinct from old.status and new.status <> 'finalizada' then
      raise exception 'Mudança de status inválida';
    elsif new.status = 'em_andamento' then
      new.valor := old.valor;  -- o valor só é declarado na finalização
    end if;
  end if;

  -- Finalização: valor declarado, trava por teto, taxa vira 'pendente'
  if old.status = 'em_andamento' and new.status = 'finalizada' then
    if new.valor is null or new.valor <= 0 then
      raise exception 'Informe o valor pago ao profissional';
    end if;
    if public.saldo_taxas_empresa(new.empresa_id) >= public.frela_teto_taxas() then
      raise exception 'TRAVA_TAXAS: saldo de taxas atingiu o teto de %. Quite as taxas para confirmar finalizações.', public.frela_brl(public.frela_teto_taxas());
    end if;
    new.status_taxa := 'pendente';
    new.valor_confirmado_profissional := false;
    new.finalizada_em := coalesce(new.finalizada_em, now());
  end if;

  new.taxa_5pct := round(new.valor * public.frela_taxa_percentual(), 2);
  return new;
end;
$$;

drop trigger if exists frela_before_contratacao_update on public.contratacoes;
create trigger frela_before_contratacao_update
  before update on public.contratacoes
  for each row execute function public.frela_contratacao_antes_update();

-- Notificações da contratação (substitui a versão da Fase 1)
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
    if new.status = 'em_andamento' then
      insert into public.notificacoes (user_id, tipo, texto, link)
      values (new.profissional_id, 'confirmacao', 'Você foi confirmado(a) na vaga "' || v_title || '"!', '/contratacao/' || new.id);
    end if;
  elsif tg_op = 'UPDATE' and new.status = 'finalizada' and old.status is distinct from 'finalizada' then
    insert into public.notificacoes (user_id, tipo, texto, link)
    values (
      new.profissional_id,
      'confirmar_valor',
      'A empresa finalizou "' || v_title || '" e declarou ' || public.frela_brl(new.valor) ||
        '. Confirme o valor que você recebeu e avalie.',
      '/contratacao/' || new.id
    );
  end if;
  return new;
end;
$$;

-- ─────────────────────────────────────────────
-- 5. Profissional confirma (ou contesta) o valor recebido
-- ─────────────────────────────────────────────
create or replace function public.confirmar_valor_contratacao(
  p_id uuid,
  p_confirma boolean,
  p_valor_recebido numeric default null,
  p_motivo text default null
)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  c record;
  v_title text;
  v_nome text;
begin
  select * into c from public.contratacoes where id = p_id for update;
  if c.id is null then raise exception 'Contratação não encontrada'; end if;
  if c.profissional_id <> auth.uid() then raise exception 'Só o profissional desta contratação pode confirmar o valor'; end if;
  if c.status is distinct from 'finalizada' or c.status_taxa is distinct from 'pendente' then raise exception 'Este valor já foi confirmado ou contestado'; end if;

  select title into v_title from public.jobs where id = c.job_id;
  select coalesce(nullif(nome, ''), 'O profissional') into v_nome from public.profiles where id = c.profissional_id;

  if p_confirma then
    update public.contratacoes
       set status_taxa = 'confirmada', valor_confirmado_profissional = true, confirmado_profissional_em = now()
     where id = p_id;
    insert into public.notificacoes (user_id, tipo, texto, link)
    values (c.empresa_id, 'taxa', v_nome || ' confirmou ter recebido ' || public.frela_brl(c.valor) || ' por "' || v_title || '".', '/contratacao/' || p_id);
    return 'confirmada';
  end if;

  if p_valor_recebido is null or p_valor_recebido < 0 then
    raise exception 'Informe o valor que você realmente recebeu';
  end if;
  update public.contratacoes
     set status_taxa = 'em_divergencia', valor_contestado = p_valor_recebido,
         motivo_divergencia = nullif(btrim(coalesce(p_motivo, '')), ''), confirmado_profissional_em = now()
   where id = p_id;

  insert into public.notificacoes (user_id, tipo, texto, link)
  values (c.empresa_id, 'divergencia',
          v_nome || ' contestou o valor de "' || v_title || '" (diz ter recebido ' || public.frela_brl(p_valor_recebido) ||
            '). A equipe FreLa vai analisar.', '/contratacao/' || p_id);
  insert into public.notificacoes (user_id, tipo, texto, link)
  select a.id, 'divergencia',
         'Divergência de valor em "' || v_title || '": empresa ' || public.frela_brl(c.valor) ||
           ' × profissional ' || public.frela_brl(p_valor_recebido),
         '/admin/taxas'
    from public.profiles a where a.is_admin;
  return 'em_divergencia';
end;
$$;
grant execute on function public.confirmar_valor_contratacao(uuid, boolean, numeric, text) to authenticated;

-- ─────────────────────────────────────────────
-- 6. ADM: resolver divergência, listar saldos, registrar pagamento
-- ─────────────────────────────────────────────
create or replace function public.admin_resolver_divergencia(p_id uuid, p_valor_final numeric)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  c record;
  v_title text;
  v_texto text;
begin
  if not public.is_admin() then raise exception 'Apenas administradores'; end if;
  if p_valor_final is null or p_valor_final <= 0 then raise exception 'Valor final inválido'; end if;
  select * into c from public.contratacoes where id = p_id for update;
  if c.id is null or c.status_taxa is distinct from 'em_divergencia' then raise exception 'Contratação não está em divergência'; end if;

  update public.contratacoes
     set valor = p_valor_final, status_taxa = 'confirmada', valor_confirmado_profissional = true,
         divergencia_resolvida_em = now()
   where id = p_id;

  select title into v_title from public.jobs where id = c.job_id;
  v_texto := 'Divergência de "' || v_title || '" resolvida pela equipe FreLa: valor final ' || public.frela_brl(p_valor_final) || '.';
  insert into public.notificacoes (user_id, tipo, texto, link)
  values (c.empresa_id, 'taxa', v_texto, '/contratacao/' || p_id),
         (c.profissional_id, 'taxa', v_texto, '/contratacao/' || p_id);
end;
$$;
grant execute on function public.admin_resolver_divergencia(uuid, numeric) to authenticated;

create or replace function public.admin_saldos_taxas()
returns table (empresa_id uuid, nome_empresa text, saldo numeric, a_confirmar numeric, em_divergencia numeric, pago numeric, bloqueado boolean)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Apenas administradores'; end if;
  return query
    select s.empresa_id, coalesce(e.nome_empresa, p.nome, p.email), s.saldo, s.a_confirmar, s.em_divergencia, s.pago,
           s.saldo >= public.frela_teto_taxas()
      from public.taxas_saldo_empresas s
      join public.profiles p on p.id = s.empresa_id
      left join public.empresa_dados e on e.profile_id = s.empresa_id
     order by s.saldo desc;
end;
$$;
grant execute on function public.admin_saldos_taxas() to authenticated;

-- Núcleo da quitação. NÃO exposto ao app: chamado pelo ADM (abaixo) ou,
-- futuramente, pelo webhook do Stripe (Edge Function com service_role).
create or replace function public.frela_quitar_taxas(p_empresa uuid, p_referencia text default null)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_total numeric := 0;
  r record;
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
    v_total := v_total + r.taxa_5pct;
  end loop;

  if v_total > 0 then
    insert into public.notificacoes (user_id, tipo, texto, link)
    values (p_empresa, 'taxa', 'Pagamento de ' || public.frela_brl(v_total) || ' em taxas registrado. Obrigado! Sua conta está liberada.', '/taxas');
  end if;
  return v_total;
end;
$$;
revoke all on function public.frela_quitar_taxas(uuid, text) from public;
revoke all on function public.frela_quitar_taxas(uuid, text) from anon, authenticated;

create or replace function public.admin_registrar_pagamento_taxas(p_empresa uuid, p_referencia text default null)
returns numeric
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Apenas administradores'; end if;
  return public.frela_quitar_taxas(p_empresa, coalesce(p_referencia, 'manual-adm'));
end;
$$;
grant execute on function public.admin_registrar_pagamento_taxas(uuid, text) to authenticated;

-- Opcional: confirma automaticamente valores não respondidos após N dias.
-- Para agendar (extensão pg_cron no Supabase):
--   select cron.schedule('frela-autoconfirmar', '0 6 * * *', $$select public.frela_autoconfirmar_valores(7)$$);
create or replace function public.frela_autoconfirmar_valores(p_dias integer default 7)
returns integer
language sql
security definer set search_path = public
as $$
  with u as (
    update public.contratacoes
       set status_taxa = 'confirmada', valor_confirmado_profissional = true, confirmado_profissional_em = now()
     where status = 'finalizada' and status_taxa = 'pendente'
       and finalizada_em < now() - make_interval(days => p_dias)
    returning 1
  )
  select count(*)::int from u;
$$;
revoke all on function public.frela_autoconfirmar_valores(integer) from public;
revoke all on function public.frela_autoconfirmar_valores(integer) from anon, authenticated;

-- ─────────────────────────────────────────────
-- 7. Cancelar vaga aberta (empresa) → recusa candidaturas e avisa candidatos
-- ─────────────────────────────────────────────
create or replace function public.frela_job_cancelada()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'cancelada' and old.status is distinct from 'cancelada' then
    if old.status <> 'aberta' then
      raise exception 'Só é possível cancelar vagas abertas';
    end if;
    insert into public.notificacoes (user_id, tipo, texto, link)
    select a.user_id, 'cancelamento', 'A vaga "' || new.title || '" foi cancelada pela empresa.', '/job/' || new.id
      from public.applications a
     where a.job_id = new.id and a.status = 'pendente';
    update public.applications set status = 'recusada' where job_id = new.id and status = 'pendente';
  end if;
  return new;
end;
$$;

drop trigger if exists frela_before_job_update on public.jobs;
create trigger frela_before_job_update
  before update on public.jobs
  for each row execute function public.frela_job_cancelada();
