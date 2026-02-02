import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PendingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin" || profile?.role === "member") {
    redirect("/app");
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Cuenta pendiente de aprobación</CardTitle>
        <CardDescription>
          Un administrador debe aprobar tu acceso y asignarte un área (Dirección/Escuela/Otro).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-input bg-background p-4 text-sm">
          <div className="font-medium">Tu correo</div>
          <div className="text-muted-foreground">{user.email}</div>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="outline">
            Cerrar sesión
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

