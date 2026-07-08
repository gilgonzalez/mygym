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
    <div className="mx-auto flex w-full max-w-7xl justify-center px-4 py-6 sm:px-6">
      {/* Main Feed Column */}
      <div className="w-full max-w-5xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-green-500 via-green-600 to-slate-900 dark:from-emerald-700  dark:to-slate-400 bg-clip-text text-transparent">
            Discover Workouts
          </h1>
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg self-start sm:self-auto">
             <Button variant="ghost" size="sm" className="text-xs sm:text-sm text-muted-foreground hover:text-primary hover:bg-background shadow-none hover:shadow-sm transition-all h-8 sm:h-9">Newest</Button>
             <Button variant="ghost" size="sm" className="text-xs sm:text-sm text-muted-foreground hover:text-primary hover:bg-background shadow-none hover:shadow-sm transition-all h-8 sm:h-9">Popular</Button>
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

      
    </div>
  )
}
