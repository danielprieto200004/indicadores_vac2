import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ExternalLink,
  FileText,
  CalendarDays,
  TrendingUp,
  BarChart3,
  Clock,
  ArrowLeft,
  Paperclip,
  MessageSquareText,
} from "lucide-react";

import { ProgressUpdateForm } from "@/components/member/progress-update-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteProgressUpdate } from "@/app/app/aportes/[id]/actions";
import { DeleteButton } from "@/components/member/delete-update-button";
import { EditProgressUpdateButton } from "@/components/member/edit-update-dialog";

type TrafficLight = "verde" | "naranja" | "rojo";

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

function statusBorder(t: TrafficLight) {
  return t === "rojo"
    ? "border-l-red-500"
    : t === "naranja"
      ? "border-l-amber-500"
      : "border-l-green-500";
}

function statusBgLight(t: TrafficLight) {
  return t === "rojo"
    ? "bg-red-50 dark:bg-red-950/30"
    : t === "naranja"
      ? "bg-amber-50 dark:bg-amber-950/30"
      : "bg-green-50 dark:bg-green-950/30";
}

function parseEvidenceLinks(raw: string | null): string[] {
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return parsed.filter(
          (s: unknown) => typeof s === "string" && (s as string).trim()
        );
    } catch {
      /* plain text fallback */
    }
  }
  return raw.trim() ? [raw.trim()] : [];
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

  const area = Array.isArray(contribution.areas)
    ? contribution.areas[0]
    : contribution.areas;
  const macro = Array.isArray(contribution.macro_challenges)
    ? contribution.macro_challenges[0]
    : contribution.macro_challenges;

  const { data: updates } = await supabase
    .from("progress_updates")
    .select(
      "id,period_start,period_end,percent,current_value,traffic_light,comment,evidence_path,evidence_link,created_at,created_by"
    )
    .eq("contribution_id", id)
    .order("created_at", { ascending: false });

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
  const isAdmin = profile?.role === "admin";

  const latest = updates?.[0] ?? null;
  const meta =
    typeof contribution.meta_area === "number" ? contribution.meta_area : null;
  const current =
    typeof latest?.current_value === "number" ? latest.current_value : null;
  const percent = typeof latest?.percent === "number" ? latest.percent : 0;
  const totalUpdates = updates?.length ?? 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <Link
          href="/app/aportes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Seguimiento
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {contribution.indicador_area}
            </h1>
            <p className="text-sm text-muted-foreground">
              {contribution.reto_area}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{contribution.year}</Badge>
            {area?.name ? (
              <Badge variant="outline">
                {area.name} {area.type ? `(${area.type})` : ""}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      {/* Resumen de progreso */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="sm:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-muted-foreground">
                Avance general
              </div>
              {latest?.traffic_light ? (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusBgLight(latest.traffic_light)} ${statusColor(latest.traffic_light)}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${statusBg(latest.traffic_light)}`}
                  />
                  {statusLabel(latest.traffic_light)}
                </span>
              ) : (
                <Badge variant="outline">Sin avances</Badge>
              )}
            </div>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-4xl font-bold tabular-nums">
                {percent}%
              </span>
              {meta !== null && current !== null ? (
                <span className="text-lg text-muted-foreground mb-1">
                  {current} / {meta}
                </span>
              ) : null}
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${latest?.traffic_light ? statusBg(latest.traffic_light) : "bg-muted-foreground/30"}`}
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
            {contribution.meta_desc ? (
              <p className="text-xs text-muted-foreground mt-2">
                Meta: {contribution.meta_desc}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-full">
            <BarChart3 className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <div className="text-3xl font-bold">{totalUpdates}</div>
            <div className="text-xs text-muted-foreground">
              {totalUpdates === 1 ? "Reporte" : "Reportes"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-full">
            <Clock className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <div className="text-sm font-semibold">
              {latest?.period_end ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">Último reporte</div>
          </CardContent>
        </Card>
      </div>

      {/* Contexto macro + área */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Ver contexto del reto macro y área
          <span className="text-xs ml-auto group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Reto macro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Reto</div>
                <div className="font-medium">{macro?.reto ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Indicador</div>
                <div>{macro?.indicador ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Meta</div>
                <div>
                  {macro?.meta_1_value ?? "—"}{" "}
                  {macro?.meta_1_desc ? (
                    <span className="text-xs text-muted-foreground">
                      — {macro.meta_1_desc}
                    </span>
                  ) : null}
                </div>
                {macro?.meta_2_value !== null || macro?.meta_2_desc ? (
                  <div>
                    {macro?.meta_2_value ?? "—"}{" "}
                    {macro?.meta_2_desc ? (
                      <span className="text-xs text-muted-foreground">
                        — {macro.meta_2_desc}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Asignación del área</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Área</div>
                <div className="font-medium">
                  {area?.name ?? "—"} {area?.type ? `(${area.type})` : ""}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Meta del área</div>
                <div>
                  {contribution.meta_area ?? "—"}
                  {contribution.meta_desc ? (
                    <span className="text-xs text-muted-foreground ml-1">
                      — {contribution.meta_desc}
                    </span>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </details>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar nuevo avance</CardTitle>
          <CardDescription>
            Reporta el estado de avance de tu indicador. Esto alimenta el
            seguimiento que ve el administrador.
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

      {/* Historial como tarjetas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Historial de avances
            </h2>
            <p className="text-sm text-muted-foreground">
              {totalUpdates > 0
                ? `${totalUpdates} ${totalUpdates === 1 ? "reporte registrado" : "reportes registrados"}`
                : "Aún no hay avances registrados."}
            </p>
          </div>
        </div>

        {totalUpdates > 0 ? (
          <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border hidden sm:block" />

            {updates!.map((u, idx) => {
              const canModify = isAdmin || u.created_by === user?.id;
              const links = parseEvidenceLinks(u.evidence_link);
              const hasEvidence = !!u.evidence_path || links.length > 0;
              const isFirst = idx === 0;

              return (
                <div key={u.id} className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="hidden sm:flex flex-col items-center pt-5">
                    <div
                      className={`h-[10px] w-[10px] rounded-full ring-4 ring-background z-10 ${statusBg(u.traffic_light)}`}
                    />
                  </div>

                  {/* Card */}
                  <Card
                    className={`flex-1 border-l-4 ${statusBorder(u.traffic_light)} ${isFirst ? "ring-1 ring-primary/20" : ""}`}
                  >
                    <CardContent className="pt-5 pb-4 space-y-3">
                      {/* Header row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">
                              {u.period_end}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBgLight(u.traffic_light)} ${statusColor(u.traffic_light)}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusBg(u.traffic_light)}`}
                            />
                            {statusLabel(u.traffic_light)}
                          </span>
                          {isFirst && (
                            <Badge variant="outline" className="text-xs">
                              Más reciente
                            </Badge>
                          )}
                        </div>

                        {canModify ? (
                          <div className="flex items-center gap-1">
                            <EditProgressUpdateButton
                              updateData={u}
                              contributionId={id}
                              areaId={contribution.area_id}
                              metaArea={meta}
                              metaDesc={contribution.meta_desc ?? null}
                            />
                            <DeleteButton
                              updateId={u.id}
                              contributionId={id}
                              action={deleteProgressUpdate}
                            />
                          </div>
                        ) : null}
                      </div>

                      {/* Metrics row */}
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Avance
                          </div>
                          <div className="text-lg font-bold tabular-nums">
                            {u.percent}%
                          </div>
                        </div>
                        {u.current_value !== null ? (
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Valor reportado
                            </div>
                            <div className="text-lg font-bold tabular-nums">
                              {u.current_value}
                              {meta !== null ? (
                                <span className="text-sm font-normal text-muted-foreground">
                                  {" "}
                                  / {meta}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* Mini progress bar */}
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden max-w-xs">
                        <div
                          className={`h-full rounded-full ${statusBg(u.traffic_light)}`}
                          style={{
                            width: `${Math.min(100, u.percent)}%`,
                          }}
                        />
                      </div>

                      <Separator />

                      {/* Comment */}
                      {u.comment ? (
                        <div className="flex gap-2">
                          <MessageSquareText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-sm leading-relaxed">
                            {u.comment}
                          </p>
                        </div>
                      ) : null}

                      {/* Evidence */}
                      {hasEvidence ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                          {u.evidence_path ? (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="gap-1.5 h-7 text-xs"
                            >
                              <a
                                href={`/app/evidence/${u.evidence_path}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <FileText className="h-3 w-3" />
                                Ver archivo
                              </a>
                            </Button>
                          ) : null}
                          {links.map((link, i) => (
                            <Button
                              key={i}
                              asChild
                              size="sm"
                              variant="outline"
                              className="gap-1.5 h-7 text-xs"
                            >
                              <a
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {links.length > 1
                                  ? `Link ${i + 1}`
                                  : "Ver link"}
                              </a>
                            </Button>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
