import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'

import { supabase } from './supabase'

// Login con Google en mobile — no hay equivalente directo al
// signInWithProvider de la web (src/app/auth/actions.ts), que simplemente
// redirige la página entera. Acá el intercambio se hace a mano:
//   1. Pedimos a Supabase la URL de /authorize sin que intente redirigir
//      solo (skipBrowserRedirect) y la abrimos en un browser in-app.
//   2. Google → Supabase → nuestro redirectTo (mygym://login?code=...),
//      que expo-router entiende como deep link directo a app/login.tsx.
//   3. Canjeamos ese code por sesión con exchangeCodeForSession, el mismo
//      paso que usa app/reset-password.tsx para el link de recuperación
//      (mismo flujo PKCE, ver lib/supabase.ts).
//
// Requisito manual (no se puede hacer desde el código): agregar
// "mygym://login" a Authentication → URL Configuration → Redirect URLs en
// el dashboard de Supabase del proyecto.
export async function signInWithGoogle(): Promise<{ cancelled: boolean }> {
  const redirectTo = Linking.createURL('login')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  })

  if (error) throw error
  if (!data.url) throw new Error('No se pudo iniciar el login con Google')

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

  // El usuario cerró el browser o canceló el login — no es un error.
  if (result.type !== 'success') {
    return { cancelled: true }
  }

  const { queryParams } = Linking.parse(result.url)
  const code = queryParams?.code
  const errorDescription = queryParams?.error_description

  if (errorDescription) {
    throw new Error(String(errorDescription))
  }
  if (!code || typeof code !== 'string') {
    throw new Error('No se recibió el código de autenticación de Google')
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) throw exchangeError

  return { cancelled: false }
}
