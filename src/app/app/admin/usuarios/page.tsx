import { adminApproveUser } from "@/app/app/admin/actions";
import { UserEditActions } from "@/components/admin/user-edit-actions";
import { SelectField } from "@/components/app/select-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AreaRef = { id: string; name: string; type: string } | null;
type ProfileAreaRow = {
  area_id: string;
  is_primary: boolean;
  areas: AreaRef | AreaRef[];
};

function toUserAreas(pa: ProfileAreaRow[] | null): { area_id: string; area_name: string; area_type: string; is_primary: boolean }[] {
  if (!pa || !Array.isArray(pa)) return [];
  return pa.map((p) => {
    const raw = p.areas;
    const a = Array.isArray(raw) ? raw[0] ?? null : raw;
    return {
      area_id: p.area_id,
      area_name: a?.name ?? "—",
      area_type: a?.type ?? "—",
      is_primary: !!p.is_primary,
    };
  });
}

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

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at,profile_areas(area_id,is_primary,areas(id,name,type))")
    .order("created_at", { ascending: false });

  const areaOptions = (areas ?? []).map((a) => ({ value: a.id, label: `${a.name} (${a.type})` }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Aprueba registros pendientes, edita perfiles y asigna áreas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendientes</CardTitle>
          <CardDescription>Usuarios que solicitaron acceso. Asigna rol y área y aprueba.</CardDescription>
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
                            options={areaOptions}
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
          <CardTitle>Todos los usuarios</CardTitle>
          <CardDescription>
            Listado de usuarios registrados. Usa Editar para cambiar nombre, rol y áreas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Áreas</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(allProfiles ?? []).map((u) => {
                const pa = (u as unknown as { profile_areas?: ProfileAreaRow[] }).profile_areas;
                const userAreas = toUserAreas(pa ?? null);
                const roleLabel = u.role === "admin" ? "Admin" : u.role === "member" ? "Member" : "Pendiente";
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                    <TableCell>{u.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "pending" ? "secondary" : u.role === "admin" ? "default" : "outline"}>
                        {roleLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {userAreas.length
                        ? userAreas.map((a) => `${a.area_name}${a.is_primary ? " (principal)" : ""}`).join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <UserEditActions
                        user={{ id: u.id, full_name: u.full_name, email: u.email, role: u.role }}
                        userAreas={userAreas}
                        areaOptions={areaOptions}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

