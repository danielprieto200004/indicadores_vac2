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

type IndicatorItem = {
  indicador_area: string;
  meta_area: string;
  meta_desc: string;
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function AreaStrategicChallengesForm({
  macroOptions,
  areaOptions,
  defaultYear,
}: {
  macroOptions: MacroOption[];
  areaOptions: AreaOption[];
  defaultYear: number;
}) {
  const [retoArea, setRetoArea] = useState("");
  const [indicators, setIndicators] = useState<IndicatorItem[]>([
    { indicador_area: "", meta_area: "", meta_desc: "" },
  ]);

  const canRemoveIndicator = indicators.length > 1;

  const yearDefault = useMemo(() => String(defaultYear), [defaultYear]);

  function addIndicator() {
    setIndicators((prev) => [
      ...prev,
      { indicador_area: "", meta_area: "", meta_desc: "" },
    ]);
  }

  function removeIndicator(idx: number) {
    setIndicators((prev) => prev.filter((_, i) => i !== idx));
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
              <Label htmlFor="area_id">Área</Label>
              <select
                id="area_id"
                name="area_id"
                required
                className={selectClassName}
              >
                <option value="">Selecciona un área…</option>
                {areaOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Input id="year" name="year" type="number" defaultValue={yearDefault} />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Luego define un reto del área y sus indicadores (puede ser uno o varios).
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-input bg-background p-4">
        <div className="text-sm font-semibold">Paso 2 — Reto del área e indicadores</div>
        <div className="mt-3 space-y-2">
          <Label htmlFor="reto_area">Reto del área (común a todos los indicadores)</Label>
          <Textarea
            id="reto_area"
            name="reto_area"
            placeholder="Describe el reto del área (ej.: Reducir tiempos de respuesta)"
            required
            value={retoArea}
            onChange={(e) => setRetoArea(e.target.value)}
          />
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Agrega uno o varios indicadores para este reto. Cada indicador tendrá su propia meta y seguimiento.
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium">Indicadores del área</span>
          <Button type="button" variant="outline" size="sm" onClick={addIndicator}>
            Agregar otro indicador
          </Button>
        </div>

        <div className="mt-4 grid gap-4">
          <Accordion type="multiple" className="grid gap-3">
            {indicators.map((_, idx) => (
              <AccordionItem key={idx} value={`indicator-${idx}`}>
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
                      disabled={!canRemoveIndicator}
                      onClick={() => removeIndicator(idx)}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
                <AccordionContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Nombre del indicador</Label>
                      <Textarea
                        name="indicador_area"
                        placeholder="Ej.: % de solicitudes resueltas en &lt; 24 h"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Meta (valor numérico)</Label>
                      <Input name="meta_area" type="number" step="0.01" placeholder="0" />
                    </div>

                    <div className="space-y-2">
                      <Label>Meta (descripción corta)</Label>
                      <Input name="meta_desc" placeholder="Ej.: 90% en el año" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">Guardar reto e indicadores</Button>
        <div className="text-xs text-muted-foreground">
          Se creará 1 reto del área con {indicators.length} indicador(es) ({indicators.length} registro(s) en total).
        </div>
      </div>
    </form>
  );
}
