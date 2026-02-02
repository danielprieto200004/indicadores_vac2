import Link from "next/link";

import { ArrowRight, Building2, ClipboardCheck, ShieldCheck, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent" />
          <div className="relative p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Gestión</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Accesos para administrar catálogos y configuración. El{" "}
                  <Link className="underline underline-offset-4" href="/app">
                    Dashboard
                  </Link>{" "}
                  (panorama ejecutivo) está en la ruta principal.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/app">Ir al Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <AdminCard
          title="Usuarios"
          desc="Aprobar solicitudes, asignar rol y área."
          icon={<ShieldCheck className="h-5 w-5" />}
          href="/app/admin/usuarios"
        />
        <AdminCard
          title="Áreas"
          desc="Crear y administrar Direcciones/Escuelas/Otro."
          icon={<Building2 className="h-5 w-5" />}
          href="/app/admin/areas"
        />
        <AdminCard
          title="Retos Macro VAC"
          desc="Crear retos estratégicos macro y sus metas."
          icon={<Target className="h-5 w-5" />}
          href="/app/admin/macros"
        />
        <AdminCard
          title="Retos del área"
          desc="Asignar retos estratégicos del área a retos macro."
          icon={<ClipboardCheck className="h-5 w-5" />}
          href="/app/admin/aportes"
        />
      </div>
    </div>
  );
}

function AdminCard({
  title,
  desc,
  href,
  icon,
}: {
  title: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Card className="group transition-colors hover:bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                {icon}
              </span>
              <span>{title}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Abrir módulo</CardContent>
      </Card>
    </Link>
  );
}

