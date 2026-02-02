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

async function getPrimaryAreaId(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión inválida");

  const { data: pa, error } = await supabase
    .from("profile_areas")
    .select("area_id,is_primary")
    .eq("profile_id", user.id)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!pa?.area_id) throw new Error("No tienes un área asignada. Pide al admin que te asigne una.");
  return { areaId: pa.area_id as string, userId: user.id as string };
}

export async function createAreaOwnIndicators(formData: FormData) {
  const year = asIntOrNull(formData.get("year")) ?? new Date().getFullYear();

  const retos = formData.getAll("reto_area").map((v) => asText(v));
  const indicadores = formData.getAll("indicador_area").map((v) => asText(v));
  const metas = formData.getAll("meta_value").map((v) => asNumberOrNull(v));
  const metaDescs = formData.getAll("meta_desc").map((v) => asText(v) || null);

  const count = Math.max(retos.length, indicadores.length, metas.length, metaDescs.length);
  if (!count) throw new Error("Agrega al menos 1 indicador propio.");

  const supabase = await createSupabaseServerClient();
  const { areaId, userId } = await getPrimaryAreaId(supabase);

  const { data: maxRow, error: maxErr } = await supabase
    .from("area_own_indicators")
    .select("ordinal")
    .eq("area_id", areaId)
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
      throw new Error("Cada indicador propio debe tener reto e indicador.");
    }
    return {
      area_id: areaId,
      year,
      ordinal: baseOrdinal + i + 1,
      reto_area,
      indicador_area,
      meta_value: metas[i] ?? null,
      meta_desc: metaDescs[i] ?? null,
      created_by: userId,
    };
  });

  const { error } = await supabase.from("area_own_indicators").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath("/app/propios");
  revalidatePath("/app");
}

