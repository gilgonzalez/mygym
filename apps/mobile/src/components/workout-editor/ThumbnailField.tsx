import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { useVideoPlayer, VideoView } from 'expo-video'
import * as ImagePicker from 'expo-image-picker'
import { Camera, ImageIcon, Trash2 } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { prepareStillThumbnail } from '@/lib/mediaUpload'
import { isVideoThumbnail, THUMBNAIL_VIDEO_MAX_SECONDS } from '@/lib/thumbnailCapture'
import { ThumbnailCaptureModal } from './ThumbnailCaptureModal'

interface ThumbnailFieldProps {
  uri?: string | null
  mimeType?: string | null
  readOnly?: boolean
  onChange: (uri: string | null, mimeType?: string | null) => void
}

export function ThumbnailField({ uri, mimeType, readOnly = false, onChange }: ThumbnailFieldProps) {
  const theme = useTheme()
  const [cameraOpen, setCameraOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isVideo = isVideoThumbnail(uri, mimeType)

  const pickFromLibrary = async () => {
    setError(null)
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError('Necesitamos acceso a la galería para elegir una foto.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    })

    if (result.canceled || !result.assets[0]?.uri) return

    const asset = result.assets[0]
    if (asset.mimeType?.startsWith('video/') || asset.type === 'video') {
      setError('Desde la galería solo se puede elegir una foto — para un GIF, grabalo con la cámara.')
      return
    }

    setBusy(true)
    try {
      const still = await prepareStillThumbnail(asset.uri)
      onChange(still.uri, still.mimeType)
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo usar esa imagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.preview, { borderColor: theme.colors.border, borderRadius: theme.radius.lg }]}>
          {uri ? (
            isVideo ? (
              <ThumbnailVideoPreview uri={uri} />
            ) : (
              <ExpoImage source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            )
          ) : (
            <ImageIcon size={22} color={theme.colors.mutedForeground} />
          )}
          {busy ? (
            <View style={styles.previewBusy}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : null}
        </View>

        <View style={styles.meta}>
          <Text style={[styles.label, { color: theme.colors.foreground, fontFamily: theme.fontFamily.semibold }]}>
            Miniatura
          </Text>
          <Text style={[styles.hint, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
            {readOnly
              ? 'La miniatura del vault no se edita acá.'
              : `Foto, o un GIF de hasta ${THUMBNAIL_VIDEO_MAX_SECONDS}s.`}
          </Text>

          {readOnly ? null : (
            <View style={styles.actions}>
              <Pressable onPress={() => setCameraOpen(true)} style={[styles.action, { borderColor: theme.colors.border }]}>
                <Camera size={14} color={theme.colors.foreground} />
                <Text style={[styles.actionText, { color: theme.colors.foreground, fontFamily: theme.fontFamily.semibold }]}>
                  Cámara
                </Text>
              </Pressable>
              <Pressable onPress={() => void pickFromLibrary()} style={[styles.action, { borderColor: theme.colors.border }]}>
                <ImageIcon size={14} color={theme.colors.foreground} />
                <Text style={[styles.actionText, { color: theme.colors.foreground, fontFamily: theme.fontFamily.semibold }]}>
                  Galería
                </Text>
              </Pressable>
              {uri ? (
                <Pressable onPress={() => onChange(null, null)} hitSlop={8} style={styles.trash}>
                  <Trash2 size={14} color={theme.colors.destructive} />
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </View>

      {error ? (
        <Text style={[styles.error, { color: theme.colors.destructive, fontFamily: theme.fontFamily.regular }]}>{error}</Text>
      ) : null}

      <ThumbnailCaptureModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCaptured={(result) => {
          setError(null)
          onChange(result.uri, result.mimeType)
        }}
      />
    </View>
  )
}

// Loop mudo, sin controles — la miniatura "GIF" es en realidad este clip de
// video (ver thumbnailCapture.ts); se reproduce así en cualquier lugar que
// la muestre, empezando por esta misma preview del editor.
function ThumbnailVideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true
    instance.muted = true
    instance.play()
  })

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
      pointerEvents="none"
    />
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  preview: {
    width: 84,
    height: 84,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  previewBusy: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 13,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 12,
  },
  trash: {
    padding: 6,
  },
  error: {
    fontSize: 12,
  },
})
