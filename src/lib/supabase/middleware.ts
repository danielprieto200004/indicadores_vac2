import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

import { getEnvClient } from "@/lib/env";

export function createSupabaseMiddlewareClient(req: NextRequest) {
  const env = getEnvClient();
  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return { supabase, res };
}

