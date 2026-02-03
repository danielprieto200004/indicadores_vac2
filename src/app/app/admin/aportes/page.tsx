import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaStrategicChallengesForm } from "@/components/admin/area-strategic-challenges-form";
import { ContributionsListWithFilters } from "@/components/admin/contributions-list-with-filters";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminContributionsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: macros, error: macrosError } = await supabase
    .from("macro_challenges")
    .select("id,year,reto")
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: areas } = await supabase
    .from("areas")
    .select("id,name,type,active")
    .eq("active", true)
    .order("name");

  const { data: contributions } = await supabase
    .from("area_contributions")
    .select(
      "id,year,ordinal,reto_area,indicador_area,meta_area,meta_desc,active,area_id,areas(name,type),macro_challenges(reto)"
    )
    .order("year", { ascending: false })
    .order("ordinal", { ascending: true })
    .order("created_at", { ascending: false });

  const ids = (contributions ?? []).map((c) => c.id);
  const { data: latestRows } = ids.length
    ? await supabase
        .from("vw_contribution_latest")
        .select("contribution_id,percent,traffic_light,period_end,current_value")
        .in("contribution_id", ids)
    : { data: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Retos estratégicos del área</h1>
        <p className="text-sm text-muted-foreground">
          Asigna los retos estratégicos que cada área aporta a un reto macro. (No todas las áreas aportan a todos los macros.)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear retos del área</CardTitle>
          <CardDescription>
            Selecciona el reto macro y agrega uno o más retos del área (con indicador, meta y descripción de meta).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!macros?.length ? (
            <div className="mb-4 rounded-lg border border-input bg-background p-4 text-sm">
              <div className="font-medium">No aparecen retos macro en la lista</div>
              <div className="mt-1 text-muted-foreground">
                {macrosError
                  ? `Error consultando macro_challenges: ${macrosError.message}`
                  : "No hay registros o tu sesión no tiene permisos de lectura (RLS)."}
              </div>
              <div className="mt-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/admin/macros">Ir a crear/ver retos macro</Link>
                </Button>
              </div>
            </div>
          ) : null}
          <AreaStrategicChallengesForm
            macroOptions={(macros ?? []).map((m) => {
              const retoShort = m.reto.length > 55 ? `${m.reto.slice(0, 55)}…` : m.reto;
              return { value: m.id, label: `${m.year} — ${retoShort}` };
            })}
            areaOptions={(areas ?? []).map((a) => ({ value: a.id, label: `${a.name} (${a.type})` }))}
            defaultYear={new Date().getFullYear()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>
            Retos estratégicos del área registrados. Filtra por área y/o busca por reto o indicador (se actualiza al instante).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContributionsListWithFilters
            contributions={contributions ?? []}
            latestRows={latestRows ?? []}
            areaOptions={(areas ?? []).map((a) => ({ value: a.id, label: `${a.name} (${a.type})` }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

