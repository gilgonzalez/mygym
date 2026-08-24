'use client'

import React, { useState, Suspense } from 'react'
import { toast } from 'sonner'

import { useMutation, useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Trash2, GripVertical, Save,  ArrowLeft, Eye, Smartphone, Monitor, Mic, Dna, Activity, Repeat, RotateCw, Globe, Lock, FileText, Sparkles, Loader2, Timer, Zap, Users, Trophy, Infinity as InfinityIcon } from 'lucide-react'
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
import { PreviewWorkout } from '../components/PreviewWorkout'
import { calcWorkoutXP, computeWorkoutStats } from '@mygym/shared'
import { WorkoutTagSelector } from '@/components/ui/workout-tag-selector'
import { generateWorkoutAction } from '@/app/actions/workout/generate-by-ai'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { MediaInput } from '../components/MediaInput'
import { ExercisesFieldArray } from '../components/ExercisesFieldArray'
import { PremiumFeatureDialog } from '@/components/premium/PremiumFeatureDialog'
import { workoutSchema, type WorkoutFormValues, type WorkoutFormSection, type WorkoutFormExercise } from './schema'
import {
  createEmptyExercise,
  ensureUploadedUrl,
  inferMediaType,
  isPersistedExerciseId,
  normalizeMediaUrl,
  sanitizeTutorial,
  summarizeFormErrors,
} from './formHelpers'

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
                    weight_kg: e.weight_kg ?? undefined,
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
                            weight_kg: e.weight_kg ?? null,
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

  // Único punto de reorder para ejercicios: lee tanto origen como destino
  // (antes solo se leía el origen, así que soltar en otra sección reinsertaba
  // en la sección de origen en el índice equivocado) y escribe todo el árbol
  // `sections` de una vez. Reordenar dentro de la misma sección es el caso
  // degenerado de mover entre secciones (misma sección de origen y destino),
  // no necesita rama aparte.
  const moveExerciseAcrossSections = (
    sourceSectionIndex: number,
    sourceIndex: number,
    destSectionIndex: number,
    destIndex: number
  ) => {
    const sections = getValues('sections').map((section) => ({
      ...section,
      exercises: [...section.exercises],
    }))
    const sourceExercises = sections[sourceSectionIndex]?.exercises
    if (!sourceExercises) return

    const [movedExercise] = sourceExercises.splice(sourceIndex, 1)
    if (!movedExercise) return

    const destExercises = sections[destSectionIndex]?.exercises
    if (!destExercises) return

    destExercises.splice(destIndex, 0, movedExercise)
    setValue('sections', sections, { shouldDirty: true })
  }

  const appendExerciseToSection = (sectionIndex: number, exercise: WorkoutFormExercise) => {
    const sections = getValues('sections').map((section, i) =>
      i === sectionIndex ? { ...section, exercises: [...section.exercises, exercise] } : section
    )
    setValue('sections', sections, { shouldDirty: true })
  }

  const removeExerciseFromSection = (sectionIndex: number, exerciseIndex: number) => {
    const sections = getValues('sections').map((section, i) =>
      i === sectionIndex ? { ...section, exercises: section.exercises.filter((_, ei) => ei !== exerciseIndex) } : section
    )
    setValue('sections', sections, { shouldDirty: true })
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    if (result.type === 'SECTION') {
      moveSection(result.source.index, result.destination.index)
    } else if (result.type === 'EXERCISE') {
        const sourceSectionIndex = parseInt(result.source.droppableId.split('-')[1])
        const destSectionIndex = parseInt(result.destination.droppableId.split('-')[1])
        moveExerciseAcrossSections(sourceSectionIndex, result.source.index, destSectionIndex, result.destination.index)
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
                                exercises={formValues.sections?.[index]?.exercises || []}
                                onAppendExercise={(exercise) => appendExerciseToSection(index, exercise)}
                                onRemoveExercise={(exerciseIndex) => removeExerciseFromSection(index, exerciseIndex)}
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

