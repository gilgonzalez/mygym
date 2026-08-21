'use client'

import React, { useState, Suspense } from 'react'
import { toast } from 'sonner'

import { useMutation, useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Trash2, GripVertical, Save,  ArrowLeft, Eye, Play, Smartphone, Monitor, Image as ImageIcon,  Music, X, Upload, Mic, Square, Camera, Circle, Dna, Activity, Repeat, RotateCw, Library, Package, Globe, Lock, FileText, Sparkles, Loader2, Info, Timer, Zap, List, BedDouble, Users, Trophy, Infinity as InfinityIcon } from 'lucide-react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/form/TextArea'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

import { Controller, Resolver, useFieldArray, useForm } from 'react-hook-form'
import { createWorkoutAction, WorkoutInput } from '@/app/actions/workout/create'
import { getWorkoutById } from '@/app/actions/workout/get'
import { updateWorkoutAction } from '@/app/actions/workout/update'
import { uploadFile } from '@/services/uploadFile'
import { MediaSelectionDialog } from '../components/MediaSelectionDialog'
import { PreviewWorkout } from '../components/PreviewWorkout'
import { calcWorkoutXP, computeWorkoutStats, DIFFICULTY_VALUES } from '@mygym/shared'
import { ExercisesVault } from '../components/ExercisesVault'
import { WorkoutTagSelector } from '@/components/ui/workout-tag-selector'
import { Exercise } from '@/app/actions/exercises/list'
import { generateWorkoutAction } from '@/app/actions/workout/generate-by-ai'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ActivityTutorialEditor } from '../components/ActivityTutorialEditor'
import { PremiumFeatureDialog } from '@/components/premium/PremiumFeatureDialog'

// --- Schema Definition ---
const tutorialStepSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Requerido"),
  description: z.string().min(1, "Requerido"),
})

const tutorialSchema = z.object({
  media_url: z.string().optional().nullable(),
  media_id: z.string().optional().nullable(),
  filename: z.string().optional().nullable(),
  bucket_path: z.string().optional().nullable(),
  media_type: z.enum(['image', 'video', 'audio']).optional().nullable(),
  steps: z.array(tutorialStepSchema).optional().default([]),
})

const exerciseSchema = z.object({
  id: z.string(),
  db_id: z.string().optional(),
  name: z.string().min(1, "Requerido"),
  type: z.enum(['reps', 'time', 'emom']).default('reps'),
  reps: z.coerce.number().optional(),
  sets: z.coerce.number().optional(),
  duration: z.coerce.number().optional(),
  rest: z.coerce.number().optional(),
  thumbnail_url: z.string().optional().nullable(),
  thumbnail_media_id: z.string().optional().nullable(),
  filename: z.string().optional().nullable(),
  bucket_path: z.string().optional().nullable(),
  description: z.string().optional(),
  muscle_groups: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  difficulty: z.enum(DIFFICULTY_VALUES).optional(),
  link_id: z.string().optional(),
  tutorial: tutorialSchema.optional().nullable(),
})

const sectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Requerido"),
  orderType: z.enum(['linear', 'single']).default('single'),
  amrap: z.object({
    enabled: z.boolean().default(false),
    timeCapSeconds: z.coerce.number().min(30).max(7200).default(600),
  }).default({
    enabled: false,
    timeCapSeconds: 600,
  }),
  exercises: z.array(exerciseSchema),
})

const workoutSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Título requerido"),
  description: z.string().optional(),
  cover: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(DIFFICULTY_VALUES).optional(),
  visibility: z.enum(['draft', 'public', 'private', 'followers']).default('private'),
  audio: z.array(z.string()).optional(),
  challenge: z.object({
    enabled: z.boolean().default(false),
    challengeSectionId: z.string().optional(),
    timeCapSeconds: z.coerce.number().min(30).max(7200).default(600),
  }).default({
    enabled: false,
    challengeSectionId: undefined,
    timeCapSeconds: 600,
  }),
  sections: z.array(sectionSchema),
})

type WorkoutFormValues = z.infer<typeof workoutSchema>
type WorkoutFormSection = WorkoutFormValues['sections'][number]
type WorkoutFormExercise = WorkoutFormSection['exercises'][number]

const FIELD_LABELS: Record<string, string> = {
  'title': 'El título del workout',
  'description': 'La descripción',
  'cover': 'La portada',
  'difficulty': 'La dificultad',
  'visibility': 'La visibilidad',
  'challenge.timeCapSeconds': 'El tiempo límite del reto',
}

function describeField(path: string): string {
  if (FIELD_LABELS[path]) return FIELD_LABELS[path]

  const sectionMatch = path.match(/^sections\.(\d+)\.name$/)
  if (sectionMatch) {
    const idx = Number(sectionMatch[1]) + 1
    return `El nombre de la sección ${idx}`
  }

  const exMatch = path.match(/^sections\.(\d+)\.exercises\.(\d+)\.name$/)
  if (exMatch) {
    const sIdx = Number(exMatch[1]) + 1
    const eIdx = Number(exMatch[2]) + 1
    return `El nombre del ejercicio ${eIdx} de la sección ${sIdx}`
  }

  const stepMatch = path.match(/^sections\.(\d+)\.exercises\.(\d+)\.tutorial\.steps\.(\d+)\.title$/)
  if (stepMatch) {
    const sIdx = Number(stepMatch[1]) + 1
    const eIdx = Number(stepMatch[2]) + 1
    const stIdx = Number(stepMatch[3]) + 1
    return `El título del paso ${stIdx} del tutorial del ejercicio ${eIdx} (sección ${sIdx})`
  }

  const stepDescMatch = path.match(/^sections\.(\d+)\.exercises\.(\d+)\.tutorial\.steps\.(\d+)\.description$/)
  if (stepDescMatch) {
    const sIdx = Number(stepDescMatch[1]) + 1
    const eIdx = Number(stepDescMatch[2]) + 1
    const stIdx = Number(stepDescMatch[3]) + 1
    return `La descripción del paso ${stIdx} del tutorial del ejercicio ${eIdx} (sección ${sIdx})`
  }

  const exGeneric = path.match(/^sections\.(\d+)\.exercises\.(\d+)\.(.+)$/)
  if (exGeneric) {
    const sIdx = Number(exGeneric[1]) + 1
    const eIdx = Number(exGeneric[2]) + 1
    const field = exGeneric[3]
    return `El campo "${field}" del ejercicio ${eIdx} de la sección ${sIdx}`
  }

  const sectionGeneric = path.match(/^sections\.(\d+)\.(.+)$/)
  if (sectionGeneric) {
    const sIdx = Number(sectionGeneric[1]) + 1
    const field = sectionGeneric[2]
    return `El campo "${field}" de la sección ${sIdx}`
  }

  return `El campo "${path}"`
}

type FormErrorEntry = { path: string; message: string }

function flattenFormErrors(error: unknown, prefix = ''): FormErrorEntry[] {
  if (!error) return []

  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return [{ path: prefix, message: (error as { message: string }).message }]
    }

    const results: FormErrorEntry[] = []
    for (const [key, value] of Object.entries(error as Record<string, unknown>)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key
      results.push(...flattenFormErrors(value, nextPrefix))
    }
    return results
  }

  return []
}

function summarizeFormErrors(error: unknown): { count: number; first: string } {
  const list = flattenFormErrors(error)
  if (list.length === 0) return { count: 0, first: 'Hay campos incompletos.' }
  const first = list[0]
  const fieldLabel = describeField(first.path)
  const rawMessage = first.message?.trim() || ''
  let human: string
  if (/required|obligatorio|requerido/i.test(rawMessage)) {
    human = `${fieldLabel} es obligatorio.`
  } else if (rawMessage) {
    human = `${fieldLabel}: ${rawMessage.charAt(0).toLowerCase() + rawMessage.slice(1)}`
  } else {
    human = `${fieldLabel} tiene un problema.`
  }
  return { count: list.length, first: human }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isPersistedExerciseId(value?: string | null) {
  const trimmed = value?.trim()
  if (!trimmed || !UUID_RE.test(trimmed)) return undefined
  return trimmed
}

function inferMediaType(value?: string | null): 'image' | 'video' | 'audio' {
  if (!value) return 'image'
  if (value.includes('#audio') || /\.(mp3|wav|ogg|m4a|aac)($|\?)/i.test(value)) return 'audio'
  if (value.includes('#video') || /youtube\.com|youtu\.be/i.test(value) || /\.(mp4|webm|ogg|mov|mkv)($|\?)/i.test(value)) return 'video'
  return 'image'
}

function normalizeMediaUrl(value?: string | null) {
  if (!value) return ''
  return value.replace(/#(audio|video|image)$/, '')
}

function ensureUploadedUrl(value: string | null | undefined, label: string) {
  const normalizedValue = normalizeMediaUrl(value)

  if (normalizedValue.startsWith('blob:')) {
    throw new Error(`${label} no se pudo subir correctamente. Vuelve a intentarlo.`)
  }

  return normalizedValue
}

function sanitizeTutorial(
  tutorial?: WorkoutFormExercise['tutorial'] | null
): WorkoutFormExercise['tutorial'] | null {
  if (!tutorial) return null

  const mediaUrl = normalizeMediaUrl(tutorial.media_url)
  const steps = (tutorial.steps || []).filter((step) => {
    const hasTitle = Boolean(step.title?.trim())
    const hasDescription = Boolean(step.description?.trim())
    return hasTitle && hasDescription
  })

  if (!mediaUrl && !tutorial.media_id && steps.length === 0) {
    return null
  }

  return {
    ...tutorial,
    media_url: mediaUrl || null,
    media_id: tutorial.media_id || null,
    filename: tutorial.filename || null,
    bucket_path: tutorial.bucket_path || null,
    media_type: tutorial.media_type || (mediaUrl ? inferMediaType(mediaUrl) : null),
    steps,
  }
}

function createEmptyExercise() {
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    sets: 3,
    reps: 10,
    duration: 0,
    type: 'reps' as const,
    rest: 60,
    description: '',
    difficulty: 'beginner' as const,
    thumbnail_url: '',
    thumbnail_media_id: null,
    tutorial: undefined,
  }
}

function CreateWorkoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const workoutId = searchParams.get('id')
  
  const { user, isLoading } = useAuthStore()
  const isPremiumUser = Boolean(user?.isPremium)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMetaOpen, setIsMetaOpen] = useState(false)
  
  // AI Assistant State
  const [isAiOpen, setIsAiOpen] = useState(false)
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRetry, setIsRetry] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)
  const [isCompactMobileViewport, setIsCompactMobileViewport] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const submitToastIdRef = React.useRef<string | number | null>(null)
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = React.useRef<any>(null)
  const initialPromptRef = React.useRef('')

  const toggleListening = () => {
    if (isListening) {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
        setIsListening(false)
        return
    }

    if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast.warning('Tu navegador no soporta el dictado por voz. Prueba con Chrome o Edge.')
        return
    }

    // Capture current text before starting
    initialPromptRef.current = aiPrompt
    
    // Session-level variable to store finalized text
    let finalTranscript = ''

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognitionRef.current = recognition
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'es-ES' 

    recognition.onstart = () => {
        setIsListening(true)
    }

    recognition.onend = () => {
        setIsListening(false)
    }

    recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        setIsListening(false)
        const errorMessages: Record<string, { title: string; desc: string }> = {
            'no-speech': { title: 'No se detectó voz', desc: 'Intenta hablar más fuerte o acerca el micrófono.' },
            'audio-capture': { title: 'No hay micrófono disponible', desc: 'Verifica que tu navegador tenga permiso para acceder al micrófono.' },
            'not-allowed': { title: 'Permiso de micrófono denegado', desc: 'Activa el permiso de micrófono en la configuración de tu navegador para usar esta función.' },
            'network': { title: 'Error de red', desc: 'Necesitas conexión a Internet para el reconocimiento de voz.' },
            'aborted': { title: 'Reconocimiento interrumpido', desc: 'La captura de voz se detuvo inesperadamente. Vuelve a intentarlo.' },
        }
        const err = errorMessages[event.error] || { title: 'Error al escuchar', desc: 'Ocurrió un problema con el reconocimiento de voz. Vuelve a intentarlo.' }
        toast.error(err.title, { description: err.desc })
    }

    recognition.onresult = (event: any) => {
        let interimTranscript = ''

        // Only process new results starting from resultIndex
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
                finalTranscript += transcript
            } else {
                interimTranscript += transcript
            }
        }
        
        // Combine initial prompt + session final text + current interim text
        const currentSessionText = finalTranscript + interimTranscript
        const spacer = (initialPromptRef.current && !initialPromptRef.current.endsWith(' ') && currentSessionText) ? ' ' : ''
        
        setAiPrompt(initialPromptRef.current + spacer + currentSessionText)
    }

    recognition.start()
  }

  React.useLayoutEffect(() => {
    if (typeof window === 'undefined') return

    const syncViewport = () => {
      const isDesktop = window.innerWidth >= 1024
      setIsDesktopViewport(isDesktop)
      setIsCompactMobileViewport(window.innerWidth < 820)

      if (!isDesktop) {
        setShowPreview(false)
      }
    }

    syncViewport()
    window.addEventListener('resize', syncViewport)

    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  const { isLoading: isLoadingWorkout, data: loadedWorkout, error: loadError } = useQuery({
    // Namespaced separately from the ['workout', id] key used by the workout viewer
    // (src/app/workout/[id]/page.tsx). Both share the same global QueryClient, and the
    // viewer caches a completely different shape ({ workout, errorCode, errorMessage })
    // than what this editor needs (flattened WorkoutFormValues). Reusing the same key
    // meant the editor could pick up the viewer's cached data on first navigation and
    // reset() the form with the wrong shape, leaving it blank until a hard reload wiped
    // the cache. See conversation for the full repro.
    queryKey: ['workout-editor', workoutId],
    queryFn: async () => {
      if (!workoutId) return null
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout_loading')), 20000)
      )
      const fetch = (async () => {
        const res = await getWorkoutById(workoutId)
        if (!res.success || !res.data) throw new Error(res.error || 'fetch_failed')
        const w = res.data
        return {
            id: w.id,
            title: w.title,
            description: w.description || '',
            cover: w.cover || '',
            tags: w.tags || [],
            difficulty: (w.difficulty as any) || 'beginner',
            visibility: w.visibility || 'private',
            audio: w.audio || [],
            challenge: {
                enabled: Boolean(w.challenge),
                challengeSectionId: w.challenge?.challenge_section_id || w.sections[0]?.id,
                timeCapSeconds: w.challenge?.time_cap_seconds || 600,
            },
            sections: w.sections.map((s: any) => ({
                id: s.id,
                name: s.name,
                orderType: (s.type as any) || 'single',
                amrap: {
                  enabled: Boolean(w.challenge) && w.challenge?.challenge_section_id === s.id,
                  timeCapSeconds: (Boolean(w.challenge) && w.challenge?.challenge_section_id === s.id)
                    ? (w.challenge?.time_cap_seconds || 600)
                    : 600,
                },
                exercises: s.exercises.map((e: any) => ({
                    id: e.id,
                    db_id: e.id,
                    name: e.name,
                    type: (e.type === 'time' || e.type === 'emom') ? e.type : 'reps',
                    reps: e.reps || 0,
                    sets: e.sets || 0,
                    duration: e.duration || 0,
                    rest: e.rest || 0,
                    thumbnail_url: e.thumbnail_url,
                    thumbnail_media_id: e.thumbnail_media_id,
                    filename: e.filename,
                    bucket_path: e.bucket_path,
                    description: e.description || '',
                    muscle_groups: e.muscle_group || [],
                    equipment: e.equipment || [],
                    difficulty: e.difficulty || 'beginner',
                    link_id: (e as any).link_id,
                    tutorial: sanitizeTutorial(e.tutorial ? {
                      media_url: e.tutorial.media_url || '',
                      media_id: e.tutorial.media_id || null,
                      filename: e.tutorial.filename || null,
                      bucket_path: e.tutorial.bucket_path || null,
                      media_type: e.tutorial.media_type || inferMediaType(e.tutorial.media_url),
                      steps: (e.tutorial.steps || []).map((step: any, stepIndex: number) => ({
                        id: step.id || `tutorial-step-${stepIndex}`,
                        title: step.title,
                        description: step.description,
                      })),
                    } : undefined) || undefined,
                }))
            }))
        } as WorkoutFormValues
      })()
      return Promise.race([fetch, timeout])
    },
    retry: 1,
    enabled: !!workoutId,
    refetchOnWindowFocus: false,
  })

  React.useEffect(() => {
    if (!loadError) return
    const msg = loadError instanceof Error ? loadError.message : 'unknown'
    if (msg === 'timeout_loading') {
      toast.error('La carga del workout tardó demasiado', {
        description: 'Revisa tu conexión a Internet y recarga la página para volver a intentarlo.',
      })
    } else if (msg === 'fetch_failed') {
      toast.error('No pudimos cargar el workout', {
        description: 'Es posible que no exista o que no tengas permiso para editarlo. Intenta recargando la página.',
      })
    } else {
      toast.error('Error al cargar el workout', {
        description: 'Ocurrió un problema inesperado al recuperar la información. Intenta recargando la página.',
      })
    }
  }, [loadError])

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutSchema) as unknown as Resolver<WorkoutFormValues>,
    defaultValues: {
      title: '',
      description: '',
      cover: '',
      visibility: 'private',
      audio: [],
      challenge: {
        enabled: false,
        challengeSectionId: undefined,
        timeCapSeconds: 600,
      },
      sections: [
        {
          id: 'section-1',
          name: 'Warm Up',
          orderType: 'linear',
          amrap: { enabled: false, timeCapSeconds: 600 },
          exercises: [createEmptyExercise()]
        }
      ]
    }
  })
  const { control, register, handleSubmit, watch, getValues, setValue, formState: { errors }, reset } = form

  // Handle initial data loading without creating a render loop
  const initializedRef = React.useRef(false)
  
  // Reset initialization flag when ID changes
  React.useEffect(() => {
    initializedRef.current = false
  }, [workoutId])

  React.useEffect(() => {
    if (initializedRef.current) return

    // Priority: Server Data
    if (loadedWorkout) {
        reset(loadedWorkout)
        initializedRef.current = true
        return
    }

    // New Workout (no ID) - defaults are already set, just mark initialized
    if (!workoutId) {
        initializedRef.current = true
    }
  }, [loadedWorkout, workoutId, reset])

  React.useEffect(() => {
    if (!isSubmitting || submitToastIdRef.current === null) return

    const baseStatus = uploadStatus?.trim() || (workoutId ? 'Actualizando workout...' : 'Guardando workout...')
    const progress = Math.max(0, Math.min(100, Math.round(uploadProgress || 0)))
    const title = progress > 0 ? `${baseStatus} (${progress}%)` : baseStatus
    const description =
      progress >= 95
        ? 'Casi terminamos. No cierres esta pantalla.'
        : 'No cierres esta pantalla mientras terminamos de subir y guardar todo.'

    toast.loading(title, {
      id: submitToastIdRef.current,
      description,
      duration: Infinity,
    })
  }, [uploadStatus, uploadProgress, isSubmitting, workoutId])

  React.useEffect(() => {
    return () => {
      if (submitToastIdRef.current !== null) {
        toast.dismiss(submitToastIdRef.current)
        submitToastIdRef.current = null
      }
    }
  }, [])

  const { mutateAsync: createWorkout } = useMutation({
    mutationFn: async (data: WorkoutFormValues) => {
        // Timeout safeguard: 30 seconds
        const timeout = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Tiempo de espera agotado. Comprueba tu conexión e inténtalo de nuevo.")), 30000)
        )

        const processUpload = async () => {
            if (!user?.id) throw new Error("User not found")

            // Count total operations
            let totalOps = 1; // Server action
            if (data.cover?.startsWith('blob:')) totalOps++;
            (data.audio || []).forEach((url: string) => { if (url.startsWith('blob:')) totalOps++; });
            data.sections.forEach((s: WorkoutFormSection) => s.exercises.forEach((e: WorkoutFormExercise) => {
                if (e.thumbnail_url?.startsWith('blob:')) totalOps++;
                if (e.tutorial?.media_url?.startsWith('blob:')) totalOps++;
            }));

            let completedOps = 0;
            const updateProgress = (text: string) => {
                completedOps++;
                setUploadProgress(Math.min(Math.round((completedOps / totalOps) * 100), 99));
                setUploadStatus(text);
            }
            
            setUploadStatus('Preparando subidas...');

            // 1. Upload Media First (Client-side)
            // Upload Cover
            let coverUrl = normalizeMediaUrl(data.cover)
            if (data.cover?.startsWith('blob:')) {
                setUploadStatus('Subiendo imagen de portada...')
                const res = await uploadFile(normalizeMediaUrl(data.cover))
                if (!res?.url) {
                    throw new Error('La portada del workout no se pudo subir correctamente. Vuelve a intentarlo.')
                }
                coverUrl = res.url
                updateProgress('Cover uploaded')
            }
            coverUrl = ensureUploadedUrl(coverUrl, 'La portada del workout')
            
            // Upload Audio
            const audioUrls = await Promise.all(
                (data.audio || []).map(async (url: string) => {
                    if (url.startsWith('blob:')) {
                        const res = await uploadFile(url)
                        if (!res?.url) {
                            throw new Error('Uno de los audios del workout no se pudo subir correctamente. Vuelve a intentarlo.')
                        }
                        updateProgress('Pista de audio subida')
                        return res.url
                    }
                    return ensureUploadedUrl(url, 'Uno de los audios del workout')
                })
            )
            const validAudioUrls = audioUrls.filter((url: string | undefined): url is string => !!url)

            // Upload Exercise Media
            const sectionsWithMedia = await Promise.all(data.sections.map(async (section: WorkoutFormSection) => {
                const exercisesWithMedia = await Promise.all(section.exercises.map(async (exercise: WorkoutFormExercise) => {
                    let finalThumbnailUrl = normalizeMediaUrl(exercise.thumbnail_url)
                    let finalThumbnailMediaId = exercise.thumbnail_media_id
                    let finalFilename = exercise.filename
                    let finalBucketPath = exercise.bucket_path
                    let finalTutorial = sanitizeTutorial(exercise.tutorial)

                    if (exercise.thumbnail_url && exercise.thumbnail_url.startsWith('blob:')) {
                        const res = await uploadFile(normalizeMediaUrl(exercise.thumbnail_url))
                        if (!res?.url) {
                            throw new Error(`El thumbnail de "${exercise.name}" no se pudo subir correctamente. Vuelve a intentarlo.`)
                        }
                        finalThumbnailUrl = res.url
                        finalThumbnailMediaId = res.id
                        finalFilename = res.filename
                        finalBucketPath = res.bucket_path
                        updateProgress(`Thumbnail uploaded: ${exercise.name}`)
                    }
                    finalThumbnailUrl = ensureUploadedUrl(finalThumbnailUrl, `El thumbnail de "${exercise.name}"`)

                    if (finalTutorial?.media_url && finalTutorial.media_url.startsWith('blob:')) {
                        const res = await uploadFile(normalizeMediaUrl(finalTutorial.media_url))
                        if (!res?.url) {
                            throw new Error(`El recurso del tutorial de "${exercise.name}" no se pudo subir correctamente. Vuelve a intentarlo.`)
                        }
                        finalTutorial = {
                            ...finalTutorial,
                            media_url: res.url,
                            media_id: res.id || null,
                            filename: res.filename || null,
                            bucket_path: res.bucket_path || null,
                            media_type: finalTutorial.media_type || inferMediaType(finalTutorial.media_url),
                        }
                        updateProgress(`Tutorial subido: ${exercise.name}`)
                    }
                    if (finalTutorial?.media_url) {
                        finalTutorial = {
                            ...finalTutorial,
                            media_url: ensureUploadedUrl(finalTutorial.media_url, `El recurso del tutorial de "${exercise.name}"`) || null,
                        }
                    }
                    return {
                        ...exercise,
                        // EMOM never has a separate rest — whatever's left of the time window
                        // after the reps are done is the rest. Enforced here too, not just in
                        // the UI, so it can't drift regardless of how the exercise got its type.
                        rest: exercise.type === 'emom' ? 0 : exercise.rest,
                        thumbnail_url: finalThumbnailUrl,
                        thumbnail_media_id: finalThumbnailMediaId,
                        filename: finalFilename,
                        bucket_path: finalBucketPath,
                        tutorial: finalTutorial,
                    }
                }))
                return { ...section, exercises: exercisesWithMedia }
            }))

            setUploadStatus('Finalizando workout...')

            // Calculate estimated time (in seconds)
            const estimatedTime = data.sections.reduce((total: number, section: WorkoutFormSection) => {
                return total + section.exercises.reduce((secTotal: number, ex: WorkoutFormExercise) => {
                    const sets = ex.sets || 1
                    const rest = ex.rest || 0
                    const duration = ex.duration || 0
                    const reps = ex.reps || 0
                    
                    // Time for execution
                    let executionTime = 0
                    if (ex.type === 'time' || ex.type === 'emom') {
                        // EMOM has a known time window too, unlike plain reps which has to be estimated.
                        executionTime = duration * sets
                    } else {
                        // Estimate 3 seconds per rep
                        executionTime = reps * 3 * sets
                    }
                    
                    // Time for rest (between sets) — EMOM has 0 rest
                    const restTime = (ex.type === 'emom' ? 0 : rest) * sets
                    
                    return secTotal + executionTime + restTime
                }, 0)
            }, 0)

            // XP y desglose de stats: misma fórmula que se usa para mostrar/
            // otorgar XP en el resto de la app (ver packages/shared/src/rewards.ts).
            const expEarned = calcWorkoutXP(estimatedTime, data.difficulty)
            const finalStats = computeWorkoutStats(data.tags, expEarned)

            // Prepare clean data for server action
            const cleanData: WorkoutInput = {
                title: data.title,
                description: data.description,
                difficulty: data.difficulty,
                visibility: data.visibility,
                estimated_time: estimatedTime,
                exp_earned: expEarned,
                stats: finalStats,
                tags: data.tags,
                cover: coverUrl,
                audio: validAudioUrls,
                challenge: (() => {
                    const amrapSectionIndex = sectionsWithMedia.findIndex(
                      (section: WorkoutFormSection) => section.amrap?.enabled
                    )
                    if (amrapSectionIndex === -1) return null
                    const amrapSection = sectionsWithMedia[amrapSectionIndex]
                    return {
                      mode: 'amrap_section',
                      challenge_section_index: amrapSectionIndex,
                      time_cap_seconds: amrapSection.amrap?.timeCapSeconds || 600,
                      score_type: 'rounds_plus_reps',
                    }
                  })(),
                sections: sectionsWithMedia.map((s: WorkoutFormSection) => ({
                    id: s.id,
                    name: s.name,
                    orderType: s.orderType,
                    exercises: s.exercises.map((e: WorkoutFormExercise) => {
                        const sanitizedTutorial = sanitizeTutorial(e.tutorial)
                        const persistedId = isPersistedExerciseId(e.db_id)

                        return {
                            ...(persistedId ? { id: persistedId } : {}),
                            name: e.name,
                            type: e.type,
                            reps: e.reps,
                            sets: e.sets,
                            duration: e.duration,
                            rest: e.rest,
                            description: e.description,
                            muscle_groups: e.muscle_groups,
                            equipment: e.equipment,
                            difficulty: e.difficulty,
                            link_id: e.link_id,
                            thumbnail_url: e.thumbnail_url,
                            thumbnail_media_id: e.thumbnail_media_id,
                            filename: e.filename,
                            bucket_path: e.bucket_path,
                            tutorial: sanitizedTutorial
                              ? {
                                  media_url: sanitizedTutorial.media_url,
                                  media_id: sanitizedTutorial.media_id,
                                  filename: sanitizedTutorial.filename,
                                  bucket_path: sanitizedTutorial.bucket_path,
                                  media_type: sanitizedTutorial.media_type,
                                  steps: (sanitizedTutorial.steps || []).map((step: { title: string; description: string }) => ({
                                      title: step.title,
                                      description: step.description,
                                  }))
                                }
                              : null
                        }
                    })
                }))
            }
            
            // 2. Call Server Action
            let result;
            if (data.id) {
                // Update existing
                setUploadStatus('Actualizando workout...')
                result = await updateWorkoutAction(data.id, cleanData)
            } else {
                // Create new
                setUploadStatus('Creando workout...')
                result = await createWorkoutAction(cleanData)
            }

            if (!result || typeof result !== 'object' || !('success' in result)) {
                throw new Error('Respuesta no válida al guardar el workout')
            }

            if (!result.success) throw new Error(result.error || 'Error al guardar el workout')
            
            updateProgress('¡Listo!')
            return result
        }

        return Promise.race([processUpload(), timeout])
    },
    onSuccess: () => {
        if (submitToastIdRef.current !== null) {
          toast.dismiss(submitToastIdRef.current)
          submitToastIdRef.current = null
        }
        setUploadProgress(0)
        setUploadStatus('')
        toast.success(workoutId ? 'Workout actualizado' : 'Workout guardado', {
          description: workoutId
            ? 'Los cambios se guardaron y ya están sincronizados.'
            : 'Tu workout está listo en el feed. Ahora a entrenar 💪',
        })
        reset()
        setTimeout(() => router.push('/feed'), 600)
    },
    onError: (error: Error) => {
        if (submitToastIdRef.current !== null) {
          toast.dismiss(submitToastIdRef.current)
          submitToastIdRef.current = null
        }
        console.error(error)
        const message =
          error?.message?.trim() ||
          'No pudimos guardar el workout. Revisa tu contenido y vuelve a intentarlo.'
        toast.error('No pudimos guardar el workout', {
          description: message,
        })
        setIsSubmitting(false)
        setIsRetry(true)
        setUploadProgress(0)
        setUploadStatus('')
    }
  })

  // Watch all fields for live preview
  const formValues = watch()
  const { fields: sectionFields, append: appendSection, remove: removeSection, move: moveSection } = useFieldArray({
    control,
    name: "sections"
  })
  const totalExercises = (formValues.sections || []).reduce((sum, section) => sum + (section.exercises?.length || 0), 0)
  const builderLabel = workoutId ? 'Editar workout' : 'Nuevo workout'

  React.useEffect(() => {
    if (!isLoading && !user) {
      const redirectUrl = `${pathname}${workoutId ? `?id=${workoutId}` : ''}`
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`)
    }
  }, [user, isLoading, router, pathname, workoutId])

  const isWorkoutLoading = !!workoutId && isLoadingWorkout
  const isAuthLoading = isLoading && !user

  if (isAuthLoading || isWorkoutLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-48 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
          <div className="h-96 bg-muted rounded" />
        </div>
        <div className="mt-6 text-sm text-muted-foreground">
          Cargando el editor... Si tarda demasiado, recarga la página.
        </div>
      </div>
    )
  }

  if (!user) {
      return null // Will redirect
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    if (result.type === 'SECTION') {
      moveSection(result.source.index, result.destination.index)
    } else if (result.type === 'EXERCISE') {
        const sectionIndex = parseInt(result.source.droppableId.split('-')[1])
        const exercises = getValues(`sections.${sectionIndex}.exercises`)
        const [reorderedItem] = exercises.splice(result.source.index, 1)
        exercises.splice(result.destination.index, 0, reorderedItem)
        setValue(`sections.${sectionIndex}.exercises`, exercises)
    }
  }

  const handleAiGenerate = async () => {
    if (!isPremiumUser) {
      setIsAiOpen(false)
      setIsPremiumDialogOpen(true)
      return
    }

    if (!aiPrompt.trim()) {
      toast.warning('Describe el workout que quieres generar', {
        description: 'Escribe al menos un par de palabras sobre el objetivo, músculos o duración para que la IA pueda ayudarte.',
      })
      return
    }
    
    setIsGenerating(true)
    try {
        const userLang = typeof navigator !== 'undefined' ? navigator.language : 'es-ES'
        const res = await generateWorkoutAction(aiPrompt, userLang)
        if (res.success && res.data) {
            const w = res.data
            
            // Update Metadata
            setValue('title', w.title)
            setValue('description', w.description)
            setValue('difficulty', w.difficulty || 'intermediate')
            
            // Map Sections & Exercises
            const newSections: WorkoutFormValues['sections'] = w.sections.map((s: any, idx: number): WorkoutFormSection => ({
                id: `section-${Date.now()}-${idx}`,
                name: s.name,
                orderType: 'single',
                amrap: { enabled: false, timeCapSeconds: 600 },
                exercises: s.exercises.map((e: any, eIdx: number): WorkoutFormExercise => ({
                    id: `ex-${Date.now()}-${idx}-${eIdx}`,
                    db_id: isPersistedExerciseId(e.is_new_exercise ? undefined : (e.id || e.db_id)),
                    name: e.name,
                    type: (e.type === 'time' || e.type === 'emom') ? e.type : 'reps',
                    reps: e.reps || 0,
                    sets: e.sets || 3,
                    duration: e.duration || 0,
                    rest: e.rest || 60,
                    description: e.description || '',
                    muscle_groups: e.muscle_groups || [],
                    equipment: e.equipment || [],
                    difficulty: e.difficulty || w.difficulty || 'intermediate',
                    thumbnail_url: e.thumbnail_url || '',
                    thumbnail_media_id: e.thumbnail_media_id || null,
                    tutorial: sanitizeTutorial(e.tutorial) || undefined,
                }))
            }))
            
            setValue('sections', newSections)
            setIsAiOpen(false)
            setAiPrompt('')
            toast.success('Estructura generada', {
                description: 'Revisa el título, ejercicios y ajusta lo que necesites antes de guardar el workout.',
            })
        } else {
            toast.error(res.error || "No se pudo generar el workout. Inténtalo de nuevo.")
        }
    } catch (err) {
        console.error(err)
        toast.error("No pudimos conectar con el asistente IA. Revisa tu conexión e inténtalo otra vez.")
    } finally {
        setIsGenerating(false)
    }
  }

  const onSubmit = async (data: WorkoutFormValues) => {
    if (!user) {
        const msg = 'Debes iniciar sesión para guardar workouts.'
        toast.error('Sesión no detectada', { description: msg })
        return
    }
    
    // Cerrar el diálogo de metadatos al confirmar el guardado
    setIsMetaOpen(false)

    setUploadProgress(0)
    setUploadStatus(workoutId ? 'Actualizando workout y sincronizando media...' : 'Guardando workout y preparando archivos...')
    setIsRetry(false)
    setIsSubmitting(true)

    if (submitToastIdRef.current !== null) {
      toast.dismiss(submitToastIdRef.current)
    }
    submitToastIdRef.current = toast.loading(workoutId ? 'Actualizando workout...' : 'Guardando workout...', {
      description: workoutId
        ? 'Sincronizamos cambios y subimos cualquier medio nuevo. No cierres esta pantalla.'
        : 'Preparamos los archivos y subimos lo que haga falta. No cierres esta pantalla.',
      duration: Infinity,
    })

    try {
      await createWorkout(data)
    } catch {
      // El onError del hook ya gestiona el toast de error final.
    }
  }

  const onInvalidSubmit = (formErrors: typeof errors) => {
    const summary = summarizeFormErrors(formErrors)

    console.error('Workout submit blocked by validation', formErrors)

    if (summary.count === 1) {
      toast.error('Revisa el formulario', {
        description: summary.first,
      })
    } else {
      toast.error(`${summary.count} campos necesitan tu atención`, {
        description: `${summary.first} Revisa el editor y completa lo que falte antes de guardar.`,
      })
    }
  }

  const handleOpenAiAssistant = () => {
    if (!isPremiumUser) {
      setIsPremiumDialogOpen(true)
      return
    }

    setIsAiOpen(true)
  }

  const toggleAmrapSection = (sectionIndex: number) => {
    const currentSections = getValues('sections') || []
    const targetSection = currentSections[sectionIndex]
    const isCurrentlyAmrap = targetSection?.amrap?.enabled

    if (isCurrentlyAmrap) {
      setValue(`sections.${sectionIndex}.amrap.enabled`, false, { shouldDirty: true })
      toast.message('Modo reto desactivado', {
        description: 'Esta sección vuelve al modo normal (rondas fijas).',
      })
      return
    }

    const updatedSections = currentSections.map((section: any, idx: number) => {
      const amrap = {
        ...(section.amrap || { timeCapSeconds: 600 }),
        enabled: idx === sectionIndex,
      }

      if (idx !== sectionIndex) {
        return { ...section, amrap }
      }

      const normalizedExercises = (section.exercises || []).map((exercise: any) => ({
        ...exercise,
        sets: 1,
        rest: 0,
        type: 'reps',
      }))

      return {
        ...section,
        amrap,
        orderType: 'linear',
        exercises: normalizedExercises,
      }
    })

    setValue('sections', updatedSections, { shouldDirty: true })

    const sectionName = targetSection?.name?.trim() || `Sección ${sectionIndex + 1}`
    toast.success('Reto AMRAP activado', {
      description: `${sectionName}: reps fijas por ejercicio · 1 vuelta por ronda · sin descanso entre ejercicios.`,
    })
  }

  const AMRAP_QUICK_PRESETS = [
    { label: '5 min', minutes: 5, intensity: 'Sprint' },
    { label: '10 min', minutes: 10, intensity: 'Medio' },
    { label: '15 min', minutes: 15, intensity: 'Alto' },
    { label: '20 min', minutes: 20, intensity: 'Hero' },
  ]

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b bg-background px-2.5 py-1.5 sm:px-4 sm:py-2 md:px-6">
        <div className="flex flex-col gap-1.5 sm:gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="hidden min-w-0 flex-1 items-center gap-2 sm:flex sm:gap-2.5">
            <Link
              href="/feed"
              className="rounded-full border border-border/60 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </Link>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {builderLabel}
              </p>
              <h1 className="truncate text-[13px] font-semibold leading-none text-foreground sm:text-base">Creador de Workouts</h1>
              <p className="mt-0.5 text-[11px] leading-none text-muted-foreground sm:text-xs">
                {sectionFields.length} secciones · {totalExercises} ejercicios
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col items-end gap-1.5 sm:w-auto sm:gap-2 sm:lg:flex-row sm:lg:items-center sm:lg:justify-end sm:lg:gap-2">
            <div className="flex w-full flex-nowrap items-center justify-between gap-1.5 overflow-x-auto scrollbar-hide sm:w-auto sm:flex-wrap sm:justify-end sm:gap-2">
              <Link
                href="/feed"
                className="sm:hidden shrink-0 rounded-full border border-border/60 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>

              <Button
                variant="outline"
                size="sm"
                className="h-9 min-w-0 flex-1 justify-center gap-1.5 rounded-full border-indigo-200 bg-indigo-50/50 px-2 py-1 text-[10px] text-indigo-600 shadow-sm hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400 dark:hover:bg-indigo-950/50 sm:flex-none sm:h-9 sm:w-auto sm:justify-start sm:gap-2 sm:px-3 sm:text-xs"
                onClick={handleOpenAiAssistant}
              >
                <Sparkles className="h-4 w-4 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate sm:whitespace-normal">IA</span>
                {!isPremiumUser ? (
                  <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400 min-[420px]:inline-flex">
                    Premium
                  </span>
                ) : null}
                <span className="ml-auto hidden items-center gap-1 border-l border-indigo-200 pl-1.5 dark:border-indigo-800 sm:ml-1 sm:inline-flex sm:pl-2">
                  <Mic className="h-3 w-3 opacity-70 sm:h-3.5 sm:w-3.5" />
                </span>
              </Button>

              {!isDesktopViewport && (
                <Button
                  variant={showPreview ? 'secondary' : 'outline'}
                  size="sm"
                  className="h-9 min-w-0 flex-1 shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold sm:flex-none sm:h-9 sm:w-auto sm:rounded-full sm:px-3 sm:text-xs"
                  onClick={() => {
                    setPreviewDevice('mobile')
                    setShowPreview(true)
                  }}
                >
                  <Eye className="mr-0 h-4 w-4 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
                  <span className="ml-0.5 sm:ml-0">Preview</span>
                </Button>
              )}

              {isDesktopViewport && (
                <Button
                  variant={showPreview ? "secondary" : "ghost"}
                  size="icon"
                  className="hidden h-9 w-9 rounded-full lg:inline-flex"
                  onClick={() => setShowPreview(!showPreview)}
                  title={showPreview ? 'Ocultar preview' : 'Mostrar preview'}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}

              <Button
                onClick={() => setIsMetaOpen(true)}
                disabled={isSubmitting}
                size="sm"
                className="h-9 min-w-0 flex-1 shrink-0 rounded-full px-2 py-1 text-[10px] font-bold sm:flex-none sm:h-9 sm:w-auto sm:rounded-full sm:px-4 sm:text-xs md:px-5"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="mr-0 h-4 w-4 shrink-0 animate-spin sm:mr-2 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Guardando...</span>
                    <span className="ml-0.5 sm:hidden">{uploadProgress}%</span>
                  </>
                ) : isRetry ? (
                  <>
                    <RotateCw className="mr-0 h-4 w-4 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Reintentar</span>
                    <span className="ml-0.5 sm:hidden">Reintentar</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-0 h-4 w-4 shrink-0 sm:mr-2 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Detalles y guardar</span>
                    <span className="ml-0.5 sm:hidden">Guardar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden bg-neutral-50 dark:bg-zinc-950">
        
        {/* LEFT: Editor Panel */}
        <div className={cn(
          "flex-1 overflow-x-hidden overflow-y-auto p-2.5 sm:p-4 md:p-8 transition-all duration-500 ease-&lsqb;cubic-bezier(0.32,0.72,0,1)&rsqb; scrollbar-hide",
          showPreview && isDesktopViewport ? (previewDevice === 'mobile' ? "lg:mr-[420px]" : "lg:mr-[65%]") : ""
        )}>
          <div className="mx-auto max-w-5xl space-y-4 pb-24 sm:space-y-7 md:space-y-10 md:pb-40">
            <section className="rounded-[24px] border border-border/60 bg-white/90 p-3 shadow-sm dark:bg-zinc-900/70 sm:hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Resumen</p>
                  <h2 className="mt-1 text-sm font-semibold text-foreground">
                    {formValues.title?.trim() || 'Tu workout todavia no tiene titulo'}
                  </h2>
                </div>
                <Badge variant="outline" className="rounded-full border-border/60 bg-background text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {builderLabel}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Secciones</p>
                  <p className="mt-1 text-base font-semibold text-foreground">{sectionFields.length}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Ejercicios</p>
                  <p className="mt-1 text-base font-semibold text-foreground">{totalExercises}</p>
                </div>
                <button
                  type="button"
                  className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-left transition-colors hover:border-primary/30 hover:text-primary"
                  onClick={() => {
                    setPreviewDevice('mobile')
                    setShowPreview(true)
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Vista previa</p>
                  <p className="mt-1 text-xs font-semibold text-foreground">Abrir</p>
                </button>
              </div>
            </section>

            {/* Sections (Step 1) */}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections" type="SECTION">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 sm:space-y-6">
                    {sectionFields.map((section, index) => {
                      const sectionAmrapEnabled = watch(`sections.${index}.amrap.enabled`)
                      const sectionTimeCap = watch(`sections.${index}.amrap.timeCapSeconds`) || 600
                      const exerciseCount = (section.exercises || []).length

                      return (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "group relative overflow-hidden rounded-[22px] border shadow-xl backdrop-blur-sm animate-in slide-in-from-bottom-8 duration-700 fill-mode-backwards sm:rounded-[2rem]",
                              sectionAmrapEnabled
                                ? "border-emerald-400/40 bg-gradient-to-b from-emerald-50/70 to-white dark:from-emerald-950/30 dark:to-zinc-900/50 shadow-emerald-500/10"
                                : "border-border/50 bg-white dark:bg-zinc-900/50 shadow-black/5",
                            )}
                            style={{ 
                                ...provided.draggableProps.style,
                                animationDelay: `${index * 100}ms` 
                            }}
                          >
                            {sectionAmrapEnabled && (
                              <div className="relative h-1.5 w-full overflow-hidden bg-emerald-100/80 dark:bg-emerald-950">
                                <div className="absolute inset-0 animate-[shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
                                <div className="absolute inset-0 animate-[pulse_2s_ease-in-out_infinite] bg-gradient-to-r from-emerald-400/60 via-teal-400/80 to-emerald-500/60 mix-blend-overlay" />
                              </div>
                            )}
                            <div className={cn(
                              "flex items-start gap-2 border-b p-3 sm:items-center sm:gap-4 sm:p-6",
                              sectionAmrapEnabled
                                ? "border-emerald-200/50 bg-gradient-to-r from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-zinc-900/50"
                                : "border-border/50 bg-gradient-to-r from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-900/50"
                            )}>
                              <div {...provided.dragHandleProps} className="cursor-grab rounded-xl p-1.5 text-muted-foreground/30 transition-colors hover:bg-black/5 hover:text-foreground sm:p-2">
                                <GripVertical className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <div className="flex flex-1 flex-col items-start gap-3">
                                <div className="flex w-full flex-col items-start gap-3 lg:flex-row lg:items-center lg:gap-4">
                                  <div className="flex w-full flex-1 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-2.5">
                                    <div className="min-w-0 flex-1">
                                      <Input 
                                          {...register(`sections.${index}.name` as const)} 
                                          placeholder="Nombre de la seccion" 
                                          className={cn(
                                            "h-auto w-full bg-transparent px-0 text-lg font-black tracking-tight shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/25 sm:text-2xl",
                                            sectionAmrapEnabled && "text-emerald-800 dark:text-emerald-200"
                                          )}
                                      />
                                    </div>
                                    <input type="hidden" {...register(`sections.${index}.id` as const)} />
                                    {sectionAmrapEnabled ? (
                                      <span className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-full border border-emerald-500/30 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-sm shadow-emerald-500/25 sm:justify-start sm:text-[10px]">
                                        <Trophy className="h-3 w-3" />
                                        AMRAP
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="flex w-full flex-wrap items-stretch justify-between gap-2 sm:w-auto sm:justify-start">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() => toggleAmrapSection(index)}
                                          className={cn(
                                            "group/btn relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] transition-all duration-300 sm:text-xs",
                                            sectionAmrapEnabled
                                              ? "border-emerald-500/30 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 hover:shadow-emerald-500/40"
                                              : "border-border/60 bg-background text-muted-foreground hover:border-emerald-400/40 hover:bg-emerald-500/5 hover:text-emerald-600 dark:hover:text-emerald-400"
                                          )}
                                        >
                                          {sectionAmrapEnabled && (
                                            <span className="absolute inset-0 animate-[shimmer_2.5s_linear_infinite] bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.25)_50%,transparent_80%)]" />
                                          )}
                                          <Trophy className={cn(
                                            "h-3.5 w-3.5 transition-transform duration-300",
                                            sectionAmrapEnabled && "drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]"
                                          )} />
                                          <span className="relative">
                                            {sectionAmrapEnabled ? 'Reto activo' : 'Activar reto'}
                                          </span>
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs bg-zinc-900 text-white border-white/10 text-xs leading-relaxed">
                                        {sectionAmrapEnabled
                                          ? 'Desactiva para volver al modo normal (rondas fijas).'
                                          : 'Modo reto: haz todas las rondas posibles de esta sección dentro de un tiempo límite.'}
                                      </TooltipContent>
                                    </Tooltip>

                                    <Controller
                                        control={control}
                                        name={`sections.${index}.orderType` as const}
                                        render={({ field }) => (
                                    <div className={cn(
                                      "flex gap-0.5 rounded-xl p-0.5 transition-colors",
                                      sectionAmrapEnabled
                                        ? "bg-emerald-500/10 ring-1 ring-emerald-500/20"
                                        : "bg-muted/50"
                                    )}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button 
                                                    type="button"
                                                    disabled={sectionAmrapEnabled}
                                                    onClick={() => field.onChange('single')}
                                                    className={cn(
                                                        "relative flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase transition-all",
                                                        field.value === 'single' && !sectionAmrapEnabled
                                                          ? "bg-background dark:bg-zinc-800 shadow-sm text-foreground"
                                                          : sectionAmrapEnabled
                                                            ? "text-muted-foreground/40 cursor-not-allowed"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    <Repeat className="h-3 w-3" />
                                                    <span className="hidden sm:inline">Series</span>
                                                    {sectionAmrapEnabled && field.value === 'single' && (
                                                      <Lock className="absolute -right-1 -top-1 h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                                                    )}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-zinc-900 text-white border-white/10 text-xs">
                                                {sectionAmrapEnabled
                                                  ? <p>En modo reto, el circuito está activado para que se hagan rondas completas.</p>
                                                  : <p>Todas las series del mismo ejercicio seguidas.</p>}
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button 
                                                    type="button"
                                                    onClick={() => field.onChange('linear')}
                                                    className={cn(
                                                        "relative flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase transition-all",
                                                        field.value === 'linear' || !field.value || sectionAmrapEnabled
                                                          ? sectionAmrapEnabled
                                                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                                                            : "bg-background dark:bg-zinc-800 shadow-sm text-foreground"
                                                          : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    <Repeat className="h-3 w-3" />
                                                    <span className="hidden sm:inline">Circuito</span>
                                                    {sectionAmrapEnabled && (
                                                      <InfinityIcon className="ml-0.5 h-2.5 w-2.5 opacity-80" />
                                                    )}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-zinc-900 text-white border-white/10 text-xs">
                                                <p>Una serie de cada ejercicio y repite la vuelta.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                        )}
                                    />

                                    <Button 
                                      type="button" variant="ghost" size="icon" 
                                      onClick={() => removeSection(index)}
                                      className="h-8 w-8 rounded-full text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100 sm:h-9 sm:w-9"
                                    >
                                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </Button>
                                  </div>
                                </div>

                                {sectionAmrapEnabled && (
                                  <div className="flex w-full flex-col gap-3 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-white/40 to-emerald-500/5 p-3 sm:gap-3.5 sm:p-4 dark:from-emerald-950/30 dark:via-zinc-900/50 dark:to-emerald-950/30">
                                    <div className="flex flex-col gap-3.5 sm:gap-4 md:flex-row md:items-stretch md:justify-between">
                                      <div className="hidden flex-1 items-center gap-2.5 sm:flex sm:gap-3">
                                        <div className="shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-2.5 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-300 sm:p-3">
                                          <Timer className="h-5 w-5 sm:h-7 sm:w-7" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-baseline gap-2">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300 sm:text-[11px]">
                                              Tiempo límite
                                            </p>
                                          </div>
                                          <Controller
                                            control={control}
                                            name={`sections.${index}.amrap.timeCapSeconds`}
                                            render={({ field }) => (
                                              <div className="mt-1 flex items-baseline gap-2 sm:mt-1.5">
                                                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-5xl font-black leading-none tracking-tight text-transparent dark:from-emerald-400 dark:to-teal-400 md:text-6xl">
                                                  {Math.max(1, Math.round((field.value || 600) / 60))}
                                                </span>
                                                <div className="flex flex-col items-start justify-end pb-1">
                                                  <span className="text-lg font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 md:text-xl">
                                                    min
                                                  </span>
                                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700/80 dark:text-emerald-300/80 sm:text-[11px]">
                                                    <InfinityIcon className="h-3 w-3" />
                                                    As many rounds as possible
                                                  </span>
                                                </div>
                                              </div>
                                            )}
                                          />
                                          <p className="mt-2 text-[11px] leading-tight text-muted-foreground/80 sm:text-xs">
                                            Completa tantas vueltas como puedas antes de que suene el cap.
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex flex-col gap-2.5 sm:hidden">
                                        <div className="flex items-center gap-2.5">
                                          <div className="shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-2.5 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-300">
                                            <Timer className="h-6 w-6" />
                                          </div>
                                          <div className="relative flex-1">
                                            <Controller
                                              control={control}
                                              name={`sections.${index}.amrap.timeCapSeconds`}
                                              render={({ field }) => (
                                                <>
                                                  <Input
                                                    type="number"
                                                    min={0}
                                                    max={999}
                                                    step={1}
                                                    value={Math.max(1, Math.round((field.value || 600) / 60))}
                                                    onChange={(event) => {
                                                      const mins = Math.max(1, Math.min(240, Number(event.target.value) || 1))
                                                      field.onChange(mins * 60)
                                                    }}
                                                    className="h-14 w-full border-2 border-emerald-400/35 bg-gradient-to-b from-white via-white to-emerald-50/70 pr-12 pl-3 text-[clamp(2.1rem,9vw,3.25rem)] font-black leading-none tracking-tight text-emerald-800 shadow-[0_0_0_4px_rgba(16,185,129,0.05)] focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/20 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/40 dark:text-emerald-200 sm:h-16 sm:pr-16 sm:pl-4 sm:text-[3.25rem]"
                                                  />
                                                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-[0.22em] text-emerald-600/70 dark:text-emerald-400/80 sm:right-5 sm:text-sm">
                                                    min
                                                  </span>
                                                </>
                                              )}
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex flex-col gap-2 sm:hidden">
                                        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-gradient-to-r from-emerald-500/8 via-teal-500/5 to-emerald-500/8 px-3 py-2.5">
                                          <div className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-600 dark:text-emerald-400">
                                            <InfinityIcon className="h-3.5 w-3.5" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700/80 dark:text-emerald-300/80">
                                              Modo
                                            </p>
                                            <p className="text-[11px] font-semibold leading-tight text-foreground">
                                              Circuito ∞
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-gradient-to-r from-emerald-500/8 via-teal-500/5 to-emerald-500/8 px-3 py-2.5">
                                          <div className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-600 dark:text-emerald-400">
                                            <Repeat className="h-3.5 w-3.5" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700/80 dark:text-emerald-300/80">
                                              Vuelta
                                            </p>
                                            <p className="text-[11px] font-semibold leading-tight text-foreground">
                                              {exerciseCount || 0} ejercicios
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-gradient-to-r from-emerald-500/8 via-teal-500/5 to-emerald-500/8 px-3 py-2.5">
                                          <div className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-600 dark:text-emerald-400">
                                            <Zap className="h-3.5 w-3.5" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700/80 dark:text-emerald-300/80">
                                              Descanso
                                            </p>
                                            <p className="text-[11px] font-semibold leading-tight text-foreground">
                                              0s · sin pausa
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-gradient-to-r from-emerald-500/8 via-teal-500/5 to-emerald-500/8 px-3 py-2.5">
                                          <div className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-600 dark:text-emerald-400">
                                            <Trophy className="h-3.5 w-3.5" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700/80 dark:text-emerald-300/80">
                                              Score
                                            </p>
                                            <p className="text-[11px] font-semibold leading-tight text-foreground">
                                              Rondas + reps
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex flex-col gap-2 sm:gap-2.5 md:w-72 md:shrink-0">
                                        <div className="relative w-full sm:flex-none">
                                          <Controller
                                            control={control}
                                            name={`sections.${index}.amrap.timeCapSeconds`}
                                            render={({ field }) => (
                                              <>
                                                <Input
                                                  type="number"
                                                  min={1}
                                                  max={240}
                                                  step={1}
                                                  value={Math.max(1, Math.round((field.value || 600) / 60))}
                                                  onChange={(event) => {
                                                    const mins = Math.max(1, Math.min(240, Number(event.target.value) || 1))
                                                    field.onChange(mins * 60)
                                                  }}
                                                  className="hidden h-14 w-full border-border/60 bg-background pr-14 pl-4 text-right text-2xl font-black tracking-tight focus-visible:ring-emerald-500/20 sm:block sm:h-14 sm:pr-16 sm:text-3xl"
                                                />
                                                <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50 sm:block sm:right-5 sm:text-xs">
                                                  min
                                                </span>
                                              </>
                                            )}
                                          />
                                        </div>
                                        <div className="hidden min-[440px]:flex flex-nowrap items-stretch justify-between gap-1 overflow-hidden sm:gap-1">
                                          {AMRAP_QUICK_PRESETS.map((preset) => {
                                            const presetSeconds = preset.minutes * 60
                                            const isActive = Math.abs(sectionTimeCap - presetSeconds) < 1
                                            return (
                                              <Tooltip key={preset.minutes}>
                                                <TooltipTrigger asChild>
                                                  <button
                                                    type="button"
                                                    onClick={() => setValue(`sections.${index}.amrap.timeCapSeconds`, presetSeconds, { shouldDirty: true })}
                                                    className={cn(
                                                      "flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-1.5 py-1.5 text-[10px] font-black transition-all duration-200 sm:px-2 sm:py-1 sm:text-[11px]",
                                                      isActive
                                                        ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30"
                                                        : "border border-border/60 bg-background text-muted-foreground hover:border-emerald-400/30 hover:text-emerald-600 dark:hover:text-emerald-400"
                                                    )}
                                                  >
                                                    <span className="leading-none text-base sm:text-sm">{preset.minutes}</span>
                                                    <span className={cn(
                                                      "mt-0.5 hidden text-[8px] font-bold uppercase tracking-widest opacity-80 min-[540px]:inline sm:text-[9px]",
                                                      isActive ? "text-white/90" : "text-muted-foreground/60"
                                                    )}>
                                                      {preset.intensity}
                                                    </span>
                                                  </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" className="bg-zinc-900 text-white border-white/10 text-[11px]">
                                                  {preset.intensity}: {preset.minutes} minutos
                                                </TooltipContent>
                                              </Tooltip>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="hidden grid-cols-2 gap-1.5 rounded-xl border border-emerald-500/15 bg-gradient-to-r from-emerald-500/8 via-teal-500/5 to-emerald-500/8 p-2.5 sm:grid sm:gap-2 sm:p-3 md:grid-cols-4 md:gap-2.5">
                                      <div className="flex items-center gap-2">
                                        <div className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-600 dark:text-emerald-400">
                                          <InfinityIcon className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700/80 dark:text-emerald-300/80">
                                            Modo
                                          </p>
                                          <p className="text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
                                            Circuito ∞
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-600 dark:text-emerald-400">
                                          <Repeat className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700/80 dark:text-emerald-300/80">
                                            Vuelta
                                          </p>
                                          <p className="text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
                                            {exerciseCount || 0} ejercicios
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-600 dark:text-emerald-400">
                                          <Zap className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700/80 dark:text-emerald-300/80">
                                            Descanso
                                          </p>
                                          <p className="text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
                                            0s · sin pausa
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-600 dark:text-emerald-400">
                                          <Trophy className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700/80 dark:text-emerald-300/80">
                                            Score
                                          </p>
                                          <p className="text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
                                            Rondas + reps
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className={cn(
                              "relative p-3 sm:p-5 md:p-8",
                              sectionAmrapEnabled && "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-emerald-400/30 before:to-transparent"
                            )}>
                              <ExercisesFieldArray 
                                nestIndex={index} 
                                control={control} 
                                register={register} 
                                setValue={setValue}
                                watch={watch}
                                errors={errors}
                                isCompactMobile={isCompactMobileViewport}
                                isAmrapSection={sectionAmrapEnabled}
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    )})}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="group relative mt-5 mb-14 sm:mt-8 sm:mb-20">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-dashed border-border/40 group-hover:border-primary/20 transition-colors" />
                </div>
                <div className="relative flex justify-center">
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="lg"
                        className="h-11 w-full rounded-full border border-dashed border-border/60 bg-background px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 shadow-sm transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-md sm:h-12 sm:w-auto sm:px-8 sm:text-xs"
                        onClick={() => appendSection({ id: `sec-${Date.now()}`, name: '', orderType: 'linear', amrap: { enabled: false, timeCapSeconds: 600 }, exercises: [] })}
                    >
                        <span className="flex items-center gap-2 group-hover:gap-3 transition-all">
                            <Plus className="h-4 w-4" />
                            Agregar seccion
                        </span>
                    </Button>
                </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Preview Panel */}
        {isDesktopViewport && (
        <div className={cn(
            "absolute inset-y-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-l transform transition-all duration-500 ease-&lsqb;cubic-bezier(0.32,0.72,0,1)&rsqb; z-20 shadow-2xl",
            showPreview ? "translate-x-0" : "translate-x-full",
            previewDevice === 'mobile' ? "w-full md:w-[420px]" : "w-full md:w-[65%]"
        )}>
          {/* Preview Controls */}
          <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center px-6 z-50 pointer-events-none">
             <div className="flex items-center gap-1 bg-background/95 backdrop-blur-md p-1.5 rounded-full shadow-xl border border-border pointer-events-auto">
                <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={cn(
                        "p-2.5 rounded-full transition-all duration-300",
                        previewDevice === 'mobile' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                >
                    <Smartphone className="h-4 w-4" />
                </button>
                <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={cn(
                        "p-2.5 rounded-full transition-all duration-300",
                        previewDevice === 'desktop' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                >
                    <Monitor className="h-4 w-4" />
                </button>
             </div>
          </div>

          <div className="h-full pt-16 flex items-center justify-center p-6 md:p-10 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]">
            {/* Device Frame */}
            <div className={cn(
                "transition-all duration-500 ease-in-out relative shadow-2xl overflow-hidden bg-background",
                previewDevice === 'mobile' 
                    ? "w-full max-w-[360px] h-[720px] max-h-[calc(100vh-8rem)] rounded-[3rem] border-[8px] border-zinc-900 ring-1 ring-white/20" 
                    : "w-full max-w-5xl h-[600px] max-h-[calc(100vh-8rem)] rounded-xl border-[12px] border-zinc-900 ring-1 ring-white/20"
            )}>
               {/* Mobile Notch */}
               {previewDevice === 'mobile' && (
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-28 bg-zinc-900 rounded-b-2xl z-30 flex items-center justify-center gap-2">
                        <div className="w-10 h-1 rounded-full bg-zinc-800/50" />
                   </div>
               )}
               {/* Desktop Camera Dot */}
               {previewDevice === 'desktop' && (
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-4 bg-zinc-900 rounded-full z-30 mt-1" />
               )}
               
               {/* Actual Preview Component */}
               <div className="h-full w-full bg-white dark:bg-black text-foreground overflow-hidden relative">
                   <PreviewWorkout 
                        data={formValues} 
                        onClose={() => setShowPreview(false)} 
                   />
               </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Step 2: Metadata Dialog */}
      <Dialog open={isMetaOpen} onOpenChange={setIsMetaOpen}>
        <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-16px)] max-w-3xl flex-col gap-0 overflow-hidden rounded-[28px] p-0 sm:w-full">
          <DialogHeader className="shrink-0 border-b border-border/60 bg-background px-4 py-3 sm:px-6 sm:py-4">
            <DialogTitle>Detalles del workout</DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-6 sm:px-6">
            <div className="rounded-[24px] border border-border/60 bg-muted/20 p-3.5 sm:p-5">
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Identidad</p>
              </div>

              <div className="space-y-3">
              <Input 
                {...register('title')} 
                placeholder="Titulo del workout" 
                className="h-auto border-none bg-transparent px-0 text-xl font-black tracking-tighter text-foreground focus-visible:ring-0 placeholder:text-muted-foreground/40 md:text-3xl"
              />
              <Textarea 
                {...register('description')} 
                placeholder="Descripcion breve" 
                className="min-h-[76px] resize-none rounded-[20px] border-border/60 bg-background text-sm font-medium text-foreground shadow-none focus-visible:ring-0"
              />
            </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div className="space-y-2 rounded-[24px] border border-border/60 bg-muted/20 p-3.5 sm:p-5">
                <div>
                  <label className="pl-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Portada</label>
                </div>
                <Controller
                  control={control}
                  name="cover"
                  render={({ field }) => (
                    <MediaInput 
                      value={field.value} 
                      onChange={field.onChange}
                      placeholder="Añadir portada..."
                      type="media"
                      compact={isCompactMobileViewport}
                    />
                  )}
                />
              </div>

              <div className="space-y-2 rounded-[24px] border border-border/60 bg-muted/20 p-3.5 sm:p-5">
                <div>
                  <label className="pl-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Playlist</label>
                </div>
                <Controller
                  control={control}
                  name="audio"
                  render={({ field }) => (
                    <TagInput 
                      value={field.value || []} 
                      onChange={field.onChange}
                      placeholder="Pega links de YouTube o Spotify..."
                      icon={<Music className="h-4 w-4" />}
                      variant="blue"
                      compact={isCompactMobileViewport}
                    />
                  )}
                />
              </div>

              <div className="space-y-2 rounded-[24px] border border-border/60 bg-muted/20 p-3.5 sm:p-5">
                <div>
                  <label className="pl-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tags</label>
                </div>
                <Controller
                  control={control}
                  name="tags"
                  render={({ field }) => (
                    <WorkoutTagSelector 
                      value={field.value || []} 
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="space-y-2 rounded-[24px] border border-border/60 bg-muted/20 p-3.5 sm:p-5">
                <div>
                  <label className="pl-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dificultad</label>
                </div>
                <Controller
                  control={control}
                  name="difficulty"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-10 w-full rounded-2xl border-border/50 bg-background text-sm font-medium focus:ring-primary/20 sm:h-11">
                        <SelectValue placeholder="Selecciona la dificultad" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/50 shadow-xl">
                        <SelectItem value="beginner" className="rounded-lg my-1 cursor-pointer focus:bg-primary/5 focus:text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Dna className="h-4 w-4 text-emerald-500" />
                            <span>Principiante</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="intermediate" className="rounded-lg my-1 cursor-pointer focus:bg-primary/5 focus:text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            <span>Intermedio</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="advanced" className="rounded-lg my-1 cursor-pointer focus:bg-primary/5 focus:text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-orange-500" />
                            <span>Avanzado</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2 rounded-[24px] border border-border/60 bg-muted/20 p-3.5 sm:p-5 md:col-span-2">
                <div className="flex items-center gap-2 px-1">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Visibilidad</label>
                </div>
                <Controller
                  control={control}
                  name="visibility"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-10 w-full rounded-2xl border-border/50 bg-background text-sm font-medium focus:ring-primary/20 sm:h-11">
                        <SelectValue placeholder="Selecciona la visibilidad" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/50 shadow-xl">
                        <SelectItem value="draft" className="rounded-lg my-1 cursor-pointer focus:bg-primary/5 focus:text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-500" />
                            <span>Borrador</span>
                            <span className="ml-auto text-xs text-muted-foreground">En edicion</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="private" className="rounded-lg my-1 cursor-pointer focus:bg-primary/5 focus:text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-rose-500" />
                            <span>Privado</span>
                            <span className="ml-auto text-xs text-muted-foreground">Solo tu</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="followers" className="rounded-lg my-1 cursor-pointer focus:bg-primary/5 focus:text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-sky-500" />
                            <span>Solo seguidores</span>
                            <span className="ml-auto text-xs text-muted-foreground">Tu comunidad</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="public" className="rounded-lg my-1 cursor-pointer focus:bg-primary/5 focus:text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-emerald-500" />
                            <span>Publico</span>
                            <span className="ml-auto text-xs text-muted-foreground">Todos</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border/60 bg-background px-4 py-4 sm:px-6">
            <Button type="button" variant="ghost" onClick={() => setIsMetaOpen(false)}>
              Cerrar
            </Button>
            <Button type="button" onClick={handleSubmit(onSubmit, onInvalidSubmit)} className="gap-2" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? 'Guardando...' : 'Guardar workout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PremiumFeatureDialog
        open={isPremiumDialogOpen}
        onOpenChange={setIsPremiumDialogOpen}
        title="Asistente de IA premium"
        description="La generacion de workouts con IA esta disponible solo para usuarios premium. Actualiza tu plan para desbloquear prompts, voz y creacion asistida."
      />

      {/* AI Assistant Dialog */}
      <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    AI Workout Assistant
                </DialogTitle>
                <DialogDescription>
                    Describe your goal and let AI build the structure for you.
                    <br/>
                    <span className="text-xs text-muted-foreground/80 italic">e.g., &quot;Leg day focused on quads, advanced level&quot; or &quot;30 min HIIT cardio without equipment&quot;</span>
                </DialogDescription>
            </DialogHeader>
            <div className="relative">
                <Textarea 
                    value={aiPrompt} 
                    onChange={e => setAiPrompt(e.target.value)} 
                    placeholder="What do you want to train today? (You can also use voice)" 
                    className="min-h-[100px] text-base pr-12 resize-none"
                />
                <Button 
                    type="button"
                    variant={isListening ? "destructive" : "secondary"}
                    size="icon"
                    className={cn(
                        "absolute bottom-3 right-3 h-8 w-8 rounded-full transition-all duration-300 shadow-sm",
                        isListening && "animate-pulse scale-110 ring-4 ring-red-500/20"
                    )}
                    onClick={toggleListening}
                    title={isListening ? "Detener escucha" : "Iniciar entrada por voz"}
                >
                    <Mic className={cn("h-4 w-4", isListening ? "animate-bounce" : "")} />
                </Button>
            </div>
            <DialogFooter>
                <Button onClick={handleAiGenerate} disabled={isGenerating || !aiPrompt.trim()} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generando...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generar magia
                        </>
                    )}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!isDesktopViewport && showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="flex h-[100dvh] w-screen !max-w-none flex-col gap-0 overflow-hidden rounded-none border-none bg-background p-0 shadow-none sm:hidden">
          <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
            <div className="flex items-center gap-1 rounded-full bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  previewDevice === 'mobile' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                <Smartphone className="mr-1 inline h-3.5 w-3.5" />
                Móvil
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  previewDevice === 'desktop' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                <Monitor className="mr-1 inline h-3.5 w-3.5" />
                Escritorio
              </button>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full px-3" onClick={() => setShowPreview(false)}>
              Cerrar
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden bg-neutral-100 p-2 dark:bg-zinc-950">
            <div
              className={cn(
                'mx-auto h-full overflow-hidden bg-background shadow-xl ring-1 ring-black/5',
                previewDevice === 'mobile'
                  ? 'max-w-[390px] rounded-[2rem] border-[7px] border-zinc-900'
                  : 'rounded-2xl border-[10px] border-zinc-900'
              )}
            >
              <PreviewWorkout
                data={formValues}
                onClose={() => setShowPreview(false)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


function ExercisesFieldArray({ nestIndex, control, register, setValue, watch, isCompactMobile = false, isAmrapSection = false }: { nestIndex: number, control: any, register: any, setValue: any, watch: any, errors: any, isCompactMobile?: boolean, isAmrapSection?: boolean }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${nestIndex}.exercises`
  })

  const renderHint = (text: string, className?: string) => {
    if (isCompactMobile) return null

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "rounded-full border border-border/60 bg-background/80 p-1.5 text-muted-foreground transition-colors hover:text-foreground",
              className
            )}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    )
  }

  const handleAddFromVault = (exercise: Exercise) => {
    const tutorialData = Array.isArray(exercise.tutorial) ? exercise.tutorial[0] : exercise.tutorial

    append({
        id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        db_id: exercise.id,
        name: exercise.name,
        type: (exercise.type === 'time' ? 'time' : 'reps'),
        reps: exercise.reps || 0,
        sets: exercise.sets || 3,
        rest: exercise.rest || 60,
        duration: exercise.duration || 0,
        description: exercise.description || '',
        difficulty: (exercise.difficulty as any) || 'beginner',
        muscle_groups: exercise.muscle_group || [],
        equipment: exercise.equipment || [],
        thumbnail_media_id: exercise.thumbnail_media_id,
        thumbnail_url: exercise.thumbnail?.url,
        tutorial: sanitizeTutorial(tutorialData ? {
          media_url: tutorialData.media?.url || '',
          media_id: null,
          filename: null,
          bucket_path: null,
          media_type: (tutorialData.media?.type as 'image' | 'video' | 'audio' | null) || inferMediaType(tutorialData.media?.url),
          steps: (tutorialData.steps || []).map((step: { id?: string; title: string; description: string }) => ({
            id: step.id,
            title: step.title,
            description: step.description,
          })),
        } : undefined) || undefined,
    })
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <Droppable droppableId={`exercises-${nestIndex}`} type="EXERCISE">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 sm:space-y-4">
            {fields.map((item, k) => {
              const exercisePath = `sections.${nestIndex}.exercises.${k}` as const
              const watchedType = watch(`${exercisePath}.type`)
              const selectedType = watchedType === 'time' ? 'time' : watchedType === 'emom' ? 'emom' : 'reps'
              const hasTutorial = Boolean(watch(`${exercisePath}.tutorial`))
              const exerciseSets = watch(`${exercisePath}.sets`) ?? 1

              return (
                <Draggable key={item.id} draggableId={item.id} index={k}>
                    {(provided) => (
                        <article
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "group relative overflow-hidden rounded-[20px] border p-2.5 shadow-sm transition-all duration-300 hover:shadow-lg sm:p-4 md:rounded-[30px] md:p-6",
                              isAmrapSection
                                ? "border-emerald-300/40 bg-gradient-to-br from-white via-emerald-50/30 to-white shadow-emerald-500/5 dark:from-zinc-950 dark:via-emerald-950/20 dark:to-zinc-950"
                                : "border-border/60 bg-gradient-to-br from-white via-white to-muted/20 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/80"
                            )}
                        >
                            {isAmrapSection && (
                              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
                            )}
                            {!isAmrapSection && (
                              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                            )}
                            
                            {/* Drag Handle */}
                            <div 
                                {...provided.dragHandleProps} 
                                className={cn(
                                  "absolute left-2 top-2.5 z-10 rounded-xl p-1.5 transition-colors hover:bg-black/5 hover:text-foreground sm:left-3 sm:top-4 sm:p-2",
                                  isAmrapSection ? "text-emerald-500/25 hover:text-emerald-600" : "text-muted-foreground/30"
                                )}
                            >
                                <GripVertical className="h-5 w-5" />
                            </div>

                            {/* Delete Button (Absolute Top Right) */}
                            <div className="absolute right-2.5 top-2.5 z-10 sm:right-4 sm:top-4">
                                <Button 
                                    type="button" variant="ghost" size="icon" 
                                    onClick={() => remove(k)}
                                    className="h-7 w-7 rounded-full text-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive sm:h-8 sm:w-8"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="pt-10 pl-2.5 pr-2.5 sm:pt-0 sm:pl-10 sm:pr-10">
                              <div className="flex flex-col items-stretch gap-2 border-b border-border/60 pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:pb-5">
                                <div className="flex flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
                                  <span className={cn(
                                    "rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] sm:px-3 sm:py-1 sm:text-[10px]",
                                    isAmrapSection
                                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                      : "border-primary/20 bg-primary/10 text-primary"
                                  )}>
                                    {isAmrapSection ? `Vuelta · Paso ${k + 1}` : `Ejercicio ${k + 1}`}
                                  </span>
                                  {isAmrapSection ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300 sm:px-3 sm:text-[10px]">
                                      <InfinityIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      x∞ sets
                                    </span>
                                  ) : (
                                    <span className="rounded-full border border-border/70 bg-background/80 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground sm:px-3 sm:text-[10px]">
                                      {selectedType === 'time' ? 'Por tiempo' : selectedType === 'emom' ? 'EMOM' : 'Por repeticiones'}
                                    </span>
                                  )}
                                  {!isAmrapSection && selectedType === 'emom' && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-gradient-to-r from-amber-500/15 to-orange-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300 sm:px-3 sm:text-[10px]">
                                      <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      Cada minuto en punto
                                    </span>
                                  )}
                                  {isAmrapSection && exerciseSets > 1 && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300 sm:px-3 sm:text-[10px]">
                                      <Info className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      Sets: {exerciseSets} (1 recomendado)
                                    </span>
                                  )}
                                  {hasTutorial && (
                                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400 sm:px-3 sm:text-[10px]">
                                      Tutorial listo
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-3 space-y-3 sm:mt-6 sm:space-y-5">
                                <div className="grid gap-3 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-stretch">
                                  <div className="rounded-[20px] border border-border/60 bg-background/75 p-3 shadow-sm sm:rounded-[28px] sm:p-4 md:p-5">
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Contenido</p>
                                      </div>
                                      {renderHint('Usa un nombre corto y una descripción breve con cues o aclaraciones útiles para entender el ejercicio de un vistazo.')}
                                    </div>

                                    <Input
                                      {...register(`sections.${nestIndex}.exercises.${k}.name`)}
                                      placeholder="Nombre del ejercicio"
                                      className="h-auto border-none bg-transparent px-0 text-[1.1rem] font-black tracking-tight shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/30 sm:text-2xl"
                                    />
                                    <input type="hidden" {...register(`sections.${nestIndex}.exercises.${k}.id`)} />
                                    <input type="hidden" {...register(`sections.${nestIndex}.exercises.${k}.db_id`)} />
                                    <input type="hidden" {...register(`sections.${nestIndex}.exercises.${k}.link_id`)} />

                                    <Textarea
                                      {...register(`sections.${nestIndex}.exercises.${k}.description`)}
                                      placeholder={isCompactMobile ? "Notas breves..." : "Ej. Mantén el core activo, baja controlado y evita encoger los hombros."}
                                      className="mt-3 min-h-[72px] resize-none rounded-[20px] border-border/60 bg-muted/20 text-sm shadow-none sm:mt-4 sm:min-h-[108px]"
                                    />
                                  </div>

                                  <div className="rounded-[20px] border border-border/60 bg-background/75 p-3 shadow-sm sm:rounded-[28px] sm:p-4">
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                      <div className="flex items-center gap-2">
                                        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                                          <ImageIcon className="h-4 w-4" />
                                        </div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                          Miniatura
                                        </label>
                                      </div>
                                      {renderHint('Sube una imagen o gif que identifique visualmente el ejercicio. Se usa como vista previa en tarjetas y listados.')}
                                    </div>

                                    <Controller
                                      control={control}
                                      name={`sections.${nestIndex}.exercises.${k}.thumbnail_url`}
                                      render={({ field }) => (
                                        <div className="min-h-[112px] overflow-hidden rounded-[20px] border-2 border-dashed border-border/50 bg-muted/30 shadow-inner transition-colors hover:border-primary/20 sm:min-h-[168px] lg:min-h-[212px]">
                                          <MediaInput
                                            value={field.value}
                                            onChange={(value) => {
                                              field.onChange(value)
                                              setValue(`sections.${nestIndex}.exercises.${k}.thumbnail_media_id`, null, { shouldDirty: true })
                                              setValue(`sections.${nestIndex}.exercises.${k}.filename`, null, { shouldDirty: true })
                                              setValue(`sections.${nestIndex}.exercises.${k}.bucket_path`, null, { shouldDirty: true })
                                            }}
                                            type="thumbnail"
                                            variant="thumbnail"
                                            compact={isCompactMobile}
                                          />
                                        </div>
                                      )}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-5">
                                  {isAmrapSection ? (
                                    <div className="rounded-[20px] border border-border/60 bg-background/75 p-3 shadow-sm sm:rounded-[28px] sm:p-4 lg:p-5">
                                      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4 md:gap-5">
                                        <div className="flex shrink-0 items-center gap-3 sm:gap-0 sm:justify-center">
                                          <div className="shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-2.5 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-300 sm:p-3">
                                            <Repeat className="h-5 w-5 sm:h-5 sm:w-5" />
                                          </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300 sm:text-xs">
                                                Reps por vuelta
                                              </p>
                                              <div className="flex flex-wrap gap-1">
                                                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-muted-foreground sm:px-2 sm:text-[9px]">
                                                  <List className="h-2.5 w-2.5" />
                                                  1 set
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-muted-foreground sm:px-2 sm:text-[9px]">
                                                  <BedDouble className="h-2.5 w-2.5" />
                                                  0s rest
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-muted-foreground sm:px-2 sm:text-[9px]">
                                                  <InfinityIcon className="h-2.5 w-2.5" />
                                                  Rondas ∞
                                                </span>
                                              </div>
                                            </div>
                                            <p className="text-[11px] leading-tight text-muted-foreground/80 sm:text-[12px]">
                                              Este número se repite en cada vuelta, sin parar, hasta que suene el timecap.
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex shrink-0 justify-center sm:justify-end pb-1">
                                          <div className="relative pt-1">
                                            <Input
                                              {...register(`sections.${nestIndex}.exercises.${k}.reps`)}
                                              type="number"
                                              inputMode="numeric"
                                              pattern="[0-9]*"
                                              min={0}
                                              placeholder="0"
                                              className="h-12 w-24 rounded-2xl border-2 border-emerald-400/35 bg-gradient-to-b from-white to-emerald-50/70 text-center text-2xl font-black tracking-tight text-emerald-800 shadow-sm focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/20 dark:from-zinc-900 dark:to-emerald-950/40 dark:text-emerald-200 sm:h-14 sm:w-28 sm:text-3xl"
                                            />
                                            <span className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] -translate-x-1/2 whitespace-nowrap text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600/80 dark:text-emerald-400/80 sm:text-[10px]">
                                              repeticiones
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                  <div className="rounded-[20px] border border-border/60 bg-background/75 p-3 shadow-sm sm:rounded-[28px] sm:p-3 lg:p-3.5">
                                    <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between">
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{isCompactMobile ? 'Formato' : 'Cómo se realiza'}</p>
                                        <p className="text-[11px] leading-5 text-muted-foreground sm:hidden">
                                          Elige cómo se mide el ejercicio y completa sus valores esenciales.
                                        </p>
                                      </div>
                                      <div className="flex items-center justify-between gap-2 sm:justify-start">
                                        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                                          <Activity className="h-4 w-4" />
                                        </div>
                                        {renderHint('Define si el ejercicio se mide por repeticiones o por tiempo, y configura sus valores principales desde este bloque.')}
                                      </div>
                                    </div>

                                    <div className="mt-1.5 space-y-1.5 sm:mt-2 sm:space-y-2 lg:grid lg:grid-cols-[0.68fr_repeat(3,minmax(0,1fr))] lg:items-stretch lg:gap-1 lg:space-y-0">
                                      <Controller
                                        control={control}
                                        name={`sections.${nestIndex}.exercises.${k}.type`}
                                        render={({ field }) => (
                                          <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-1 lg:grid-rows-3 lg:gap-1 lg:self-start">
                                            <button
                                              type="button"
                                              onClick={() => field.onChange('reps')}
                                              className={cn(
                                                'relative rounded-[14px] border p-2 text-left transition-all sm:rounded-[16px] sm:p-2 lg:p-1.5',
                                                field.value === 'reps'
                                                  ? 'border-primary/40 bg-primary/[0.08] shadow-sm'
                                                  : 'border-border/60 bg-muted/20 hover:border-primary/20 hover:bg-background'
                                              )}
                                            >
                                              {renderHint('Mide el ejercicio por número de repeticiones en cada serie.', 'absolute right-1 top-1 sm:right-1.5 sm:top-1.5')}
                                              <div className={cn('flex items-start gap-2 lg:gap-1.5', isCompactMobile && 'justify-center')}>
                                                <div className={cn('rounded-xl bg-background/90 p-1.5 text-primary shadow-sm lg:p-1.25', isCompactMobile && 'p-2')}>
                                                  <Repeat className={cn('h-3 w-3', isCompactMobile && 'h-3.5 w-3.5')} />
                                                </div>
                                                <div className={cn('min-w-0 flex-1 pr-6 sm:pr-7', isCompactMobile && 'sr-only')}>
                                                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[9px]">
                                                    Rep
                                                  </span>
                                                </div>
                                              </div>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => field.onChange('time')}
                                              className={cn(
                                                'relative rounded-[14px] border p-2 text-left transition-all sm:rounded-[16px] sm:p-2 lg:p-1.5',
                                                field.value === 'time'
                                                  ? 'border-primary/40 bg-primary/[0.08] shadow-sm'
                                                  : 'border-border/60 bg-muted/20 hover:border-primary/20 hover:bg-background'
                                              )}
                                            >
                                              {renderHint('Mide el ejercicio por duración en segundos para cada serie.', 'absolute right-1 top-1 sm:right-1.5 sm:top-1.5')}
                                              <div className={cn('flex items-start gap-2 lg:gap-1.5', isCompactMobile && 'justify-center')}>
                                                <div className={cn('rounded-xl bg-background/90 p-1.5 text-primary shadow-sm lg:p-1.25', isCompactMobile && 'p-2')}>
                                                  <Timer className={cn('h-3 w-3', isCompactMobile && 'h-3.5 w-3.5')} />
                                                </div>
                                                <div className={cn('min-w-0 flex-1 pr-6 sm:pr-7', isCompactMobile && 'sr-only')}>
                                                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[9px]">
                                                    Tiempo
                                                  </span>
                                                </div>
                                              </div>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                field.onChange('emom')
                                                // EMOM never has its own rest — the leftover time in the window is the rest.
                                                setValue(`sections.${nestIndex}.exercises.${k}.rest`, 0, { shouldDirty: true })
                                              }}
                                              className={cn(
                                                'relative rounded-[14px] border p-2 text-left transition-all sm:rounded-[16px] sm:p-2 lg:p-1.5',
                                                field.value === 'emom'
                                                  ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/[0.12] to-orange-500/[0.08] shadow-sm'
                                                  : 'border-border/60 bg-muted/20 hover:border-amber-500/30 hover:bg-background'
                                              )}
                                            >
                                              {renderHint(
                                                'EMOM: cada serie tiene un tiempo y una meta de repeticiones. Complétalas dentro de esa ventana — lo que sobre hasta que acabe es tu descanso, sin un campo de rest aparte.',
                                                'absolute right-1 top-1 sm:right-1.5 sm:top-1.5'
                                              )}
                                              <div className={cn('flex items-start gap-2 lg:gap-1.5', isCompactMobile && 'justify-center')}>
                                                <div className={cn('rounded-xl bg-background/90 p-1.5 text-amber-600 shadow-sm lg:p-1.25 dark:text-amber-400', isCompactMobile && 'p-2')}>
                                                  <Zap className={cn('h-3 w-3', isCompactMobile && 'h-3.5 w-3.5')} />
                                                </div>
                                                <div className={cn('min-w-0 flex-1 pr-6 sm:pr-7', isCompactMobile && 'sr-only')}>
                                                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300 sm:text-[9px]">
                                                    EMOM
                                                  </span>
                                                </div>
                                              </div>
                                            </button>
                                          </div>
                                        )}
                                      />

                                      <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1.15fr)] gap-2 sm:grid-cols-3 lg:contents">
                                        <div className="relative min-w-0 rounded-[18px] border border-border/60 bg-muted/20 p-2 sm:rounded-[20px] sm:p-1.5 lg:flex lg:h-full lg:flex-col lg:justify-between">
                                          {renderHint(
                                            selectedType === 'time'
                                              ? 'Indica los segundos que dura cada serie del ejercicio.'
                                              : selectedType === 'emom'
                                                ? 'Indica cuántas repeticiones debe completar el usuario dentro de cada ventana de tiempo.'
                                                : 'Indica cuántas repeticiones debe completar el usuario en cada serie.',
                                            'absolute right-2 top-1.5 sm:right-1.5 sm:top-1.5'
                                          )}
                                          <div className="flex items-center gap-1.5">
                                            <div className="rounded-xl bg-background/90 p-1.5 text-primary shadow-sm sm:p-1">
                                              {(selectedType === 'time')
                                                ? <Timer className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
                                                : <Repeat className="h-3 w-3 sm:h-2.5 sm:w-2.5" />}
                                            </div>
                                            <div className={cn('flex items-center gap-1 pr-7 sm:pr-6', isCompactMobile && 'sr-only')}>
                                              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[9px]">
                                                {selectedType === 'time' ? 'Segundos' : 'Repeticiones'}
                                              </span>
                                            </div>
                                          </div>
                                          <Controller
                                            control={control}
                                            name={`sections.${nestIndex}.exercises.${k}.type`}
                                            render={({ field: typeField }) => (
                                              <Input
                                                {...register(
                                                  // 'reps' and 'emom' both need a reps target here; only 'time'
                                                  // uses this cell for duration (emom's own duration lives in
                                                  // the dedicated window cell that replaces rest below).
                                                  typeField.value === 'time'
                                                    ? `sections.${nestIndex}.exercises.${k}.duration`
                                                    : `sections.${nestIndex}.exercises.${k}.reps`
                                                )}
                                                type="number"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                min={0}
                                                placeholder="0"
                                                className="mt-1.5 h-9 rounded-xl border-border/60 bg-background px-2 text-sm font-bold shadow-none sm:mt-1 sm:h-7 sm:px-2"
                                              />
                                            )}
                                          />
                                        </div>

                                        <div className="relative min-w-0 rounded-[18px] border border-border/60 bg-muted/20 p-2 sm:rounded-[20px] sm:p-1.5 lg:flex lg:h-full lg:flex-col lg:justify-between">
                                          {renderHint(
                                            selectedType === 'emom'
                                              ? 'Número total de minutos (vueltas) que se deben completar en este ejercicio EMOM.'
                                              : 'Número total de series o vueltas que se deben completar en este ejercicio.',
                                            'absolute right-2 top-1.5 sm:right-1.5 sm:top-1.5'
                                          )}
                                          <div className="flex items-center gap-1.5">
                                            <div className="rounded-xl bg-background/90 p-1.5 text-primary shadow-sm sm:p-1">
                                              <List className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
                                            </div>
                                            <div className={cn('flex items-center gap-1 pr-7 sm:pr-6', isCompactMobile && 'sr-only')}>
                                              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[9px]">
                                                {selectedType === 'emom' ? 'Minutos' : 'Series'}
                                              </span>
                                            </div>
                                          </div>
                                          <Input
                                            {...register(`sections.${nestIndex}.exercises.${k}.sets`)}
                                            placeholder="0"
                                            type="number"
                                            min={0}
                                            className="mt-1.5 h-9 rounded-xl border-border/60 bg-background px-2 text-sm font-bold shadow-none sm:mt-1 sm:h-7 sm:px-2"
                                          />
                                        </div>

                                        <div className="relative min-w-0 rounded-[18px] border border-border/60 bg-muted/20 p-2 sm:rounded-[20px] sm:p-1.5 lg:flex lg:h-full lg:flex-col lg:justify-between">
                                          {renderHint(
                                            selectedType === 'emom'
                                              ? 'Tiempo de cada ventana en segundos. Lo que sobre después de las repeticiones es el descanso; no hay un campo de rest aparte.'
                                              : 'Tiempo de recuperación entre una serie y la siguiente, expresado en segundos.',
                                            'absolute right-2 top-1.5 sm:right-1.5 sm:top-1.5'
                                          )}
                                          <div className="flex items-center gap-1.5">
                                            <div className="rounded-xl bg-background/90 p-1.5 text-primary shadow-sm sm:p-1">
                                              {selectedType === 'emom'
                                                ? <Timer className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
                                                : <BedDouble className="h-3 w-3 sm:h-2.5 sm:w-2.5" />}
                                            </div>
                                            <div className={cn('flex items-center gap-1 pr-7 sm:pr-6', isCompactMobile && 'sr-only')}>
                                              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[9px]">
                                                {selectedType === 'emom' ? 'Ventana' : isCompactMobile ? 'Descanso' : 'Rest'}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="relative mt-1.5 sm:mt-1">
                                            {selectedType === 'emom' ? (
                                              <>
                                                <input
                                                  type="hidden"
                                                  {...register(`sections.${nestIndex}.exercises.${k}.rest`)}
                                                  value={0}
                                                />
                                                <Input
                                                  {...register(`sections.${nestIndex}.exercises.${k}.duration`)}
                                                  placeholder="0"
                                                  type="number"
                                                  inputMode="numeric"
                                                  pattern="[0-9]*"
                                                  min={0}
                                                  className="h-9 rounded-xl border-border/60 bg-background pr-9 pl-2 text-sm font-bold shadow-none sm:h-7 sm:pr-8 sm:pl-2"
                                                />
                                                <span className={cn('absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground sm:right-2.5 sm:text-[10px]', isCompactMobile && 'hidden')}>
                                                  seg
                                                </span>
                                              </>
                                            ) : (
                                              <>
                                                <Input
                                                  {...register(`sections.${nestIndex}.exercises.${k}.rest`)}
                                                  placeholder="0"
                                                  type="number"
                                                  min={0}
                                                  className="h-9 rounded-xl border-border/60 bg-background pr-9 pl-2 text-sm font-bold shadow-none sm:h-7 sm:pr-8 sm:pl-2"
                                                />
                                                <span className={cn('absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground sm:right-2.5 sm:text-[10px]', isCompactMobile && 'hidden')}>
                                                  seg
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  )}

                                  <div className="rounded-[20px] border border-border/60 bg-background/75 p-3 shadow-sm sm:rounded-[28px] sm:p-4 md:p-5">
                                    <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{isCompactMobile ? 'Contexto' : 'Contexto del ejercicio'}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="rounded-2xl bg-muted p-2 text-muted-foreground">
                                          <Dna className="h-4 w-4" />
                                        </div>
                                        {renderHint('Añade dificultad, grupos musculares y equipamiento para documentar mejor el ejercicio y mejorar los filtros.')}
                                      </div>
                                    </div>

                                    <div className="grid gap-2.5 md:grid-cols-3 md:gap-3">
                                      <div className="space-y-2">
                                        <label className="pl-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                          {isCompactMobile ? 'Nivel' : 'Dificultad'}
                                        </label>
                                        <Controller
                                          control={control}
                                          name={`sections.${nestIndex}.exercises.${k}.difficulty`}
                                          render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value || 'beginner'}>
                                              <SelectTrigger className="h-9 rounded-2xl border-border/60 bg-muted/20 text-sm font-medium shadow-none sm:h-11">
                                                <SelectValue placeholder={isCompactMobile ? 'Nivel' : 'Seleccionar dificultad'} />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="beginner">Principiante</SelectItem>
                                                <SelectItem value="intermediate">Intermedio</SelectItem>
                                                <SelectItem value="advanced">Avanzado</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          )}
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <label className="pl-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                          {isCompactMobile ? 'Músculos' : 'Músculos objetivo'}
                                        </label>
                                        <Controller
                                          control={control}
                                          name={`sections.${nestIndex}.exercises.${k}.muscle_groups`}
                                          render={({ field }) => (
                                            <TagInput
                                              value={field.value || []}
                                              onChange={field.onChange}
                                              placeholder={isCompactMobile ? "Músculos..." : "Añadir músculos..."}
                                              variant="orange"
                                              compact={isCompactMobile}
                                            />
                                          )}
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <label className="pl-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                          {isCompactMobile ? 'Equip' : 'Equipment'}
                                        </label>
                                        <Controller
                                          control={control}
                                          name={`sections.${nestIndex}.exercises.${k}.equipment`}
                                          render={({ field }) => (
                                            <TagInput
                                              value={field.value || []}
                                              onChange={field.onChange}
                                              placeholder={isCompactMobile ? "Equip..." : "Add equipment..."}
                                              variant="blue"
                                              compact={isCompactMobile}
                                            />
                                          )}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <ActivityTutorialEditor
                                    setValue={setValue}
                                    watch={watch}
                                    nestIndex={nestIndex}
                                    exerciseIndex={k}
                                  />
                                </div>
                              </div>
                            </div>
                        </article>
                    )}
                </Draggable>
              )})}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <Button
            type="button" variant="ghost" size="sm"
            className="group h-10 w-full rounded-xl border border-dashed border-border/40 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary sm:h-12 sm:text-xs"
            onClick={() => append(createEmptyExercise())}
        >
            <span className="flex items-center gap-2 group-hover:gap-3 transition-all">
                <Plus className="h-3.5 w-3.5" /> 
                Agregar ejercicio
            </span>
        </Button>

        <ExercisesVault 
            onSelect={handleAddFromVault}
            trigger={
                <Button
                    type="button" variant="ghost" size="sm"
                    className="group h-10 w-full rounded-xl border border-dashed border-orange-500/20 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-500 sm:h-12 sm:text-xs"
                >
                    <span className="flex items-center gap-2 group-hover:gap-3 transition-all">
                        <Package className="h-3.5 w-3.5" /> 
                        Agregar desde vault
                    </span>
                </Button>
            } 
        />
      </div>
    </div>
  )
}

// --- Reusable Components ---

function TagInput({ 
    value = [], 
    onChange, 
    placeholder, 
    icon,
    variant = "default",
    compact = false,
}: { 
    value?: string[], 
    onChange: (val: string[]) => void, 
    placeholder?: string, 
    icon?: React.ReactNode,
    variant?: "default" | "orange" | "blue",
    compact?: boolean
}) {
    const [input, setInput] = useState('')

    const handleAdd = () => {
        if (input.trim()) {
            onChange([...value, input.trim()])
            setInput('')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAdd()
        }
    }

    const bgClass = variant === "orange" ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600" : 
                    variant === "blue" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : 
                    "bg-muted/50 text-foreground"

    return (
        <div className="space-y-2">
            <div className="relative">
                {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50">{icon}</div>}
                <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={cn(
                        "border-transparent focus:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all",
                        compact ? "h-8 text-xs" : "h-9 text-sm",
                        bgClass,
                        icon ? "pl-9 pr-9" : "pr-9"
                    )}
                />
                <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    className={cn(
                      "absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary",
                      compact ? "h-6 w-6" : "h-7 w-7"
                    )}
                    onClick={handleAdd}
                >
                    <Plus className="h-3 w-3" />
                </Button>
            </div>
            {value.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {value.map((tag, i) => (
                        <Badge 
                            key={i} 
                            variant="secondary" 
                            className={cn(
                                compact ? "gap-1 pr-1 text-[10px] font-medium" : "gap-1 pr-1 font-medium",
                                variant === "orange" ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : 
                                variant === "blue" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""
                            )}
                        >
                            {tag}
                            <button 
                                type="button" 
                                onClick={() => onChange(value.filter((_, idx) => idx !== i))} 
                                className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function CreateWorkoutPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <CreateWorkoutContent />
    </Suspense>
  )
}

function MediaInput({ value, onChange, placeholder, type = 'media', variant = 'default', compact = false }: { value?: string | null, onChange: (val: string) => void, placeholder?: string, type?: 'media' | 'audio' | 'thumbnail' | 'tutorial', variant?: 'default' | 'thumbnail', compact?: boolean }) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [isLibraryOpen, setIsLibraryOpen] = useState(false)
    
    // Audio State
    const [isRecordingAudio, setIsRecordingAudio] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    
    // Video State
    const [isRecordingVideo, setIsRecordingVideo] = useState(false)
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
    const [countdown, setCountdown] = useState<number | null>(null)
    
    // Preview Modal State
    const [isPlaying, setIsPlaying] = useState(false)
    
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const playbackVideoRef = React.useRef<HTMLVideoElement>(null)
    const playbackAudioRef = React.useRef<HTMLAudioElement>(null)

    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
    const chunksRef = React.useRef<Blob[]>([])
    const timerRef = React.useRef<NodeJS.Timeout | null>(null)
    
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            // Append type hint to URL hash so we can distinguish blob types
            const type = file.type.split('/')[0] // 'image', 'video', 'audio'
            onChange(`${url}#${type}`)
        }
    }

    // --- AUDIO RECORDING ---
    const startAudioRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            mediaRecorderRef.current = recorder
            chunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                const url = URL.createObjectURL(blob)
                onChange(`${url}#audio`)
                stream.getTracks().forEach(track => track.stop())
                if (timerRef.current) clearInterval(timerRef.current)
                setRecordingTime(0)
            }

            recorder.start()
            setIsRecordingAudio(true)
            setRecordingTime(0)
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } catch (err) {
            console.error("Error accessing microphone:", err)
            toast.error('No pudimos acceder al micrófono', {
              description: 'Revisa los permisos del navegador y vuelve a intentarlo.',
            })
        }
    }

    const stopAudioRecording = () => {
        if (mediaRecorderRef.current && isRecordingAudio) {
            mediaRecorderRef.current.stop()
            setIsRecordingAudio(false)
            if (timerRef.current) clearInterval(timerRef.current)
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
                if (playbackAudioRef.current) playbackAudioRef.current.play().catch(() => {})
            }, 100)
            return () => clearTimeout(timeout)
        }
    }, [isPlaying])

    const Icon = type === 'audio' ? Music : ImageIcon
    const isThumbnailInput = type === 'thumbnail'
    const fileAccept = type === 'audio'
      ? 'audio/*'
      : isThumbnailInput || type === 'media'
        ? 'image/*'
        : 'image/*,video/*,audio/*'
    const libraryMediaType = type === 'audio' ? 'audio' : type === 'tutorial' ? 'all' : 'image'

    if (variant === 'thumbnail') {
        const isVideo = !isThumbnailInput && (value?.match(/\.(mp4|webm|mov)$/i) || value?.includes('#video') || (value?.startsWith('blob:') && !value?.includes('#image') && !value?.includes('#audio')))
        const isAudio = !isThumbnailInput && (type === 'audio' || value?.match(/\.(mp3|wav|ogg)$/i) || value?.includes('#audio'))
        
        return (
            <div className="w-full h-full relative group bg-muted/20">
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

                {/* --- AUDIO RECORDING OVERLAY --- */}
                {isRecordingAudio && (
                    <div className="absolute inset-0 z-50 bg-red-500/90 flex flex-col items-center justify-center text-white animate-in fade-in duration-200">
                        <div className="w-3 h-3 rounded-full bg-white animate-pulse mb-2" />
                        <span className="text-xs font-mono font-bold mb-3">{new Date(recordingTime * 1000).toISOString().slice(14, 19)}</span>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            size="icon"
                            className="h-16 w-16 rounded-full hover:scale-110 transition-transform shadow-xl border-4 border-white/10"
                            onClick={(e) => { e.stopPropagation(); stopAudioRecording() }}
                        >
                            <Square className="w-6 h-6 text-red-500 fill-current" />
                        </Button>
                    </div>
                )}
                {value ? (
                    isPlaying ? (
                        <div className="w-full h-full relative bg-black flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            {isVideo ? (
                                <video ref={playbackVideoRef} src={value} className="w-full h-full object-contain" controls autoPlay onEnded={() => setIsPlaying(false)} />
                            ) : isAudio ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-2 p-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg animate-pulse">
                                        <Music className="h-6 w-6 text-white" />
                                    </div>
                                    <audio ref={playbackAudioRef} src={value} controls autoPlay className="w-full h-8" onEnded={() => setIsPlaying(false)} />
                                </div>
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
                            ) : isAudio ? (
                                 <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-600/20">
                                     <Music className="h-8 w-8 text-indigo-500" />
                                 </div>
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
                                {isVideo ? 'Vídeo' : isAudio ? 'Audio' : 'Imagen'}
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
                            
                            {!isThumbnailInput && (
                              <button 
                                  type="button"
                                  className="flex min-h-[38px] items-center justify-center gap-2 rounded-xl border border-border/40 bg-background/60 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-red-500"
                                  onClick={() => startAudioRecording()}
                                  title="Grabar audio"
                              >
                                   <Mic className="h-4 w-4 opacity-80" />
                                   <span className="text-[9px] font-bold uppercase">Mic</span>
                              </button>
                            )}
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
                            
                            {!isThumbnailInput && (
                              <button 
                                  type="button"
                                  className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-black/5 transition-colors text-muted-foreground hover:text-red-500"
                                  onClick={() => startAudioRecording()}
                                  title="Grabar audio"
                              >
                                   <Mic className="h-5 w-5 opacity-70" />
                                   <span className="text-[8px] font-bold uppercase">Mic</span>
                              </button>
                            )}
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
        <div className="flex gap-2 items-center group/media">
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
