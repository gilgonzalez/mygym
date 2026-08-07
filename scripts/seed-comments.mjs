import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const SUPABASE_URL = 'https://kbjdrsfrfgtyyntfxfns.supabase.co'
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamRyc2ZyZmd0eXludGZ4Zm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNzMzMiwiZXhwIjoyMDgxNzEzMzMyfQ.xs9hoE3Of2vZluw8zypQNIZSO5RbAq1TsmWOG67Vfmo'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const USER_IDS = [
  'ad7a5153-13b8-4654-998a-ce2855827760',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  'fd4c358d-7cf7-410e-9637-1a95bd5bbd7a',
  '8c6fa2b8-d6f2-4fe0-ba5f-d611a03e9c10',
  '2b63294f-4ee1-408f-a5b4-fd18735dcc2b',
  '1e51d5c5-953a-48f7-9d1d-117b46e7b07c',
  'a1da6c4b-2cf4-4cb4-bda2-0a96b3e072c1',
  'fae21569-1c7c-449d-9677-208956d03694',
  'ce417d21-d96a-4f87-be81-96cd31203631',
]

const AMRAP_WORKOUT_ID = '6fc70cbf-b12d-4014-a490-42c68260e8ca'
const AMRAP_TIME_CAP = 1200
const AMRAP_WORKOUT_USER_OWNER = 'fd4c358d-7cf7-410e-9637-1a95bd5bbd7a'

const WORKOUT_IDS_NORMAL = [
  '35a67602-b125-4dae-b05c-f2c4f488f928',
  'a84c278d-1b6a-468c-b917-d01b8643569b',
  'cf87c5c5-3e6f-412b-93aa-b5a2bea462e6',
  '267f01f7-4fde-49a0-8360-200c0c102d1f',
  '2ed83c07-d8cb-4d27-8daf-91c15bf0daf4',
  '8be6908e-efd2-4587-ad00-5df50312d870',
  'a3e12b83-b373-4d29-9147-c46f82509195',
  '174cd6ca-0c8d-41b5-9107-4a138baa987c',
  '0c8c8c94-b2af-467e-8ad8-d9f84130d74b',
  '36bfdbdb-1d6d-4da9-bb2f-d8f66784320e',
  'ca9dd1b0-b3a7-4688-a494-e53a7fe4c3d2',
  '3f10b051-680a-4d75-b81b-5e16c027b7a9',
  '9aa3a82d-fcfb-422f-8ac7-fa140c658a6b',
  'a31e280c-c251-4d3e-a745-f1db538f8068',
  'cae1f1ad-6793-4a27-9816-2beaa6cf9b84',
  'ae8a38e9-c48c-4259-a647-21358fc6be53',
  'bcf8d0c3-ab19-45dd-8b22-1d894b17ee41',
  '3c0a3000-a3ad-4ee0-99fc-5b776289da42',
  'a68ff6df-c3b6-4afa-93c3-f8fda5b72a83',
  'c0c1fe73-e5cc-45a4-bbad-47c3f6a7d5b2',
  '9cc3a779-eb8a-4044-b7e5-db751265e7a9',
  '2f70ad74-b10a-457f-b6e8-0c7190d60aaa',
  '37a69f72-bc33-4a74-b16e-0200ee166c50',
]

const COMMENT_TEMPLATES = [
  'Increíble rutina! La parte de pecho me dejó tirado. Volveré a repetirla seguro.',
  'Muy buen trabajo con esta estructura. Los descansos cortos hacen que todo sea más intenso. Gracias!',
  'Me encanta el diseño. Los superseries son un puntazo. Terminé completamente agotado.',
  '10/10. Los ejercicios compuestos están muy bien colocados. Progreso semanal asegurado.',
  'Un clásico. Sencillo pero efectivo. Perfecto para días con poco tiempo.',
  'El WOD de hoy brutal. El último set de sentadillas fue guerra pura. Ánimo equipo!',
  'Excelente selección de ejercicios. Trabaja todo el cuerpo sin dejar lagunas.',
  'Rápido e intenso. Justo lo que necesitaba. El último AMRAP era de locura.',
  'Mucho volumen pero se agradece. Sentí cada grupo muscular trabajado al 100%.',
  'Rutina muy completa. Me ha gustado mucho la progresión de peso. Recomendada.',
  'La variedad de ejercicios hace que no se haga monótona en ningún momento. Top!',
  'Perfecta para principiantes pero con espacio para progresar. Muy buen diseño.',
  'Terminé sudando tinta. Ese circuito final no es ninguna broma. GRANDE creador!',
  'Ideal para un día de intensidad media. He disfrutado mucho de la secuencia.',
  'De mis favoritas ya. La combinación de fuerzas + cardio es la muerte. 💪',
  'Sencilla, corta y efectiva. Es lo que busco en un entrenamiento diario.',
  'Me ha sorprendido gratamente. Los últimos dropsets son una pasada.',
  'Entrenamiento muy equilibrado. No se hace pesado a pesar de la duración.',
  'Vaya pasada. Me encanta cuando las rutinas están tan bien estructuradas.',
  'Increíble bombeo en bíceps y hombros. La separación muscular se nota ya.',
]

const FEELINGS = ['tired', 'sad', 'normal', 'happy', 'pumped']
const RATINGS = [3, 4, 5, 4, 5, 5, 4, 3, 5, 4]

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function daysAgoISO(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))
  return d.toISOString()
}

function formatSeconds(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

async function seed() {
  console.log('🚀 Seed comentarios iniciado...\n')

  const logsToInsert = []
  const challengeResultsToInsert = []

  let totalLogs = 0
  let totalChallenge = 0

  for (const userId of USER_IDS) {
    const workoutsForUser = [...WORKOUT_IDS_NORMAL].sort(() => Math.random() - 0.5).slice(0, 4)

    for (let i = 0; i < workoutsForUser.length; i++) {
      const workoutId = workoutsForUser[i]
      const logId = randomUUID()
      const duration = 15 * 60 + Math.floor(Math.random() * 60 * 45)
      const xp = Math.round(duration / 60) * 5 + 50
      const hasNotes = Math.random() > 0.2
      const notes = hasNotes ? pickRandom(COMMENT_TEMPLATES) : null
      const rating = hasNotes ? pickRandom(RATINGS) : null
      const feeling = hasNotes ? pickRandom(FEELINGS) : null
      const completedAt = daysAgoISO(Math.floor(Math.random() * 14) + 1)

      logsToInsert.push({
        id: logId,
        user_id: userId,
        workout_id: workoutId,
        completed_at: completedAt,
        duration_seconds: duration,
        xp_earned: xp,
        notes,
        rating,
        feeling,
      })
      totalLogs++
    }

    const amrapLogId = randomUUID()
    const rounds = 3 + Math.floor(Math.random() * 10)
    const extraReps = Math.floor(Math.random() * 25)
    const score = rounds + extraReps
    const bestScoresPerUser = {}
    bestScoresPerUser[userId] = Math.max(bestScoresPerUser[userId] || 0, score)

    for (let run = 0; run < (userId === AMRAP_WORKOUT_USER_OWNER ? 3 : 2); run++) {
      const runLogId = run === 0 ? amrapLogId : randomUUID()
      const runRounds = 3 + Math.floor(Math.random() * 10)
      const runExtra = Math.floor(Math.random() * 25)
      const runScore = runRounds + runExtra
      const duration = AMRAP_TIME_CAP
      const xp = 250 + Math.floor(Math.random() * 300)
      const notes = pickRandom(COMMENT_TEMPLATES)
      const rating = pickRandom(RATINGS)
      const feeling = runScore > 15 ? pickRandom(['happy', 'pumped', 'pumped']) : pickRandom(FEELINGS)
      const completedAt = daysAgoISO(Math.floor(Math.random() * 10) + 1 + run * 2)

      logsToInsert.push({
        id: runLogId,
        user_id: userId,
        workout_id: AMRAP_WORKOUT_ID,
        completed_at: completedAt,
        duration_seconds: duration,
        xp_earned: xp,
        notes,
        rating,
        feeling,
      })
      totalLogs++

      challengeResultsToInsert.push({
        workout_log_id: runLogId,
        workout_id: AMRAP_WORKOUT_ID,
        user_id: userId,
        mode: 'amrap_section',
        rounds_completed: runRounds,
        extra_reps: runExtra,
        score: runScore,
        time_cap_seconds: AMRAP_TIME_CAP,
        is_pr: false,
      })
      totalChallenge++
    }
  }

  const userBestScore = {}
  for (const r of challengeResultsToInsert) {
    if (!userBestScore[r.user_id]) userBestScore[r.user_id] = 0
    userBestScore[r.user_id] = Math.max(userBestScore[r.user_id], r.score)
  }

  for (const r of challengeResultsToInsert) {
    if (r.score === userBestScore[r.user_id]) {
      r.is_pr = true
    }
  }

  console.log(`📝 A insertar ${totalLogs} workout_logs y ${totalChallenge} workout_challenge_results`)

  const chunk = 200
  for (let i = 0; i < logsToInsert.length; i += chunk) {
    const batch = logsToInsert.slice(i, i + chunk)
    const { data, error } = await supabase.from('workout_logs').insert(batch)
    if (error) {
      console.error('❌ Error insertando workout_logs (batch):', error.message)
      console.error('Detalles:', JSON.stringify(error, null, 2))
      process.exit(1)
    }
    process.stdout.write(`  ✅ workout_logs lote ${Math.floor(i / chunk) + 1}/${Math.ceil(logsToInsert.length / chunk)} insertado\r`)
  }
  console.log('\n')

  for (let i = 0; i < challengeResultsToInsert.length; i += chunk) {
    const batch = challengeResultsToInsert.slice(i, i + chunk)
    const { data, error } = await supabase.from('workout_challenge_results').insert(batch)
    if (error) {
      console.error('❌ Error insertando workout_challenge_results (batch):', error.message)
      console.error('Detalles:', JSON.stringify(error, null, 2))
      process.exit(1)
    }
    process.stdout.write(`  ✅ workout_challenge_results lote ${Math.floor(i / chunk) + 1}/${Math.ceil(challengeResultsToInsert.length / chunk)} insertado\r`)
  }
  console.log('\n')

  const { count: logsCount, error: lcError } = await supabase
    .from('workout_logs')
    .select('*', { count: 'exact', head: true })
  const { count: commentsCount, error: ccError } = await supabase
    .from('workout_logs')
    .select('*', { count: 'exact', head: true })
    .not('notes', 'is', null)
    .neq('notes', '')
  const { count: challengeCount, error: chError } = await supabase
    .from('workout_challenge_results')
    .select('*', { count: 'exact', head: true })

  console.log('📊 Resumen final:')
  console.log(`  • Total workout_logs en DB: ${logsCount ?? 'N/A'}`)
  console.log(`  • Total workout_logs CON comentario: ${commentsCount ?? 'N/A'}`)
  console.log(`  • Total workout_challenge_results en DB: ${challengeCount ?? 'N/A'}`)

  console.log('\n🎯 Seed completado con éxito!')
}

seed().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
