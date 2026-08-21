// Punto de entrada del paquete compartido entre apps/web y apps/mobile.
//
// Reglas para este paquete:
// - Solo TypeScript puro (tipos, validación, funciones sin estado). Nada de
//   React, Next.js ni React Native: cada app tiene su propia versión de React
//   y su propio runtime, así que el código compartido no puede depender de
//   ninguno de los dos.
// - Los tipos de la base de datos (`./types/database`) se regeneran acá con
//   `bun run supabase:types` desde la raíz del repo — no editar a mano.
export * from './feeling'
export * from './profile'
export * from './rewards'
export * from './social'
export * from './streak'
export * from './tag-stats'
export * from './types'
export * from './validation'
export * from './workout'
export * from './workout-tags'
export * from './workout/sessionNavigation'
