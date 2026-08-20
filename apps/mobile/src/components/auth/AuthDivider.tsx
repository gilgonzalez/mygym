import { StyleSheet, Text, View } from 'react-native'

// Separador "O continuá con email" entre el login social y el form —
// puerto del <div className="relative"> con línea + texto centrado que usa
// la web en auth/login/page.tsx, con colores fijos (ver AuthBackground.tsx).
export function AuthDivider({ label }: { label: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  label: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.45)',
  },
})
