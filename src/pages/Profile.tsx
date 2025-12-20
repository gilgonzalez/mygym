import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Workout } from '../types/database'
import WorkoutCard from '../components/WorkoutCard'
import { User as UserIcon, Calendar, Trash2, Edit } from 'lucide-react'

export default function Profile() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      fetchUserWorkouts()
    }
  }, [user])

  const fetchUserWorkouts = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          sections(
            *,
            exercises(*)
          )
        `)
        .eq('user_id', user.id)
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
      console.error('Error fetching user workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return

    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)

      if (error) throw error

      setWorkouts(workouts.filter(w => w.id !== workoutId))
    } catch (error) {
      console.error('Error deleting workout:', error)
      alert('Error deleting workout')
    }
  }

  if (!user) {
    return <div className="text-center py-8">Please log in to view your profile.</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <UserIcon className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">@{user.username}</p>
            {user.bio && <p className="text-gray-700 mt-2">{user.bio}</p>}
            <div className="flex items-center text-sm text-gray-500 mt-2">
              <Calendar className="w-4 h-4 mr-1" />
              Joined {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{workouts.length}</div>
            <div className="text-sm text-gray-600">Workouts</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Followers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Following</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">My Workouts</h2>
        <a
          href="/create-workout"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Create New Workout
        </a>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
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
      ) : workouts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first workout to share with the community!
          </p>
          <a
            href="/create-workout"
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
          >
            Create Your First Workout
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {workouts.map((workout) => (
            <div key={workout.id} className="relative">
              <WorkoutCard workout={workout} />
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={() => deleteWorkout(workout.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  title="Delete workout"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}