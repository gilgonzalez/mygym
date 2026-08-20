import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import { supabase } from './supabase'

interface SessionContextValue {
  session: Session | null
  loading: boolean
}

const SessionContext = createContext<SessionContextValue | null>(null)

// Única fuente de verdad de la sesión — antes cada pantalla que la
// necesitaba (el viejo app/index.tsx) hacía su propio
// getSession()/onAuthStateChange por separado. Ahora el layout raíz la usa
// para decidir qué grupo de rutas mostrar (ver app/_layout.tsx:
// <Stack.Protected guard={!!session}>) y cualquier pantalla de acá para
// abajo la lee con useSession() en vez de repetir la suscripción — incluida
// la que dispara signOut() (app/(tabs)/profile.tsx), que no necesita
// redirigir a mano: en cuanto este listener recibe SIGNED_OUT, el guard del
// layout raíz cambia solo y expo-router saca al usuario del grupo
// autenticado.
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  return <SessionContext.Provider value={{ session, loading }}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession() tiene que usarse dentro de <SessionProvider>')
  return ctx
}
