"use client";

import { useMemo, useState } from "react";

import { SelectField } from "@/components/app/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { adminCreateAreaChallenges } from "@/app/app/admin/actions";

type MacroOption = { value: string; label: string };
type AreaOption = { value: string; label: string };

type Item = {
  reto_area: string;
  indicador_area: string;
  meta_area: string;
  meta_desc: string;
};

export function AreaStrategicChallengesForm({
  macroOptions,
  areaOptions,
  defaultYear,
}: {
  macroOptions: MacroOption[];
  areaOptions: AreaOption[];
  defaultYear: number;
}) {
  const [items, setItems] = useState<Item[]>([
    { reto_area: "", indicador_area: "", meta_area: "", meta_desc: "" },
  ]);

  const canRemove = items.length > 1;

  const yearDefault = useMemo(() => String(defaultYear), [defaultYear]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { reto_area: "", indicador_area: "", meta_area: "", meta_desc: "" },
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <form action={adminCreateAreaChallenges} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-input bg-background p-4 md:col-span-2">
          <div className="text-sm font-semibold">Paso 1 — Selección</div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Reto macro</Label>
              <SelectField
                name="macro_id"
                placeholder="Selecciona un reto macro…"
                required
                options={macroOptions}
              />
            </div>

            <div className="space-y-2">
              <Label>Área</Label>
              <SelectField
                name="area_id"
                placeholder="Selecciona un área…"
                required
                options={areaOptions}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Input id="year" name="year" type="number" defaultValue={yearDefault} />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Siguiente: agrega uno o más retos estratégicos del área vinculados a este reto macro.
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-input bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Paso 2 — Retos del área</div>
            <div className="text-xs text-muted-foreground">
              Agrega uno o varios retos del área. Usa “Quitar” si agregaste uno por error.
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            Agregar otro reto estratégico
          </Button>
        </div>

        <div className="mt-4 grid gap-4">
          <Accordion type="multiple" className="grid gap-3">
            {items.map((_, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <div className="flex items-stretch gap-2">
                  <div className="min-w-0 flex-1">
                    <AccordionTrigger>
                      <div className="truncate">Reto #{idx + 1}</div>
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
                      <Textarea
                        name="reto_area"
                        placeholder="Describe el reto del área (texto más amplio si lo necesitas)"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Indicador del área</Label>
                      <Textarea
                        name="indicador_area"
                        placeholder="Indicador asociado (puede ser texto largo)"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Meta del área (valor)</Label>
                      <Input name="meta_area" type="number" step="0.01" placeholder="0" />
                    </div>

                    <div className="space-y-2">
                      <Label>Meta del área (descripción)</Label>
                      <Input name="meta_desc" placeholder="Descripción corta de la meta" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">Guardar retos del área</Button>
        <div className="text-xs text-muted-foreground">
          Se crearán {items.length} registro(s).
        </div>
      </div>
    </form>
  );
}

