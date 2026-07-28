import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpdatePasswordPage() {
  return (
    <main className="min-h-dvh bg-muted/30">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="text-2xl font-semibold tracking-tight">Indicadores VAC</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Actualiza tu contraseña para continuar
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Nueva contraseña</CardTitle>
              <CardDescription>Ingresa una nueva contraseña para tu cuenta.</CardDescription>
            </CardHeader>
            <CardContent>
              <UpdatePasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
