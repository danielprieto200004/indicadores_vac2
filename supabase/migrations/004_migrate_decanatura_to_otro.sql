-- Paso 2/2:
-- Ejecuta este script DESPUÉS de `003_area_type_otro.sql`, en una ejecución separada.
-- Migra cualquier valor antiguo 'decanatura' -> 'otro'

update public.areas
set type = 'otro'
where type::text = 'decanatura';

