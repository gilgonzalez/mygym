'use client'

import { useEffect, useState } from 'react'
import WorkoutCard from '@/components/WorkoutCard'
import { Workout, WorkoutApiResponse } from '@/types/workout/composite'
import { Button } from '@/components/Button'
import { Loader2 } from 'lucide-react'

export default function Page() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const response = await fetch('/api/workouts')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('API Error Details:', errorData)
          throw new Error(errorData.error || `Failed to fetch workouts: ${response.status} ${response.statusText}`)
        }
        const data: WorkoutApiResponse[] = await response.json()
        
        // Transform API response to UI model
        const transformedWorkouts: Workout[] = data.map(workout => ({
          ...workout,
          user: workout.workout_user?.user || { id: workout.user_id, name: 'Unknown User', username: 'unknown', avatar_url: null },
          sections: workout.workout_sections
            .sort((a, b) => a.order_index - b.order_index)
            .map(ws => ({
              ...ws.sections,
              exercises: ws.sections.section_exercises
                .sort((a, b) => a.order_index - b.order_index)
                .map(se => ({
                  ...se.exercises,
                  sets: se.sets,
                  reps: se.reps,
                  rest: se.rest_seconds,
                  weight_kg: se.weight_kg,
                  duration: se.duration_seconds
                }))
            }))
        }))

        setWorkouts(transformedWorkouts)
      } catch (err) {
        console.error('Error fetching workouts:', err)
        setError('Failed to load workouts')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkouts()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Feed Column */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-500 via-green-600 to-slate-900 dark:from-emerald-700 via-emerald-400 dark:to-slate-400 bg-clip-text text-transparent">
            Discover Workouts
          </h1>
          <div className="flex gap-2">
             <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">Newest</Button>
             <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">Popular</Button>
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          {workouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
          {workouts.length === 0 && (
            <p className="text-muted-foreground text-center py-10">No public workouts found.</p>
          )}
        </div>
      </div>

      
      {/* Sidebar Column (Optional - for trending tags, suggested users, etc.) */}
      <div className="hidden lg:block lg:col-span-4 space-y-6">
         <div className="sticky top-24 p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <h3 className="font-semibold mb-4">Trending Topics</h3>
            <div className="flex flex-wrap gap-2">
                {['#SummerBody', '#HIIT', '#YogaLife', '#Bulking', '#Calisthenics'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs cursor-pointer hover:bg-primary/20 transition-colors">
                        {tag}
                    </span>
                ))}
            </div>
         </div>
      </div>
    </div>
  )
}