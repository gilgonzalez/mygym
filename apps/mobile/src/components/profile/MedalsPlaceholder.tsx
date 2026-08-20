import { StyleSheet, Text, View } from 'react-native'
import { Lock, Medal } from 'lucide-react-native'

import { useTheme } from '@/theme'

// Espacio reservado para el sistema de medallas — todavía no hay diseño de
// producto ni tabla en Supabase para esto, así que por ahora es solo un
// grid de slots bloqueados en vez de una lista real. Cuando exista la
// feature, esto se reemplaza por el grid de medallas ganadas/pendientes;
// mientras tanto deja el lugar reservado en el tab RPG del perfil (ver
// components/profile/RpgTab.tsx) para no tener que rearmar el layout.
const PLACEHOLDER_SLOTS = 6

export function MedalsPlaceholder() {
  const theme = useTheme()

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Medal size={16} color={theme.colors.mutedForeground} />
        <Text style={[styles.title, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
          Medallas
        </Text>
      </View>
      <Text style={[styles.subtitle, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
        Próximamente vas a poder desbloquear medallas por tus logros.
      </Text>

      <View style={styles.grid}>
        {Array.from({ length: PLACEHOLDER_SLOTS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.slot,
              { borderRadius: theme.radius.xl, borderColor: theme.colors.border, backgroundColor: theme.colors.secondary },
            ]}
          >
            <Lock size={18} color={theme.colors.mutedForeground} />
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slot: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
})
