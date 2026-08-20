// Formatea "Nombre Apellido" → "Nombre A." para previews compactos (quién le
// dio like a un workout, etc). Si no hay segunda palabra (nombre simple, o
// no hay apellido cargado) devuelve solo la primera. Pensado para usarse con
// `name` de la tabla users; el caller decide el fallback a `username` si
// `name` viene vacío.
export function formatShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`
}
