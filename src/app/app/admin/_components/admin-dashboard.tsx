import Link from "next/link";

import {
  BarChart3,
  Building2,
  CheckCircle2,
  Flame,
  Target,
  TrendingUp,
} from "lucide-react";

import { MacroCardsWithDialog } from "@/app/app/admin/_components/macro-cards-with-dialog";
import { IndicatorsSection } from "@/app/app/admin/_components/indicators-section";
import type { AllIndicatorItem } from "@/app/app/admin/_components/all-indicators";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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


export async function AdminDashboard({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const yearParam = typeof sp.year === "string" ? sp.year.trim() : null;
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  const selectedYear = Number.isFinite(year)
    ? Math.trunc(year)
    : new Date().getFullYear();

  const supabase = await createSupabaseServerClient();

  const [
    { data: areas },
    { data: macros },
    { data: contributions },
    { data: ownIndicators },
  ] = await Promise.all([
    supabase.from("areas").select("id,name,type,active").eq("active", true),
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
      .select(
        "id,year,area_id,reto_area,indicador_area,meta_value,active,areas(name,type)"
      )
      .eq("active", true)
      .eq("year", selectedYear)
      .order("created_at", { ascending: false }),
  ]);

  type ContribRow = {
    id: string;
    year: number;
    macro_id: string;
    area_id: string;
    indicador_area: string;
    reto_area: string;
    meta_area: number | null;
    meta_desc: string | null;
    active: boolean;
    areas:
      | { name: string; type: string }
      | { name: string; type: string }[]
      | null;
    macro_challenges: { reto: string } | { reto: string }[] | null;
  };

  const contribRows = (contributions ?? []) as ContribRow[];
  const ids = contribRows.map((c) => c.id);

  const { data: latestRows } = ids.length
    ? await supabase
        .from("vw_contribution_latest")
        .select(
          "contribution_id,percent,traffic_light,period_end,current_value"
        )
        .in("contribution_id", ids)
    : { data: [] as Latest[] };

  const latestById = new Map<string, Latest>();
  (latestRows ?? []).forEach((r) =>
    latestById.set((r as Latest).contribution_id, r as Latest)
  );

  type OwnRow = {
    id: string;
    year: number;
    area_id: string;
    reto_area: string;
    indicador_area: string;
    meta_value: number | null;
    active: boolean;
    areas:
      | { name: string; type: string }
      | { name: string; type: string }[]
      | null;
  };

  const ownRows = (ownIndicators ?? []) as OwnRow[];
  const ownIds = ownRows.map((r) => r.id);
  const { data: ownLatestRows } = ownIds.length
    ? await supabase
        .from("vw_area_own_latest")
        .select(
          "indicator_id,percent,traffic_light,report_date,current_value"
        )
        .in("indicator_id", ownIds)
    : { data: [] as OwnLatest[] };
  const ownLatestById = new Map<string, OwnLatest>();
  (ownLatestRows ?? []).forEach((r) =>
    ownLatestById.set((r as OwnLatest).indicator_id, r as OwnLatest)
  );

  /* ── Latest comments ── */
  type ContribComment = { contribution_id: string; comment: string | null; created_at: string };
  type OwnComment = { indicator_id: string; comment: string | null; created_at: string };

  const { data: contribCommentRows } = ids.length
    ? await supabase
        .from("progress_updates")
        .select("contribution_id,comment,created_at")
        .in("contribution_id", ids)
        .order("created_at", { ascending: false })
    : { data: [] as ContribComment[] };

  const contribCommentById = new Map<string, string | null>();
  (contribCommentRows ?? []).forEach((r) => {
    const row = r as ContribComment;
    if (!contribCommentById.has(row.contribution_id))
      contribCommentById.set(row.contribution_id, row.comment);
  });

  const { data: ownCommentRows } = ownIds.length
    ? await supabase
        .from("area_own_updates")
        .select("indicator_id,comment,created_at")
        .in("indicator_id", ownIds)
        .order("created_at", { ascending: false })
    : { data: [] as OwnComment[] };

  const ownCommentById = new Map<string, string | null>();
  (ownCommentRows ?? []).forEach((r) => {
    const row = r as OwnComment;
    if (!ownCommentById.has(row.indicator_id))
      ownCommentById.set(row.indicator_id, row.comment);
  });

  /* ── KPI calculations ── */
  const totalAreas = (areas ?? []).length;
  const totalMacros = (macros ?? []).length;
  const totalContrib = contribRows.length;
  const completed = contribRows.filter(
    (r) => latestById.get(r.id)?.traffic_light === "verde"
  ).length;
  const atRisk = contribRows.filter((r) => {
    const t = latestById.get(r.id)?.traffic_light;
    return t === "naranja" || t === "rojo";
  }).length;

  const uniqueAreasWithContrib = new Set(
    contribRows.map((r) => r.area_id)
  );
  const overallPct =
    totalContrib > 0
      ? Math.round((completed / totalContrib) * 100)
      : 0;

  const ownTotal = ownRows.length;
  const ownCompleted = ownRows.filter(
    (r) => ownLatestById.get(r.id)?.traffic_light === "verde"
  ).length;
  const ownAtRisk = ownRows.filter((r) => {
    const t = ownLatestById.get(r.id)?.traffic_light;
    return t === "naranja" || t === "rojo";
  }).length;
  const ownNoUpdate = ownRows.filter(
    (r) => !ownLatestById.has(r.id)
  ).length;
  const ownPct =
    ownTotal > 0 ? Math.round((ownCompleted / ownTotal) * 100) : 0;

  /* ── Macro rollup ── */
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

  const contribByMacro = new Map<string, ContribRow[]>();
  for (const c of contribRows) {
    const arr = contribByMacro.get(c.macro_id) ?? [];
    arr.push(c);
    contribByMacro.set(c.macro_id, arr);
  }

  const macroCards = macrosRows
    .map((m) => {
      const rows = contribByMacro.get(m.id) ?? [];
      const contributions_count = rows.length;
      const contributing_areas_count = new Set(
        rows.map((r) => r.area_id)
      ).size;
      const missing_areas_count = Math.max(
        0,
        totalAreas - contributing_areas_count
      );

      const completedCount = rows.filter(
        (r) => latestById.get(r.id)?.traffic_light === "verde"
      ).length;
      const riskCount = rows.filter((r) => {
        const t = latestById.get(r.id)?.traffic_light;
        return t === "naranja" || t === "rojo";
      }).length;
      const withUpdatesCount = rows.filter((r) =>
        latestById.has(r.id)
      ).length;

      const percents = rows.map((r) => {
        const latest = latestById.get(r.id);
        return typeof latest?.percent === "number" ? latest.percent : 0;
      });
      const avgPct =
        percents.length > 0
          ? percents.reduce((a, b) => a + b, 0) / percents.length
          : null;

      const macro_percent_strict =
        contributions_count === 0
          ? null
          : typeof avgPct === "number"
            ? Math.max(0, Math.min(100, Math.round(avgPct * 100) / 100))
            : 0;

      const hasAnyUpdate = withUpdatesCount > 0;
      const hasRojo = rows.some(
        (r) => latestById.get(r.id)?.traffic_light === "rojo"
      );
      const hasNaranja = rows.some(
        (r) => latestById.get(r.id)?.traffic_light === "naranja"
      );
      const macro_traffic_light: TrafficLight | null = !hasAnyUpdate
        ? null
        : hasRojo
          ? "rojo"
          : hasNaranja
            ? "naranja"
            : completedCount === contributions_count &&
                contributions_count > 0
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
      if (b.contributions_risk_count !== a.contributions_risk_count)
        return b.contributions_risk_count - a.contributions_risk_count;
      const ap =
        typeof a.macro_percent_strict === "number"
          ? a.macro_percent_strict
          : -1;
      const bp =
        typeof b.macro_percent_strict === "number"
          ? b.macro_percent_strict
          : -1;
      return bp - ap;
    });


  /* ── Area breakdown ── */
  const areaList = (areas ?? []) as Array<{
    id: string;
    name: string;
    type: string;
  }>;

  const areaBreakdown = areaList
    .map((a) => {
      const aContribs = contribRows.filter((c) => c.area_id === a.id);
      const aOwn = ownRows.filter((c) => c.area_id === a.id);
      const aTotal = aContribs.length + aOwn.length;
      if (aTotal === 0) return null;

      const cComplete = aContribs.filter(
        (c) => latestById.get(c.id)?.traffic_light === "verde"
      ).length;
      const oComplete = aOwn.filter(
        (c) => ownLatestById.get(c.id)?.traffic_light === "verde"
      ).length;
      const cRisk = aContribs.filter((c) => {
        const t = latestById.get(c.id)?.traffic_light;
        return t === "naranja" || t === "rojo";
      }).length;
      const oRisk = aOwn.filter((c) => {
        const t = ownLatestById.get(c.id)?.traffic_light;
        return t === "naranja" || t === "rojo";
      }).length;
      const cNoUp = aContribs.filter((c) => !latestById.has(c.id)).length;
      const oNoUp = aOwn.filter((c) => !ownLatestById.has(c.id)).length;

      const indicators = [
        ...aContribs.map((c) => {
          const latest = latestById.get(c.id) ?? null;
          return {
            id: c.id,
            type: "contrib" as const,
            indicador: c.indicador_area,
            reto: c.reto_area,
            traffic_light: (latest?.traffic_light ?? null) as TrafficLight | null,
            percent: typeof latest?.percent === "number" ? latest.percent : null,
            current_value: typeof latest?.current_value === "number" ? latest.current_value : null,
            meta: typeof c.meta_area === "number" ? c.meta_area : null,
            date: latest?.period_end ?? null,
            comment: contribCommentById.get(c.id) ?? null,
            href: `/app/aportes/${c.id}`,
          };
        }),
        ...aOwn.map((r) => {
          const latest = ownLatestById.get(r.id) ?? null;
          return {
            id: r.id,
            type: "own" as const,
            indicador: r.indicador_area,
            reto: r.reto_area,
            traffic_light: (latest?.traffic_light ?? null) as TrafficLight | null,
            percent: typeof latest?.percent === "number" ? latest.percent : null,
            current_value: typeof latest?.current_value === "number" ? latest.current_value : null,
            meta: typeof r.meta_value === "number" ? r.meta_value : null,
            date: latest?.report_date ?? null,
            comment: ownCommentById.get(r.id) ?? null,
            href: `/app/admin/propios/${r.id}`,
          };
        }),
      ];

      // Promedio real de porcentajes (indicadores sin reporte cuentan como 0)
      const sumPct = indicators.reduce(
        (acc, ind) => acc + (ind.percent ?? 0),
        0
      );
      const pct = Math.round(sumPct / aTotal);

      return {
        ...a,
        total: aTotal,
        completed: cComplete + oComplete,
        risk: cRisk + oRisk,
        noUpdate: cNoUp + oNoUp,
        pct,
        indicators,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .sort((a, b) => a.pct - b.pct);

  /* ── All indicators flat list ── */
  const allIndicators: AllIndicatorItem[] = [
    ...contribRows.map((c) => {
      const latest = latestById.get(c.id) ?? null;
      const area = Array.isArray(c.areas) ? c.areas[0] : c.areas;
      return {
        id: c.id,
        type: "contrib" as const,
        indicador: c.indicador_area,
        reto: c.reto_area,
        areaName: area?.name ?? "—",
        areaType: area?.type ?? "",
        year: c.year,
        meta: typeof c.meta_area === "number" ? c.meta_area : null,
        metaDesc: c.meta_desc ?? null,
        traffic_light: (latest?.traffic_light ?? null) as TrafficLight | null,
        percent: typeof latest?.percent === "number" ? latest.percent : null,
        current_value: typeof latest?.current_value === "number" ? latest.current_value : null,
        href: `/app/aportes/${c.id}`,
      };
    }),
    ...ownRows.map((r) => {
      const latest = ownLatestById.get(r.id) ?? null;
      const area = Array.isArray(r.areas) ? r.areas[0] : r.areas;
      return {
        id: r.id,
        type: "own" as const,
        indicador: r.indicador_area,
        reto: r.reto_area,
        areaName: area?.name ?? "—",
        areaType: area?.type ?? "",
        year: r.year,
        meta: typeof r.meta_value === "number" ? r.meta_value : null,
        metaDesc: null,
        traffic_light: (latest?.traffic_light ?? null) as TrafficLight | null,
        percent: typeof latest?.percent === "number" ? latest.percent : null,
        current_value: typeof latest?.current_value === "number" ? latest.current_value : null,
        href: `/app/admin/propios/${r.id}`,
      };
    }),
  ].sort((a, b) => {
    const rank = (t: TrafficLight | null) =>
      t === "rojo" ? 0 : t === "naranja" ? 1 : t === "verde" ? 2 : 3;
    return rank(a.traffic_light) - rank(b.traffic_light);
  });

  return (
    <div className="space-y-6 pb-8">
      {/* ── Hero ── */}
      <div className="rounded-xl border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Panel Admin
              </span>
              <span>·</span>
              <span>Año {selectedYear}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Panorama ejecutivo
            </h1>

            {/* Dual progress bars */}
            <div className="grid gap-4 sm:grid-cols-2 mt-3 max-w-xl">
              <ProgressBlock
                label="Retos del área"
                completed={completed}
                total={totalContrib}
                pct={overallPct}
                colorClass="bg-emerald-500"
              />
              <ProgressBlock
                label="Indicadores propios"
                completed={ownCompleted}
                total={ownTotal}
                pct={ownPct}
                colorClass="bg-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <form className="flex items-end gap-2" action="/app">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Año
                </div>
                <Input
                  name="year"
                  type="number"
                  defaultValue={String(selectedYear)}
                  className="h-9 w-[100px]"
                />
              </div>
              <Button type="submit" size="sm" className="h-9">
                Ver
              </Button>
            </form>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-9"
            >
              <Link href="/app/admin/aportes">Gestionar retos</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Áreas activas"
          value={totalAreas}
          sub={`${uniqueAreasWithContrib.size} con aportes`}
          icon={<Building2 className="h-4 w-4" />}
          tone="info"
        />
        <KpiCard
          label="Retos Macro"
          value={totalMacros}
          sub={`${selectedYear}`}
          icon={<BarChart3 className="h-4 w-4" />}
          tone="info"
        />
        <KpiCard
          label="Indicadores"
          value={totalContrib + ownTotal}
          sub={`${totalContrib} retos + ${ownTotal} propios`}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="info"
        />
        <KpiCard
          label="En riesgo"
          value={atRisk + ownAtRisk}
          sub="Naranja / rojo"
          icon={<Flame className="h-4 w-4" />}
          tone="warn"
        />
        <KpiCard
          label="Completos"
          value={completed + ownCompleted}
          sub={`de ${totalContrib + ownTotal} total`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="ok"
        />
      </div>

      {/* ── Macro cards ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Retos Macro VAC
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href="/app/macros">Consolidado</Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!macroCards.length ? (
            <p className="text-sm text-muted-foreground py-4">
              Sin Retos Macro para {selectedYear}.
            </p>
          ) : (
            <MacroCardsWithDialog
              macroCardsWithDetails={macroCards}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Area breakdown + All indicators ── */}
      <IndicatorsSection areaBreakdown={areaBreakdown} allIndicators={allIndicators} />

    </div>
  );
}

/* ── Subcomponents ── */

function ProgressBlock({
  label,
  completed,
  total,
  pct,
  colorClass,
}: {
  label: string;
  completed: number;
  total: number;
  pct: number;
  colorClass: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-xs font-bold tabular-nums">
          {completed}/{total}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-right mt-0.5">
        <span className="text-xs font-semibold tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  tone: "ok" | "warn" | "info";
}) {
  const iconBg =
    tone === "ok"
      ? "bg-emerald-500/10 text-emerald-600"
      : tone === "warn"
        ? "bg-red-500/10 text-red-600"
        : "bg-primary/10 text-primary";
  const border =
    tone === "ok"
      ? "border-emerald-200/60 dark:border-emerald-500/20"
      : tone === "warn"
        ? "border-red-200/60 dark:border-red-500/20"
        : "";

  return (
    <Card className={border}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <span
            className={cn(
              "grid h-7 w-7 place-items-center rounded-md",
              iconBg
            )}
          >
            {icon}
          </span>
        </div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {sub}
        </div>
      </CardContent>
    </Card>
  );
}

