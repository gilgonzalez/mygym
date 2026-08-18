import 'react-native-url-polyfill/auto'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@mygym/shared/types/database'

// Mismo proyecto de Supabase que apps/web (mismas tablas, mismas RLS
// policies). El móvil habla directo con Supabase para la mayoría de
// operaciones; lo que necesita un secreto de servidor (subida a R2, llamadas
// a OpenAI) sigue pasando por los API routes existentes de apps/web.
//
// Las variables EXPO_PUBLIC_* se inlinean en build time desde apps/mobile/.env
// (ver .env.example). No hace falta configurarlas en app.json.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copiá .env.example a .env y completá los valores.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // AsyncStorage sigue la guía oficial de Supabase para Expo. Si más
    // adelante se necesita mayor seguridad para el refresh token, se puede
    // migrar a expo-secure-store con un wrapper que trocee el valor (tiene
    // un límite de ~2KB por entrada).
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE en vez de implicit: el link de "olvidé mi contraseña" llega como
    // mygym://reset-password?code=... (query param) en lugar de un fragmento
    // #access_token=..., mucho más simple de leer con expo-router/expo-linking.
    // El code_verifier queda en AsyncStorage entre el pedido de reset y el
    // click en el mail, así que tiene que resolverse en el mismo dispositivo
    // que inició el pedido (ver app/reset-password.tsx).
    flowType: 'pkce',
  },
})
