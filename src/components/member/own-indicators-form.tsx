"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { createAreaOwnIndicators } from "@/app/app/propios/actions";

type Item = {
  reto_area: string;
  indicador_area: string;
  meta_value: string;
  meta_desc: string;
};

export function OwnIndicatorsForm({ defaultYear }: { defaultYear: number }) {
  const [items, setItems] = useState<Item[]>([
    { reto_area: "", indicador_area: "", meta_value: "", meta_desc: "" },
  ]);
  const canRemove = items.length > 1;
  const yearDefault = useMemo(() => String(defaultYear), [defaultYear]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { reto_area: "", indicador_area: "", meta_value: "", meta_desc: "" },
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <form action={createAreaOwnIndicators} className="grid gap-4">
      <div className="rounded-xl border border-input bg-background p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Crear indicadores propios del área</div>
            <div className="text-xs text-muted-foreground">
              Agrega uno o varios indicadores que son propios de tu área (no asociados al Macro VAC).
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Año</Label>
            <Input id="year" name="year" type="number" defaultValue={yearDefault} className="w-[140px]" />
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Se crearán {items.length} registro(s).
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              Agregar otro
            </Button>
          </div>

          <Accordion type="multiple" className="grid gap-3">
            {items.map((_, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <div className="flex items-stretch gap-2">
                  <div className="min-w-0 flex-1">
                    <AccordionTrigger>
                      <div className="truncate">Indicador #{idx + 1}</div>
                    </AccordionTrigger>
                  </div>
                  <div className="flex items-center pr-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!canRemove}
                      onClick={() => removeItem(idx)}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>

                <AccordionContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Reto del área</Label>
                      <Textarea name="reto_area" placeholder="Describe el reto del área" required />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Indicador del área</Label>
                      <Textarea name="indicador_area" placeholder="Describe el indicador" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Meta (valor)</Label>
                      <Input name="meta_value" type="number" step="0.01" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Meta (descripción)</Label>
                      <Input name="meta_desc" placeholder="Descripción corta (unidad/alcance)" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="flex items-center gap-3">
            <Button type="submit">Guardar</Button>
            <div className="text-xs text-muted-foreground">
              Podrás registrar avances y evidencias en el detalle de cada indicador.
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

