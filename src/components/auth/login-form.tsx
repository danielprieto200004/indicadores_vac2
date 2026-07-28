"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().optional(),
  otp: z.string().optional(),
  newPassword: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm({ next = "/app" }: { next?: string }) {
  const router = useRouter();

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", otp: "", newPassword: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);

    // MODO 3: ENVIAR OTP Y NUEVA CONTRASEÑA
    if (isForgotPassword && resetSent) {
      if (!values.otp || values.otp.length < 6) {
        setServerError("Debes ingresar el código de 6 dígitos.");
        return;
      }
      if (!values.newPassword || values.newPassword.length < 8) {
        setServerError("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
      }

      // 1. Verificar OTP
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email: values.email,
        token: values.otp,
        type: 'recovery',
      });

      if (otpError) {
        setServerError(otpError.message);
        return;
      }

      // 2. Actualizar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (updateError) {
        setServerError(updateError.message);
        return;
      }

      router.replace(next);
      router.refresh();
      return;
    }

    // MODO 2: SOLICITAR OTP AL CORREO
    if (isForgotPassword && !resetSent) {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email);
      if (error) {
        setServerError(error.message);
        return;
      }
      setResetSent(true);
      return;
    }

    // MODO 1: INICIO DE SESIÓN NORMAL
    if (!values.password || values.password.length < 8) {
      setServerError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input 
          id="email" 
          placeholder="nombre@dominio.edu" 
          {...form.register("email")} 
          disabled={resetSent} 
        />
        {form.formState.errors.email?.message ? (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      {!isForgotPassword && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <button
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="text-xs text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <Input id="password" type="password" {...form.register("password")} />
          {form.formState.errors.password?.message ? (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
      )}

      {isForgotPassword && resetSent && (
        <>
          <div className="space-y-2">
            <Label htmlFor="otp">Código de recuperación (6 dígitos)</Label>
            <Input id="otp" type="text" placeholder="123456" {...form.register("otp")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <Input id="newPassword" type="password" {...form.register("newPassword")} />
          </div>
        </>
      )}

      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
      
      {resetSent && (
        <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">
          Revisa tu correo. Ingresa el código numérico aquí junto con tu nueva contraseña.
        </div>
      )}

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting 
          ? (resetSent ? "Guardando..." : isForgotPassword ? "Enviando..." : "Ingresando...") 
          : (resetSent ? "Actualizar Contraseña" : isForgotPassword ? "Enviar código de recuperación" : "Ingresar")}
      </Button>

      {isForgotPassword && (
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => { setIsForgotPassword(false); setResetSent(false); setServerError(null); }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Volver a iniciar sesión
          </button>
        </div>
      )}
    </form>
  );
}
