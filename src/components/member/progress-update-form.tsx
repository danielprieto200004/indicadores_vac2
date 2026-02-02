"use client";

import { useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SelectField } from "@/components/app/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProgressUpdate } from "@/app/app/aportes/[id]/actions";

type TrafficLight = "verde" | "naranja" | "rojo";

export function ProgressUpdateForm({
  contributionId,
  areaId,
  metaArea,
  metaDesc,
}: {
  contributionId: string;
  areaId: string;
  metaArea: number | null;
  metaDesc: string | null;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [currentValueText, setCurrentValueText] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const form = e.currentTarget;
      const fd = new FormData(form);

      const updateId = crypto.randomUUID();
      const file = fd.get("evidence_file");
      const filename =
        file instanceof File && file.name ? file.name.replaceAll("\\", "_") : "";

      let evidencePath = "";
      if (file instanceof File && file.size > 0) {
        evidencePath = `${areaId}/${updateId}/${filename}`;
        const { error: upErr } = await supabase.storage
          .from("evidence")
          .upload(evidencePath, file, { upsert: false });
        if (upErr) throw new Error(upErr.message);
      }

      const serverFd = new FormData();
      serverFd.set("id", updateId);
      serverFd.set("contribution_id", contributionId);
      serverFd.set("report_date", String(fd.get("report_date") ?? ""));
      serverFd.set("current_value", String(fd.get("current_value") ?? ""));
      serverFd.set("traffic_light", String(fd.get("traffic_light") ?? "naranja"));
      const comment = String(fd.get("comment") ?? "");
      if (!comment.trim()) {
        throw new Error("La observación es obligatoria.");
      }

      // Si NO hay meta numérica, permitimos percent + semáforo manual.
      if (metaArea === null) {
        serverFd.set("percent", String(fd.get("percent") ?? ""));
        const tl = String(fd.get("traffic_light") ?? "naranja") as TrafficLight;
        void tl;
      }

      serverFd.set("comment", comment);
      if (evidencePath) serverFd.set("evidence_path", evidencePath);

      await createProgressUpdate(serverFd);

      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2 rounded-xl border border-input bg-background p-4 text-sm">
        <div className="text-xs text-muted-foreground">Meta asignada al área</div>
        <div className="mt-1 text-base font-semibold">
          {metaArea ?? "—"}{" "}
          {metaDesc ? <span className="text-sm font-normal text-muted-foreground">— {metaDesc}</span> : null}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Registra tu avance del indicador del área con fecha, semáforo, observación y evidencia.
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="report_date">Fecha de reporte</Label>
        <Input
          id="report_date"
          name="report_date"
          type="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="current_value">
          ¿Cuánto llevas de la meta? (valor)
        </Label>
        <Input
          id="current_value"
          name="current_value"
          type="number"
          step="0.01"
          required={metaArea !== null}
          placeholder={metaArea !== null ? `Ej: si la meta es ${metaArea}, escribe lo alcanzado (p. ej. 0.5)` : "Valor (opcional)"}
          value={currentValueText}
          onChange={(e) => setCurrentValueText(e.target.value)}
        />
        {metaArea !== null ? (
          <p className="text-xs text-muted-foreground">
            Ejemplo: si tu meta es <span className="font-medium">{metaArea}</span> y llevas{" "}
            <span className="font-medium">0.5</span>, entonces escribe <span className="font-medium">0.5</span>.
          </p>
        ) : null}
      </div>

      {metaArea !== null ? (
        <div className="space-y-2">
          <Label>Semáforo</Label>
          <SelectField
            name="traffic_light"
            placeholder="Selecciona un estado…"
            defaultValue="naranja"
            required
            options={[
              { value: "rojo", label: "Rojo — No realizado" },
              { value: "naranja", label: "Naranja — En proceso" },
              { value: "verde", label: "Verde — Completo" },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            Para marcar <span className="font-medium">Completo</span>, el valor debe alcanzar la meta.
          </p>
        </div>
      ) : null}

      {metaArea === null ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="percent">Porcentaje (0–100)</Label>
            <Input id="percent" name="percent" type="number" min={0} max={100} step="0.01" defaultValue={0} />
          </div>
          <div className="space-y-2">
            <Label>Semáforo</Label>
            <SelectField
              name="traffic_light"
              placeholder="Selecciona un estado…"
              defaultValue="naranja"
              required
              options={[
                { value: "rojo", label: "Rojo — No realizado" },
                { value: "naranja", label: "Naranja — En proceso" },
                { value: "verde", label: "Verde — Completo" },
              ]}
            />
          </div>
        </>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="evidence_file">Evidencia (opcional)</Label>
        <Input id="evidence_file" name="evidence_file" type="file" />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="comment">Observación (obligatoria)</Label>
        <Input
          id="comment"
          name="comment"
          required
          placeholder="Describe el avance del periodo, decisiones, soporte o novedades."
        />
      </div>

      {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}

      <div className="md:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Guardando..." : "Reportar avance"}
        </Button>
      </div>
    </form>
  );
}

