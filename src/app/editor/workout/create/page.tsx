'use client'

import React, { useState, Suspense } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Trash2, GripVertical, Save,  ArrowLeft, Eye, Play, Smartphone, Monitor, Image as ImageIcon,  Music, X, Upload, Mic, Square, Camera, Circle, Dna, Activity, Zap, Repeat, List, RotateCw, Library, Package, Globe, Lock, FileText, Sparkles, Loader2, Info } from 'lucide-react'
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

import { Button } from '@/components/Button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/form/TextArea'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

import { Controller, Resolver, useFieldArray, useForm } from 'react-hook-form'
import { createWorkoutAction, WorkoutInput } from '@/app/actions/workout/create'
import { getWorkoutById } from '@/app/actions/workout/get'
import { updateWorkoutAction } from '@/app/actions/workout/update'
import { uploadFile } from '@/services/uploadFile'
import { MediaSelectionDialog } from '../components/MediaSelectionDialog'
import { PreviewWorkout } from '../components/PreviewWorkout'
import { TAG_STATS_WEIGHTS, StatType } from '@/constants/tag-stats'
import { WorkoutTag } from '@/constants/workout-tags'
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
  title: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
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
  name: z.string().min(1, "Required"),
  type: z.enum(['reps', 'time']).default('reps'),
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
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  link_id: z.string().optional(),
  tutorial: tutorialSchema.optional().nullable(),
})

const sectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Required"),
  orderType: z.enum(['linear', 'single']).default('single'),
  exercises: z.array(exerciseSchema),
})

const workoutSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title required"),
  description: z.string().optional(),
  cover: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  visibility: z.enum(['draft', 'public', 'private']).default('private'),
  audio: z.array(z.string()).optional(),
  sections: z.array(sectionSchema),
})

type WorkoutFormValues = z.infer<typeof workoutSchema>
type WorkoutFormSection = WorkoutFormValues['sections'][number]
type WorkoutFormExercise = WorkoutFormSection['exercises'][number]

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
    return hasTitle || hasDescription
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
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  
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
        alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.")
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

  const { isLoading: isLoadingWorkout, data: loadedWorkout } = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: async () => {
      if (!workoutId) return null
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout cargando el workout')), 20000)
      )
      const fetch = (async () => {
        const res = await getWorkoutById(workoutId)
        if (!res.success || !res.data) throw new Error(res.error || 'Failed to fetch workout')
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
            sections: w.sections.map((s: any) => ({
                id: s.id,
                name: s.name,
                orderType: (s.type as any) || 'single',
                exercises: s.exercises.map((e: any) => ({
                    id: e.id,
                    db_id: e.id,
                    name: e.name,
                    type: (e.type as any) || 'reps',
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
    refetchOnWindowFocus: false
  })

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutSchema) as unknown as Resolver<WorkoutFormValues>,
    defaultValues: {
      title: '',
      description: '',
      cover: '',
      visibility: 'private',
      audio: [],
      sections: [
        {
          id: 'section-1',
          name: 'Warm Up',
          orderType: 'linear',
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


  const { mutate: createWorkout } = useMutation({
    mutationFn: async (data: WorkoutFormValues) => {
        // Timeout safeguard: 30 seconds
        const timeout = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Request timed out. Please check your connection and try again.")), 30000)
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
            
            setUploadStatus('Preparing uploads...');

            // 1. Upload Media First (Client-side)
            // Upload Cover
            let coverUrl = normalizeMediaUrl(data.cover)
            if (data.cover?.startsWith('blob:')) {
                setUploadStatus('Uploading cover image...')
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
                        updateProgress('Audio track uploaded')
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
                        updateProgress(`Tutorial uploaded: ${exercise.name}`)
                    }
                    if (finalTutorial?.media_url) {
                        finalTutorial = {
                            ...finalTutorial,
                            media_url: ensureUploadedUrl(finalTutorial.media_url, `El recurso del tutorial de "${exercise.name}"`) || null,
                        }
                    }
                    return { 
                        ...exercise, 
                        thumbnail_url: finalThumbnailUrl,
                        thumbnail_media_id: finalThumbnailMediaId,
                        filename: finalFilename,
                        bucket_path: finalBucketPath,
                        tutorial: finalTutorial,
                    }
                }))
                return { ...section, exercises: exercisesWithMedia }
            }))

            setUploadStatus('Finalizing workout...')

            // Calculate estimated time (in seconds)
            const estimatedTime = data.sections.reduce((total: number, section: WorkoutFormSection) => {
                return total + section.exercises.reduce((secTotal: number, ex: WorkoutFormExercise) => {
                    const sets = ex.sets || 1
                    const rest = ex.rest || 0
                    const duration = ex.duration || 0
                    const reps = ex.reps || 0
                    
                    // Time for execution
                    let executionTime = 0
                    if (ex.type === 'time') {
                        executionTime = duration * sets
                    } else {
                        // Estimate 3 seconds per rep
                        executionTime = reps * 3 * sets
                    }
                    
                    // Time for rest (between sets)
                    const restTime = rest * sets
                    
                    return secTotal + executionTime + restTime
                }, 0)
            }, 0)

            // Calculate EXP based on time and difficulty
            // Formula: 10 XP per minute * Difficulty Multiplier
            const difficultyMultiplierMap: Record<'beginner' | 'intermediate' | 'advanced', number> = {
                'beginner': 1,
                'intermediate': 1.5,
                'advanced': 2
            }
            const difficultyKey = (data.difficulty || 'beginner') as keyof typeof difficultyMultiplierMap
            const difficultyMultiplier = difficultyMultiplierMap[difficultyKey] || 1

            const expEarned = Math.round((estimatedTime / 60) * 10 * difficultyMultiplier)

            // Calculate Stats Distribution
            // 1. Sum up all weights from tags
            const rawStats: Record<StatType, number> = {
                strength: 0,
                cardio: 0,
                flexibility: 0,
                agility: 0,
                mind: 0
            }
            
            let totalWeight = 0
            const tags = data.tags || []
            
            tags.forEach((tag: string) => {
                const weights = TAG_STATS_WEIGHTS[tag as WorkoutTag]
                if (weights) {
                    Object.entries(weights).forEach(([stat, weight]) => {
                        rawStats[stat as StatType] += weight
                        totalWeight += weight
                    })
                }
            })

            // If no tags or no weights, default to balanced distribution
            if (totalWeight === 0) {
                 rawStats.strength = 1
                 rawStats.cardio = 1
                 rawStats.flexibility = 1
                 rawStats.agility = 1
                 rawStats.mind = 1
                 totalWeight = 5
            }

            // 2. Distribute Total EXP according to weights
            const finalStats: Record<string, number> = {}
            Object.entries(rawStats).forEach(([stat, weight]) => {
                if (weight > 0) {
                    finalStats[stat] = Math.round((weight / totalWeight) * expEarned)
                }
            })

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
                sections: sectionsWithMedia.map((s: WorkoutFormSection) => ({
                    id: s.id,
                    name: s.name,
                    orderType: s.orderType,
                    exercises: s.exercises.map((e: WorkoutFormExercise) => {
                        const sanitizedTutorial = sanitizeTutorial(e.tutorial)

                        return {
                            ...e,
                            id: e.db_id || undefined, // Use db_id if available (existing), else undefined (new)
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
                setUploadStatus('Updating workout...')
                result = await updateWorkoutAction(data.id, cleanData)
            } else {
                // Create new
                setUploadStatus('Creating workout...')
                result = await createWorkoutAction(cleanData)
            }

            if (!result || typeof result !== 'object' || !('success' in result)) {
                throw new Error('Invalid response while saving workout')
            }

            if (!result.success) throw new Error(result.error || 'Failed to save workout')
            
            updateProgress('Done!')
            return result
        }

        return Promise.race([processUpload(), timeout])
    },
    onSuccess: () => {
        setSubmitStatus('success')
        setSubmitMessage(workoutId ? 'Workout actualizado correctamente. Redirigiendo al feed...' : 'Workout guardado correctamente. Redirigiendo al feed...')
        reset()
        router.push('/')
    },
    onError: (error: Error) => {
        setSubmitStatus('error')
        console.error(error)
        setSubmitMessage(error.message || 'No pudimos guardar el workout. Revisa tu contenido y vuelve a intentarlo.')
        setIsSubmitting(false)
        setIsRetry(true)
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
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  const isWorkoutLoading = !!workoutId && isLoadingWorkout

  if (isLoading || isWorkoutLoading) {
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

    if (!aiPrompt.trim()) return
    
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
                exercises: s.exercises.map((e: any, eIdx: number): WorkoutFormExercise => ({
                    id: `ex-${Date.now()}-${idx}-${eIdx}`,
                    db_id: e.id || e.db_id,
                    name: e.name,
                    type: e.type === 'time' ? 'time' : 'reps',
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
        } else {
            alert(res.error || "No se pudo generar el workout")
        }
    } catch (err) {
        console.error(err)
        alert("Ocurrio un error al comunicarse con el asistente")
    } finally {
        setIsGenerating(false)
    }
  }

  const onSubmit = async (data: WorkoutFormValues) => {
    if (!user) {
        setSubmitStatus('error')
        setSubmitMessage('Debes iniciar sesion para guardar workouts.')
        return
    }
    
    // Cerrar el diálogo de metadatos al confirmar el guardado
    setIsMetaOpen(false)

    setUploadProgress(0)
    setUploadStatus('')
    setIsRetry(false)
    setIsSubmitting(true)
    setSubmitStatus('loading')
    setSubmitMessage(workoutId ? 'Actualizando workout y sincronizando media...' : 'Guardando workout y preparando archivos...')
    createWorkout(data)
  }

  const handleOpenAiAssistant = () => {
    if (!isPremiumUser) {
      setIsPremiumDialogOpen(true)
      return
    }

    setIsAiOpen(true)
  }

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b bg-background px-2.5 py-2 sm:px-4 md:px-6">
        <div className="flex flex-col gap-1.5 sm:gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
            <Link
              href="/"
              className="rounded-full border border-border/60 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </Link>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {builderLabel}
              </p>
              <h1 className="truncate text-[13px] font-semibold leading-none text-foreground sm:text-base">Workout Builder</h1>
              <p className="mt-0.5 text-[11px] leading-none text-muted-foreground sm:text-xs">
                {sectionFields.length} secciones · {totalExercises} ejercicios
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 sm:gap-2 lg:flex-row lg:items-center lg:justify-end lg:gap-2">
            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-auto justify-start gap-1.5 rounded-2xl border-indigo-200 bg-indigo-50/50 px-2.5 text-[10px] text-indigo-600 shadow-sm hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400 dark:hover:bg-indigo-950/50 sm:h-9 sm:gap-2 sm:rounded-full sm:px-3 sm:text-xs"
                onClick={handleOpenAiAssistant}
              >
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Asistente IA</span>
                {!isPremiumUser ? (
                  <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400 min-[420px]:inline-flex">
                    Premium
                  </span>
                ) : null}
                <span className="ml-auto flex items-center gap-1 border-l border-indigo-200 pl-1.5 dark:border-indigo-800 sm:ml-1 sm:pl-2">
                  <Mic className="h-3 w-3 opacity-70 sm:h-3.5 sm:w-3.5" />
                </span>
              </Button>

              {!isDesktopViewport && (
                <Button
                  variant={showPreview ? 'secondary' : 'outline'}
                  size="sm"
                  className="h-8 w-auto rounded-2xl px-2.5 text-[10px] font-semibold sm:h-9 sm:rounded-full sm:px-3 sm:text-xs"
                  onClick={() => {
                    setPreviewDevice('mobile')
                    setShowPreview(true)
                  }}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                  Preview
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
                className="h-8 w-auto shrink-0 rounded-2xl px-2.5 text-[10px] font-bold sm:h-9 sm:rounded-full sm:px-4 sm:text-xs md:px-5"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="mr-1.5 h-3.5 w-3.5 animate-spin sm:mr-2 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Guardando...</span>
                    <span className="sm:hidden">{uploadProgress}%</span>
                  </>
                ) : isRetry ? (
                  <>
                    <RotateCw className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Reintentar</span>
                    <span className="sm:hidden">Retry</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Detalles y guardar</span>
                    <span className="sm:hidden">Guardar</span>
                  </>
                )}
              </Button>
            </div>

            {(submitStatus !== 'idle' || isSubmitting) && (
              <div
                className={cn(
                  'rounded-2xl border px-2.5 py-1.5 text-[10px] sm:px-3 sm:text-xs lg:min-w-[260px] lg:max-w-[340px]',
                  submitStatus === 'error'
                    ? 'border-destructive/20 bg-destructive/10 text-destructive'
                    : submitStatus === 'success'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-primary/15 bg-primary/[0.04] text-muted-foreground'
                )}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <span className="min-w-0 truncate">{isSubmitting ? uploadStatus || 'Guardando...' : submitMessage}</span>
                  {isSubmitting ? <span className="shrink-0 font-semibold">{uploadProgress}%</span> : null}
                </div>
                {isSubmitting ? (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                ) : null}
              </div>
            )}
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Preview</p>
                  <p className="mt-1 text-xs font-semibold text-foreground">Abrir</p>
                </button>
              </div>
            </section>

            {(isSubmitting || submitStatus === 'error') && (
              <div
                className={cn(
                  'sticky top-3 z-20 rounded-2xl border px-3 py-2.5 shadow-sm backdrop-blur',
                  submitStatus === 'error'
                    ? 'border-destructive/20 bg-destructive/10'
                    : 'border-primary/15 bg-background/90'
                )}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {isSubmitting ? uploadStatus || 'Guardando workout...' : 'No pudimos completar el guardado'}
                    </p>
                    <p className="text-[11px] text-muted-foreground sm:text-xs">
                      {isSubmitting
                        ? submitMessage || 'No cierres esta pantalla mientras terminamos uploads y persistencia.'
                        : submitMessage || 'Revisa los datos y vuelve a intentarlo.'}
                    </p>
                  </div>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      {uploadProgress}%
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setSubmitStatus('idle')}>
                      Cerrar
                    </Button>
                  )}
                </div>
                {isSubmitting && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Sections (Step 1) */}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections" type="SECTION">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 sm:space-y-6">
                    {sectionFields.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="group overflow-hidden rounded-[22px] border border-border/50 bg-white shadow-xl shadow-black/5 backdrop-blur-sm animate-in slide-in-from-bottom-8 duration-700 fill-mode-backwards dark:bg-zinc-900/50 sm:rounded-[2rem]"
                            style={{ 
                                ...provided.draggableProps.style,
                                animationDelay: `${index * 100}ms` 
                            }}
                          >
                            <div className="flex items-start gap-2 border-b border-border/50 bg-gradient-to-r from-gray-50 to-white p-3 dark:from-zinc-900 dark:to-zinc-900/50 sm:items-center sm:gap-4 sm:p-6">
                              <div {...provided.dragHandleProps} className="cursor-grab rounded-xl p-1.5 text-muted-foreground/30 transition-colors hover:bg-black/5 hover:text-foreground sm:p-2">
                                <GripVertical className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <div className="flex flex-1 flex-col items-start gap-2 md:flex-row md:items-center md:gap-4">
                                <div className="flex-1">
                                    <Input 
                                        {...register(`sections.${index}.name` as const)} 
                                        placeholder="Nombre de la seccion" 
                                        className="h-auto w-full bg-transparent px-0 text-lg font-black tracking-tight shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/25 sm:text-2xl"
                                    />
                                    <input type="hidden" {...register(`sections.${index}.id` as const)} />
                                    {errors.sections?.[index]?.name && (
                                      <p className="text-red-500 text-xs font-medium mt-1">
                                        {errors.sections[index]?.name?.message}
                                      </p>
                                    )}
                                </div>
                                <Controller
                                    control={control}
                                    name={`sections.${index}.orderType` as const}
                                    render={({ field }) => (
                                <div className="flex flex-col gap-1 rounded-xl bg-muted/50 p-1 sm:rounded-lg">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button 
                                                type="button"
                                                onClick={() => field.onChange('single')}
                                                className={cn(
                                                    "flex w-full items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase transition-all sm:w-auto sm:justify-start sm:text-xs",
                                                    field.value === 'single' ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <List className="h-3.5 w-3.5" />
                                                Series seguidas
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-zinc-900 text-white border-white/10 text-xs">
                                            <p>Completa todas las series de un ejercicio antes de pasar al siguiente.</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button 
                                                type="button"
                                                onClick={() => field.onChange('linear')}
                                                className={cn(
                                                    "flex w-full items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase transition-all sm:w-auto sm:justify-start sm:text-xs",
                                                    field.value === 'linear' || !field.value ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <Repeat className="h-3.5 w-3.5" />
                                                Circuito
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-zinc-900 text-white border-white/10 text-xs">
                                            <p>Haz una serie de cada ejercicio y luego repite la vuelta completa.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                    )}
                                />
                              </div>
                              <Button 
                                type="button" variant="ghost" size="icon" 
                                onClick={() => removeSection(index)}
                                className="h-9 w-9 rounded-full text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                            <div className="p-3 sm:p-5 md:p-8">
                              <ExercisesFieldArray 
                                nestIndex={index} 
                                control={control} 
                                register={register} 
                                setValue={setValue}
                                watch={watch}
                                errors={errors}
                                isCompactMobile={isCompactMobileViewport}
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
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
                        onClick={() => appendSection({ id: `sec-${Date.now()}`, name: '', orderType: 'linear', exercises: [] })}
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
              {errors.title && <p className="text-red-500 text-xs font-medium">{errors.title.message}</p>}
              <Textarea 
                {...register('description')} 
                placeholder="Descripcion breve" 
                className="min-h-[76px] resize-none rounded-[20px] border-border/60 bg-background text-sm font-medium text-foreground shadow-none focus-visible:ring-0"
              />
              {errors.description && <p className="text-red-500 text-xs font-medium">{errors.description.message}</p>}
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
                            <span className="ml-auto text-xs text-muted-foreground">Solo tu</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="private" className="rounded-lg my-1 cursor-pointer focus:bg-primary/5 focus:text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-rose-500" />
                            <span>Privado</span>
                            <span className="ml-auto text-xs text-muted-foreground">Solo seguidores</span>
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
            <Button type="button" onClick={handleSubmit(onSubmit)} className="gap-2" disabled={isSubmitting}>
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
        description="La generacion de rutinas con IA esta disponible solo para usuarios premium. Actualiza tu plan para desbloquear prompts, voz y creacion asistida."
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
                    <span className="text-xs text-muted-foreground/80 italic">e.g., "Leg day focused on quads, advanced level" or "30 min HIIT cardio without equipment"</span>
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
                    title={isListening ? "Stop Listening" : "Start Voice Input"}
                >
                    <Mic className={cn("h-4 w-4", isListening ? "animate-bounce" : "")} />
                </Button>
            </div>
            <DialogFooter>
                <Button onClick={handleAiGenerate} disabled={isGenerating || !aiPrompt.trim()} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Magic
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
                Mobile
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
                Desktop
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


function ExercisesFieldArray({ nestIndex, control, register, setValue, watch, errors, isCompactMobile = false }: { nestIndex: number, control: any, register: any, setValue: any, watch: any, errors: any, isCompactMobile?: boolean }) {
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
              const selectedType = watch(`${exercisePath}.type`) === 'time' ? 'time' : 'reps'
              const hasTutorial = Boolean(watch(`${exercisePath}.tutorial`))

              return (
                <Draggable key={item.id} draggableId={item.id} index={k}>
                    {(provided) => (
                        <article
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="group relative overflow-hidden rounded-[20px] border border-border/60 bg-gradient-to-br from-white via-white to-muted/20 p-2.5 shadow-sm transition-all hover:shadow-lg dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/80 sm:p-4 md:rounded-[30px] md:p-6"
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                            
                            {/* Drag Handle */}
                            <div 
                                {...provided.dragHandleProps} 
                                className="absolute left-2 top-2.5 z-10 rounded-xl p-1.5 text-muted-foreground/30 transition-colors hover:bg-black/5 hover:text-foreground sm:left-3 sm:top-4 sm:p-2"
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

                            <div className="pl-3 pr-3 sm:pl-10 sm:pr-10">
                              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-3 sm:gap-4 sm:pb-5">
                                <div className="flex flex-wrap items-center gap-2 pl-7 sm:pl-0">
                                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-primary sm:px-3 sm:text-[10px]">
                                    Ejercicio {k + 1}
                                  </span>
                                  <span className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground sm:px-3 sm:text-[10px]">
                                    {selectedType === 'time' ? 'Por tiempo' : 'Por repeticiones'}
                                  </span>
                                  {hasTutorial && (
                                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400 sm:px-3 sm:text-[10px]">
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
                                    {errors.sections?.[nestIndex]?.exercises?.[k]?.name && (
                                      <p className="mt-2 text-xs font-medium text-red-500">
                                        {errors.sections[nestIndex].exercises[k].name.message}
                                      </p>
                                    )}

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
                                          Thumbnail
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
                                  <div className="rounded-[20px] border border-border/60 bg-background/75 p-2.5 shadow-sm sm:rounded-[28px] sm:p-3 lg:p-3.5">
                                    <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{isCompactMobile ? 'Formato' : 'Cómo se realiza'}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                                          <Activity className="h-4 w-4" />
                                        </div>
                                        {renderHint('Define si el ejercicio se mide por repeticiones o por tiempo, y configura sus valores principales desde este bloque.')}
                                      </div>
                                    </div>

                                    <div className="mt-2 grid gap-1 sm:mt-2.5 sm:gap-1.5 lg:grid-cols-[0.68fr_repeat(3,minmax(0,1fr))] lg:items-stretch">
                                      <Controller
                                        control={control}
                                        name={`sections.${nestIndex}.exercises.${k}.type`}
                                        render={({ field }) => (
                                          <div className="grid grid-cols-2 gap-1 sm:gap-1.5 lg:grid-cols-1 lg:grid-rows-2 lg:self-stretch">
                                            <button
                                              type="button"
                                              onClick={() => field.onChange('reps')}
                                              className={cn(
                                                'relative rounded-[16px] border p-1 text-left transition-all sm:rounded-[20px] sm:p-1.5 lg:flex lg:h-full lg:flex-col lg:justify-center',
                                                field.value === 'reps'
                                                  ? 'border-primary/40 bg-primary/[0.08] shadow-sm'
                                                  : 'border-border/60 bg-muted/20 hover:border-primary/20 hover:bg-background'
                                              )}
                                            >
                                              {renderHint('Mide el ejercicio por número de repeticiones en cada serie.', 'absolute right-1 top-1 sm:right-1.5 sm:top-1.5')}
                                              <div className="flex items-center gap-2">
                                                <div className="rounded-2xl bg-background/90 p-1 text-primary shadow-sm">
                                                  <List className="h-3 w-3" />
                                                </div>
                                                <div className="flex items-center gap-1 pr-6 sm:pr-7">
                                                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[10px]">
                                                    Reps
                                                  </span>
                                                </div>
                                              </div>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => field.onChange('time')}
                                              className={cn(
                                                'relative rounded-[16px] border p-1 text-left transition-all sm:rounded-[20px] sm:p-1.5 lg:flex lg:h-full lg:flex-col lg:justify-center',
                                                field.value === 'time'
                                                  ? 'border-primary/40 bg-primary/[0.08] shadow-sm'
                                                  : 'border-border/60 bg-muted/20 hover:border-primary/20 hover:bg-background'
                                              )}
                                            >
                                              {renderHint('Mide el ejercicio por duración en segundos para cada serie.', 'absolute right-1 top-1 sm:right-1.5 sm:top-1.5')}
                                              <div className="flex items-center gap-2">
                                                <div className="rounded-2xl bg-background/90 p-1 text-primary shadow-sm">
                                                  <Zap className="h-3 w-3" />
                                                </div>
                                                <div className="flex items-center gap-1 pr-6 sm:pr-7">
                                                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[10px]">
                                                    Time
                                                  </span>
                                                </div>
                                              </div>
                                            </button>
                                          </div>
                                        )}
                                      />

                                      <div className="relative rounded-[16px] border border-border/60 bg-muted/20 p-1 sm:rounded-[20px] sm:p-1.5 lg:flex lg:flex-col lg:justify-between">
                                        {renderHint(selectedType === 'time' ? 'Indica los segundos que dura cada serie del ejercicio.' : 'Indica cuántas repeticiones debe completar el usuario en cada serie.', 'absolute right-1 top-1 sm:right-1.5 sm:top-1.5')}
                                        <div className="flex items-center gap-2">
                                          <div className="rounded-2xl bg-background/90 p-1 text-primary shadow-sm">
                                            {selectedType === 'time' ? <Zap className="h-3 w-3" /> : <List className="h-3 w-3" />}
                                          </div>
                                          <div className="flex items-center gap-1 pr-6 sm:pr-7">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[10px]">
                                              {selectedType === 'time' ? 'Seconds' : 'Reps'}
                                            </span>
                                          </div>
                                        </div>
                                        <Controller
                                          control={control}
                                          name={`sections.${nestIndex}.exercises.${k}.type`}
                                          render={({ field: typeField }) => (
                                            <Input
                                              {...register(
                                                typeField.value === 'reps'
                                                  ? `sections.${nestIndex}.exercises.${k}.reps`
                                                  : `sections.${nestIndex}.exercises.${k}.duration`
                                              )}
                                              type="number"
                                              inputMode="numeric"
                                              pattern="[0-9]*"
                                              min={0}
                                              placeholder="0"
                                              className="mt-1 h-7 rounded-2xl border-border/60 bg-background px-2.5 text-[13px] font-bold shadow-none sm:mt-1.5 sm:h-8 sm:text-sm"
                                            />
                                          )}
                                        />
                                      </div>

                                      <div className="relative rounded-[16px] border border-border/60 bg-muted/20 p-1 sm:rounded-[20px] sm:p-1.5 lg:flex lg:flex-col lg:justify-between">
                                        {renderHint('Número total de series o vueltas que se deben completar en este ejercicio.', 'absolute right-1 top-1 sm:right-1.5 sm:top-1.5')}
                                        <div className="flex items-center gap-2">
                                          <div className="rounded-2xl bg-background/90 p-1 text-primary shadow-sm">
                                            <Repeat className="h-3 w-3" />
                                          </div>
                                          <div className="flex items-center gap-1 pr-6 sm:pr-7">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[10px]">
                                              Sets
                                            </span>
                                          </div>
                                        </div>
                                        <Input
                                          {...register(`sections.${nestIndex}.exercises.${k}.sets`)}
                                          placeholder="0"
                                          type="number"
                                          min={0}
                                          className="mt-1 h-7 rounded-2xl border-border/60 bg-background px-2.5 text-[13px] font-bold shadow-none sm:mt-1.5 sm:h-8 sm:text-sm"
                                        />
                                      </div>

                                      <div className="relative col-span-2 rounded-[16px] border border-border/60 bg-muted/20 p-1 sm:col-span-1 sm:rounded-[20px] sm:p-1.5 lg:col-span-1 lg:flex lg:flex-col lg:justify-between">
                                        {renderHint('Tiempo de recuperación entre una serie y la siguiente, expresado en segundos.', 'absolute right-1 top-1 sm:right-1.5 sm:top-1.5')}
                                        <div className="flex items-center gap-2">
                                          <div className="rounded-2xl bg-background/90 p-1 text-primary shadow-sm">
                                            <RotateCw className="h-3 w-3" />
                                          </div>
                                          <div className="flex items-center gap-1 pr-6 sm:pr-7">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[10px]">
                                              Rest
                                            </span>
                                          </div>
                                        </div>
                                        <div className="relative mt-1 sm:mt-1.5">
                                          <Input
                                            {...register(`sections.${nestIndex}.exercises.${k}.rest`)}
                                            placeholder="0"
                                            type="number"
                                            min={0}
                                            className="h-7 rounded-2xl border-border/60 bg-background pr-8 text-[13px] font-bold shadow-none sm:h-8 sm:pr-9 sm:text-sm"
                                          />
                                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground sm:right-3 sm:text-[11px]">
                                            seg
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

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
                                          {isCompactMobile ? 'Level' : 'Difficulty'}
                                        </label>
                                        <Controller
                                          control={control}
                                          name={`sections.${nestIndex}.exercises.${k}.difficulty`}
                                          render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value || 'beginner'}>
                                              <SelectTrigger className="h-9 rounded-2xl border-border/60 bg-muted/20 text-sm font-medium shadow-none sm:h-11">
                                                <SelectValue placeholder={isCompactMobile ? 'Nivel' : 'Select difficulty'} />
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
                                          {isCompactMobile ? 'Muscles' : 'Target Muscles'}
                                        </label>
                                        <Controller
                                          control={control}
                                          name={`sections.${nestIndex}.exercises.${k}.muscle_groups`}
                                          render={({ field }) => (
                                            <TagInput
                                              value={field.value || []}
                                              onChange={field.onChange}
                                              placeholder={isCompactMobile ? "Muscles..." : "Add muscles..."}
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
            alert("Could not access microphone. Please check permissions.")
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
            alert("Could not access camera. Please check permissions.")
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
                if (playbackVideoRef.current) playbackVideoRef.current.play().catch(e => console.log("Video play failed", e))
                if (playbackAudioRef.current) playbackAudioRef.current.play().catch(e => console.log("Audio play failed", e))
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
                                <div className="text-[150px] font-black text-white animate-pulse drop-shadow-2xl">
                                    {countdown}
                                </div>
                            ) : mediaRecorderRef.current?.state === 'recording' ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-2 bg-red-600/80 px-4 py-2 rounded-full backdrop-blur-md">
                                        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                        <span className="font-mono text-white font-bold text-xl">
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
                                        Cancel
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
                                    <img src={value} alt="Preview" className="w-full h-full object-contain" />
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
                                 <img src={value} alt="Preview" className="w-full h-full object-cover" />
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
                                {isVideo ? 'Video' : isAudio ? 'Audio' : 'Image'}
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
                                title="Select from Library"
                            >
                                 <Library className="h-4 w-4 opacity-80" />
                                 <span className="text-[9px] font-bold uppercase">Lib</span>
                            </button>

                            {!isThumbnailInput && (
                              <button 
                                  type="button"
                                  className="flex min-h-[38px] items-center justify-center gap-2 rounded-xl border border-border/40 bg-background/60 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-blue-500"
                                  onClick={() => openCamera()}
                                  title="Record Video"
                              >
                                   <Camera className="h-4 w-4 opacity-80" />
                                   <span className="text-[9px] font-bold uppercase">Cam</span>
                              </button>
                            )}
                            
                            <button 
                                type="button"
                                className="flex min-h-[38px] items-center justify-center gap-2 rounded-xl border border-border/40 bg-background/60 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                                onClick={() => fileInputRef.current?.click()}
                                title="Upload File"
                            >
                                 <Upload className="h-4 w-4 opacity-80" />
                                 <span className="text-[9px] font-bold uppercase">Up</span>
                            </button>
                            
                            {!isThumbnailInput && (
                              <button 
                                  type="button"
                                  className="flex min-h-[38px] items-center justify-center gap-2 rounded-xl border border-border/40 bg-background/60 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-red-500"
                                  onClick={() => startAudioRecording()}
                                  title="Record Audio"
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
                                title="Select from Library"
                            >
                                 <Library className="h-5 w-5 opacity-70" />
                                 <span className="text-[8px] font-bold uppercase">Lib</span>
                            </button>

                            {!isThumbnailInput && (
                              <button 
                                  type="button"
                                  className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-black/5 transition-colors text-muted-foreground hover:text-blue-500"
                                  onClick={() => openCamera()}
                                  title="Record Video"
                              >
                                   <Camera className="h-5 w-5 opacity-70" />
                                   <span className="text-[8px] font-bold uppercase">Cam</span>
                              </button>
                            )}
                            
                            <button 
                                type="button"
                                className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-black/5 transition-colors text-muted-foreground hover:text-foreground"
                                onClick={() => fileInputRef.current?.click()}
                                title="Upload File"
                            >
                                 <Upload className="h-5 w-5 opacity-70" />
                                 <span className="text-[8px] font-bold uppercase">Up</span>
                            </button>
                            
                            {!isThumbnailInput && (
                              <button 
                                  type="button"
                                  className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-black/5 transition-colors text-muted-foreground hover:text-red-500"
                                  onClick={() => startAudioRecording()}
                                  title="Record Audio"
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
                    placeholder={placeholder || "Media URL or File"} 
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
