import { useState } from 'react'
import { Link, router } from 'expo-router'
import * as Linking from 'expo-linking'
import { Button, StyleSheet, Text, TextInput, View } from 'react-native'

import { supabase } from '@/lib/supabase'

// Paso 1 del flujo "olvidé mi contraseña": pedimos el mail y Supabase manda
// un link mágico a mygym://reset-password?code=... (ver app/reset-password.tsx).
// Sirve tanto para resetear una contraseña existente como para que alguien
// que se creó la cuenta con Google configure una contraseña por primera vez:
// resetPasswordForEmail no distingue entre ambos casos.
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(null)

    if (!email.trim()) {
      setError('Ingresá tu email')
      return
    }

    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL('reset-password'),
    })
    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Revisá tu correo</Text>
        <Text style={styles.subtitle}>
          Si {email.trim()} está registrado, te enviamos un link para configurar tu contraseña.
        </Text>
        <Button title="Volver a iniciar sesión" onPress={() => router.replace('/login')} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olvidé mi contraseña</Text>
      <Text style={styles.subtitle}>
        Te mandamos un link para crear o restablecer tu contraseña, aunque hoy entres solo con Google.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={loading ? 'Enviando...' : 'Enviar link'} onPress={handleSubmit} disabled={loading} />
      <Link href="/login" style={styles.link}>
        Volver a iniciar sesión
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
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
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
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
})
