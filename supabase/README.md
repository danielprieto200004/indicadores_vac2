# Supabase (SQL)

Ejecuta estos scripts en el SQL editor de Supabase:

1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_storage_evidence.sql`
3. `supabase/migrations/003_area_type_otro.sql`
4. `supabase/migrations/004_migrate_decanatura_to_otro.sql`
5. `supabase/migrations/005_macro_targets_two.sql`
6. `supabase/migrations/006_area_contributions_multi_meta_desc.sql`
7. `supabase/migrations/007_traffic_light_naranja.sql`
8. `supabase/migrations/008_migrate_amarillo_to_naranja.sql`

## Convención de evidencias (Storage)

- Bucket: `evidence` (privado)
- Path del objeto: `<area_id>/<update_id>/<filename>`
- `progress_updates.evidence_path` debe guardar ese `path` (sin el bucket).

