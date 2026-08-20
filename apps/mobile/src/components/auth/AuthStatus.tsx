import { StyleSheet, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { Button } from '@/components/ui'
import { AuthBackground } from './AuthBackground'
import { AuthCard } from './AuthCard'

export type AuthStatusTone = 'success' | 'error' | 'neutral'

const TONE_COLOR: Record<AuthStatusTone, string> = {
  success: '#34d399',
  error: '#f87171',
  neutral: 'rgba(255,255,255,0.6)',
}

// Reemplazo de ui/StatusScreen.tsx para los estados "listo"/"error" del
// flujo de auth (mail enviado, link vencido, contraseña actualizada): vive
// sobre el mismo <AuthBackground>/<AuthCard> que el resto de estas
// pantallas en vez de theme.colors, así el contraste no depende de si el
// sistema está en claro u oscuro. Solo soporta una acción primaria (con
// gradiente, siempre texto blanco vía Button) porque es lo único que usan
// estos tres flujos hoy — una acción secundaria "ghost" heredaría el color
// de theme.colors.foreground de Button y perdería contraste según el tema.
export function AuthStatus({
  icon: Icon,
  tone = 'neutral',
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon
  tone?: AuthStatusTone
  title: string
  description?: string
  actionLabel: string
  onAction: () => void
}) {
  const theme = useTheme()
  const tint = TONE_COLOR[tone]

  return (
    <View style={styles.fill}>
      <AuthBackground />
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: `${tint}22`, borderColor: `${tint}44` }]}>
          <Icon size={26} color={tint} />
        </View>

        <Text style={[styles.title, { fontFamily: theme.fontFamily.bold }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { fontFamily: theme.fontFamily.regular }]}>{description}</Text>
        ) : null}

        <AuthCard style={styles.card}>
          <Button title={actionLabel} onPress={onAction} />
        </AuthCard>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    color: '#fafafa',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    color: 'rgba(250,250,250,0.62)',
    paddingHorizontal: 8,
  },
  card: {
    width: '100%',
    marginTop: 16,
    padding: 18,
  },
})
