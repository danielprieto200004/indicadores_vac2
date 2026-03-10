import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TrafficLight = "verde" | "naranja" | "rojo";

type Latest = {
  contribution_id: string;
  percent: number | null;
  traffic_light: TrafficLight | null;
  period_end: string | null;
  current_value: number | null;
};

type JoinedArea =
  | { name: string; type: string }
  | { name: string; type: string }[]
  | null;
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

function statusLabel(t: TrafficLight) {
  return t === "rojo"
    ? "Requiere atención"
    : t === "naranja"
      ? "En desarrollo"
      : "Cumplido";
}

function statusColor(t: TrafficLight) {
  return t === "rojo"
    ? "text-red-600"
    : t === "naranja"
      ? "text-amber-600"
      : "text-green-600";
}

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

function statusBorder(t: TrafficLight) {
  return t === "rojo"
    ? "border-l-red-500"
    : t === "naranja"
      ? "border-l-amber-500"
      : "border-l-green-500";
}

export default async function AportesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: contributions } = await supabase
    .from("area_contributions")
    .select(
      "id,year,reto_area,indicador_area,meta_area,meta_desc,areas(name,type),macro_challenges(reto)"
    )
    .eq("active", true)
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (contributions ?? []) as ContributionRow[];
  const ids = rows.map((c) => c.id);
  const { data: latestRows } = ids.length
    ? await supabase
        .from("vw_contribution_latest")
        .select(
          "contribution_id,percent,traffic_light,period_end,current_value"
        )
        .in("contribution_id", ids)
    : { data: [] as Latest[] };

  const latestById = new Map<string, Latest>();
  (latestRows ?? []).forEach((r) => {
    latestById.set((r as Latest).contribution_id, r as Latest);
  });

  const totalRetos = rows.length;
  const completados = rows.filter(
    (r) => latestById.get(r.id)?.traffic_light === "verde"
  ).length;
  const enProceso = rows.filter(
    (r) => latestById.get(r.id)?.traffic_light === "naranja"
  ).length;
  const sinAvance = rows.filter((r) => !latestById.get(r.id)).length;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Seguimiento</h1>
        <p className="text-sm text-muted-foreground">
          Aquí tu Dirección/Escuela registra avances por periodo para cada reto
          asignado.
        </p>
      </div>

      {/* Resumen general */}
      {totalRetos > 0 ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-5 pb-4 text-center">
              <div className="text-3xl font-bold">{totalRetos}</div>
              <div className="text-xs text-muted-foreground">
                Retos asignados
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {completados}
              </div>
              <div className="text-xs text-muted-foreground">Completados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 text-center">
              <div className="text-3xl font-bold text-amber-600">
                {enProceso}
              </div>
              <div className="text-xs text-muted-foreground">En proceso</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 text-center">
              <div className="text-3xl font-bold text-muted-foreground">
                {sinAvance}
              </div>
              <div className="text-xs text-muted-foreground">Sin avance</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Listado de retos como tarjetas */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-1">
          Mis retos del área
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Selecciona un reto para ver su detalle y registrar avances.
        </p>

        {!rows.length ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aún no tienes retos asignados.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {rows.map((c) => {
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
                <Link key={c.id} href={`/app/aportes/${c.id}`} className="block group">
                  <Card
                    className={`transition-all hover:shadow-md border-l-4 ${traffic ? statusBorder(traffic) : "border-l-border"}`}
                  >
                    <CardContent className="pt-5 pb-4">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="secondary"
                              className="text-xs shrink-0"
                            >
                              {c.year}
                            </Badge>
                            {traffic ? (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${statusBgLight(traffic)} ${statusColor(traffic)}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${statusBg(traffic)}`}
                                />
                                {statusLabel(traffic)}
                              </span>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Sin avances
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors leading-tight">
                            {c.indicador_area}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {c.reto_area}
                          </p>
                          {macro?.reto ? (
                            <p className="text-xs text-muted-foreground/70 mt-0.5">
                              Macro: {macro.reto}
                            </p>
                          ) : null}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-2xl font-bold tabular-nums">
                            {pct}%
                          </div>
                          {metaVal !== null && currentVal !== null ? (
                            <div className="text-xs text-muted-foreground">
                              {currentVal} / {metaVal}
                            </div>
                          ) : metaVal !== null ? (
                            <div className="text-xs text-muted-foreground">
                              Meta: {metaVal}
                            </div>
                          ) : null}
                          {latest?.period_end ? (
                            <div className="text-xs text-muted-foreground mt-1">
                              {latest.period_end}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${traffic ? statusBg(traffic) : "bg-muted-foreground/20"}`}
                          style={{
                            width: `${Math.min(100, pct)}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-muted-foreground">
                          {area?.name ?? ""}{" "}
                          {area?.type ? `(${area.type})` : ""}
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
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
      </div>
    </div>
  );
}
