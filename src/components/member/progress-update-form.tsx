"use client";

import { useMemo, useState, type FormEvent, type ChangeEvent } from "react";
import { Plus, X, CheckCircle2, Link as LinkIcon, FileUp } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createProgressUpdate,
  updateProgressUpdate,
} from "@/app/app/aportes/[id]/actions";

type TrafficLight = "verde" | "naranja" | "rojo";

export type ProgressEditData = {
  id: string;
  report_date: string;
  current_value: number | null;
  percent: number;
  traffic_light: TrafficLight;
  comment: string;
  evidence_path: string | null;
  evidence_link: string | null;
};

function parseEvidenceLinks(raw: string | null): string[] {
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return parsed.filter(
          (s: unknown) => typeof s === "string" && (s as string).trim()
        );
    } catch {
      /* plain text fallback */
    }
  }
  return raw.trim() ? [raw.trim()] : [];
}

function serializeEvidenceLinks(links: string[]): string | null {
  const valid = links.filter((l) => l.trim());
  if (valid.length === 0) return null;
  if (valid.length === 1) return valid[0];
  return JSON.stringify(valid);
}

function computePreviewTrafficLight(percent: number): {
  color: TrafficLight;
  label: string;
  bg: string;
  text: string;
  dot: string;
} {
  if (percent >= 80)
    return {
      color: "verde",
      label: "Cumplido",
      bg: "bg-green-50 dark:bg-green-950/30",
      text: "text-green-700 dark:text-green-400",
      dot: "bg-green-500",
    };
  if (percent >= 40)
    return {
      color: "naranja",
      label: "En desarrollo",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-400",
      dot: "bg-amber-500",
    };
  return {
    color: "rojo",
    label: "Requiere atención",
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  };
}

export function ProgressUpdateForm({
  contributionId,
  areaId,
  metaArea,
  metaDesc,
  editData,
  onSuccess,
  compact,
}: {
  contributionId: string;
  areaId: string;
  metaArea: number | null;
  metaDesc: string | null;
  editData?: ProgressEditData;
  onSuccess?: () => void;
  compact?: boolean;
}) {
  const isEdit = !!editData;
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [currentValueText, setCurrentValueText] = useState<string>(
    editData?.current_value != null ? String(editData.current_value) : ""
  );
  const [manualPercent, setManualPercent] = useState<string>(
    editData?.percent != null ? String(editData.percent) : "0"
  );

  const initialLinks = editData ? parseEvidenceLinks(editData.evidence_link) : [];
  const initialEvidenceType: "file" | "link" | "none" = editData
    ? editData.evidence_path
      ? "file"
      : initialLinks.length > 0
        ? "link"
        : "none"
    : "none";
  const [evidenceType, setEvidenceType] = useState<"file" | "link" | "none">(
    initialEvidenceType
  );
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>(
    initialLinks.length > 0 ? initialLinks : [""]
  );

  const hasInput =
    metaArea !== null && metaArea > 0
      ? currentValueText.trim() !== ""
      : manualPercent.trim() !== "" && manualPercent !== "0";

  const previewPercent =
    metaArea !== null && metaArea > 0
      ? currentValueText
        ? Math.min(100, Math.round((Math.max(0, Number(currentValueText)) / metaArea) * 10000) / 100)
        : 0
      : Number(manualPercent) || 0;

  const preview = hasInput ? computePreviewTrafficLight(previewPercent) : null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);

    try {
      const form = e.currentTarget;
      const fd = new FormData(form);

      const updateId = isEdit ? editData.id : crypto.randomUUID();
      const file = fd.get("evidence_file");
      const filename =
        file instanceof File && file.name
          ? file.name.replaceAll("\\", "_")
          : "";

      let evidencePath = isEdit ? editData.evidence_path ?? "" : "";
      let finalEvidenceLink = "";

      if (evidenceType === "file" && file instanceof File && file.size > 0) {
        evidencePath = `${areaId}/${updateId}/${filename}`;
        const { error: upErr } = await supabase.storage
          .from("evidence")
          .upload(evidencePath, file, { upsert: true });
        if (upErr) throw new Error(upErr.message);
      } else if (evidenceType === "file" && isEdit && editData.evidence_path) {
        evidencePath = editData.evidence_path;
      } else if (evidenceType !== "file") {
        evidencePath = "";
      }

      if (evidenceType === "link") {
        const validLinks = evidenceLinks.filter((l) => l.trim());
        for (const l of validLinks) {
          try {
            new URL(l);
          } catch {
            throw new Error(
              `El link "${l}" no es una URL válida (ej: https://...)`
            );
          }
        }
        finalEvidenceLink = serializeEvidenceLinks(validLinks) ?? "";
      }

      const serverFd = new FormData();
      serverFd.set("id", updateId);
      serverFd.set("contribution_id", contributionId);
      serverFd.set("report_date", String(fd.get("report_date") ?? ""));
      serverFd.set("current_value", String(fd.get("current_value") ?? ""));
      const comment = String(fd.get("comment") ?? "");
      if (!comment.trim()) {
        throw new Error("La observación es obligatoria.");
      }

      if (metaArea === null) {
        serverFd.set("percent", String(fd.get("percent") ?? ""));
      }

      serverFd.set("comment", comment);
      if (evidencePath) serverFd.set("evidence_path", evidencePath);
      if (finalEvidenceLink) serverFd.set("evidence_link", finalEvidenceLink);

      if (isEdit) {
        await updateProgressUpdate(serverFd);
        setSuccess("Avance actualizado correctamente.");
      } else {
        await createProgressUpdate(serverFd);
        setSuccess("Avance registrado correctamente.");
        form.reset();
        setCurrentValueText("");
        setManualPercent("0");
        setEvidenceType("none");
        setEvidenceLinks([""]);
      }

      if (onSuccess) {
        setTimeout(onSuccess, 600);
      } else {
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  function addLink() {
    setEvidenceLinks([...evidenceLinks, ""]);
  }

  function removeLink(index: number) {
    setEvidenceLinks(evidenceLinks.filter((_, i) => i !== index));
  }

  function updateLink(index: number, value: string) {
    const next = [...evidenceLinks];
    next[index] = value;
    setEvidenceLinks(next);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      {!compact && (
        <div className="md:col-span-2 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Meta asignada al área
          </div>
          <div className="mt-1 text-base font-semibold">
            {metaArea ?? "—"}{" "}
            {metaDesc ? (
              <span className="text-sm font-normal text-muted-foreground">
                — {metaDesc}
              </span>
            ) : null}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="report_date">Fecha de reporte</Label>
        <Input
          id="report_date"
          name="report_date"
          type="date"
          required
          defaultValue={
            editData?.report_date ?? new Date().toISOString().slice(0, 10)
          }
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
          placeholder={
            metaArea !== null
              ? `Ej: si la meta es ${metaArea}, escribe lo alcanzado`
              : "Valor (opcional)"
          }
          value={currentValueText}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setCurrentValueText(e.target.value)
          }
        />
        {metaArea !== null ? (
          <p className="text-xs text-muted-foreground">
            Meta: <span className="font-medium">{metaArea}</span>. Escribe el
            valor alcanzado hasta ahora.
          </p>
        ) : null}
      </div>

      {metaArea === null ? (
        <div className="space-y-2">
          <Label htmlFor="percent">Porcentaje de avance (0–100)</Label>
          <Input
            id="percent"
            name="percent"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={manualPercent}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setManualPercent(e.target.value)
            }
          />
        </div>
      ) : null}

      {/* Semáforo automático - vista previa */}
      <div className="space-y-2">
        <Label>Semáforo (automático)</Label>
        {preview ? (
          <div className={`flex items-center gap-3 rounded-lg border p-3 ${preview.bg}`}>
            <span className={`h-4 w-4 rounded-full ${preview.dot} shrink-0`} />
            <div className="min-w-0">
              <div className={`text-sm font-semibold ${preview.text}`}>
                {preview.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {previewPercent.toFixed(1)}% de avance
                {previewPercent >= 80
                  ? " — Meta alcanzada o próxima"
                  : previewPercent >= 40
                    ? " — Avance parcial"
                    : " — Avance bajo"}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-dashed p-3 bg-muted/20">
            <span className="h-4 w-4 rounded-full bg-muted-foreground/20 shrink-0" />
            <div className="text-sm text-muted-foreground">
              Ingresa el valor alcanzado para ver el semáforo
            </div>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          Se calcula automáticamente: verde ≥80%, naranja 40-79%, rojo &lt;40%.
        </p>
      </div>

      <div className="space-y-3 md:col-span-2">
        <Label>Evidencia (opcional)</Label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEvidenceType("none");
              setEvidenceLinks([""]);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              evidenceType === "none"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Sin evidencia
          </button>
          <button
            type="button"
            onClick={() => setEvidenceType("file")}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              evidenceType === "file"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            <FileUp className="h-3.5 w-3.5" />
            Subir archivo
          </button>
          <button
            type="button"
            onClick={() => {
              setEvidenceType("link");
              if (evidenceLinks.length === 0 || evidenceLinks.every((l) => !l))
                setEvidenceLinks([""]);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              evidenceType === "link"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Agregar links
          </button>
        </div>

        {evidenceType === "file" && (
          <div className="space-y-2">
            {isEdit && editData.evidence_path && (
              <p className="text-xs text-muted-foreground">
                Archivo actual:{" "}
                <span className="font-medium">
                  {editData.evidence_path.split("/").pop()}
                </span>
                . Sube uno nuevo para reemplazarlo, o déjalo vacío para
                mantenerlo.
              </p>
            )}
            <Input id="evidence_file" name="evidence_file" type="file" />
          </div>
        )}

        {evidenceType === "link" && (
          <div className="space-y-2">
            {evidenceLinks.map((link, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://ejemplo.com/evidencia"
                  value={link}
                  onChange={(e) => updateLink(i, e.target.value)}
                  className="flex-1"
                />
                {evidenceLinks.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeLink(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLink}
              className="gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar otro link
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="comment">Observación (obligatoria)</Label>
        <Textarea
          id="comment"
          name="comment"
          required
          rows={3}
          placeholder="Describe el avance del periodo, decisiones, soporte o novedades."
          defaultValue={editData?.comment ?? ""}
        />
      </div>

      {error ? (
        <div className="md:col-span-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}

      {success ? (
        <div className="md:col-span-2 rounded-lg border border-green-500/50 bg-green-500/10 p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      ) : null}

      <div className="md:col-span-2 flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy
            ? "Guardando..."
            : isEdit
              ? "Actualizar avance"
              : "Reportar avance"}
        </Button>
      </div>
    </form>
  );
}
