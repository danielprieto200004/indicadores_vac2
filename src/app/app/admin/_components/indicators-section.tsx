"use client";

import { useState } from "react";
import { AreaBreakdown } from "@/app/app/admin/_components/area-breakdown";
import { AllIndicators } from "@/app/app/admin/_components/all-indicators";
import type { AreaBreakdownItem } from "@/app/app/admin/_components/area-breakdown";
import type { AllIndicatorItem } from "@/app/app/admin/_components/all-indicators";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type TrafficLight = "verde" | "naranja" | "rojo";
type StatusFilter = TrafficLight | "sin_reporte" | null;

const STATUS_FILTERS: { value: StatusFilter; label: string; dot: string }[] = [
  { value: null,          label: "Todos",         dot: "bg-muted-foreground/40" },
  { value: "verde",       label: "Completos",     dot: "bg-green-500" },
  { value: "naranja",     label: "En desarrollo", dot: "bg-amber-500" },
  { value: "rojo",        label: "En riesgo",     dot: "bg-red-500" },
  { value: "sin_reporte", label: "Sin reporte",   dot: "bg-muted-foreground/30" },
];

export function IndicatorsSection({
  areaBreakdown,
  allIndicators,
}: {
  areaBreakdown: AreaBreakdownItem[];
  allIndicators: AllIndicatorItem[];
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  // Áreas únicas ordenadas alfabéticamente
  const uniqueAreas = Array.from(
    new Map(allIndicators.map((i) => [i.areaName, { name: i.areaName, type: i.areaType }])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const matchesStatus = (t: TrafficLight | null) =>
    statusFilter === null ? true
    : statusFilter === "sin_reporte" ? t === null
    : t === statusFilter;

  const matchesArea = (areaName: string) =>
    areaFilter === null ? true : areaName === areaFilter;

  const filteredAreas: AreaBreakdownItem[] = areaBreakdown
    .filter((a) => areaFilter === null || a.name === areaFilter)
    .map((a) => ({
      ...a,
      indicators: a.indicators.filter(
        (ind) => matchesStatus(ind.traffic_light)
      ),
    }))
    .filter((a) => a.indicators.length > 0 || statusFilter === null);

  const filteredIndicators: AllIndicatorItem[] = allIndicators.filter(
    (ind) => matchesStatus(ind.traffic_light) && matchesArea(ind.areaName)
  );

  const countForStatus = (v: StatusFilter) =>
    v === null ? allIndicators.length
    : v === "sin_reporte"
      ? allIndicators.filter((i) => i.traffic_light === null && matchesArea(i.areaName)).length
      : allIndicators.filter((i) => i.traffic_light === v && matchesArea(i.areaName)).length;

  return (
    <div className="space-y-3">
      {/* Filtro de estado */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={String(f.value)}
            type="button"
            onClick={() => setStatusFilter(f.value === statusFilter ? null : f.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              statusFilter === f.value
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-input bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", f.dot)} />
            {f.label}
            {f.value !== null && (
              <span className={cn("tabular-nums", statusFilter === f.value ? "opacity-80" : "opacity-60")}>
                {countForStatus(f.value)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filtro de dirección */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-medium text-muted-foreground shrink-0">Dirección:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {uniqueAreas.map((a) => (
            <button
              key={a.name}
              type="button"
              onClick={() => setAreaFilter(areaFilter === a.name ? null : a.name)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                areaFilter === a.name
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-input bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {a.name}
              {a.type ? (
                <span className={cn("opacity-60", areaFilter === a.name ? "opacity-70" : "")}>
                  · {a.type}
                </span>
              ) : null}
            </button>
          ))}
          {areaFilter && (
            <button
              type="button"
              onClick={() => setAreaFilter(null)}
              className="inline-flex items-center gap-1 rounded-full border border-input px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Paneles */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <AreaBreakdown areas={filteredAreas} />
        <AllIndicators indicators={filteredIndicators} />
      </div>
    </div>
  );
}
