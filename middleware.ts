import { NextRequest, NextResponse } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

type Role = "pending" | "member" | "admin";

export async function middleware(req: NextRequest) {
  const { supabase, res } = createSupabaseMiddlewareClient(req);

  // Mantener sesión refrescada
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;

  const isApp = path.startsWith("/app");
  if (!isApp) return res;

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Perfil/rol (RLS: el usuario solo debe poder leer su propio profile)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role: Role = (profile?.role as Role) ?? "pending";
  const roleResolved = !error;

  // Si la tabla aún no existe o no hay perfil, enviamos a pending como fallback.
  const isAdminRoute = path.startsWith("/app/admin");
  const isPendingRoute = path.startsWith("/app/pending");

  if (!roleResolved) {
    if (isAdminRoute) {
      const url = req.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }
    return res;
  }

  if (role === "pending" && !isPendingRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/app/pending";
    return NextResponse.redirect(url);
  }

  if (role !== "admin" && isAdminRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/app/:path*"],
};

