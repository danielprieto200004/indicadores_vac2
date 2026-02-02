import { redirect } from "next/navigation";

import { Sidebar } from "@/components/app/sidebar";
import { adminSidebarItems, memberSidebarItems } from "@/components/app/sidebar-items";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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

  const role = profile?.role ?? "pending";
  const items = role === "admin" ? adminSidebarItems : memberSidebarItems;

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        items={items}
        footer={
          <div className="space-y-2">
            <div className="text-xs font-medium">Sesión</div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Cerrar sesión
              </Button>
            </form>
          </div>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold">Panel</div>
              <div className="text-xs text-muted-foreground">
                Indicadores y seguimiento
              </div>
            </div>
          </div>
          <Separator />
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}

