import { amber, cyan, emerald, green, greenGray, indigo, red, rose, slate, zinc } from './palette'

// Tokens semánticos — traducción directa de las custom properties HSL de
// src/app/globals.css (apps/web) a hex, para que ambas apps usen exactamente
// los mismos colores de marca. Cada línea indica la variable CSS de la que
// sale, así queda fácil mantenerlos sincronizados si cambia el theme ahí.
export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
  // Acentos decorativos puntuales (gradientes/badges del feed), no forman
  // parte del set semántico de shadcn pero sí de la identidad visual.
  emerald: string
  emeraldSoft: string
  glowShadow: string
  glowShadowHover: string
  glowBorder: string
}

// A diferencia de la web (globals.css deja el fondo en zinc puro y el verde
// solo aparece en acentos puntuales), acá el fondo y las superficies
// "muted"/"secondary" llevan un matiz verde de baja saturación (greenGray en
// palette.ts) y las cards tienen SIEMPRE borde+sombra verde (glowBorder/
// glowShadow) en vez de solo cuando algo está likeado — la marca tiene que
// notarse en reposo, no solo al interactuar.
export const lightColors: ThemeColors = {
  background: greenGray[25],
  foreground: zinc[950], // --foreground: 240 10% 3.9%
  card: '#ffffff', // --card: 0 0% 100%
  cardForeground: zinc[950], // --card-foreground
  popover: '#ffffff', // --popover
  popoverForeground: zinc[950], // --popover-foreground
  primary: green[600], // --primary: 142.1 76.2% 36.3%
  primaryForeground: rose[50], // --primary-foreground: 355.7 100% 97.3%
  secondary: greenGray[50],
  secondaryForeground: zinc[900], // --secondary-foreground: 240 5.9% 10%
  muted: greenGray[50],
  mutedForeground: zinc[500], // --muted-foreground: 240 3.8% 46.1%
  accent: greenGray[50],
  accentForeground: zinc[900], // --accent-foreground
  destructive: red[500], // --destructive: 0 84.2% 60.2%
  destructiveForeground: '#fafafa', // --destructive-foreground: 0 0% 98%
  border: zinc[200], // --border: 240 5.9% 90%
  input: zinc[200], // --input
  ring: green[600], // --ring
  emerald: emerald[600], // texto "Feed publico" / "Mi circulo"
  emeraldSoft: 'rgba(16, 185, 129, 0.1)', // emerald-500/10
  glowShadow: 'rgba(21, 128, 61, 0.25)', // .glow-card (light) — green-700
  glowShadowHover: 'rgba(21, 128, 61, 0.4)',
  glowBorder: 'rgba(22, 163, 74, 0.3)', // primary/30, siempre visible en cards
}

export const darkColors: ThemeColors = {
  background: greenGray[950],
  foreground: '#fafafa', // --foreground: 0 0% 98%
  card: greenGray[900],
  cardForeground: '#fafafa',
  popover: greenGray[900],
  popoverForeground: '#fafafa',
  primary: green[500], // --primary: 142.1 70.6% 45.3%
  primaryForeground: green[950], // --primary-foreground: 144.9 80.4% 10%
  secondary: greenGray[800],
  secondaryForeground: '#fafafa',
  muted: greenGray[800],
  mutedForeground: zinc[400], // --muted-foreground: 240 5% 64.9%
  accent: greenGray[800],
  accentForeground: '#fafafa',
  destructive: red[900], // --destructive: 0 62.8% 30.6%
  destructiveForeground: '#fafafa',
  border: zinc[800], // --border: 240 3.7% 15.6%
  input: zinc[800],
  ring: green[500],
  emerald: emerald[400],
  emeraldSoft: 'rgba(16, 185, 129, 0.1)',
  glowShadow: 'rgba(74, 222, 128, 0.15)', // .dark .glow-card — green-400
  glowShadowHover: 'rgba(74, 222, 128, 0.3)',
  glowBorder: 'rgba(74, 222, 128, 0.4)', // primary/40, siempre visible en cards
}

// Stops crudos que se usan directo en gradientes (portadas sin cover, CTA,
// skeletons) — ver src/components/WorkoutCard.tsx y feed/page.tsx en la web.
export const gradients = {
  coverFallback: [slate[900], slate[950], indigo[950]] as const,
  primaryButton: [emerald[500], emerald[400]] as const,
  heroText: [green[500], green[600], zinc[900]] as const,
  amberCta: [amber[500], amber[400]] as const,
  neonCta: [cyan[500], cyan[400]] as const,
}
