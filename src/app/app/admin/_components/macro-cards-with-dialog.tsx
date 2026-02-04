"use client";

import { useState } from "react";
import { BarChart3, Target } from "lucide-react";

import { MacroContributionsDialog } from "@/app/app/admin/_components/macro-contributions-dialog";
import type { ContributionDetail } from "@/app/app/admin/_components/macro-contributions-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TrafficLight = "verde" | "naranja" | "rojo";

export type { ContributionDetail };

export type MacroCardWithDetails = {
  id: string;
  reto: string;
  indicador: string;
  meta_1_value: number | null;
  meta_1_desc: string | null;
  meta_2_value: number | null;
  meta_2_desc: string | null;
  contributions_count: number;
  contributing_areas_count: number;
  missing_areas_count: number;
  contributions_completed_count: number;
  macro_percent_strict: number | null;
  macro_traffic_light: TrafficLight | null;
  contributionsDetail: ContributionDetail[];
};

function trafficVariant(t: TrafficLight) {
  return t === "rojo" ? "destructive" : t === "naranja" ? "secondary" : "default";
}

function TinyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-input bg-muted/20 px-3 py-2">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

export function MacroCardsWithDialog({
  macroCardsWithDetails,
}: {
  macroCardsWithDetails: MacroCardWithDetails[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = macroCardsWithDetails.find((m) => m.id === openId);

  return (
    <>
      <div className="max-h-[420px] overflow-y-auto pr-2">
        <div className="grid gap-3">
          {macroCardsWithDetails.map((m) => (
            <div key={m.id} className="rounded-xl border border-input bg-background p-4">
              <div className="grid gap-3 lg:grid-cols-12 lg:items-start">
                <div className="min-w-0 lg:col-span-8">
                  <div className="truncate text-sm font-semibold" title={m.reto}>
                    {m.reto}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground" title={m.indicador}>
                    {m.indicador}
                  </div>
                  <div className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                    <span className="font-medium">Metas:</span>{" "}
                    <span className="text-foreground">
                      {m.meta_1_value ?? "—"}
                      {m.meta_1_desc ? ` — ${m.meta_1_desc}` : ""}
                    </span>
                    {m.meta_2_value !== null || m.meta_2_desc ? (
                      <span className="text-foreground">
                        {" "}
                        · {m.meta_2_value ?? "—"}
                        {m.meta_2_desc ? ` — ${m.meta_2_desc}` : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="grid min-w-0 gap-2 sm:grid-cols-3 lg:col-span-4 lg:grid-cols-1">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
                    <TinyStat label="Áreas que aportan" value={`${m.contributing_areas_count}`} />
                    <TinyStat label="Sin aporte" value={`${m.missing_areas_count}`} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
                    <TinyStat label="Retos del área" value={`${m.contributions_count}`} />
                    <TinyStat
                      label="Completos"
                      value={`${m.contributions_completed_count}/${m.contributions_count}`}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <TinyStat
                      label="Avance (estricto)"
                      value={
                        typeof m.macro_percent_strict === "number"
                          ? `${m.macro_percent_strict.toFixed(2)}%`
                          : "—"
                      }
                    />
                    {m.macro_traffic_light ? (
                      <Badge
                        variant={
                          m.macro_traffic_light === "rojo"
                            ? "destructive"
                            : m.macro_traffic_light === "naranja"
                              ? "secondary"
                              : "default"
                        }
                      >
                        {m.macro_traffic_light === "rojo"
                          ? "En riesgo"
                          : m.macro_traffic_light === "naranja"
                            ? "En proceso"
                            : "Completo"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Sin avances</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 border-t border-input pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setOpenId(m.id)}
                >
                  <Target className="mr-2 h-4 w-4 shrink-0" />
                  Ver quién aporta y con qué indicadores
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MacroContributionsDialog
        open={!!openId}
        onOpenChange={(open) => !open && setOpenId(null)}
        reto={selected?.reto ?? ""}
        indicador={selected?.indicador ?? ""}
        contributionsDetail={selected?.contributionsDetail ?? []}
      />
    </>
  );
}
