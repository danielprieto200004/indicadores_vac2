-- Storage: bucket privado de evidencias + policies
-- Convención de paths:
-- - bucket: evidence
-- - object.name: "<area_id>/<update_id>/<filename>"
--   (primer segmento SIEMPRE es UUID del área)
--
-- Nota importante:
-- En algunos proyectos, el rol con el que corres SQL NO es dueño de `storage.objects`.
-- En ese caso, `ALTER TABLE storage.objects ...` y/o `CREATE POLICY ...` fallan con:
--   "must be owner of table objects"
-- Por eso:
-- - NO intentamos habilitar RLS (en Supabase normalmente ya viene habilitado).
-- - Las policies se crean dentro de bloques que, si no tienen privilegios, dejan un NOTICE
--   para que las crees manualmente en Dashboard > Storage > Policies.

-- Crear bucket (idempotente)
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'evidence') then
    insert into storage.buckets (id, name, public)
    values ('evidence', 'evidence', false);
  end if;
end $$;

-- Helper para extraer el primer segmento como uuid
create or replace function public.area_id_from_object_name(object_name text)
returns uuid
language sql
stable
as $$
  select nullif(split_part(object_name, '/', 1), '')::uuid;
$$;

-- SELECT: admins o miembros del área
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='evidence_select_admin_or_area_member'
  ) then
    create policy evidence_select_admin_or_area_member
      on storage.objects
      for select
      using (
        bucket_id = 'evidence'
        and (
          public.is_admin()
          or public.belongs_to_area(public.area_id_from_object_name(name))
        )
      );
  end if;
exception
  when insufficient_privilege then
    raise notice 'Sin permisos para CREATE POLICY en storage.objects. Crea la policy evidence_select_admin_or_area_member en Dashboard > Storage > Policies.';
end $$;

-- INSERT: admins o miembros del área
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='evidence_insert_admin_or_area_member'
  ) then
    create policy evidence_insert_admin_or_area_member
      on storage.objects
      for insert
      with check (
        bucket_id = 'evidence'
        and (
          public.is_admin()
          or public.belongs_to_area(public.area_id_from_object_name(name))
        )
      );
  end if;
exception
  when insufficient_privilege then
    raise notice 'Sin permisos para CREATE POLICY en storage.objects. Crea la policy evidence_insert_admin_or_area_member en Dashboard > Storage > Policies.';
end $$;

-- UPDATE/DELETE: solo admin (evita manipulación)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='evidence_admin_update'
  ) then
    create policy evidence_admin_update
      on storage.objects
      for update
      using (bucket_id = 'evidence' and public.is_admin())
      with check (bucket_id = 'evidence' and public.is_admin());
  end if;
exception
  when insufficient_privilege then
    raise notice 'Sin permisos para CREATE POLICY en storage.objects. Crea la policy evidence_admin_update en Dashboard > Storage > Policies.';
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='evidence_admin_delete'
  ) then
    create policy evidence_admin_delete
      on storage.objects
      for delete
      using (bucket_id = 'evidence' and public.is_admin());
  end if;
exception
  when insufficient_privilege then
    raise notice 'Sin permisos para CREATE POLICY en storage.objects. Crea la policy evidence_admin_delete en Dashboard > Storage > Policies.';
end $$;

