"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { IndicatorDetailDialog } from "@/app/app/admin/_components/indicator-detail-dialog";

type TrafficLight = "verde" | "naranja" | "rojo";

export type AllIndicatorItem = {
  id: string;
  type: "contrib" | "own";
  indicador: string;
  reto: string;
  areaName: string;
  areaType: string;
  year: number;
  meta: number | null;
  metaDesc: string | null;
  traffic_light: TrafficLight | null;
  percent: number | null;
  current_value: number | null;
  href: string;
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
  return "bg-muted-foreground/15";
}

export function AllIndicators({ indicators }: { indicators: AllIndicatorItem[] }) {
  const [selected, setSelected] = useState<AllIndicatorItem | null>(null);

  if (indicators.length === 0) return null;

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5 text-primary" />
            Todos los indicadores
            <Badge variant="secondary" className="ml-auto">
              {indicators.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0">
          <div className="h-[520px] overflow-y-auto divide-y divide-input px-4">
            {indicators.map((ind) => (
              <button
                key={ind.id}
                type="button"
                onClick={() => setSelected(ind)}
                className="w-full flex items-center gap-3 py-2.5 group hover:bg-muted/20 -mx-4 px-4 transition-colors text-left"
              >
                <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor(ind.traffic_light))} />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                    {ind.indicador}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {ind.areaName}
                    <span className="mx-1">·</span>
                    <span className="text-muted-foreground/70">
                      {ind.type === "contrib" ? "Reto área" : "Propio"}
                    </span>
                  </p>
                </div>

                <div className="shrink-0 w-16 space-y-1">
                  <div className="text-xs font-bold tabular-nums text-right">
                    {ind.percent !== null ? `${ind.percent}%` : "—"}
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", barColor(ind.traffic_light))}
                      style={{ width: `${Math.min(100, ind.percent ?? 0)}%` }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <IndicatorDetailDialog
        indicator={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
