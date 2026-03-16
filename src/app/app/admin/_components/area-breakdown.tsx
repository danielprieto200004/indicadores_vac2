"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

type TrafficLight = "verde" | "naranja" | "rojo";

export type IndicatorDetail = {
  id: string;
  type: "contrib" | "own";
  indicador: string;
  reto: string;
  traffic_light: TrafficLight | null;
  percent: number | null;
  current_value: number | null;
  meta: number | null;
  date: string | null;
  comment: string | null;
  href: string;
};

export type AreaBreakdownItem = {
  id: string;
  name: string;
  type: string;
  total: number;
  completed: number;
  risk: number;
  noUpdate: number;
  pct: number;
  indicators: IndicatorDetail[];
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

function areaBarColor(pct: number, risk: number) {
  if (pct >= 100) return "bg-green-500";
  if (risk > 0) return "bg-amber-500";
  return "bg-primary";
}

function IndicatorRow({ ind }: { ind: IndicatorDetail }) {
  const [commentOpen, setCommentOpen] = useState(false);

  return (
    <div className="flex gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group">
      {/* Punto de color */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <span className={cn("h-2.5 w-2.5 rounded-full mt-0.5", dotColor(ind.traffic_light))} />
        {ind.comment && <div className="w-px flex-1 bg-border mt-1.5" />}
      </div>

      {/* Contenido */}
      <div className="min-w-0 flex-1 pb-0.5">
        {/* Nombre + % */}
        <div className="flex items-start justify-between gap-2">
          <Link href={ind.href} className="min-w-0 group/link">
            <p className="text-sm font-medium leading-snug group-hover/link:text-primary transition-colors line-clamp-2">
              {ind.indicador}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {ind.reto}
            </p>
          </Link>
          <div className="shrink-0 text-right">
            <span className="text-sm font-bold tabular-nums">
              {ind.percent !== null ? `${ind.percent}%` : "—"}
            </span>
            {ind.current_value !== null && ind.meta !== null && (
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {ind.current_value}/{ind.meta}
              </p>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", barColor(ind.traffic_light))}
            style={{ width: `${Math.min(100, ind.percent ?? 0)}%` }}
          />
        </div>

        {/* Observación */}
        {ind.comment && (
          <div className="mt-2">
            <p className={cn("text-xs text-muted-foreground leading-relaxed italic", !commentOpen && "line-clamp-1")}>
              "{ind.comment}"
            </p>
            <button
              type="button"
              onClick={() => setCommentOpen((v) => !v)}
              className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-primary/70 hover:text-primary transition-colors"
            >
              {commentOpen ? (
                <><ChevronUp className="h-3 w-3" />ver menos</>
              ) : (
                <><ChevronDown className="h-3 w-3" />ver más</>
              )}
            </button>
          </div>
        )}

        {/* Fecha + tipo */}
        <div className="flex items-center gap-2 mt-1">
          {ind.date && (
            <span className="text-[10px] text-muted-foreground/70">{ind.date}</span>
          )}
          <span className="text-[10px] text-muted-foreground/60">
            {ind.type === "contrib" ? "Reto área" : "Propio"}
          </span>
        </div>
      </div>
    </div>
  );
}

function AreaRow({ area }: { area: AreaBreakdownItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-input overflow-hidden">
      {/* Cabecera clickeable */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold truncate">{area.name}</span>
              <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">
                {area.type}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex-1 max-w-[180px] h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", areaBarColor(area.pct, area.risk))}
                  style={{ width: `${area.pct}%` }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums shrink-0">{area.pct}%</span>
              <span className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {area.completed}
                </span>
                {area.risk > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {area.risk}
                  </span>
                )}
                {area.noUpdate > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                    {area.noUpdate}
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground hidden sm:block">
              {area.total} indicador{area.total !== 1 ? "es" : ""}
            </span>
            {open
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </div>
      </button>

      {/* Lista de indicadores */}
      {open && (
        <div className="border-t border-input divide-y divide-input">
          {area.indicators.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground text-center">
              Sin indicadores registrados.
            </p>
          ) : (
            area.indicators.map((ind) => (
              <IndicatorRow key={ind.id} ind={ind} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function AreaBreakdown({ areas }: { areas: AreaBreakdownItem[] }) {
  if (areas.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-primary" />
          Avance por área
          <Badge variant="secondary" className="ml-auto">
            {areas.length} áreas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[520px] overflow-y-auto px-4 pb-4 pt-1 space-y-2">
          {areas.map((a) => (
            <AreaRow key={a.id} area={a} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
