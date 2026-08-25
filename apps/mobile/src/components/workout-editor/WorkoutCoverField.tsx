import type { ComponentType } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Camera, ImagePlus, Trash2 } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { ThumbnailMedia } from '@/components/workout'
import { ThumbnailCaptureModal } from './ThumbnailCaptureModal'
import { useThumbnailPicker } from './useThumbnailPicker'

interface WorkoutCoverFieldProps {
  uri: string | null
  onChange: (uri: string | null, mimeType?: string | null) => void
}

// Cabecera del formulario, no un campo más — mismo tratamiento visual que
// WorkoutOverview.tsx (la pantalla real de un workout ya publicado): banner
// edge-to-edge de 210px, sin borde ni esquinas redondeadas, mismo
// degradado de respaldo (theme.gradients.coverFallback) cuando no hay
// portada. La idea es que al elegir una foto acá se vea prácticamente
// idéntico a como se va a ver después al entrar al workout — por eso vive
// fuera del bloque con padding de WorkoutMetaForm (ver [id].tsx, se renderiza
// antes del contenido con padding).
//
// Mismo picker que ThumbnailField (useThumbnailPicker), recorte 16:9 en vez
// de cuadrado, y siempre foto fija — nunca GIF/video (allowVideo={false}).
export function WorkoutCoverField({ uri, onChange }: WorkoutCoverFieldProps) {
  const theme = useTheme()
  const { cameraOpen, openCamera, closeCamera, busy, error, pickFromLibrary, handleCaptured, clear } = useThumbnailPicker({
    onChange,
    aspect: [16, 9],
  })

  return (
    <View>
      <View style={styles.hero}>
        {uri ? (
          <ThumbnailMedia uri={uri} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient colors={theme.gradients.coverFallback} style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient colors={['rgba(5,6,8,0.1)', 'rgba(5,6,8,0.65)']} style={StyleSheet.absoluteFill} pointerEvents="none" />

        {uri ? (
          <View style={styles.filledActions}>
            <IconPill icon={Camera} onPress={openCamera} />
            <IconPill icon={ImagePlus} onPress={() => void pickFromLibrary()} />
            <IconPill icon={Trash2} tint="#fca5a5" onPress={clear} />
          </View>
        ) : (
          <Pressable onPress={() => void pickFromLibrary()} style={styles.emptyCta}>
            <View style={styles.emptyIconWrap}>
              <ImagePlus size={22} color="#fff" />
            </View>
            <Text style={[styles.emptyTitle, { fontFamily: theme.fontFamily.bold }]}>Agregar portada</Text>
            <Text style={[styles.emptyHint, { fontFamily: theme.fontFamily.regular }]}>Es lo primero que se ve del workout</Text>
            <Pressable onPress={openCamera} hitSlop={8} style={styles.emptyCameraButton}>
              <Camera size={13} color="#fff" />
              <Text style={[styles.emptyCameraText, { fontFamily: theme.fontFamily.semibold }]}>Usar cámara</Text>
            </Pressable>
          </Pressable>
        )}

        {busy ? (
          <View style={styles.busyOverlay}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.error, { color: theme.colors.destructive, fontFamily: theme.fontFamily.regular }]}>{error}</Text>
      ) : null}

      <ThumbnailCaptureModal visible={cameraOpen} allowVideo={false} onClose={closeCamera} onCaptured={handleCaptured} />
    </View>
  )
}

function IconPill({ icon: Icon, tint = '#fff', onPress }: { icon: ComponentType<{ size?: number; color?: string }>; tint?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.iconPill}>
      <Icon size={16} color={tint} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  hero: {
    height: 210,
    overflow: 'hidden',
  },
  filledActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  iconPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  emptyCta: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    color: '#fff',
  },
  emptyHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  emptyCameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptyCameraText: {
    fontSize: 12,
    color: '#fff',
  },
  busyOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
})
