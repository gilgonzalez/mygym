'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleWorkoutLikeAction(
  workoutId: string
): Promise<{ success: boolean; liked?: boolean; likesCount?: number; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: liked, error: rpcError } = await supabase.rpc('toggle_workout_like', {
      p_workout_id: workoutId,
    })

    if (rpcError) throw rpcError

    const { count: likesCount, error: countError } = await supabase
      .from('workout_likes')
      .select('*', { count: 'exact', head: true })
      .eq('workout_id', workoutId)

    if (countError) throw countError

    return {
      success: true,
      liked: liked as boolean,
      likesCount: likesCount ?? 0,
    }
  } catch (error: any) {
    console.error('Error toggling workout like:', error)
    return { success: false, error: error.message }
  }
}
