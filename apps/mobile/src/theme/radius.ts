// --radius: 0.5rem (8px) en la web, con md/sm derivados de esa base (ver
// tailwind.config.js). Sumamos "xl"/"card"/"full" para los patrones que en
// la web se resuelven con clases arbitrarias tipo rounded-[28px].
export const radius = {
  sm: 4, // calc(var(--radius) - 4px)
  md: 6, // calc(var(--radius) - 2px)
  lg: 8, // var(--radius)
  xl: 16,
  card: 28, // rounded-[28px] — cards del feed / auth
  full: 999, // rounded-full — pills, avatares, botones tipo tab
}
