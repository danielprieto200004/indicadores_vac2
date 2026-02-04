"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, Building2, Check, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function areaKey(c: { areaName: string; areaType: string }) {
  return c.areaType ? `${c.areaName} (${c.areaType})` : c.areaName;
}

export type TrafficLight = "verde" | "naranja" | "rojo";

export type ContributionDetail = {
  id: string;
  areaName: string;
  areaType: string;
  reto_area: string;
  indicador_area: string;
  meta_area: number | null;
  meta_desc: string | null;
  latest: {
    traffic_light: TrafficLight | null;
    percent: number | null;
    current_value: number | null;
    period_end: string | null;
  } | null;
};

function trafficLabel(t: TrafficLight) {
  return t === "rojo" ? "No realizado" : t === "naranja" ? "En proceso" : "Completo";
}

function trafficVariant(t: TrafficLight) {
  return t === "rojo" ? "destructive" : t === "naranja" ? "secondary" : "default";
}

function countByArea(contributionsDetail: ContributionDetail[]) {
  const countMap = new Map<string, number>();
  const firstMap = new Map<string, { areaName: string; areaType: string }>();
  for (const c of contributionsDetail) {
    const key = areaKey(c);
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
    if (!firstMap.has(key)) firstMap.set(key, { areaName: c.areaName, areaType: c.areaType });
  }
  return Array.from(countMap.entries())
    .map(([area, count]) => ({
      area,
      count,
      areaName: firstMap.get(area)!.areaName,
      areaType: firstMap.get(area)!.areaType,
    }))
    .sort((a, b) => b.count - a.count);
}

function formatTipo(t: string) {
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/** Parte del nombre que distingue el área (sin "Escuela de" / "Dirección de") */
function shortAreaName(fullName: string): string {
  const trimmed = fullName.trim();
  const match = trimmed.match(/^(?:Escuela|Dirección|Direccion)\s+de\s+(.+)$/i);
  return match ? match[1].trim() : trimmed;
}

export function MacroContributionsDialog({
  open,
  onOpenChange,
  reto,
  indicador,
  contributionsDetail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reto: string;
  indicador: string;
  contributionsDetail: ContributionDetail[];
}) {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  useEffect(() => {
    if (open) setSelectedArea(null);
  }, [open]);

  const summaryByArea = countByArea(contributionsDetail);
  const filtered =
    selectedArea === null
      ? contributionsDetail
      : contributionsDetail.filter((c) => areaKey(c) === selectedArea);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl gap-0 overflow-hidden rounded-2xl border border-border/80 p-0 shadow-xl sm:max-w-3xl"
        aria-describedby={undefined}
      >
        {/* Header: más aire y jerarquía clara */}
        <DialogHeader className="space-y-1 border-b border-border/60 bg-gradient-to-b from-muted/40 to-muted/20 px-6 py-5 pr-10">
          <DialogTitle className="flex items-start gap-4 pr-2">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <span className="block text-base font-semibold leading-snug text-foreground line-clamp-2">
                {reto}
              </span>
              <p className="text-sm leading-snug text-muted-foreground line-clamp-2">
                {indicador}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription asChild>
            <p className="text-xs text-muted-foreground/90">
              Áreas e indicadores que contribuyen a este reto macro.
            </p>
          </DialogDescription>
        </DialogHeader>

        {/* Resumen por área: tarjetas compactas + filtro */}
        {summaryByArea.length > 0 ? (
          <div className="border-b border-border/60 bg-background/50 px-6 py-2.5">
            <p className="mb-2 text-[11px] font-medium text-muted-foreground">
              Aportes por área — haz clic para filtrar
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => setSelectedArea(null)}
                className={`flex min-h-[44px] min-w-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all ${
                  selectedArea === null
                    ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                    : "border-border/60 bg-card hover:bg-muted/30"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
                  {selectedArea === null ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                  Todos los aportes
                </span>
                <span className="shrink-0 rounded bg-muted/80 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {contributionsDetail.length}
                </span>
              </button>
              {summaryByArea.map(({ area, count, areaName, areaType }) => {
                const isSelected = selectedArea === area;
                const tipoLabel = formatTipo(areaType);
                const displayName = shortAreaName(areaName);
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setSelectedArea(isSelected ? null : area)}
                    title={area}
                    className={`flex min-h-[44px] min-w-0 flex-col justify-center gap-0.5 rounded-lg border px-2.5 py-1.5 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                        : "border-border/60 bg-card hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-1">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted">
                        {isSelected ? (
                          <Check className="h-3 w-3 text-primary" />
                        ) : (
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                        )}
                      </span>
                      {tipoLabel ? (
                        <span className="rounded bg-muted/80 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {tipoLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="line-clamp-2 leading-tight text-xs font-medium text-foreground">
                      {displayName}
                    </p>
                    <span
                      className={`inline-flex w-fit rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-primary/12 text-primary"
                      }`}
                    >
                      {count} {count === 1 ? "aporte" : "aportes"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Lista de aportes: cards más limpias */}
        <div
          className="overflow-y-auto px-6 py-4"
          style={{ maxHeight: "min(55vh, 440px)" }}
        >
          {!contributionsDetail.length ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/10 py-12 text-center">
              <Building2 className="mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Ningún área ha registrado aún aportes para este reto macro.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/10 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No hay aportes para el área seleccionada.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className="group rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {c.areaName}
                          {c.areaType ? (
                            <span className="text-muted-foreground">· {c.areaType}</span>
                          ) : null}
                        </span>
                        {c.latest?.traffic_light ? (
                          <Badge
                            variant={trafficVariant(c.latest.traffic_light)}
                            className="shrink-0 font-medium"
                          >
                            {trafficLabel(c.latest.traffic_light)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0 text-muted-foreground">
                            Sin avances
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Reto del área
                        </p>
                        <p className="text-sm leading-snug text-foreground">
                          {c.reto_area || "—"}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Indicador
                        </p>
                        <p className="text-sm leading-snug text-foreground">
                          {c.indicador_area || "—"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        <span>
                          <span className="font-medium text-foreground">Meta:</span>{" "}
                          {c.meta_area != null ? c.meta_area : "—"}
                          {c.meta_desc ? ` — ${c.meta_desc}` : ""}
                        </span>
                        {c.latest?.period_end ? (
                          <span>Reporte: {c.latest.period_end}</span>
                        ) : null}
                        {typeof c.latest?.percent === "number" ? (
                          <span className="font-medium tabular-nums text-foreground">
                            {c.latest.percent.toFixed(1)}%
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <Button
                      asChild
                      size="sm"
                      variant="default"
                      className="shrink-0 gap-1.5 font-medium"
                    >
                      <Link href={`/app/aportes/${c.id}`}>
                        Ver detalle
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
