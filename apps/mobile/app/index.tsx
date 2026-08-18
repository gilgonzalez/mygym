import { useEffect, useState } from 'react'
import { Link } from 'expo-router'
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

// Pantalla de arranque de referencia: valida que el cliente de Supabase
// compartido con apps/web funciona end-to-end (auth.getSession + listener).
// El feed real, la ejecución de workouts, etc. se construyen sobre esta base.
export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

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

  const handleLogout = async () => {
    setLoggingOut(true)
    // No hace falta setSession(null) a mano ni redirigir: onAuthStateChange
    // (arriba) recibe el evento SIGNED_OUT y re-renderiza esta pantalla sola.
    await supabase.auth.signOut()
    setLoggingOut(false)
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MyGym</Text>
      {session ? (
        <>
          <Text style={styles.subtitle}>Sesión iniciada: {session.user.email}</Text>
          <Button
            title={loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            onPress={handleLogout}
            disabled={loggingOut}
          />
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Todavía no iniciaste sesión</Text>
          <Link href="/login" style={styles.link}>
            Ir a login
          </Link>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  link: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})
