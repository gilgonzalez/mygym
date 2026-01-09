'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Clock, BarChart, User, Play, MoreVertical, Edit, Trash2, Loader2, Zap,  Brain, Footprints, Swords, Shield, Share2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Workout } from '../types/workout/composite'
import { Card } from './Card'
import { Button } from './Button'
import { deleteWorkoutAction } from '@/app/actions/workout/delete'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ShareWorkoutDialog } from './share/ShareWorkoutDialog'

interface WorkoutCardProps {
  workout: Workout
}

export default function WorkoutCard({ workout }: WorkoutCardProps) {
  const [likesCount, setLikesCount] = useState(workout.likes_count || 0)
  const [isLiked, setIsLiked] = useState(workout.is_liked || false)
  const [showShare, setShowShare] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)
  
  const { user } = useAuthStore()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)

  const isOwner = user?.id === workout.user_id

  // Calculate Stats & Rewards
  // @ts-ignore - estimated_time exists in DB but might be missing in type
  const duration = Math.ceil((workout.estimated_time || 0) / 60) || 45
  const xpEarned = Math.ceil(duration * 5) + 50

  const getAttributes = (tags: string[] = []) => {
      let strength = 0, agility = 0, endurance = 0, wisdom = 0
      
      if (tags.some(t => ['Strength', 'Barbell', 'Dumbbell'].includes(t))) strength += 2
      if (tags.some(t => ['Cardio', 'HIIT', 'Run'].includes(t))) endurance += 2
      if (tags.some(t => ['Yoga', 'Mobility'].includes(t))) { agility += 2; wisdom += 1 }
      
      if (strength === 0 && agility === 0 && endurance === 0 && wisdom === 0) {
          strength = 1; endurance = 1
      }
      
      return { strength, agility, endurance, wisdom }
  }
  const attributes = getAttributes(workout.tags || [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const queryClient = useQueryClient()
  
  const handleDelete = async () => {
      if (!confirm('Are you sure you want to delete this workout? This action cannot be undone.')) return
      
      setIsDeleting(true)
      const res = await deleteWorkoutAction(workout.id)
      
      if (res.success) {
          // Invalidamos la query 'workouts' para que se recargue la lista automáticamente
          await queryClient.invalidateQueries({ queryKey: ['workouts'] })
          setIsDeleting(false) 
          router.refresh() // Mantenemos esto por si hay datos de servidor (Server Components) que actualizar
      } else {
          alert('Failed to delete workout: ' + res.error)
          setIsDeleting(false)
      }
  }



  const handleLike = () => {
    console.log('handle like clicked')
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
    <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm glow-card hover:border-primary/50 transition-all duration-300 w-full flex flex-col md:flex-row">
      {/* Left Column: Info & Details (60%) */}
      <div className="flex flex-col justify-between p-6 md:w-3/5 relative z-10">
        <div>
           {/* User Header */}
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20 transition-transform group-hover:scale-105">
                  {workout.user?.avatar_url ? (
                    <img 
                      src={workout.user.avatar_url} 
                      alt={workout.user.name || 'User'} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-foreground hover:text-primary cursor-pointer transition-colors duration-300">{workout.user?.name}</span>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider transition-colors duration-300">@{workout.user?.username}</span>
                </div>
              </div>

              {/* Owner Actions */}
              {isOwner && (
                  <div className="relative" ref={menuRef}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
                        className="p-1 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors"
                      >
                          {isDeleting || isLoadingEdit ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                              <MoreVertical className="h-4 w-4" />
                          )}
                      </button>
                      
                      {showMenu && (
                          <div className="absolute right-0 top-8 w-32 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                              <div className="flex flex-col p-1">
                                  <button 
                                    onClick={(e) => router.push(`/editor/workout/create?id=${workout.id}`)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors text-left"
                                  >
                                      <Edit className="h-3.5 w-3.5" />
                                      Edit
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); handleDelete() }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md transition-colors text-left"
                                  >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Delete
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              )}
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
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wider border ${getDifficultyColor(workout.difficulty || 'beginner')}`}>
                  {workout.difficulty}
                </span>
                {workout.tags?.map(tag => (
                   <span key={tag} className="px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wider border text-muted-foreground bg-muted border-muted-foreground/20">
                     {tag}
                   </span>
                ))}
              </div>
           </div>
        </div>

        {/* Footer Info */}
        <div className="mt-auto pt-6 space-y-4">
            {/* Attributes Row */}
            <div className="flex flex-wrap gap-2">
                 {attributes.strength > 0 && (
                    <div className="flex items-center gap-1.5 text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20" title="Strength">
                        <Swords className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">+{attributes.strength} STR</span>
                    </div>
                 )}
                 {attributes.endurance > 0 && (
                    <div className="flex items-center gap-1.5 text-sky-500 bg-sky-500/10 px-2 py-1 rounded-md border border-sky-500/20" title="Endurance">
                        <Shield className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">+{attributes.endurance} END</span>
                    </div>
                 )}
                 {attributes.agility > 0 && (
                    <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20" title="Agility">
                        <Footprints className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">+{attributes.agility} AGI</span>
                    </div>
                 )}
                 {attributes.wisdom > 0 && (
                    <div className="flex items-center gap-1.5 text-violet-500 bg-violet-500/10 px-2 py-1 rounded-md border border-violet-500/20" title="Wisdom">
                        <Brain className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">+{attributes.wisdom} WIS</span>
                    </div>
                 )}
            </div>

            {/* Meta Row */}
            <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border/50 pt-3">
                <div className="flex items-center gap-4">
                    <button onClick={handleLike} className={`flex items-center gap-2 transition-colors group/like ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : 'group-hover/like:scale-110 transition-transform'}`} />
                      <span className="font-medium text-xs">{likesCount}</span>
                    </button>
                    <button onClick={() => setShowShare(true)} className="flex items-center gap-2 transition-colors hover:text-primary group/share">
                      <Share2 className="w-4 h-4 group-hover/share:scale-110 transition-transform" />
                    </button>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">{duration} min</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-1.5 text-amber-500">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span className="text-xs font-bold">{xpEarned} XP</span>
                </div>
            </div>
        </div>
      </div>

      {/* Right Column: Preview & Action (40%) */}
      <div className="md:w-2/5 bg-secondary/30 border-l border-border/50 p-6 flex flex-col relative overflow-hidden">
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
                      <p className="truncate text-[10px] text-muted-foreground">{section.total_exercises || 0} exercises</p>
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
      
      <ShareWorkoutDialog 
        open={showShare} 
        onOpenChange={setShowShare} 
        workout={workout} 
      />
    </Card>
  )
}