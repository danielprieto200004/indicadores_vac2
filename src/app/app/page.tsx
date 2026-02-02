import Link from "next/link";

import { CheckCircle2, ClipboardList, Flame, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/app/app/admin/_components/admin-dashboard";

type Latest = {
  contribution_id: string;
  percent: number | null;
  traffic_light: "verde" | "naranja" | "rojo" | null;
  period_end: string | null;
  current_value?: number | null;
};

type JoinedMacro = { reto: string } | { reto: string }[] | null;
type ContributionRow = {
  id: string;
  year: number;
  indicador_area: string;
  meta_area: number | null;
  macro_challenges: JoinedMacro;
};

function trafficLabel(t: "verde" | "naranja" | "rojo") {
  return t === "rojo" ? "No realizado" : t === "naranja" ? "En proceso" : "Completo";
}

function trafficVariant(t: "verde" | "naranja" | "rojo") {
  return t === "rojo" ? "destructive" : t === "naranja" ? "secondary" : "default";
}

export default async function AppDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  if (profile?.role === "admin") {
    return <AdminDashboard />;
  }

  const { data: contributions } = await supabase
    .from("area_contributions")
    .select("id,year,indicador_area,meta_area,macro_challenges(reto)")
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
  (latestRows ?? []).forEach((r) => latestById.set((r as Latest).contribution_id, r as Latest));

  const total = rows.length;
  const withUpdates = rows.filter((r) => latestById.has(r.id)).length;
  const atRisk = rows.filter((r) => {
    const t = latestById.get(r.id)?.traffic_light;
    return t === "naranja" || t === "rojo";
  }).length;
  const completed = rows.filter((r) => latestById.get(r.id)?.traffic_light === "verde").length;
  const withoutUpdates = rows.filter((r) => !latestById.has(r.id)).length;

  // Resumen por macro (para vista rápida)
  const macroSummary = new Map<
    string,
    { macro: string; total: number; risk: number; completed: number; noUpdates: number }
  >();
  rows.forEach((c) => {
    const macro = Array.isArray(c.macro_challenges) ? c.macro_challenges[0] : c.macro_challenges;
    const macroName = macro?.reto ?? "Sin macro";
    const latest = latestById.get(c.id) ?? null;
    const prev = macroSummary.get(macroName) ?? { macro: macroName, total: 0, risk: 0, completed: 0, noUpdates: 0 };
    prev.total += 1;
    if (!latest?.traffic_light) prev.noUpdates += 1;
    if (latest?.traffic_light === "verde") prev.completed += 1;
    if (latest?.traffic_light === "naranja" || latest?.traffic_light === "rojo") prev.risk += 1;
    macroSummary.set(macroName, prev);
  });
  const macroCards = Array.from(macroSummary.values()).sort((a, b) => b.risk - a.risk || b.total - a.total);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent" />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                  <span className="font-medium text-foreground">Dashboard del área</span>
                  <span>·</span>
                  <span>Seguimiento</span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Estado general</h1>
                <p className="text-sm text-muted-foreground">
                  Revisa rápido tus indicadores, cuáles están en riesgo y a cuáles les falta reporte.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/app/aportes">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Ir a Seguimiento
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/app/macros">Ver Retos Macro VAC</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Indicadores asignados" value={String(total)} hint="Activos" icon={<TrendingUp className="h-4 w-4" />} />
        <Kpi title="Sin avances" value={String(withoutUpdates)} hint="Falta reporte" tone="warn" icon={<Flame className="h-4 w-4" />} />
        <Kpi title="En riesgo" value={String(atRisk)} hint="Naranja / rojo" tone="warn" icon={<Flame className="h-4 w-4" />} />
        <Kpi title="Completos" value={String(completed)} hint="Verde" tone="ok" icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Por Reto Macro VAC</CardTitle>
          <CardDescription>
            Resumen por macro: cuántos indicadores del área tienes y en qué estado están.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!macroCards.length ? (
            <div className="text-sm text-muted-foreground">Aún no tienes indicadores asignados.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {macroCards.slice(0, 6).map((m) => (
                <div key={m.macro} className="rounded-xl border border-input bg-background p-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold" title={m.macro}>
                      {m.macro}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">Indicadores: {m.total}</Badge>
                      <Badge variant="outline">Sin avance: {m.noUpdates}</Badge>
                      <Badge variant={m.risk ? "destructive" : "outline"}>En riesgo: {m.risk}</Badge>
                      <Badge variant={m.completed ? "default" : "outline"}>Completos: {m.completed}</Badge>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href="/app/aportes">Abrir seguimiento</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mis indicadores</CardTitle>
          <CardDescription>
            Resumen rápido. Para diligenciar avances entra a{" "}
            <Link className="underline underline-offset-4" href="/app/aportes">
              Seguimiento
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reto macro</TableHead>
                <TableHead>Indicador</TableHead>
                <TableHead>Meta</TableHead>
                <TableHead>Avance</TableHead>
                <TableHead>Semáforo</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!rows.length ? (
                <TableRow>
                  <TableCell className="font-medium" colSpan={6}>
                    No tienes aportes asignados.
                  </TableCell>
                </TableRow>
              ) : (
                rows.slice(0, 10).map((c) => {
                  const macro = Array.isArray(c.macro_challenges)
                    ? c.macro_challenges[0]
                    : c.macro_challenges;
                  const latest = latestById.get(c.id);
                  const traffic = latest?.traffic_light ?? null;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{macro?.reto ?? "—"}</TableCell>
                      <TableCell>
                        <Link className="underline underline-offset-4" href={`/app/aportes/${c.id}`}>
                          {c.indicador_area}
                        </Link>
                      </TableCell>
                      <TableCell>{c.meta_area ?? "—"}</TableCell>
                      <TableCell>
                        {typeof latest?.current_value === "number" && typeof c.meta_area === "number"
                          ? `${latest.current_value}/${c.meta_area}${typeof latest.percent === "number" ? ` (${latest.percent}%)` : ""}`
                          : typeof latest?.percent === "number"
                            ? `${latest.percent}%`
                            : "—"}
                        {latest?.period_end ? (
                          <div className="mt-1 text-xs text-muted-foreground">Reporte: {latest.period_end}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {traffic ? (
                          <Badge variant={trafficVariant(traffic)}>{trafficLabel(traffic)}</Badge>
                        ) : (
                          <Badge variant="outline">Sin avances</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/app/aportes/${c.id}`}>Registrar / ver</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  title,
  value,
  hint,
  icon,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  icon?: React.ReactNode;
  tone?: "ok" | "warn";
}) {
  return (
    <Card className={tone === "warn" ? "border-rose-200/60 dark:border-rose-500/20" : tone === "ok" ? "border-emerald-200/60 dark:border-emerald-500/20" : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-start justify-between gap-3 text-sm">
          <div className="min-w-0">
            <div className="truncate font-semibold">{title}</div>
            <CardDescription className="mt-1 text-xs">{hint}</CardDescription>
          </div>
          {icon ? (
            <span className={tone === "warn" ? "grid h-9 w-9 place-items-center rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300" : tone === "ok" ? "grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"}>
              {icon}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-semibold leading-none tracking-tight tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

