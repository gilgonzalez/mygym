// Paleta cruda (sin significado semántico) — mismos stops de Tailwind que
// usa apps/web (ver tailwind.config.js + src/app/globals.css: la web corre
// el theme "green" default de shadcn/ui sobre Tailwind, más algunos acentos
// puntuales en el feed: emerald para badges/gradientes, slate para overlays
// oscuros, amber/rose para detalles). Los tokens semánticos (theme/colors.ts)
// se arman a partir de esto para que la identidad de marca sea la misma en
// las dos apps.
export const zinc = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b',
  950: '#09090b',
} as const

export const green = {
  50: '#f0fdf4',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  950: '#052e16',
} as const

export const emerald = {
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  950: '#022c22',
} as const

// Neutros con un toque de verde — la web deja el fondo en zinc puro
// (globals.css) y el verde solo aparece en acentos puntuales; en mobile eso
// se sentía "gris genérico" sin la marca. greenGray es zinc con un pelo de
// matiz esmeralda mezclado adentro, para el fondo de pantalla y las
// superficies "muted", sin llegar a competir con el primary real.
export const greenGray = {
  25: '#f5faf7', // fondo modo claro
  50: '#eef5f0', // secondary/muted modo claro
  900: '#0d1512', // card modo oscuro
  950: '#0a120e', // fondo modo oscuro
  800: '#1a2621', // secondary/muted modo oscuro
} as const

export const slate = {
  900: '#0f172a',
  950: '#020617',
} as const

export const indigo = {
  950: '#1e1b4b',
} as const

export const amber = {
  400: '#fbbf24',
  500: '#f59e0b',
} as const

// Acento cian — el segundo color clásico del duotono Blade Runner (verde de
// marca + cian eléctrico), reservado para el CTA de "Comenzar workout".
export const cyan = {
  300: '#67e8f9',
  400: '#22d3ee',
  500: '#06b6d4',
} as const

export const rose = {
  50: '#fff1f2',
  500: '#e11d48',
} as const

export const red = {
  500: '#ef4444',
  900: '#7f1d1d',
} as const
