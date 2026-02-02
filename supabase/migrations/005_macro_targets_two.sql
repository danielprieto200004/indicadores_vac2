-- Soporte para hasta 2 metas en macro_challenges:
-- - meta_1_value + meta_1_desc
-- - meta_2_value + meta_2_desc (opcional)
--
-- También actualiza la vista vw_macro_rollup para exponer ambas metas.

alter table public.macro_challenges
  add column if not exists meta_1_value numeric,
  add column if not exists meta_1_desc text,
  add column if not exists meta_2_value numeric,
  add column if not exists meta_2_desc text;

-- Migración desde columna antigua (si existe y aún no se migró)
update public.macro_challenges
set meta_1_value = meta_anio_actual
where meta_1_value is null
  and meta_anio_actual is not null;

-- IMPORTANTE:
-- Si la vista ya existía con la columna `meta_anio_actual`,
-- Postgres NO permite renombrarla con CREATE OR REPLACE VIEW.
-- Por eso la eliminamos y la recreamos.
drop view if exists public.vw_macro_rollup;

create or replace view public.vw_macro_rollup as
select
  m.id as macro_id,
  m.year,
  m.reto,
  m.indicador,
  m.meta_1_value,
  m.meta_1_desc,
  m.meta_2_value,
  m.meta_2_desc,
  count(c.id) filter (where c.active) as contributions_count,
  avg(l.percent) filter (where c.active) as macro_percent_avg,
  count(l.contribution_id) filter (where c.active and l.contribution_id is not null) as contributions_with_updates
from public.macro_challenges m
left join public.area_contributions c on c.macro_id = m.id and c.year = m.year
left join public.vw_contribution_latest l on l.contribution_id = c.id
group by
  m.id, m.year, m.reto, m.indicador,
  m.meta_1_value, m.meta_1_desc, m.meta_2_value, m.meta_2_desc;

