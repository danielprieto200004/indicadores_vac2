import { redirect } from "next/navigation";

import { Sidebar } from "@/components/app/sidebar";
import { adminSidebarItems, memberSidebarItems } from "@/components/app/sidebar-items";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,full_name")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "pending";
  const items = role === "admin" ? adminSidebarItems : memberSidebarItems;
  const displayName = profile?.full_name
    ? String(profile.full_name).split(" ")[0]
    : user.email?.split("@")[0] ?? "";

  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? null;
  const buildTimeLabel =
    buildTime && !Number.isNaN(new Date(buildTime).getTime())
      ? new Date(buildTime).toLocaleString("es-CO", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <div className="flex h-dvh overflow-hidden print:block print:h-auto print:overflow-visible">
      <Sidebar
        items={items}
        footer={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">{displayName}</div>
                <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
              </div>
            </div>
            {buildTimeLabel ? (
              <p className="text-[11px] text-muted-foreground">
                Plataforma actualizada: <span className="font-medium text-foreground">{buildTimeLabel}</span>
              </p>
            ) : null}
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Cerrar sesión
              </Button>
            </form>
          </div>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden print:overflow-visible print:block">
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}

