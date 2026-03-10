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

function computeTrafficLight(percent: number): TrafficLight {
  if (percent >= 80) return "verde";
  if (percent >= 40) return "naranja";
  return "rojo";
}

export async function createOwnUpdate(formData: FormData) {
  const id = asText(formData.get("id"));
  const indicator_id = asText(formData.get("indicator_id"));
  const report_date = asText(formData.get("report_date"));
  const current_value = asNumber(formData.get("current_value"));
  const percent_in = asNumber(formData.get("percent"));
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

  if (meta_value !== null && meta_value > 0) {
    if (current_value === null) {
      throw new Error("Debes reportar el valor actual para comparar con la meta.");
    }
    const ratio = Math.max(0, current_value) / meta_value;
    percent = Math.min(100, Math.round(ratio * 10000) / 100);
  } else {
    percent = percent_in ?? 0;
  }

  const traffic_light = computeTrafficLight(percent);

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

export async function updateOwnUpdate(formData: FormData) {
  const id = asText(formData.get("id"));
  const indicator_id = asText(formData.get("indicator_id"));
  const report_date = asText(formData.get("report_date"));
  const current_value = asNumber(formData.get("current_value"));
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
  if (!user) throw new Error("No autenticado");

  const { data: existing, error: fetchErr } = await supabase
    .from("area_own_updates")
    .select("id,indicator_id,area_own_indicators(area_id)")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);
  if (!existing) throw new Error("Avance no encontrado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    const indicator = Array.isArray(existing.area_own_indicators)
      ? existing.area_own_indicators[0]
      : existing.area_own_indicators;
    const areaId = indicator?.area_id;
    if (areaId) {
      const { data: profileArea } = await supabase
        .from("profile_areas")
        .select("area_id")
        .eq("profile_id", user.id)
        .eq("area_id", areaId)
        .maybeSingle();
      if (!profileArea) {
        throw new Error("No tienes permiso para editar este avance");
      }
    }
  }

  const { data: ind, error: indErr } = await supabase
    .from("area_own_indicators")
    .select("meta_value")
    .eq("id", indicator_id)
    .maybeSingle();
  if (indErr) throw new Error(indErr.message);

  const meta_value =
    typeof ind?.meta_value === "number" ? ind.meta_value : null;

  let percent = 0;

  if (meta_value !== null && meta_value > 0) {
    if (current_value === null) {
      throw new Error("Debes reportar el valor actual para comparar con la meta.");
    }
    const ratio = Math.max(0, current_value) / meta_value;
    percent = Math.min(100, Math.round(ratio * 10000) / 100);
  } else {
    percent = asNumber(formData.get("percent")) ?? 0;
  }

  const traffic_light = computeTrafficLight(percent);

  const { error } = await supabase
    .from("area_own_updates")
    .update({
      report_date,
      percent,
      current_value,
      traffic_light,
      comment,
      evidence_path,
      evidence_link,
    })
    .eq("id", id);

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

  const { data: update, error: fetchErr } = await supabase
    .from("area_own_updates")
    .select("id,evidence_path,indicator_id,area_own_indicators(area_id)")
    .eq("id", update_id)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);
  if (!update) throw new Error("Avance no encontrado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
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

  if (update.evidence_path) {
    await supabase.storage.from("evidence").remove([update.evidence_path]);
  }

  const { error } = await supabase.from("area_own_updates").delete().eq("id", update_id);

  if (error) throw new Error(error.message);

  revalidatePath(`/app/propios/${indicator_id}`);
  revalidatePath(`/app/propios`);
  revalidatePath(`/app`);
}
