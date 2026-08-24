// Miniatura "GIF" de un ejercicio — mismo enfoque que WhatsApp/Telegram
// para "enviar como GIF": no se convierte nada a un .gif real (eso fue el
// intento anterior, con extracción de frames + paleta + gifenc — quedaba
// lento y el resultado se veía entrecortado por más ajustes que se le
// hicieran, porque el problema no era el algoritmo sino el enfoque). Un
// "GIF" ahí tampoco es un .gif de verdad: es un clip de video corto, mudo,
// que el cliente reproduce en loop sin controles — visualmente idéntico a
// un GIF, con la calidad y fluidez nativa del códec de video del
// dispositivo, sin ningún procesamiento de por medio.
//
// Lo único que agregamos encima de lo que hace la cámara nativa es un tope
// de tamaño/duración (maxFileSize/maxDuration de CameraView.recordAsync),
// que corta la grabación sola sin ningún paso extra — sigue siendo
// instantáneo, no hay transcodificación ni compresión adicional.
export const THUMBNAIL_VIDEO_MAX_SECONDS = 8
export const THUMBNAIL_VIDEO_MAX_BYTES = 6 * 1024 * 1024 // 6MB

export function isVideoThumbnail(uri?: string | null, mimeType?: string | null): boolean {
  if (mimeType) return mimeType.startsWith('video/')
  return Boolean(uri && /\.(mp4|mov|m4v)($|\?)/i.test(uri))
}
