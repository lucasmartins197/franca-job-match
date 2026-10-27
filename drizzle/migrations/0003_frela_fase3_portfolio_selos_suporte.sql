-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 3: portfólio, selos, mapa, suporte, base para demo
-- ═══════════════════════════════════════════════════════════════════

-- 0. Colunas de cobrança que o app/trigger usa
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists cartao_cadastrado boolean not null default false;

-- 1. Flags no perfil
alter table public.profiles add column if not exists verificado boolean not null default false;
alter table public.profiles add column if not exists is_admin   boolean not null default false;
alter table public.profiles add column if not exists is_demo    boolean not null default false;

create or replace function public.frela_protege_campos_perfil()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'authenticated' then
    new.tipo                := old.tipo;
    new.email               := old.email;
    new.verificado          := old.verificado;
    new.is_admin            := old.is_admin;
    new.is_demo             := old.is_demo;
    new.avaliacao_media     := old.avaliacao_media;
    new.total_avaliacoes    := old.total_avaliacoes;
    new.subscription_status := old.subscription_status;
    new.subscription_end    := old.subscription_end;
    new.stripe_customer_id  := old.stripe_customer_id;
    new.cartao_cadastrado   := old.cartao_cadastrado;
  end if;
  return new;
end;
$$;

drop trigger if exists frela_before_profile_update on public.profiles;
create trigger frela_before_profile_update
  before update on public.profiles
  for each row execute function public.frela_protege_campos_perfil();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
grant execute on function public.is_admin() to authenticated;

-- 2. Empresa: bio + coordenadas do endereço (mapa)
alter table public.empresa_dados add column if not exists bio text;
alter table public.empresa_dados add column if not exists latitude double precision;
alter table public.empresa_dados add column if not exists longitude double precision;

-- 3. Portfólio
create table if not exists public.portfolio_fotos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  legenda text,
  created_at timestamptz not null default now()
);
create index if not exists portfolio_fotos_profile_idx on public.portfolio_fotos (profile_id, created_at desc);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_fotos TO authenticated;
GRANT ALL ON public.portfolio_fotos TO service_role;

alter table public.portfolio_fotos enable row level security;

drop policy if exists "todos veem portfolio" on public.portfolio_fotos;
create policy "todos veem portfolio" on public.portfolio_fotos
  for select to authenticated using (true);
drop policy if exists "dono adiciona no portfolio" on public.portfolio_fotos;
create policy "dono adiciona no portfolio" on public.portfolio_fotos
  for insert to authenticated with check (auth.uid() = profile_id);
drop policy if exists "dono edita portfolio" on public.portfolio_fotos;
create policy "dono edita portfolio" on public.portfolio_fotos
  for update to authenticated using (auth.uid() = profile_id);
drop policy if exists "dono apaga do portfolio" on public.portfolio_fotos;
create policy "dono apaga do portfolio" on public.portfolio_fotos
  for delete to authenticated using (auth.uid() = profile_id);

-- 4. Suporte: uma conversa por usuário com a equipe
create table if not exists public.suporte_mensagens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  autor_id uuid not null references auth.users(id) on delete cascade,
  texto text not null,
  lida_usuario boolean not null default false,
  lida_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists suporte_mensagens_user_idx on public.suporte_mensagens (user_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suporte_mensagens TO authenticated;
GRANT ALL ON public.suporte_mensagens TO service_role;

alter table public.suporte_mensagens enable row level security;

drop policy if exists "usuario ve seu suporte" on public.suporte_mensagens;
create policy "usuario ve seu suporte" on public.suporte_mensagens
  for select to authenticated using (auth.uid() = user_id or public.is_admin());
drop policy if exists "usuario escreve no seu suporte" on public.suporte_mensagens;
create policy "usuario escreve no seu suporte" on public.suporte_mensagens
  for insert to authenticated
  with check (autor_id = auth.uid() and (user_id = auth.uid() or public.is_admin()));
drop policy if exists "marcar suporte como lido" on public.suporte_mensagens;
create policy "marcar suporte como lido" on public.suporte_mensagens
  for update to authenticated using (auth.uid() = user_id or public.is_admin());

create or replace function public.frela_suporte_mensagem()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_nome text;
  v_preview text;
begin
  new.texto := btrim(new.texto);
  if new.texto = '' then raise exception 'Mensagem vazia'; end if;
  if length(new.texto) > 2000 then raise exception 'Mensagem muito longa'; end if;

  v_preview := case when length(new.texto) > 60 then left(new.texto, 60) || '…' else new.texto end;

  if new.autor_id = new.user_id then
    new.lida_usuario := true;
    new.lida_admin := false;
    select coalesce(nullif(e.nome_empresa, ''), nullif(p.nome, ''), p.email) into v_nome
      from public.profiles p left join public.empresa_dados e on e.profile_id = p.id
     where p.id = new.user_id;
    insert into public.notificacoes (user_id, tipo, texto, link)
    select a.id, 'suporte', 'Suporte — ' || coalesce(v_nome, 'usuário') || ': ' || v_preview, '/admin/suporte/' || new.user_id
      from public.profiles a
     where a.is_admin and a.id <> new.user_id;
  else
    new.lida_admin := true;
    new.lida_usuario := false;
    insert into public.notificacoes (user_id, tipo, texto, link)
    values (new.user_id, 'suporte', 'Equipe FreLa respondeu: ' || v_preview, '/suporte');
  end if;
  return new;
end;
$$;

drop trigger if exists frela_before_suporte_insert on public.suporte_mensagens;
create trigger frela_before_suporte_insert
  before insert on public.suporte_mensagens
  for each row execute function public.frela_suporte_mensagem();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'suporte_mensagens'
  ) then
    alter publication supabase_realtime add table public.suporte_mensagens;
  end if;
end $$;

-- 5. ADM concede/retira o selo "Verificado"
create or replace function public.admin_set_verificado(p_id uuid, p_valor boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores';
  end if;
  update public.profiles set verificado = p_valor where id = p_id;
end;
$$;
grant execute on function public.admin_set_verificado(uuid, boolean) to authenticated;
