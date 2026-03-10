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

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        items={items}
        footer={
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">{displayName}</div>
                <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Cerrar sesión
              </Button>
            </form>
          </div>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}

