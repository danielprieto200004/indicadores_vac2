import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReportePDF } from "@/components/admin/reporte/pdf-document";
import type { MacroSummaryItem, AreaBreakdownItem } from "@/components/admin/reporte/pdf-document";

type TrafficLight = "verde" | "naranja" | "rojo";

type Latest = {
  contribution_id: string;
  percent: number | null;
  traffic_light: TrafficLight | null;
  current_value: number | null;
};

type OwnLatest = {
  indicator_id: string;
  percent: number | null;
  traffic_light: TrafficLight | null;
  current_value: number | null;
};

type ContribRow = {
  id: string;
  macro_id: string;
  area_id: string;
};

type OwnRow = {
  id: string;
  area_id: string;
};

type MacroRow = {
  id: string;
  reto: string;
  indicador: string;
  area_responsable_text: string;
};

export async function GET(request: NextRequest) {
  /* Auth */
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  /* Year */
  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  const selectedYear = Number.isFinite(year) ? Math.trunc(year) : new Date().getFullYear();

  /* Fetch data */
  const [{ data: areas }, { data: macros }, { data: contributions }, { data: ownIndicators }] =
    await Promise.all([
      supabase.from("areas").select("id,name,type").eq("active", true),
      supabase
        .from("macro_challenges")
        .select("id,reto,indicador,area_responsable_text")
        .eq("year", selectedYear)
        .order("created_at", { ascending: false }),
      supabase
        .from("area_contributions")
        .select("id,macro_id,area_id")
        .eq("active", true)
        .eq("year", selectedYear),
      supabase
        .from("area_own_indicators")
        .select("id,area_id")
        .eq("active", true)
        .eq("year", selectedYear),
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
          .select("contribution_id,percent,traffic_light,current_value")
          .in("contribution_id", ids)
      : { data: [] as Latest[] },
    ownIds.length
      ? supabase
          .from("vw_area_own_latest")
          .select("indicator_id,percent,traffic_light,current_value")
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

  const contribCompleted = contribRows.filter((r) => latestById.get(r.id)?.traffic_light === "verde").length;
  const ownCompleted = ownRows.filter((r) => ownLatestById.get(r.id)?.traffic_light === "verde").length;
  const totalCompleted = contribCompleted + ownCompleted;

  const contribRisk = contribRows.filter((r) => { const t = latestById.get(r.id)?.traffic_light; return t === "naranja" || t === "rojo"; }).length;
  const ownRisk = ownRows.filter((r) => { const t = ownLatestById.get(r.id)?.traffic_light; return t === "naranja" || t === "rojo"; }).length;
  const totalRisk = contribRisk + ownRisk;

  const contribCritical = contribRows.filter((r) => latestById.get(r.id)?.traffic_light === "rojo").length;
  const ownCritical = ownRows.filter((r) => ownLatestById.get(r.id)?.traffic_light === "rojo").length;
  const totalCritical = contribCritical + ownCritical;

  const totalNoUpdate = contribRows.filter((r) => !latestById.has(r.id)).length + ownRows.filter((r) => !ownLatestById.has(r.id)).length;

  const completionPct = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;
  const contribPct = totalContrib > 0 ? Math.round((contribCompleted / totalContrib) * 100) : 0;
  const ownPct = totalOwn > 0 ? Math.round((ownCompleted / totalOwn) * 100) : 0;

  /* Macro rollup */
  const contribByMacro = new Map<string, ContribRow[]>();
  for (const c of contribRows) {
    const arr = contribByMacro.get(c.macro_id) ?? [];
    arr.push(c);
    contribByMacro.set(c.macro_id, arr);
  }

  const macroSummary: MacroSummaryItem[] = macroRows.map((m) => {
    const rows = contribByMacro.get(m.id) ?? [];
    const completedCount = rows.filter((r) => latestById.get(r.id)?.traffic_light === "verde").length;
    const withUpdates = rows.filter((r) => latestById.has(r.id)).length;
    const noUpdate = rows.length - withUpdates;
    const areasSet = new Set(rows.map((r) => r.area_id)).size;
    const percents = rows.map((r) => latestById.get(r.id)?.percent ?? 0);
    const avgPct = percents.length > 0 ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : null;

    const hasRojo = rows.some((r) => latestById.get(r.id)?.traffic_light === "rojo");
    const hasNaranja = rows.some((r) => latestById.get(r.id)?.traffic_light === "naranja");
    const traffic_light = !withUpdates ? null : hasRojo ? "rojo" : hasNaranja ? "naranja" : completedCount === rows.length && rows.length > 0 ? "verde" : "naranja";

    return { id: m.id, reto: m.reto, indicador: m.indicador, area_responsable_text: m.area_responsable_text, contributions: rows.length, areas: areasSet, completedCount, noUpdate, avgPct, traffic_light };
  });

  /* Area breakdown */
  const areaBreakdown: AreaBreakdownItem[] = areaList
    .map((a) => {
      const aContribs = contribRows.filter((c) => c.area_id === a.id);
      const aOwn = ownRows.filter((c) => c.area_id === a.id);
      const aTotal = aContribs.length + aOwn.length;
      if (aTotal === 0) return null;

      const completed = aContribs.filter((c) => latestById.get(c.id)?.traffic_light === "verde").length
        + aOwn.filter((c) => ownLatestById.get(c.id)?.traffic_light === "verde").length;
      const cRisk = aContribs.filter((c) => { const t = latestById.get(c.id)?.traffic_light; return t === "naranja" || t === "rojo"; }).length;
      const oRisk = aOwn.filter((c) => { const t = ownLatestById.get(c.id)?.traffic_light; return t === "naranja" || t === "rojo"; }).length;
      const critical = aContribs.filter((c) => latestById.get(c.id)?.traffic_light === "rojo").length
        + aOwn.filter((c) => ownLatestById.get(c.id)?.traffic_light === "rojo").length;
      const noUpdate = aContribs.filter((c) => !latestById.has(c.id)).length + aOwn.filter((c) => !ownLatestById.has(c.id)).length;
      const risk = cRisk + oRisk;

      const sumPct = [
        ...aContribs.map((c) => latestById.get(c.id)?.percent ?? 0),
        ...aOwn.map((c) => ownLatestById.get(c.id)?.percent ?? 0),
      ].reduce((acc, n) => acc + n, 0);
      const pct = Math.round(sumPct / aTotal);

      const tl = aTotal === 0 ? null : critical > 0 ? "rojo" : risk > 0 ? "naranja" : completed === aTotal ? "verde" : "naranja";

      return { id: a.id, name: a.name, type: a.type, total: aTotal, completed, risk, critical, noUpdate, pct, tl };
    })
    .filter((a): a is AreaBreakdownItem => a !== null)
    .sort((a, b) => a.pct - b.pct);

  /* Generate PDF */
  const generatedAt = new Date().toLocaleString("es-CO", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const buffer = await renderToBuffer(
    React.createElement(ReportePDF, {
      data: {
        year: selectedYear,
        generatedAt,
        kpis: { totalAreas, totalMacros, total, totalCompleted, totalRisk, totalCritical, totalNoUpdate, completionPct, contribCompleted, totalContrib, contribPct, ownCompleted, totalOwn, ownPct },
        macroSummary,
        areaBreakdown,
      },
    }),
  );

  const filename = `Reporte-Indicadores-VAC-${selectedYear}.pdf`;

  // Buffer -> Uint8Array para satisfacer los tipos de NextResponse
  const body = buffer as unknown as Uint8Array;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.byteLength.toString(),
    },
  });
}
