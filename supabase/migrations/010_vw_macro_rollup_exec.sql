-- Vista ejecutiva para Retos Macro VAC
-- Reglas:
-- - Un macro solo es 100% "completo" cuando TODAS las contribuciones activas están en VERDE.
-- - No todas las áreas aportan a todos los macros, así que "sin aporte" se calcula vs áreas activas totales.

drop view if exists public.vw_macro_rollup;

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

