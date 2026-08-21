import * as AppleAuthentication from 'expo-apple-authentication'

import { supabase } from './supabase'

// Login con Apple en mobile — a diferencia de Google (ver lib/googleAuth.ts),
// acá no hay redirect ni browser in-app: expo-apple-authentication habla
// directo con el sistema (Face ID / passcode) y devuelve un identityToken
// firmado por Apple, que le pasamos tal cual a Supabase con
// signInWithIdToken. Supabase valida la firma contra las claves públicas de
// Apple, así que no hace falta manejar ningún code exchange acá.
//
// Requisito manual (no se puede hacer desde el código):
//   1. Apple Developer → el App ID (com.mygym.app) necesita la capability
//      "Sign In with Apple" habilitada (el plugin de app.json agrega el
//      entitlement al build, pero la capability en el portal se activa sola
//      la primera vez que EAS registra el App ID con este entitlement).
//   2. Supabase Dashboard → Authentication → Providers → Apple: cargar el
//      Services ID, Team ID, Key ID y la private key (.p8) generados en
//      Apple Developer → Certificates, Identifiers & Profiles → Keys.
export async function signInWithApple(): Promise<{ cancelled: boolean }> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    })

    if (!credential.identityToken) {
      throw new Error('No se recibió el identity token de Apple')
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    })

    if (error) throw error

    return { cancelled: false }
  } catch (err: any) {
    // Apple usa este código cuando el usuario cierra el sheet nativo o
    // cancela — mismo criterio que "cancelled" en signInWithGoogle.
    if (err.code === 'ERR_REQUEST_CANCELED') {
      return { cancelled: true }
    }
    throw err
  }
}
