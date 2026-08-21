import { StyleSheet, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

import { amber, useTheme } from '@/theme'
import { Button, type ButtonVariant } from './Button'

// Puerto genérico del patrón que se repite en toda la web para pantallas de
// "estado" (WorkoutError.tsx, el "Revisá tu correo" de forgot-password, el
// "Link inválido" de reset-password, el error del feed): icono en círculo +
// título + descripción + hasta dos acciones. Antes de esto cada pantalla
// mobile reimplementaba su propio icono-en-círculo a mano.
export type StatusScreenTone = 'neutral' | 'success' | 'error' | 'warning'

interface StatusScreenAction {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
}

interface StatusScreenProps {
  icon: LucideIcon
  title: string
  description?: string
  tone?: StatusScreenTone
  primaryAction?: StatusScreenAction
  secondaryAction?: StatusScreenAction
  fill?: boolean // ocupa toda la pantalla (flex: 1) vs. solo su contenido
}

export function StatusScreen({
  icon: Icon,
  title,
  description,
  tone = 'neutral',
  primaryAction,
  secondaryAction,
  fill = true,
}: StatusScreenProps) {
  const theme = useTheme()
  const tint = toneColor(tone, theme)

  return (
    <View style={[fill && styles.fill, styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: `${tint}1A` }]}>
        <Icon size={26} color={tint} />
      </View>
      <Text style={[styles.title, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
        {title}
      </Text>
      {description ? (
        <Text style={[styles.description, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
          {description}
        </Text>
      ) : null}

      {(primaryAction || secondaryAction) && (
        <View style={styles.actions}>
          {primaryAction && (
            <Button
              title={primaryAction.label}
              onPress={primaryAction.onPress}
              variant={primaryAction.variant ?? 'default'}
              loading={primaryAction.loading}
            />
          )}
          {secondaryAction && (
            <Button
              title={secondaryAction.label}
              onPress={secondaryAction.onPress}
              variant={secondaryAction.variant ?? 'ghost'}
              loading={secondaryAction.loading}
            />
          )}
        </View>
      )}
    </View>
  )
}

function toneColor(tone: StatusScreenTone, theme: ReturnType<typeof useTheme>) {
  switch (tone) {
    case 'success':
      return theme.colors.emerald
    case 'error':
      return theme.colors.destructive
    case 'warning':
      return amber[500]
    default:
      return theme.colors.mutedForeground
  }
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    marginTop: 12,
    width: '100%',
    gap: 8,
    alignItems: 'center',
  },
})
