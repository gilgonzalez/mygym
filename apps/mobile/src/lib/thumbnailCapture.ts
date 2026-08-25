// Miniatura "GIF" de un ejercicio — mismo enfoque que WhatsApp/Telegram
// para "enviar como GIF": no se convierte nada a un .gif real. Se probó
// generar uno de verdad extrayendo frames y armando la paleta con gifenc, y
// la calidad quedaba muy por debajo de esto — el formato GIF tiene un techo
// bajo (256 colores, sin compresión de movimiento), así que ningún ajuste
// de frames/resolución lo saca de "se ve como un gif". Un "GIF" acá tampoco
// es un .gif de verdad: es un clip de video corto, mudo, que el cliente reproduce
// en loop sin controles — visualmente idéntico a un GIF, con la calidad y
// fluidez nativa del códec de video del dispositivo, sin ningún
// procesamiento de por medio. El archivo SÍ se sube a la carpeta images/ de
// R2 igual que cualquier otra miniatura (ver el override de folder en
// mediaUpload.ts) aunque por dentro sea video/mp4 — la tabla `media` guarda
// el mime_type real, quien lo consuma (ver isVideoThumbnail) sabe
// reproducirlo en vez de tratarlo como imagen estática.
//
// Lo único que agregamos encima de lo que hace la cámara nativa es un tope
// de tamaño/duración (maxFileSize/maxDuration de CameraView.recordAsync),
// que corta la grabación sola sin ningún paso extra — sigue siendo
// instantáneo, no hay transcodificación ni compresión adicional.
export const THUMBNAIL_VIDEO_MAX_SECONDS = 5
export const THUMBNAIL_VIDEO_MAX_BYTES = 6 * 1024 * 1024 // 6MB

// Decide cómo previsualizar/reproducir una miniatura — si es un clip de
// video (ver arriba) hay que renderizarlo con un player en loop, no como
// imagen estática (RN Image/expo-image no decodifica video). Se usa en
// todos lados donde se muestra un thumbnail de ejercicio: ver
// ThumbnailMedia.tsx.
export function isVideoThumbnail(uri?: string | null, mimeType?: string | null): boolean {
  if (mimeType) return mimeType.startsWith('video/')
  return Boolean(uri && /\.(mp4|mov|m4v)($|\?)/i.test(uri))
}
