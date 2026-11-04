-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 7: AJUSTES FINAIS — parte 1
-- ═══════════════════════════════════════════════════════════════════

-- 0. Constantes e auxiliares
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

-- 1. Colunas novas
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
GRANT ALL ON public.contratacao_codigos TO service_role;
alter table public.contratacao_codigos enable row level security;
revoke all on public.contratacao_codigos from anon, authenticated;

-- 2. Contratação: proteção dos campos + finalização só pelo código
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

-- 3. Passo 1 (empresa): serviço realizado → declara o valor e gera o código
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
