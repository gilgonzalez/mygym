import { StyleSheet, View } from 'react-native'
import { Moon, Sun } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { Switch } from './Switch'

// Puerto de src/components/ModeSwitcher.tsx — mismo patrón (Sol / Switch /
// Luna). Al tocar queda fijado en claro u oscuro explícito; para volver a
// seguir el sistema hay que llamar setMode('system') (por ahora no hay UI
// para eso, igual que la web tampoco expone "system" en el switch, solo el
// binario claro/oscuro).
export function ModeToggle() {
  const theme = useTheme()
  const isDark = theme.scheme === 'dark'

  return (
    <View style={[styles.row, { borderColor: theme.colors.border, borderRadius: theme.radius.full }]}>
      <Sun size={14} color={!isDark ? theme.colors.primary : theme.colors.mutedForeground} />
      <Switch value={isDark} onValueChange={(checked) => theme.setMode(checked ? 'dark' : 'light')} />
      <Moon size={14} color={isDark ? theme.colors.primary : theme.colors.mutedForeground} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
})
