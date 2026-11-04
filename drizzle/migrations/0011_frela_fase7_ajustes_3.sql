-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 7: AJUSTES FINAIS — parte 3 (notificação por disponibilidade,
-- currículo completo, painel sem receita de profissional)
-- ═══════════════════════════════════════════════════════════════════

-- 7. NOTIFICAÇÃO: vaga nova no dia disponível do profissional
--    profissão (função ou categoria) + dia da semana (+ período, se ele marcou)
create or replace function public.frela_notifica_vaga_disponivel()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_dia text := public.frela_dia_semana(new.date);
  v_periodo text := public.frela_periodo(new.time_start);
  v_demo boolean;
begin
  if new.status <> 'aberta' or new.date < public.frela_hoje() then return new; end if;
  select coalesce(is_demo, false) into v_demo from public.profiles where id = new.user_id;

  insert into public.notificacoes (user_id, tipo, texto, link)
  select p.id, 'vaga_disponivel',
         'Vaga nova no seu dia disponível: "' || new.title || '" · ' || v_dia || ' ' ||
           to_char(new.date, 'DD/MM') || ', ' || new.time_start || ' · ' || public.frela_brl(new.payment),
         '/job/' || new.id
    from public.profiles p
    join public.profissional_dados d on d.profile_id = p.id
   where p.tipo = 'freelancer' and not p.is_admin and coalesce(p.is_demo, false) = v_demo
     and p.id <> new.user_id
     and v_dia = any(public.frela_tokens_disponibilidade(d.disponibilidade))
     and (
       new.skill = any(coalesce(d.profissoes, array[]::text[]))
       or coalesce(d.profissoes, array[]::text[]) && public.frela_funcoes_categoria(new.category)
     )
     and (
       not (public.frela_tokens_disponibilidade(d.disponibilidade) && array['Manhã','Tarde','Noite','Madrugada'])
       or v_periodo is null
       or v_periodo = any(public.frela_tokens_disponibilidade(d.disponibilidade))
     )
   limit 500;
  return new;
end;
$$;

drop trigger if exists frela_after_job_insert_disponivel on public.jobs;
create trigger frela_after_job_insert_disponivel
  after insert on public.jobs
  for each row execute function public.frela_notifica_vaga_disponivel();

-- 8. Currículo completo: exigido para o selo "Verificado" e para as recomendações
--    (mesma regra de camposFaltando() em src/hooks/usePerfil.ts)
create or replace function public.frela_curriculo_completo(p_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((
    select nullif(btrim(p.foto_url), '') is not null
       and nullif(btrim(p.nome), '') is not null
       and nullif(btrim(p.telefone), '') is not null
       and nullif(btrim(p.cidade), '') is not null
       and coalesce(array_length(d.profissoes, 1), 0) > 0
       and nullif(btrim(d.experiencia), '') is not null
       and nullif(btrim(d.bio), '') is not null
       and public.frela_tokens_disponibilidade(d.disponibilidade) && array['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
      from public.profiles p
      left join public.profissional_dados d on d.profile_id = p.id
     where p.id = p_id
  ), false)
$$;
grant execute on function public.frela_curriculo_completo(uuid) to authenticated;

create or replace function public.frela_verificado_exige_curriculo()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.verificado and not coalesce(old.verificado, false) and new.tipo = 'freelancer'
     and not public.frela_curriculo_completo(new.id) then
    raise exception 'Currículo incompleto: o selo Verificado exige foto, contato, profissões, experiência, sobre e dias disponíveis';
  end if;
  return new;
end;
$$;

drop trigger if exists frela_before_profile_verificado on public.profiles;
create trigger frela_before_profile_verificado
  before update of verificado on public.profiles
  for each row execute function public.frela_verificado_exige_curriculo();

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
     where p.tipo = 'freelancer' and not p.is_admin and public.frela_curriculo_completo(p.id)
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
grant execute on function public.recomendados_profissionais(integer) to authenticated;

-- 9. PAINEL: profissional não gera receita de assinatura
--    (MRR e conversão contam só empresas; demais campos iguais à Fase 5)
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
      count(*) filter (where status = 'em_andamento' and codigo_gerado_em is not null) as aguardando_codigo,
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
      coalesce(sum(public.frela_preco_assinatura(tipo)) filter (where assinante and tipo = 'empresa'), 0) as mrr
    from u
  ),
  pag as (
    select coalesce(sum(valor), 0) as assinaturas_registradas
      from public.pagamentos p
      join public.profiles pr on pr.id = p.user_id
     where p.tipo = 'assinatura' and p.status = 'pago' and pr.tipo = 'empresa' and (p_incluir_demo or not pr.is_demo)
  )
  select jsonb_build_object(
    'empresas', ass.empresas,
    'profissionais', ass.profissionais,
    'cadastros', ass.empresas + ass.profissionais,
    'cadastros_mes', ass.cadastros_mes,
    'empresas_ativas', ass.empresas_ativas,
    'profissionais_ativos', ass.profissionais_ativos,
    'assinantes_empresa', ass.assinantes_empresa,
    'assinantes_profissional', 0,
    'conversao', case when ass.empresas = 0 then 0 else round(ass.assinantes_empresa::numeric / ass.empresas, 4) end,
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
    'aguardando_codigo', t.aguardando_codigo,
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
    'precos', jsonb_build_object('empresa', public.frela_preco_assinatura('empresa'), 'freelancer', 0)
  ) into r
  from ass, taxas t, pag;

  return r;
end;
$$;
grant execute on function public.admin_visao_geral(boolean) to authenticated;
