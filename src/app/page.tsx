import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-background to-muted">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <span className="text-sm font-semibold">VAC</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Indicadores</div>
            <div className="text-xs text-muted-foreground">
              Seguimiento estratégico institucional
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Crear cuenta
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 py-10 md:grid-cols-2 md:py-16">
        <div className="space-y-6">
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Plataforma de seguimiento de indicadores y retos estratégicos
          </h1>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Administra retos estratégicos macro, asigna aportes por Direcciones,
            Escuelas y otras áreas, y lleva seguimiento periódico con evidencias,
            semáforo y métricas.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Solicitar acceso
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-input bg-background px-5 py-3 text-sm font-medium hover:bg-accent"
            >
              Ya tengo cuenta
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            El registro queda en estado <span className="font-medium">pendiente</span>{" "}
            hasta aprobación de un administrador.
          </p>
        </div>

        <div className="rounded-2xl border border-input bg-card p-6 shadow-sm">
          <div className="grid gap-4">
            <div className="rounded-xl bg-muted p-4">
              <div className="text-sm font-semibold">Visión rápida</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Consolidación por reto macro + detalle por área.
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Feature
                title="Seguimiento periódico"
                desc="Historial mensual/trimestral con % y valor actual."
              />
              <Feature
                title="Semáforo"
                desc="Estado verde/amarillo/rojo por indicador."
              />
              <Feature
                title="Evidencias"
                desc="Adjunta soporte (archivo o enlace) y comentarios."
              />
              <Feature
                title="Rol por área"
                desc="Cada Dirección/Escuela ve solo lo asignado."
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-10 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Indicadores VAC
      </footer>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-input bg-background p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}

