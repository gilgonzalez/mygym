import { useState } from 'react'
import { Link, router } from 'expo-router'
import { Button, StyleSheet, Text, TextInput, View } from 'react-native'

import { supabase } from '@/lib/supabase'

// Login con email/password, igual que en apps/web (src/app/auth/actions.ts).
//
// Pendiente a propósito, para decidir cuando se aborde la feature completa:
// - Google OAuth nativo (expo-auth-session o @react-native-google-signin) —
//   el flujo de signInWithOAuth + redirectTo de la web no aplica tal cual acá.
// - Apple exige "Sign in with Apple" si se ofrece login con Google en iOS.
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError(null)
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    router.replace('/')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={loading ? 'Ingresando...' : 'Ingresar'} onPress={handleLogin} disabled={loading} />
      <Link href="/forgot-password" style={styles.link}>
        ¿Olvidaste tu contraseña?
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: {
    color: '#e11d48',
  },
  link: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
})
