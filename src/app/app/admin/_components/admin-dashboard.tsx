import Link from "next/link";

import { AlertTriangle, BarChart3, Building2, CheckCircle2, FileText, Flame, Layers, TrendingUp } from "lucide-react";

import { MacroCardsWithDialog } from "@/app/app/admin/_components/macro-cards-with-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type TrafficLight = "verde" | "naranja" | "rojo";

type Latest = {
  contribution_id: string;
  percent: number | null;
  traffic_light: TrafficLight | null;
  period_end: string | null;
  current_value: number | null;
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

function fmtPct(v: number | null | undefined) {
  if (typeof v !== "number") return "—";
  return `${v.toFixed(2)}%`;
}

function metricToneBg(tone?: "ok" | "warn" | "info") {
  if (tone === "ok") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (tone === "warn") return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
  return "bg-primary/10 text-primary";
}

function metricToneCard(tone?: "ok" | "warn" | "info") {
  if (tone === "ok") return "border-emerald-200/60 dark:border-emerald-500/20";
  if (tone === "warn") return "border-rose-200/60 dark:border-rose-500/20";
  return "border-input";
}

function metricToneGlow(tone?: "ok" | "warn" | "info") {
  if (tone === "ok") return "from-emerald-500/15 via-emerald-500/0 to-transparent";
  if (tone === "warn") return "from-rose-500/15 via-rose-500/0 to-transparent";
  return "from-primary/15 via-primary/0 to-transparent";
}

function TinyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-input bg-muted/20 px-3 py-2">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  hint,
  icon,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone?: "ok" | "warn" | "info";
}) {
  return (
    <Card className={cn("relative overflow-hidden", metricToneCard(tone))}>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", metricToneGlow(tone))} />
      <CardHeader className="relative p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">{title}</CardTitle>
            <CardDescription className="mt-1 text-xs leading-snug">{hint}</CardDescription>
          </div>
          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", metricToneBg(tone))}>
            {icon}
          </span>
        </div>
      </CardHeader>
      <CardContent className="relative p-4 pt-0">
        <div className="text-3xl font-semibold leading-none tracking-tight tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

export async function AdminDashboard({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const yearParam = asSearch(sp.year);
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  const selectedYear = Number.isFinite(year) ? Math.trunc(year) : new Date().getFullYear();

  const supabase = await createSupabaseServerClient();

  const [{ data: areas }, { data: macros }, { data: contributions }, { data: ownIndicators }, { data: evidenceRows }] =
    await Promise.all([
      supabase.from("areas").select("id,type,active").eq("active", true),
      supabase
        .from("macro_challenges")
        .select(
          "id,year,reto,indicador,meta_1_value,meta_1_desc,meta_2_value,meta_2_desc"
        )
        .eq("year", selectedYear)
        .order("created_at", { ascending: false }),
      supabase
        .from("area_contributions")
        .select(
          "id,year,macro_id,area_id,indicador_area,reto_area,meta_area,meta_desc,active,areas(name,type),macro_challenges(reto)"
        )
        .eq("active", true)
        .eq("year", selectedYear)
        .order("created_at", { ascending: false }),
      supabase
        .from("area_own_indicators")
        .select("id,year,area_id,reto_area,indicador_area,meta_value,active,areas(name,type)")
        .eq("active", true)
        .eq("year", selectedYear)
        .order("created_at", { ascending: false }),
      supabase
        .from("progress_updates")
        .select(
          "id,created_at,evidence_path,traffic_light,contribution_id,area_contributions(id,year,indicador_area,areas(name,type),macro_challenges(reto))"
        )
        .not("evidence_path", "is", null)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const contribRows = (contributions ?? []) as Array<{
    id: string;
    year: number;
    macro_id: string;
    area_id: string;
    indicador_area: string;
    reto_area: string;
    meta_area: number | null;
    meta_desc: string | null;
    active: boolean;
    areas: { name: string; type: string } | { name: string; type: string }[] | null;
    macro_challenges: { reto: string } | { reto: string }[] | null;
  }>;

  const ids = contribRows.map((c) => c.id);
  const { data: latestRows } = ids.length
    ? await supabase
        .from("vw_contribution_latest")
        .select("contribution_id,percent,traffic_light,period_end,current_value")
        .in("contribution_id", ids)
    : { data: [] as Latest[] };

  const latestById = new Map<string, Latest>();
  (latestRows ?? []).forEach((r) => latestById.set((r as Latest).contribution_id, r as Latest));

  const ownRows = (ownIndicators ?? []) as Array<{
    id: string;
    year: number;
    area_id: string;
    reto_area: string;
    indicador_area: string;
    meta_value: number | null;
    active: boolean;
    areas: { name: string; type: string } | { name: string; type: string }[] | null;
  }>;
  const ownIds = ownRows.map((r) => r.id);
  const { data: ownLatestRows } = ownIds.length
    ? await supabase
        .from("vw_area_own_latest")
        .select("indicator_id,percent,traffic_light,report_date,current_value")
        .in("indicator_id", ownIds)
    : { data: [] as OwnLatest[] };
  const ownLatestById = new Map<string, OwnLatest>();
  (ownLatestRows ?? []).forEach((r) => ownLatestById.set((r as OwnLatest).indicator_id, r as OwnLatest));

  const totalAreas = (areas ?? []).length;
  const totalMacros = (macros ?? []).length;
  const totalContrib = contribRows.length;
  const withUpdates = contribRows.filter((r) => latestById.has(r.id)).length;
  const completed = contribRows.filter((r) => latestById.get(r.id)?.traffic_light === "verde").length;
  const atRisk = contribRows.filter((r) => {
    const t = latestById.get(r.id)?.traffic_light;
    return t === "naranja" || t === "rojo";
  }).length;

  const uniqueAreasWithContrib = new Set(contribRows.map((r) => r.area_id));
  const coverage = totalAreas ? Math.round((uniqueAreasWithContrib.size / totalAreas) * 100) : 0;

  // KPIs indicadores propios del área (panorama admin)
  const ownTotal = ownRows.length;
  const ownWithUpdates = ownRows.filter((r) => ownLatestById.has(r.id)).length;
  const ownCompleted = ownRows.filter((r) => ownLatestById.get(r.id)?.traffic_light === "verde").length;
  const ownAtRisk = ownRows.filter((r) => {
    const t = ownLatestById.get(r.id)?.traffic_light;
    return t === "naranja" || t === "rojo";
  }).length;
  const ownWithoutUpdates = Math.max(0, ownTotal - ownWithUpdates);

  // Rollup por macro (sin depender de una vista DB)
  const macrosRows = (macros ?? []) as Array<{
    id: string;
    year: number;
    reto: string;
    indicador: string;
    meta_1_value: number | null;
    meta_1_desc: string | null;
    meta_2_value: number | null;
    meta_2_desc: string | null;
  }>;

  const contribByMacro = new Map<string, typeof contribRows>();
  for (const c of contribRows) {
    const arr = contribByMacro.get(c.macro_id) ?? [];
    arr.push(c);
    contribByMacro.set(c.macro_id, arr);
  }

  const macroCards = macrosRows
    .map((m) => {
      const rows = contribByMacro.get(m.id) ?? [];
      const contributions_count = rows.length;
      const contributing_areas_count = new Set(rows.map((r) => r.area_id)).size;
      const missing_areas_count = Math.max(0, totalAreas - contributing_areas_count);

      const withUpdatesCount = rows.filter((r) => latestById.has(r.id)).length;
      const completedCount = rows.filter((r) => latestById.get(r.id)?.traffic_light === "verde").length;
      const riskCount = rows.filter((r) => {
        const t = latestById.get(r.id)?.traffic_light;
        return t === "naranja" || t === "rojo";
      }).length;

      const percents = rows
        .map((r) => latestById.get(r.id)?.percent)
        .filter((p): p is number => typeof p === "number");
      const avgPct = percents.length ? percents.reduce((a, b) => a + b, 0) / percents.length : null;

      const macro_percent_strict =
        contributions_count === 0
          ? null
          : completedCount === contributions_count
            ? 100
            : typeof avgPct === "number"
              ? Math.min(99.99, Math.max(0, Math.round(avgPct * 100) / 100))
              : 0;

      const hasAnyUpdate = withUpdatesCount > 0;
      const hasRojo = rows.some((r) => latestById.get(r.id)?.traffic_light === "rojo");
      const hasNaranja = rows.some((r) => latestById.get(r.id)?.traffic_light === "naranja");
      const macro_traffic_light: TrafficLight | null = !hasAnyUpdate
        ? null
        : hasRojo
          ? "rojo"
          : hasNaranja
            ? "naranja"
            : completedCount === contributions_count && contributions_count > 0
              ? "verde"
              : "naranja";

      return {
        ...m,
        contributions_count,
        contributing_areas_count,
        missing_areas_count,
        contributions_with_updates: withUpdatesCount,
        contributions_completed_count: completedCount,
        contributions_risk_count: riskCount,
        macro_percent_strict,
        macro_traffic_light,
      };
    })
    .sort((a, b) => {
      if (b.contributions_risk_count !== a.contributions_risk_count) {
        return b.contributions_risk_count - a.contributions_risk_count;
      }
      if (b.contributing_areas_count !== a.contributing_areas_count) {
        return b.contributing_areas_count - a.contributing_areas_count;
      }
      const ap = typeof a.macro_percent_strict === "number" ? a.macro_percent_strict : -1;
      const bp = typeof b.macro_percent_strict === "number" ? b.macro_percent_strict : -1;
      return bp - ap;
    });

  const macroCardsWithDetails = macroCards.map((m) => {
    const rows = contribByMacro.get(m.id) ?? [];
    const contributionsDetail = rows.map((c) => {
      const area = Array.isArray(c.areas) ? c.areas[0] : c.areas;
      const latest = latestById.get(c.id) ?? null;
      return {
        id: c.id,
        areaName: area?.name ?? "—",
        areaType: area?.type ?? "",
        reto_area: c.reto_area ?? "",
        indicador_area: c.indicador_area ?? "",
        meta_area: c.meta_area ?? null,
        meta_desc: c.meta_desc ?? null,
        latest: latest
          ? {
              traffic_light: latest.traffic_light,
              percent: latest.percent,
              current_value: latest.current_value,
              period_end: latest.period_end,
            }
          : null,
      };
    });
    return { ...m, contributionsDetail };
  });

  const alerts = contribRows
    .map((c) => {
      const latest = latestById.get(c.id) ?? null;
      if (!latest?.traffic_light) return null;
      if (latest.traffic_light !== "rojo" && latest.traffic_light !== "naranja") return null;
      const area = Array.isArray(c.areas) ? c.areas[0] : c.areas;
      const macro = Array.isArray(c.macro_challenges) ? c.macro_challenges[0] : c.macro_challenges;
      return {
        id: c.id,
        areaName: area?.name ?? "—",
        areaType: area?.type ?? "",
        macroReto: macro?.reto ?? "",
        indicador: c.indicador_area,
        reto: c.reto_area,
        meta: c.meta_area,
        latest,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    areaName: string;
    areaType: string;
    macroReto: string;
    indicador: string;
    reto: string;
    meta: number | null;
    latest: Latest;
  }>;

  alerts.sort((a, b) => {
    const rank = (t: TrafficLight) => (t === "rojo" ? 0 : 1);
    const ra = rank(a.latest.traffic_light as TrafficLight);
    const rb = rank(b.latest.traffic_light as TrafficLight);
    if (ra !== rb) return ra - rb;
    const da = a.latest.period_end ?? "";
    const db = b.latest.period_end ?? "";
    return db.localeCompare(da);
  });

  const ownAlerts = ownRows
    .map((r) => {
      const latest = ownLatestById.get(r.id) ?? null;
      if (!latest?.traffic_light) return null;
      if (latest.traffic_light !== "rojo" && latest.traffic_light !== "naranja") return null;
      const area = r.areas ? (Array.isArray(r.areas) ? r.areas[0] : r.areas) : null;
      return {
        id: r.id,
        areaName: area?.name ?? "—",
        areaType: area?.type ?? "",
        indicador: r.indicador_area,
        reto: r.reto_area,
        meta: typeof r.meta_value === "number" ? r.meta_value : null,
        latest,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    areaName: string;
    areaType: string;
    indicador: string;
    reto: string;
    meta: number | null;
    latest: OwnLatest;
  }>;

  ownAlerts.sort((a, b) => {
    const rank = (t: TrafficLight) => (t === "rojo" ? 0 : 1);
    const ra = rank(a.latest.traffic_light as TrafficLight);
    const rb = rank(b.latest.traffic_light as TrafficLight);
    if (ra !== rb) return ra - rb;
    const da = a.latest.report_date ?? "";
    const db = b.latest.report_date ?? "";
    return db.localeCompare(da);
  });

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent" />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2 lg:max-w-[780px]">
                <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                  <span className="font-medium text-foreground">Dashboard Admin</span>
                  <span>·</span>
                  <span>Año {selectedYear}</span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Panorama ejecutivo</h1>
                <p className="text-sm text-muted-foreground">
                  Lectura rápida: cobertura, riesgo, evidencias y avance consolidado por macro.
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <form className="flex items-end gap-2" action="/app">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Año</div>
                    <Input
                      name="year"
                      type="number"
                      defaultValue={String(selectedYear)}
                      className="h-9 w-[120px]"
                    />
                  </div>
                  <Button type="submit" size="sm" className="h-9">
                    Ver
                  </Button>
                </form>
                <Button asChild size="sm" variant="outline" className="h-9">
                  <Link href="/app/admin/aportes">Gestionar retos del área</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-9">
                  <Link href="/app/admin">Ir a Gestión</Link>
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <TinyStat label="Cobertura" value={`${coverage}%`} />
              <TinyStat label="Áreas con aportes" value={String(uniqueAreasWithContrib.size)} />
              <TinyStat label="Áreas activas" value={String(totalAreas)} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Áreas activas"
          value={String(totalAreas)}
          hint="Direcciones / Escuelas / Otro"
          icon={<Building2 className="h-4 w-4" />}
          tone="info"
        />
        <MetricCard
          title="Retos Macro VAC"
          value={String(totalMacros)}
          hint={`Registrados en ${selectedYear}`}
          icon={<BarChart3 className="h-4 w-4" />}
          tone="info"
        />
        <MetricCard
          title="Indicadores activos"
          value={String(totalContrib)}
          hint="Retos del área activos"
          icon={<TrendingUp className="h-4 w-4" />}
          tone="info"
        />
        <MetricCard
          title="Con avance"
          value={String(withUpdates)}
          hint="Con al menos 1 registro"
          icon={<FileText className="h-4 w-4" />}
          tone="info"
        />
        <MetricCard
          title="En riesgo"
          value={String(atRisk)}
          hint="Naranja / rojo"
          icon={<Flame className="h-4 w-4" />}
          tone="warn"
        />
        <MetricCard
          title="Completos"
          value={String(completed)}
          hint="Semáforo verde"
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="ok"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              <span>Retos Macro VAC</span>
              <Button asChild size="sm" variant="outline">
                <Link href="/app/macros">Ver consolidado</Link>
              </Button>
            </CardTitle>
            <CardDescription>
              Aportes por Direcciones/Escuelas y avance. \(100\%\) solo cuando todas las contribuciones están completas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!macroCards.length ? (
              <div className="text-sm text-muted-foreground">Aún no hay Retos Macro VAC para este año.</div>
            ) : (
              <MacroCardsWithDialog macroCardsWithDetails={macroCardsWithDetails} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alertas
            </CardTitle>
            <CardDescription>Indicadores del área con último estado en naranja/rojo.</CardDescription>
          </CardHeader>
          <CardContent>
            {!alerts.length ? (
              <div className="text-sm text-muted-foreground">Sin alertas para {selectedYear}.</div>
            ) : (
              <div className="grid gap-3">
                {alerts.slice(0, 8).map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-xl border border-input bg-background p-4 ${
                      a.latest.traffic_light === "rojo" ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-amber-500"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold" title={a.areaName}>
                          {a.areaName}{" "}
                          {a.areaType ? <span className="text-xs text-muted-foreground">· {a.areaType}</span> : null}
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground" title={a.indicador}>
                          {a.indicador}
                        </div>
                        <div className="mt-1 line-clamp-1 text-xs text-muted-foreground" title={a.reto}>
                          {a.reto}
                        </div>
                      </div>
                      <Badge variant={trafficVariant(a.latest.traffic_light as TrafficLight)}>
                        {trafficLabel(a.latest.traffic_light as TrafficLight)}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {typeof a.latest.current_value === "number" && typeof a.meta === "number"
                        ? `${a.latest.current_value}/${a.meta} (${a.latest.percent ?? "—"}%)`
                        : typeof a.latest.percent === "number"
                          ? `${a.latest.percent}%`
                          : "—"}
                      {a.latest.period_end ? ` · reporte ${a.latest.period_end}` : ""}
                    </div>
                    <div className="mt-3">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/app/aportes/${a.id}`}>Abrir</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Indicadores propios del área
            </span>
            <Badge variant="secondary">{ownTotal}</Badge>
          </CardTitle>
          <CardDescription>
            Seguimiento global de indicadores no asociados a Retos Macro VAC (creados y reportados por las áreas).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline" className="h-9">
              <Link href={`/app/admin/propios?year=${selectedYear}`}>Ver consolidado</Link>
            </Button>
          </div>
          {!ownTotal ? (
            <div className="text-sm text-muted-foreground">Aún no hay indicadores propios activos para {selectedYear}.</div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                  <TinyStat label="Activos" value={String(ownTotal)} />
                  <TinyStat label="Con avance" value={String(ownWithUpdates)} />
                  <TinyStat label="Sin reporte" value={String(ownWithoutUpdates)} />
                  <TinyStat label="En riesgo" value={String(ownAtRisk)} />
                  <TinyStat label="Completos" value={String(ownCompleted)} />
                  <TinyStat
                    label="Cumplimiento"
                    value={ownTotal ? `${Math.round((ownCompleted / ownTotal) * 100)}%` : "—"}
                  />
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold">Alertas (propios)</div>
                  <Badge variant={ownAtRisk ? "secondary" : "outline"}>{ownAtRisk}</Badge>
                </div>
                <div className="mt-3">
                  {!ownAlerts.length ? (
                    <div className="text-sm text-muted-foreground">Sin alertas de indicadores propios para {selectedYear}.</div>
                  ) : (
                    <div className="grid gap-3">
                      {ownAlerts.slice(0, 6).map((a) => (
                        <div
                          key={a.id}
                          className={`rounded-xl border border-input bg-background p-4 ${
                            a.latest.traffic_light === "rojo"
                              ? "border-l-4 border-l-rose-500"
                              : "border-l-4 border-l-amber-500"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold" title={a.areaName}>
                                {a.areaName}{" "}
                                {a.areaType ? (
                                  <span className="text-xs text-muted-foreground">· {a.areaType}</span>
                                ) : null}
                              </div>
                              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground" title={a.indicador}>
                                {a.indicador}
                              </div>
                              <div className="mt-1 line-clamp-1 text-xs text-muted-foreground" title={a.reto}>
                                {a.reto}
                              </div>
                            </div>
                            <Badge variant={trafficVariant(a.latest.traffic_light as TrafficLight)}>
                              {trafficLabel(a.latest.traffic_light as TrafficLight)}
                            </Badge>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {typeof a.latest.current_value === "number" && typeof a.meta === "number"
                              ? `${a.latest.current_value}/${a.meta} (${a.latest.percent ?? "—"}%)`
                              : typeof a.latest.percent === "number"
                                ? `${a.latest.percent}%`
                                : "—"}
                            {a.latest.report_date ? ` · reporte ${a.latest.report_date}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Evidencias recientes
            </span>
            <Badge variant="secondary">{(evidenceRows ?? []).length}</Badge>
          </CardTitle>
          <CardDescription>Últimos registros con evidencia adjunta.</CardDescription>
        </CardHeader>
        <CardContent>
          {!evidenceRows?.length ? (
            <div className="text-sm text-muted-foreground">Aún no hay evidencias registradas.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(evidenceRows as any[]).map((e) => {
                const c = Array.isArray(e.area_contributions) ? e.area_contributions[0] : e.area_contributions;
                const area = c?.areas ? (Array.isArray(c.areas) ? c.areas[0] : c.areas) : null;
                const macro = c?.macro_challenges
                  ? Array.isArray(c.macro_challenges)
                    ? c.macro_challenges[0]
                    : c.macro_challenges
                  : null;

                return (
                  <div key={e.id} className="rounded-xl border border-input bg-background p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold" title={area?.name ?? ""}>
                          {area?.name ?? "—"}{" "}
                          {area?.type ? <span className="text-xs text-muted-foreground">· {area.type}</span> : null}
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground" title={c?.indicador_area ?? ""}>
                          {c?.indicador_area ?? "—"}
                        </div>
                        {macro?.reto ? (
                          <div className="mt-1 line-clamp-1 text-xs text-muted-foreground" title={macro.reto}>
                            Macro: {macro.reto}
                          </div>
                        ) : null}
                      </div>
                      {e.traffic_light ? (
                        <Badge variant={trafficVariant(e.traffic_light as TrafficLight)}>
                          {trafficLabel(e.traffic_light as TrafficLight)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">—</Badge>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {e.created_at ? `Registrado: ${String(e.created_at).slice(0, 10)}` : ""}
                    </div>
                    <div className="mt-3">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/app/aportes/${e.contribution_id}`}>Ver detalle</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

