'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { Camera, Circle, Image as ImageIcon, Library, Play, Square, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { MediaSelectionDialog } from './MediaSelectionDialog'

// Extraído de create/page.tsx (ver ese archivo para el porqué de la
// separación). Input de media "todo en uno": URL a mano, subir archivo,
// elegir de la biblioteca (MediaSelectionDialog), o grabar vídeo desde el
// navegador — según el `variant`/`type` se muestra como thumbnail grande
// (portada, tutorial) o como fila compacta con ícono.
interface MediaInputProps {
  value?: string | null
  onChange: (val: string) => void
  placeholder?: string
  type?: 'media' | 'thumbnail' | 'tutorial'
  variant?: 'default' | 'thumbnail'
  compact?: boolean
  disabled?: boolean
}

export function MediaInput({ value, onChange, placeholder, type = 'media', variant = 'default', compact = false, disabled = false }: MediaInputProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [isLibraryOpen, setIsLibraryOpen] = useState(false)

    // Video State
    const [isRecordingVideo, setIsRecordingVideo] = useState(false)
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
    const [countdown, setCountdown] = useState<number | null>(null)
    const [recordingTime, setRecordingTime] = useState(0)

    // Preview Modal State
    const [isPlaying, setIsPlaying] = useState(false)

    const videoRef = React.useRef<HTMLVideoElement>(null)
    const playbackVideoRef = React.useRef<HTMLVideoElement>(null)

    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
    const chunksRef = React.useRef<Blob[]>([])
    const timerRef = React.useRef<NodeJS.Timeout | null>(null)

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            // Append type hint to URL hash so we can distinguish blob types
            const type = file.type.split('/')[0] // 'image', 'video'
            onChange(`${url}#${type}`)
        }
    }

    // --- VIDEO RECORDING ---
    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true })
            setVideoStream(stream)
            setIsRecordingVideo(true)
        } catch (err) {
            console.error("Error accessing camera:", err)
            toast.error('No pudimos acceder a la cámara', {
              description: 'Revisa los permisos del navegador y vuelve a intentarlo.',
            })
        }
    }

    const startCountdown = () => {
        setCountdown(3)
        const countInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev === 1) {
                    clearInterval(countInterval)
                    beginVideoRecording()
                    return null
                }
                return prev ? prev - 1 : null
            })
        }, 1000)
    }

    const beginVideoRecording = () => {
        if (!videoStream) return

        // Use correct mime type for browser
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
        const recorder = new MediaRecorder(videoStream, { mimeType })

        mediaRecorderRef.current = recorder
        chunksRef.current = []

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' })
            const url = URL.createObjectURL(blob)
            onChange(`${url}#video`)
            closeVideoRecorder()
        }

        recorder.start()
        setRecordingTime(0)
        timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000)
    }

    const stopVideoRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
        }
    }

    const closeVideoRecorder = () => {
        if (videoStream) {
            videoStream.getTracks().forEach(t => t.stop())
            setVideoStream(null)
        }
        setIsRecordingVideo(false)
        setCountdown(null)
        if (timerRef.current) clearInterval(timerRef.current)
        setRecordingTime(0)
    }

    // Assign stream to video element when ready
    React.useEffect(() => {
        if (videoRef.current && videoStream) {
            videoRef.current.srcObject = videoStream
        }
    }, [videoStream])

    // Cleanup
    React.useEffect(() => {
        return () => {
             if (timerRef.current) clearInterval(timerRef.current)
             if (videoStream) videoStream.getTracks().forEach(t => t.stop())
        }
    }, [videoStream])

    // Autoplay logic
    React.useEffect(() => {
        if (isPlaying) {
            // Small timeout to ensure element is mounted
            const timeout = setTimeout(() => {
                // El navegador puede rechazar el autoplay (política de gesto del
                // usuario) — no es un error real, se ignora en silencio.
                if (playbackVideoRef.current) playbackVideoRef.current.play().catch(() => {})
            }, 100)
            return () => clearTimeout(timeout)
        }
    }, [isPlaying])

    const Icon = ImageIcon
    const isThumbnailInput = type === 'thumbnail'
    const fileAccept = isThumbnailInput || type === 'media'
        ? 'image/*'
        : 'image/*,video/*'
    const libraryMediaType = type === 'tutorial' ? 'all' : 'image'

    if (variant === 'thumbnail') {
        const isVideo = !isThumbnailInput && (value?.match(/\.(mp4|webm|mov)$/i) || value?.includes('#video') || (value?.startsWith('blob:') && !value?.includes('#image')))

        return (
            <div className={cn("w-full h-full relative group bg-muted/20", disabled && "pointer-events-none opacity-60")}>
                <input
                    type="file" ref={fileInputRef} className="hidden"
                    accept={fileAccept}
                    onChange={handleFile}
                />

                {/* --- VIDEO RECORDING OVERLAY --- */}
                {isRecordingVideo && (
                    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Controls */}
                        <div className="relative z-10 flex flex-col items-center gap-8">
                            {countdown !== null ? (
                                <div className="font-timer text-[150px] tracking-[0.08em] text-white animate-pulse drop-shadow-2xl">
                                    {countdown}
                                </div>
                            ) : mediaRecorderRef.current?.state === 'recording' ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-2 bg-red-600/80 px-4 py-2 rounded-full backdrop-blur-md">
                                        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                        <span className="font-timer text-xl tracking-[0.08em] text-white">
                                            {new Date(recordingTime * 1000).toISOString().slice(14, 19)}
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        size="lg"
                                        variant="destructive"
                                        className="h-20 w-20 rounded-full border-4 border-white/50 shadow-2xl hover:scale-105 transition-transform"
                                        onClick={stopVideoRecording}
                                    >
                                        <Square className="h-8 w-8 fill-current text-white" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-6">
                                    <Button
                                        type="button"
                                        size="lg"
                                        className="h-20 w-20 rounded-full bg-white hover:bg-white/90 text-red-600 border-4 border-white/20 shadow-2xl hover:scale-110 transition-transform p-0 flex items-center justify-center"
                                        onClick={startCountdown}
                                    >
                                        <Circle className="w-16 h-16 fill-current" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="rounded-full px-6"
                                        onClick={closeVideoRecorder}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {value ? (
                    isPlaying ? (
                        <div className="w-full h-full relative bg-black flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            {isVideo ? (
                                <video ref={playbackVideoRef} src={value} className="w-full h-full object-contain" controls autoPlay onEnded={() => setIsPlaying(false)} />
                            ) : (
                                <div className="w-full h-full relative">
                                    <img src={value} alt="Vista previa" className="w-full h-full object-contain" />
                                </div>
                            )}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full h-6 w-6 z-10 bg-black/20"
                                onClick={(e) => { e.stopPropagation(); setIsPlaying(false) }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="w-full h-full relative group">
                            {/* Preview (Thumbnail) */}
                            {isVideo ? (
                                 <video src={value} className="w-full h-full object-cover" muted loop playsInline />
                            ) : (
                                 <img src={value} alt="Vista previa" className="w-full h-full object-cover" />
                            )}

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                 <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); setIsPlaying(true) }}>
                                    <Play className="h-4 w-4 ml-0.5" />
                                 </Button>
                                 <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-lg hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); onChange('') }}>
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                            </div>
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 backdrop-blur rounded text-[8px] font-bold text-white uppercase pointer-events-none">
                                {isVideo ? 'Vídeo' : 'Imagen'}
                            </div>
                        </div>
                    )
                ) : (
                    <div className={cn(
                        "w-full h-full",
                        compact ? "flex flex-col" : "flex flex-col items-stretch divide-y divide-border/10"
                    )}>
                        <div className="p-2">
                            <Input
                                placeholder={compact ? "URL" : "Paste URL..."}
                                className={cn(
                                  "bg-background/50 border-none shadow-sm",
                                  compact ? "h-7 text-[11px]" : "h-8 text-xs"
                                )}
                                value={value || ''}
                                onChange={(e) => onChange(e.target.value)}
                            />
                        </div>
                        {compact ? (
                          <div className="grid flex-1 grid-cols-2 gap-2 p-2">
                            <button
                                type="button"
                                className="flex min-h-[38px] items-center justify-center gap-2 rounded-xl border border-border/40 bg-background/60 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-emerald-500"
                                onClick={() => setIsLibraryOpen(true)}
                                title="Seleccionar de la biblioteca"
                            >
                                 <Library className="h-4 w-4 opacity-80" />
                                 <span className="text-[9px] font-bold uppercase">Lib</span>
                            </button>

                            {!isThumbnailInput && (
                              <button
                                  type="button"
                                  className="flex min-h-[38px] items-center justify-center gap-2 rounded-xl border border-border/40 bg-background/60 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-blue-500"
                                  onClick={() => openCamera()}
                                  title="Grabar vídeo"
                              >
                                   <Camera className="h-4 w-4 opacity-80" />
                                   <span className="text-[9px] font-bold uppercase">Cam</span>
                              </button>
                            )}

                            <button
                                type="button"
                                className="flex min-h-[38px] items-center justify-center gap-2 rounded-xl border border-border/40 bg-background/60 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                                onClick={() => fileInputRef.current?.click()}
                                title="Subir archivo"
                            >
                                 <Upload className="h-4 w-4 opacity-80" />
                                 <span className="text-[9px] font-bold uppercase">Up</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                                type="button"
                                className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-black/5 transition-colors text-muted-foreground hover:text-emerald-500"
                                onClick={() => setIsLibraryOpen(true)}
                                title="Seleccionar de la biblioteca"
                            >
                                 <Library className="h-5 w-5 opacity-70" />
                                 <span className="text-[8px] font-bold uppercase">Lib</span>
                            </button>

                            {!isThumbnailInput && (
                              <button
                                  type="button"
                                  className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-black/5 transition-colors text-muted-foreground hover:text-blue-500"
                                  onClick={() => openCamera()}
                                  title="Grabar vídeo"
                              >
                                   <Camera className="h-5 w-5 opacity-70" />
                                   <span className="text-[8px] font-bold uppercase">Cam</span>
                              </button>
                            )}

                            <button
                                type="button"
                                className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-black/5 transition-colors text-muted-foreground hover:text-foreground"
                                onClick={() => fileInputRef.current?.click()}
                                title="Subir archivo"
                            >
                                 <Upload className="h-5 w-5 opacity-70" />
                                 <span className="text-[8px] font-bold uppercase">Up</span>
                            </button>
                          </>
                        )}
                    </div>
                )}

                <MediaSelectionDialog
                    isOpen={isLibraryOpen}
                    onClose={() => setIsLibraryOpen(false)}
                    onSelect={(url) => { onChange(url); setIsLibraryOpen(false) }}
                    mediaType={libraryMediaType}
                />
            </div>
        )
    }

    // Default List View (unchanged)
    return (
        <div className={cn("flex gap-2 items-center group/media", disabled && "pointer-events-none opacity-60")}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={fileAccept}
                onChange={handleFile}
            />

            <div className="relative flex-1">
                <Input
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder || "URL o archivo de medio"}
                    className="h-9 text-xs bg-muted/30 border-transparent text-muted-foreground w-full pl-8 pr-24"
                />
                <div className="absolute left-2.5 top-2.5 text-muted-foreground">
                    {value ? <Icon className="h-4 w-4 text-primary" /> : <Icon className="h-4 w-4 opacity-50" />}
                </div>
                <div className="absolute right-1 top-1 flex items-center gap-1">
                     <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => setIsLibraryOpen(true)}
                        title="Select from Library"
                    >
                        <Library className="h-3 w-3" />
                    </Button>
                     <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload File"
                    >
                        <Upload className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            <MediaSelectionDialog
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                onSelect={(url) => { onChange(url); setIsLibraryOpen(false) }}
                mediaType={libraryMediaType}
            />
        </div>
    )
}
