"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { adminSetAreaChallengeActive, adminUpdateAreaChallenge } from "@/app/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AreaChallengeActions({
  row,
}: {
  row: {
    id: string;
    year: number;
    ordinal: number | null;
    active: boolean;
    macroLabel: string;
    areaLabel: string;
    reto_area: string;
    indicador_area: string;
    meta_area: number | null;
    meta_desc: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaults = useMemo(
    () => ({
      ordinal: row.ordinal ?? 1,
      reto_area: row.reto_area,
      indicador_area: row.indicador_area,
      meta_area: row.meta_area ?? "",
      meta_desc: row.meta_desc ?? "",
    }),
    [row]
  );

  function toggleActive() {
    setError(null);
    startTransition(async () => {
      try {
        await adminSetAreaChallengeActive(row.id, !row.active);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("id", row.id);
    startTransition(async () => {
      try {
        await adminUpdateAreaChallenge(fd);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Editar
      </Button>
      <Button
        type="button"
        size="sm"
        variant={row.active ? "secondary" : "default"}
        onClick={toggleActive}
        disabled={busy}
      >
        {row.active ? "Desactivar" : "Activar"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar reto del área</DialogTitle>
            <DialogDescription>
              {row.macroLabel} · {row.areaLabel} · {row.year}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ordinal">Orden (#)</Label>
                <Input id="ordinal" name="ordinal" type="number" min={1} defaultValue={defaults.ordinal} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_area">Meta (valor)</Label>
                <Input id="meta_area" name="meta_area" type="number" step="0.01" defaultValue={String(defaults.meta_area)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reto_area">Reto del área</Label>
              <Textarea id="reto_area" name="reto_area" defaultValue={defaults.reto_area} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="indicador_area">Indicador del área</Label>
              <Textarea id="indicador_area" name="indicador_area" defaultValue={defaults.indicador_area} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_desc">Meta (descripción)</Label>
              <Input id="meta_desc" name="meta_desc" defaultValue={defaults.meta_desc} />
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
    </div>
  );
}

