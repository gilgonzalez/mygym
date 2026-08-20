import { StyleSheet, Text, View } from 'react-native'
import { AlertCircle } from 'lucide-react-native'

// Versión de ui/FormError.tsx con color fijo (rojo claro) en vez de
// theme.colors.destructive, para que se lea bien siempre sobre el fondo
// oscuro de <AuthBackground> — theme.colors.destructive varía con el tema
// del sistema y en modo oscuro es un rojo apagado, pensado para superficies
// claras/oscuras "normales", no para este fondo siempre oscuro.
export function AuthFormError({ message }: { message: string | null }) {
  if (!message) return null

  return (
    <View style={styles.row}>
      <AlertCircle size={15} color="#f87171" />
      <Text style={styles.text}>{message}</Text>
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
    color: '#f87171',
    flexShrink: 1,
  },
})
