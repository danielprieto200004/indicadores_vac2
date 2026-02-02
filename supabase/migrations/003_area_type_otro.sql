-- Paso 1/2:
-- Agrega el tipo 'otro' para areas.type.
--
-- IMPORTANTE (Postgres):
-- Un valor nuevo de enum NO puede usarse en la misma transacción en la que se crea.
-- Por eso el UPDATE que migra datos va en el siguiente script:
--   `004_migrate_decanatura_to_otro.sql`

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'area_type'
      and e.enumlabel = 'otro'
  ) then
    alter type public.area_type add value 'otro';
  end if;
end $$;

