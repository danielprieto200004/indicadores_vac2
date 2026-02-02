import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Latest = {
  contribution_id: string;
  percent: number | null;
  traffic_light: "verde" | "naranja" | "rojo" | null;
  period_end: string | null;
  current_value: number | null;
};

type JoinedArea = { name: string; type: string } | { name: string; type: string }[] | null;
type JoinedMacro = { reto: string } | { reto: string }[] | null;
type ContributionRow = {
  id: string;
  year: number;
  reto_area: string;
  indicador_area: string;
  meta_area: number | null;
  meta_desc?: string | null;
  areas: JoinedArea;
  macro_challenges: JoinedMacro;
};

export default async function AportesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: contributions } = await supabase
    .from("area_contributions")
    .select("id,year,reto_area,indicador_area,meta_area,meta_desc,areas(name,type),macro_challenges(reto)")
    .eq("active", true)
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (contributions ?? []) as ContributionRow[];
  const ids = rows.map((c) => c.id);
  const { data: latestRows } = ids.length
    ? await supabase
        .from("vw_contribution_latest")
        .select("contribution_id,percent,traffic_light,period_end,current_value")
        .in("contribution_id", ids)
    : { data: [] as Latest[] };

  const latestById = new Map<string, Latest>();
  (latestRows ?? []).forEach((r) => {
    latestById.set((r as Latest).contribution_id, r as Latest);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Seguimiento</h1>
        <p className="text-sm text-muted-foreground">
          Aquí tu Dirección/Escuela registra avances por periodo para cada reto asignado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis retos del área</CardTitle>
          <CardDescription>
            Selecciona un reto para registrar el avance (porcentaje, valor, semáforo y evidencia).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!rows.length ? (
            <div className="text-sm text-muted-foreground">
              Aún no tienes retos asignados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Año</TableHead>
                  <TableHead>Macro</TableHead>
                  <TableHead>Indicador del área</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Último avance</TableHead>
                  <TableHead>Semáforo</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => {
                  const area = Array.isArray(c.areas) ? c.areas[0] : c.areas;
                  const macro = Array.isArray(c.macro_challenges)
                    ? c.macro_challenges[0]
                    : c.macro_challenges;
                  const latest = latestById.get(c.id);
                  const traffic = latest?.traffic_light ?? null;
                  const current = typeof latest?.current_value === "number" ? latest.current_value : null;
                  const meta = typeof c.meta_area === "number" ? c.meta_area : null;

                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.year}</TableCell>
                      <TableCell className="max-w-[360px]">
                        <div className="font-medium">{macro?.reto ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {area?.name ?? "Área"} {area?.type ? `(${area.type})` : ""}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[360px]">
                        <Link
                          href={`/app/aportes/${c.id}`}
                          className="font-medium underline underline-offset-4"
                        >
                          {c.indicador_area}
                        </Link>
                        <div className="text-xs text-muted-foreground">{c.reto_area}</div>
                      </TableCell>
                      <TableCell>
                        <div>{c.meta_area ?? "—"}</div>
                        {c.meta_desc ? (
                          <div className="text-xs text-muted-foreground">{c.meta_desc}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {meta !== null && current !== null ? (
                          <div className="font-medium">
                            {current}/{meta}
                          </div>
                        ) : typeof latest?.percent === "number" ? (
                          `${latest.percent}%`
                        ) : (
                          "—"
                        )}
                        {latest?.period_end ? (
                          <div className="text-xs text-muted-foreground">Reporte: {latest.period_end}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {traffic ? (
                          <Badge
                            variant={
                              traffic === "rojo"
                                ? "destructive"
                                : traffic === "naranja"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {traffic === "rojo"
                              ? "No realizado"
                              : traffic === "naranja"
                                ? "En proceso"
                                : "Completo"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">—</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/app/aportes/${c.id}`}
                          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90"
                        >
                          Registrar avance
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

