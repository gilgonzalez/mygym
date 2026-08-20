import { StyleSheet, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { ProgressBar } from '@/components/ui'

interface AttributeBarProps {
  icon: LucideIcon
  label: string
  level: number
  color: string
}

// Puerto de la card de atributo RPG del panel derecho de
// src/components/profile/ActivityHeatmap.tsx (apps/web), en formato
// vertical/compacto para caber en el grid de 2 columnas de StatsTab.tsx —
// current/max (level*10 / (level+1)*10) es el mismo "relleno visual" que
// usa la web; el comentario ahí mismo dice que es eso, todavía no hay un
// sistema de puntos real detrás.
export function AttributeBar({ icon: Icon, label, level, color }: AttributeBarProps) {
  const theme = useTheme()
  const current = level * 10
  const max = (level + 1) * 10
  const percent = max > 0 ? (current / max) * 100 : 0

  return (
    <View
      style={[
        styles.card,
        { borderRadius: theme.radius.card, backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: `${color}1F`, borderRadius: theme.radius.xl }]}>
          <Icon size={16} color={color} />
        </View>
        <Text style={[styles.level, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
          Lvl {level}
        </Text>
      </View>

      <Text
        style={[styles.label, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text style={[styles.points, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]}>
        {current}/{max} pts
      </Text>

      <ProgressBar value={percent} color={color} height={6} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  level: {
    fontSize: 12,
  },
  label: {
    fontSize: 14,
  },
  points: {
    fontSize: 11,
    marginTop: -4,
  },
})
