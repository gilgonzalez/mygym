import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Workout } from '../types/database'
import WorkoutCard from '../components/WorkoutCard'
import { Search, Filter } from 'lucide-react'

export default function Explore() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const { user } = useAuthStore()

  const categories = ['cardio', 'strength', 'flexibility', 'mixed']
  const difficulties = ['beginner', 'intermediate', 'advanced']

  useEffect(() => {
    fetchWorkouts()
  }, [searchTerm, selectedCategory, selectedDifficulty])

  const fetchWorkouts = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('workouts')
        .select(`
          *,
          user:users(*),
          sections(
            *,
            exercises(*)
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }

      if (selectedDifficulty) {
        query = query.eq('difficulty', selectedDifficulty)
      }

      const { data, error } = await query

      if (error) throw error

      const workoutsWithLikes = await Promise.all(
        (data || []).map(async (workout: any) => {
          const { count } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('workout_id', workout.id)

          let isLiked = false
          if (user) {
            const { data: userLike } = await supabase
              .from('likes')
              .select('*')
              .eq('workout_id', workout.id)
              .eq('user_id', user.id)
              .single()
            isLiked = !!userLike
          }

          return {
            ...workout,
            likes_count: count || 0,
            is_liked: isLiked
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

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedDifficulty('')
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-10 bg-gray-200 rounded-lg w-full mb-4 animate-pulse"></div>
          <div className="flex space-x-4 mb-4">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Explore Workouts</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search workouts by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Difficulties</option>
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>

            {(searchTerm || selectedCategory || selectedDifficulty) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {workouts.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg shadow p-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts found</h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or explore all workouts.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      )}
    </div>
  )
}