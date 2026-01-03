'use client'

import { useState } from 'react'
import WorkoutCard from '@/components/WorkoutCard'
import { Button } from '@/components/Button'
import { Loader2, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getWorkoutsAction } from '../actions/workout/list'
import { WORKOUT_TAGS } from '@/constants/workout-tags'
import { Input } from '@/components/ui/input'

export default function Page() {
  const [tagSearch, setTagSearch] = useState('')
  const [showAllTags, setShowAllTags] = useState(false)

  const filteredTags = tagSearch
    ? WORKOUT_TAGS.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()))
    : (showAllTags ? WORKOUT_TAGS : WORKOUT_TAGS.slice(0, 20))

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
    <div className="container mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Feed Column */}
      <div className="lg:col-span-8 space-y-6">
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

      
      {/* Sidebar Column (Optional - for trending tags, suggested users, etc.) */}
      <div className="hidden lg:block lg:col-span-4 space-y-6">
         <div className="sticky top-24 p-6 rounded-xl border bg-card text-card-foreground shadow-sm max-h-[calc(100vh-8rem)] flex flex-col">
            <h3 className="font-semibold mb-4 shrink-0 flex items-center gap-2">
              GiGo Tags
              <span className="text-xs font-normal text-muted-foreground ml-auto">{WORKOUT_TAGS.length} tags</span>
            </h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter tags..."
                className="pl-8 h-9"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 overflow-y-auto custom-scrollbar pr-2 min-h-[100px] content-start">
                {filteredTags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs cursor-pointer hover:bg-primary/20 transition-colors whitespace-nowrap border border-transparent hover:border-primary/20">
                        #{tag.replace(/\s+/g, '')}
                    </span>
                ))}
                {filteredTags.length === 0 && (
                  <p className="text-sm text-muted-foreground w-full text-center py-4">No tags found matching "{tagSearch}"</p>
                )}
            </div>

            {!tagSearch && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-4 w-full text-muted-foreground hover:text-primary gap-2"
                onClick={() => setShowAllTags(!showAllTags)}
              >
                {showAllTags ? (
                  <>Show Less <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>Show More ({WORKOUT_TAGS.length - 20} more) <ChevronDown className="h-4 w-4" /></>
                )}
              </Button>
            )}
         </div>
      </div>
    </div>
  )
}