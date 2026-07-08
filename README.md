# MyGym

Aplicación social y de ejecución de entrenamientos construida con Next.js, Supabase, TypeScript y Tailwind CSS.

## Stack

- Next.js 14 + App Router
- React 18 + TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- Zustand + React Query
- Cloudflare R2 para media

## Funcionalidades

- Registro e inicio de sesión con email/password y Google
- Feed y exploración de workouts públicos
- Creación y edición de workouts con secciones, ejercicios y tutoriales
- Ejecución guiada de workouts con estados de sesión
- Perfil de usuario con métricas y gating premium
- Upload y gestión de media vinculada a ejercicios/tutoriales

## Estructura

```text
src/
├── app/                  # Rutas, layouts, server actions y route handlers
├── components/           # UI reusable y vistas de negocio
├── lib/                  # Clientes externos, utilidades y lógica compartida
├── services/             # Servicios cliente como uploads
├── store/                # Stores de Zustand
├── types/                # Tipos de dominio y DB
└── constants/            # Constantes de UI y negocio
```

## Variables de entorno

1. Copia el archivo de ejemplo:

```bash
cp .env.example .env.local
```

2. Completa las variables necesarias:

- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `OPENAI_API_KEY`

## Desarrollo

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Scripts

- `npm run dev` inicia el entorno local
- `npm run build` genera la build de producción
- `npm run start` sirve la build compilada
- `npm run lint` ejecuta ESLint
- `npm run check` ejecuta TypeScript en modo validación
- `npm run supabase:types` regenera tipos de Supabase

## Base de datos

- Las migraciones viven en `supabase/migrations`
- El seed inicial vive en `supabase/seed.sql`
- La tabla `users` incluye gating premium con `isPremium` y `role`

## Despliegue

Checklist mínima antes de producción:

1. Configurar todas las variables de entorno en la plataforma de despliegue.
2. Ejecutar `npm run lint`, `npm run check` y `npm run build`.
3. Aplicar migraciones de Supabase del directorio `supabase/migrations`.
4. Verificar manualmente auth, create workout, update workout y workout view sobre el entorno desplegado.
