-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 8: GEOLOCALIZAÇÃO (vagas no mapa + lista de espera)
-- Rodar UMA vez no SQL Editor do Supabase (modnamtaatcafqtjfzsd),
-- depois do SQL da Fase 7. Idempotente.
--
-- • jobs.latitude/longitude: ponto da vaga no mapa. O app geocodifica o
--   endereço da vaga (OpenStreetMap); sem endereço próprio, o banco copia
--   as coordenadas da empresa (empresa_dados).
-- • profiles.latitude/longitude/localizacao_em: REGIÃO do usuário
--   (arredondada a 2 casas ≈ 1 km — nunca a posição exata, por privacidade;
--   o arredondamento é garantido aqui no banco).
-- • lista_espera: e-mails de quem abriu o app fora da área atendida
--   (Franca e região), para sabermos onde há demanda. Só ADM lê.
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Coordenadas das vagas
-- ─────────────────────────────────────────────
alter table public.jobs add column if not exists latitude double precision;
alter table public.jobs add column if not exists longitude double precision;

create or replace function public.frela_job_localizacao()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- coordenadas inválidas viram nulas
  if new.latitude is not null and (new.latitude not between -90 and 90 or new.longitude is null or new.longitude not between -180 and 180) then
    new.latitude := null;
    new.longitude := null;
  end if;
  if new.latitude is null or new.longitude is null then
    select e.latitude, e.longitude into new.latitude, new.longitude
      from public.empresa_dados e where e.profile_id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists frela_before_job_localizacao on public.jobs;
create trigger frela_before_job_localizacao
  before insert or update of latitude, longitude, address on public.jobs
  for each row execute function public.frela_job_localizacao();

-- vagas já existentes: usam o ponto da empresa
update public.jobs j
   set latitude = e.latitude, longitude = e.longitude
  from public.empresa_dados e
 where e.profile_id = j.user_id and j.latitude is null and e.latitude is not null and e.longitude is not null;

create index if not exists jobs_abertas_local_idx on public.jobs (latitude, longitude) where status = 'aberta';

-- ─────────────────────────────────────────────
-- 2. Região do usuário (arredondada)
-- ─────────────────────────────────────────────
alter table public.profiles add column if not exists latitude double precision;
alter table public.profiles add column if not exists longitude double precision;
alter table public.profiles add column if not exists localizacao_em timestamptz;

create or replace function public.frela_arredonda_regiao()
returns trigger
language plpgsql
as $$
begin
  if new.latitude is not null then new.latitude := round(new.latitude::numeric, 2)::double precision; end if;
  if new.longitude is not null then new.longitude := round(new.longitude::numeric, 2)::double precision; end if;
  return new;
end;
$$;

drop trigger if exists frela_before_profile_regiao on public.profiles;
create trigger frela_before_profile_regiao
  before insert or update of latitude, longitude on public.profiles
  for each row execute function public.frela_arredonda_regiao();

update public.profiles
   set latitude = round(latitude::numeric, 2)::double precision, longitude = round(longitude::numeric, 2)::double precision
 where latitude is not null;

-- ─────────────────────────────────────────────
-- 3. Lista de espera (fora da área atendida)
-- ─────────────────────────────────────────────
create table if not exists public.lista_espera (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  cidade text check (length(cidade) <= 120),
  tipo text check (tipo is null or tipo in ('freelancer', 'empresa')),
  latitude double precision,
  longitude double precision,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists lista_espera_email_cidade_idx
  on public.lista_espera (lower(email), lower(coalesce(cidade, '')));

alter table public.lista_espera enable row level security;

drop policy if exists "qualquer um entra na lista de espera" on public.lista_espera;
create policy "qualquer um entra na lista de espera" on public.lista_espera
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "admin ve a lista de espera" on public.lista_espera;
create policy "admin ve a lista de espera" on public.lista_espera
  for select to authenticated using (public.is_admin());

grant insert on public.lista_espera to anon, authenticated;
grant select on public.lista_espera to authenticated;

-- coordenadas da lista também arredondadas
drop trigger if exists frela_before_lista_espera_regiao on public.lista_espera;
create trigger frela_before_lista_espera_regiao
  before insert on public.lista_espera
  for each row execute function public.frela_arredonda_regiao();
