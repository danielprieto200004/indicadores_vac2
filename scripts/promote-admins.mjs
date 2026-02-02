/**
 * Promueve usuarios a role=admin en `public.profiles` por email.
 *
 * Uso:
 *   node scripts/promote-admins.mjs admin1@dominio.edu admin2@dominio.edu admin3@dominio.edu
 *
 * Requiere en `.env.local`:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const emails = process.argv.slice(2).map((e) => e.trim()).filter(Boolean);
if (!emails.length) {
  console.error("Debes pasar al menos 1 email.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

for (const email of emails) {
  const { data: users, error: findErr } = await supabase
    .from("profiles")
    .select("id,email,role")
    .ilike("email", email)
    .limit(5);

  if (findErr) {
    console.error(`[${email}] error buscando profile:`, findErr.message);
    continue;
  }

  const profile = users?.[0];
  if (!profile) {
    console.error(`[${email}] no existe en profiles (¿ya se registró?)`);
    continue;
  }

  const { error: upErr } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", profile.id);

  if (upErr) {
    console.error(`[${email}] error actualizando role:`, upErr.message);
    continue;
  }

  console.log(`[${email}] OK -> admin`);
}

