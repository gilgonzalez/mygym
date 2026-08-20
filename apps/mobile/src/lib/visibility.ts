import type { WorkoutVisibility } from '@mygym/shared'

// Colores característicos por visibilidad — antes el badge de "mis
// workouts" usaba siempre el mismo gris (outline neutro), así que había que
// leer el texto para saber el estado. Con un color fijo por valor, el ojo
// se acostumbra al color antes que al texto (ver MyWorkoutCard.tsx).
// public = el color primario de marca (lo que ya ve todo el mundo en el
// feed); el resto son colores que no compiten con la paleta de acentos que
// ya usa el resto de la app (ámbar de dificultad, cian del CTA, etc).
export const VISIBILITY_COLORS: Record<WorkoutVisibility, string> = {
  public: '#16a34a', // verde — visible para cualquiera
  followers: '#0ea5e9', // celeste — solo seguidores
  private: '#8b5cf6', // violeta — solo el dueño
  draft: '#a1a1aa', // gris — todavía no publicado
}
