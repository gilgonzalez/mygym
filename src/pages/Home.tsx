import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Workout } from '../types/database'
import WorkoutCard from '../components/WorkoutCard'

export default function Home() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    fetchWorkouts()
  }, [user])

  const fetchWorkouts = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const { data: following } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = following?.map(f => f.following_id) || []
      followingIds.push(user.id)

      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          user:users(*),
          sections(
            *,
            exercises(*)
          )
        `)
        .in('user_id', followingIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const workoutsWithLikes = await Promise.all(
        (data || []).map(async (workout: any) => {
          const { count } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('workout_id', workout.id)

          const { data: userLike } = await supabase
            .from('likes')
            .select('*')
            .eq('workout_id', workout.id)
            .eq('user_id', user.id)
            .single()

          return {
            ...workout,
            likes_count: count || 0,
            is_liked: !!userLike
          }
        })
      )

      setWorkouts(workoutsWithLikes)
    } catch (error) {
      console.error('Error fetching workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (workouts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="bg-white rounded-lg shadow p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to FitShare!</h2>
          <p className="text-gray-600 mb-6">
            Follow other users to see their workouts in your feed, or start by exploring public workouts.
          </p>
          <a
            href="/explore"
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
          >
            Explore Workouts
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {workouts.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} />
        ))}
      </div>
    </div>
  )
}