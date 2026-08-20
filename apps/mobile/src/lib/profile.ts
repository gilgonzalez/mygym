import { computeEffectiveStreak, type FeelingType, type StreakInfo } from '@mygym/shared'
import type { Database } from '@mygym/shared/types/database'

import { supabase } from './supabase'

export interface UserAttributes {
  strength: number
  agility: number
  endurance: number
  wisdom: number
}

export interface UserStats {
  level: number
  currentXp: number
  nextLevelXp: number
  streakCurrent: number
  streakLongest: number
  // Derivado de streakCurrent + lastActivityDate en el cliente (ver
  // computeEffectiveStreak en @mygym/shared) — streakCurrent solo se
  // corrige server-side la próxima vez que se completa un workout, así que
  // por sí solo puede mostrar una racha "congelada" que ya se rompió.
  streakInfo: StreakInfo
  totalWorkouts: number
  totalMinutes: number
  rankTitle: string
  attributes: UserAttributes
}

export interface UserProfile {
  id: string
  username: string | null
  name: string | null
  avatarUrl: string | null
  bio: string | null
  birthDate: string | null
  heightCm: number | null
  goals: string[]
  achievements: string | null
  stats: UserStats
}

const DEFAULT_ATTRIBUTES: UserAttributes = { strength: 0, agility: 0, endurance: 0, wisdom: 0 }

const DEFAULT_STATS: Omit<UserStats, 'streakInfo'> = {
  level: 1,
  currentXp: 0,
  nextLevelXp: 1000,
  streakCurrent: 0,
  streakLongest: 0,
  totalWorkouts: 0,
  totalMinutes: 0,
  rankTitle: 'Novato',
  attributes: DEFAULT_ATTRIBUTES,
}

function parseAttributes(json: unknown): UserAttributes {
  if (!json || typeof json !== 'object') return DEFAULT_ATTRIBUTES
  const raw = json as Record<string, unknown>
  return {
    strength: Number(raw.strength) || 0,
    agility: Number(raw.agility) || 0,
    endurance: Number(raw.endurance) || 0,
    wisdom: Number(raw.wisdom) || 0,
  }
}

const USER_SELECT = 'id, username, name, avatar_url, bio, birth_date, height_cm, goals, achievements'

// Puerto de getUserStatsAction (apps/web, src/app/actions/user/getStats.ts)
// + el fetch de la fila de `users` que ya hace lib/workouts.ts para cada
// autor de workout, sumando los campos de perfil nuevos (bio, fecha de
// nacimiento, altura, metas, logros — ver migración
// 20260820_0001_extend_user_profile.sql). PGRST116 ("no rows") es esperable
// para una cuenta recién creada que todavía no tiene fila en user_stats (se
// crea con el primer workout completado) — no es un error real, cae a
// DEFAULT_STATS.
export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const [userResult, statsResult] = await Promise.all([
    supabase.from('users').select(USER_SELECT).eq('id', userId).single(),
    supabase.from('user_stats').select('*').eq('user_id', userId).single(),
  ])

  if (userResult.error) throw userResult.error
  if (statsResult.error && statsResult.error.code !== 'PGRST116') throw statsResult.error

  const row = statsResult.data
  const streakCurrent = row?.streak_current ?? DEFAULT_STATS.streakCurrent
  const stats: UserStats = {
    level: row?.level ?? DEFAULT_STATS.level,
    currentXp: row?.current_xp ?? DEFAULT_STATS.currentXp,
    nextLevelXp: row?.next_level_xp ?? DEFAULT_STATS.nextLevelXp,
    streakCurrent,
    streakLongest: row?.streak_longest ?? DEFAULT_STATS.streakLongest,
    streakInfo: computeEffectiveStreak(row?.last_activity_date ?? null, streakCurrent),
    totalWorkouts: row?.total_workouts ?? DEFAULT_STATS.totalWorkouts,
    totalMinutes: row?.total_minutes ?? DEFAULT_STATS.totalMinutes,
    rankTitle: row?.rank_title ?? DEFAULT_STATS.rankTitle,
    attributes: parseAttributes(row?.attributes),
  }

  return {
    id: userResult.data.id,
    username: userResult.data.username,
    name: userResult.data.name,
    avatarUrl: userResult.data.avatar_url,
    bio: userResult.data.bio,
    birthDate: userResult.data.birth_date,
    heightCm: userResult.data.height_cm,
    goals: userResult.data.goals ?? [],
    achievements: userResult.data.achievements,
    stats,
  }
}

// ---------------------------------------------------------------------------
// Edición de perfil (menú de cuenta → "Editar información", ver
// app/edit-profile.tsx) — update directo a Supabase protegido por la RLS
// "Users update own profile" (auth.uid() = id), ya existía antes de esta
// migración. Objeto parcial: solo se mandan los campos que cambiaron.
export interface UpdateProfileInput {
  name?: string | null
  bio?: string | null
  birthDate?: string | null
  heightCm?: number | null
  goals?: string[]
  achievements?: string | null
}

type UsersUpdate = Database['public']['Tables']['users']['Update']

export async function updateUserProfile(userId: string, input: UpdateProfileInput): Promise<void> {
  const payload: UsersUpdate = {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.bio !== undefined && { bio: input.bio }),
    ...(input.birthDate !== undefined && { birth_date: input.birthDate }),
    ...(input.heightCm !== undefined && { height_cm: input.heightCm }),
    ...(input.goals !== undefined && { goals: input.goals }),
    ...(input.achievements !== undefined && { achievements: input.achievements }),
  }

  const { error } = await supabase.from('users').update(payload).eq('id', userId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Registro de peso (tab "Cuenta" → "Registrar peso") — tabla propia en vez
// de una columna en users porque acá sí hace falta el historial, no solo el
// último valor (ver weight_logs en la migración).
export interface WeightEntry {
  id: string
  weightKg: number
  loggedAt: string
}

const WEIGHT_HISTORY_LIMIT = 20

export async function fetchWeightHistory(userId: string): Promise<WeightEntry[]> {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('id, weight_kg, logged_at')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(WEIGHT_HISTORY_LIMIT)

  if (error) throw error
  return (data ?? []).map((row) => ({ id: row.id, weightKg: row.weight_kg, loggedAt: row.logged_at }))
}

export async function logWeight(userId: string, weightKg: number, loggedAt?: string): Promise<void> {
  const { error } = await supabase.from('weight_logs').insert({
    user_id: userId,
    weight_kg: weightKg,
    logged_at: loggedAt ?? new Date().toISOString().slice(0, 10),
  })
  if (error) throw error
}

export async function deleteWeightEntry(id: string): Promise<void> {
  const { error } = await supabase.from('weight_logs').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Tab "Actividad" del perfil (ver components/profile/ActivityTab.tsx): un
// calendario tipo GitHub (manchas por día según cuántas sesiones se
// completaron) + una lista con scroll infinito de esas mismas sesiones, de
// más reciente a más antigua. No tiene equivalente directo en la web: ahí
// ActivityHeatmap.tsx solo pide un mes a la vez (ver getWorkoutLogsAction) y
// no existe la lista con scroll infinito — las dos funciones de acá son
// nuevas, no un puerto.

export interface WorkoutLogEntry {
  id: string
  workoutId: string | null
  workoutTitle: string
  workoutCover: string | null
  completedAt: string
  durationSeconds: number
  xpEarned: number
  feeling: FeelingType | null
  rating: number | null
  notes: string | null
}

export interface WorkoutLogsPage {
  entries: WorkoutLogEntry[]
  hasMore: boolean
}

export const WORKOUT_LOGS_PAGE_SIZE = 5

export async function fetchWorkoutLogsPage(
  userId: string,
  page: number,
  dayFilter?: string
): Promise<WorkoutLogsPage> {
  const from = (page - 1) * WORKOUT_LOGS_PAGE_SIZE
  const to = from + WORKOUT_LOGS_PAGE_SIZE - 1

  let query = supabase
    .from('workout_logs')
    .select('id, workout_id, completed_at, duration_seconds, xp_earned, feeling, rating, notes, workouts(title, cover)')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)

  // Filtro por día (ver ActivityTab.tsx: tocar un día del heatmap filtra el
  // historial a ese día puntual) — completed_at es timestamptz, así que se
  // acota con [00:00, 00:00 del día siguiente) en vez de comparar por
  // igualdad. dayFilter es una key UTC (YYYY-MM-DD), igual que la que arma
  // ActivityHeatmap.tsx para los buckets del calendario.
  if (dayFilter) {
    const dayStart = new Date(`${dayFilter}T00:00:00.000Z`)
    const dayEnd = new Date(dayStart)
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)
    query = query.gte('completed_at', dayStart.toISOString()).lt('completed_at', dayEnd.toISOString())
  }

  const { data, error } = await query.order('completed_at', { ascending: false }).range(from, to)

  if (error) throw error

  const rows = data ?? []
  const entries: WorkoutLogEntry[] = rows.map((row) => {
    // El join 1:1 vía FK (workout_logs_workout_id_fkey) puede venir null si
    // el workout se borró — mismo caso que contempla comments_count en
    // lib/workouts.ts.
    const workout = row.workouts as { title: string; cover: string | null } | null
    return {
      id: row.id,
      workoutId: row.workout_id,
      workoutTitle: workout?.title ?? 'Workout eliminado',
      workoutCover: workout?.cover ?? null,
      completedAt: row.completed_at as string,
      durationSeconds: row.duration_seconds ?? 0,
      xpEarned: row.xp_earned ?? 0,
      feeling: row.feeling as WorkoutLogEntry['feeling'],
      rating: row.rating,
      notes: row.notes,
    }
  })

  return { entries, hasMore: rows.length === WORKOUT_LOGS_PAGE_SIZE }
}

// Solo las fechas (para el grid de calendario, que arma los buckets por día
// él mismo — ver components/profile/ActivityHeatmap.tsx) entre sinceISO y
// untilISO. El calendario navega mes a mes (ver ActivityTab.tsx), así que
// esto se llama una vez por mes visto, no una sola vez para todo el
// historial — separado de fetchWorkoutLogsPage porque el historial pagina
// de a 5 y esto necesita el mes completo de una.
export async function fetchCompletedDates(userId: string, sinceISO: string, untilISO?: string): Promise<string[]> {
  let query = supabase
    .from('workout_logs')
    .select('completed_at')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .gte('completed_at', sinceISO)

  if (untilISO) query = query.lt('completed_at', untilISO)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => row.completed_at).filter((value): value is string => Boolean(value))
}
