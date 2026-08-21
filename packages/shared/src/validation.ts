// Regla compartida entre apps/web y apps/mobile — antes el "6" y el mensaje
// de error estaban copiados a mano en cada formulario de contraseña.
export const MIN_PASSWORD_LENGTH = 6

export function isPasswordValid(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH
}

export function getPasswordLengthError(): string {
  return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
}
