import Link from "next/link";
import { redirect } from "next/navigation";

import { OwnIndicatorsForm } from "@/components/member/own-indicators-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Latest = {
  indicator_id: string;
  percent: number | null;
  traffic_light: "verde" | "naranja" | "rojo" | null;
  report_date: string | null;
  current_value: number | null;
};

type JoinedArea = { name: string; type: string } | { name: string; type: string }[] | null;
type Row = {
  id: string;
  year: number;
  ordinal: number;
  reto_area: string;
  indicador_area: string;
  meta_value: number | null;
  meta_desc: string | null;
  area_id: string;
  areas: JoinedArea;
};

export default async function OwnIndicatorsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  if (profile?.role === "admin") {
    redirect("/app");
  }

  const { data: indicators } = await supabase
    .from("area_own_indicators")
    .select("id,year,ordinal,reto_area,indicador_area,meta_value,meta_desc,area_id,areas(name,type)")
    .eq("active", true)
    .order("year", { ascending: false })
    .order("ordinal", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = (indicators ?? []) as Row[];
  const ids = rows.map((r) => r.id);

  const { data: latestRows } = ids.length
    ? await supabase
        .from("vw_area_own_latest")
        .select("indicator_id,percent,traffic_light,report_date,current_value")
        .in("indicator_id", ids)
    : { data: [] as Latest[] };

  const latestById = new Map<string, Latest>();
  (latestRows ?? []).forEach((r) => latestById.set((r as Latest).indicator_id, r as Latest));

  const firstArea = rows.length ? (Array.isArray(rows[0].areas) ? rows[0].areas[0] : rows[0].areas) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Indicadores propios del área</h1>
        <p className="text-sm text-muted-foreground">
          Crea y da seguimiento a indicadores propios (no asociados a Retos Macro VAC).
        </p>
        {firstArea?.name ? (
          <div className="mt-2">
            <Badge variant="secondary">
              Área: {firstArea.name} {firstArea.type ? `(${firstArea.type})` : ""}
            </Badge>
          </div>
        ) : null}
      </div>

      <OwnIndicatorsForm defaultYear={new Date().getFullYear()} />

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Tus indicadores propios registrados.</CardDescription>
        </CardHeader>
        <CardContent>
          {!rows.length ? (
            <div className="text-sm text-muted-foreground">Aún no has creado indicadores propios.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Año</TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Indicador</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Último avance</TableHead>
                  <TableHead>Semáforo</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const latest = latestById.get(r.id) ?? null;
                  const traffic = latest?.traffic_light ?? null;
                  const current = typeof latest?.current_value === "number" ? latest.current_value : null;
                  const meta = typeof r.meta_value === "number" ? r.meta_value : null;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.year}</TableCell>
                      <TableCell>{r.ordinal}</TableCell>
                      <TableCell className="max-w-[420px]">
                        <Link href={`/app/propios/${r.id}`} className="font-medium underline underline-offset-4">
                          {r.indicador_area}
                        </Link>
                        <div className="text-xs text-muted-foreground">{r.reto_area}</div>
                      </TableCell>
                      <TableCell>
                        <div>{r.meta_value ?? "—"}</div>
                        {r.meta_desc ? <div className="text-xs text-muted-foreground">{r.meta_desc}</div> : null}
                      </TableCell>
                      <TableCell>
                        {meta !== null && current !== null ? (
                          <div className="font-medium">
                            {current}/{meta}
                          </div>
                        ) : typeof latest?.percent === "number" ? (
                          `${latest.percent}%`
                        ) : (
                          "—"
                        )}
                        {latest?.report_date ? (
                          <div className="text-xs text-muted-foreground">Reporte: {latest.report_date}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {traffic ? (
                          <Badge
                            variant={
                              traffic === "rojo"
                                ? "destructive"
                                : traffic === "naranja"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {traffic === "rojo"
                              ? "No realizado"
                              : traffic === "naranja"
                                ? "En proceso"
                                : "Completo"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Sin avances</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/app/propios/${r.id}`}
                          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90"
                        >
                          Registrar avance
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

