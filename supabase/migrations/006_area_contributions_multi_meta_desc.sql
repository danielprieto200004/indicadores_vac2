-- Permitir múltiples "retos estratégicos del área" por (macro, área, año)
-- y agregar descripción corta a la meta del área.
--
-- Cambios:
-- - agrega `meta_desc` (text)
-- - agrega `ordinal` (int) para ordenar/identificar múltiples retos
-- - reemplaza unique(macro_id, area_id, year) por unique(macro_id, area_id, year, ordinal)

alter table public.area_contributions
  add column if not exists meta_desc text,
  add column if not exists ordinal int not null default 1;

-- El constraint se crea automáticamente con este nombre cuando se define como UNIQUE en la tabla:
-- area_contributions_macro_id_area_id_year_key
alter table public.area_contributions
  drop constraint if exists area_contributions_macro_id_area_id_year_key;

-- Nuevo unique que permite múltiples registros por macro/área/año
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'area_contributions_macro_area_year_ordinal_key'
  ) then
    alter table public.area_contributions
      add constraint area_contributions_macro_area_year_ordinal_key
      unique (macro_id, area_id, year, ordinal);
  end if;
end $$;

create index if not exists idx_contrib_macro_area_year
  on public.area_contributions(macro_id, area_id, year);

