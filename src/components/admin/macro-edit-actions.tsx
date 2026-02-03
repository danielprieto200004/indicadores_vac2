"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { adminDeleteMacro, adminUpdateMacro } from "@/app/app/admin/actions";
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
import { Textarea } from "@/components/ui/textarea";

export type MacroRow = {
  id: string;
  year: number;
  area_responsable_text: string;
  reto: string;
  indicador: string;
  indicator_kind: string | null;
  meta_1_value: number | null;
  meta_1_desc: string | null;
  meta_2_value: number | null;
  meta_2_desc: string | null;
};

export function MacroEditActions({ macro }: { macro: MacroRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaults = useMemo(
    () => ({
      area_responsable_text: macro.area_responsable_text ?? "",
      year: macro.year,
      reto: macro.reto ?? "",
      indicador: macro.indicador ?? "",
      indicator_kind: macro.indicator_kind === "porcentaje" ? "porcentaje" : "numerico",
      meta_1_value: macro.meta_1_value ?? "",
      meta_1_desc: macro.meta_1_desc ?? "",
      meta_2_value: macro.meta_2_value ?? "",
      meta_2_desc: macro.meta_2_desc ?? "",
    }),
    [macro]
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("id", macro.id);
    startTransition(async () => {
      try {
        await adminUpdateMacro(fd);
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
        await adminDeleteMacro(macro.id);
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar reto macro VAC</DialogTitle>
            <DialogDescription>Modifica la información del reto macro.</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="area_responsable_text">Área responsable</Label>
                <Input
                  id="area_responsable_text"
                  name="area_responsable_text"
                  placeholder="Ej: Vicerrectoría Académica"
                  defaultValue={defaults.area_responsable_text}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Año</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  defaultValue={defaults.year}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="indicator_kind">Tipo de indicador</Label>
              <select
                id="indicator_kind"
                name="indicator_kind"
                defaultValue={defaults.indicator_kind}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="numerico">Numérico</option>
                <option value="porcentaje">Porcentaje</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reto">Reto estratégico macro</Label>
              <Textarea
                id="reto"
                name="reto"
                placeholder="Describe el reto macro"
                defaultValue={defaults.reto}
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="indicador">Indicador macro</Label>
              <Textarea
                id="indicador"
                name="indicador"
                placeholder="Cómo se mide"
                defaultValue={defaults.indicador}
                required
                rows={3}
              />
            </div>

            <div className="rounded-lg border border-input bg-muted/30 p-4">
              <div className="text-sm font-medium mb-3">Metas del año</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="meta_1_value">Meta 1 (valor)</Label>
                  <Input
                    id="meta_1_value"
                    name="meta_1_value"
                    type="number"
                    step="0.01"
                    defaultValue={defaults.meta_1_value}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_1_desc">Meta 1 (descripción)</Label>
                  <Input id="meta_1_desc" name="meta_1_desc" defaultValue={defaults.meta_1_desc} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_2_value">Meta 2 (valor)</Label>
                  <Input
                    id="meta_2_value"
                    name="meta_2_value"
                    type="number"
                    step="0.01"
                    defaultValue={defaults.meta_2_value}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_2_desc">Meta 2 (descripción)</Label>
                  <Input id="meta_2_desc" name="meta_2_desc" defaultValue={defaults.meta_2_desc} />
                </div>
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar reto macro</DialogTitle>
            <DialogDescription>
              ¿Eliminar este reto macro? Se eliminarán también todos los aportes (retos del área) vinculados. Esta acción no se puede deshacer.
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
