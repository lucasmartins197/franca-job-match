-- ═══════════════════════════════════════════════════════════════
-- FRELA — RECONSTRUÇÃO DO SCHEMA BASE
-- O backend foi reconectado e as tabelas base do app (mensagens,
-- contratacoes, notificacoes, avaliacoes, empresa_dados,
-- profissional_dados, pagamentos) não existiam nele, nem as colunas
-- que as Fases 1-8 assumem existir em profiles.
-- Idempotente.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. profiles: colunas que o app usa
-- ─────────────────────────────────────────────
alter table public.profiles add column if not exists telefone text not null default '';
alter table public.profiles add column if not exists cidade text not null default '';
alter table public.profiles add column if not exists foto_url text;
alter table public.profiles add column if not exists avaliacao_media numeric not null default 0;
alter table public.profiles add column if not exists total_avaliacoes integer not null default 0;
alter table public.profiles add column if not exists subscription_status text not null default 'inactive';
alter table public.profiles add column if not exists subscription_end timestamptz;

-- diretório: perfis precisam ser visíveis para empresas e colegas
create policy "Authenticated can read profiles"
  on public.profiles for select to authenticated using (true);

-- ─────────────────────────────────────────────
-- 2. contratacoes
-- ─────────────────────────────────────────────
create table if not exists public.contratacoes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  empresa_id uuid not null references public.profiles(id) on delete cascade,
  profissional_id uuid not null references public.profiles(id) on delete cascade,
  valor numeric not null default 0,
  taxa_5pct numeric not null default 0,
  taxa_cobrada boolean not null default false,
  status text not null default 'em_andamento',
  finalizada_em timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists contratacoes_job_idx on public.contratacoes (job_id);
create index if not exists contratacoes_empresa_idx on public.contratacoes (empresa_id, created_at desc);
create index if not exists contratacoes_profissional_idx on public.contratacoes (profissional_id, created_at desc);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratacoes TO authenticated;
GRANT ALL ON public.contratacoes TO service_role;

alter table public.contratacoes enable row level security;

create policy "Partes veem suas contratacoes"
  on public.contratacoes for select to authenticated
  using (empresa_id = auth.uid() or profissional_id = auth.uid());
create policy "Empresa cria contratacao"
  on public.contratacoes for insert to authenticated
  with check (empresa_id = auth.uid());
create policy "Partes atualizam suas contratacoes"
  on public.contratacoes for update to authenticated
  using (empresa_id = auth.uid() or profissional_id = auth.uid())
  with check (empresa_id = auth.uid() or profissional_id = auth.uid());
create policy "Empresa apaga suas contratacoes"
  on public.contratacoes for delete to authenticated
  using (empresa_id = auth.uid());

-- ─────────────────────────────────────────────
-- 3. mensagens (chat)
-- ─────────────────────────────────────────────
create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  contratacao_id uuid not null references public.contratacoes(id) on delete cascade,
  de_id uuid not null references public.profiles(id) on delete cascade,
  para_id uuid not null references public.profiles(id) on delete cascade,
  texto text not null,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensagens TO authenticated;
GRANT ALL ON public.mensagens TO service_role;

alter table public.mensagens enable row level security;

create policy "Partes leem mensagens da conversa"
  on public.mensagens for select to authenticated
  using (exists (
    select 1 from public.contratacoes c
     where c.id = mensagens.contratacao_id
       and (c.empresa_id = auth.uid() or c.profissional_id = auth.uid())
  ));
create policy "Usuario envia mensagem"
  on public.mensagens for insert to authenticated
  with check (de_id = auth.uid());
create policy "Partes marcam mensagens como lidas"
  on public.mensagens for update to authenticated
  using (exists (
    select 1 from public.contratacoes c
     where c.id = mensagens.contratacao_id
       and (c.empresa_id = auth.uid() or c.profissional_id = auth.uid())
  ));

-- ─────────────────────────────────────────────
-- 4. notificacoes
-- ─────────────────────────────────────────────
create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tipo text not null,
  texto text not null,
  link text,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notificacoes_user_idx on public.notificacoes (user_id, created_at desc);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificacoes TO authenticated;
GRANT ALL ON public.notificacoes TO service_role;

alter table public.notificacoes enable row level security;

create policy "Usuario ve suas notificacoes"
  on public.notificacoes for select to authenticated using (user_id = auth.uid());
create policy "Usuario marca suas notificacoes como lidas"
  on public.notificacoes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Usuario recebe notificacoes"
  on public.notificacoes for insert to authenticated with check (true);

-- ─────────────────────────────────────────────
-- 5. avaliacoes
-- ─────────────────────────────────────────────
create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  contratacao_id uuid not null references public.contratacoes(id) on delete cascade,
  de_id uuid not null references public.profiles(id) on delete cascade,
  para_id uuid not null references public.profiles(id) on delete cascade,
  nota numeric not null,
  comentario text,
  created_at timestamptz not null default now(),
  unique (contratacao_id, de_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;

alter table public.avaliacoes enable row level security;

create policy "Avaliacoes sao publicas"
  on public.avaliacoes for select to authenticated using (true);
create policy "Usuario avalia"
  on public.avaliacoes for insert to authenticated with check (de_id = auth.uid());

-- ─────────────────────────────────────────────
-- 6. empresa_dados
-- ─────────────────────────────────────────────
create table if not exists public.empresa_dados (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  nome_empresa text not null default '',
  cnpj text,
  ramo text,
  endereco text not null default '',
  bio text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa_dados TO authenticated;
GRANT ALL ON public.empresa_dados TO service_role;

alter table public.empresa_dados enable row level security;

create policy "Dados de empresa sao publicos"
  on public.empresa_dados for select to authenticated using (true);
create policy "Dono edita dados da empresa"
  on public.empresa_dados for insert to authenticated with check (profile_id = auth.uid());
create policy "Dono atualiza dados da empresa"
  on public.empresa_dados for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "Dono apaga dados da empresa"
  on public.empresa_dados for delete to authenticated using (profile_id = auth.uid());

-- ─────────────────────────────────────────────
-- 7. profissional_dados
-- ─────────────────────────────────────────────
create table if not exists public.profissional_dados (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  profissoes text[] not null default '{}',
  experiencia text not null default '',
  bio text not null default '',
  disponibilidade text not null default '',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profissional_dados TO authenticated;
GRANT ALL ON public.profissional_dados TO service_role;

alter table public.profissional_dados enable row level security;

create policy "Curriculo e publico"
  on public.profissional_dados for select to authenticated using (true);
create policy "Dono cria curriculo"
  on public.profissional_dados for insert to authenticated with check (profile_id = auth.uid());
create policy "Dono atualiza curriculo"
  on public.profissional_dados for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "Dono apaga curriculo"
  on public.profissional_dados for delete to authenticated using (profile_id = auth.uid());

-- ─────────────────────────────────────────────
-- 8. pagamentos
-- ─────────────────────────────────────────────
create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tipo text not null,
  valor numeric not null default 0,
  status text not null default 'pago',
  stripe_id text,
  contratacao_id uuid references public.contratacoes(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists pagamentos_user_idx on public.pagamentos (user_id, created_at desc);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos TO authenticated;
GRANT ALL ON public.pagamentos TO service_role;

alter table public.pagamentos enable row level security;

create policy "Usuario ve seus pagamentos"
  on public.pagamentos for select to authenticated using (user_id = auth.uid());
create policy "Sistema registra pagamentos"
  on public.pagamentos for insert to authenticated with check (true);
