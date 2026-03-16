"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  Paperclip,
  MessageSquareText,
  ArrowUpRight,
} from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { AllIndicatorItem } from "@/app/app/admin/_components/all-indicators";

type TrafficLight = "verde" | "naranja" | "rojo";

type Update = {
  id: string;
  date: string;
  percent: number;
  current_value: number | null;
  traffic_light: TrafficLight;
  comment: string | null;
  evidence_path: string | null;
  evidence_link: string | null;
};

function dotColor(t: TrafficLight | null) {
  if (t === "rojo") return "bg-red-500";
  if (t === "naranja") return "bg-amber-500";
  if (t === "verde") return "bg-green-500";
  return "bg-muted-foreground/25";
}

function barColor(t: TrafficLight | null) {
  if (t === "rojo") return "bg-red-400";
  if (t === "naranja") return "bg-amber-400";
  if (t === "verde") return "bg-green-500";
  return "bg-muted-foreground/20";
}

function badgeClass(t: TrafficLight | null) {
  if (t === "rojo") return "bg-red-50 text-red-600 dark:bg-red-950/30";
  if (t === "naranja") return "bg-amber-50 text-amber-600 dark:bg-amber-950/30";
  if (t === "verde") return "bg-green-50 text-green-600 dark:bg-green-950/30";
  return "bg-muted text-muted-foreground";
}

function trafficLabel(t: TrafficLight | null) {
  if (t === "rojo") return "En riesgo";
  if (t === "naranja") return "En desarrollo";
  if (t === "verde") return "Cumplido";
  return "Sin reporte";
}

function parsePaths(raw: string | null): string[] {
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.filter((s) => typeof s === "string" && s.trim());
    } catch { /* fallback */ }
  }
  return raw.trim() ? [raw.trim()] : [];
}

function parseLinks(raw: string | null): string[] {
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.filter((s) => typeof s === "string" && s.trim());
    } catch { /* fallback */ }
  }
  return raw.trim() ? [raw.trim()] : [];
}

export function IndicatorDetailDialog({
  indicator,
  onClose,
}: {
  indicator: AllIndicatorItem | null;
  onClose: () => void;
}) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!indicator) { setUpdates([]); return; }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    const query = indicator.type === "contrib"
      ? supabase
          .from("progress_updates")
          .select("id,period_end,percent,current_value,traffic_light,comment,evidence_path,evidence_link")
          .eq("contribution_id", indicator.id)
          .order("created_at", { ascending: false })
      : supabase
          .from("area_own_updates")
          .select("id,report_date,percent,current_value,traffic_light,comment,evidence_path,evidence_link")
          .eq("indicator_id", indicator.id)
          .order("created_at", { ascending: false });

    query.then(({ data }) => {
      const rows = (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        date: (indicator.type === "contrib" ? r.period_end : r.report_date) as string,
        percent: r.percent as number,
        current_value: r.current_value as number | null,
        traffic_light: r.traffic_light as TrafficLight,
        comment: r.comment as string | null,
        evidence_path: r.evidence_path as string | null,
        evidence_link: r.evidence_link as string | null,
      }));
      setUpdates(rows);
      setLoading(false);
    });
  }, [indicator]);

  const latest = updates[0] ?? null;

  return (
    <Dialog open={!!indicator} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-base font-semibold leading-snug">
                {indicator?.indicador}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground line-clamp-2">
                {indicator?.reto}
              </DialogDescription>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Badge variant="secondary">{indicator?.year}</Badge>
            <Badge variant="outline">
              {indicator?.areaName}
              {indicator?.areaType ? ` (${indicator.areaType})` : ""}
            </Badge>
            <Badge variant="outline">
              {indicator?.type === "contrib" ? "Reto área" : "Propio"}
            </Badge>
            {indicator?.meta !== null && (
              <Badge variant="outline">
                Meta: {indicator?.meta}
                {indicator?.metaDesc ? ` — ${indicator.metaDesc}` : ""}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Resumen del último avance */}
        {latest && (
          <div className="px-5 py-3 border-b bg-muted/20 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  badgeClass(latest.traffic_light)
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", dotColor(latest.traffic_light))} />
                  {trafficLabel(latest.traffic_light)}
                </span>
                {latest.date && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {latest.date}
                  </span>
                )}
              </div>
              <span className="text-xl font-bold tabular-nums">{latest.percent}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", barColor(latest.traffic_light))}
                style={{ width: `${Math.min(100, latest.percent)}%` }}
              />
            </div>
            {latest.current_value !== null && indicator?.meta !== null && (
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                {latest.current_value} / {indicator?.meta}
              </p>
            )}
          </div>
        )}

        {/* Historial de avances */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Cargando avances...</p>
          ) : updates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Este indicador aún no tiene avances registrados.
            </p>
          ) : (
            updates.map((u, idx) => {
              const filePaths = parsePaths(u.evidence_path);
              const links = parseLinks(u.evidence_link);
              const hasEvidence = filePaths.length > 0 || links.length > 0;

              return (
                <div key={u.id} className="flex gap-3">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center shrink-0">
                    <span className={cn("h-2.5 w-2.5 rounded-full mt-1 ring-2 ring-background", dotColor(u.traffic_light))} />
                    {idx < updates.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-1" />
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="min-w-0 flex-1 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {u.date && (
                          <span className="text-xs font-medium text-muted-foreground">
                            {u.date}
                          </span>
                        )}
                        {idx === 0 && (
                          <span className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium">
                            Último
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold tabular-nums shrink-0">
                        {u.percent}%
                        {u.current_value !== null && indicator?.meta !== null && (
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            ({u.current_value}/{indicator?.meta})
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Mini barra */}
                    <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
                      <div
                        className={cn("h-full rounded-full", barColor(u.traffic_light))}
                        style={{ width: `${Math.min(100, u.percent)}%` }}
                      />
                    </div>

                    {/* Observación */}
                    {u.comment && (
                      <div className="flex gap-1.5 mt-1">
                        <MessageSquareText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {u.comment}
                        </p>
                      </div>
                    )}

                    {/* Evidencia */}
                    {hasEvidence && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Paperclip className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                        {filePaths.map((path, i) => (
                          <a
                            key={path}
                            href={`/app/evidence/${path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-muted transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            {filePaths.length > 1 ? `Archivo ${i + 1}` : "Ver archivo"}
                          </a>
                        ))}
                        {links.map((link, i) => (
                          <a
                            key={i}
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-muted transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {links.length > 1 ? `Link ${i + 1}` : "Ver link"}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t shrink-0 flex justify-end">
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link href={indicator?.href ?? "#"}>
              Ver página completa
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
