import { useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { CheckCircle2, Lock, ShieldAlert } from 'lucide-react-native'

import { getPasswordLengthError, isPasswordValid } from '@mygym/shared'

import { supabase } from '@/lib/supabase'
import { useTheme } from '@/theme'
import { Button } from '@/components/ui'
import { AuthBackground, AuthCard, AuthFormError, AuthHeader, AuthStatus, AuthTextField } from '@/components/auth'

// Paso 2 del flujo: acá cae el deep link mygym://reset-password?code=...
// que manda el mail de Supabase (ver app/forgot-password.tsx). Cambiamos el
// código PKCE por una sesión y recién ahí dejamos definir la contraseña
// nueva con updateUser. Misma pantalla sirve para "primera contraseña" de
// una cuenta creada con Google que para un reset normal.
export default function ResetPassword() {
  const theme = useTheme()
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

    if (!isPasswordValid(password)) {
      setError(getPasswordLengthError())
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
      <View style={styles.fill}>
        <AuthBackground />
        <View style={styles.centered}>
          <ActivityIndicator color="#fafafa" />
          <Text style={[styles.subtitle, { fontFamily: theme.fontFamily.regular }]}>Validando link...</Text>
        </View>
      </View>
    )
  }

  if (linkError) {
    return (
      <AuthStatus
        icon={ShieldAlert}
        tone="error"
        title="Link inválido o vencido"
        description={linkError}
        actionLabel="Pedir un link nuevo"
        onAction={() => router.replace('/forgot-password')}
      />
    )
  }

  if (done) {
    return (
      <AuthStatus
        icon={CheckCircle2}
        tone="success"
        title="Contraseña actualizada"
        description="Ya podés usarla para entrar con tu email."
        actionLabel="Ir a la app"
        onAction={() => router.replace('/')}
      />
    )
  }

  return (
    <View style={styles.fill}>
      <AuthBackground />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AuthHeader title="Elegí tu nueva contraseña" />

          <AuthCard style={styles.card}>
            <View style={styles.form}>
              <AuthTextField
                icon={Lock}
                placeholder="Nueva contraseña"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <AuthTextField
                icon={Lock}
                placeholder="Repetir contraseña"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <AuthFormError message={error} />

              <Button title={loading ? 'Guardando...' : 'Guardar contraseña'} onPress={handleSubmit} loading={loading} />
            </View>
          </AuthCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    color: 'rgba(250,250,250,0.62)',
  },
  card: {
    width: '100%',
  },
  form: {
    gap: 14,
  },
})
