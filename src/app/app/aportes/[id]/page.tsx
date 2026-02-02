import Link from "next/link";
import { notFound } from "next/navigation";

import { ProgressUpdateForm } from "@/components/member/progress-update-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function statusLabel(t: "verde" | "naranja" | "rojo") {
  return t === "rojo" ? "No realizado" : t === "naranja" ? "En proceso" : "Completo";
}

export default async function AporteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: contribution, error } = await supabase
    .from("area_contributions")
    .select(
      "id,year,reto_area,indicador_area,meta_area,meta_desc,area_id,macro_id,areas(name,type),macro_challenges(reto,indicador,meta_1_value,meta_1_desc,meta_2_value,meta_2_desc)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !contribution) return notFound();

  const area = Array.isArray(contribution.areas) ? contribution.areas[0] : contribution.areas;
  const macro = Array.isArray(contribution.macro_challenges)
    ? contribution.macro_challenges[0]
    : contribution.macro_challenges;

  const { data: updates } = await supabase
    .from("progress_updates")
    .select("id,period_start,period_end,percent,current_value,traffic_light,comment,evidence_path,created_at")
    .eq("contribution_id", id)
    .order("created_at", { ascending: false });

  const latest = updates?.[0] ?? null;
  const meta = typeof contribution.meta_area === "number" ? contribution.meta_area : null;
  const current = typeof latest?.current_value === "number" ? latest.current_value : null;
  const progressText =
    meta !== null && current !== null ? `${current}/${meta}` : current !== null ? String(current) : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link href="/app/aportes" className="underline underline-offset-4">
              Seguimiento
            </Link>{" "}
            / Detalle
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{contribution.indicador_area}</h1>
          <p className="text-sm text-muted-foreground">{contribution.reto_area}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{contribution.year}</Badge>
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
            <CardTitle>Contexto macro</CardTitle>
            <CardDescription>Referencia del reto macro al que aportas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Reto macro</div>
              <div className="font-medium">{macro?.reto ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Indicador macro</div>
              <div>{macro?.indicador ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Meta macro</div>
              <div className="space-y-1">
                <div>
                  {macro?.meta_1_value ?? "—"}{" "}
                  {macro?.meta_1_desc ? (
                    <span className="text-xs text-muted-foreground">— {macro.meta_1_desc}</span>
                  ) : null}
                </div>
                {macro?.meta_2_value !== null || macro?.meta_2_desc ? (
                  <div>
                    {macro?.meta_2_value ?? "—"}{" "}
                    {macro?.meta_2_desc ? (
                      <span className="text-xs text-muted-foreground">— {macro.meta_2_desc}</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Área</CardTitle>
            <CardDescription>Tu asignación de contribución.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Área</div>
              <div className="font-medium">
                {area?.name ?? "—"} {area?.type ? `(${area.type})` : ""}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Meta del área</div>
              <div className="space-y-1">
                <div>{contribution.meta_area ?? "—"}</div>
                {contribution.meta_desc ? (
                  <div className="text-xs text-muted-foreground">{contribution.meta_desc}</div>
                ) : null}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Progreso actual</div>
              <div className="font-medium">{progressText}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar avance del indicador del área</CardTitle>
          <CardDescription>
            Reporta el periodo y el estado de avance de tu indicador. Esto alimenta el seguimiento que ve el administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressUpdateForm
            contributionId={contribution.id}
            areaId={contribution.area_id}
            metaArea={meta}
            metaDesc={contribution.meta_desc ?? null}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
          <CardDescription>Registros reportados para este aporte.</CardDescription>
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
                    <TableCell className="font-medium">
                      {u.period_end}
                    </TableCell>
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

