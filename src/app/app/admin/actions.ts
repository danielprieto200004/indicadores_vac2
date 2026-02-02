"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function asText(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

function asNumberOrNull(v: FormDataEntryValue | null) {
  const s = asText(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function asIntOrNull(v: FormDataEntryValue | null) {
  const n = asNumberOrNull(v);
  if (n === null) return null;
  return Math.trunc(n);
}

export async function adminCreateArea(formData: FormData) {
  const name = asText(formData.get("name"));
  const type = asText(formData.get("type"));
  if (!name || !type) throw new Error("Faltan campos");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("areas").insert({ name, type });
  if (error) throw new Error(error.message);

  revalidatePath("/app/admin/areas");
}

export async function adminCreateMacro(formData: FormData) {
  const area_responsable_text = asText(formData.get("area_responsable_text"));
  const reto = asText(formData.get("reto"));
  const indicador = asText(formData.get("indicador"));
  const indicator_kind_in = asText(formData.get("indicator_kind")) || "numerico";
  const indicator_kind = indicator_kind_in === "porcentaje" ? "porcentaje" : "numerico";
  const meta_1_value = asNumberOrNull(formData.get("meta_1_value"));
  const meta_1_desc = asText(formData.get("meta_1_desc")) || null;
  const meta_2_value = asNumberOrNull(formData.get("meta_2_value"));
  const meta_2_desc = asText(formData.get("meta_2_desc")) || null;
  const year = asIntOrNull(formData.get("year")) ?? new Date().getFullYear();
  if (!area_responsable_text || !reto || !indicador) throw new Error("Faltan campos");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = {
    area_responsable_text,
    reto,
    indicador,
    indicator_kind,
    meta_1_value,
    meta_1_desc,
    meta_2_value,
    meta_2_desc,
    year,
    created_by: user?.id ?? null,
  };

  const { error } = await supabase.from("macro_challenges").insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath("/app/admin/macros");
}

export async function adminCreateContribution(formData: FormData) {
  const macro_id = asText(formData.get("macro_id"));
  const area_id = asText(formData.get("area_id"));
  const reto_area = asText(formData.get("reto_area"));
  const indicador_area = asText(formData.get("indicador_area"));
  const meta_area = asNumberOrNull(formData.get("meta_area"));
  const year = asIntOrNull(formData.get("year")) ?? new Date().getFullYear();
  if (!macro_id || !area_id || !reto_area || !indicador_area) throw new Error("Faltan campos");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("area_contributions").insert({
    macro_id,
    area_id,
    reto_area,
    indicador_area,
    meta_area,
    year,
    created_by: user?.id ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/app/admin/aportes");
}

export async function adminCreateAreaChallenges(formData: FormData) {
  const macro_id = asText(formData.get("macro_id"));
  const area_id = asText(formData.get("area_id"));
  const year = asIntOrNull(formData.get("year")) ?? new Date().getFullYear();

  const retos = formData.getAll("reto_area").map((v) => asText(v));
  const indicadores = formData.getAll("indicador_area").map((v) => asText(v));
  const metas = formData.getAll("meta_area").map((v) => asNumberOrNull(v));
  const metaDescs = formData.getAll("meta_desc").map((v) => asText(v) || null);

  const count = Math.max(retos.length, indicadores.length, metas.length, metaDescs.length);
  if (!macro_id || !area_id || !count) throw new Error("Faltan campos");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Para evitar choques de unicidad (macro_id, area_id, year, ordinal),
  // calculamos el siguiente ordinal disponible y asignamos en secuencia.
  const { data: maxRow, error: maxErr } = await supabase
    .from("area_contributions")
    .select("ordinal")
    .eq("macro_id", macro_id)
    .eq("area_id", area_id)
    .eq("year", year)
    .order("ordinal", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxErr) throw new Error(maxErr.message);
  const baseOrdinal = typeof maxRow?.ordinal === "number" ? maxRow.ordinal : 0;

  const rows = Array.from({ length: count }).map((_, i) => {
    const reto_area = retos[i] ?? "";
    const indicador_area = indicadores[i] ?? "";
    if (!reto_area || !indicador_area) {
      throw new Error("Cada reto del área debe tener reto e indicador");
    }

    return {
      macro_id,
      area_id,
      year,
      ordinal: baseOrdinal + i + 1,
      reto_area,
      indicador_area,
      meta_area: metas[i] ?? null,
      meta_desc: metaDescs[i] ?? null,
      created_by: user?.id ?? null,
    };
  });

  const { error } = await supabase.from("area_contributions").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath("/app/admin/aportes");
}

export async function adminUpdateAreaChallenge(formData: FormData) {
  const id = asText(formData.get("id"));
  const reto_area = asText(formData.get("reto_area"));
  const indicador_area = asText(formData.get("indicador_area"));
  const meta_area = asNumberOrNull(formData.get("meta_area"));
  const meta_desc = asText(formData.get("meta_desc")) || null;
  const ordinal = asIntOrNull(formData.get("ordinal"));

  if (!id || !reto_area || !indicador_area) throw new Error("Faltan campos");

  const supabase = await createSupabaseServerClient();

  const patch: Record<string, unknown> = {
    reto_area,
    indicador_area,
    meta_area,
    meta_desc,
  };
  if (ordinal !== null) patch.ordinal = ordinal;

  const { error } = await supabase.from("area_contributions").update(patch).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/app/admin/aportes");
}

export async function adminSetAreaChallengeActive(id: string, active: boolean) {
  if (!id) throw new Error("Falta id");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("area_contributions").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/admin/aportes");
}

export async function adminApproveUser(formData: FormData) {
  const profile_id = asText(formData.get("profile_id"));
  const area_id = asText(formData.get("area_id"));
  const role = asText(formData.get("role")) || "member";
  if (!profile_id || !area_id) throw new Error("Faltan campos");

  const supabase = await createSupabaseServerClient();

  // 1) asignar rol
  const { error: e1 } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profile_id);
  if (e1) throw new Error(e1.message);

  // 2) asignar área
  const { error: e2 } = await supabase
    .from("profile_areas")
    .insert({ profile_id, area_id, is_primary: true });
  if (e2) {
    // si ya existía, no fallamos fuerte (permite reintentos)
    const msg = (e2 as unknown as { code?: string }).code;
    if (msg !== "23505") throw new Error(e2.message);
  }

  revalidatePath("/app/admin/usuarios");
}

