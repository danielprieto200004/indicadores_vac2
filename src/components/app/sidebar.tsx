"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import type { SidebarItem } from "@/components/app/sidebar-items";

export function Sidebar({
  items,
  headerHref = "/app",
  headerTitle = "Indicadores VAC",
  headerSubtitle = "Seguimiento estratégico",
  footer,
  className,
}: {
  items: SidebarItem[];
  headerHref?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  footer?: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden h-dvh w-[280px] shrink-0 border-r bg-card md:flex md:flex-col",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b px-5 py-5">
        <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
          <span className="text-sm font-semibold">VAC</span>
        </div>
        <div className="leading-tight">
          <Link href={headerHref} className="text-sm font-semibold">
            {headerTitle}
          </Link>
          <div className="text-xs text-muted-foreground">{headerSubtitle}</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const isActive =
            item.href === "/app"
              ? pathname === "/app"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span className={cn(isActive ? "text-accent-foreground" : "text-muted-foreground")}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {footer ? <div className="border-t p-4">{footer}</div> : null}
    </aside>
  );
}
