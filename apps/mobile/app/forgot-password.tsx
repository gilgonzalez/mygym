import { useState } from 'react'
import { Link, router } from 'expo-router'
import * as Linking from 'expo-linking'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Mail, MailCheck } from 'lucide-react-native'

import { supabase } from '@/lib/supabase'
import { useTheme } from '@/theme'
import { Button } from '@/components/ui'
import { AuthBackground, AuthCard, AuthFormError, AuthHeader, AuthStatus, AuthTextField } from '@/components/auth'

// Paso 1 del flujo "olvidé mi contraseña": pedimos el mail y Supabase manda
// un link mágico a mygym://reset-password?code=... (ver app/reset-password.tsx).
// Sirve tanto para resetear una contraseña existente como para que alguien
// que se creó la cuenta con Google configure una contraseña por primera vez:
// resetPasswordForEmail no distingue entre ambos casos.
export default function ForgotPassword() {
  const theme = useTheme()
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
      <AuthStatus
        icon={MailCheck}
        tone="success"
        title="Revisá tu correo"
        description={`Si ${email.trim()} está registrado, te enviamos un link para configurar tu contraseña.`}
        actionLabel="Volver a iniciar sesión"
        // '/' en vez de '/login' a propósito: '/login' solo está registrada
        // mientras no hay sesión (ver Stack.Protected en app/_layout.tsx), y
        // esta pantalla también es alcanzable desde un deep link estando
        // logueado. '/' resuelve bien en los dos casos (login si no hay
        // sesión, tabs si la hay).
        onAction={() => router.replace('/')}
      />
    )
  }

  return (
    <View style={styles.fill}>
      <AuthBackground />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AuthHeader
            title="Olvidé mi contraseña"
            subtitle="Te mandamos un link para crear o restablecer tu contraseña, aunque hoy entres solo con Google."
          />

          <AuthCard style={styles.card}>
            <View style={styles.form}>
              <AuthTextField
                icon={Mail}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <AuthFormError message={error} />

              <Button title={loading ? 'Enviando...' : 'Enviar link'} onPress={handleSubmit} loading={loading} />

              <Link href="/" asChild>
                <Text
                  style={StyleSheet.flatten([
                    styles.link,
                    { color: theme.colors.emerald, fontFamily: theme.fontFamily.semibold },
                  ])}
                >
                  Volver a iniciar sesión
                </Text>
              </Link>
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 28,
  },
  card: {
    width: '100%',
  },
  form: {
    gap: 14,
  },
  link: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
  },
})
