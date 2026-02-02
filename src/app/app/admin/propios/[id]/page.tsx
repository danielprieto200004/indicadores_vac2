import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TrafficLight = "verde" | "naranja" | "rojo";
type JoinedArea = { name: string; type: string } | { name: string; type: string }[] | null;

function statusLabel(t: TrafficLight) {
  return t === "rojo" ? "No realizado" : t === "naranja" ? "En proceso" : "Completo";
}

function statusVariant(t: TrafficLight) {
  return t === "rojo" ? "destructive" : t === "naranja" ? "secondary" : "default";
}

export default async function AdminOwnIndicatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: indicator, error } = await supabase
    .from("area_own_indicators")
    .select("id,year,ordinal,reto_area,indicador_area,meta_value,meta_desc,area_id,areas(name,type)")
    .eq("id", id)
    .maybeSingle();
  if (error || !indicator) return notFound();

  const area = indicator.areas ? (Array.isArray(indicator.areas) ? indicator.areas[0] : indicator.areas) : null;

  const { data: updates } = await supabase
    .from("area_own_updates")
    .select("id,report_date,percent,current_value,traffic_light,comment,evidence_path,created_at")
    .eq("indicator_id", id)
    .order("created_at", { ascending: false });

  const latest = updates?.[0] ?? null;
  const meta = typeof indicator.meta_value === "number" ? indicator.meta_value : null;
  const current = typeof latest?.current_value === "number" ? latest.current_value : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link className="underline underline-offset-4" href="/app/admin/propios">
              Indicadores propios
            </Link>{" "}
            · Año {indicator.year}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Detalle (solo lectura)</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/app">Volver al Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="block truncate" title={indicator.indicador_area}>
                {indicator.indicador_area}
              </span>
              <span className="mt-1 block text-sm font-normal text-muted-foreground">
                {area?.name ?? "—"} {area?.type ? `· ${area.type}` : ""}
              </span>
            </span>
            {latest?.traffic_light ? (
              <Badge variant={statusVariant(latest.traffic_light as TrafficLight)}>
                {statusLabel(latest.traffic_light as TrafficLight)}
              </Badge>
            ) : (
              <Badge variant="outline">Sin avances</Badge>
            )}
          </CardTitle>
          <CardDescription className="mt-2">
            <span className="font-medium">Reto:</span> {indicator.reto_area}
            <span className="mx-2">·</span>
            <span className="font-medium">Meta:</span>{" "}
            {meta === null ? "—" : <span className="tabular-nums">{meta}</span>}
            {indicator.meta_desc ? <span className="text-muted-foreground"> — {indicator.meta_desc}</span> : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {typeof current === "number" && typeof meta === "number"
              ? `Último valor: ${current}/${meta} (${latest?.percent ?? "—"}%)`
              : typeof latest?.percent === "number"
                ? `Último porcentaje: ${latest.percent}%`
                : "Aún no hay reporte."}
            {latest?.report_date ? ` · Reporte: ${latest.report_date}` : ""}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>Historial de reportes</span>
            <Badge variant="secondary">{updates?.length ?? 0}</Badge>
          </CardTitle>
          <CardDescription>Últimos avances reportados por el área.</CardDescription>
        </CardHeader>
        <CardContent>
          {!updates?.length ? (
            <div className="text-sm text-muted-foreground">Aún no hay reportes.</div>
          ) : (
            <div className="rounded-xl border border-input">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[130px]">Fecha</TableHead>
                    <TableHead className="w-[120px]">Estado</TableHead>
                    <TableHead className="w-[180px]">Avance</TableHead>
                    <TableHead>Observación</TableHead>
                    <TableHead className="w-[130px]">Evidencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {updates.map((u) => {
                    const traffic = u.traffic_light as TrafficLight;
                    const progress =
                      typeof u.current_value === "number" && typeof meta === "number"
                        ? `${u.current_value}/${meta} (${u.percent ?? "—"}%)`
                        : typeof u.percent === "number"
                          ? `${u.percent}%`
                          : "—";
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="align-top">
                          <div className="text-sm font-medium">{u.report_date}</div>
                          <div className="text-xs text-muted-foreground">{String(u.created_at).slice(0, 10)}</div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant={statusVariant(traffic)}>{statusLabel(traffic)}</Badge>
                        </TableCell>
                        <TableCell className="align-top">
                          <span className="text-sm font-semibold tabular-nums">{progress}</span>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="line-clamp-3 text-sm" title={u.comment}>
                            {u.comment}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          {u.evidence_path ? (
                            <Button asChild size="sm" variant="outline" className="h-9">
                              <a href={`/app/evidence/${u.evidence_path}`} target="_blank" rel="noreferrer">
                                Abrir
                              </a>
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
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

