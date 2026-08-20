// Misma familia que la web (next/font/google → Inter, ver src/app/layout.tsx),
// cargada acá vía @expo-google-fonts/inter (ver app/_layout.tsx). Los pesos
// se registran con estos nombres exactos al llamar a useFonts.
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  // Fuente "de reloj" del cronómetro (.font-timer en globals.css de la web).
  // No es un Google Font: se registra desde un .ttf local, ver app/_layout.tsx
  // y assets/fonts/ (convertido del .woff2 de @fontsource/dseg7-classic).
  timer: 'DSEG7Classic-Regular',
  timerBold: 'DSEG7Classic-Bold',
} as const

// Escala de tamaños, calcada de los text-* que más se repiten en la web.
export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
} as const
