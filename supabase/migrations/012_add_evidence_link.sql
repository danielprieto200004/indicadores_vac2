-- Agregar campo evidence_link para permitir evidencias como links además de archivos
-- evidence_path seguirá siendo para archivos, evidence_link para URLs

-- 1) Agregar evidence_link a progress_updates
alter table public.progress_updates
  add column if not exists evidence_link text;

-- 2) Agregar evidence_link a area_own_updates
alter table public.area_own_updates
  add column if not exists evidence_link text;

-- 3) Actualizar vista vw_contribution_latest para incluir evidence_link
-- Necesitamos eliminar y recrear la vista porque CREATE OR REPLACE no permite cambiar columnas
-- Primero eliminamos la vista dependiente vw_macro_rollup
drop view if exists public.vw_macro_rollup;
-- Luego eliminamos vw_contribution_latest
drop view if exists public.vw_contribution_latest;
-- Recreamos vw_contribution_latest con evidence_link
create view public.vw_contribution_latest as
select distinct on (u.contribution_id)
  u.contribution_id,
  u.id as update_id,
  u.period_start,
  u.period_end,
  u.percent,
  u.current_value,
  u.traffic_light,
  u.comment,
  u.evidence_path,
  u.evidence_link,
  u.created_at
from public.progress_updates u
order by u.contribution_id, u.created_at desc;
-- Recreamos vw_macro_rollup (depende de vw_contribution_latest)
create or replace view public.vw_macro_rollup as
with areas_active as (
  select count(*)::int as total
  from public.areas a
  where a.active = true
),
latest as (
  select
    l.contribution_id,
    l.percent,
    l.traffic_light,
    l.period_end,
    l.current_value
  from public.vw_contribution_latest l
)
select
  m.id as macro_id,
  m.year,
  m.reto,
  m.indicador,
  m.meta_1_value,
  m.meta_1_desc,
  m.meta_2_value,
  m.meta_2_desc,

  -- Contribuciones / cobertura
  count(c.id) filter (where c.active) as contributions_count,
  count(distinct c.area_id) filter (where c.active) as contributing_areas_count,
  (select total from areas_active) as areas_active_count,
  greatest(
    0,
    (select total from areas_active) - count(distinct c.area_id) filter (where c.active)
  ) as missing_areas_count,

  -- Estado por contribuciones
  count(latest.contribution_id) filter (where c.active and latest.contribution_id is not null) as contributions_with_updates,
  count(*) filter (where c.active and latest.traffic_light = 'verde') as contributions_completed_count,
  count(*) filter (where c.active and latest.traffic_light in ('naranja','rojo')) as contributions_risk_count,
  count(*) filter (where c.active and latest.contribution_id is null) as contributions_without_updates_count,

  -- Avance promedio (como referencia) y avance "estricto"
  avg(latest.percent) filter (where c.active) as macro_percent_avg,
  case
    when count(c.id) filter (where c.active) = 0 then null
    when count(*) filter (where c.active and latest.traffic_light = 'verde') = count(c.id) filter (where c.active)
      then 100::numeric
    else least(
      99.99::numeric,
      avg(latest.percent) filter (where c.active and latest.percent is not null)
    )
  end as macro_percent_strict,

  -- Completo = todas las contribuciones activas en verde (y al menos 1 contribución)
  case
    when count(c.id) filter (where c.active) = 0 then false
    when count(*) filter (where c.active and latest.traffic_light = 'verde') = count(c.id) filter (where c.active)
      then true
    else false
  end as macro_is_complete,

  -- Semáforo macro (prioridad: rojo > naranja > verde; null si no hay avances)
  case
    when count(latest.contribution_id) filter (where c.active and latest.traffic_light is not null) = 0 then null
    when count(*) filter (where c.active and latest.traffic_light = 'rojo') > 0 then 'rojo'::public.traffic_light
    when count(*) filter (where c.active and latest.traffic_light = 'naranja') > 0 then 'naranja'::public.traffic_light
    when count(*) filter (where c.active and latest.traffic_light = 'verde') = count(c.id) filter (where c.active)
      then 'verde'::public.traffic_light
    else 'naranja'::public.traffic_light
  end as macro_traffic_light

from public.macro_challenges m
left join public.area_contributions c
  on c.macro_id = m.id
  and c.year = m.year
left join latest
  on latest.contribution_id = c.id
group by
  m.id, m.year, m.reto, m.indicador,
  m.meta_1_value, m.meta_1_desc, m.meta_2_value, m.meta_2_desc;

-- 4) Actualizar vista vw_area_own_latest para incluir evidence_link
-- Necesitamos eliminar y recrear la vista porque CREATE OR REPLACE no permite cambiar columnas
drop view if exists public.vw_area_own_latest;
create view public.vw_area_own_latest as
select distinct on (u.indicator_id)
  u.indicator_id,
  u.id as update_id,
  u.report_date,
  u.percent,
  u.current_value,
  u.traffic_light,
  u.comment,
  u.evidence_path,
  u.evidence_link,
  u.created_at
from public.area_own_updates u
order by u.indicator_id, u.created_at desc;

