'use client'

import React, { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Trash2, GripVertical, Save, Dumbbell, ArrowLeft, Eye, Clock, Play, Smartphone, Monitor, Tag, Image as ImageIcon, Video, Music, X, Upload, Mic, FileAudio } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/Button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/form/TextArea'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

import { PreviewWorkout } from './components/PreviewWorkout'

// --- Schema Definition ---
const exerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Required"),
  sets: z.string().optional(),
  reps: z.string().optional(),
  rest: z.string().optional(),
  notes: z.string().optional(),
  media_id: z.string().optional(), // Added media_id
  equipment: z.array(z.string()).optional(), // Added equipment array
  muscle_group: z.array(z.string()).optional(), // Added muscle_group array
  type: z.enum(['reps', 'time']).default('reps'),
  duration: z.string().optional(),
})

const sectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Required"),
  exercises: z.array(exerciseSchema),
})

const workoutSchema = z.object({
  title: z.string().min(3, "Title required"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.string().min(1, "Required"),
  audio: z.string().optional(),
  sections: z.array(sectionSchema),
})

type WorkoutFormValues = z.infer<typeof workoutSchema>

export default function CreateWorkoutPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile')

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      title: '',
      description: '',
      tags: [],
      difficulty: 'intermediate',
      sections: [
        {
          id: 'section-1',
          name: 'Warm Up',
          exercises: [{ id: 'ex-1', name: '', sets: '3', reps: '10', rest: '60', equipment: [], muscle_group: [], type: 'reps', duration: '' }]
        }
      ]
    }
  })

  const { control, register, handleSubmit, watch, formState: { errors } } = form
  
  // Watch all fields for live preview
  const formValues = watch()

  const { fields: sectionFields, append: appendSection, remove: removeSection, move: moveSection } = useFieldArray({
    control,
    name: "sections"
  })

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    if (result.type === 'SECTION') {
      moveSection(result.source.index, result.destination.index)
    }
  }

  const onSubmit = async (data: WorkoutFormValues) => {
    console.log({data})
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
        
        <div className="flex items-center gap-3">
          <Button 
            variant={showPreview ? "secondary" : "ghost"}
            size="icon"
            className="rounded-full h-9 w-9"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? 'Hide Preview' : 'Show Preview'}
          >
            <Eye className="h-4 w-4" /> 
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} size="sm" className="gap-2 rounded-full px-6 font-bold">
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save Workout'}
          </Button>
        </div>
      </header>

      <div className="relative flex-1 flex overflow-hidden bg-neutral-50 dark:bg-zinc-950">
        
        {/* LEFT: Editor Panel */}
        <div className={cn(
          "flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] scrollbar-hide",
          showPreview ? (previewDevice === 'mobile' ? "lg:mr-[420px]" : "lg:mr-[65%]") : ""
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
                <Textarea 
                  {...register('description')} 
                  placeholder="What's the goal of this session?" 
                  className="resize-none border-none px-0 min-h-[40px] focus-visible:ring-0 text-xl text-muted-foreground bg-transparent font-medium"
                />
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                 {/* Difficulty Select */}
                 <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity" />
                    <select {...register('difficulty')} className="relative appearance-none bg-white dark:bg-zinc-900 border-2 border-transparent hover:border-orange-500/50 px-6 py-3 pr-10 rounded-full text-sm font-bold uppercase tracking-wide outline-none cursor-pointer transition-all shadow-sm">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                 </div>
                 
                 {/* Tags Input */}
                 <div className="relative flex-1 min-w-[300px] group">
                    <Controller
                      control={control}
                      name="tags"
                      render={({ field }) => (
                        <TagInput 
                          value={field.value || []} 
                          onChange={field.onChange}
                          placeholder="Add tags (e.g. cardio, morning)"
                          icon={<Tag className="h-4 w-4" />}
                        />
                      )}
                    />
                 </div>
              </div>

              {/* Workout Audio */}
              <div className="space-y-2">
                 <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">Workout Audio</label>
                 <Controller
                    control={control}
                    name="audio"
                    render={({ field }) => (
                        <MediaInput 
                            value={field.value} 
                            onChange={field.onChange}
                            placeholder="Add workout music (URL or File)..."
                            type="audio"
                        />
                    )}
                 />
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
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="bg-gradient-to-r from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-900/50 p-6 flex items-center gap-4 border-b border-border/50">
                              <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground/30 hover:text-foreground transition-colors p-2 hover:bg-black/5 rounded-xl">
                                <GripVertical className="h-6 w-6" />
                              </div>
                              <div className="flex-1">
                                <Input 
                                    {...register(`sections.${index}.name` as const)} 
                                    placeholder="SECTION NAME" 
                                    className="bg-transparent border-none shadow-none font-black text-2xl tracking-tight focus-visible:ring-0 px-0 h-auto w-full placeholder:text-muted-foreground/20 uppercase"
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
                              <ExercisesFieldArray nestIndex={index} control={control} register={register} />
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

            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-dashed border-4 py-16 text-muted-foreground/50 hover:text-primary hover:border-primary hover:bg-primary/5 rounded-[2.5rem] transition-all duration-300 group mt-12 mb-20"
              onClick={() => appendSection({ id: `sec-${Date.now()}`, name: '', exercises: [] })}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 group-hover:rotate-90">
                    <Plus className="h-8 w-8" />
                </div>
                <span className="font-black text-xl tracking-tight uppercase">Add New Section</span>
              </div>
            </Button>
          </div>
        </div>

        {/* RIGHT: Live Preview Panel */}
        <div className={cn(
            "absolute inset-y-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-l transform transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-20 shadow-2xl",
            showPreview ? "translate-x-0" : "translate-x-full",
            previewDevice === 'mobile' ? "w-full md:w-[420px]" : "w-full md:w-[65%]"
        )}>
          {/* Preview Controls */}
          <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center px-6 z-30 pointer-events-none">
             <div className="flex items-center gap-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-black/5 pointer-events-auto transform translate-y-4">
                <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={cn(
                        "p-2.5 rounded-full transition-all duration-300",
                        previewDevice === 'mobile' ? "bg-primary text-primary-foreground shadow-sm scale-110" : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                    )}
                >
                    <Smartphone className="h-4 w-4" />
                </button>
                <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={cn(
                        "p-2.5 rounded-full transition-all duration-300",
                        previewDevice === 'desktop' ? "bg-primary text-primary-foreground shadow-sm scale-110" : "text-muted-foreground hover:text-foreground hover:bg-black/5"
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
                    ? "w-full max-w-[360px] h-[720px] rounded-[3rem] border-[8px] border-zinc-900 ring-1 ring-white/20" 
                    : "w-full max-w-5xl h-[600px] rounded-xl border-[12px] border-zinc-900 ring-1 ring-white/20"
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


function ExercisesFieldArray({ nestIndex, control, register }: { nestIndex: number, control: any, register: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${nestIndex}.exercises`
  })

  return (
    <div className="space-y-6">
      {/* Table Header */}
      {fields.length > 0 && (
          <div className="grid grid-cols-12 gap-4 px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              <div className="col-span-6">Exercise Details</div>
              <div className="col-span-2 text-center">Type</div>
              <div className="col-span-2 text-center">Value</div>
              <div className="col-span-2 text-right">Actions</div>
          </div>
      )}
      
      {fields.map((item, k) => (
        <div key={item.id} className="group relative bg-white dark:bg-zinc-900 rounded-2xl p-5 transition-all hover:shadow-lg border border-transparent hover:border-primary/10 space-y-4">
             {/* Top Row: Name, Sets, Reps, Actions */}
             <div className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-6 space-y-4">
                    <Input 
                        {...register(`sections.${nestIndex}.exercises.${k}.name`)} 
                        placeholder="Exercise name" 
                        className="h-11 bg-muted/30 border-transparent focus:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-lg"
                    />
                    
                    {/* Media Input */}
                    <div className="w-full">
                         <Controller
                            control={control}
                            name={`sections.${nestIndex}.exercises.${k}.media_id`}
                            render={({ field }) => (
                                <MediaInput 
                                    value={field.value} 
                                    onChange={field.onChange} 
                                />
                            )}
                         />
                    </div>

                    {/* Tags for Equipment & Muscles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Controller
                            control={control}
                            name={`sections.${nestIndex}.exercises.${k}.equipment`}
                            render={({ field }) => (
                                <TagInput
                                    value={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="Add equipment..."
                                    icon={<Dumbbell className="h-3 w-3" />}
                                    variant="orange"
                                />
                            )}
                         />
                         
                         <Controller
                            control={control}
                            name={`sections.${nestIndex}.exercises.${k}.muscle_group`}
                            render={({ field }) => (
                                <TagInput
                                    value={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="Target muscles..."
                                    icon={<ImageIcon className="h-3 w-3" />}
                                    variant="blue"
                                />
                            )}
                         />
                    </div>
                </div>

                <div className="col-span-2">
                    <div className="relative h-full flex items-center justify-center">
                        <Controller
                            control={control}
                            name={`sections.${nestIndex}.exercises.${k}.type`}
                            render={({ field }) => (
                                <div className="flex flex-col gap-1 w-full">
                                    <button 
                                        type="button"
                                        onClick={() => field.onChange('reps')}
                                        className={cn(
                                            "flex-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-transparent",
                                            field.value === 'reps' ? "bg-primary text-primary-foreground shadow-sm scale-105" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        Reps
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => field.onChange('time')}
                                        className={cn(
                                            "flex-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-transparent",
                                            field.value === 'time' ? "bg-primary text-primary-foreground shadow-sm scale-105" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        Time
                                    </button>
                                </div>
                            )}
                        />
                    </div>
                </div>
                <div className="col-span-2">
                    <Controller
                        control={control}
                        name={`sections.${nestIndex}.exercises.${k}.type`}
                        render={({ field: typeField }) => (
                            <div className="relative">
                                {typeField.value === 'reps' ? (
                                    <>
                                        <Input 
                                            {...register(`sections.${nestIndex}.exercises.${k}.reps`)} 
                                            placeholder="0" type="number" 
                                            className="h-14 text-center text-2xl font-black bg-muted/20 border-transparent focus:bg-background focus-visible:ring-2 focus-visible:ring-primary/20"
                                        />
                                        <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-muted-foreground font-bold uppercase tracking-wider pointer-events-none">Reps</span>
                                    </>
                                ) : (
                                    <>
                                        <Input 
                                            {...register(`sections.${nestIndex}.exercises.${k}.duration`)} 
                                            placeholder="0" type="number" 
                                            className="h-14 text-center text-2xl font-black bg-muted/20 border-transparent focus:bg-background focus-visible:ring-2 focus-visible:ring-primary/20"
                                        />
                                        <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-muted-foreground font-bold uppercase tracking-wider pointer-events-none">Seconds</span>
                                    </>
                                )}
                            </div>
                        )}
                    />
                </div>
                <div className="col-span-2 flex justify-end items-start pt-1">
                     <Button 
                        type="button" variant="ghost" size="icon" 
                        onClick={() => remove(k)}
                        className="h-10 w-10 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </div>
             </div>
             
             <div className="flex gap-4 pl-1 pt-2 border-t border-dashed border-border/40">
                 <div className="relative w-24 group/sets shrink-0">
                     <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Tag className="h-4 w-4 text-muted-foreground/60 group-hover/sets:text-primary transition-colors" />
                     </div>
                     <Input 
                        {...register(`sections.${nestIndex}.exercises.${k}.sets`)} 
                        placeholder="Sets" type="number" 
                        className="h-10 text-sm pl-9 pr-3 bg-muted/20 border-transparent hover:bg-muted/40 transition-colors rounded-xl font-semibold"
                    />
                 </div>
                 <div className="relative w-24 group/rest shrink-0">
                     <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Clock className="h-4 w-4 text-muted-foreground/60 group-hover/rest:text-primary transition-colors" />
                     </div>
                     <Input 
                        {...register(`sections.${nestIndex}.exercises.${k}.rest`)} 
                        placeholder="Rest" type="number" 
                        className="h-10 text-sm pl-10 pr-3 bg-muted/20 border-transparent hover:bg-muted/40 transition-colors rounded-xl font-semibold"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-xs text-muted-foreground/60 font-medium">sec</span>
                 </div>
                <Input 
                    {...register(`sections.${nestIndex}.exercises.${k}.notes`)} 
                    placeholder="Add specific instructions, muscle groups, or notes..." 
                    className="h-10 text-sm flex-1 bg-muted/20 border-transparent hover:bg-muted/40 transition-colors rounded-xl px-4"
                />
             </div>
        </div>
      ))}
      <Button
        type="button" variant="ghost" size="sm"
        className="w-full h-14 border-2 border-dashed border-border/50 hover:border-primary/50 hover:text-primary hover:bg-primary/5 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all group"
        onClick={() => append({ id: `ex-${Date.now()}`, name: '', sets: '3', reps: '10', duration: '', type: 'reps', rest: '60', equipment: [], muscle_group: [] })}
      >
        <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" /> Add Exercise
      </Button>
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

function MediaInput({ value, onChange, placeholder, type = 'media' }: { value?: string, onChange: (val: string) => void, placeholder?: string, type?: 'media' | 'audio' }) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const cameraInputRef = React.useRef<HTMLInputElement>(null)
    
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            onChange(url)
        }
    }

    const Icon = type === 'audio' ? Music : ImageIcon

    return (
        <div className="flex gap-2 items-center group/media">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept={type === 'audio' ? "audio/*" : "image/*,video/*,audio/*"} 
                onChange={handleFile} 
            />
            {/* Camera/Microphone Capture Input */}
            <input 
                type="file" 
                ref={cameraInputRef} 
                className="hidden" 
                accept="video/*" 
                capture="environment"
                onChange={handleFile} 
            />

            <div className="relative flex-1">
                <Input 
                    value={value || ''} 
                    readOnly 
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
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload File"
                    >
                        <Upload className="h-3 w-3" />
                    </Button>
                    {type !== 'audio' && (
                        <Button 
                            type="button" 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-muted-foreground hover:text-red-500"
                            onClick={() => cameraInputRef.current?.click()}
                            title="Record Video"
                        >
                            <Video className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
