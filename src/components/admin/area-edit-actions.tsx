"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { adminDeleteArea, adminUpdateArea } from "@/app/app/admin/actions";
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

const TYPE_OPTIONS = [
  { value: "direccion", label: "Dirección" },
  { value: "escuela", label: "Escuela" },
  { value: "otro", label: "Otro" },
];

export function AreaEditActions({
  area,
}: {
  area: { id: string; name: string; type: string; active: boolean };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaults = useMemo(
    () => ({
      name: area.name,
      type: area.type,
      active: area.active,
    }),
    [area]
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("id", area.id);
    fd.set("active", (fd.get("active") as string) === "1" ? "1" : "0");
    startTransition(async () => {
      try {
        await adminUpdateArea(fd);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await adminDeleteArea(area.id);
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar área</DialogTitle>
            <DialogDescription>Modifica nombre, tipo y estado activo.</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" placeholder="Nombre del área" defaultValue={defaults.name} required />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <SelectField
                name="type"
                placeholder="Selecciona tipo…"
                defaultValue={defaults.type}
                required
                options={TYPE_OPTIONS}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                name="active"
                value="1"
                defaultChecked={defaults.active}
                className="h-4 w-4 rounded border-input"
              />
              <input type="hidden" name="active" value="0" />
              <Label htmlFor="active" className="cursor-pointer font-normal">
                Área activa
              </Label>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar área</DialogTitle>
            <DialogDescription>
              ¿Eliminar &quot;{area.name}&quot;? Se quitarán las asignaciones de usuarios a esta área y los aportes vinculados. Esta acción no se puede deshacer.
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
