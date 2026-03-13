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

function parseEvidencePaths(raw: string | null): string[] {
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

export async function createProgressUpdate(formData: FormData) {
  const id = asText(formData.get("id"));
  const contribution_id = asText(formData.get("contribution_id"));
  const report_date = asText(formData.get("report_date"));
  const current_value = asNumber(formData.get("current_value"));
  const comment = asText(formData.get("comment"));
  const evidence_path = asText(formData.get("evidence_path")) || null;
  const evidence_link = asText(formData.get("evidence_link")) || null;

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

  const { data: contribution, error: contribErr } = await supabase
    .from("area_contributions")
    .select("meta_area")
    .eq("id", contribution_id)
    .maybeSingle();

  if (contribErr) throw new Error(contribErr.message);

  const meta_area =
    typeof contribution?.meta_area === "number" ? contribution.meta_area : null;

  let percent = 0;

  if (meta_area !== null && meta_area > 0) {
    if (current_value === null) {
      throw new Error("Debes reportar el valor actual para comparar con la meta.");
    }
    const ratio = Math.max(0, current_value) / meta_area;
    percent = Math.min(100, Math.round(ratio * 10000) / 100);
  } else {
    percent = asNumber(formData.get("percent")) ?? 0;
  }

  const traffic_light = computeTrafficLight(percent);

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
    evidence_link,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/app/aportes/${contribution_id}`);
  revalidatePath(`/app/aportes`);
  revalidatePath(`/app`);
  revalidatePath(`/app/macros`);
}

export async function updateProgressUpdate(formData: FormData) {
  const id = asText(formData.get("id"));
  const contribution_id = asText(formData.get("contribution_id"));
  const report_date = asText(formData.get("report_date"));
  const current_value = asNumber(formData.get("current_value"));
  const comment = asText(formData.get("comment"));
  const evidence_path = asText(formData.get("evidence_path")) || null;
  const evidence_link = asText(formData.get("evidence_link")) || null;

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
  if (!user) throw new Error("No autenticado");

  const { data: existing, error: fetchErr } = await supabase
    .from("progress_updates")
    .select("id,contribution_id,area_contributions(area_id)")
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
    const contrib = Array.isArray(existing.area_contributions)
      ? existing.area_contributions[0]
      : existing.area_contributions;
    const areaId = contrib?.area_id;
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

  const { data: contribution, error: contribErr } = await supabase
    .from("area_contributions")
    .select("meta_area")
    .eq("id", contribution_id)
    .maybeSingle();

  if (contribErr) throw new Error(contribErr.message);

  const meta_area =
    typeof contribution?.meta_area === "number" ? contribution.meta_area : null;

  let percent = 0;

  if (meta_area !== null && meta_area > 0) {
    if (current_value === null) {
      throw new Error("Debes reportar el valor actual para comparar con la meta.");
    }
    const ratio = Math.max(0, current_value) / meta_area;
    percent = Math.min(100, Math.round(ratio * 10000) / 100);
  } else {
    percent = asNumber(formData.get("percent")) ?? 0;
  }

  const traffic_light = computeTrafficLight(percent);

  const { error } = await supabase
    .from("progress_updates")
    .update({
      period_start: report_date,
      period_end: report_date,
      percent,
      current_value,
      traffic_light,
      comment,
      evidence_path,
      evidence_link,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/app/aportes/${contribution_id}`);
  revalidatePath(`/app/aportes`);
  revalidatePath(`/app`);
  revalidatePath(`/app/macros`);
}

export async function deleteProgressUpdate(formData: FormData) {
  const update_id = asText(formData.get("update_id"));
  const contribution_id = asText(formData.get("contribution_id"));

  if (!update_id || !contribution_id) {
    throw new Error("Faltan campos obligatorios");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  const { data: update, error: fetchErr } = await supabase
    .from("progress_updates")
    .select("id,evidence_path,contribution_id,area_contributions(area_id)")
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
    const contribution = Array.isArray(update.area_contributions)
      ? update.area_contributions[0]
      : update.area_contributions;
    const areaId = contribution?.area_id;

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
    const paths = parseEvidencePaths(update.evidence_path);
    if (paths.length) {
      await supabase.storage.from("evidence").remove(paths);
    }
  }

  const { error } = await supabase.from("progress_updates").delete().eq("id", update_id);

  if (error) throw new Error(error.message);

  revalidatePath(`/app/aportes/${contribution_id}`);
  revalidatePath(`/app/aportes`);
  revalidatePath(`/app`);
  revalidatePath(`/app/macros`);
}
