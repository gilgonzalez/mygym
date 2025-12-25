'use client'

import WorkoutCard from '@/components/WorkoutCard'
import { Button } from '@/components/Button'
import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getWorkoutsAction } from '../actions/workout/list'

export default function Page() {
  const { data: workouts = [], isLoading, error } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const res = await getWorkoutsAction()
      if (!res.success) throw new Error(res.error)
      return res.data || []
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-destructive">
        {JSON.stringify(error)}
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