import type { WorkoutFormExercise } from './schema'

// Helpers puros para el form de crear/editar workout — extraídos de
// page.tsx junto con schema.ts (ver ese archivo para el porqué).

const FIELD_LABELS: Record<string, string> = {
  'title': 'El título del workout',
  'description': 'La descripción',
  'cover': 'La portada',
  'difficulty': 'La dificultad',
  'visibility': 'La visibilidad',
  'challenge.timeCapSeconds': 'El tiempo límite del reto',
}

export function describeField(path: string): string {
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

export function flattenFormErrors(error: unknown, prefix = ''): FormErrorEntry[] {
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

export function summarizeFormErrors(error: unknown): { count: number; first: string } {
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

export function isPersistedExerciseId(value?: string | null) {
  const trimmed = value?.trim()
  if (!trimmed || !UUID_RE.test(trimmed)) return undefined
  return trimmed
}

export function inferMediaType(value?: string | null): 'image' | 'video' | 'audio' {
  if (!value) return 'image'
  if (value.includes('#audio') || /\.(mp3|wav|ogg|m4a|aac)($|\?)/i.test(value)) return 'audio'
  if (value.includes('#video') || /youtube\.com|youtu\.be/i.test(value) || /\.(mp4|webm|ogg|mov|mkv)($|\?)/i.test(value)) return 'video'
  return 'image'
}

export function normalizeMediaUrl(value?: string | null) {
  if (!value) return ''
  return value.replace(/#(audio|video|image)$/, '')
}

export function ensureUploadedUrl(value: string | null | undefined, label: string) {
  const normalizedValue = normalizeMediaUrl(value)

  if (normalizedValue.startsWith('blob:')) {
    throw new Error(`${label} no se pudo subir correctamente. Vuelve a intentarlo.`)
  }

  return normalizedValue
}

export function sanitizeTutorial(
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

export function createEmptyExercise() {
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    sets: 3,
    reps: 10,
    duration: 0,
    type: 'reps' as const,
    rest: 60,
    weight_kg: undefined,
    description: '',
    difficulty: 'beginner' as const,
    thumbnail_url: '',
    thumbnail_media_id: null,
    tutorial: undefined,
  }
}
