"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type TrafficLight = "verde" | "naranja" | "rojo";

export type MemberContributionRow = {
  id: string;
  year: number;
  reto_area: string;
  indicador_area: string;
  meta_area: number | null;
  meta_desc: string | null;
  area: { name: string; type: string } | null;
  macro_reto: string | null;
  latest: {
    percent: number | null;
    traffic_light: TrafficLight | null;
    period_end: string | null;
    current_value: number | null;
  } | null;
};

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

function statusBgLight(t: TrafficLight) {
  return t === "rojo"
    ? "bg-red-50 dark:bg-red-950/30"
    : t === "naranja"
      ? "bg-amber-50 dark:bg-amber-950/30"
      : "bg-green-50 dark:bg-green-950/30";
}

function statusBorder(t: TrafficLight) {
  return t === "rojo"
    ? "border-l-red-500"
    : t === "naranja"
      ? "border-l-amber-500"
      : "border-l-green-500";
}

export function MemberContributionsList({ rows }: { rows: MemberContributionRow[] }) {
  const [selectedAreaName, setSelectedAreaName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const areaNameOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.area?.name) set.add(r.area.name);
    });
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((r) => {
      if (selectedAreaName && r.area?.name !== selectedAreaName) return false;
      if (!q) return true;
      const hay = `${r.indicador_area} ${r.reto_area} ${r.meta_desc ?? ""} ${r.macro_reto ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, selectedAreaName, searchQuery]);

  return (
    <div>
      {/* Filtros */}
      <div className="mb-4 grid gap-3 rounded-xl border border-input bg-background p-4 md:grid-cols-12">
        <div className="space-y-2 md:col-span-4">
          <label htmlFor="filter-area-type" className="text-xs font-medium text-muted-foreground">
            Dirección / área
          </label>
          <select
            id="filter-area-type"
            value={selectedAreaName}
            onChange={(e) => setSelectedAreaName(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Todas</option>
            {areaNameOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-6">
          <label htmlFor="filter-q" className="text-xs font-medium text-muted-foreground">
            Buscar reto o indicador
          </label>
          <input
            id="filter-q"
            type="search"
            placeholder="Reto, indicador, macro…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col justify-end gap-2 md:col-span-2">
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              setSelectedAreaName("");
              setSearchQuery("");
            }}
          >
            Limpiar filtros
          </button>
          <p className="text-[11px] text-muted-foreground">
            Mostrando <span className="font-semibold">{filtered.length}</span> de {rows.length} retos.
          </p>
        </div>
      </div>

      {/* Listado de tarjetas */}
      <div className="grid gap-3">
        {filtered.map((c) => {
          const latest = c.latest;
          const traffic = latest?.traffic_light ?? null;
          const pct = typeof latest?.percent === "number" ? latest.percent : 0;
          const currentVal =
            typeof latest?.current_value === "number" ? latest.current_value : null;
          const metaVal = typeof c.meta_area === "number" ? c.meta_area : null;

          return (
            <Link key={c.id} href={`/app/aportes/${c.id}`} className="block group">
              <Card
                className={`transition-all hover:shadow-md border-l-4 ${
                  traffic ? statusBorder(traffic) : "border-l-border"
                }`}
              >
                <CardContent className="pt-5 pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {c.year}
                        </Badge>
                        {traffic ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${statusBgLight(
                              traffic
                            )} ${statusColor(traffic)}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusBg(traffic)}`}
                            />
                            {statusLabel(traffic)}
                          </span>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Sin avances
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors leading-tight">
                        {c.indicador_area}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.reto_area}
                      </p>
                      {c.macro_reto ? (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          Macro: {c.macro_reto}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold tabular-nums">{pct}%</div>
                      {metaVal !== null && currentVal !== null ? (
                        <div className="text-xs text-muted-foreground">
                          {currentVal} / {metaVal}
                        </div>
                      ) : metaVal !== null ? (
                        <div className="text-xs text-muted-foreground">
                          Meta: {metaVal}
                        </div>
                      ) : null}
                      {latest?.period_end ? (
                        <div className="text-xs text-muted-foreground mt-1">
                          {latest.period_end}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        traffic ? statusBg(traffic) : "bg-muted-foreground/20"
                      }`}
                      style={{
                        width: `${Math.min(100, pct)}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-muted-foreground">
                      {c.area?.name ?? ""} {c.area?.type ? `(${c.area.type})` : ""}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
                      Ver detalle
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

