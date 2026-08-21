import * as z from 'zod'
import { DIFFICULTY_VALUES } from '@mygym/shared'

// Esquema de validación del form de crear/editar workout — extraído de
// page.tsx (que llegó a tener 3300+ líneas mezclando esto con el
// componente entero) para que el shape de los datos se pueda leer sin
// scrollear un archivo gigante.
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

export const workoutSchema = z.object({
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

export type WorkoutFormValues = z.infer<typeof workoutSchema>
export type WorkoutFormSection = WorkoutFormValues['sections'][number]
export type WorkoutFormExercise = WorkoutFormSection['exercises'][number]
