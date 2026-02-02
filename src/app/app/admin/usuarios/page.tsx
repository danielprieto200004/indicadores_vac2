import { adminApproveUser } from "@/app/app/admin/actions";
import { SelectField } from "@/components/app/select-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();

  const { data: areas } = await supabase
    .from("areas")
    .select("id,name,type,active")
    .eq("active", true)
    .order("name");

  const { data: pendingUsers } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .eq("role", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Aprueba registros pendientes y asigna el área correspondiente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendientes</CardTitle>
          <CardDescription>Usuarios que solicitaron acceso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pendingUsers?.length ? (
            <div className="text-sm text-muted-foreground">No hay usuarios pendientes.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                    <TableCell>{u.email ?? "—"}</TableCell>
                    <TableCell>
                      <form action={adminApproveUser} className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
                        <input type="hidden" name="profile_id" value={u.id} />

                        <div className="space-y-1">
                          <Label>Rol</Label>
                          <SelectField
                            name="role"
                            placeholder="Selecciona un rol…"
                            defaultValue="member"
                            required
                            options={[
                              { value: "member", label: "Member" },
                              { value: "admin", label: "Admin" },
                            ]}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label>Área</Label>
                          <SelectField
                            name="area_id"
                            placeholder="Selecciona un área…"
                            required
                            options={(areas ?? []).map((a) => ({
                              value: a.id,
                              label: `${a.name} (${a.type})`,
                            }))}
                          />
                        </div>

                        <Button type="submit" size="sm">
                          Aprobar
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Búsqueda rápida</CardTitle>
          <CardDescription>
            (MVP) De momento solo referencia visual. En fase siguiente: filtros y edición.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="q">Buscar por correo</Label>
            <Input id="q" placeholder="usuario@dominio.edu" disabled />
          </div>
          <div className="flex items-end">
            <Badge variant="secondary">Próximamente</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

