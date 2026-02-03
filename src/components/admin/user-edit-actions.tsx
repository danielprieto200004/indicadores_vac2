"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  adminAddUserArea,
  adminDeleteUser,
  adminRemoveUserArea,
  adminSetUserPrimaryArea,
  adminUpdateProfile,
} from "@/app/app/admin/actions";
import { SelectField } from "@/components/app/select-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type UserArea = { area_id: string; area_name: string; area_type: string; is_primary: boolean };

export function UserEditActions({
  user,
  userAreas,
  areaOptions,
}: {
  user: { id: string; full_name: string | null; email: string | null; role: string };
  userAreas: UserArea[];
  areaOptions: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaults = useMemo(
    () => ({
      full_name: user.full_name ?? "",
      role: user.role,
    }),
    [user]
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("profile_id", user.id);
    startTransition(async () => {
      try {
        await adminUpdateProfile(fd);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function setPrimary(areaId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await adminSetUserPrimaryArea(user.id, areaId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function addArea(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("profile_id", user.id);
    const areaId = fd.get("area_id") as string;
    if (!areaId) return;
    startTransition(async () => {
      try {
        await adminAddUserArea(fd);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function removeArea(areaId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await adminRemoveUserArea(user.id, areaId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  const availableAreaOptions = areaOptions.filter(
    (opt) => !userAreas.some((ua) => ua.area_id === opt.value)
  );

  function onDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await adminDeleteUser(user.id);
        setDeleteOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          Editar
        </Button>
        <Button type="button" size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}>
          Eliminar
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Nombre, rol y áreas asignadas. Correo: {user.email ?? "—"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="Nombre"
                defaultValue={defaults.full_name}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <SelectField
                name="role"
                placeholder="Rol…"
                defaultValue={defaults.role}
                required
                options={[
                  { value: "pending", label: "Pendiente" },
                  { value: "member", label: "Member" },
                  { value: "admin", label: "Admin" },
                ]}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Guardando..." : "Guardar perfil"}
              </Button>
            </DialogFooter>
          </form>

          <div className="border-t pt-4 mt-2">
            <div className="text-sm font-medium mb-2">Áreas asignadas</div>
            <ul className="space-y-2">
              {userAreas.map((ua) => (
                <li
                  key={ua.area_id}
                  className="flex items-center justify-between gap-2 rounded border border-input bg-muted/30 px-3 py-2 text-sm"
                >
                  <span>
                    {ua.area_name} ({ua.area_type})
                    {ua.is_primary ? (
                      <span className="ml-2 text-xs text-muted-foreground">(principal)</span>
                    ) : null}
                  </span>
                  <div className="flex items-center gap-1">
                    {!ua.is_primary ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setPrimary(ua.area_id)}
                        disabled={busy}
                      >
                        Principal
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeArea(ua.area_id)}
                      disabled={busy || userAreas.length <= 1}
                    >
                      Quitar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            {availableAreaOptions.length > 0 ? (
              <form onSubmit={addArea} className="mt-3 flex gap-2">
                <select
                  name="area_id"
                  className="flex h-10 w-full min-w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Selecciona un área…</option>
                  {availableAreaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" disabled={busy}>
                  Agregar
                </Button>
              </form>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
            <DialogDescription>
              ¿Eliminar a {user.full_name || user.email || "este usuario"}? Se borrará su cuenta y no podrá volver a entrar. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={onDelete} disabled={busy}>
              {busy ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
