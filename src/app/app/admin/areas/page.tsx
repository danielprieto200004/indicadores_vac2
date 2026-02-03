import { adminCreateArea } from "@/app/app/admin/actions";
import { AreaEditActions } from "@/components/admin/area-edit-actions";
import { SelectField } from "@/components/app/select-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminAreasPage() {
  const supabase = await createSupabaseServerClient();
  const { data: areas } = await supabase
    .from("areas")
    .select("id,name,type,active,created_at")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Áreas</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de Direcciones, Escuelas y Otro.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear área</CardTitle>
          <CardDescription>Se usará para asignar usuarios y aportes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={adminCreateArea} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" placeholder="Dirección de ..." required />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <SelectField
                name="type"
                placeholder="Selecciona un tipo…"
                defaultValue="direccion"
                required
                options={[
                  { value: "direccion", label: "Dirección" },
                  { value: "escuela", label: "Escuela" },
                  { value: "otro", label: "Otro" },
                ]}
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">Crear</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Áreas registradas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Activa</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(areas ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.type}</TableCell>
                  <TableCell>{a.active ? "Sí" : "No"}</TableCell>
                  <TableCell>
                    <AreaEditActions area={a} />
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

