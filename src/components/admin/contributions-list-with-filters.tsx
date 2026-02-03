"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { AreaChallengeActions } from "@/components/admin/area-challenge-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type LatestRow = {
  contribution_id: string;
  percent: number | null;
  traffic_light: "verde" | "naranja" | "rojo" | null;
  period_end: string | null;
  current_value: number | null;
};

export type ContributionRow = {
  id: string;
  year: number;
  ordinal: number | null;
  reto_area: string | null;
  indicador_area: string | null;
  meta_area: number | null;
  meta_desc: string | null;
  active: boolean;
  area_id?: string;
  areas: { name: string; type: string } | { name: string; type: string }[] | null;
  macro_challenges: { reto: string } | { reto: string }[] | null;
};

function filterContributions(
  contributions: ContributionRow[],
  selectedAreaId: string,
  searchQuery: string,
  onlyActive: boolean
): ContributionRow[] {
  const q = searchQuery.trim().toLowerCase();
  return contributions.filter((c) => {
    if (onlyActive && !c.active) return false;
    if (selectedAreaId && c.area_id !== selectedAreaId) return false;
    if (!q) return true;
    const hay = [c.reto_area ?? "", c.indicador_area ?? "", c.meta_desc ?? ""].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function ContributionsListWithFilters({
  contributions,
  latestRows,
  areaOptions,
}: {
  contributions: ContributionRow[];
  latestRows: LatestRow[];
  areaOptions: { value: string; label: string }[];
}) {
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const latestById = useMemo(() => {
    const m = new Map<string, LatestRow>();
    latestRows.forEach((r) => m.set(r.contribution_id, r));
    return m;
  }, [latestRows]);

  const filtered = useMemo(
    () => filterContributions(contributions, selectedAreaId, searchQuery, onlyActive),
    [contributions, selectedAreaId, searchQuery, onlyActive]
  );

  return (
    <>
      <div className="mb-4 grid gap-3 rounded-xl border border-input bg-background p-4 md:grid-cols-12">
        <div className="space-y-2 md:col-span-4">
          <label htmlFor="filter-area" className="text-xs font-medium text-muted-foreground">
            Área
          </label>
          <select
            id="filter-area"
            value={selectedAreaId}
            onChange={(e) => setSelectedAreaId(e.target.value)}
            className={selectClassName}
          >
            <option value="">Todas las áreas</option>
            {areaOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-5">
          <label htmlFor="filter-q" className="text-xs font-medium text-muted-foreground">
            Buscar reto o indicador (se filtra al escribir)
          </label>
          <Input
            id="filter-q"
            type="search"
            placeholder="Reto, indicador, meta…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-1"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col justify-end gap-2 md:col-span-3">
          <Button
            type="button"
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => {
              setSelectedAreaId("");
              setSearchQuery("");
              setOnlyActive(false);
            }}
          >
            Limpiar filtros
          </Button>
        </div>

        <div className="md:col-span-12">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Mostrando: {filtered.length}</Badge>
            <Button
              type="button"
              size="sm"
              variant={onlyActive ? "default" : "outline"}
              onClick={() => setOnlyActive(true)}
            >
              Solo activos
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!onlyActive ? "default" : "outline"}
              onClick={() => setOnlyActive(false)}
            >
              Todos
            </Button>
          </div>
        </div>
      </div>

      {/* Móvil: tarjetas */}
      <div className="grid gap-3 md:hidden">
        {filtered.map((c) => {
          const area = Array.isArray(c.areas) ? c.areas[0] : c.areas;
          const areaLabel = area?.name ? `Área: ${area.name}${area?.type ? ` (${area.type})` : ""}` : "Área";
          const latest = latestById.get(c.id) ?? null;

          return (
            <div key={c.id} className="rounded-xl border border-input bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Área</div>
                  <div className="mt-1 text-sm" title={area?.name ?? ""}>
                    <span className="font-medium">{area?.name ?? "—"}</span>
                    {area?.type ? <span className="text-muted-foreground"> · {area.type}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Activo" : "Inactivo"}</Badge>
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
                      {latest.traffic_light === "rojo"
                        ? "No realizado"
                        : latest.traffic_light === "naranja"
                          ? "En proceso"
                          : "Completo"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Sin avances</Badge>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Indicador del área</div>
                  <div className="line-clamp-2">{c.indicador_area}</div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2" title={c.reto_area ?? ""}>
                    {c.reto_area}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Meta</div>
                    <div>{c.meta_area ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Desc. meta</div>
                    <div className="line-clamp-2">{c.meta_desc ?? "—"}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Seguimiento</div>
                  <div className="text-xs text-muted-foreground">
                    {latest?.traffic_light
                      ? typeof latest.current_value === "number" && typeof c.meta_area === "number"
                        ? `${latest.current_value}/${c.meta_area} (${latest.percent ?? "—"}%)`
                        : typeof latest.percent === "number"
                          ? `${latest.percent}%`
                          : "—"
                      : "—"}
                    {latest?.period_end ? ` · reporte ${latest.period_end}` : ""}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/app/aportes/${c.id}`}>Ver detalle</Link>
                </Button>
                <AreaChallengeActions
                  row={{
                    id: c.id,
                    year: c.year,
                    ordinal: c.ordinal ?? null,
                    active: c.active,
                    areaLabel,
                    reto_area: c.reto_area ?? "",
                    indicador_area: c.indicador_area ?? "",
                    meta_area: c.meta_area ?? null,
                    meta_desc: c.meta_desc ?? null,
                    macroLabel: "Macro",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Escritorio: tabla con scroll; mantiene altura mínima aunque no haya filas */}
      <div className="hidden md:block overflow-auto min-h-[320px] max-h-[min(70vh,600px)] rounded-md border border-input">
        <Table className="w-full table-fixed border-collapse">
          <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
            <TableRow>
              <TableHead className="w-[260px]">Área</TableHead>
              <TableHead>Indicador del área</TableHead>
              <TableHead className="w-[200px]">Meta</TableHead>
              <TableHead className="w-[240px]">Estado</TableHead>
              <TableHead className="w-[220px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-[280px] text-center text-muted-foreground align-middle"
                >
                  No hay registros que coincidan con los filtros.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
              const area = Array.isArray(c.areas) ? c.areas[0] : c.areas;
              const areaLabel = area?.name
                ? `Área: ${area.name}${area?.type ? ` (${area.type})` : ""}`
                : "Área";
              const latest = latestById.get(c.id) ?? null;

              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <div className="truncate font-medium" title={area?.name ?? ""}>
                        {area?.name ?? "—"} {area?.type ? `(${area.type})` : ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <div className="truncate font-medium" title={c.indicador_area ?? ""}>
                        {c.indicador_area}
                      </div>
                      <div className="truncate text-xs text-muted-foreground" title={c.reto_area ?? ""}>
                        {c.reto_area}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{c.meta_area ?? "—"}</div>
                      <div className="truncate text-xs text-muted-foreground" title={c.meta_desc ?? ""}>
                        {c.meta_desc ?? "—"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={c.active ? "default" : "secondary"}>
                          {c.active ? "Activo" : "Inactivo"}
                        </Badge>
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
                            {latest.traffic_light === "rojo"
                              ? "No realizado"
                              : latest.traffic_light === "naranja"
                                ? "En proceso"
                                : "Completo"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Sin avances</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {latest?.traffic_light
                          ? typeof latest.current_value === "number" && typeof c.meta_area === "number"
                            ? `${latest.current_value}/${c.meta_area} (${latest.percent ?? "—"}%)`
                            : typeof latest.percent === "number"
                              ? `${latest.percent}%`
                              : "—"
                          : "—"}
                        {latest?.period_end ? ` · reporte ${latest.period_end}` : ""}
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/app/aportes/${c.id}`}>Ver detalle</Link>
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <AreaChallengeActions
                      row={{
                        id: c.id,
                        year: c.year,
                        ordinal: c.ordinal ?? null,
                        active: c.active,
                        macroLabel: "Macro",
                        areaLabel,
                        reto_area: c.reto_area ?? "",
                        indicador_area: c.indicador_area ?? "",
                        meta_area: c.meta_area ?? null,
                        meta_desc: c.meta_desc ?? null,
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            }) )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
