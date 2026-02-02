import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const objectPath = (path ?? []).join("/");
  if (!objectPath) return NextResponse.json({ error: "missing path" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from("evidence")
    .createSignedUrl(objectPath, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? "not found" }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}

