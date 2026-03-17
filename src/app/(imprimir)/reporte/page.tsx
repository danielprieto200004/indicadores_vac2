import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { AutoPrint } from "./_components/auto-print";
import { PrintControls } from "./_components/print-controls";

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
  areas: { name: string; type: string } | { name: string; type: string }[] | null;
  macro_challenges: { reto: string } | { reto: string }[] | null;
};

type MacroRow = {
  id: string;
  year: number;
  reto: string;
  indicador: string;
  indicator_kind: string;
  meta_1_value: number | null;
  meta_1_desc: string | null;
  meta_2_value: number | null;
  meta_2_desc: string | null;
  area_responsable_text: string;
};

type OwnRow = {
  id: string;
  year: number;
  area_id: string;
  reto_area: string;
  indicador_area: string;
  meta_value: number | null;
  active: boolean;
  areas: { name: string; type: string } | { name: string; type: string }[] | null;
};

/* ── Helpers ── */

function tlLabel(tl: TrafficLight | null) {
  if (tl === "verde") return "Completado";
  if (tl === "naranja") return "En riesgo";
  if (tl === "rojo") return "Crítico";
  return "Sin reporte";
}

function fmtPct(n: number | null) {
  if (n === null) return "—";
  return `${Math.round(n)}%`;
}

function typeLabel(type: string) {
  if (type === "direccion") return "Dirección";
  if (type === "escuela") return "Escuela";
  return "Otro";
}

/* ── Subcomponents ── */

function SectionTitle({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-700 text-white text-xs font-bold">
        {num}
      </div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

function KpiBox({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: number;
  accent?: "green" | "red" | "gray" | "blue" | "default";
}) {
  const bg =
    accent === "green"
      ? "bg-emerald-50 border-emerald-100"
      : accent === "red"
        ? "bg-red-50 border-red-100"
        : accent === "gray"
          ? "bg-gray-50 border-gray-100"
          : accent === "blue"
            ? "bg-blue-50 border-blue-100"
            : "bg-white border-gray-100";
  const textColor =
    accent === "green"
      ? "text-emerald-700"
      : accent === "red"
        ? "text-red-700"
        : accent === "blue"
          ? "text-blue-700"
          : "text-gray-900";

  return (
    <div className={cn("rounded-lg border p-4 text-center", bg)}>
      <div className={cn("text-3xl font-bold tabular-nums", textColor)}>{value}</div>
      <div className="text-xs text-gray-500 mt-1 leading-tight">{label}</div>
    </div>
  );
}

function TlBadge({ tl }: { tl: TrafficLight | null }) {
  const label = tlLabel(tl);
  const dot =
    tl === "verde"
      ? "bg-emerald-500"
      : tl === "naranja"
        ? "bg-amber-400"
        : tl === "rojo"
          ? "bg-red-500"
          : "border border-gray-300 bg-transparent";
  const badge =
    tl === "verde"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : tl === "naranja"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : tl === "rojo"
          ? "bg-red-50 text-red-800 border-red-200"
          : "bg-gray-100 text-gray-500 border-gray-200";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
        badge,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full shrink-0", dot)} />
      {label}
    </span>
  );
}

function MiniBar({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-gray-200 overflow-hidden shrink-0">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="tabular-nums text-xs font-semibold">{pct}%</span>
    </div>
  );
}

function ProgressRow({
  label,
  completed,
  total,
  pct,
  color,
}: {
  label: string;
  completed: number;
  total: number;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>
            <b className="text-gray-900">{completed}</b>/{total}
          </span>
          <span className="font-bold text-gray-900">{pct}%</span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SummaryBadge({
  label,
  count,
  pct,
  colorClass,
}: {
  label: string;
  count: number;
  pct: number;
  colorClass: string;
}) {
  return (
    <div className={cn("rounded-lg border p-3 text-center", colorClass)}>
      <div className="text-2xl font-bold tabular-nums">{count}</div>
      <div className="text-xs font-medium mt-0.5">{pct}%</div>
      <div className="text-[11px] mt-1 opacity-80">{label}</div>
    </div>
  );
}

function MetaCover({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-white/60 text-xs">{label}</div>
      <div className="text-white font-semibold text-sm mt-0.5">{value}</div>
    </div>
  );
}

/* ── Page ── */

export default async function ImprimirReportePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  /* Auth */
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/app");

  /* Year */
  const sp = (await searchParams) ?? {};
  const yearParam = typeof sp.year === "string" ? sp.year.trim() : null;
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  const selectedYear = Number.isFinite(year) ? Math.trunc(year) : new Date().getFullYear();

  /* Data */
  const [{ data: areas }, { data: macros }, { data: contributions }, { data: ownIndicators }] =
    await Promise.all([
      supabase.from("areas").select("id,name,type,active").eq("active", true),
      supabase
        .from("macro_challenges")
        .select(
          "id,year,reto,indicador,indicator_kind,meta_1_value,meta_1_desc,meta_2_value,meta_2_desc,area_responsable_text",
        )
        .eq("year", selectedYear)
        .order("created_at", { ascending: false }),
      supabase
        .from("area_contributions")
        .select(
          "id,year,macro_id,area_id,indicador_area,reto_area,meta_area,meta_desc,active,areas(name,type),macro_challenges(reto)",
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
    ]);

  const contribRows = (contributions ?? []) as ContribRow[];
  const macroRows = (macros ?? []) as MacroRow[];
  const ownRows = (ownIndicators ?? []) as OwnRow[];
  const areaList = (areas ?? []) as Array<{ id: string; name: string; type: string }>;

  const ids = contribRows.map((c) => c.id);
  const ownIds = ownRows.map((r) => r.id);

  const [{ data: latestRows }, { data: ownLatestRows }] = await Promise.all([
    ids.length
      ? supabase
          .from("vw_contribution_latest")
          .select("contribution_id,percent,traffic_light,period_end,current_value")
          .in("contribution_id", ids)
      : { data: [] as Latest[] },
    ownIds.length
      ? supabase
          .from("vw_area_own_latest")
          .select("indicator_id,percent,traffic_light,report_date,current_value")
          .in("indicator_id", ownIds)
      : { data: [] as OwnLatest[] },
  ]);

  const latestById = new Map<string, Latest>();
  (latestRows ?? []).forEach((r) => latestById.set((r as Latest).contribution_id, r as Latest));

  const ownLatestById = new Map<string, OwnLatest>();
  (ownLatestRows ?? []).forEach((r) =>
    ownLatestById.set((r as OwnLatest).indicator_id, r as OwnLatest),
  );

  /* KPIs */
  const totalAreas = areaList.length;
  const totalMacros = macroRows.length;
  const totalContrib = contribRows.length;
  const totalOwn = ownRows.length;
  const total = totalContrib + totalOwn;

  const contribCompleted = contribRows.filter(
    (r) => latestById.get(r.id)?.traffic_light === "verde",
  ).length;
  const ownCompleted = ownRows.filter(
    (r) => ownLatestById.get(r.id)?.traffic_light === "verde",
  ).length;
  const totalCompleted = contribCompleted + ownCompleted;

  const contribRisk = contribRows.filter((r) => {
    const t = latestById.get(r.id)?.traffic_light;
    return t === "naranja" || t === "rojo";
  }).length;
  const ownRisk = ownRows.filter((r) => {
    const t = ownLatestById.get(r.id)?.traffic_light;
    return t === "naranja" || t === "rojo";
  }).length;
  const totalRisk = contribRisk + ownRisk;

  const contribCritical = contribRows.filter(
    (r) => latestById.get(r.id)?.traffic_light === "rojo",
  ).length;
  const ownCritical = ownRows.filter(
    (r) => ownLatestById.get(r.id)?.traffic_light === "rojo",
  ).length;
  const totalCritical = contribCritical + ownCritical;

  const contribNoUpdate = contribRows.filter((r) => !latestById.has(r.id)).length;
  const ownNoUpdate = ownRows.filter((r) => !ownLatestById.has(r.id)).length;
  const totalNoUpdate = contribNoUpdate + ownNoUpdate;

  const completionPct = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;
  const contribPct =
    totalContrib > 0 ? Math.round((contribCompleted / totalContrib) * 100) : 0;
  const ownPct = totalOwn > 0 ? Math.round((ownCompleted / totalOwn) * 100) : 0;

  /* Macro rollup */
  const contribByMacro = new Map<string, ContribRow[]>();
  for (const c of contribRows) {
    const arr = contribByMacro.get(c.macro_id) ?? [];
    arr.push(c);
    contribByMacro.set(c.macro_id, arr);
  }

  const macroSummary = macroRows.map((m) => {
    const rows = contribByMacro.get(m.id) ?? [];
    const completedCount = rows.filter(
      (r) => latestById.get(r.id)?.traffic_light === "verde",
    ).length;
    const withUpdates = rows.filter((r) => latestById.has(r.id)).length;
    const noUpdate = rows.length - withUpdates;
    const areasSet = new Set(rows.map((r) => r.area_id)).size;
    const percents = rows.map((r) => latestById.get(r.id)?.percent ?? 0);
    const avgPct =
      percents.length > 0
        ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length)
        : null;

    const hasRojo = rows.some((r) => latestById.get(r.id)?.traffic_light === "rojo");
    const hasNaranja = rows.some((r) => latestById.get(r.id)?.traffic_light === "naranja");
    const traffic_light: TrafficLight | null = !withUpdates
      ? null
      : hasRojo
        ? "rojo"
        : hasNaranja
          ? "naranja"
          : completedCount === rows.length && rows.length > 0
            ? "verde"
            : "naranja";

    return {
      ...m,
      contributions: rows.length,
      areas: areasSet,
      completedCount,
      withUpdates,
      noUpdate,
      avgPct,
      traffic_light,
    };
  });

  /* Area breakdown */
  const areaBreakdown = areaList
    .map((a) => {
      const aContribs = contribRows.filter((c) => c.area_id === a.id);
      const aOwn = ownRows.filter((c) => c.area_id === a.id);
      const aTotal = aContribs.length + aOwn.length;
      if (aTotal === 0) return null;

      const cComplete = aContribs.filter(
        (c) => latestById.get(c.id)?.traffic_light === "verde",
      ).length;
      const oComplete = aOwn.filter(
        (c) => ownLatestById.get(c.id)?.traffic_light === "verde",
      ).length;
      const cRisk = aContribs.filter((c) => {
        const t = latestById.get(c.id)?.traffic_light;
        return t === "naranja" || t === "rojo";
      }).length;
      const oRisk = aOwn.filter((c) => {
        const t = ownLatestById.get(c.id)?.traffic_light;
        return t === "naranja" || t === "rojo";
      }).length;
      const cCritical = aContribs.filter(
        (c) => latestById.get(c.id)?.traffic_light === "rojo",
      ).length;
      const oCritical = aOwn.filter(
        (c) => ownLatestById.get(c.id)?.traffic_light === "rojo",
      ).length;
      const cNoUp = aContribs.filter((c) => !latestById.has(c.id)).length;
      const oNoUp = aOwn.filter((c) => !ownLatestById.has(c.id)).length;

      const sumPct = [
        ...aContribs.map((c) => latestById.get(c.id)?.percent ?? 0),
        ...aOwn.map((c) => ownLatestById.get(c.id)?.percent ?? 0),
      ].reduce((acc, n) => acc + n, 0);
      const pct = Math.round(sumPct / aTotal);

      const critical = cCritical + oCritical;
      const atRisk = cRisk + oRisk;
      const tl: TrafficLight | null =
        aTotal === 0 ? null
        : critical > 0 ? "rojo"
        : atRisk > 0 ? "naranja"
        : cComplete + oComplete === aTotal ? "verde"
        : "naranja";

      return {
        ...a,
        total: aTotal,
        completed: cComplete + oComplete,
        risk: atRisk,
        critical,
        noUpdate: cNoUp + oNoUp,
        pct,
        tl,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .sort((a, b) => a.pct - b.pct);

  const generatedAt = new Date().toLocaleString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <AutoPrint />

      {/* Barra de control — solo en pantalla, no se imprime */}
      <PrintControls year={selectedYear} />

      {/* Documento */}
      <div className="pt-14 print:pt-0 bg-white min-h-screen">
        <div className="mx-auto max-w-5xl bg-white text-gray-900">

          {/* ══════════════════════ PORTADA ══════════════════════ */}
          <div className="relative px-10 py-14 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white overflow-hidden">
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/5" />

            <div className="relative">
              <div className="flex items-center gap-4 mb-10">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 ring-2 ring-white/30 text-xl font-extrabold tracking-tight">
                  VAC
                </div>
                <div>
                  <div className="text-white/70 text-sm font-medium">Vicerrectoría Académica</div>
                  <div className="text-white text-lg font-semibold">Indicadores Estratégicos</div>
                </div>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                Reporte de Indicadores VAC
              </h1>
              <p className="text-blue-200 text-xl font-medium">Año {selectedYear}</p>

              <div className="mt-10 pt-8 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                <MetaCover label="Fecha generación" value={generatedAt} />
                <MetaCover label="Áreas evaluadas" value={`${totalAreas} áreas`} />
                <MetaCover label="Retos Macro" value={`${totalMacros} retos`} />
                <MetaCover label="Total indicadores" value={`${total} indicadores`} />
              </div>
            </div>
          </div>

          {/* ══════════════════════ CONTENIDO ══════════════════════ */}
          <div className="px-8 py-10 space-y-12 md:px-10">

            {/* 1. RESUMEN EJECUTIVO */}
            <section>
              <SectionTitle num="1" title="Resumen Ejecutivo" />

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 mb-6">
                <KpiBox label="Áreas activas" value={totalAreas} accent="blue" />
                <KpiBox label="Retos Macro" value={totalMacros} accent="blue" />
                <KpiBox label="Total indicadores" value={total} />
                <KpiBox label="Completados" value={totalCompleted} accent="green" />
                <KpiBox label="En riesgo" value={totalRisk} accent="red" />
                <KpiBox label="Sin reporte" value={totalNoUpdate} accent="gray" />
              </div>

              <div className="rounded-xl border bg-gray-50 p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Avance general por tipo de indicador</h3>
                <ProgressRow
                  label="Avance global"
                  completed={totalCompleted}
                  total={total}
                  pct={completionPct}
                  color="bg-blue-600"
                />
                <ProgressRow
                  label="Retos del área"
                  completed={contribCompleted}
                  total={totalContrib}
                  pct={contribPct}
                  color="bg-emerald-500"
                />
                <ProgressRow
                  label="Indicadores propios"
                  completed={ownCompleted}
                  total={totalOwn}
                  pct={ownPct}
                  color="bg-violet-500"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryBadge
                  label="Completados (verde)"
                  count={totalCompleted}
                  pct={total > 0 ? Math.round((totalCompleted / total) * 100) : 0}
                  colorClass="border-emerald-200 bg-emerald-50 text-emerald-800"
                />
                <SummaryBadge
                  label="En riesgo (naranja)"
                  count={totalRisk - totalCritical}
                  pct={total > 0 ? Math.round(((totalRisk - totalCritical) / total) * 100) : 0}
                  colorClass="border-amber-200 bg-amber-50 text-amber-800"
                />
                <SummaryBadge
                  label="Críticos (rojo)"
                  count={totalCritical}
                  pct={total > 0 ? Math.round((totalCritical / total) * 100) : 0}
                  colorClass="border-red-200 bg-red-50 text-red-800"
                />
                <SummaryBadge
                  label="Sin reporte"
                  count={totalNoUpdate}
                  pct={total > 0 ? Math.round((totalNoUpdate / total) * 100) : 0}
                  colorClass="border-gray-200 bg-gray-50 text-gray-600"
                />
              </div>
            </section>

            {/* 2. RETOS MACRO VAC */}
            <section>
              <SectionTitle num="2" title="Estado de Retos Macro VAC" />

              {macroSummary.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">
                  Sin retos macro registrados para {selectedYear}.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Reto Macro</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Área responsable</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Aportes</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Áreas</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Completados</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Sin reporte</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">% Avance</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {macroSummary.map((m, i) => (
                        <tr key={m.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 leading-snug">{m.reto}</div>
                            <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{m.indicador}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">{m.area_responsable_text}</td>
                          <td className="px-3 py-3 text-center tabular-nums text-gray-700">{m.contributions}</td>
                          <td className="px-3 py-3 text-center tabular-nums text-gray-700">{m.areas}</td>
                          <td className="px-3 py-3 text-center tabular-nums">
                            <span className="text-emerald-700 font-semibold">{m.completedCount}</span>
                            <span className="text-gray-400">/{m.contributions}</span>
                          </td>
                          <td className="px-3 py-3 text-center tabular-nums text-gray-500">{m.noUpdate}</td>
                          <td className="px-3 py-3 text-center">
                            {m.avgPct !== null ? (
                              <MiniBar pct={m.avgPct} />
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <TlBadge tl={m.traffic_light} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* 3. AVANCE POR ÁREA */}
            <section>
              <SectionTitle num="3" title="Avance por Área" />

              {areaBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">Sin datos de área para {selectedYear}.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Área</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Indicadores</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Completados</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">En riesgo</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Sin reporte</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">% Avance</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {areaBreakdown.map((a, i) => (
                        <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{a.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{typeLabel(a.type)}</div>
                          </td>
                          <td className="px-3 py-3 text-center tabular-nums text-gray-700">{a.total}</td>
                          <td className="px-3 py-3 text-center tabular-nums">
                            <span className="text-emerald-700 font-semibold">{a.completed}</span>
                          </td>
                          <td className="px-3 py-3 text-center tabular-nums">
                            <span className="text-amber-600 font-semibold">{a.risk - a.critical}</span>
                            {a.critical > 0 && (
                              <span className="ml-1 text-red-600 font-semibold text-xs">+{a.critical} críticos</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center tabular-nums text-gray-400">{a.noUpdate}</td>
                          <td className="px-3 py-3 text-center"><MiniBar pct={a.pct} /></td>
                          <td className="px-3 py-3 text-center"><TlBadge tl={a.tl} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* PIE */}
            <div className="border-t pt-6 text-center text-xs text-gray-400 space-y-1">
              <p className="font-medium text-gray-500">Indicadores VAC · Año {selectedYear}</p>
              <p>Reporte generado el {generatedAt}</p>
              <p>Documento de uso interno — Vicerrectoría Académica</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1.2cm 1.5cm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .pt-14 { padding-top: 0 !important; }
          section { break-inside: avoid; }
          table { break-inside: auto; }
          tr { break-inside: avoid; }
        }
      `}</style>
    </>
  );
}
