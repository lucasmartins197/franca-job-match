-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 6: CRESCIMENTO — parte 2 (saldo líquido de créditos)
-- ═══════════════════════════════════════════════════════════════════

-- 3. Saldo de taxas passa a ser LÍQUIDO de créditos
--    (trava, teto e quitação da Fase 4 usam estas funções)
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
