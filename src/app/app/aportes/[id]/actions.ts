"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type TrafficLight = "verde" | "naranja" | "rojo";

function asText(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

function asNumber(v: FormDataEntryValue | null) {
  const s = asText(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function createProgressUpdate(formData: FormData) {
  const id = asText(formData.get("id"));
  const contribution_id = asText(formData.get("contribution_id"));
  // En UI usamos una sola "fecha de reporte".
  // Por compatibilidad con el esquema, guardamos period_start = period_end = report_date.
  const report_date = asText(formData.get("report_date"));
  const current_value = asNumber(formData.get("current_value"));
  const traffic_light_in = (asText(formData.get("traffic_light")) ||
    "naranja") as TrafficLight;
  const comment = asText(formData.get("comment"));
  const evidence_path = asText(formData.get("evidence_path")) || null;

  if (!id || !contribution_id || !report_date) {
    throw new Error("Faltan campos obligatorios");
  }

  if (!comment) {
    throw new Error("La observación es obligatoria.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Traemos la meta asignada al área (para cálculo automático)
  const { data: contribution, error: contribErr } = await supabase
    .from("area_contributions")
    .select("meta_area")
    .eq("id", contribution_id)
    .maybeSingle();

  if (contribErr) throw new Error(contribErr.message);

  const meta_area =
    typeof contribution?.meta_area === "number" ? contribution.meta_area : null;

  // Cálculo automático:
  // - semáforo según avance respecto a meta (si existe)
  // - percent calculado si existe meta y es > 0
  let traffic_light: TrafficLight = "naranja";
  let percent = 0;

  if (meta_area !== null && meta_area > 0) {
    if (current_value === null) {
      throw new Error("Debes reportar el valor actual para comparar con la meta.");
    }
    const ratio = Math.max(0, current_value) / meta_area;
    percent = Math.min(100, Math.round(ratio * 10000) / 100); // 2 decimales

    // Permitimos que el usuario seleccione el estado (mejor UX),
    // pero validamos coherencia mínima:
    // - "Completo" requiere alcanzar la meta.
    // - "No realizado" exige observación.
    traffic_light = traffic_light_in;
    if (traffic_light === "verde" && current_value < meta_area) {
      throw new Error("Para marcar 'Completo', el valor reportado debe ser mayor o igual a la meta.");
    }
  } else {
    // Sin meta numérica: aceptamos percent como input opcional (si viene)
    percent = asNumber(formData.get("percent")) ?? 0;
    traffic_light = traffic_light_in;
  }

  const { error } = await supabase.from("progress_updates").insert({
    id,
    contribution_id,
    period_start: report_date,
    period_end: report_date,
    percent,
    current_value,
    traffic_light,
    comment,
    evidence_path,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/app/aportes/${contribution_id}`);
  revalidatePath(`/app/aportes`);
  revalidatePath(`/app`);
  revalidatePath(`/app/macros`);
}

