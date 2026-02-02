import { adminCreateMacro } from "@/app/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminMacrosPage() {
  const supabase = await createSupabaseServerClient();
  const { data: macros } = await supabase
    .from("macro_challenges")
    .select(
      "id,year,area_responsable_text,reto,indicador,indicator_kind,meta_1_value,meta_1_desc,meta_2_value,meta_2_desc,created_at"
    )
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Retos Macro VAC</h1>
        <p className="text-sm text-muted-foreground">
          Crea los retos estratégicos macro (no se diligencian directamente).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear Reto Macro VAC</CardTitle>
          <CardDescription>
            Define el reto macro y sus metas. Luego podrás asignar los retos del área que aportan a este macro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={adminCreateMacro} className="grid gap-4">
            <div className="rounded-xl border border-input bg-background p-4">
              <div className="text-sm font-semibold">Paso 1 — Información base</div>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="area_responsable_text">Área responsable</Label>
                  <Input
                    id="area_responsable_text"
                    name="area_responsable_text"
                    placeholder="Ej: Vicerrectoría Académica"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Año</Label>
                  <Input id="year" name="year" type="number" defaultValue={new Date().getFullYear()} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="indicator_kind">Tipo de indicador</Label>
                  <select
                    id="indicator_kind"
                    name="indicator_kind"
                    defaultValue="numerico"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="numerico">Numérico</option>
                    <option value="porcentaje">Porcentaje</option>
                  </select>
                  <div className="text-xs text-muted-foreground">
                    Numérico: se reporta valor actual vs meta. Porcentaje: se reporta avance en %.
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="reto">Reto estratégico macro</Label>
                  <Textarea
                    id="reto"
                    name="reto"
                    placeholder="Describe el reto macro (puede ser texto largo)"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="indicador">Indicador macro</Label>
                  <Textarea
                    id="indicador"
                    name="indicador"
                    placeholder="Describe el indicador macro (cómo se mide)"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-input bg-background p-4">
              <div className="text-sm font-semibold">Paso 2 — Metas del año</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Puedes registrar 1 o 2 metas. La descripción ayuda a dar contexto (unidad, alcance, etc.).
              </div>

              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="meta_1_value">Meta 1 (valor)</Label>
                  <Input id="meta_1_value" name="meta_1_value" type="number" step="0.01" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_1_desc">Meta 1 (descripción)</Label>
                  <Input id="meta_1_desc" name="meta_1_desc" placeholder="Ej: Portafolios implementados" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_2_value">Meta 2 (valor)</Label>
                  <Input id="meta_2_value" name="meta_2_value" type="number" step="0.01" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_2_desc">Meta 2 (descripción)</Label>
                  <Input id="meta_2_desc" name="meta_2_desc" placeholder="Opcional" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Al crear el macro, podrás ir a “Retos del área” para asignar aportes.
              </div>
              <Button type="submit">Crear Reto Macro VAC</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Retos Macro VAC registrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Año</TableHead>
                <TableHead>Área responsable</TableHead>
                <TableHead>Reto</TableHead>
                <TableHead>Indicador</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Metas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(macros ?? []).map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.year}</TableCell>
                  <TableCell>{m.area_responsable_text}</TableCell>
                  <TableCell className="max-w-[420px]">{m.reto}</TableCell>
                  <TableCell className="max-w-[420px]">{m.indicador}</TableCell>
                  <TableCell className="text-sm">
                    {m.indicator_kind === "porcentaje" ? "Porcentaje" : "Numérico"}
                  </TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

