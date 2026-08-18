import { useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Button, StyleSheet, Text, TextInput, View } from 'react-native'

import { supabase } from '@/lib/supabase'

// Paso 2 del flujo: acá cae el deep link mygym://reset-password?code=...
// que manda el mail de Supabase (ver app/forgot-password.tsx). Cambiamos el
// código PKCE por una sesión y recién ahí dejamos definir la contraseña
// nueva con updateUser. Misma pantalla sirve para "primera contraseña" de
// una cuenta creada con Google que para un reset normal.
export default function ResetPassword() {
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>()
  const [exchanging, setExchanging] = useState(true)
  const [linkError, setLinkError] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const exchangeCode = async () => {
      if (params.error_description) {
        setLinkError(params.error_description)
        setExchanging(false)
        return
      }

      if (!params.code) {
        setLinkError('Este link no es válido. Pedí uno nuevo desde "Olvidé mi contraseña".')
        setExchanging(false)
        return
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code)
      setExchanging(false)

      if (exchangeError) {
        setLinkError(exchangeError.message)
      }
    }

    exchangeCode()
    // Solo nos importa el código con el que se abrió la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code, params.error_description])

  const handleSubmit = async () => {
    setError(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)
  }

  if (exchanging) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>Validando link...</Text>
      </View>
    )
  }

  if (linkError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Link inválido o vencido</Text>
        <Text style={styles.error}>{linkError}</Text>
        <Button title="Pedir un link nuevo" onPress={() => router.replace('/forgot-password')} />
      </View>
    )
  }

  if (done) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Contraseña actualizada</Text>
        <Text style={styles.subtitle}>Ya podés usarla para entrar con tu email.</Text>
        <Button title="Ir a la app" onPress={() => router.replace('/')} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Elegí tu nueva contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Nueva contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Repetir contraseña"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={loading ? 'Guardando...' : 'Guardar contraseña'} onPress={handleSubmit} disabled={loading} />
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
})
