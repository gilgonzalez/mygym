import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'

// Glass card para los forms de auth — mismo radius "card" (28) que usan las
// cards del feed (ui/Card.tsx), pero traslúcida en vez de sólida para que
// se note el <AuthBackground> aurora por debajo.
export function AuthCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.wrapper, style]}>
      <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.tint]} pointerEvents="none" />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    padding: 24,
  },
  tint: {
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
})
