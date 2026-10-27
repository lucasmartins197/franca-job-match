-- ═══════════════════════════════════════════════════════════════════
-- FRELA — FASE 2: PERFIL COMPLETO
-- (bucket "avatars" criado via ferramenta propria de Storage)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Redes sociais do profissional
alter table public.profissional_dados add column if not exists instagram text;
alter table public.profissional_dados add column if not exists linkedin text;

-- 2. Storage: policies do bucket "avatars" (fotos de perfil)
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

-- 3. Histórico de trabalhos finalizados
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
