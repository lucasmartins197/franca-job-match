-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 7: AJUSTES FINAIS
-- Rodar UMA vez no SQL Editor do Supabase (modnamtaatcafqtjfzsd),
-- depois do SQL da Fase 6. Idempotente.
--
-- A) Profissional é GRÁTIS: só a empresa assina (R$ 89,90) e paga 5%.
--    Métricas do painel (MRR, conversão) passam a contar só empresas.
-- B) CÓDIGO DE CONFIRMAÇÃO CRUZADO (prova de presença):
--    1. empresa marca o serviço como realizado + declara o valor
--       → gerar_codigo_confirmacao() cria um código de 4 dígitos que SÓ ela vê;
--    2. empresa passa o código ao profissional, pessoalmente;
--    3. profissional digita o código → confirmar_codigo_contratacao():
--       contratação finalizada, taxa de 5% no saldo da empresa, avaliação aberta.
--    O código fica na tabela contratacao_codigos (sem acesso direto pelo app):
--    se ficasse em contratacoes, o profissional conseguiria lê-lo, porque ele
--    enxerga a própria contratação. A empresa lê o código por meu_codigo_confirmacao().
--    5 tentativas erradas bloqueiam o código; a empresa gera outro.
--    A empresa NÃO finaliza mais sozinha (o banco recusa).
-- C) AVALIAÇÃO OBRIGATÓRIA (estrelas + comentário) dos dois lados nas
--    contratações do fluxo com código.
-- D) TRAVAS: avaliação pendente bloqueia nova vaga / contratar / candidatar;
--    profissional com serviço não confirmado pelo código não se candidata.
-- E) NOTIFICAÇÕES: vaga nova no dia (e período) em que o profissional está
--    disponível e na profissão dele; código gerado; digite o código; avalie.
-- F) Selo "Verificado" exige currículo completo; recomendações só mostram
--    currículos completos.
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 0. Constantes e auxiliares
-- ─────────────────────────────────────────────
-- A) profissional não paga assinatura
create or replace function public.frela_preco_assinatura(p_tipo text) returns numeric
language sql immutable as $$ select case when p_tipo = 'empresa' then 89.90 else 0 end::numeric $$;

create or replace function public.frela_max_tentativas_codigo() returns integer
language sql immutable as $$ select 5 $$;

-- "Hoje" no fuso de Franca (o servidor roda em UTC)
create or replace function public.frela_hoje() returns date
language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

-- Dia da semana no formato salvo na disponibilidade do currículo (Seg, Ter, ... Dom)
create or replace function public.frela_dia_semana(p_data date) returns text
language sql immutable as $$
  select (array['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'])[extract(dow from p_data)::int + 1]
$$;

-- Período do dia de um horário "HH:MM" (mesmos nomes do currículo)
create or replace function public.frela_periodo(p_hora text) returns text
language sql immutable as $$
  select case
    when p_hora !~ '^\d{1,2}:\d{2}' then null
    when split_part(p_hora, ':', 1)::int < 5 then 'Madrugada'
    when split_part(p_hora, ':', 1)::int < 12 then 'Manhã'
    when split_part(p_hora, ':', 1)::int < 18 then 'Tarde'
    else 'Noite'
  end
$$;

-- Funções de cada categoria (espelho de src/lib/categorias.ts — ao mudar lá, mude aqui)
create or replace function public.frela_funcoes_categoria(p_categoria text) returns text[]
language sql immutable as $$
  select case
    when p_categoria in ('E-commerce / Logística', 'Logística') then array['Separador de pedidos','Embalador','Conferente','Estoquista','Carregador']
    when p_categoria in ('Calçados / Indústria', 'Indústria') then array['Pespontador','Cortador','Montador','Acabamento','Auxiliar de produção']
    when p_categoria in ('Garçom / Eventos', 'Bares e Restaurantes', 'Eventos') then array['Garçom','Bartender','Recepcionista','Copeiro']
    when p_categoria = 'Cozinha / Gastronomia' then array['Cozinheiro','Auxiliar de Cozinha','Chapeiro','Pizzaiolo','Confeiteiro']
    when p_categoria = 'Limpeza / Doméstica' then array['Faxineiro','Diarista','Passadeira','Auxiliar de limpeza']
    when p_categoria in ('Construção / Obra', 'Construção Civil') then array['Pedreiro','Servente','Pintor','Eletricista','Encanador']
    when p_categoria in ('Vendas / Comércio', 'Comércio') then array['Vendedor','Caixa','Repositor','Atendente']
    when p_categoria in ('Beleza / Estética', 'Beleza e Estética') then array['Manicure','Cabeleireiro','Barbeiro','Maquiador','Esteticista']
    when p_categoria = 'Administrativo / Escritório' then array['Auxiliar administrativo','Recepcionista','Digitador','Atendimento ao cliente']
    when p_categoria in ('Trabalhos Manuais / Gerais', 'Serviços Gerais') then array['Ajudante Geral','Montador de móveis','Jardineiro','Carregador']
    when p_categoria = 'Segurança / Portaria' then array['Porteiro','Segurança','Vigia','Controlador de acesso']
    when p_categoria = 'Saúde / Cuidador' then array['Cuidador de idosos','Acompanhante','Técnico de enfermagem','Babá']
    when p_categoria = 'Entregas / Motoboy' then array['Motoboy','Entregador','Motorista']
    when p_categoria in ('Promotor / Panfletagem', 'Marketing e Promoção') then array['Promotor','Panfleteiro','Demonstrador','Degustação']
    else array[]::text[]
  end
$$;

-- Tokens da disponibilidade ("Seg, Sex · Noite · obs" → {Seg, Sex, Noite, obs})
create or replace function public.frela_tokens_disponibilidade(p_texto text) returns text[]
language sql immutable as $$
  select coalesce(array_remove(regexp_split_to_array(btrim(coalesce(p_texto, '')), '\s*[·,|]\s*'), ''), array[]::text[])
$$;

-- ─────────────────────────────────────────────
-- 1. Colunas novas
-- ─────────────────────────────────────────────
alter table public.contratacoes add column if not exists codigo_gerado_em timestamptz;
alter table public.contratacoes add column if not exists confirmado_por_codigo boolean not null default false;
alter table public.contratacoes add column if not exists codigo_confirmado_em timestamptz;
alter table public.contratacoes add column if not exists codigo_tentativas integer not null default 0;

-- O código em si: sem nenhuma policy → o app não lê nem escreve direto
create table if not exists public.contratacao_codigos (
  contratacao_id uuid primary key references public.contratacoes(id) on delete cascade,
  codigo text not null check (codigo ~ '^\d{4}$'),
  created_at timestamptz not null default now()
);
alter table public.contratacao_codigos enable row level security;
revoke all on public.contratacao_codigos from anon, authenticated;

-- ─────────────────────────────────────────────
-- 2. Contratação: proteção dos campos + finalização só pelo código
-- ─────────────────────────────────────────────
-- SEM security definer (precisa ver o papel real de quem atualiza)
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
    new.codigo_gerado_em := old.codigo_gerado_em;
    new.confirmado_por_codigo := old.confirmado_por_codigo;
    new.codigo_confirmado_em := old.codigo_confirmado_em;
    new.codigo_tentativas := old.codigo_tentativas;
    new.valor := old.valor;
    new.finalizada_em := old.finalizada_em;
    if new.status is distinct from old.status then
      raise exception 'A finalização é feita pelo código de confirmação: gere o código e passe ao profissional';
    end if;
  end if;

  if old.status = 'em_andamento' and new.status = 'finalizada' then
    if new.valor is null or new.valor < 0 or (new.valor = 0 and not public.is_admin()) then
      raise exception 'Informe o valor pago ao profissional';
    end if;
    if new.codigo_gerado_em is not null then
      -- fluxo da Fase 7: a taxa já vem decidida pela função do código (ou pelo ADM)
      new.status_taxa := coalesce(new.status_taxa, 'confirmada');
    else
      -- caminho antigo (só funções do sistema): taxa pendente de confirmação do valor
      if public.saldo_taxas_empresa(new.empresa_id) >= public.frela_teto_taxas() then
        raise exception 'TRAVA_TAXAS: saldo de taxas atingiu o teto de %. Quite as taxas para confirmar finalizações.', public.frela_brl(public.frela_teto_taxas());
      end if;
      new.status_taxa := 'pendente';
      new.valor_confirmado_profissional := false;
    end if;
    new.finalizada_em := coalesce(new.finalizada_em, now());
  end if;

  new.taxa_5pct := round(new.valor * public.frela_taxa_percentual(), 2);
  return new;
end;
$$;

-- Notificações automáticas da contratação (as do código são feitas nas funções abaixo)
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
  elsif tg_op = 'UPDATE' and new.status = 'finalizada' and old.status is distinct from 'finalizada'
        and new.codigo_gerado_em is null then
    insert into public.notificacoes (user_id, tipo, texto, link)
    values (new.profissional_id, 'confirmar_valor',
            'A empresa finalizou "' || v_title || '" e declarou ' || public.frela_brl(new.valor) ||
              '. Confirme o valor que você recebeu e avalie.',
            '/contratacao/' || new.id);
  end if;
  return new;
end;
$$;

-- ─────────────────────────────────────────────
-- 3. Passo 1 (empresa): serviço realizado → declara o valor e gera o código
-- ─────────────────────────────────────────────
create or replace function public.gerar_codigo_confirmacao(p_id uuid, p_valor numeric)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  c record;
  v_codigo text;
  v_title text;
  v_empresa text;
  v_primeira boolean;
begin
  select * into c from public.contratacoes where id = p_id for update;
  if c.id is null then raise exception 'Contratação não encontrada'; end if;
  if c.empresa_id is distinct from auth.uid() then raise exception 'Só a empresa desta contratação pode gerar o código'; end if;
  if c.status <> 'em_andamento' then raise exception 'Esta contratação já foi finalizada'; end if;
  if p_valor is null or p_valor <= 0 then raise exception 'Informe o valor pago ao profissional'; end if;
  if public.saldo_taxas_empresa(c.empresa_id) >= public.frela_teto_taxas() then
    raise exception 'TRAVA_TAXAS: saldo de taxas atingiu o teto de %. Quite as taxas para confirmar finalizações.', public.frela_brl(public.frela_teto_taxas());
  end if;

  v_primeira := c.codigo_gerado_em is null;
  v_codigo := lpad((floor(random() * 10000))::int::text, 4, '0');

  insert into public.contratacao_codigos (contratacao_id, codigo, created_at)
  values (p_id, v_codigo, now())
  on conflict (contratacao_id) do update set codigo = excluded.codigo, created_at = excluded.created_at;

  update public.contratacoes
     set valor = round(p_valor, 2), codigo_gerado_em = now(), codigo_tentativas = 0
   where id = p_id;

  select title into v_title from public.jobs where id = c.job_id;
  select coalesce(nullif(e.nome_empresa, ''), nullif(p.nome, ''), 'A empresa') into v_empresa
    from public.profiles p left join public.empresa_dados e on e.profile_id = p.id where p.id = c.empresa_id;

  insert into public.notificacoes (user_id, tipo, texto, link)
  values (c.empresa_id, 'codigo_gerado',
          'Código ' || case when v_primeira then 'gerado' else 'novo gerado' end || ' para "' || v_title ||
            '" — passe ao profissional pessoalmente para confirmar o serviço.',
          '/contratacao/' || p_id);
  insert into public.notificacoes (user_id, tipo, texto, link)
  values (c.profissional_id, 'digitar_codigo',
          v_empresa || ' marcou "' || v_title || '" como realizado (' || public.frela_brl(round(p_valor, 2)) ||
            '). Peça o código de 4 dígitos à empresa e digite no app para confirmar o serviço.',
          '/contratacao/' || p_id);
  return v_codigo;
end;
$$;
grant execute on function public.gerar_codigo_confirmacao(uuid, numeric) to authenticated;

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

-- ─────────────────────────────────────────────
-- 4. Passo 2 (profissional): digita o código → finaliza e registra a taxa
--    Retorna: 'confirmada' | 'em_divergencia' | 'incorreto' | 'bloqueado'
--    (código errado NÃO dá erro, para a tentativa ficar registrada)
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- 5. Avaliação obrigatória (estrelas + comentário)
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- 6. TRAVAS
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- 7. NOTIFICAÇÃO: vaga nova no dia disponível do profissional
--    profissão (função ou categoria) + dia da semana (+ período, se ele marcou)
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- 8. Currículo completo: exigido para o selo "Verificado" e para as recomendações
--    (mesma regra de camposFaltando() em src/hooks/usePerfil.ts)
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- 9. PAINEL: profissional não gera receita de assinatura
--    (MRR e conversão contam só empresas; demais campos iguais à Fase 5)
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
