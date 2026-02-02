import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaStrategicChallengesForm } from "@/components/admin/area-strategic-challenges-form";
import { AreaChallengeActions } from "@/components/admin/area-challenge-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Latest = {
  contribution_id: string;
  percent: number | null;
  traffic_light: "verde" | "naranja" | "rojo" | null;
  period_end: string | null;
  current_value: number | null;
};

function asSearch(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

export default async function AdminContributionsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const q = asSearch(sp.q);
  const onlyActive = asSearch(sp.onlyActive);

  const supabase = await createSupabaseServerClient();

  const { data: macros, error: macrosError } = await supabase
    .from("macro_challenges")
    .select("id,year,reto")
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: areas } = await supabase
    .from("areas")
    .select("id,name,type,active")
    .eq("active", true)
    .order("name");

  const { data: contributions } = await supabase
    .from("area_contributions")
    .select(
      "id,year,ordinal,reto_area,indicador_area,meta_area,meta_desc,active,areas(name,type),macro_challenges(reto)"
    )
    .order("year", { ascending: false })
    .order("ordinal", { ascending: true })
    .order("created_at", { ascending: false });

  const filtered = (contributions ?? []).filter((c) => {
    if (onlyActive === "1" && !c.active) return false;
    if (!q) return true;
    const area = Array.isArray(c.areas) ? c.areas[0] : c.areas;
    const hay = [
      area?.name ?? "",
      area?.type ?? "",
      c.reto_area ?? "",
      c.indicador_area ?? "",
      c.meta_desc ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const ids = filtered.map((c) => c.id);
  const { data: latestRows } = ids.length
    ? await supabase
        .from("vw_contribution_latest")
        .select("contribution_id,percent,traffic_light,period_end,current_value")
        .in("contribution_id", ids)
    : { data: [] as Latest[] };

  const latestById = new Map<string, Latest>();
  (latestRows ?? []).forEach((r) => latestById.set((r as Latest).contribution_id, r as Latest));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Retos estratégicos del área</h1>
        <p className="text-sm text-muted-foreground">
          Asigna los retos estratégicos que cada área aporta a un reto macro. (No todas las áreas aportan a todos los macros.)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear retos del área</CardTitle>
          <CardDescription>
            Selecciona el reto macro y agrega uno o más retos del área (con indicador, meta y descripción de meta).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!macros?.length ? (
            <div className="mb-4 rounded-lg border border-input bg-background p-4 text-sm">
              <div className="font-medium">No aparecen retos macro en la lista</div>
              <div className="mt-1 text-muted-foreground">
                {macrosError
                  ? `Error consultando macro_challenges: ${macrosError.message}`
                  : "No hay registros o tu sesión no tiene permisos de lectura (RLS)."}
              </div>
              <div className="mt-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/admin/macros">Ir a crear/ver retos macro</Link>
                </Button>
              </div>
            </div>
          ) : null}
          <AreaStrategicChallengesForm
            macroOptions={(macros ?? []).map((m) => ({ value: m.id, label: `${m.year} — ${m.reto}` }))}
            areaOptions={(areas ?? []).map((a) => ({ value: a.id, label: `${a.name} (${a.type})` }))}
            defaultYear={new Date().getFullYear()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>
            Retos estratégicos del área registrados. Usa los filtros para ubicar rápido un registro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="mb-4 grid gap-3 rounded-xl border border-input bg-background p-4 md:grid-cols-12">
            <div className="md:col-span-9">
              <div className="text-xs font-medium text-muted-foreground">Buscar</div>
              <Input
                name="q"
                placeholder="Área, reto, indicador…"
                defaultValue={q ?? ""}
                className="mt-1"
              />
            </div>
            <div className="flex items-end gap-2 md:col-span-3">
              <input type="hidden" name="onlyActive" value={onlyActive ?? ""} />
              <Button type="submit" className="w-full md:w-auto">
                Aplicar
              </Button>
              <Button asChild variant="outline" className="w-full md:w-auto">
                <Link href="/app/admin/aportes">Limpiar</Link>
              </Button>
            </div>

            <div className="md:col-span-12">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Mostrando: {filtered.length}</Badge>
                <Button asChild size="sm" variant={onlyActive === "1" ? "default" : "outline"}>
                  <Link
                    href={{
                      pathname: "/app/admin/aportes",
                      query: { ...(q ? { q } : {}), onlyActive: "1" },
                    }}
                  >
                    Solo activos
                  </Link>
                </Button>
                <Button asChild size="sm" variant={onlyActive !== "1" ? "default" : "outline"}>
                  <Link
                    href={{
                      pathname: "/app/admin/aportes",
                      query: { ...(q ? { q } : {}), onlyActive: "" },
                    }}
                  >
                    Todos
                  </Link>
                </Button>
              </div>
            </div>
          </form>

          {/* Móvil: tarjetas (evita scroll horizontal) */}
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
                      <div className="mt-1 text-xs text-muted-foreground line-clamp-2" title={c.reto_area}>
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
                        active: Boolean(c.active),
                        areaLabel,
                        reto_area: c.reto_area,
                        indicador_area: c.indicador_area,
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

          {/* Escritorio: tabla compacta (sin desbordar) */}
          <div className="hidden md:block">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">Área</TableHead>
                  <TableHead>Indicador del área</TableHead>
                  <TableHead className="w-[200px]">Meta</TableHead>
                  <TableHead className="w-[240px]">Estado</TableHead>
                  <TableHead className="w-[220px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
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
                          <div className="truncate font-medium" title={c.indicador_area}>
                            {c.indicador_area}
                          </div>
                          <div className="truncate text-xs text-muted-foreground" title={c.reto_area}>
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
                            active: Boolean(c.active),
                            macroLabel: "Macro",
                            areaLabel,
                            reto_area: c.reto_area,
                            indicador_area: c.indicador_area,
                            meta_area: c.meta_area ?? null,
                            meta_desc: c.meta_desc ?? null,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

