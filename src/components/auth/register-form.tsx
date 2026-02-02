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

const schema = z
  .object({
    fullName: z.string().min(3, "Ingresa tu nombre completo"),
    email: z.string().email("Ingresa un correo válido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    passwordConfirm: z.string().min(8, "Mínimo 8 caracteres"),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirm"],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", password: "", passwordConfirm: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSuccess(false);

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
        },
      },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    setSuccess(true);
    // Si el proyecto requiere confirmación por email, el usuario deberá confirmar.
    // En ambos casos, el perfil queda como pending hasta aprobación del admin.
    router.replace("/login");
  }

  if (success) {
    return (
      <div className="rounded-lg border border-input bg-background p-4 text-sm">
        Registro exitoso. Ya puedes intentar iniciar sesión. Tu acceso quedará pendiente
        hasta aprobación de un administrador.
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input id="fullName" placeholder="Nombre Apellido" {...form.register("fullName")} />
        {form.formState.errors.fullName?.message ? (
          <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" placeholder="nombre@dominio.edu" {...form.register("email")} />
        {form.formState.errors.email?.message ? (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" type="password" {...form.register("password")} />
        {form.formState.errors.password?.message ? (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">Confirmar contraseña</Label>
        <Input id="passwordConfirm" type="password" {...form.register("passwordConfirm")} />
        {form.formState.errors.passwordConfirm?.message ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.passwordConfirm.message}
          </p>
        ) : null}
      </div>

      {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Creando..." : "Crear cuenta"}
      </Button>
    </form>
  );
}

