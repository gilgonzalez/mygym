import { Image, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/theme'

const GLOW = '#10b981'

// Encabezado de marca de login/forgot-password/reset-password, pensado para
// vivir siempre sobre <AuthBackground> (fondo oscuro fijo). El isotipo
// (splash-icon.png, mismo archivo que components/Splash.tsx) ya trae su
// propio fondo negro + glow horneados en el PNG, así que acá no lo
// encerramos en otra placa — solo se le suma un glow extra (shadow) para
// que se funda con las manchas de color del fondo en vez de verse como un
// cuadrado pegado encima.
export function AuthHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <View style={styles.glow}>
        <Image
          source={require('../../../assets/images/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={[styles.brand, { fontFamily: theme.fontFamily.bold }]}>MYGYM</Text>
      <Text style={[styles.title, { fontFamily: theme.fontFamily.bold }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { fontFamily: theme.fontFamily.regular }]}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  glow: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: GLOW,
    shadowOpacity: 0.7,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  logo: {
    width: 72,
    height: 72,
  },
  brand: {
    fontSize: 12,
    letterSpacing: 3,
    color: '#34d399',
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginTop: 6,
    color: '#fafafa',
  },
  subtitle: {
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 6,
    paddingHorizontal: 12,
    color: 'rgba(250,250,250,0.62)',
  },
})
