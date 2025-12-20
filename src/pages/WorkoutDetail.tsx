import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Workout } from '../types/database'
import { Heart, Clock, BarChart, User, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [likesCount, setLikesCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    if (id) {
      fetchWorkout()
    }
  }, [id])

  const fetchWorkout = async () => {
    try {
      setLoading(true)
      
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
        .eq('id', id)
        .single()

      if (error) throw error

      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('workout_id', id)

      let isLiked = false
      if (user) {
        const { data: userLike } = await supabase
          .from('likes')
          .select('*')
          .eq('workout_id', id)
          .eq('user_id', user.id)
          .single()
        isLiked = !!userLike
      }

      setWorkout(data)
      setLikesCount(count || 0)
      setIsLiked(isLiked)
    } catch (error) {
      console.error('Error fetching workout:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user || !workout) return

    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('workout_id', workout.id)
          .eq('user_id', user.id)
        
        setIsLiked(false)
        setLikesCount(prev => prev - 1)
      } else {
        await supabase
          .from('likes')
          .insert({
            workout_id: workout.id,
            user_id: user.id
          })
        
        setIsLiked(true)
        setLikesCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100'
      case 'intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cardio': return 'text-blue-600 bg-blue-100'
      case 'strength': return 'text-purple-600 bg-purple-100'
      case 'flexibility': return 'text-green-600 bg-green-100'
      case 'mixed': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Workout not found</h2>
        <Link to="/" className="text-blue-600 hover:text-blue-700">
          Back to feed
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/" className="flex items-center text-blue-600 hover:text-blue-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to feed
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                {workout.user?.avatar_url ? (
                  <img
                    src={workout.user.avatar_url}
                    alt={workout.user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{workout.user?.name}</h3>
                <p className="text-sm text-gray-500">@{workout.user?.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {workout.duration_minutes && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {workout.duration_minutes}min
                </div>
              )}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{workout.title}</h1>
          {workout.description && (
            <p className="text-gray-600 mb-6 text-lg">{workout.description}</p>
          )}

          <div className="flex items-center space-x-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(workout.category)}`}>
              {workout.category.charAt(0).toUpperCase() + workout.category.slice(1)}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(workout.difficulty)}`}>
              {workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1)}
            </span>
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-colors ${
                isLiked
                  ? 'text-red-600 bg-red-100 hover:bg-red-200'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>
          </div>
        </div>

        {workout.sections && workout.sections.length > 0 && (
          <div className="border-t bg-gray-50 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <BarChart className="w-5 h-5 mr-2 text-gray-500" />
              Workout Sections
            </h2>
            <div className="space-y-6">
              {workout.sections.map((section) => (
                <div key={section.id} className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{section.name}</h3>
                  <div className="space-y-3">
                    {section.exercises?.map((exercise) => (
                      <div key={exercise.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="font-medium text-gray-900">{exercise.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {exercise.type === 'repetitions' && exercise.repetitions && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {exercise.repetitions} repetitions
                            </span>
                          )}
                          {exercise.type === 'time' && exercise.duration_seconds && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              {exercise.duration_seconds} seconds
                            </span>
                          )}
                          {exercise.type === 'rest' && exercise.duration_seconds && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Rest: {exercise.duration_seconds}s
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}