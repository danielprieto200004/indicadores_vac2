import React from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

/* ── Types ── */

type TrafficLight = "verde" | "naranja" | "rojo" | null;

export type MacroSummaryItem = {
  id: string;
  reto: string;
  indicador: string;
  area_responsable_text: string;
  contributions: number;
  areas: number;
  completedCount: number;
  noUpdate: number;
  avgPct: number | null;
  traffic_light: TrafficLight;
};

export type AreaBreakdownItem = {
  id: string;
  name: string;
  type: string;
  total: number;
  completed: number;
  risk: number;
  critical: number;
  noUpdate: number;
  pct: number;
  tl: TrafficLight;
};

export interface ReporteData {
  year: number;
  generatedAt: string;
  kpis: {
    totalAreas: number;
    totalMacros: number;
    total: number;
    totalCompleted: number;
    totalRisk: number;
    totalCritical: number;
    totalNoUpdate: number;
    completionPct: number;
    contribCompleted: number;
    totalContrib: number;
    contribPct: number;
    ownCompleted: number;
    totalOwn: number;
    ownPct: number;
  };
  macroSummary: MacroSummaryItem[];
  areaBreakdown: AreaBreakdownItem[];
}

export interface ReportePDFProps extends DocumentProps {
  data: ReporteData;
}

/* ── Paleta ── */

const C = {
  blueDark: "#1e3a8a",
  blue: "#1d4ed8",
  emerald: "#059669",
  emeraldBg: "#ecfdf5",
  emeraldBorder: "#6ee7b7",
  amber: "#d97706",
  amberBg: "#fffbeb",
  amberBorder: "#fcd34d",
  red: "#dc2626",
  redBg: "#fef2f2",
  redBorder: "#fca5a5",
  grayLight: "#f9fafb",
  grayBorder: "#e5e7eb",
  grayRow: "#f3f4f6",
  textDark: "#111827",
  textMid: "#374151",
  textMuted: "#6b7280",
  textLight: "#9ca3af",
  white: "#ffffff",
};

/* ─────────────────────────────────────────
   ANCHOS DE COLUMNA — A4 usable = 515 pt
   (595 − 40*2 padding)
   Macro table total  = 515
   Area  table total  = 515
───────────────────────────────────────── */

// Macro table: Reto | Área resp | Aportes | Completados | % Avance | Estado
const MC = { reto: 150, area: 107, aportes: 38, completados: 54, avance: 76, estado: 90 };
// Area table: Área | Total | Completados | En riesgo | Sin rep | % Avance | Estado
const AC = { area: 145, total: 44, completados: 58, riesgo: 63, sinrep: 44, avance: 76, estado: 85 };

/* ── Styles ── */

const s = StyleSheet.create({
  /* Pages */
  coverPage: { backgroundColor: "#0c1a4e", position: "relative" },
  contentPage: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.textDark,
  },

  /* ── Cover decorative ── */
  coverAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 6,
    backgroundColor: "#60a5fa",
  },
  coverCircle1: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: "rgba(96,165,250,0.07)",
    bottom: -120,
    right: -100,
  },
  coverCircle2: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(96,165,250,0.05)",
    top: -70,
    right: 60,
  },
  coverCircle3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.03)",
    top: 180,
    right: -30,
  },

  /* ── Cover content ── */
  coverInner: {
    paddingHorizontal: 52,
    paddingVertical: 56,
    flex: 1,
    flexDirection: "column",
  },
  coverTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  coverBadge: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  coverBadgeText: { color: C.white, fontSize: 12, fontFamily: "Helvetica-Bold" },
  coverInstitution: { color: "rgba(255,255,255,0.55)", fontSize: 8 },
  coverSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 10 },

  /* center block */
  coverCenter: { flex: 1, justifyContent: "center" },
  coverAccentLine: {
    width: 48,
    height: 3,
    backgroundColor: "#60a5fa",
    borderRadius: 2,
    marginBottom: 18,
  },
  coverLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 8,
    letterSpacing: 2,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  coverTitle: {
    color: C.white,
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.25,
    marginBottom: 14,
  },
  coverTitleAccent: { color: "#93c5fd" },
  coverYear: {
    color: "#93c5fd",
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
  },

  /* metadata box */
  coverMetaBox: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 16,
  },
  coverMetaGrid: { flexDirection: "row" },
  coverMetaCell: { flex: 1 },
  coverMetaDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginHorizontal: 12,
  },
  coverMetaLabel: { color: "rgba(255,255,255,0.45)", fontSize: 6.5, marginBottom: 4 },
  coverMetaValue: { color: C.white, fontSize: 10, fontFamily: "Helvetica-Bold" },
  coverMetaSub: { color: "rgba(255,255,255,0.55)", fontSize: 7, marginTop: 1 },

  /* ── Section title ── */
  secRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  secNumBox: {
    width: 20,
    height: 20,
    backgroundColor: C.blue,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  secNum: { color: C.white, fontSize: 8, fontFamily: "Helvetica-Bold" },
  secTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.textDark },

  /* ── KPI boxes ── */
  kpiRow: { flexDirection: "row", marginBottom: 10 },
  kpiBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.grayBorder,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    backgroundColor: C.white,
    marginRight: 6,
  },
  kpiBoxLast: { marginRight: 0 },
  kpiVal: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  kpiLbl: { fontSize: 6, color: C.textMuted, textAlign: "center" },

  /* ── Progress bars ── */
  progCard: {
    borderWidth: 1,
    borderColor: C.grayBorder,
    borderRadius: 6,
    backgroundColor: C.grayLight,
    padding: 14,
    marginBottom: 10,
  },
  progCardTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.textMid, marginBottom: 10 },
  progItem: { marginBottom: 8 },
  progMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  progLabel: { fontSize: 8, color: C.textMid },
  progRight: { flexDirection: "row" },
  progFraction: { fontSize: 7, color: C.textMuted, marginRight: 4 },
  progPct: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.textDark },
  progTrack: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, width: "100%" },
  progFill: { height: 6, borderRadius: 3 },

  /* ── Summary badges ── */
  sumRow: { flexDirection: "row", marginTop: 6 },
  sumBadge: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    marginRight: 6,
  },
  sumBadgeLast: { marginRight: 0 },
  sumCount: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  sumPct: { fontSize: 7, marginBottom: 2 },
  sumLabel: { fontSize: 6, textAlign: "center" },

  /* ── Table shared ── */
  table: { borderWidth: 1, borderColor: C.grayBorder, borderRadius: 4, marginTop: 2 },
  tHead: {
    flexDirection: "row",
    backgroundColor: C.grayLight,
    borderBottomWidth: 1,
    borderBottomColor: C.grayBorder,
    paddingVertical: 6,
    alignItems: "center",
  },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.grayRow,
    paddingVertical: 6,
    alignItems: "center",
  },
  tRowAlt: { backgroundColor: C.grayRow },
  th: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.textMuted,
    textTransform: "uppercase",
  },
  td: { fontSize: 8, color: C.textMid },
  tdBold: { fontFamily: "Helvetica-Bold", color: C.textDark },
  tdSub: { fontSize: 6.5, color: C.textLight, marginTop: 1 },
  tdCenter: { textAlign: "center" },

  /* ── MiniBar ── */
  barRow: { flexDirection: "row", alignItems: "center" },
  barTrack: { width: 40, height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, marginRight: 4 },
  barFill: { height: 4, borderRadius: 2 },
  barText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.textDark },

  /* ── TL Badge ── */
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 5,
    alignSelf: "flex-start",
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3, marginRight: 3 },
  badgeText: { fontSize: 6.5 },

  /* ── Section wrapper ── */
  section: { marginBottom: 20 },

  /* ── Footer ── */
  footer: {
    borderTopWidth: 1,
    borderTopColor: C.grayBorder,
    paddingTop: 10,
    marginTop: 14,
    alignItems: "center",
  },
  footerTxt: { fontSize: 6.5, color: C.textLight, marginBottom: 2 },
});

/* ── Helpers ── */

function tlStyle(tl: TrafficLight) {
  if (tl === "verde")   return { bg: C.emeraldBg, border: C.emeraldBorder, text: "#065f46", dot: C.emerald,   label: "Completado" };
  if (tl === "naranja") return { bg: C.amberBg,   border: C.amberBorder,   text: "#92400e", dot: C.amber,     label: "En riesgo" };
  if (tl === "rojo")    return { bg: C.redBg,     border: C.redBorder,     text: "#7f1d1d", dot: C.red,       label: "Crítico" };
  return                       { bg: C.grayLight, border: C.grayBorder,    text: C.textMuted, dot: C.textLight, label: "Sin reporte" };
}

function barCol(pct: number) {
  return pct >= 80 ? C.emerald : pct >= 50 ? C.amber : C.red;
}

/* ── Sub-components ── */

function TlBadge({ tl }: { tl: TrafficLight }) {
  const c = tlStyle(tl);
  return (
    <View style={[s.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={[s.badgeDot, { backgroundColor: c.dot }]} />
      <Text style={[s.badgeText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

function MiniBar({ pct }: { pct: number | null }) {
  if (pct === null) return <Text style={[s.td, s.tdCenter, { color: C.textLight }]}>—</Text>;
  return (
    <View style={s.barRow}>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${Math.min(100, pct)}%`, backgroundColor: barCol(pct) }]} />
      </View>
      <Text style={s.barText}>{pct}%</Text>
    </View>
  );
}

function SecTitle({ n, title }: { n: string; title: string }) {
  return (
    <View style={s.secRow}>
      <View style={s.secNumBox}><Text style={s.secNum}>{n}</Text></View>
      <Text style={s.secTitle}>{title}</Text>
    </View>
  );
}

function ProgBar({ label, done, total, pct, color }: { label: string; done: number; total: number; pct: number; color: string }) {
  return (
    <View style={s.progItem}>
      <View style={s.progMeta}>
        <Text style={s.progLabel}>{label}</Text>
        <View style={s.progRight}>
          <Text style={s.progFraction}>{done}/{total}</Text>
          <Text style={s.progPct}>{pct}%</Text>
        </View>
      </View>
      <View style={s.progTrack}>
        <View style={[s.progFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

/* ── Cell helpers to keep padding consistent ── */
const PH = 6; // cell horizontal padding

function Th({ w, center, children }: { w: number; center?: boolean; children: string }) {
  return <Text style={[s.th, { width: w, paddingHorizontal: PH, textAlign: center ? "center" : "left" }]}>{children}</Text>;
}

function Td({ w, center, bold, muted, color, children }: { w: number; center?: boolean; bold?: boolean; muted?: boolean; color?: string; children: React.ReactNode }) {
  return (
    <Text style={[s.td, bold ? s.tdBold : {}, muted ? s.tdSub : {}, { width: w, paddingHorizontal: PH, textAlign: center ? "center" : "left", ...(color ? { color } : {}) }]}>
      {children}
    </Text>
  );
}

/* ── Document ── */

export function ReportePDF({ data }: ReportePDFProps) {
  const { year, generatedAt, kpis, macroSummary, areaBreakdown } = data;

  return (
    <Document title={`Reporte Indicadores VAC ${year}`} author="Vicerrectoría Académica" creator="Indicadores VAC">

      {/* ══════════════ PORTADA ══════════════ */}
      <Page size="A4" style={s.coverPage}>
        {/* Elementos decorativos */}
        <View style={s.coverAccentBar} />
        <View style={s.coverCircle1} />
        <View style={s.coverCircle2} />
        <View style={s.coverCircle3} />

        {/* Contenido */}
        <View style={s.coverInner}>

          {/* Header: logo + institución */}
          <View style={s.coverTopRow}>
            <View style={s.coverBadge}>
              <Text style={s.coverBadgeText}>VAC</Text>
            </View>
            <View>
              <Text style={s.coverInstitution}>Vicerrectoría Académica · Uniminuto</Text>
              <Text style={s.coverSubtitle}>Indicadores Estratégicos</Text>
            </View>
          </View>

          {/* Título principal centrado */}
          <View style={s.coverCenter}>
            <View style={s.coverAccentLine} />
            <Text style={s.coverLabel}>Informe de gestión</Text>
            <Text style={s.coverTitle}>Reporte de{"\n"}Indicadores VAC</Text>
            <Text style={s.coverYear}>Año {year}</Text>
          </View>

          {/* Caja de metadata */}
          <View style={s.coverMetaBox}>
            <View style={s.coverMetaGrid}>
              {[
                { label: "Fecha de generación", value: generatedAt,                    sub: null },
                { label: "Áreas evaluadas",     value: String(kpis.totalAreas),        sub: "áreas activas" },
                { label: "Retos Macro VAC",     value: String(kpis.totalMacros),       sub: "retos registrados" },
                { label: "Total indicadores",   value: String(kpis.total),             sub: `${kpis.totalCompleted} completados` },
              ].map((m, i, a) => (
                <React.Fragment key={m.label}>
                  <View style={s.coverMetaCell}>
                    <Text style={s.coverMetaLabel}>{m.label}</Text>
                    <Text style={s.coverMetaValue}>{m.value}</Text>
                    {m.sub ? <Text style={s.coverMetaSub}>{m.sub}</Text> : null}
                  </View>
                  {i < a.length - 1 && <View style={s.coverMetaDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>

        </View>
      </Page>

      {/* ══════════════ CONTENIDO ══════════════ */}
      <Page size="A4" style={s.contentPage}>

        {/* 1. RESUMEN EJECUTIVO */}
        <View style={s.section}>
          <SecTitle n="1" title="Resumen Ejecutivo" />

          {/* KPIs */}
          <View style={s.kpiRow}>
            {[
              { label: "Áreas activas",    value: kpis.totalAreas,     color: C.blue },
              { label: "Retos Macro",      value: kpis.totalMacros,    color: C.blue },
              { label: "Indicadores",      value: kpis.total,          color: C.textDark },
              { label: "Completados",      value: kpis.totalCompleted, color: C.emerald },
              { label: "En riesgo",        value: kpis.totalRisk,      color: C.amber },
              { label: "Sin reporte",      value: kpis.totalNoUpdate,  color: C.textMuted },
            ].map((k, i, a) => (
              <View key={k.label} style={[s.kpiBox, i === a.length - 1 ? s.kpiBoxLast : {}]}>
                <Text style={[s.kpiVal, { color: k.color }]}>{k.value}</Text>
                <Text style={s.kpiLbl}>{k.label}</Text>
              </View>
            ))}
          </View>

          {/* Barras de avance */}
          <View style={s.progCard}>
            <Text style={s.progCardTitle}>Avance general por tipo de indicador</Text>
            <ProgBar label="Avance global"       done={kpis.totalCompleted}    total={kpis.total}       pct={kpis.completionPct} color={C.blue} />
            <ProgBar label="Retos del área"      done={kpis.contribCompleted}  total={kpis.totalContrib} pct={kpis.contribPct}   color={C.emerald} />
            <ProgBar label="Indicadores propios" done={kpis.ownCompleted}      total={kpis.totalOwn}    pct={kpis.ownPct}       color="#7c3aed" />
          </View>

          {/* Resumen semáforo */}
          <View style={s.sumRow}>
            {[
              { label: "Completados",  count: kpis.totalCompleted,                      pct: kpis.total > 0 ? Math.round((kpis.totalCompleted / kpis.total) * 100) : 0,                       bg: C.emeraldBg, border: C.emeraldBorder, color: "#065f46" },
              { label: "En riesgo",   count: kpis.totalRisk - kpis.totalCritical,       pct: kpis.total > 0 ? Math.round(((kpis.totalRisk - kpis.totalCritical) / kpis.total) * 100) : 0,    bg: C.amberBg,   border: C.amberBorder,   color: "#92400e" },
              { label: "Críticos",    count: kpis.totalCritical,                        pct: kpis.total > 0 ? Math.round((kpis.totalCritical / kpis.total) * 100) : 0,                       bg: C.redBg,     border: C.redBorder,     color: "#7f1d1d" },
              { label: "Sin reporte", count: kpis.totalNoUpdate,                        pct: kpis.total > 0 ? Math.round((kpis.totalNoUpdate / kpis.total) * 100) : 0,                       bg: C.grayLight, border: C.grayBorder,    color: C.textMuted },
            ].map((b, i, a) => (
              <View key={b.label} style={[s.sumBadge, { backgroundColor: b.bg, borderColor: b.border }, i === a.length - 1 ? s.sumBadgeLast : {}]}>
                <Text style={[s.sumCount, { color: b.color }]}>{b.count}</Text>
                <Text style={[s.sumPct,   { color: b.color }]}>{b.pct}%</Text>
                <Text style={[s.sumLabel, { color: b.color }]}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. RETOS MACRO VAC */}
        <View style={s.section}>
          <SecTitle n="2" title="Estado de Retos Macro VAC" />

          {macroSummary.length === 0 ? (
            <Text style={{ fontSize: 8, color: C.textMuted }}>Sin retos macro registrados para {year}.</Text>
          ) : (
            <View style={s.table}>
              {/* Header */}
              <View style={s.tHead}>
                <Th w={MC.reto}>RETO MACRO</Th>
                <Th w={MC.area}>ÁREA RESPONSABLE</Th>
                <Th w={MC.aportes} center>APORTES</Th>
                <Th w={MC.completados} center>COMPLETADOS</Th>
                <Th w={MC.avance} center>% AVANCE</Th>
                <Th w={MC.estado} center>ESTADO</Th>
              </View>
              {/* Filas */}
              {macroSummary.map((m, i) => (
                <View key={m.id} style={[s.tRow, i % 2 !== 0 ? s.tRowAlt : {}]} wrap={false}>
                  {/* Reto */}
                  <View style={{ width: MC.reto, paddingHorizontal: PH, justifyContent: "center" }}>
                    <Text style={[s.td, s.tdBold]}>{m.reto}</Text>
                    <Text style={s.tdSub}>{m.indicador}</Text>
                  </View>
                  {/* Área */}
                  <View style={{ width: MC.area, paddingHorizontal: PH, justifyContent: "center" }}>
                    <Text style={s.td}>{m.area_responsable_text}</Text>
                  </View>
                  {/* Aportes */}
                  <Td w={MC.aportes} center>{m.contributions}</Td>
                  {/* Completados */}
                  <View style={{ width: MC.completados, paddingHorizontal: PH, alignItems: "center", justifyContent: "center" }}>
                    <Text style={s.td}>
                      <Text style={{ color: C.emerald, fontFamily: "Helvetica-Bold" }}>{m.completedCount}</Text>
                      <Text style={{ color: C.textLight }}>/{m.contributions}</Text>
                    </Text>
                  </View>
                  {/* % Avance */}
                  <View style={{ width: MC.avance, paddingHorizontal: PH, justifyContent: "center" }}>
                    <MiniBar pct={m.avgPct} />
                  </View>
                  {/* Estado */}
                  <View style={{ width: MC.estado, paddingHorizontal: PH, justifyContent: "center" }}>
                    <TlBadge tl={m.traffic_light} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 3. AVANCE POR ÁREA */}
        <View style={s.section}>
          <SecTitle n="3" title="Avance por Área" />

          {areaBreakdown.length === 0 ? (
            <Text style={{ fontSize: 8, color: C.textMuted }}>Sin datos de área para {year}.</Text>
          ) : (
            <View style={s.table}>
              {/* Header */}
              <View style={s.tHead}>
                <Th w={AC.area}>ÁREA</Th>
                <Th w={AC.total} center>TOTAL</Th>
                <Th w={AC.completados} center>COMPLETADOS</Th>
                <Th w={AC.riesgo} center>EN RIESGO</Th>
                <Th w={AC.sinrep} center>SIN REP.</Th>
                <Th w={AC.avance} center>% AVANCE</Th>
                <Th w={AC.estado} center>ESTADO</Th>
              </View>
              {/* Filas */}
              {areaBreakdown.map((a, i) => (
                <View key={a.id} style={[s.tRow, i % 2 !== 0 ? s.tRowAlt : {}]} wrap={false}>
                  {/* Área */}
                  <View style={{ width: AC.area, paddingHorizontal: PH, justifyContent: "center" }}>
                    <Text style={[s.td, s.tdBold]}>{a.name}</Text>
                    <Text style={s.tdSub}>{a.type === "direccion" ? "Dirección" : a.type === "escuela" ? "Escuela" : "Otro"}</Text>
                  </View>
                  {/* Total */}
                  <Td w={AC.total} center>{a.total}</Td>
                  {/* Completados */}
                  <Td w={AC.completados} center bold color={C.emerald}>{a.completed}</Td>
                  {/* En riesgo */}
                  <View style={{ width: AC.riesgo, paddingHorizontal: PH, alignItems: "center", justifyContent: "center" }}>
                    <Text style={[s.td, { color: C.amber, fontFamily: "Helvetica-Bold" }]}>
                      {a.risk - a.critical}
                      {a.critical > 0
                        ? <Text style={{ color: C.red, fontFamily: "Helvetica-Bold" }}> +{a.critical}c</Text>
                        : null}
                    </Text>
                  </View>
                  {/* Sin rep */}
                  <Td w={AC.sinrep} center color={C.textMuted}>{a.noUpdate}</Td>
                  {/* % Avance */}
                  <View style={{ width: AC.avance, paddingHorizontal: PH, justifyContent: "center" }}>
                    <MiniBar pct={a.pct} />
                  </View>
                  {/* Estado */}
                  <View style={{ width: AC.estado, paddingHorizontal: PH, justifyContent: "center" }}>
                    <TlBadge tl={a.tl} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Pie */}
        <View style={s.footer}>
          <Text style={s.footerTxt}>Indicadores VAC · Año {year}</Text>
          <Text style={s.footerTxt}>Generado el {generatedAt} — Documento de uso interno · Vicerrectoría Académica</Text>
        </View>

      </Page>
    </Document>
  );
}
