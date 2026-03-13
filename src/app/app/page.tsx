import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Flame,
  Layers,
  Target,
  TrendingUp,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/app/app/admin/_components/admin-dashboard";

type TrafficLight = "verde" | "naranja" | "rojo";

type Latest = {
  contribution_id: string;
  percent: number | null;
  traffic_light: TrafficLight | null;
  period_end: string | null;
  current_value?: number | null;
};

type OwnLatest = {
  indicator_id: string;
  percent: number | null;
  traffic_light: TrafficLight | null;
  report_date: string | null;
  current_value: number | null;
};

type JoinedMacro = { reto: string } | { reto: string }[] | null;
type JoinedArea =
  | { name: string; type: string }
  | { name: string; type: string }[]
  | null;

type ContributionRow = {
  id: string;
  year: number;
  indicador_area: string;
  reto_area: string;
  meta_area: number | null;
  areas: JoinedArea;
  macro_challenges: JoinedMacro;
};

type OwnRow = {
  id: string;
  year: number;
  ordinal: number;
  reto_area: string;
  indicador_area: string;
  meta_value: number | null;
  area_id: string;
  areas: JoinedArea;
};

function statusBg(t: TrafficLight) {
  return t === "rojo"
    ? "bg-red-500"
    : t === "naranja"
      ? "bg-amber-500"
      : "bg-green-500";
}

function statusBgLight(t: TrafficLight) {
  return t === "rojo"
    ? "bg-red-50 dark:bg-red-950/30"
    : t === "naranja"
      ? "bg-amber-50 dark:bg-amber-950/30"
      : "bg-green-50 dark:bg-green-950/30";
}

function statusColor(t: TrafficLight) {
  return t === "rojo"
    ? "text-red-600"
    : t === "naranja"
      ? "text-amber-600"
      : "text-green-600";
}

function statusLabel(t: TrafficLight) {
  return t === "rojo"
    ? "Requiere atención"
    : t === "naranja"
      ? "En desarrollo"
      : "Cumplido";
}

function statusBorder(t: TrafficLight) {
  return t === "rojo"
    ? "border-l-red-500"
    : t === "naranja"
      ? "border-l-amber-500"
      : "border-l-green-500";
}

export default async function AppDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role,full_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  if (profile?.role === "admin") {
    return <AdminDashboard />;
  }

  /* ── Fetch contributions (retos del área) ── */
  const { data: contributions } = await supabase
    .from("area_contributions")
    .select(
      "id,year,indicador_area,reto_area,meta_area,areas(name,type),macro_challenges(reto)"
    )
    .eq("active", true)
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  const contribRows = (contributions ?? []) as ContributionRow[];
  const contribIds = contribRows.map((c) => c.id);

  const { data: latestRows } = contribIds.length
    ? await supabase
        .from("vw_contribution_latest")
        .select(
          "contribution_id,percent,traffic_light,period_end,current_value"
        )
        .in("contribution_id", contribIds)
    : { data: [] as Latest[] };

  const latestById = new Map<string, Latest>();
  (latestRows ?? []).forEach((r) =>
    latestById.set((r as Latest).contribution_id, r as Latest)
  );

  /* ── Fetch own indicators ── */
  const { data: ownIndicators } = await supabase
    .from("area_own_indicators")
    .select(
      "id,year,ordinal,reto_area,indicador_area,meta_value,area_id,areas(name,type)"
    )
    .eq("active", true)
    .order("year", { ascending: false })
    .order("ordinal", { ascending: true });

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

  /* ── Aggregate stats ── */
  const totalContrib = contribRows.length;
  const contribCompleted = contribRows.filter(
    (r) => latestById.get(r.id)?.traffic_light === "verde"
  ).length;
  const contribAtRisk = contribRows.filter((r) => {
    const t = latestById.get(r.id)?.traffic_light;
    return t === "naranja" || t === "rojo";
  }).length;
  const contribNoUpdate = contribRows.filter(
    (r) => !latestById.has(r.id)
  ).length;

  const totalOwn = ownRows.length;
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

  const grandTotal = totalContrib + totalOwn;
  const grandCompleted = contribCompleted + ownCompleted;
  const grandRisk = contribAtRisk + ownAtRisk;
  const grandNoUpdate = contribNoUpdate + ownNoUpdate;
  const overallPct =
    grandTotal > 0 ? Math.round((grandCompleted / grandTotal) * 100) : 0;

  /* ── Macro summary ── */
  const macroSummary = new Map<
    string,
    { macro: string; total: number; completed: number; risk: number; noUpdates: number }
  >();
  contribRows.forEach((c) => {
    const macro = Array.isArray(c.macro_challenges)
      ? c.macro_challenges[0]
      : c.macro_challenges;
    const macroName = macro?.reto ?? "Sin macro";
    const latest = latestById.get(c.id) ?? null;
    const prev = macroSummary.get(macroName) ?? {
      macro: macroName,
      total: 0,
      completed: 0,
      risk: 0,
      noUpdates: 0,
    };
    prev.total += 1;
    if (!latest?.traffic_light) prev.noUpdates += 1;
    if (latest?.traffic_light === "verde") prev.completed += 1;
    if (latest?.traffic_light === "naranja" || latest?.traffic_light === "rojo")
      prev.risk += 1;
    macroSummary.set(macroName, prev);
  });

  const macroCards = Array.from(macroSummary.values())
    .map((m) => ({
      ...m,
      pct: m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0,
    }))
    .sort((a, b) => b.risk - a.risk || b.total - a.total);

  const firstName = profile?.full_name
    ? profile.full_name.split(" ")[0]
    : null;

  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? null;
  const buildTimeLabel =
    buildTime && !Number.isNaN(new Date(buildTime).getTime())
      ? new Date(buildTime).toLocaleString("es-CO", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <div className="space-y-8 pb-8">
      {/* ── Hero ── */}
      <div className="rounded-xl border bg-card p-5 md:p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            {firstName ? `Hola, ${firstName}` : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tienes{" "}
            <span className="font-semibold text-foreground">
              {grandTotal}
            </span>{" "}
            indicadores en total.{" "}
            {grandNoUpdate > 0 ? (
              <>
                <span className="font-semibold text-amber-600">
                  {grandNoUpdate}
                </span>{" "}
                sin reporte.
              </>
            ) : (
              <span className="text-green-600 font-medium">
                Todo al día.
              </span>
            )}
          </p>
          {buildTimeLabel ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Plataforma actualizada:{" "}
              <span className="font-medium text-foreground">
                {buildTimeLabel}
              </span>
            </p>
          ) : null}
        </div>

        {/* Barra de progreso */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Cumplimiento general
            </span>
            <span className="text-sm font-bold tabular-nums">
              {overallPct}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-700"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {grandCompleted} completos
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {grandRisk} en riesgo
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              {grandNoUpdate} sin reporte
            </span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiMini
            label="Total"
            value={grandTotal}
            icon={<TrendingUp className="h-4 w-4" />}
            color="primary"
          />
          <KpiMini
            label="Sin reporte"
            value={grandNoUpdate}
            icon={<AlertCircle className="h-4 w-4" />}
            color={grandNoUpdate > 0 ? "amber" : "muted"}
          />
          <KpiMini
            label="En riesgo"
            value={grandRisk}
            icon={<Flame className="h-4 w-4" />}
            color={grandRisk > 0 ? "red" : "muted"}
          />
          <KpiMini
            label="Completos"
            value={grandCompleted}
            icon={<CheckCircle2 className="h-4 w-4" />}
            color={grandCompleted > 0 ? "green" : "muted"}
          />
        </div>
      </div>

      {/* ── Retos del Área (Seguimiento) ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Retos del área
            </h2>
            <Badge variant="secondary">{totalContrib}</Badge>
          </div>
        </div>

        {!contribRows.length ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aún no tienes retos asignados.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {contribRows.map((c) => {
              const area = Array.isArray(c.areas) ? c.areas[0] : c.areas;
              const macro = Array.isArray(c.macro_challenges)
                ? c.macro_challenges[0]
                : c.macro_challenges;
              const latest = latestById.get(c.id);
              const traffic = latest?.traffic_light ?? null;
              const pct =
                typeof latest?.percent === "number" ? latest.percent : 0;
              const currentVal =
                typeof latest?.current_value === "number"
                  ? latest.current_value
                  : null;
              const metaVal =
                typeof c.meta_area === "number" ? c.meta_area : null;

              return (
                <Link
                  key={c.id}
                  href={`/app/aportes/${c.id}`}
                  className="block group"
                >
                  <Card
                    className={`transition-all hover:shadow-md border-l-4 overflow-hidden ${traffic ? statusBorder(traffic) : "border-l-border"}`}
                  >
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0"
                        >
                          {c.year}
                        </Badge>
                        {traffic ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBgLight(traffic)} ${statusColor(traffic)}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusBg(traffic)}`}
                            />
                            {statusLabel(traffic)}
                          </span>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/30"
                          >
                            Sin avances
                          </Badge>
                        )}
                        <span className="ml-auto text-lg font-bold tabular-nums shrink-0">
                          {pct}%
                        </span>
                      </div>

                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors leading-tight line-clamp-1">
                        {c.indicador_area}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {c.reto_area}
                      </p>

                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${traffic ? statusBg(traffic) : "bg-muted-foreground/20"}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground truncate">
                          {area?.name ?? ""}{" "}
                          {area?.type ? `(${area.type})` : ""}
                          {metaVal !== null && currentVal !== null
                            ? ` · ${currentVal}/${metaVal}`
                            : metaVal !== null
                              ? ` · Meta: ${metaVal}`
                              : ""}
                          {latest?.period_end
                            ? ` · ${latest.period_end}`
                            : ""}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          Ver detalle
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Indicadores Propios ── */}
      {totalOwn > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">
                Indicadores propios
              </h2>
              <Badge variant="secondary">{totalOwn}</Badge>
            </div>
            <Link
              href="/app/propios"
              className="text-xs font-medium text-primary hover:underline"
            >
              Crear nuevo
            </Link>
          </div>

          <div className="grid gap-3">
            {ownRows.map((r) => {
              const latest = ownLatestById.get(r.id) ?? null;
              const traffic = latest?.traffic_light ?? null;
              const pct =
                typeof latest?.percent === "number" ? latest.percent : 0;
              const currentVal =
                typeof latest?.current_value === "number"
                  ? latest.current_value
                  : null;
              const metaVal =
                typeof r.meta_value === "number" ? r.meta_value : null;

              return (
                <Link
                  key={r.id}
                  href={`/app/propios/${r.id}`}
                  className="block group"
                >
                  <Card
                    className={`transition-all hover:shadow-md border-l-4 overflow-hidden ${traffic ? statusBorder(traffic) : "border-l-border"}`}
                  >
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0"
                        >
                          {r.year}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0"
                        >
                          #{r.ordinal}
                        </Badge>
                        {traffic ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBgLight(traffic)} ${statusColor(traffic)}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusBg(traffic)}`}
                            />
                            {statusLabel(traffic)}
                          </span>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/30"
                          >
                            Sin avances
                          </Badge>
                        )}
                        <span className="ml-auto text-lg font-bold tabular-nums shrink-0">
                          {pct}%
                        </span>
                      </div>

                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors leading-tight line-clamp-1">
                        {r.indicador_area}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {r.reto_area}
                      </p>

                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${traffic ? statusBg(traffic) : "bg-muted-foreground/20"}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground truncate">
                          {metaVal !== null && currentVal !== null
                            ? `${currentVal}/${metaVal}`
                            : metaVal !== null
                              ? `Meta: ${metaVal}`
                              : ""}
                          {latest?.report_date
                            ? ` · ${latest.report_date}`
                            : " · Sin reportes"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          Ver detalle
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ── Resumen por Reto Macro ── */}
      {macroCards.length > 0 ? (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">
              Por Reto Macro VAC
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {macroCards.map((m) => {
              const allComplete = m.completed === m.total && m.total > 0;
              const hasRisk = m.risk > 0;

              return (
                <Card
                  key={m.macro}
                  className={`border-l-4 ${allComplete ? "border-l-green-500" : hasRisk ? "border-l-amber-500" : "border-l-border"}`}
                >
                  <CardContent className="pt-4 pb-3">
                    <h3
                      className="text-sm font-semibold leading-tight line-clamp-2 mb-3"
                      title={m.macro}
                    >
                      {m.macro}
                    </h3>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">
                        Cumplimiento
                      </span>
                      <span className="text-sm font-bold tabular-nums">
                        {m.pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full ${allComplete ? "bg-green-500" : hasRisk ? "bg-amber-500" : "bg-primary"}`}
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        <span className="font-medium text-foreground">
                          {m.total}
                        </span>{" "}
                        indicadores
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        {m.completed} completos
                      </span>
                      {m.risk > 0 ? (
                        <span className="flex items-center gap-1 text-amber-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {m.risk} en riesgo
                        </span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function KpiMini({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "primary" | "red" | "amber" | "green" | "muted";
}) {
  const iconBg =
    color === "red"
      ? "bg-red-500/10 text-red-600"
      : color === "amber"
        ? "bg-amber-500/10 text-amber-600"
        : color === "green"
          ? "bg-green-500/10 text-green-600"
          : color === "primary"
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground";

  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <span
        className={`mx-auto mb-1.5 grid h-7 w-7 place-items-center rounded-md ${iconBg}`}
      >
        {icon}
      </span>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-[10px] font-medium text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
