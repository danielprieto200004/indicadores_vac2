import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <main className="min-h-dvh bg-muted/30">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="text-2xl font-semibold tracking-tight">Indicadores VAC</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Crea tu cuenta (queda pendiente de aprobación)
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registro</CardTitle>
              <CardDescription>
                Después de registrarte, un administrador aprobará tu acceso y asignará tu área.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterForm />
              <div className="mt-4 text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
                  Inicia sesión
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

