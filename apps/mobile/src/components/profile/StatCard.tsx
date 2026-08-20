import { StyleSheet, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/theme'

// Puerto del patrón "icono en cuadrado + valor + label" que se repite en el
// grid de stats del perfil (racha, nivel, minutos entrenados, etc — ver
// src/app/(app)/profile/page.tsx).
interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  color?: string
}

export function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const theme = useTheme()
  const tint = color ?? theme.colors.primary

  return (
    <View style={[styles.card, { borderRadius: theme.radius.card, backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: `${tint}1F`, borderRadius: theme.radius.xl }]}>
        <Icon size={18} color={tint} />
      </View>
      <Text style={[styles.value, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
  },
  label: {
    fontSize: 11,
  },
})
