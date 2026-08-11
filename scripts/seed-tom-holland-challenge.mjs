import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import WebSocket from 'ws'

const SUPABASE_URL = 'https://kbjdrsfrfgtyyntfxfns.supabase.co'
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamRyc2ZyZmd0eXludGZ4Zm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNzMzMiwiZXhwIjoyMDgxNzEzMzMyfQ.xs9hoE3Of2vZluw8zypQNIZSO5RbAq1TsmWOG67Vfmo'

globalThis.WebSocket = WebSocket

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const AMRAP_WORKOUT_ID = '6fc70cbf-b12d-4014-a490-42c68260e8ca'
const AMRAP_TIME_CAP = 1200
const ROUNDS_COMPLETED = 27
const EXTRA_REPS = 0
const SCORE = ROUNDS_COMPLETED + EXTRA_REPS
const CHALLENGE_MESSAGE = 'My best is 27 rounds in 20 minutes. Think you can beat me? I dare you!!'

async function seed() {
  console.log('🕷️ Seed Tom Holland Challenge iniciado...\n')

  // 1. Crear usuario en auth.users (Tom Holland)
  console.log('1️⃣  Creando usuario Tom Holland en auth...')
  let tomUserId = null

  // Primero intentamos buscar si ya existe por email
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', 'tomholland')
    .single()

  if (existingUser) {
    tomUserId = existingUser.id
    console.log(`   ✅ Usuario ya existía con ID: ${tomUserId}`)
  } else {
    // Crear en auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'tom.holland@avengers.com',
      password: 'SpiderMan2026!',
      email_confirm: true,
      user_metadata: {
        name: 'Tom Holland',
        username: 'tomholland',
      },
    })

    if (authError) {
      if (authError.message?.includes('already registered')) {
        // Buscar el usuario por email en auth
        const { data: listData } = await supabase.auth.admin.listUsers()
        const found = listData?.users?.find(u => u.email === 'tom.holland@avengers.com')
        if (found) {
          tomUserId = found.id
          console.log(`   ✅ Usuario ya existía en auth. ID: ${tomUserId}`)
        } else {
          console.error('❌ Error localizando usuario:', authError)
          process.exit(1)
        }
      } else {
        console.error('❌ Error creando usuario auth:', authError)
        process.exit(1)
      }
    } else {
      tomUserId = authData.user.id
      console.log(`   ✅ Usuario auth creado. ID: ${tomUserId}`)
    }
  }

  // 2. Asegurar perfil en public.users
  console.log('\n2️⃣  Asegurando perfil en public.users...')
  const { error: profileError } = await supabase.from('users').upsert({
    id: tomUserId,
    email: 'tom.holland@avengers.com',
    username: 'tomholland',
    name: 'Tom Holland',
    avatar_url: null,
    bio: 'Friendly neighborhood Spider-Man. Just your friendly actor trying to get swole between takes.',
    isPremium: true,
    role: 'USER',
  }, { onConflict: 'id' })

  if (profileError) {
    console.error('❌ Error insertando perfil:', profileError)
    process.exit(1)
  }
  console.log('   ✅ Perfil en public.users OK')

  // 3. Insertar workout_log con el mensaje en notes
  console.log('\n3️⃣  Creando workout_log con el mensaje...')
  const tomLogId = randomUUID()
  const completedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const startedAt = new Date(new Date(completedAt).getTime() - AMRAP_TIME_CAP * 1000).toISOString()

  const { error: logError } = await supabase.from('workout_logs').upsert({
    id: tomLogId,
    user_id: tomUserId,
    workout_id: AMRAP_WORKOUT_ID,
    started_at: startedAt,
    completed_at: completedAt,
    duration_seconds: AMRAP_TIME_CAP,
    xp_earned: 500,
    notes: CHALLENGE_MESSAGE,
    rating: 5,
    feeling: 'pumped',
  }, { onConflict: 'id' })

  if (logError) {
    console.error('❌ Error insertando workout_log:', logError)
    process.exit(1)
  }
  console.log(`   ✅ workout_log creado. ID: ${tomLogId}`)
  console.log(`   💬 Mensaje: "${CHALLENGE_MESSAGE}"`)

  // 4. Insertar workout_challenge_result con 27 rounds
  console.log('\n4️⃣  Creando workout_challenge_result...')
  const { error: challengeError } = await supabase.from('workout_challenge_results').upsert({
    workout_log_id: tomLogId,
    workout_id: AMRAP_WORKOUT_ID,
    user_id: tomUserId,
    mode: 'amrap_section',
    rounds_completed: ROUNDS_COMPLETED,
    extra_reps: EXTRA_REPS,
    score: SCORE,
    time_cap_seconds: AMRAP_TIME_CAP,
    is_pr: true,
    created_at: completedAt,
  }, { onConflict: 'workout_log_id' })

  if (challengeError) {
    console.error('❌ Error insertando workout_challenge_result:', challengeError)
    process.exit(1)
  }
  console.log('   ✅ workout_challenge_result creado')
  console.log(`   🏆 Rounds: ${ROUNDS_COMPLETED} | Score: ${SCORE} | Timecap: ${AMRAP_TIME_CAP / 60}min | PR: true`)

  // 5. Verificar que todo se guardó correctamente
  console.log('\n5️⃣  Verificando datos guardados...')
  const { data: checkData, error: checkError } = await supabase
    .from('workout_challenge_results')
    .select(`
      rounds_completed,
      extra_reps,
      score,
      is_pr,
      users ( name, username ),
      workout_logs ( notes, feeling, rating, duration_seconds )
    `)
    .eq('workout_log_id', tomLogId)
    .single()

  if (checkError || !checkData) {
    console.error('❌ Error verificando:', checkError || 'sin datos')
    process.exit(1)
  }

  console.log('\n📋 Resumen del registro:')
  console.log(`   👤 Usuario: ${checkData.users?.name} (@${checkData.users?.username})`)
  console.log(`   📝 Mensaje: ${checkData.workout_logs?.notes}`)
  console.log(`   🏋️  Rounds: ${checkData.rounds_completed} + ${checkData.extra_reps} reps extra = ${checkData.score} pts`)
  console.log(`   ⭐ Rating: ${checkData.workout_logs?.rating}/5 | Feeling: ${checkData.workout_logs?.feeling}`)
  console.log(`   🏅 Es PR: ${checkData.is_pr ? 'SÍ' : 'NO'}`)
  console.log(`   ⏱️  Duración: ${checkData.workout_logs?.duration_seconds / 60} min`)

  console.log('\n🎯 ¡Todo completado con éxito! El desafío de Tom Holland está listo. 🕸️')
}

seed().catch((e) => {
  console.error('\n❌ FATAL:', e.message || e)
  process.exit(1)
})
