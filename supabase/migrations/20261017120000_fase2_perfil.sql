-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 2: PERFIL COMPLETO
-- Rodar UMA vez no SQL Editor do Supabase (modnamtaatcafqtjfzsd).
-- Idempotente: pode rodar de novo sem problema.
--
-- 1. Colunas novas em profissional_dados: instagram, linkedin
-- 2. Bucket público "avatars" no Storage (fotos de perfil) + policies
-- 3. Funções de histórico de trabalhos (a empresa precisa ver o histórico
--    do candidato, mas o RLS de contratacoes só deixa as partes lerem)
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. Redes sociais do profissional
-- ─────────────────────────────────────────────
alter table public.profissional_dados add column if not exists instagram text;
alter table public.profissional_dados add column if not exists linkedin text;

-- ─────────────────────────────────────────────
-- 2. Storage: fotos de perfil
--    Caminho do arquivo: <user_id>/<arquivo>. Cada um só mexe na própria pasta.
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars: leitura publica" on storage.objects;
create policy "avatars: leitura publica" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars: upload na propria pasta" on storage.objects;
create policy "avatars: upload na propria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: atualiza na propria pasta" on storage.objects;
create policy "avatars: atualiza na propria pasta" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: apaga na propria pasta" on storage.objects;
create policy "avatars: apaga na propria pasta" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─────────────────────────────────────────────
-- 3. Histórico de trabalhos finalizados de um profissional
--    (só dados públicos: vaga, empresa, data e nota recebida)
-- ─────────────────────────────────────────────
create or replace function public.historico_profissional(p_id uuid)
returns table (
  contratacao_id uuid,
  titulo text,
  empresa text,
  data date,
  finalizada_em timestamptz,
  nota integer,
  comentario text
)
language sql
stable
security definer set search_path = public
as $$
  select c.id, j.title, j.company_name, j.date, c.finalizada_em, a.nota, a.comentario
    from public.contratacoes c
    join public.jobs j on j.id = c.job_id
    left join public.avaliacoes a on a.contratacao_id = c.id and a.para_id = c.profissional_id
   where c.profissional_id = p_id
     and c.status = 'finalizada'
   order by c.finalizada_em desc nulls last
   limit 50;
$$;

-- Quantidade de trabalhos finalizados de vários profissionais (lista de candidatos)
create or replace function public.trabalhos_finalizados(p_ids uuid[])
returns table (profissional_id uuid, total integer)
language sql
stable
security definer set search_path = public
as $$
  select c.profissional_id, count(*)::int
    from public.contratacoes c
   where c.profissional_id = any(p_ids)
     and c.status = 'finalizada'
   group by c.profissional_id;
$$;

-- Quantidade de contratações finalizadas de uma empresa (perfil da empresa)
create or replace function public.contratacoes_finalizadas_empresa(p_id uuid)
returns integer
language sql
stable
security definer set search_path = public
as $$
  select count(*)::int from public.contratacoes
   where empresa_id = p_id and status = 'finalizada';
$$;

grant execute on function public.historico_profissional(uuid) to authenticated;
grant execute on function public.trabalhos_finalizados(uuid[]) to authenticated;
grant execute on function public.contratacoes_finalizadas_empresa(uuid) to authenticated;
