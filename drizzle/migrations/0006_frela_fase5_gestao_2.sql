-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 5: PAINEL DE GESTÃO (ADM) — parte 2
-- ═══════════════════════════════════════════════════════════════════

-- 4. LISTAS
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

-- 5. INDICAÇÕES
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

-- 6. PROMOÇÃO E METAS (ações do ADM)
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

-- 7. Permissões (todas as funções checam ADM por dentro)
grant execute on function public.admin_listar_empresas(boolean) to authenticated;
grant execute on function public.admin_listar_profissionais(boolean) to authenticated;
grant execute on function public.admin_listar_vagas(boolean) to authenticated;
grant execute on function public.admin_listar_contratacoes(boolean) to authenticated;
grant execute on function public.admin_usuario_detalhe(uuid) to authenticated;
grant execute on function public.admin_indicacoes(boolean) to authenticated;
grant execute on function public.admin_liberar_recompensa(uuid, boolean) to authenticated;
grant execute on function public.admin_promover(uuid, boolean, boolean, text[]) to authenticated;
grant execute on function public.admin_ajustar_meta(uuid, integer) to authenticated;
