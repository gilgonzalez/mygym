import { useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/theme'
import { Avatar, ModeToggle } from '@/components/ui'
import { AccountMenu, type MenuAnchor } from './AccountMenu'

interface ProfileTopHeaderProps {
  displayName: string
  usernameOrEmail: string
  avatarUrl: string | null | undefined
  loggingOut: boolean
  onLogout: () => void
}

// Header fijo del perfil (ver app/(tabs)/profile.tsx): identidad + switcher
// de tema + el avatar como disparador del menú contextual de cuenta (ver
// AccountMenu.tsx) — "Cerrar sesión" vivía acá abajo como su propio botón
// (footer rojo); ahora es el último item de ese menú, así el perfil
// aprovecha mejor el alto de pantalla. El XP/nivel/stats se movieron al tab
// "Cuenta" (ver AccountTab.tsx).
export function ProfileTopHeader({ displayName, usernameOrEmail, avatarUrl, loggingOut, onLogout }: ProfileTopHeaderProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const avatarRef = useRef<View>(null)
  const [menuVisible, setMenuVisible] = useState(false)
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null)

  const openMenu = () => {
    // measureInWindow en vez de onLayout: necesitamos la posición absoluta
    // en pantalla (el menú se monta en un <Modal> aparte, con su propio
    // árbol de layout), no la posición relativa al header.
    avatarRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height })
      setMenuVisible(true)
    })
  }

  return (
    <View
      style={[
        styles.wrapper,
        { paddingTop: insets.top + 12, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background },
      ]}
    >
      <Pressable ref={avatarRef} onPress={openMenu} hitSlop={6}>
        <Avatar uri={avatarUrl} name={displayName} size={52} />
      </Pressable>
      <View style={styles.identity}>
        <Text
          style={[styles.name, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <Text
          style={[styles.username, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}
          numberOfLines={1}
        >
          {usernameOrEmail}
        </Text>
      </View>
      <ModeToggle />

      <AccountMenu
        visible={menuVisible}
        anchor={anchor}
        onClose={() => setMenuVisible(false)}
        onLogout={onLogout}
        loggingOut={loggingOut}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
  },
  username: {
    fontSize: 13,
  },
})
