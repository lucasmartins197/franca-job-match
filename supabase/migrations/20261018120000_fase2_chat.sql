-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 2: CHAT INTERNO
-- Rodar UMA vez no SQL Editor do Supabase (modnamtaatcafqtjfzsd),
-- depois de 20261017120000_fase2_perfil.sql. Idempotente.
--
-- Não cria tabelas (usa `mensagens`, que já existe). Adiciona:
--   1. validação: só as duas partes da contratação conversam entre si
--   2. notificação "nova mensagem" (no máx. 1 não lida por conversa)
--   3. realtime da tabela mensagens (mensagem aparece na hora)
--   4. índices para a lista de conversas
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Validação da mensagem
-- ─────────────────────────────────────────────
create or replace function public.frela_valida_mensagem()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_c record;
begin
  new.texto := btrim(new.texto);
  if new.texto = '' then
    raise exception 'Mensagem vazia';
  end if;
  if length(new.texto) > 2000 then
    raise exception 'Mensagem muito longa (máx. 2000 caracteres)';
  end if;

  select empresa_id, profissional_id into v_c from public.contratacoes where id = new.contratacao_id;
  if v_c.empresa_id is null then
    raise exception 'Conversa não encontrada';
  end if;
  if not (
    (new.de_id = v_c.empresa_id and new.para_id = v_c.profissional_id) or
    (new.de_id = v_c.profissional_id and new.para_id = v_c.empresa_id)
  ) then
    raise exception 'Você não participa desta conversa';
  end if;

  new.lida := false;
  return new;
end;
$$;

drop trigger if exists frela_before_mensagem_insert on public.mensagens;
create trigger frela_before_mensagem_insert
  before insert on public.mensagens
  for each row execute function public.frela_valida_mensagem();

-- ─────────────────────────────────────────────
-- 2. Notificação de nova mensagem
--    Se já existe notificação NÃO LIDA desta conversa, atualiza o texto
--    em vez de criar outra (evita encher o sino).
-- ─────────────────────────────────────────────
create or replace function public.frela_notifica_mensagem()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_nome text;
  v_texto text;
  v_link text := '/chat/' || new.contratacao_id;
  v_existente uuid;
begin
  select coalesce(nullif(e.nome_empresa, ''), nullif(p.nome, ''), 'Alguém')
    into v_nome
    from public.profiles p
    left join public.empresa_dados e on e.profile_id = p.id
   where p.id = new.de_id;

  v_texto := 'Nova mensagem de ' || coalesce(v_nome, 'Alguém') || ': ' ||
             case when length(new.texto) > 60 then left(new.texto, 60) || '…' else new.texto end;

  select id into v_existente
    from public.notificacoes
   where user_id = new.para_id and tipo = 'mensagem' and link = v_link and lida = false
   limit 1;

  if v_existente is not null then
    update public.notificacoes set texto = v_texto, created_at = now() where id = v_existente;
  else
    insert into public.notificacoes (user_id, tipo, texto, link)
    values (new.para_id, 'mensagem', v_texto, v_link);
  end if;
  return new;
end;
$$;

drop trigger if exists frela_after_mensagem_insert on public.mensagens;
create trigger frela_after_mensagem_insert
  after insert on public.mensagens
  for each row execute function public.frela_notifica_mensagem();

-- ─────────────────────────────────────────────
-- 3. Realtime
-- ─────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mensagens'
  ) then
    alter publication supabase_realtime add table public.mensagens;
  end if;
end $$;

-- ─────────────────────────────────────────────
-- 4. Índices
-- ─────────────────────────────────────────────
create index if not exists mensagens_contratacao_created_idx on public.mensagens (contratacao_id, created_at);
create index if not exists mensagens_para_lida_idx on public.mensagens (para_id) where lida = false;
