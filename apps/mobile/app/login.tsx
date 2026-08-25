import { useEffect, useState } from 'react'
import { Link } from 'expo-router'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { Lock, Mail } from 'lucide-react-native'

import { supabase } from '@/lib/supabase'
import { signInWithGoogle } from '@/lib/googleAuth'
import { signInWithApple } from '@/lib/appleAuth'
import { useTheme } from '@/theme'
import { Button } from '@/components/ui'
import {
  AppleButton,
  AuthBackground,
  AuthCard,
  AuthDivider,
  AuthFormError,
  AuthHeader,
  AuthTextField,
  GoogleButton,
} from '@/components/auth'

// Login con email/password (igual que en apps/web, ver
// src/app/auth/actions.ts) + Google OAuth nativo vía lib/googleAuth.ts +
// Apple nativo vía lib/appleAuth.ts. El botón de Apple solo se monta en iOS
// (Platform.OS === 'ios' más abajo): es el único requerido por Apple —ver
// App Store Review Guideline 4.8— porque ya ofrecemos login con un tercero
// (Google), pero no tiene sentido en Android.
// Diseño: fondo "aurora" siempre oscuro (ver AuthBackground.tsx) en vez del
// theme.colors.background claro/oscuro que usaba antes — más cercano a la
// identidad de marca (Splash, SessionBackground) que a un form genérico.
export default function Login() {
  const theme = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)

  useEffect(() => {
    // Precalienta el custom tab de Android para que abra sin salto al tocar
    // "Continuar con Google" — no-op en iOS. Ver docs de expo-web-browser.
    WebBrowser.warmUpAsync().catch(() => {})
    return () => {
      WebBrowser.coolDownAsync().catch(() => {})
    }
  }, [])

  // Ninguno de los dos handlers navega a mano tras un login exitoso: el
  // guard <Stack.Protected guard={!!session}> del layout raíz reacciona solo
  // en cuanto useSession() (ver lib/session.ts) recibe la sesión nueva vía
  // onAuthStateChange, y expo-router saca a esta pantalla del stack. Navegar
  // acá además sería una carrera contra ese listener.
  const handleLogin = async () => {
    setError(null)
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (signInError) {
      setError(signInError.message)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo iniciar sesión con Google')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleAppleLogin = async () => {
    if (appleLoading) return
    setError(null)
    setAppleLoading(true)
    try {
      await signInWithApple()
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo iniciar sesión con Apple')
    } finally {
      setAppleLoading(false)
    }
  }

  return (
    <View style={styles.fill}>
      <AuthBackground />
      {/* behavior 'height' en Android, no undefined: sin él, KeyboardAvoidingView
          no hace nada ahí y quedaba a merced del resize nativo de la ventana —
          con el form centrado verticalmente (justifyContent: 'center' en
          styles.container) eso no alcanzaba para despejar el input de
          contraseña, el más cercano al teclado. El ScrollView también necesita
          su propio style={fill} (no solo contentContainerStyle) para que
          KeyboardAvoidingView pueda encogerlo de verdad. */}
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.fill} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <AuthHeader title="Bienvenido de nuevo" subtitle="Iniciá sesión para seguir entrenando" />

          <AuthCard style={styles.card}>
            <View style={styles.form}>
              {Platform.OS === 'ios' && (
                <AppleButton onPress={handleAppleLogin} disabled={loading || googleLoading} />
              )}
              <GoogleButton
                onPress={handleGoogleLogin}
                loading={googleLoading}
                disabled={loading || appleLoading}
              />

              <AuthDivider label="O continuá con email" />

              <AuthTextField
                icon={Mail}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!googleLoading && !appleLoading}
              />
              <AuthTextField
                icon={Lock}
                placeholder="Contraseña"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!googleLoading && !appleLoading}
              />

              <AuthFormError message={error} />

              <Button
                title={loading ? 'Ingresando...' : 'Ingresar'}
                onPress={handleLogin}
                loading={loading}
                disabled={googleLoading || appleLoading}
              />

              <Link href="/forgot-password" asChild>
                <Text
                  style={StyleSheet.flatten([
                    styles.link,
                    { color: theme.colors.emerald, fontFamily: theme.fontFamily.semibold },
                  ])}
                >
                  ¿Olvidaste tu contraseña?
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
  container: {
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
