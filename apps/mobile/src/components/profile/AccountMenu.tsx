import { useEffect } from 'react'
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { BlurView } from 'expo-blur'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { Bell, HelpCircle, LogOut, Pencil, ShieldCheck, type LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/theme'

export interface MenuAnchor {
  x: number
  y: number
  width: number
  height: number
}

interface AccountMenuProps {
  visible: boolean
  anchor: MenuAnchor | null
  onClose: () => void
  onLogout: () => void
  loggingOut: boolean
}

// Items placeholder a propósito — todavía no tienen pantalla propia.
const PLACEHOLDER_ITEMS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'security', label: 'Seguridad', icon: ShieldCheck },
  { key: 'notifications', label: 'Notificaciones', icon: Bell },
  { key: 'faqs', label: 'Preguntas frecuentes', icon: HelpCircle },
]

const MENU_WIDTH = 240

// Menú contextual del avatar (se abre desde ProfileTopHeader.tsx). No hay
// ninguna librería de menú nativo instalada (zeego, react-native-menu, etc.
// piden código nativo compilado, y esta app corre en Expo Go sin dev
// client) — esto es un <Modal> + card propios que imitan el look de un menú
// nativo (blur de fondo, tarjeta flotante anclada al elemento tocado,
// entrada con spring) en vez de envolver el UIMenu/popup real. "Editar
// información" (primero) navega a app/edit-profile.tsx y "Cerrar sesión"
// (siempre al final) desloguea de verdad — el resto son placeholders que
// por ahora solo cierran el menú.
export function AccountMenu({ visible, anchor, onClose, onLogout, loggingOut }: AccountMenuProps) {
  const theme = useTheme()
  const scale = useSharedValue(0.85)

  const handleEditProfile = () => {
    onClose()
    router.push('/edit-profile')
  }

  useEffect(() => {
    if (!visible) return
    scale.value = 0.85
    scale.value = withSpring(1, { damping: 16, stiffness: 260 })
  }, [visible, scale])

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  if (!anchor) return null

  const { width: screenWidth } = Dimensions.get('window')
  const left = Math.min(anchor.x, screenWidth - MENU_WIDTH - 16)
  const top = anchor.y + anchor.height + 8

  const handleLogout = () => {
    onClose()
    onLogout()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <BlurView intensity={20} tint={theme.scheme} style={StyleSheet.absoluteFill} />
      </Pressable>

      <Animated.View
        style={[
          styles.card,
          cardStyle,
          {
            top,
            left,
            width: MENU_WIDTH,
            backgroundColor: theme.colors.popover,
            borderRadius: theme.radius.xl,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <MenuRow icon={Pencil} label="Editar información" onPress={handleEditProfile} />

        {PLACEHOLDER_ITEMS.map((item) => (
          <MenuRow key={item.key} icon={item.icon} label={item.label} onPress={onClose} showBorder />
        ))}

        <MenuRow
          icon={LogOut}
          label={loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          onPress={handleLogout}
          showBorder
          destructive
          disabled={loggingOut}
        />
      </Animated.View>
    </Modal>
  )
}

function MenuRow({
  icon: Icon,
  label,
  onPress,
  showBorder = false,
  destructive = false,
  disabled = false,
}: {
  icon: LucideIcon
  label: string
  onPress: () => void
  showBorder?: boolean
  destructive?: boolean
  disabled?: boolean
}) {
  const theme = useTheme()
  const color = destructive ? theme.colors.destructive : theme.colors.popoverForeground

  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.rowWrapper}>
      {({ pressed }) => (
        <View
          style={[
            styles.row,
            showBorder && { borderTopColor: theme.colors.border, borderTopWidth: StyleSheet.hairlineWidth },
            pressed && { backgroundColor: theme.colors.secondary },
            disabled && styles.disabled,
          ]}
        >
          <Text style={[styles.label, { color, fontFamily: theme.fontFamily.medium }]}>{label}</Text>
          <Icon size={16} color={color} />
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  rowWrapper: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
})
