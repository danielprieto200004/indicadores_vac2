import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { OwnProgressUpdateForm } from "@/components/member/own-progress-update-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function statusLabel(t: "verde" | "naranja" | "rojo") {
  return t === "rojo" ? "No realizado" : t === "naranja" ? "En proceso" : "Completo";
}

export default async function OwnIndicatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  if (profile?.role === "admin") {
    redirect("/app");
  }

  const { data: indicator, error } = await supabase
    .from("area_own_indicators")
    .select("id,year,ordinal,reto_area,indicador_area,meta_value,meta_desc,area_id,areas(name,type)")
    .eq("id", id)
    .maybeSingle();
  if (error || !indicator) return notFound();

  const area = Array.isArray(indicator.areas) ? indicator.areas[0] : indicator.areas;

  const { data: updates } = await supabase
    .from("area_own_updates")
    .select("id,report_date,percent,current_value,traffic_light,comment,evidence_path,created_at")
    .eq("indicator_id", id)
    .order("created_at", { ascending: false });

  const latest = updates?.[0] ?? null;
  const meta = typeof indicator.meta_value === "number" ? indicator.meta_value : null;
  const current = typeof latest?.current_value === "number" ? latest.current_value : null;
  const progressText =
    meta !== null && current !== null ? `${current}/${meta}` : current !== null ? String(current) : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link href="/app/propios" className="underline underline-offset-4">
              Indicadores propios
            </Link>{" "}
            / Detalle
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{indicator.indicador_area}</h1>
          <p className="text-sm text-muted-foreground">{indicator.reto_area}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{indicator.year}</Badge>
          {latest?.traffic_light ? (
            <Badge
              variant={
                latest.traffic_light === "rojo"
                  ? "destructive"
                  : latest.traffic_light === "naranja"
                    ? "secondary"
                    : "default"
              }
            >
              {statusLabel(latest.traffic_light)}
            </Badge>
          ) : (
            <Badge variant="outline">Sin avances</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Área</CardTitle>
            <CardDescription>Contexto del indicador propio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Área</div>
              <div className="font-medium">
                {area?.name ?? "—"} {area?.type ? `(${area.type})` : ""}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Meta</div>
              <div className="space-y-1">
                <div>{indicator.meta_value ?? "—"}</div>
                {indicator.meta_desc ? (
                  <div className="text-xs text-muted-foreground">{indicator.meta_desc}</div>
                ) : null}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Progreso actual</div>
              <div className="font-medium">{progressText}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registrar avance</CardTitle>
            <CardDescription>Registra el avance y evidencia de este indicador.</CardDescription>
          </CardHeader>
          <CardContent>
            <OwnProgressUpdateForm
              indicatorId={indicator.id}
              areaId={indicator.area_id}
              metaValue={meta}
              metaDesc={indicator.meta_desc ?? null}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
          <CardDescription>Registros reportados para este indicador.</CardDescription>
        </CardHeader>
        <CardContent>
          {!updates?.length ? (
            <div className="text-sm text-muted-foreground">Aún no hay avances registrados.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha de reporte</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Semáforo</TableHead>
                  <TableHead>Comentario</TableHead>
                  <TableHead>Evidencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {updates.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.report_date}</TableCell>
                    <TableCell>{u.percent}%</TableCell>
                    <TableCell>{u.current_value ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          u.traffic_light === "rojo"
                            ? "destructive"
                            : u.traffic_light === "naranja"
                              ? "secondary"
                              : "default"
                        }
                      >
                        {statusLabel(u.traffic_light)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[320px]">{u.comment ?? "—"}</TableCell>
                    <TableCell>
                      {u.evidence_path ? (
                        <Button asChild size="sm" variant="outline">
                          <a href={`/app/evidence/${u.evidence_path}`} target="_blank" rel="noreferrer">
                            Ver
                          </a>
                        </Button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

