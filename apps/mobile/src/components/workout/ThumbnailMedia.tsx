import type { ImageStyle, StyleProp, ViewStyle } from 'react-native'
import { Image as ExpoImage, type ImageContentFit } from 'expo-image'
import { useVideoPlayer, VideoView } from 'expo-video'

import { isVideoThumbnail } from '@/lib/thumbnailCapture'

// Miniatura de un ejercicio, en cualquier lugar de la app que la muestre —
// puede ser una imagen fija o el clip de video mudo que hace de "GIF" (ver
// thumbnailCapture.ts: nunca es un .gif de verdad). Un <Image>/expo-image
// no decodifica video, así que hace falta este switch: es el mismo criterio
// que ya tenía ThumbnailField.tsx para su propia preview en el editor,
// extraído acá para no repetirlo en cada lugar que pinta un thumbnail
// (ExerciseListItem, ExerciseVaultSheet, SessionMediaRing, etc.) — antes
// del extract, esos otros lugares solo tenían un <Image> plano y un
// thumbnail de video ahí se veía roto/en blanco.
interface ThumbnailMediaProps {
  uri: string
  mimeType?: string | null
  // Tipado como ImageStyle (lo que pide expo-image) — en la práctica todos
  // los call sites pasan solo layout/borderRadius, así que también es válido
  // como ViewStyle (lo que pide VideoView); el cast de abajo asume eso.
  style: StyleProp<ImageStyle>
  contentFit?: ImageContentFit
  accessibilityLabel?: string
}

export function ThumbnailMedia({ uri, mimeType, style, contentFit = 'cover', accessibilityLabel }: ThumbnailMediaProps) {
  if (isVideoThumbnail(uri, mimeType)) {
    return <LoopingThumbnailVideo uri={uri} style={style as StyleProp<ViewStyle>} contentFit={contentFit} />
  }

  return <ExpoImage source={{ uri }} style={style} contentFit={contentFit} accessibilityLabel={accessibilityLabel} />
}

// Loop mudo, sin controles.
function LoopingThumbnailVideo({
  uri,
  style,
  contentFit,
}: {
  uri: string
  style: StyleProp<ViewStyle>
  contentFit: ImageContentFit
}) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true
    instance.muted = true
    instance.play()
  })

  return (
    <VideoView
      player={player}
      style={style}
      // VideoView solo entiende 'contain' | 'cover' | 'fill' — expo-image
      // acepta más variantes ('none', 'scale-down'), así que cualquier otra
      // cosa cae a 'cover' (el default que ya usan todos los call sites).
      contentFit={contentFit === 'contain' || contentFit === 'fill' ? contentFit : 'cover'}
      nativeControls={false}
      pointerEvents="none"
    />
  )
}
