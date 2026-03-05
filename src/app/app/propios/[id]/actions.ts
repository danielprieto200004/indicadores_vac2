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

export async function createOwnUpdate(formData: FormData) {
  const id = asText(formData.get("id"));
  const indicator_id = asText(formData.get("indicator_id"));
  const report_date = asText(formData.get("report_date"));
  const current_value = asNumber(formData.get("current_value"));
  const percent_in = asNumber(formData.get("percent"));
  const traffic_light_in = (asText(formData.get("traffic_light")) || "naranja") as TrafficLight;
  const comment = asText(formData.get("comment"));
  const evidence_path = asText(formData.get("evidence_path")) || null;
  const evidence_link = asText(formData.get("evidence_link")) || null;

  if (!id || !indicator_id || !report_date) {
    throw new Error("Faltan campos obligatorios");
  }
  if (!comment) {
    throw new Error("La observación es obligatoria.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: indicator, error: indErr } = await supabase
    .from("area_own_indicators")
    .select("meta_value")
    .eq("id", indicator_id)
    .maybeSingle();
  if (indErr) throw new Error(indErr.message);

  const meta_value = typeof indicator?.meta_value === "number" ? indicator.meta_value : null;

  let percent = 0;
  let traffic_light: TrafficLight = traffic_light_in;

  if (meta_value !== null && meta_value > 0) {
    if (current_value === null) {
      throw new Error("Debes reportar el valor actual para comparar con la meta.");
    }
    const ratio = Math.max(0, current_value) / meta_value;
    percent = Math.min(100, Math.round(ratio * 10000) / 100);

    if (traffic_light === "verde" && current_value < meta_value) {
      throw new Error("Para marcar 'Completo', el valor reportado debe ser mayor o igual a la meta.");
    }
  } else {
    percent = percent_in ?? 0;
  }

  const { error } = await supabase.from("area_own_updates").insert({
    id,
    indicator_id,
    report_date,
    percent,
    current_value,
    traffic_light,
    comment,
    evidence_path,
    evidence_link,
    created_by: user?.id ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/app/propios/${indicator_id}`);
  revalidatePath(`/app/propios`);
  revalidatePath(`/app`);
}

export async function deleteOwnUpdate(formData: FormData) {
  const update_id = asText(formData.get("update_id"));
  const indicator_id = asText(formData.get("indicator_id"));

  if (!update_id || !indicator_id) {
    throw new Error("Faltan campos obligatorios");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  // Verificar que el usuario tenga permiso (pertenece al área o es admin)
  const { data: update, error: fetchErr } = await supabase
    .from("area_own_updates")
    .select("id,evidence_path,indicator_id,area_own_indicators(area_id)")
    .eq("id", update_id)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);
  if (!update) throw new Error("Avance no encontrado");

  // Verificar permisos: el usuario debe pertenecer al área o ser admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    // Verificar que el usuario pertenezca al área
    const indicator = Array.isArray(update.area_own_indicators)
      ? update.area_own_indicators[0]
      : update.area_own_indicators;
    const areaId = indicator?.area_id;

    if (areaId) {
      const { data: profileArea } = await supabase
        .from("profile_areas")
        .select("area_id")
        .eq("profile_id", user.id)
        .eq("area_id", areaId)
        .maybeSingle();

      if (!profileArea) {
        throw new Error("No tienes permiso para eliminar este avance");
      }
    }
  }

  // Eliminar archivo de evidencia si existe
  if (update.evidence_path) {
    await supabase.storage.from("evidence").remove([update.evidence_path]);
  }

  // Eliminar el avance
  const { error } = await supabase.from("area_own_updates").delete().eq("id", update_id);

  if (error) throw new Error(error.message);

  revalidatePath(`/app/propios/${indicator_id}`);
  revalidatePath(`/app/propios`);
  revalidatePath(`/app`);
}

