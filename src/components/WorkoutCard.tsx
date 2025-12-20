'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Heart, ChevronDown, Clock, BarChart, User, Play } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Workout } from '../types/database'
import { Card, CardContent, CardFooter, CardHeader } from './Card'
import { Button } from './Button'

interface WorkoutCardProps {
  workout: Workout
}

export default function WorkoutCard({ workout }: WorkoutCardProps) {
  const [likesCount, setLikesCount] = useState(workout.likes_count || 0)
  const [isLiked, setIsLiked] = useState(workout.is_liked || false)
  const { user } = useAuthStore()

  const handleLike = async () => {
    if (!user) return

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
      case 'beginner': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
      case 'intermediate': return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      case 'advanced': return 'text-rose-500 bg-rose-500/10 border-rose-500/20'
      default: return 'text-muted-foreground bg-muted border-muted-foreground/20'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cardio': return 'text-sky-500 bg-sky-500/10 border-sky-500/20'
      case 'strength': return 'text-violet-500 bg-violet-500/10 border-violet-500/20'
      case 'flexibility': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20'
      case 'mixed': return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      default: return 'text-muted-foreground bg-muted border-muted-foreground/20'
    }
  }

  return (
    <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm glow-card hover:border-primary/50 transition-all duration-300 w-full md:aspect-[2/1] flex flex-col md:flex-row">
      {/* Left Column: Info & Details (60%) */}
      <div className="flex flex-col justify-between p-6 md:w-3/5 h-full relative z-10">
        <div>
           {/* User Header */}
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20 transition-transform group-hover:scale-105">
                  {workout.user?.avatar_url ? (
                    <img src={workout.user.avatar_url} alt={workout.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-foreground hover:text-primary cursor-pointer transition-colors duration-300">{workout.user?.name}</span>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider transition-colors duration-300">@{workout.user?.username}</span>
                </div>
              </div>
           </div>

           {/* Main Content */}
           <div className="space-y-3">
              <h4 className="text-2xl font-bold leading-tight tracking-tight text-foreground group-hover:text-primary cursor-pointer transition-all duration-300">
                {workout.title}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-3 transition-all duration-300">
                {workout.description || "No description provided."}
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wider border ${getDifficultyColor(workout.difficulty)}`}>
                  {workout.difficulty}
                </span>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wider border ${getCategoryColor(workout.category)}`}>
                  {workout.category}
                </span>
              </div>
           </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground pt-6 mt-auto">
            <button onClick={handleLike} className={`flex items-center gap-2 transition-colors group/like ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : 'group-hover/like:scale-110 transition-transform'}`} />
              <span className="font-medium">{likesCount}</span>
            </button>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{workout.duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-2">
               <BarChart className="w-5 h-5 rotate-90" />
               <span>Stats</span>
            </div>
        </div>
      </div>

      {/* Right Column: Preview & Action (40%) */}
      <div className="md:w-2/5 bg-secondary/30 border-l border-border/50 p-6 flex flex-col h-full relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 pointer-events-none" />
         
         <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Routine Preview</span>
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            </div>

            <div className="space-y-3 flex-1 overflow-hidden">
              {workout.sections && workout.sections.length > 0 ? (
                workout.sections.slice(0, 4).map((section, i) => (
                  <div key={i} className="group/item flex items-center gap-3 p-2 rounded-lg hover:bg-background/50 transition-colors border border-transparent hover:border-border/30">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{section.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{section.exercises?.length || 0} exercises</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-2">
                   <BarChart className="w-8 h-8 opacity-20" />
                   <span className="text-xs">No preview available</span>
                </div>
              )}
              {workout.sections && workout.sections.length > 4 && (
                 <div className="text-center text-[10px] text-muted-foreground pt-1">
                    + {workout.sections.length - 4} more sections
                 </div>
              )}
            </div>

            <Link href={`/workout/${workout.id}`} className="mt-6">
              <Button className="w-full gap-2 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
                  <Play className="w-4 h-4 fill-current" />
                  Start Workout
              </Button>
            </Link>
         </div>
      </div>
    </Card>
  )
}
