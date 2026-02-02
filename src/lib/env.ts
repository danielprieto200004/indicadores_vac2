export function getEnvClient() {
  // IMPORTANTE: en código que puede llegar al browser, Next solo inyecta
  // variables `process.env.NEXT_PUBLIC_*` si el acceso es ESTÁTICO.
  // Por eso NO usamos `process.env[name]`.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Falta variable de entorno: NEXT_PUBLIC_SUPABASE_URL. Configúrala en .env.local"
    );
  }
  if (!anon) {
    throw new Error(
      "Falta variable de entorno: NEXT_PUBLIC_SUPABASE_ANON_KEY. Configúrala en .env.local"
    );
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "Indicadores VAC",
  } as const;
}

export function getEnvServer() {
  return {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  } as const;
}

