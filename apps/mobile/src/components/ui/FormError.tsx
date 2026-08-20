import { StyleSheet, Text, View } from 'react-native'
import { AlertCircle } from 'lucide-react-native'

import { useTheme } from '@/theme'

// El mensaje de error a nivel formulario se repetía a mano en login,
// forgot-password y reset-password (icono + texto en rojo) — ahora es un
// solo componente.
export function FormError({ message }: { message: string | null }) {
  const theme = useTheme()
  if (!message) return null

  return (
    <View style={styles.row}>
      <AlertCircle size={15} color={theme.colors.destructive} />
      <Text style={[styles.text, { color: theme.colors.destructive, fontFamily: theme.fontFamily.regular }]}>
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 13,
    flexShrink: 1,
  },
})
