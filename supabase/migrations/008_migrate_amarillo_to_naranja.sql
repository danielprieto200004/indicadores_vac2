-- Paso 2/2:
-- Ejecuta este script DESPUÉS de `007_traffic_light_naranja.sql`, en una ejecución separada.
-- Migra cualquier valor antiguo 'amarillo' -> 'naranja'

update public.progress_updates
set traffic_light = 'naranja'
where traffic_light::text = 'amarillo';

