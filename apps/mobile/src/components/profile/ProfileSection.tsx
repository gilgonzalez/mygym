import { StyleSheet, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/theme'

// React.ReactNode (namespace ambiente, sin import) en vez de `import type {
// ReactNode } from 'react'` a propósito: este monorepo tiene dos copias de
// @types/react (18.x en la raíz para la web, 19.x local en apps/mobile) —
// un import nombrado ata el tipo a una copia puntual, y eso no matchea con
// los props de <View> (react-native, hoisteado a la raíz, resuelve 'react'
// contra la copia de ahí). El namespace global sí es compatible entre las
// dos. Mismo criterio que ui/Card.tsx.
interface ProfileSectionProps {
  icon: LucideIcon
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}

// Card con encabezado (ícono + título + acción opcional a la derecha) que se
// repite en el tab Cuenta del perfil (bio, peso, metas, logros) — mismo
// borde/fondo que StatCard/AttributeBar, sin el glow de las cards de
// contenido (Card, ui/Card.tsx): acá la densidad de información importa más
// que el efecto neón.
export function ProfileSection({ icon: Icon, title, children, action }: ProfileSectionProps) {
  const theme = useTheme()

  return (
    <View
      style={[
        styles.wrapper,
        { borderRadius: theme.radius.card, backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon size={16} color={theme.colors.mutedForeground} />
          <Text style={[styles.title, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
            {title}
          </Text>
        </View>
        {action}
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
  },
})
