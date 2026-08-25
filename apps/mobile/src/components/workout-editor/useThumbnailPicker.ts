import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'

import { prepareStillThumbnail } from '@/lib/mediaUpload'
import type { ThumbnailCaptureResult } from './ThumbnailCaptureModal'

// Estado + acciones de "elegir una miniatura" — cámara (vía
// ThumbnailCaptureModal, que este hook no renderiza, solo expone
// cameraOpen/openCamera/closeCamera para que el componente lo monte) o
// galería (acá mismo, con expo-image-picker). Extraído de ThumbnailField.tsx
// para reusarlo tal cual en WorkoutCoverField.tsx — mismo picker, dos
// presentaciones visuales distintas (fila compacta para la miniatura de un
// ejercicio, banner grande para la portada del workout).
interface UseThumbnailPickerOptions {
  onChange: (uri: string | null, mimeType?: string | null) => void
  // [1,1] para una miniatura cuadrada (ejercicio), [16,9] para un banner de
  // portada — ver ImagePicker.launchImageLibraryAsync.
  aspect?: [number, number]
}

export function useThumbnailPicker({ onChange, aspect = [1, 1] }: UseThumbnailPickerOptions) {
  const [cameraOpen, setCameraOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickFromLibrary = async () => {
    setError(null)
    // Todo el flujo (permiso, picker nativo, resize) va en un solo try —
    // antes solo el resize estaba cubierto, así que un fallo en el permiso
    // o en el picker en sí (launchImageLibraryAsync puede rechazar, no solo
    // devolver canceled:true) quedaba como una promesa rechazada sin
    // manejar: no pasaba nada visible, ni imagen ni error, indistinguible
    // de "no hice nada". `busy` arranca acá para que el spinner cubra todo
    // el flujo, no solo el resize final.
    setBusy(true)
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        setError('Necesitamos acceso a la galería para elegir una foto.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect,
      })

      if (result.canceled) return
      const asset = result.assets[0]
      if (!asset?.uri) {
        setError('No se pudo leer la imagen elegida.')
        return
      }

      if (asset.mimeType?.startsWith('video/') || asset.type === 'video') {
        setError('Desde la galería solo se puede elegir una foto — para un GIF, grabalo con la cámara.')
        return
      }

      const still = await prepareStillThumbnail(asset.uri)
      onChange(still.uri, still.mimeType)
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo usar esa imagen')
    } finally {
      setBusy(false)
    }
  }

  const handleCaptured = (result: ThumbnailCaptureResult) => {
    setError(null)
    onChange(result.uri, result.mimeType)
  }

  const clear = () => onChange(null, null)

  return {
    cameraOpen,
    openCamera: () => setCameraOpen(true),
    closeCamera: () => setCameraOpen(false),
    busy,
    error,
    pickFromLibrary,
    handleCaptured,
    clear,
  }
}
