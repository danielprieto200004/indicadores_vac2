# INDICADORES VAC

Plataforma de seguimiento de indicadores (retos macro + aportes por área) construida con **Next.js** y **Supabase**.

## Requisitos
- Node.js 20+

## Variables de entorno
Crea `.env.local` basado en `.env.local.example`.

## Desarrollo
```bash
npm run dev
```

## Bootstrap de administradores

1) Registra las 3 cuentas admin desde `/register` (quedan como `pending`).  
2) Promuévelas a `admin` ejecutando:

```bash
node scripts/promote-admins.mjs admin1@dominio.edu admin2@dominio.edu admin3@dominio.edu
```

