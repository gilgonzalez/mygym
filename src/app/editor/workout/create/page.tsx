'use client'

import React, { useState, Suspense } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Trash2, GripVertical, Save,  ArrowLeft, Eye, Play, Smartphone, Monitor, Tag, Image as ImageIcon,  Music, X, Upload, Mic, Square, Camera, Circle, Dna, Activity, Zap, Repeat, List, RotateCw, Library, Package, Globe, Lock, FileText } from 'lucide-react'
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

// --- Schema Definition ---
const exerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Required"),
  type: z.enum(['reps', 'time']).default('reps'),
  reps: z.coerce.number().optional(),
  sets: z.coerce.number().optional(),
  duration: z.coerce.number().optional(),
  rest: z.coerce.number().optional(),
  media_url: z.string().optional().nullable(),
  media_id: z.string().optional().nullable(),
  filename: z.string().optional().nullable(),
  bucket_path: z.string().optional().nullable(),
  description: z.string().optional(),
  muscle_groups: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
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

function CreateWorkoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workoutId = searchParams.get('id')
  
  const { user, isLoading } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRetry, setIsRetry] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const { isLoading: isLoadingWorkout, data: loadedWorkout } = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: async () => {
      if (!workoutId) return null
      const res = await getWorkoutById(workoutId)
      if (!res.success || !res.data) throw new Error(res.error)
      
      const w = res.data
      // Map DB response to Form Schema
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
                  name: e.name,
                  type: (e.type as any) || 'reps',
                  reps: e.reps || 0,
                  sets: e.sets || 0,
                  duration: e.duration || 0,
                  rest: e.rest || 0,
                  media_url: e.media_url,
                  media_id: e.media_id,
                  filename: e.filename,
                  bucket_path: e.bucket_path,
                  description: e.description || '',
                  muscle_groups: e.muscle_group || [],
                  equipment: e.equipment || [],
                  difficulty: e.difficulty || 'beginner'
              }))
          }))
      } as WorkoutFormValues
    },
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
          exercises: [{ id: 'ex-1', name: '', sets: 3, reps: 10, rest: 60, type: 'reps', duration: 0, description: '', difficulty: 'beginner' }]
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


  const { mutate: createWorkout, isPending: isCreating } = useMutation({
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
            (data.audio || []).forEach(url => { if (url.startsWith('blob:')) totalOps++; });
            data.sections.forEach(s => s.exercises.forEach(e => {
                if (e.media_url?.startsWith('blob:')) totalOps++;
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
            let coverUrl = data.cover
            if (data.cover?.startsWith('blob:')) {
                try {
                    setUploadStatus('Uploading cover image...')
                    const res = await uploadFile(data.cover)
                    if (res) {
                        coverUrl = res.url
                    }
                    updateProgress('Cover uploaded')
                } catch (error) {
                    console.error('Failed to upload cover:', error)
                    // We continue without the cover or handle error gracefully
                    // For now, logging error is safer than crashing the whole process
                    // But if it's critical, we should throw. User asked for try-catch so probably wants to prevent crash.
                }
            }
            
            // Upload Audio
            const audioUrls = await Promise.all(
                (data.audio || []).map(async (url) => {
                    if (url.startsWith('blob:')) {
                        const res = await uploadFile(url)
                        updateProgress('Audio track uploaded')
                        return res?.url
                    }
                    return url
                })
            )
            const validAudioUrls = audioUrls.filter((url): url is string => !!url)

            // Upload Exercise Media
            const sectionsWithMedia = await Promise.all(data.sections.map(async (section) => {
                const exercisesWithMedia = await Promise.all(section.exercises.map(async (exercise) => {
                    let finalMediaUrl = exercise.media_url
                    let finalMediaId = exercise.media_id
                    let finalFilename = exercise.filename
                    let finalBucketPath = exercise.bucket_path

                    if (exercise.media_url && exercise.media_url.startsWith('blob:')) {
                        // setUploadStatus(`Uploading media: ${exercise.name}...`)
                        const res = await uploadFile(exercise.media_url)
                        if (res) {
                            finalMediaUrl = res.url
                            finalMediaId = res.id
                            finalFilename = res.filename
                            finalBucketPath = res.bucket_path
                        }
                        updateProgress(`Media uploaded: ${exercise.name}`)
                    }
                    return { 
                        ...exercise, 
                        media_url: finalMediaUrl,
                        media_id: finalMediaId,
                        filename: finalFilename,
                        bucket_path: finalBucketPath
                    }
                }))
                return { ...section, exercises: exercisesWithMedia }
            }))

            setUploadStatus('Finalizing workout...')

            // Calculate estimated time (in seconds)
            const estimatedTime = data.sections.reduce((total, section) => {
                return total + section.exercises.reduce((secTotal, ex) => {
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
            const difficultyMultiplier = {
                'beginner': 1,
                'intermediate': 1.5,
                'advanced': 2
            }[data.difficulty || 'beginner'] || 1

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
            
            tags.forEach(tag => {
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
                sections: sectionsWithMedia.map(s => ({
                    name: s.name,
                    orderType: s.orderType,
                    exercises: s.exercises.map(e => ({
                        ...e,
                        media_url: e.media_url,
                        media_id: e.media_id,
                        filename: e.filename,
                        bucket_path: e.bucket_path
                    }))
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
            
            if (!result.success) throw new Error(result.error)
            
            updateProgress('Done!')
            return result
        }

        return Promise.race([processUpload(), timeout])
    },
    onSuccess: () => {
        setSubmitStatus('success')
        reset()
        router.push('/')
    },
    onError: (error) => {
        setSubmitStatus('idle')
        console.error(error)
        alert("Failed to create workout: " + error.message)
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

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
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

  const onSubmit = async (data: WorkoutFormValues) => {
    if (!user) {
        alert("Please sign in to save workouts")
        return
    }
    
    setUploadProgress(0)
    setUploadStatus('')
    setIsRetry(false)
    setIsSubmitting(true)
    setSubmitStatus('loading')
    createWorkout(data)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b flex items-center justify-between px-6 bg-background shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-6 w-px bg-border mx-2" />
          <h1 className="font-semibold text-lg">Workout Builder</h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <Button 
            variant={showPreview ? "secondary" : "ghost"}
            size="icon"
            className="rounded-full h-9 w-9"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? 'Hide Preview' : 'Show Preview'}
          >
            <Eye className="h-4 w-4" /> 
          </Button>

          {isSubmitting && (
             <div className="hidden sm:flex flex-col items-end mr-2 min-w-[100px] md:min-w-[120px]">
                 <div className="flex justify-between w-full text-[10px] text-muted-foreground mb-1">
                    <span>{uploadStatus || 'Saving...'}</span>
                    <span>{uploadProgress}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all duration-300 ease-out" 
                        style={{ width: `${uploadProgress}%` }} 
                    />
                 </div>
             </div>
          )}

          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} size="sm" className="gap-2 rounded-full px-4 md:px-6 font-bold">
            {isSubmitting ? (
                <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span className="hidden md:inline">Saving...</span>
                </>
            ) : isRetry ? (
                <>
                    <RotateCw className="h-4 w-4" />
                    <span className="hidden md:inline">Retry</span>
                </>
            ) : (
                <>
                    <Save className="h-4 w-4" />
                    <span className="hidden md:inline">Save Workout</span>
                    <span className="md:hidden">Save</span>
                </>
            )}
          </Button>
        </div>
      </header>

      <div className="relative flex-1 flex overflow-hidden bg-neutral-50 dark:bg-zinc-950">
        
        {/* LEFT: Editor Panel */}
        <div className={cn(
          "flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] scrollbar-hide",
          showPreview ? (previewDevice === 'mobile' ? "hidden lg:block lg:mr-[420px]" : "hidden lg:block lg:mr-[65%]") : ""
        )}>
          <div className="max-w-5xl mx-auto space-y-10 pb-40">
            
            {/* Metadata Card */}
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-4">
                <Input 
                  {...register('title')} 
                  placeholder="Workout Title" 
                  className="text-5xl md:text-6xl font-black tracking-tighter border-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/20 bg-transparent text-foreground"
                />
                {errors.title && <p className="text-red-500 text-sm font-medium">{errors.title.message}</p>}
                <Textarea 
                  {...register('description')} 
                  placeholder="What's the goal of this session?" 
                  className="resize-none border-none px-0 min-h-[40px] focus-visible:ring-0 text-xl text-muted-foreground bg-transparent font-medium"
                />
                {errors.description && <p className="text-red-500 text-sm font-medium">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Cover Image */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Cover Image</label>
                    <Controller
                        control={control}
                        name="cover"
                        render={({ field }) => (
                            <MediaInput 
                                value={field.value} 
                                onChange={field.onChange}
                                placeholder="Add cover image..."
                                type="media"
                            />
                        )}
                    />
                 </div>

                 {/* Workout Audio */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Workout Playlist (URLs)</label>
                    <Controller
                        control={control}
                        name="audio"
                        render={({ field }) => (
                            <TagInput 
                                value={field.value || []} 
                                onChange={field.onChange}
                                placeholder="Add YouTube/Spotify links..."
                                icon={<Music className="h-4 w-4" />}
                                variant="blue"
                            />
                        )}
                    />
                 </div>

                 {/* Tags & Difficulty */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Tags</label>
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
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Difficulty</label>
                    <Controller
                        control={control}
                        name="difficulty"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="w-full h-10 rounded-xl bg-background border-border/50 focus:ring-primary/20 font-medium">
                                    <SelectValue placeholder="Select difficulty level" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/50 shadow-xl">
                                    <SelectItem value="beginner" className="rounded-lg my-1 cursor-pointer focus:bg-primary/5 focus:text-primary font-medium">
                                        <div className="flex items-center gap-2">
                                            <Dna className="h-4 w-4 text-emerald-500" />
                                            <span>Beginner</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="intermediate" className="rounded-lg my-1 cursor-pointer focus:bg-primary/5 focus:text-primary font-medium">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-blue-500" />
                                            <span>Intermediate</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="advanced" className="rounded-lg my-1 cursor-pointer focus:bg-primary/5 focus:text-primary font-medium">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-orange-500" />
                                            <span>Advanced</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                 </div>

                 {/* Visibility */}
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Visibility</label>
                    </div>
                    <Controller
                        control={control}
                        name="visibility"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="w-full h-10 rounded-xl bg-background border-border/50 focus:ring-primary/20 font-medium">
                                    <SelectValue placeholder="Select visibility" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/50 shadow-xl">
                                    <SelectItem value="draft" className="rounded-lg my-1 cursor-pointer focus:bg-primary/5 focus:text-primary font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-slate-500" />
                                            <span>Draft</span>
                                            <span className="ml-auto text-xs text-muted-foreground">Only you</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="private" className="rounded-lg my-1 cursor-pointer focus:bg-primary/5 focus:text-primary font-medium">
                                        <div className="flex items-center gap-2">
                                            <Lock className="h-4 w-4 text-rose-500" />
                                            <span>Private</span>
                                            <span className="ml-auto text-xs text-muted-foreground">Followers only</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="public" className="rounded-lg my-1 cursor-pointer focus:bg-primary/5 focus:text-primary font-medium">
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-emerald-500" />
                                            <span>Public</span>
                                            <span className="ml-auto text-xs text-muted-foreground">Everyone</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                 </div>
              </div>
            </div>

            {/* Sections */}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections" type="SECTION">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-8">
                    {sectionFields.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-border/50 rounded-[2rem] shadow-xl shadow-black/5 overflow-hidden group animate-in slide-in-from-bottom-8 duration-700 fill-mode-backwards"
                            style={{ 
                                ...provided.draggableProps.style,
                                animationDelay: `${index * 100}ms` 
                            }}
                          >
                            <div className="bg-gradient-to-r from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-900/50 p-6 flex items-center gap-4 border-b border-border/50">
                              <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground/30 hover:text-foreground transition-colors p-2 hover:bg-black/5 rounded-xl">
                                <GripVertical className="h-6 w-6" />
                              </div>
                              <div className="flex-1 flex items-center gap-4">
                                <div className="flex-1">
                                    <Input 
                                        {...register(`sections.${index}.name` as const)} 
                                        placeholder="SECTION NAME" 
                                        className="bg-transparent border-none shadow-none font-black text-2xl tracking-tight focus-visible:ring-0 px-0 h-auto w-full placeholder:text-muted-foreground/20 uppercase"
                                    />
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
                                <div className="flex bg-muted/50 p-1 rounded-lg shrink-0 gap-1">
                                    {/* Straight Sets (Single) */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button 
                                                type="button"
                                                onClick={() => field.onChange('single')}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-1.5",
                                                    field.value === 'single' ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <List className="h-3.5 w-3.5" />
                                                Straight Sets
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-zinc-900 text-white border-white/10 text-xs">
                                            <p>Complete all sets of one exercise before moving to the next.</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    {/* Circuit (Linear) */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button 
                                                type="button"
                                                onClick={() => field.onChange('linear')}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-1.5",
                                                    field.value === 'linear' || !field.value ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <Repeat className="h-3.5 w-3.5" />
                                                Circuit
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-zinc-900 text-white border-white/10 text-xs">
                                            <p>Perform one set of each exercise in sequence, then repeat the cycle.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                    )}
                                />
                              </div>
                              <Button 
                                type="button" variant="ghost" size="icon" 
                                onClick={() => removeSection(index)}
                                className="opacity-0 group-hover:opacity-100 transition-all h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                            <div className="p-6 md:p-8">
                              <ExercisesFieldArray 
                                nestIndex={index} 
                                control={control} 
                                register={register} 
                                errors={errors}
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

            <div className="relative mt-8 mb-20 group">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-dashed border-border/40 group-hover:border-primary/20 transition-colors" />
                </div>
                <div className="relative flex justify-center">
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="lg"
                        className="h-12 px-8 rounded-full border border-dashed border-border/60 hover:border-primary/40 bg-background text-muted-foreground/60 hover:text-primary hover:bg-primary/5 text-xs font-bold uppercase tracking-widest shadow-sm hover:shadow-md transition-all duration-300"
                        onClick={() => appendSection({ id: `sec-${Date.now()}`, name: '', orderType: 'linear', exercises: [] })}
                    >
                        <span className="flex items-center gap-2 group-hover:gap-3 transition-all">
                            <Plus className="h-4 w-4" />
                            Add New Section
                        </span>
                    </Button>
                </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Preview Panel */}
        <div className={cn(
            "absolute inset-y-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-l transform transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-20 shadow-2xl",
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
      </div>
    </div>
  )
}


function ExercisesFieldArray({ nestIndex, control, register, errors }: { nestIndex: number, control: any, register: any, errors: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${nestIndex}.exercises`
  })

  const handleAddFromVault = (exercise: Exercise) => {
    append({
        id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        media_id: exercise.media_id,
        media_url: exercise.media?.url,
    })
  }

  return (
    <div className="space-y-4">
      <Droppable droppableId={`exercises-${nestIndex}`} type="EXERCISE">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
            {fields.map((item, k) => (
                <Draggable key={item.id} draggableId={item.id} index={k}>
                    {(provided) => (
                        <div 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="group relative bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-border/50 shadow-sm hover:shadow-lg transition-all"
                        >
                            
                            {/* Drag Handle */}
                            <div 
                                {...provided.dragHandleProps} 
                                className="absolute top-6 left-3 z-10 p-2 cursor-grab text-muted-foreground/20 hover:text-foreground transition-colors rounded-lg hover:bg-black/5"
                            >
                                <GripVertical className="h-5 w-5" />
                            </div>

                            {/* Delete Button (Absolute Top Right) */}
                            <div className="absolute top-4 right-4 z-10">
                                <Button 
                                    type="button" variant="ghost" size="icon" 
                                    onClick={() => remove(k)}
                                    className="h-8 w-8 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-full"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-4 md:gap-8 pl-8 md:pl-8">
                                {/* Main Content (Left) */}
                                <div className="flex-1 min-w-full sm:min-w-[300px] space-y-6">
                    {/* Header: Name & Description */}
                    <div className="space-y-2 pr-10">
                        <div>
                            <Input 
                                {...register(`sections.${nestIndex}.exercises.${k}.name`)} 
                                placeholder="Exercise Name" 
                                className="h-auto text-xl font-black bg-transparent border-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/30 tracking-tight"
                            />
                            {errors.sections?.[nestIndex]?.exercises?.[k]?.name && (
                                <p className="text-red-500 text-xs font-medium">
                                    {errors.sections[nestIndex].exercises[k].name.message}
                                </p>
                            )}
                        </div>
                        <Input 
                            {...register(`sections.${nestIndex}.exercises.${k}.description`)} 
                            placeholder="Add instructions, cues or notes..." 
                            className="h-auto text-sm bg-transparent border-none px-0 hover:bg-muted/10 transition-colors focus-visible:ring-0 placeholder:text-muted-foreground/40 w-full font-medium text-muted-foreground"
                        />
                    </div>

                    {/* Metrics Panel */}
                    <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 flex flex-col justify-center gap-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Metrics</label>
                        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-y-6 gap-x-2">
                            {/* Type Toggle */}
                            <Controller
                                control={control}
                                name={`sections.${nestIndex}.exercises.${k}.type`}
                                render={({ field }) => (
                                    <div className="flex bg-muted/50 p-1 rounded-lg shrink-0 w-full sm:w-auto justify-center">
                                        <button 
                                            type="button"
                                            onClick={() => field.onChange('reps')}
                                            className={cn(
                                                "px-2 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all min-w-[40px] flex-1 sm:flex-none",
                                                field.value === 'reps' ? "bg-white dark:bg-zinc-800 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Reps
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => field.onChange('time')}
                                            className={cn(
                                                "px-2 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all min-w-[40px] flex-1 sm:flex-none",
                                                field.value === 'time' ? "bg-white dark:bg-zinc-800 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            Time
                                        </button>
                                    </div>
                                )}
                            />

                            <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
                                {/* Value */}
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase mb-1">
                                            <Controller
                                            control={control}
                                            name={`sections.${nestIndex}.exercises.${k}.type`}
                                            render={({ field }) => <>{field.value === 'reps' ? 'Count' : 'Work'}</>}
                                        />
                                    </span>
                                    <Controller
                                        control={control}
                                        name={`sections.${nestIndex}.exercises.${k}.type`}
                                        render={({ field: typeField }) => (
                                            <Input 
                                                {...register(typeField.value === 'reps' ? `sections.${nestIndex}.exercises.${k}.reps` : `sections.${nestIndex}.exercises.${k}.duration`)}
                                                placeholder="0" 
                                                className="h-8 w-16 text-center bg-white dark:bg-zinc-800 border-none shadow-sm rounded-lg font-bold focus-visible:ring-0"
                                            />
                                        )}
                                    />
                                </div>

                                {/* Sets */}
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Sets</span>
                                    <Input 
                                        {...register(`sections.${nestIndex}.exercises.${k}.sets`)} 
                                        placeholder="0" 
                                        type="number"
                                        className="h-8 w-14 text-center bg-white dark:bg-zinc-800 border-none shadow-sm rounded-lg font-bold focus-visible:ring-0"
                                    />
                                </div>

                                {/* Rest */}
                                <div className="flex flex-col items-center">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Rest</span>
                                    <div className="relative">
                                        <Input 
                                            {...register(`sections.${nestIndex}.exercises.${k}.rest`)} 
                                            placeholder="0" 
                                            type="number"
                                            className="h-8 w-14 text-center bg-white dark:bg-zinc-800 border-none shadow-sm rounded-lg font-bold focus-visible:ring-0"
                                        />
                                        <span className="absolute right-1 top-2 text-[9px] text-muted-foreground font-medium">s</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Panel (Muscles & Equipment) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Difficulty */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Difficulty</label>
                        <Controller
                            control={control}
                            name={`sections.${nestIndex}.exercises.${k}.difficulty`}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value || 'beginner'}>
                                    <SelectTrigger className="w-full h-9 rounded-lg bg-muted/30 border-border/50 text-xs font-medium">
                                        <SelectValue placeholder="Select difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Target Muscles</label>
                            <Controller
                                control={control}
                                name={`sections.${nestIndex}.exercises.${k}.muscle_groups`}
                                render={({ field }) => (
                                    <TagInput 
                                        value={field.value || []} 
                                        onChange={field.onChange}
                                        placeholder="Add muscles..."
                                        variant="orange"
                                    />
                                )}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Equipment</label>
                            <Controller
                                control={control}
                                name={`sections.${nestIndex}.exercises.${k}.equipment`}
                                render={({ field }) => (
                                    <TagInput 
                                        value={field.value || []} 
                                        onChange={field.onChange}
                                        placeholder="Add equipment..."
                                        variant="blue"
                                    />
                                )}
                            />
                        </div>
                    </div>

                    
                 </div>

                 {/* Media Column (Right) - Full Height */}
                 <div className="w-full md:w-[340px] shrink-0 flex flex-col">
                     <div className="h-full flex flex-col gap-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Visual Aid</label>
                         <Controller
                            control={control}
                            name={`sections.${nestIndex}.exercises.${k}.media_url`}
                            render={({ field }) => (
                                <div className="w-full h-full min-h-[200px] rounded-2xl overflow-hidden bg-muted/30 border-2 border-dashed border-border/50 hover:border-primary/20 relative group/media transition-colors shadow-inner flex items-center justify-center">
                                    <MediaInput 
                                        value={field.value} 
                                        onChange={field.onChange} 
                                        variant="thumbnail"
                                    />
                                </div>
                            )}
                         />
                     </div>
                 </div>
             </div>
        </div>
                    )}
                </Draggable>
      ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
            type="button" variant="ghost" size="sm"
            className="w-full h-12 border border-dashed border-border/40 hover:border-primary/40 text-muted-foreground/60 hover:text-primary hover:bg-primary/5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all group"
            onClick={() => append({ id: `ex-${Date.now()}`, name: '', sets: 3, reps: 10, duration: 0, type: 'reps', rest: 60, description: '' })}
        >
            <span className="flex items-center gap-2 group-hover:gap-3 transition-all">
                <Plus className="h-3.5 w-3.5" /> 
                Add Exercise
            </span>
        </Button>

        <ExercisesVault 
            onSelect={handleAddFromVault}
            trigger={
                <Button
                    type="button" variant="ghost" size="sm"
                    className="w-full h-12 border border-dashed border-orange-500/20 hover:border-orange-500/40 text-muted-foreground/60 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all group"
                >
                    <span className="flex items-center gap-2 group-hover:gap-3 transition-all">
                        <Package className="h-3.5 w-3.5" /> 
                        Add Exercise from Vault
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
    variant = "default" 
}: { 
    value?: string[], 
    onChange: (val: string[]) => void, 
    placeholder?: string, 
    icon?: React.ReactNode,
    variant?: "default" | "orange" | "blue"
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
                        "h-9 text-sm border-transparent focus:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all",
                        bgClass,
                        icon ? "pl-9 pr-9" : "pr-9"
                    )}
                />
                <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary" 
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
                                "gap-1 pr-1 font-medium", 
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

function MediaInput({ value, onChange, placeholder, type = 'media', variant = 'default' }: { value?: string | null, onChange: (val: string) => void, placeholder?: string, type?: 'media' | 'audio', variant?: 'default' | 'thumbnail' }) {
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
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
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
    }, [])

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

    if (variant === 'thumbnail') {
        const isVideo = value?.match(/\.(mp4|webm|mov)$/i) || value?.includes('#video') || (value?.startsWith('blob:') && !value?.includes('#image') && !value?.includes('#audio'))
        const isAudio = type === 'audio' || value?.match(/\.(mp3|wav|ogg)$/i) || value?.includes('#audio')
        
        return (
            <div className="w-full h-full relative group bg-muted/20">
                <input 
                    type="file" ref={fileInputRef} className="hidden" 
                    accept={type === 'audio' ? "audio/*" : "image/*,video/*,audio/*"} 
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
                                            {new Date(recordingTime * 1000).toISOString().substr(14, 5)}
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
                        <span className="text-xs font-mono font-bold mb-3">{new Date(recordingTime * 1000).toISOString().substr(14, 5)}</span>
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
                    <div className="w-full h-full flex flex-col items-stretch divide-y divide-border/10">
                        <div className="p-2">
                            <Input 
                                placeholder="Paste URL..." 
                                className="h-8 text-xs bg-background/50 border-none shadow-sm"
                                value={value || ''}
                                onChange={(e) => onChange(e.target.value)}
                            />
                        </div>
                        <button 
                            type="button"
                            className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-black/5 transition-colors text-muted-foreground hover:text-emerald-500"
                            onClick={() => setIsLibraryOpen(true)}
                            title="Select from Library"
                        >
                             <Library className="h-5 w-5 opacity-70" />
                             <span className="text-[8px] font-bold uppercase">Lib</span>
                        </button>

                        {/* Top: Video */}
                        <button 
                            type="button"
                            className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-black/5 transition-colors text-muted-foreground hover:text-blue-500"
                            onClick={() => openCamera()}
                            title="Record Video"
                        >
                             <Camera className="h-5 w-5 opacity-70" />
                             <span className="text-[8px] font-bold uppercase">Cam</span>
                        </button>
                        
                        {/* Center: Upload */}
                        <button 
                            type="button"
                            className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-black/5 transition-colors text-muted-foreground hover:text-foreground"
                            onClick={() => fileInputRef.current?.click()}
                            title="Upload File"
                        >
                             <Upload className="h-5 w-5 opacity-70" />
                             <span className="text-[8px] font-bold uppercase">Up</span>
                        </button>
                        
                        {/* Bottom: Audio */}
                        <button 
                            type="button"
                            className="flex-1 flex flex-col items-center justify-center gap-1 hover:bg-black/5 transition-colors text-muted-foreground hover:text-red-500"
                            onClick={() => startAudioRecording()}
                            title="Record Audio"
                        >
                             <Mic className="h-5 w-5 opacity-70" />
                             <span className="text-[8px] font-bold uppercase">Mic</span>
                        </button>
                    </div>
                )}
                
                <MediaSelectionDialog 
                    isOpen={isLibraryOpen} 
                    onClose={() => setIsLibraryOpen(false)} 
                    onSelect={(url) => { onChange(url); setIsLibraryOpen(false) }} 
                    mediaType={type === 'audio' ? 'audio' : 'image'}
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
                accept={type === 'audio' ? "audio/*" : "image/*,video/*,audio/*"} 
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
                mediaType={type === 'audio' ? 'audio' : 'image'}
            />
        </div>
    )
}