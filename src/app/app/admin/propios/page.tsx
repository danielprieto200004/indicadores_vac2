import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TrafficLight = "verde" | "naranja" | "rojo";
type JoinedArea = { name: string; type: string } | { name: string; type: string }[] | null;

type OwnRow = {
  id: string;
  year: number;
  area_id: string;
  reto_area: string;
  indicador_area: string;
  meta_value: number | null;
  areas: JoinedArea;
};

type OwnLatest = {
  indicator_id: string;
  percent: number | null;
  traffic_light: TrafficLight | null;
  report_date: string | null;
  current_value: number | null;
};

function asSearch(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

function trafficLabel(t: TrafficLight) {
  return t === "rojo" ? "No realizado" : t === "naranja" ? "En proceso" : "Completo";
}

function trafficVariant(t: TrafficLight) {
  return t === "rojo" ? "destructive" : t === "naranja" ? "secondary" : "default";
}

export default async function AdminOwnIndicatorsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const q = asSearch(sp.q)?.toLowerCase() ?? "";
  const yearParam = asSearch(sp.year);
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  const selectedYear = Number.isFinite(year) ? Math.trunc(year) : new Date().getFullYear();

  const supabase = await createSupabaseServerClient();

  const { data: indicators } = await supabase
    .from("area_own_indicators")
    .select("id,year,area_id,reto_area,indicador_area,meta_value,areas(name,type)")
    .eq("active", true)
    .eq("year", selectedYear)
    .order("created_at", { ascending: false });

  const rowsAll = (indicators ?? []) as OwnRow[];
  const rows = q
    ? rowsAll.filter((r) => {
        const area = r.areas ? (Array.isArray(r.areas) ? r.areas[0] : r.areas) : null;
        const haystack = `${area?.name ?? ""} ${area?.type ?? ""} ${r.indicador_area} ${r.reto_area}`.toLowerCase();
        return haystack.includes(q);
      })
    : rowsAll;

  const ids = rows.map((r) => r.id);
  const { data: latestRows } = ids.length
    ? await supabase
        .from("vw_area_own_latest")
        .select("indicator_id,percent,traffic_light,report_date,current_value")
        .in("indicator_id", ids)
    : { data: [] as OwnLatest[] };

  const latestById = new Map<string, OwnLatest>();
  (latestRows ?? []).forEach((r) => latestById.set((r as OwnLatest).indicator_id, r as OwnLatest));

  const total = rows.length;
  const withUpdates = rows.filter((r) => latestById.has(r.id)).length;
  const atRisk = rows.filter((r) => {
    const t = latestById.get(r.id)?.traffic_light;
    return t === "naranja" || t === "rojo";
  }).length;
  const completed = rows.filter((r) => latestById.get(r.id)?.traffic_light === "verde").length;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent" />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Indicadores propios del área</h1>
                <p className="text-sm text-muted-foreground">
                  Consolidado de indicadores no asociados a Retos Macro VAC. Vista de admin (solo lectura).
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="h-9">
                  <Link href="/app">Volver al Dashboard</Link>
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-input bg-muted/20 px-3 py-2">
                <div className="text-[11px] font-medium text-muted-foreground">Año</div>
                <div className="text-sm font-semibold">{selectedYear}</div>
              </div>
              <div className="rounded-lg border border-input bg-muted/20 px-3 py-2">
                <div className="text-[11px] font-medium text-muted-foreground">Activos</div>
                <div className="text-sm font-semibold">{total}</div>
              </div>
              <div className="rounded-lg border border-input bg-muted/20 px-3 py-2">
                <div className="text-[11px] font-medium text-muted-foreground">En riesgo</div>
                <div className="text-sm font-semibold">{atRisk}</div>
              </div>
              <div className="rounded-lg border border-input bg-muted/20 px-3 py-2">
                <div className="text-[11px] font-medium text-muted-foreground">Completos</div>
                <div className="text-sm font-semibold">{completed}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2">
            <span>Listado</span>
            <Badge variant="secondary">
              {withUpdates}/{total} con avance
            </Badge>
          </CardTitle>
          <CardDescription>Busca por área, indicador o reto.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center" action="/app/admin/propios">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Buscar..."
              className="h-9 sm:max-w-[420px]"
            />
            <Input
              name="year"
              defaultValue={String(selectedYear)}
              inputMode="numeric"
              placeholder="Año"
              className="h-9 w-full sm:w-[120px]"
            />
            <Button type="submit" size="sm" className="h-9">
              Filtrar
            </Button>
          </form>

          {!rows.length ? (
            <div className="text-sm text-muted-foreground">No hay resultados.</div>
          ) : (
            <div className="rounded-xl border border-input">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Área</TableHead>
                    <TableHead>Indicador</TableHead>
                    <TableHead className="w-[140px]">Meta</TableHead>
                    <TableHead className="w-[160px]">Estado</TableHead>
                    <TableHead className="w-[140px]">Último reporte</TableHead>
                    <TableHead className="w-[110px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const area = r.areas ? (Array.isArray(r.areas) ? r.areas[0] : r.areas) : null;
                    const latest = latestById.get(r.id) ?? null;
                    const traffic = latest?.traffic_light ?? null;
                    const meta = typeof r.meta_value === "number" ? r.meta_value : null;
                    const current = typeof latest?.current_value === "number" ? latest.current_value : null;
                    const pct = typeof latest?.percent === "number" ? latest.percent : null;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="align-top">
                          <div className="text-sm font-semibold">{area?.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{area?.type ?? ""}</div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="line-clamp-2 text-sm font-medium" title={r.indicador_area}>
                            {r.indicador_area}
                          </div>
                          <div className="mt-1 line-clamp-1 text-xs text-muted-foreground" title={r.reto_area}>
                            {r.reto_area}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          {meta === null ? (
                            <span className="text-sm text-muted-foreground">—</span>
                          ) : (
                            <span className="text-sm font-semibold tabular-nums">{meta}</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          {!traffic ? (
                            <Badge variant="outline">Sin avances</Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge variant={trafficVariant(traffic)}>{trafficLabel(traffic)}</Badge>
                              <div className="text-xs text-muted-foreground">
                                {current !== null && meta !== null
                                  ? `${current}/${meta} (${pct ?? "—"}%)`
                                  : pct !== null
                                    ? `${pct}%`
                                    : "—"}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <span className="text-sm text-muted-foreground">{latest?.report_date ?? "—"}</span>
                        </TableCell>
                        <TableCell className="align-top text-right">
                          <Button asChild size="sm" variant="outline" className="h-9">
                            <Link href={`/app/admin/propios/${r.id}`}>Ver</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

