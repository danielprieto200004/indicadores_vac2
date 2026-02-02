import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import { getEnvClient } from "@/lib/env";

export async function createSupabaseServerClient() {
  const env = getEnvClient();
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // En Server Components no siempre se pueden setear cookies.
          }
        },
      },
    }
  );
}

