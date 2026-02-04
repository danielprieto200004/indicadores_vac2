import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { MacrosConsolidatedTable } from "./macros-consolidated-table";
import type { MacroRollupRow } from "./macros-consolidated-table";
import type { ContributionDetail, TrafficLight } from "@/app/app/admin/_components/macro-contributions-dialog";

export default async function MacrosPage() {
  const supabase = await createSupabaseServerClient();

  const { data: macros } = await supabase
    .from("vw_macro_rollup")
    .select(
      "macro_id,year,reto,indicador,meta_1_value,meta_1_desc,meta_2_value,meta_2_desc,contributions_count,macro_percent_avg,contributions_with_updates"
    )
    .order("year", { ascending: false });

  const rollupRows = (macros ?? []) as unknown as MacroRollupRow[];
  const macroIds = [...new Set(rollupRows.map((m) => m.macro_id))];

  const contributionsByMacro: Record<string, ContributionDetail[]> = {};

  if (macroIds.length > 0) {
    const { data: contributions } = await supabase
      .from("area_contributions")
      .select(
        "id,macro_id,year,area_id,indicador_area,reto_area,meta_area,meta_desc,areas(name,type)"
      )
      .in("macro_id", macroIds)
      .eq("active", true);

    const contribRows = (contributions ?? []) as Array<{
      id: string;
      macro_id: string;
      year: number;
      area_id: string;
      indicador_area: string;
      reto_area: string;
      meta_area: number | null;
      meta_desc: string | null;
      areas: { name: string; type: string } | { name: string; type: string }[] | null;
    }>;

    const ids = contribRows.map((c) => c.id);
    const { data: latestRows } =
      ids.length > 0
        ? await supabase
            .from("vw_contribution_latest")
            .select("contribution_id,percent,traffic_light,period_end,current_value")
            .in("contribution_id", ids)
        : { data: [] };

    type LatestRow = {
      contribution_id: string;
      percent: number | null;
      traffic_light: string | null;
      period_end: string | null;
      current_value: number | null;
    };
    const latestById = new Map<string, LatestRow>();
    (latestRows ?? []).forEach((r: LatestRow) => latestById.set(r.contribution_id, r));

    for (const c of contribRows) {
      const key = `${c.macro_id}_${c.year}`;
      const arr = contributionsByMacro[key] ?? [];
      const area = Array.isArray(c.areas) ? c.areas[0] : c.areas;
      const latest = latestById.get(c.id) ?? null;
      arr.push({
        id: c.id,
        areaName: area?.name ?? "—",
        areaType: area?.type ?? "",
        reto_area: c.reto_area ?? "",
        indicador_area: c.indicador_area ?? "",
        meta_area: c.meta_area ?? null,
        meta_desc: c.meta_desc ?? null,
        latest: latest
          ? {
              traffic_light: (latest.traffic_light ?? null) as TrafficLight | null,
              percent: latest.percent,
              current_value: latest.current_value,
              period_end: latest.period_end,
            }
          : null,
      });
      contributionsByMacro[key] = arr;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Retos Macro VAC</h1>
        <p className="text-sm text-muted-foreground">
          Avance consolidado (roll-up) calculado desde los aportes de áreas. Usa &quot;Ver quién aporta&quot; para ver
          qué áreas e indicadores contribuyen a cada reto.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consolidado</CardTitle>
          <CardDescription>
            Avance = promedio del último porcentaje reportado por cada aporte activo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!rollupRows.length ? (
            <div className="text-sm text-muted-foreground">
              Aún no hay retos macro creados.
            </div>
          ) : (
            <MacrosConsolidatedTable macros={rollupRows} contributionsByMacro={contributionsByMacro} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
