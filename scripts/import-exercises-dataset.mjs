import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const DATASET_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json'
const DATASET_RAW_BASE_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main'
const SOURCE_PROVIDER = 'exercises_dataset'
const IMPORT_PREFIX = 'datasets/exercises_dataset'
const DEFAULT_TRANSLATION_CACHE_PATH = path.resolve('scripts/.cache/exercises-name-translations.es.json')

const EQUIPMENT_MAP = {
  assisted: 'asistida',
  band: 'banda',
  barbell: 'barra',
  'body weight': 'peso corporal',
  'bosu ball': 'bosu',
  cable: 'polea',
  dumbbell: 'mancuerna',
  'elliptical machine': 'maquina eliptica',
  'ez barbell': 'barra ez',
  hammer: 'martillo',
  kettlebell: 'kettlebell',
  'leverage machine': 'maquina de palanca',
  'medicine ball': 'balon medicinal',
  'olympic barbell': 'barra olimpica',
  'resistance band': 'banda de resistencia',
  roller: 'rodillo',
  rope: 'cuerda',
  'skierg machine': 'maquina skierg',
  'sled machine': 'maquina de trineo',
  'smith machine': 'maquina smith',
  'stability ball': 'fitball',
  'stationary bike': 'bicicleta estatica',
  'stepmill machine': 'escaladora',
  tire: 'neumatico',
  'trap bar': 'barra hexagonal',
  'upper body ergometer': 'ergometro de brazos',
  weighted: 'lastre',
  'wheel roller': 'rueda abdominal',
}

const MUSCLE_MAP = {
  abductors: 'abductores',
  abdominals: 'abdominales',
  abs: 'abdominales',
  adductors: 'aductores',
  'ankle stabilizers': 'estabilizadores del tobillo',
  ankles: 'tobillos',
  biceps: 'biceps',
  calves: 'gemelos',
  'cardiovascular system': 'sistema cardiovascular',
  chest: 'pecho',
  core: 'core',
  deltoids: 'deltoides',
  delts: 'deltoides',
  forearms: 'antebrazos',
  glutes: 'gluteos',
  hamstrings: 'isquiotibiales',
  hands: 'manos',
  'hip flexors': 'flexores de cadera',
  'latissimus dorsi': 'dorsal ancho',
  lats: 'dorsales',
  'levator scapulae': 'elevador de la escapula',
  'lower back': 'lumbar',
  obliques: 'oblicuos',
  pectorals: 'pectorales',
  quadriceps: 'cuadriceps',
  quads: 'cuadriceps',
  rhomboids: 'romboides',
  'rotator cuff': 'manguito rotador',
  'serratus anterior': 'serrato anterior',
  shoulders: 'hombros',
  soleus: 'soleo',
  spine: 'columna',
  trapezius: 'trapecio',
  traps: 'trapecio',
  triceps: 'triceps',
  'upper back': 'espalda alta',
  'wrist extensors': 'extensores de la muneca',
  'wrist flexors': 'flexores de la muneca',
  wrists: 'munecas',
}

const BODY_PART_MAP = {
  back: 'espalda',
  cardio: 'cardio',
  chest: 'pecho',
  'lower arms': 'antebrazos',
  'lower legs': 'piernas inferiores',
  neck: 'cuello',
  shoulders: 'hombros',
  'upper arms': 'brazos',
  'upper legs': 'piernas',
  waist: 'core',
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    skipMedia: false,
    overwriteMedia: false,
    continueOnError: false,
    translateNames: false,
    translationCachePath: DEFAULT_TRANSLATION_CACHE_PATH,
    limit: null,
    offset: 0,
  }

  for (const arg of argv) {
    if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--skip-media') options.skipMedia = true
    else if (arg === '--overwrite-media') options.overwriteMedia = true
    else if (arg === '--continue-on-error') options.continueOnError = true
    else if (arg === '--translate-names') options.translateNames = true
    else if (arg.startsWith('--limit=')) options.limit = Number.parseInt(arg.split('=')[1], 10)
    else if (arg.startsWith('--offset=')) options.offset = Number.parseInt(arg.split('=')[1], 10)
    else if (arg.startsWith('--translation-cache=')) options.translationCachePath = path.resolve(arg.split('=')[1])
  }

  if (Number.isNaN(options.limit)) options.limit = null
  if (Number.isNaN(options.offset) || options.offset < 0) options.offset = 0

  return options
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase()
}

function dedupeStrings(values) {
  const seen = new Set()
  const output = []

  for (const value of values) {
    const normalized = normalizeText(value)
    if (!normalized) continue

    const key = normalized.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    output.push(normalized)
  }

  return output
}

function translateTerm(value, dictionary) {
  const normalized = normalizeKey(value)
  return dictionary[normalized] || normalized
}

async function loadJsonFile(filePath, fallbackValue) {
  try {
    const content = await readFile(filePath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    const errorCode = error && typeof error === 'object' ? Reflect.get(error, 'code') : undefined

    if (errorCode === 'ENOENT') {
      return fallbackValue
    }

    throw error
  }
}

async function saveJsonFile(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function getOpenAiClient(enabled) {
  if (!enabled) return null

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY es obligatoria cuando usas --translate-names')
  }

  return new OpenAI({ apiKey })
}

async function translateExerciseName({
  openai,
  cache,
  cachePath,
  originalName,
  dryRun,
}) {
  const normalizedName = normalizeText(originalName)
  if (!openai) {
    return normalizedName
  }

  const cacheKey = normalizedName.toLowerCase()
  if (cache[cacheKey]) {
    return cache[cacheKey]
  }

  if (dryRun) {
    return normalizedName
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Traduce nombres de ejercicios de fitness del ingles al espanol de Espana. Devuelve solo JSON valido. Usa terminologia natural de gimnasio. Conserva numeros, grados, slash y marcas de equipamiento si aportan contexto. No anadas explicaciones.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          source_language: 'en',
          target_language: 'es',
          text: normalizedName,
          output: { translated_name: 'string' },
        }),
      },
    ],
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error(`No se pudo traducir el nombre: ${normalizedName}`)
  }

  const parsed = JSON.parse(content)
  const translatedName = normalizeText(
    parsed.translated_name
      || parsed.output?.translated_name
  )

  if (!translatedName) {
    throw new Error(`La traduccion del nombre quedo vacia: ${normalizedName}`)
  }

  cache[cacheKey] = translatedName
  await saveJsonFile(cachePath, cache)

  return translatedName
}

async function buildExerciseName({
  exercise,
  openai,
  translationCache,
  translationCachePath,
  dryRun,
}) {
  return translateExerciseName({
    openai,
    cache: translationCache,
    cachePath: translationCachePath,
    originalName: exercise.name,
    dryRun,
  })
}

function buildExerciseDescription(exercise) {
  return normalizeText(exercise.instructions?.es)
}

function buildEquipment(exercise) {
  return dedupeStrings([translateTerm(exercise.equipment, EQUIPMENT_MAP)])
}

function buildMuscleGroups(exercise) {
  const candidates = [
    exercise.target,
    exercise.muscle_group,
    ...(Array.isArray(exercise.secondary_muscles) ? exercise.secondary_muscles : []),
  ]

  const translated = candidates.map((entry) => translateTerm(entry, MUSCLE_MAP))

  if (translated.length === 0 && exercise.body_part) {
    translated.push(translateTerm(exercise.body_part, BODY_PART_MAP))
  }

  return dedupeStrings(translated)
}

function buildTutorialSteps(exercise) {
  const steps = Array.isArray(exercise.instruction_steps?.es)
    ? exercise.instruction_steps.es
    : []

  return steps
    .map((step, index) => ({
      title: `Paso ${index + 1}`,
      description: normalizeText(step),
      order_index: index,
    }))
    .filter((step) => step.description)
}

function getFileExtension(relativePath) {
  const filename = relativePath.split('/').pop() || ''
  const dotIndex = filename.lastIndexOf('.')
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : ''
}

function getMimeType(relativePath) {
  const extension = getFileExtension(relativePath)

  switch (extension) {
    case '.gif':
      return 'image/gif'
    case '.png':
      return 'image/png'
    case '.jpeg':
    case '.jpg':
    default:
      return 'image/jpeg'
  }
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON from ${url}: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function fetchBuffer(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch binary from ${url}: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function resolveMediaRecord({
  supabase,
  r2,
  bucketName,
  publicBaseUrl,
  sourceExerciseId,
  relativePath,
  overwriteMedia,
  dryRun,
}) {
  const filename = relativePath.split('/').pop()
  if (!filename) {
    throw new Error(`Invalid media path: ${relativePath}`)
  }

  const folder = relativePath.startsWith('videos/') ? 'videos' : 'images'
  const bucketPath = `${IMPORT_PREFIX}/${folder}/${filename}`
  const publicUrl = `${publicBaseUrl}/${bucketPath}`
  const mimeType = getMimeType(relativePath)

  const { data: existingMedia, error: existingMediaError } = await supabase
    .from('media')
    .select('id, url, type, mime_type, filename, bucket_path')
    .eq('bucket_path', bucketPath)
    .maybeSingle()

  if (existingMediaError) {
    throw new Error(`Failed to resolve media ${bucketPath}: ${existingMediaError.message}`)
  }

  if (existingMedia && !overwriteMedia) {
    return existingMedia
  }

  if (!dryRun) {
    const fileBuffer = await fetchBuffer(`${DATASET_RAW_BASE_URL}/${relativePath}`)

    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: bucketPath,
        Body: fileBuffer,
        ContentType: mimeType,
      })
    )
  }

  if (dryRun) {
    return {
      id: null,
      url: publicUrl,
      type: 'image',
      mime_type: mimeType,
      filename,
      bucket_path: bucketPath,
    }
  }

  if (existingMedia) {
    const { data: updatedMedia, error: updateError } = await supabase
      .from('media')
      .update({
        url: publicUrl,
        type: 'image',
        mime_type: mimeType,
        filename,
      })
      .eq('id', existingMedia.id)
      .select('id, url, type, mime_type, filename, bucket_path')
      .single()

    if (updateError) {
      throw new Error(`Failed to update media ${bucketPath}: ${updateError.message}`)
    }

    return updatedMedia
  }

  const { data: insertedMedia, error: insertError } = await supabase
    .from('media')
    .insert({
      user_id: null,
      url: publicUrl,
      type: 'image',
      mime_type: mimeType,
      filename,
      bucket_path: bucketPath,
    })
    .select('id, url, type, mime_type, filename, bucket_path')
    .single()

  if (insertError) {
    throw new Error(`Failed to insert media ${bucketPath}: ${insertError.message}`)
  }

  return insertedMedia
}

async function upsertExercise({
  supabase,
  exercise,
  thumbnailMediaId,
  openai,
  translationCache,
  translationCachePath,
  dryRun,
}) {
  const translatedName = await buildExerciseName({
    exercise,
    openai,
    translationCache,
    translationCachePath,
    dryRun,
  })

  const payload = {
    user_id: null,
    name: translatedName,
    description: buildExerciseDescription(exercise),
    difficulty: null,
    muscle_group: buildMuscleGroups(exercise),
    equipment: buildEquipment(exercise),
    thumbnail_media_id: thumbnailMediaId,
    type: 'reps',
    sets: null,
    reps: null,
    duration: null,
    rest: null,
    is_public: true,
    source_provider: SOURCE_PROVIDER,
    source_id: exercise.id,
  }

  const { data: existingExercise, error: existingExerciseError } = await supabase
    .from('exercises')
    .select('id')
    .eq('source_provider', SOURCE_PROVIDER)
    .eq('source_id', exercise.id)
    .maybeSingle()

  if (existingExerciseError) {
    throw new Error(`Failed to resolve exercise ${exercise.id}: ${existingExerciseError.message}`)
  }

  if (dryRun) {
    return {
      action: existingExercise ? 'update' : 'insert',
      exerciseId: existingExercise?.id || null,
      payload,
    }
  }

  if (existingExercise) {
    const { data: updatedExercise, error: updateError } = await supabase
      .from('exercises')
      .update(payload)
      .eq('id', existingExercise.id)
      .select('id')
      .single()

    if (updateError) {
      throw new Error(`Failed to update exercise ${exercise.id}: ${updateError.message}`)
    }

    return {
      action: 'update',
      exerciseId: updatedExercise.id,
      payload,
    }
  }

  const { data: insertedExercise, error: insertError } = await supabase
    .from('exercises')
    .insert({
      ...payload,
      created_at: exercise.created_at,
    })
    .select('id')
    .single()

  if (insertError) {
    throw new Error(`Failed to insert exercise ${exercise.id}: ${insertError.message}`)
  }

  return {
    action: 'insert',
    exerciseId: insertedExercise.id,
    payload,
  }
}

async function syncTutorial({
  supabase,
  exerciseId,
  tutorialMediaId,
  steps,
  dryRun,
}) {
  if (dryRun) {
    return {
      tutorialId: null,
      stepsCount: steps.length,
      mediaId: tutorialMediaId,
    }
  }

  const { data: tutorial, error: tutorialError } = await supabase
    .from('exercise_tutorials')
    .upsert(
      {
        exercise_id: exerciseId,
        media_id: tutorialMediaId,
      },
      { onConflict: 'exercise_id' }
    )
    .select('id')
    .single()

  if (tutorialError) {
    throw new Error(`Failed to upsert tutorial for exercise ${exerciseId}: ${tutorialError.message}`)
  }

  const { error: deleteStepsError } = await supabase
    .from('exercise_tutorial_steps')
    .delete()
    .eq('tutorial_id', tutorial.id)

  if (deleteStepsError) {
    throw new Error(`Failed to clear tutorial steps for ${exerciseId}: ${deleteStepsError.message}`)
  }

  if (steps.length > 0) {
    const { error: insertStepsError } = await supabase
      .from('exercise_tutorial_steps')
      .insert(
        steps.map((step) => ({
          tutorial_id: tutorial.id,
          order_index: step.order_index,
          title: step.title,
          description: step.description,
        }))
      )

    if (insertStepsError) {
      throw new Error(`Failed to insert tutorial steps for ${exerciseId}: ${insertStepsError.message}`)
    }
  }

  return {
    tutorialId: tutorial.id,
    stepsCount: steps.length,
    mediaId: tutorialMediaId,
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseServiceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const r2Endpoint = requireEnv('R2_ENDPOINT')
  const r2AccessKeyId = requireEnv('R2_ACCESS_KEY_ID')
  const r2SecretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY')
  const r2BucketName = requireEnv('R2_BUCKET_NAME')
  const r2PublicUrl = requireEnv('R2_PUBLIC_URL').replace(/\/$/, '')
  const openai = getOpenAiClient(options.translateNames)
  const translationCache = options.translateNames
    ? await loadJsonFile(options.translationCachePath, {})
    : {}

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const r2 = new S3Client({
    region: 'auto',
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  })

  console.log('[import] descargando dataset...')
  const dataset = await fetchJson(DATASET_URL)

  const selectedExercises = dataset.slice(
    options.offset,
    options.limit == null ? undefined : options.offset + options.limit
  )

  console.log(
    `[import] ejercicios seleccionados=${selectedExercises.length} offset=${options.offset} dryRun=${options.dryRun} skipMedia=${options.skipMedia} overwriteMedia=${options.overwriteMedia} translateNames=${options.translateNames}`
  )

  const summary = {
    processed: 0,
    inserted: 0,
    updated: 0,
    failed: 0,
  }

  for (const exercise of selectedExercises) {
    try {
      const thumbnailMedia = options.skipMedia
        ? null
        : await resolveMediaRecord({
            supabase,
            r2,
            bucketName: r2BucketName,
            publicBaseUrl: r2PublicUrl,
            sourceExerciseId: exercise.id,
            relativePath: exercise.image,
            overwriteMedia: options.overwriteMedia,
            dryRun: options.dryRun,
          })

      const tutorialMedia = options.skipMedia
        ? null
        : await resolveMediaRecord({
            supabase,
            r2,
            bucketName: r2BucketName,
            publicBaseUrl: r2PublicUrl,
            sourceExerciseId: exercise.id,
            relativePath: exercise.gif_url,
            overwriteMedia: options.overwriteMedia,
            dryRun: options.dryRun,
          })

      const exerciseResult = await upsertExercise({
        supabase,
        exercise,
        thumbnailMediaId: thumbnailMedia?.id || null,
        openai,
        translationCache,
        translationCachePath: options.translationCachePath,
        dryRun: options.dryRun,
      })

      const tutorialSteps = buildTutorialSteps(exercise)

      if (exerciseResult.exerciseId) {
        await syncTutorial({
          supabase,
          exerciseId: exerciseResult.exerciseId,
          tutorialMediaId: tutorialMedia?.id || null,
          steps: tutorialSteps,
          dryRun: options.dryRun,
        })
      }

      summary.processed += 1
      summary[exerciseResult.action === 'insert' ? 'inserted' : 'updated'] += 1

      console.log(
        `[import] ${exerciseResult.action.toUpperCase()} ${exercise.id} ${exerciseResult.payload.name} | muscles=${exerciseResult.payload.muscle_group.join(', ')} | equipment=${exerciseResult.payload.equipment.join(', ')}`
      )
    } catch (error) {
      summary.failed += 1
      console.error(`[import] ERROR ${exercise.id}:`, error instanceof Error ? error.message : error)

      if (!options.continueOnError) {
        throw error
      }
    }
  }

  console.log('[import] resumen final:', summary)
}

main().catch((error) => {
  console.error('[import] fallo fatal:', error)
  process.exitCode = 1
})
