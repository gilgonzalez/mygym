import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RefreshCw, Square, X } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { THUMBNAIL_VIDEO_MAX_BYTES, THUMBNAIL_VIDEO_MAX_SECONDS } from '@/lib/thumbnailCapture'
import { prepareStillThumbnail } from '@/lib/mediaUpload'

export type ThumbnailCaptureResult = {
  uri: string
  mimeType: 'image/jpeg' | 'video/mp4'
}

interface ThumbnailCaptureModalProps {
  visible: boolean
  // false para la portada del workout: se oculta el chip "GIF" y la cámara
  // queda fija en modo foto (ver ThumbnailField).
  allowVideo?: boolean
  onClose: () => void
  onCaptured: (result: ThumbnailCaptureResult) => void
}

type CaptureMode = 'photo' | 'gif'
type Phase = 'idle' | 'countdown' | 'recording' | 'processing'

// Modo "gif" = grabar un clip corto y usarlo directo, sin tratamiento —
// igual que "Enviar como GIF" en WhatsApp (ver thumbnailCapture.ts para el
// porqué: se probó generar un .gif real con extracción de frames + paleta y
// la calidad quedaba muy por debajo de esto — el formato GIF tiene un techo
// bajo, 256 colores sin compresión de movimiento). `mute: true` en
// CameraView graba sin audio (no hace falta: el clip se va a reproducir
// siempre muteado), así que tampoco hace falta permiso de micrófono. El
// único límite que agregamos es tamaño/duración (maxFileSize/maxDuration),
// que corta la cámara sola — no hay paso de "procesando" para este modo, la
// captura es el resultado final.
export function ThumbnailCaptureModal({ visible, allowVideo = true, onClose, onCaptured }: ThumbnailCaptureModalProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const cameraRef = useRef<CameraView>(null)
  const recordingStartedAt = useRef(0)
  const recordingLock = useRef(false)
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<CameraType>('back')
  const [mode, setMode] = useState<CaptureMode>('photo')
  const [phase, setPhase] = useState<Phase>('idle')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [cameraReady, setCameraReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startRecordingRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    if (!visible) {
      setPhase('idle')
      setCountdown(null)
      setElapsed(0)
      setError(null)
      setCameraReady(false)
      recordingLock.current = false
      return
    }
    if (!allowVideo) setMode('photo')
    if (!cameraPermission?.granted) {
      void requestCameraPermission()
    }
  }, [visible, allowVideo, cameraPermission?.granted, requestCameraPermission])

  useEffect(() => {
    if (phase !== 'countdown' || countdown === null) return
    if (countdown <= 0) {
      void startRecordingRef.current()
      return
    }
    const id = setTimeout(() => setCountdown((value) => (value === null ? null : value - 1)), 1000)
    return () => clearTimeout(id)
  }, [phase, countdown])

  useEffect(() => {
    if (phase !== 'recording') return
    const id = setInterval(() => {
      setElapsed(Math.min(THUMBNAIL_VIDEO_MAX_SECONDS, (Date.now() - recordingStartedAt.current) / 1000))
    }, 100)
    return () => clearInterval(id)
  }, [phase])

  const busy = phase !== 'idle'

  const startRecording = async () => {
    if (recordingLock.current || !cameraRef.current) return
    recordingLock.current = true
    setCountdown(null)
    setPhase('recording')
    setElapsed(0)
    recordingStartedAt.current = Date.now()

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: THUMBNAIL_VIDEO_MAX_SECONDS,
        maxFileSize: THUMBNAIL_VIDEO_MAX_BYTES,
      })
      if (!video?.uri) {
        throw new Error('No se obtuvo el clip')
      }
      onCaptured({ uri: video.uri, mimeType: 'video/mp4' })
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo grabar el clip')
      setPhase('idle')
    } finally {
      recordingLock.current = false
    }
  }
  startRecordingRef.current = startRecording

  const handleShutter = async () => {
    if (!cameraReady || busy) return
    setError(null)

    if (mode === 'photo') {
      try {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7, skipProcessing: false })
        if (!photo?.uri) throw new Error('No se pudo tomar la foto')
        setPhase('processing')
        const still = await prepareStillThumbnail(photo.uri)
        onCaptured({ uri: still.uri, mimeType: still.mimeType })
        onClose()
      } catch (err: any) {
        setError(err?.message ?? 'No se pudo tomar la foto')
        setPhase('idle')
      }
      return
    }

    setPhase('countdown')
    setCountdown(3)
  }

  const handleStop = () => {
    cameraRef.current?.stopRecording()
  }

  const handleClose = () => {
    if (phase === 'recording') {
      cameraRef.current?.stopRecording()
    }
    if (phase === 'processing') return
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.root}>
        {cameraPermission && !cameraPermission.granted ? (
          <View style={[styles.permission, { paddingTop: insets.top + 24 }]}>
            <Text style={styles.permissionTitle}>Necesitamos la cámara</Text>
            <Text style={styles.permissionBody}>
              Para crear la miniatura del ejercicio hay que permitir el acceso a la cámara.
            </Text>
            <Pressable onPress={() => void requestCameraPermission()} style={styles.permissionButton}>
              <Text style={styles.permissionButtonText}>Permitir cámara</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.permissionCancel}>
              <Text style={styles.permissionCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              mode={mode === 'gif' ? 'video' : 'picture'}
              mute
              videoQuality="480p"
              onCameraReady={() => setCameraReady(true)}
            />

            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
              <Pressable onPress={handleClose} hitSlop={10} style={styles.iconBtn} disabled={phase === 'processing'}>
                <X size={20} color="#fff" />
              </Pressable>
              <Text style={[styles.topHint, { fontFamily: theme.fontFamily.semibold }]}>
                {allowVideo && mode === 'gif' ? `GIF · máx. ${THUMBNAIL_VIDEO_MAX_SECONDS}s` : 'Foto'}
              </Text>
              <Pressable
                onPress={() => setFacing((value) => (value === 'back' ? 'front' : 'back'))}
                hitSlop={10}
                style={styles.iconBtn}
                disabled={busy}
              >
                <RefreshCw size={18} color="#fff" />
              </Pressable>
            </View>

            {countdown !== null ? (
              <Text style={[styles.countdown, { fontFamily: theme.fontFamily.timer }]}>{countdown}</Text>
            ) : null}

            {phase === 'recording' ? (
              <View style={styles.recBadge}>
                <View style={styles.recDot} />
                <Text style={[styles.recTime, { fontFamily: theme.fontFamily.timer }]}>
                  {elapsed.toFixed(1)}s / {THUMBNAIL_VIDEO_MAX_SECONDS}s
                </Text>
              </View>
            ) : null}

            {phase === 'processing' ? (
              <View style={styles.processing}>
                <ActivityIndicator color="#fff" size="large" />
                <Text style={styles.processingText}>Preparando foto…</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorWrap}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={[styles.bottom, { paddingBottom: insets.bottom + 18 }]}>
              {allowVideo ? (
                <View style={styles.modeRow}>
                  {(['photo', 'gif'] as const).map((value) => (
                    <Pressable
                      key={value}
                      onPress={() => !busy && setMode(value)}
                      disabled={busy}
                      style={[styles.modeChip, mode === value && styles.modeChipActive]}
                    >
                      <Text style={[styles.modeChipText, mode === value && styles.modeChipTextActive]}>
                        {value === 'photo' ? 'Foto' : 'GIF'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {phase === 'recording' ? (
                <Pressable onPress={handleStop} style={styles.stopButton}>
                  <Square size={22} color="#fff" fill="#fff" />
                </Pressable>
              ) : (
                <Pressable onPress={() => void handleShutter()} disabled={!cameraReady || busy} style={styles.shutterOuter}>
                  <View style={[styles.shutterInner, mode === 'gif' && styles.shutterGif]} />
                </Pressable>
              )}

              <Text style={styles.bottomHint}>
                {mode === 'gif' ? 'Se graba un clip corto y se usa directo, sin conversión.' : 'Se guarda como imagen.'}
              </Text>
            </View>
          </>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  permission: {
    flex: 1,
    paddingHorizontal: 28,
    gap: 12,
    justifyContent: 'center',
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  permissionBody: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: 12,
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  permissionCancel: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  permissionCancelText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  topHint: {
    color: '#fff',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  countdown: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    color: '#fff',
    fontSize: 96,
    letterSpacing: 4,
  },
  recBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: '18%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(220,38,38,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  recTime: {
    color: '#fff',
    fontSize: 16,
    letterSpacing: 1,
  },
  processing: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    zIndex: 3,
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 210,
    backgroundColor: 'rgba(127,29,29,0.92)',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#fecaca',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: 14,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    padding: 4,
  },
  modeChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  modeChipActive: {
    backgroundColor: '#fff',
  },
  modeChipText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  modeChipTextActive: {
    color: '#111',
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  shutterGif: {
    backgroundColor: '#ef4444',
  },
  stopButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomHint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '600',
  },
})
