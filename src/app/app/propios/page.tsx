import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { OwnIndicatorsForm } from "@/components/member/own-indicators-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TrafficLight = "verde" | "naranja" | "rojo";

type Latest = {
  indicator_id: string;
  percent: number | null;
  traffic_light: TrafficLight | null;
  report_date: string | null;
  current_value: number | null;
};

type JoinedArea =
  | { name: string; type: string }
  | { name: string; type: string }[]
  | null;
type Row = {
  id: string;
  year: number;
  ordinal: number;
  reto_area: string;
  indicador_area: string;
  meta_value: number | null;
  meta_desc: string | null;
  area_id: string;
  areas: JoinedArea;
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

export default async function OwnIndicatorsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  if (profile?.role === "admin") {
    redirect("/app");
  }

  const { data: indicators } = await supabase
    .from("area_own_indicators")
    .select(
      "id,year,ordinal,reto_area,indicador_area,meta_value,meta_desc,area_id,areas(name,type)"
    )
    .eq("active", true)
    .order("year", { ascending: false })
    .order("ordinal", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = (indicators ?? []) as Row[];
  const ids = rows.map((r) => r.id);

  const { data: latestRows } = ids.length
    ? await supabase
        .from("vw_area_own_latest")
        .select(
          "indicator_id,percent,traffic_light,report_date,current_value"
        )
        .in("indicator_id", ids)
    : { data: [] as Latest[] };

  const latestById = new Map<string, Latest>();
  (latestRows ?? []).forEach((r) =>
    latestById.set((r as Latest).indicator_id, r as Latest)
  );

  const firstArea = rows.length
    ? Array.isArray(rows[0].areas)
      ? rows[0].areas[0]
      : rows[0].areas
    : null;

  const totalIndicators = rows.length;
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
        <h1 className="text-2xl font-semibold tracking-tight">
          Indicadores propios del área
        </h1>
        <p className="text-sm text-muted-foreground">
          Crea y da seguimiento a indicadores propios (no asociados a Retos
          Macro VAC).
        </p>
        {firstArea?.name ? (
          <div className="mt-2">
            <Badge variant="secondary">
              Área: {firstArea.name}{" "}
              {firstArea.type ? `(${firstArea.type})` : ""}
            </Badge>
          </div>
        ) : null}
      </div>

      <OwnIndicatorsForm defaultYear={new Date().getFullYear()} />

      {/* Resumen general */}
      {totalIndicators > 0 ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-5 pb-4 text-center">
              <div className="text-3xl font-bold">{totalIndicators}</div>
              <div className="text-xs text-muted-foreground">Indicadores</div>
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
              <div className="text-xs text-muted-foreground">En desarrollo</div>
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

      {/* Listado como tarjetas */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-1">
          Listado de indicadores
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Selecciona un indicador para ver su detalle y registrar avances.
        </p>

        {!rows.length ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aún no has creado indicadores propios.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {rows.map((r) => {
              const latest = latestById.get(r.id) ?? null;
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
                              {r.year}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0"
                            >
                              #{r.ordinal}
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
                            {r.indicador_area}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {r.reto_area}
                          </p>
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
                          {latest?.report_date ? (
                            <div className="text-xs text-muted-foreground mt-1">
                              {latest.report_date}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${traffic ? statusBg(traffic) : "bg-muted-foreground/20"}`}
                          style={{
                            width: `${Math.min(100, pct)}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-end mt-3">
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
