# MyGym Mobile

App de Android/iOS en Expo + Expo Router, viviendo en el mismo monorepo que
`apps/web` (Next.js). Comparte con la web el tipado de la base de datos vía
`packages/shared`.

## Arquitectura (resumen)

- **Auth y datos**: el cliente habla directo con Supabase (`src/lib/supabase.ts`),
  igual que la web, apoyándose en las RLS policies de Postgres — no pasa por
  las Server Actions de `apps/web`.
- **Lo que sí necesita el backend de Next.js**: cualquier operación con
  secretos de servidor. La subida a R2 (`/api/upload`) ahora acepta cookie
  de sesión **o** `Authorization: Bearer` (el access token de supabase de
  la app). Las miniaturas de ejercicios nuevos se firman por esa ruta. La
  generación de rutinas con IA (`generate-by-ai`) sigue pendiente.
- **Pendiente de auditoría**: acciones con lógica de negocio no trivial
  (`likes`, `challenge`, `log`) — hay que decidir, acción por acción, si pasan
  a una función RPC de Postgres o quedan detrás de un endpoint dedicado. Ver
  el paquete `packages/shared`.

## Setup

```bash
cp apps/mobile/.env.example apps/mobile/.env
# completar EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
# y EXPO_PUBLIC_API_URL (la URL de apps/web, p.ej. https://mygymgigo.vercel.app)
# (los mismos valores que NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY de la web)

bun install          # desde la raíz del repo, instala todo el workspace
bun run mobile        # equivalente a `bun --cwd apps/mobile start`
```

Desde ahí, Expo CLI ofrece abrir en Android/iOS simulator, dispositivo físico
(Expo Go, para probar rápido) o generar un dev build.

## Testing interno (sin publicar en las stores)

- **Expo Go**: más rápido, pero no soporta código nativo custom fuera de lo
  que ya trae Expo. Alcanza para este scaffold.
- **Dev build / EAS Build interno**: necesario en cuanto se agregue una
  librería con código nativo no soportado por Expo Go, o para distribuir a
  testers sin Expo Go (`eas build --profile development`). Requiere cuenta de
  Expo (gratuita) — no requiere cuentas de Apple/Google todavía para uso
  interno en Android; para instalar en iPhones físicos sin TestFlight sí hace
  falta un Apple Developer account (aunque sea para ad-hoc/dev builds).

## Pendientes conocidos (a definir cuando se aborde cada feature)

- Google Sign-In nativo (el flujo web de `signInWithOAuth` + `redirectTo` no
  aplica tal cual en móvil).
- Apple exige "Sign in with Apple" si se ofrece Google en iOS.
- Push notifications (`expo-notifications`) — no incluido en este scaffold.
- Iconos/splash reales (`app.json` no tiene assets configurados todavía).
- Estilos: este scaffold usa `StyleSheet` plano de React Native. Si se quiere
  reciclar los tokens de Tailwind de la web, evaluar NativeWind.
