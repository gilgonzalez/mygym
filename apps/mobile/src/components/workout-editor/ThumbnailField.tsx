import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Camera, ImageIcon, Trash2 } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { THUMBNAIL_VIDEO_MAX_SECONDS } from '@/lib/thumbnailCapture'
import { ThumbnailMedia } from '@/components/workout'
import { ThumbnailCaptureModal } from './ThumbnailCaptureModal'
import { useThumbnailPicker } from './useThumbnailPicker'

interface ThumbnailFieldProps {
  uri?: string | null
  mimeType?: string | null
  readOnly?: boolean
  // false para la portada del workout: siempre una imagen fija, sin la
  // opción de GIF que sí tiene la miniatura de un ejercicio.
  allowVideo?: boolean
  label?: string
  onChange: (uri: string | null, mimeType?: string | null) => void
}

export function ThumbnailField({ uri, mimeType, readOnly = false, allowVideo = true, label = 'Miniatura', onChange }: ThumbnailFieldProps) {
  const theme = useTheme()
  const { cameraOpen, openCamera, closeCamera, busy, error, pickFromLibrary, handleCaptured, clear } = useThumbnailPicker({
    onChange,
  })

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.preview, { borderColor: theme.colors.border, borderRadius: theme.radius.lg }]}>
          {uri ? (
            <ThumbnailMedia uri={uri} mimeType={mimeType} style={StyleSheet.absoluteFill} contentFit="cover" />
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
            {label}
          </Text>
          <Text style={[styles.hint, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
            {readOnly
              ? 'La miniatura del vault no se edita acá.'
              : allowVideo
                ? `Foto, o un GIF de hasta ${THUMBNAIL_VIDEO_MAX_SECONDS}s.`
                : 'Foto.'}
          </Text>

          {readOnly ? null : (
            <View style={styles.actions}>
              <Pressable onPress={openCamera} style={[styles.action, { borderColor: theme.colors.border }]}>
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
                <Pressable onPress={clear} hitSlop={8} style={styles.trash}>
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

      <ThumbnailCaptureModal visible={cameraOpen} allowVideo={allowVideo} onClose={closeCamera} onCaptured={handleCaptured} />
    </View>
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
