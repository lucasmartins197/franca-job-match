-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 7: AJUSTES FINAIS — parte 2 (código, avaliação obrigatória, travas)
-- ═══════════════════════════════════════════════════════════════════

-- A empresa consulta o código de novo (ex.: fechou o app)
create or replace function public.meu_codigo_confirmacao(p_id uuid)
returns text
language sql
stable
security definer set search_path = public
as $$
  select k.codigo
    from public.contratacao_codigos k
    join public.contratacoes c on c.id = k.contratacao_id
   where k.contratacao_id = p_id and c.empresa_id = auth.uid() and c.status = 'em_andamento'
$$;
grant execute on function public.meu_codigo_confirmacao(uuid) to authenticated;

-- 4. Passo 2 (profissional): digita o código → finaliza e registra a taxa
--    Retorna: 'confirmada' | 'em_divergencia' | 'incorreto' | 'bloqueado'
--    (código errado NÃO dá erro, para a tentativa ficar registrada)
create or replace function public.confirmar_codigo_contratacao(
  p_id uuid,
  p_codigo text,
  p_valor_confere boolean default true,
  p_valor_recebido numeric default null,
  p_motivo text default null
)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  c record;
  v_certo text;
  v_title text;
  v_nome text;
  v_status text;
begin
  select * into c from public.contratacoes where id = p_id for update;
  if c.id is null then raise exception 'Contratação não encontrada'; end if;
  if c.profissional_id is distinct from auth.uid() then raise exception 'Só o profissional desta contratação pode digitar o código'; end if;
  if c.status <> 'em_andamento' then raise exception 'Este serviço já foi confirmado'; end if;
  if c.codigo_gerado_em is null then raise exception 'A empresa ainda não gerou o código. Peça para ela marcar o serviço como realizado.'; end if;
  if c.codigo_tentativas >= public.frela_max_tentativas_codigo() then return 'bloqueado'; end if;

  select codigo into v_certo from public.contratacao_codigos where contratacao_id = p_id;
  select title into v_title from public.jobs where id = c.job_id;

  if v_certo is null or btrim(coalesce(p_codigo, '')) <> v_certo then
    update public.contratacoes set codigo_tentativas = codigo_tentativas + 1 where id = p_id;
    if c.codigo_tentativas + 1 >= public.frela_max_tentativas_codigo() then
      insert into public.notificacoes (user_id, tipo, texto, link)
      values (c.empresa_id, 'codigo_gerado',
              'Muitas tentativas erradas do código de "' || v_title || '". Gere um novo código e passe ao profissional.',
              '/contratacao/' || p_id);
      return 'bloqueado';
    end if;
    return 'incorreto';
  end if;

  if not coalesce(p_valor_confere, true) and (p_valor_recebido is null or p_valor_recebido < 0) then
    raise exception 'Informe o valor que você realmente recebeu';
  end if;
  v_status := case when coalesce(p_valor_confere, true) then 'confirmada' else 'em_divergencia' end;

  update public.contratacoes
     set status = 'finalizada',
         finalizada_em = now(),
         confirmado_por_codigo = true,
         codigo_confirmado_em = now(),
         status_taxa = v_status,
         valor_confirmado_profissional = (v_status = 'confirmada'),
         valor_contestado = case when v_status = 'em_divergencia' then p_valor_recebido end,
         motivo_divergencia = case when v_status = 'em_divergencia' then nullif(btrim(coalesce(p_motivo, '')), '') end,
         confirmado_profissional_em = now()
   where id = p_id;
  update public.jobs set status = 'finalizada' where id = c.job_id and status <> 'cancelada';
  delete from public.contratacao_codigos where contratacao_id = p_id;

  select coalesce(nullif(nome, ''), 'O profissional') into v_nome from public.profiles where id = c.profissional_id;

  insert into public.notificacoes (user_id, tipo, texto, link)
  values (c.empresa_id, 'avaliar',
          v_nome || ' confirmou o código de "' || v_title || '". ' ||
            case when v_status = 'confirmada'
                 then 'Taxa de ' || public.frela_brl(round(c.valor * public.frela_taxa_percentual(), 2)) || ' registrada no seu saldo. '
                 else 'O valor foi contestado (' || public.frela_brl(p_valor_recebido) || ') e a equipe FreLa vai analisar. ' end ||
            'Avalie o serviço — é obrigatório.',
          '/contratacao/' || p_id);
  insert into public.notificacoes (user_id, tipo, texto, link)
  values (c.profissional_id, 'avaliar',
          'Serviço "' || v_title || '" confirmado! Avalie a empresa — é obrigatório para seguir se candidatando.',
          '/contratacao/' || p_id);

  if v_status = 'em_divergencia' then
    insert into public.notificacoes (user_id, tipo, texto, link)
    select a.id, 'divergencia',
           'Divergência de valor em "' || v_title || '": empresa ' || public.frela_brl(c.valor) ||
             ' × profissional ' || public.frela_brl(p_valor_recebido),
           '/admin/taxas'
      from public.profiles a where a.is_admin;
  end if;
  return v_status;
end;
$$;
grant execute on function public.confirmar_codigo_contratacao(uuid, text, boolean, numeric, text) to authenticated;

-- ADM encerra uma contratação travada (profissional sem acesso, não compareceu...)
-- p_valor = 0 → serviço não aconteceu, sem taxa.
create or replace function public.admin_encerrar_contratacao(p_id uuid, p_valor numeric)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  c record;
begin
  perform public.frela_exige_admin();
  select * into c from public.contratacoes where id = p_id for update;
  if c.id is null then raise exception 'Contratação não encontrada'; end if;
  if c.status <> 'em_andamento' then raise exception 'Esta contratação já foi finalizada'; end if;
  if p_valor is null or p_valor < 0 then raise exception 'Valor inválido'; end if;

  update public.contratacoes
     set valor = round(p_valor, 2),
         codigo_gerado_em = coalesce(codigo_gerado_em, now()),
         status = 'finalizada', finalizada_em = now(),
         status_taxa = case when p_valor = 0 then 'paga' else 'confirmada' end,
         valor_confirmado_profissional = true, confirmado_profissional_em = now(),
         divergencia_resolvida_em = now()
   where id = p_id;
  update public.jobs set status = 'finalizada' where id = c.job_id and status <> 'cancelada';
  delete from public.contratacao_codigos where contratacao_id = p_id;

  insert into public.notificacoes (user_id, tipo, texto, link)
  select u, 'avaliar', 'A equipe FreLa encerrou a contratação. Avalie o serviço — é obrigatório.', '/contratacao/' || p_id
    from unnest(array[c.empresa_id, c.profissional_id]) u;
end;
$$;
grant execute on function public.admin_encerrar_contratacao(uuid, numeric) to authenticated;

-- 5. Avaliação obrigatória (estrelas + comentário)
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
  new.comentario := nullif(btrim(coalesce(new.comentario, '')), '');
  if v_c.codigo_gerado_em is not null and coalesce(length(new.comentario), 0) < 3 then
    raise exception 'Escreva um comentário sobre o serviço (obrigatório)';
  end if;
  return new;
end;
$$;

-- Pendências do usuário logado (o app mostra avisos; as travas usam a mesma regra)
--   avaliar          → contratação confirmada sem a minha avaliação (bloqueia)
--   digitar_codigo   → (profissional) empresa gerou o código ou o dia do serviço já passou (bloqueia candidaturas)
--   aguardando_codigo→ (profissional) serviço ainda vai acontecer / empresa não gerou o código (não bloqueia)
--   gerar_codigo     → (empresa) serviço em andamento sem código (bloqueia nova vaga — trava antiga)
--   aguardando_profissional → (empresa) código gerado, falta o profissional digitar
create or replace function public.frela_pendencias(p_user uuid)
returns table (tipo text, contratacao_id uuid, titulo text, data date, bloqueia boolean)
language sql
stable
security definer set search_path = public
as $$
  select 'avaliar', c.id, j.title, j.date, true
    from public.contratacoes c join public.jobs j on j.id = c.job_id
   where (c.empresa_id = p_user or c.profissional_id = p_user)
     and c.status = 'finalizada' and c.codigo_gerado_em is not null
     and not exists (select 1 from public.avaliacoes a where a.contratacao_id = c.id and a.de_id = p_user)
  union all
  select case
           when c.profissional_id = p_user then
             case when c.codigo_gerado_em is not null or j.date < public.frela_hoje() then 'digitar_codigo' else 'aguardando_codigo' end
           else case when c.codigo_gerado_em is null then 'gerar_codigo' else 'aguardando_profissional' end
         end,
         c.id, j.title, j.date,
         case when c.profissional_id = p_user then (c.codigo_gerado_em is not null or j.date < public.frela_hoje()) else true end
    from public.contratacoes c join public.jobs j on j.id = c.job_id
   where (c.empresa_id = p_user or c.profissional_id = p_user) and c.status = 'em_andamento'
$$;
revoke all on function public.frela_pendencias(uuid) from public, anon, authenticated;

create or replace function public.minhas_pendencias()
returns table (tipo text, contratacao_id uuid, titulo text, data date, bloqueia boolean)
language sql
stable
security definer set search_path = public
as $$
  select * from public.frela_pendencias(auth.uid()) order by bloqueia desc, data
$$;
grant execute on function public.minhas_pendencias() to authenticated;

-- 6. TRAVAS
-- Empresa: nova vaga (contratação em andamento, teto de taxas, avaliação pendente)
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
    raise exception 'TRAVA_CONTRATACAO_EM_ANDAMENTO: confirme o serviço anterior com o código antes de criar uma nova vaga';
  end if;
  if public.saldo_taxas_empresa(new.user_id) >= public.frela_teto_taxas() then
    raise exception 'TRAVA_TAXAS: saldo de taxas atingiu o teto de %. Quite as taxas para criar novas vagas.', public.frela_brl(public.frela_teto_taxas());
  end if;
  if exists (select 1 from public.frela_pendencias(new.user_id) p where p.tipo = 'avaliar') then
    raise exception 'TRAVA_AVALIACAO: avalie o último serviço antes de criar uma nova vaga';
  end if;
  return new;
end;
$$;

-- Empresa: contratar (aceitar candidato) com avaliação pendente
create or replace function public.frela_contratacao_antes_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user = 'authenticated' then
    -- pelo app, contratação sempre nasce em andamento, sem taxa e sem código
    new.status := 'em_andamento';
    new.status_taxa := null;
    new.taxa_cobrada := false;
    new.valor_confirmado_profissional := false;
    new.finalizada_em := null;
    new.codigo_gerado_em := null;
    new.confirmado_por_codigo := false;
    new.codigo_confirmado_em := null;
    new.codigo_tentativas := 0;
    if exists (select 1 from public.minhas_pendencias() p where p.tipo = 'avaliar') then
      raise exception 'TRAVA_AVALIACAO: avalie o último serviço antes de contratar de novo';
    end if;
  elsif new.status = 'finalizada' and new.status_taxa is null then
    new.status_taxa := 'confirmada';
    new.valor_confirmado_profissional := true;
  end if;
  new.taxa_5pct := round(new.valor * public.frela_taxa_percentual(), 2);
  return new;
end;
$$;

-- Profissional: candidatura com serviço sem código ou avaliação pendente
create or replace function public.frela_trava_candidatura()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  p record;
begin
  if current_user = 'authenticated' then
    select * into p from public.minhas_pendencias() x where x.bloqueia limit 1;
    if p.tipo = 'avaliar' then
      raise exception 'TRAVA_AVALIACAO: avalie o serviço "%" antes de se candidatar a outra vaga', p.titulo;
    elsif p.tipo = 'digitar_codigo' then
      raise exception 'TRAVA_CODIGO: confirme o serviço "%" com o código da empresa antes de se candidatar a outra vaga', p.titulo;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists frela_before_application_insert on public.applications;
create trigger frela_before_application_insert
  before insert on public.applications
  for each row execute function public.frela_trava_candidatura();
