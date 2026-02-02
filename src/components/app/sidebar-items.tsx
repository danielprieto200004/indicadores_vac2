import { BarChart3, ClipboardList, Layers, Shield, Target, Users2 } from "lucide-react";

import type { ReactNode } from "react";

export type SidebarItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export const memberSidebarItems: SidebarItem[] = [
  { href: "/app", label: "Dashboard", icon: <BarChart3 className="size-4" /> },
  { href: "/app/aportes", label: "Seguimiento", icon: <ClipboardList className="size-4" /> },
  { href: "/app/propios", label: "Indicadores propios", icon: <Layers className="size-4" /> },
  { href: "/app/macros", label: "Retos Macro VAC", icon: <Target className="size-4" /> },
];

export const adminSidebarItems: SidebarItem[] = [
  ...memberSidebarItems.filter((i) => i.href !== "/app/propios"),
  { href: "/app/admin", label: "Gestión", icon: <Shield className="size-4" /> },
  { href: "/app/admin/usuarios", label: "Usuarios", icon: <Users2 className="size-4" /> },
];

