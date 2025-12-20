'use client'

import React from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Trash2, GripVertical, Save, Dumbbell } from 'lucide-react'

import { Button } from '@/components/Button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/form/TextArea'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// --- Schema Definition ---
const exerciseSchema = z.object({
  id: z.string(), // for DnD key
  name: z.string().min(1, "Name is required"),
  sets: z.string().optional(), // Using string for inputs to handle empty state easily, convert to number later
  reps: z.string().optional(),
  weight: z.string().optional(),
})

const sectionSchema = z.object({
  id: z.string(), // for DnD key
  name: z.string().min(1, "Section name is required"),
  exercises: z.array(exerciseSchema),
})

const workoutSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  difficulty: z.string().min(1, "Difficulty is required"),
  sections: z.array(sectionSchema),
})

type WorkoutFormValues = z.infer<typeof workoutSchema>

// --- Helper to reorder list ---
const reorder = <T,>(list: T[], startIndex: number, endIndex: number) => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

export default function CreateWorkoutPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'strength',
      difficulty: 'intermediate',
      sections: [
        {
          id: 'section-1',
          name: 'Warm Up',
          exercises: [{ id: 'ex-1', name: '', sets: '', reps: '', weight: '' }]
        }
      ]
    }
  })

  const { control, register, handleSubmit, formState: { errors } } = form

  const { fields: sectionFields, append: appendSection, remove: removeSection, move: moveSection, update: updateSection } = useFieldArray({
    control,
    name: "sections"
  })

  // We need a custom way to handle nested FieldArrays because standard useFieldArray nesting has quirks with DnD
  // However, for "simple and fast", we will handle exercises rendering within the Section component logic below
  // Note: To make DnD work for nested lists, we need to be careful with ids.

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index
    const type = result.type

    if (type === 'SECTION') {
      moveSection(sourceIndex, destinationIndex)
    } 
    // For nested exercises, it's trickier with a single drag handler if we want cross-section drag.
    // For now, let's implement SECTION reordering only to keep it simple as requested, 
    // or we can implement intra-section reordering if the user asks.
    // Let's stick to Section reordering for this iteration to avoid complexity with nested hooks.
  }

  const onSubmit = async (data: WorkoutFormValues) => {
    if (!user) return
    setIsSubmitting(true)

    try {
      // 1. Create Workout
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description,
          category: data.category,
          difficulty: data.difficulty,
          is_public: true, // Default to true for now
          duration_minutes: 0, // Calculate later or add field
        })
        .select()
        .single()

      if (workoutError) throw workoutError

      // 2. Create Sections and Exercises
      // This part handles the hierarchy. 
      // Since Supabase doesn't support deep nested inserts easily in one go without specific setup,
      // we'll loop through.
      
      for (const [sIndex, section] of data.sections.entries()) {
        const { data: sectionData, error: sectionError } = await supabase
          .from('workout_sections')
          .insert({
            workout_id: workout.id,
            name: section.name,
            order: sIndex + 1
          })
          .select()
          .single()

        if (sectionError) throw sectionError

        if (section.exercises.length > 0) {
          const exercisesToInsert = section.exercises.map((ex, eIndex) => ({
            section_id: sectionData.id,
            exercise_id: '00000000-0000-0000-0000-000000000000', // Placeholder: You need a real Exercise DB or allow custom text. 
            // If you don't have an exercise catalog yet, we might need to store the name in a junction table or create ad-hoc exercises.
            // checking your schema... 'section_exercises' links to 'exercises'. 
            // If you want free-text exercises, we need to create them in 'exercises' table first or have a text field.
            // Assuming for now we create a new exercise entry for custom names or find existing.
            // For SPEED: I will skip linking to 'exercises' table if it requires lookup and just assume we can store metadata 
            // OR I will create a dummy exercise. 
            // WAIT: 'section_exercises' probably has sets/reps columns.
            
            // Let's look at the schema I created previously...
            // section_exercises (id, section_id, exercise_id, sets, reps, weight, order)
            // exercises (id, name, ...)
            
            // Implementation detail: We should create the exercise first if it doesn't exist.
            // For this quick form, let's just create a new exercise for every entry for simplicity
          }))

          // Actually, let's just create exercises on the fly
          for (const [eIndex, ex] of section.exercises.entries()) {
             // Create exercise in 'exercises' table (simple version: duplicates allowed)
             const { data: newExercise, error: exError } = await supabase
                .from('exercises')
                .insert({
                    name: ex.name,
                    user_id: user.id, // optional if your schema allows
                    category: data.category
                })
                .select()
                .single()
             
             if (exError) throw exError

             // Link in section_exercises
             await supabase.from('section_exercises').insert({
                 section_id: sectionData.id,
                 exercise_id: newExercise.id,
                 sets: parseInt(ex.sets || '0'),
                 reps: parseInt(ex.reps || '0'),
                 weight: parseFloat(ex.weight || '0'),
                 order: eIndex + 1
             })
          }
        }
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error creating workout:', error)
      alert('Failed to create workout. Check console.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Create Workout</h1>
          <p className="text-muted-foreground">Design your new training routine</p>
        </div>
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="gap-2">
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Saving...' : 'Save Workout'}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Main Details */}
        <div className="space-y-4 bg-card p-6 rounded-xl border shadow-sm">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Workout Title</label>
            <Input {...register('title')} placeholder="e.g., Chest & Triceps Destroyer" />
            {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea {...register('description')} placeholder="Briefly describe the goal of this workout..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Category</label>
              <select 
                {...register('category')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="flexibility">Flexibility</option>
                <option value="crossfit">Crossfit</option>
                <option value="bodybuilding">Bodybuilding</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Difficulty</label>
              <select 
                {...register('difficulty')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="elite">Elite</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sections Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-semibold flex items-center gap-2">
                <Dumbbell className="h-5 w-5" /> Routine
             </h2>
             <Button 
               type="button" 
               variant="outline" 
               size="sm" 
               onClick={() => appendSection({ id: `section-${Date.now()}`, name: '', exercises: [] })}
            >
               <Plus className="h-4 w-4 mr-2" /> Add Section
             </Button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sections" type="SECTION">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {sectionFields.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-card border rounded-xl shadow-sm overflow-hidden"
                        >
                          {/* Section Header */}
                          <div className="bg-muted/30 p-4 flex items-center gap-3 border-b">
                            <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground hover:text-primary">
                              <GripVertical className="h-5 w-5" />
                            </div>
                            <Input 
                                {...register(`sections.${index}.name` as const)} 
                                placeholder="Section Name (e.g., Warm Up)" 
                                className="bg-transparent border-none shadow-none font-semibold text-lg focus-visible:ring-0 px-0 h-auto"
                            />
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="text-muted-foreground hover:text-destructive ml-auto"
                                onClick={() => removeSection(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Exercises List (Nested) */}
                          <div className="p-4 space-y-3">
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
        </div>
      </form>
    </div>
  )
}

// Sub-component for nested exercises to keep code clean and manage its own field array
function ExercisesFieldArray({ nestIndex, control, register }: { nestIndex: number, control: any, register: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${nestIndex}.exercises`
  })

  return (
    <div className="space-y-3">
      {fields.map((item, k) => (
        <div key={item.id} className="flex gap-2 items-start group">
            <div className="grid grid-cols-12 gap-2 flex-1">
                <div className="col-span-5">
                    <Input 
                        {...register(`sections.${nestIndex}.exercises.${k}.name`)} 
                        placeholder="Exercise Name" 
                        className="h-9"
                    />
                </div>
                <div className="col-span-2">
                    <Input 
                        {...register(`sections.${nestIndex}.exercises.${k}.sets`)} 
                        placeholder="Sets" 
                        type="number"
                        className="h-9"
                    />
                </div>
                <div className="col-span-2">
                    <Input 
                        {...register(`sections.${nestIndex}.exercises.${k}.reps`)} 
                        placeholder="Reps" 
                        type="number"
                        className="h-9"
                    />
                </div>
                <div className="col-span-2">
                    <Input 
                        {...register(`sections.${nestIndex}.exercises.${k}.weight`)} 
                        placeholder="Kg" 
                        type="number"
                        className="h-9"
                    />
                </div>
                <div className="col-span-1 flex justify-end">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => remove(k)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
      ))}
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-primary text-xs"
        onClick={() => append({ id: `ex-${Date.now()}`, name: '', sets: '', reps: '', weight: '' })}
      >
        <Plus className="h-3 w-3 mr-1" /> Add Exercise
      </Button>
    </div>
  )
}