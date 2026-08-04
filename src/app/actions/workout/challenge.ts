'use server'

export type WorkoutChallengeInput = {
  mode: 'amrap_section'
  challenge_section_index: number
  time_cap_seconds: number
  score_type: 'rounds_plus_reps'
}

export type WorkoutChallengeResultInput = {
  mode: 'amrap_section'
  roundsCompleted: number
  extraReps: number
  score: number
  timeCapSeconds: number
}

export async function syncWorkoutChallengeConfig(
  supabase: any,
  workoutId: string,
  challenge?: WorkoutChallengeInput | null
) {
  if (!challenge) {
    const { error } = await supabase
      .from('workout_challenges')
      .delete()
      .eq('workout_id', workoutId)

    if (error) {
      throw new Error(error.message)
    }

    return
  }

  const { data: workoutSections, error: sectionError } = await supabase
    .from('workout_sections')
    .select('section_id, order_index')
    .eq('workout_id', workoutId)
    .order('order_index', { ascending: true })

  if (sectionError) {
    throw new Error(sectionError.message)
  }

  const matchedSection = (workoutSections || []).find(
    (workoutSection: { section_id: string; order_index: number }) => workoutSection.order_index === challenge.challenge_section_index
  )

  if (!matchedSection?.section_id) {
    throw new Error('No se pudo resolver la section del reto')
  }

  const { error } = await supabase
    .from('workout_challenges')
    .upsert({
      workout_id: workoutId,
      mode: challenge.mode,
      challenge_section_id: matchedSection.section_id,
      time_cap_seconds: challenge.time_cap_seconds,
      score_type: challenge.score_type,
    })

  if (error) {
    throw new Error(error.message)
  }
}
