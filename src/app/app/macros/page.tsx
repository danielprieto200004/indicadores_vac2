import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MacroRollup = {
  macro_id: string;
  year: number;
  reto: string;
  indicador: string;
  meta_1_value: number | null;
  meta_1_desc: string | null;
  meta_2_value: number | null;
  meta_2_desc: string | null;
  contributions_count: number;
  macro_percent_avg: number | null;
  contributions_with_updates: number;
};

export default async function MacrosPage() {
  const supabase = await createSupabaseServerClient();
  const { data: macros } = await supabase
    .from("vw_macro_rollup")
    .select(
      "macro_id,year,reto,indicador,meta_1_value,meta_1_desc,meta_2_value,meta_2_desc,contributions_count,macro_percent_avg,contributions_with_updates"
    )
    .order("year", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Retos Macro VAC</h1>
        <p className="text-sm text-muted-foreground">
          Avance consolidado (roll-up) calculado desde los aportes de áreas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consolidado</CardTitle>
          <CardDescription>
            \(Avance\) = promedio del último porcentaje reportado por cada aporte activo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!macros?.length ? (
            <div className="text-sm text-muted-foreground">
              Aún no hay retos macro creados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Año</TableHead>
                  <TableHead>Reto macro</TableHead>
                  <TableHead>Indicador</TableHead>
                  <TableHead>Metas</TableHead>
                  <TableHead>Aportes</TableHead>
                  <TableHead>Con avance</TableHead>
                  <TableHead>Avance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(macros as unknown as MacroRollup[]).map((m) => (
                  <TableRow key={m.macro_id}>
                    <TableCell className="font-medium">{m.year}</TableCell>
                    <TableCell className="max-w-[420px]">{m.reto}</TableCell>
                    <TableCell className="max-w-[420px]">{m.indicador}</TableCell>
                    <TableCell className="space-y-1">
                      <div className="text-sm">
                        {m.meta_1_value ?? "—"}{" "}
                        {m.meta_1_desc ? (
                          <span className="text-xs text-muted-foreground">— {m.meta_1_desc}</span>
                        ) : null}
                      </div>
                      {m.meta_2_value !== null || m.meta_2_desc ? (
                        <div className="text-sm">
                          {m.meta_2_value ?? "—"}{" "}
                          {m.meta_2_desc ? (
                            <span className="text-xs text-muted-foreground">— {m.meta_2_desc}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>{m.contributions_count}</TableCell>
                    <TableCell>{m.contributions_with_updates}</TableCell>
                    <TableCell>
                      {typeof m.macro_percent_avg === "number" ? (
                        <Badge variant="secondary">{m.macro_percent_avg.toFixed(2)}%</Badge>
                      ) : (
                        <Badge variant="outline">—</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

