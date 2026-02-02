-- Paso 1/2:
-- Agrega 'naranja' al enum `traffic_light`.
--
-- IMPORTANTE (Postgres):
-- Un valor nuevo de enum NO puede usarse en la misma transacción en la que se crea.
-- Por eso el UPDATE de datos va en el siguiente script:
--   `008_migrate_amarillo_to_naranja.sql`

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'traffic_light'
      and e.enumlabel = 'naranja'
  ) then
    alter type public.traffic_light add value 'naranja';
  end if;
end $$;

