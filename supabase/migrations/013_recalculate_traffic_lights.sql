-- Recalculate traffic_light for all existing records
-- Rule: verde >= 80%, naranja 40-79%, rojo < 40%

UPDATE progress_updates
SET traffic_light = (CASE
  WHEN percent >= 80 THEN 'verde'
  WHEN percent >= 40 THEN 'naranja'
  ELSE 'rojo'
END)::traffic_light;

UPDATE area_own_updates
SET traffic_light = (CASE
  WHEN percent >= 80 THEN 'verde'
  WHEN percent >= 40 THEN 'naranja'
  ELSE 'rojo'
END)::traffic_light;
