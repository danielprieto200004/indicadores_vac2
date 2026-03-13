import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ExternalLink,
  FileText,
  CalendarDays,
  BarChart3,
  Clock,
  ArrowLeft,
  Paperclip,
  MessageSquareText,
} from "lucide-react";

import { OwnProgressUpdateForm } from "@/components/member/own-progress-update-form";
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
import { deleteOwnUpdate } from "@/app/app/propios/[id]/actions";
import { DeleteButton } from "@/components/member/delete-update-button";
import { EditOwnUpdateButton } from "@/components/member/edit-update-dialog";

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

function parseEvidencePaths(raw: string | null): string[] {
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
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  if (profile?.role === "admin") {
    redirect("/app");
  }

  const { data: indicator, error } = await supabase
    .from("area_own_indicators")
    .select(
      "id,year,ordinal,reto_area,indicador_area,meta_value,meta_desc,area_id,areas(name,type)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !indicator) return notFound();

  const area = Array.isArray(indicator.areas)
    ? indicator.areas[0]
    : indicator.areas;

  const { data: updates } = await supabase
    .from("area_own_updates")
    .select(
      "id,report_date,percent,current_value,traffic_light,comment,evidence_path,evidence_link,created_at,created_by"
    )
    .eq("indicator_id", id)
    .order("created_at", { ascending: false });

  const isAdmin = profile?.role === "admin";

  const latest = updates?.[0] ?? null;
  const meta =
    typeof indicator.meta_value === "number" ? indicator.meta_value : null;
  const current =
    typeof latest?.current_value === "number" ? latest.current_value : null;
  const percent = typeof latest?.percent === "number" ? latest.percent : 0;
  const totalUpdates = updates?.length ?? 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <Link
          href="/app/propios"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Indicadores propios
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {indicator.indicador_area}
            </h1>
            <p className="text-sm text-muted-foreground">
              {indicator.reto_area}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{indicator.year}</Badge>
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
            {indicator.meta_desc ? (
              <p className="text-xs text-muted-foreground mt-2">
                Meta: {indicator.meta_desc}
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
              {latest?.report_date ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">Último reporte</div>
          </CardContent>
        </Card>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar nuevo avance</CardTitle>
          <CardDescription>
            Registra el avance y evidencia de este indicador propio.
          </CardDescription>
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
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border hidden sm:block" />

            {updates!.map((u, idx) => {
              const canModify = isAdmin || u.created_by === user?.id;
              const links = parseEvidenceLinks(u.evidence_link);
              const filePaths = parseEvidencePaths(u.evidence_path);
              const hasEvidence = filePaths.length > 0 || links.length > 0;
              const isFirst = idx === 0;

              return (
                <div key={u.id} className="flex gap-4">
                  <div className="hidden sm:flex flex-col items-center pt-5">
                    <div
                      className={`h-[10px] w-[10px] rounded-full ring-4 ring-background z-10 ${statusBg(u.traffic_light)}`}
                    />
                  </div>

                  <Card
                    className={`flex-1 border-l-4 ${statusBorder(u.traffic_light)} ${isFirst ? "ring-1 ring-primary/20" : ""}`}
                  >
                    <CardContent className="pt-5 pb-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">
                              {u.report_date}
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
                            <EditOwnUpdateButton
                              updateData={u}
                              indicatorId={id}
                              areaId={indicator.area_id}
                              metaValue={meta}
                              metaDesc={indicator.meta_desc ?? null}
                            />
                            <DeleteButton
                              updateId={u.id}
                              indicatorId={id}
                              action={deleteOwnUpdate}
                            />
                          </div>
                        ) : null}
                      </div>

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

                      <div className="h-1.5 rounded-full bg-muted overflow-hidden max-w-xs">
                        <div
                          className={`h-full rounded-full ${statusBg(u.traffic_light)}`}
                          style={{
                            width: `${Math.min(100, u.percent)}%`,
                          }}
                        />
                      </div>

                      <Separator />

                      {u.comment ? (
                        <div className="flex gap-2">
                          <MessageSquareText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-sm leading-relaxed">
                            {u.comment}
                          </p>
                        </div>
                      ) : null}

                      {hasEvidence ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                          {filePaths.map((path, i) => (
                            <Button
                              key={path}
                              asChild
                              size="sm"
                              variant="outline"
                              className="gap-1.5 h-7 text-xs"
                            >
                              <a
                                href={`/app/evidence/${path}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <FileText className="h-3 w-3" />
                                {filePaths.length > 1
                                  ? `Archivo ${i + 1}`
                                  : "Ver archivo"}
                              </a>
                            </Button>
                          ))}
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
