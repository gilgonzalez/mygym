'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Clock, User, MoreVertical, Edit, Trash2, Loader2, Zap, Lock, Globe, FileEdit } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Workout } from '../types/workout/composite'
import { Card } from './Card'
import { deleteWorkoutAction } from '@/app/actions/workout/delete'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

interface SimplifiedWorkoutCardProps {
  workout: Workout
}

export default function SimplifiedWorkoutCard({ workout }: SimplifiedWorkoutCardProps) {
  const [likesCount, setLikesCount] = useState(workout.likes_count || 0)
  const [isLiked, setIsLiked] = useState(workout.is_liked || false)
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { user } = useAuthStore()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const isOwner = user?.id === workout.user_id

  // Calculate Stats & Rewards
  // @ts-ignore
  const duration = Math.ceil((workout.estimated_time || 0) / 60) || 45
  const xpEarned = Math.ceil(duration * 5) + 50

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDelete = async () => {
      if (!confirm('Are you sure you want to delete this workout? This action cannot be undone.')) return
      
      setIsDeleting(true)
      const res = await deleteWorkoutAction(workout.id)
      
      if (res.success) {
          await queryClient.invalidateQueries({ queryKey: ['workouts'] })
          setIsDeleting(false) 
          router.refresh()
      } else {
          alert('Failed to delete workout: ' + res.error)
          setIsDeleting(false)
      }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Implement like logic if needed, for now just UI
    setIsLiked(!isLiked)
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
      case 'intermediate': return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      case 'advanced': return 'text-rose-500 bg-rose-500/10 border-rose-500/20'
      default: return 'text-muted-foreground bg-muted border-muted-foreground/20'
    }
  }

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm glow-card hover:border-primary/50 transition-all duration-300 w-full flex flex-col">
      <div className="p-5 flex flex-col h-full relative z-10">
        {/* User Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-primary/20">
              {workout.user?.avatar_url ? (
                <img 
                  src={workout.user.avatar_url} 
                  alt={workout.user.name || 'User'} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-foreground">{workout.user?.name}</span>
            </div>
          </div>

          {/* Owner Actions */}
          <div className="flex items-center gap-1">
             {isOwner && (
                 <div className="mr-1" title={workout.visibility ?? ""}>
                    {workout.visibility === 'private' && <Lock className="w-3.5 h-3.5 text-muted-foreground stroke-red-500" />}
                    {workout.visibility === 'public' && <Globe className="w-3.5 h-3.5 text-muted-foreground stroke-emerald-500" />}
                    {workout.visibility === 'draft' && <FileEdit className="w-3.5 h-3.5 text-muted-foreground stroke-orange-500" />}
                 </div>
             )}

             {isOwner && (
              <div className="relative" ref={menuRef}>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu) }}
                    className="p-1 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors"
                  >
                      {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                          <MoreVertical className="h-4 w-4" />
                      )}
                  </button>
                  
                  {showMenu && (
                      <div className="absolute right-0 top-8 w-32 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="flex flex-col p-1">
                              <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/editor/workout/create?id=${workout.id}`) }}
                                className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors text-left"
                              >
                                  <Edit className="h-3 w-3" />
                                  Edit
                              </button>
                              <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); handleDelete() }}
                                className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-md transition-colors text-left"
                              >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                              </button>
                          </div>
                      </div>
                  )}
              </div>
             )}
          </div>
        </div>

        {/* Main Content */}
        <Link href={`/workout/${workout.id}`} className="block flex-1 group-hover:opacity-90 transition-opacity">
           <h4 className="text-lg font-bold leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors duration-300 mb-2">
             {workout.title}
           </h4>
           <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
             {workout.description || "No description provided."}
           </p>
           
           <div className="flex flex-wrap gap-1.5 mb-4">
             <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${getDifficultyColor(workout.difficulty || 'beginner')}`}>
               {workout.difficulty}
             </span>
             {workout.tags?.slice(0, 2).map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border text-muted-foreground bg-muted border-muted-foreground/20">
                  {tag}
                </span>
             ))}
             {(workout.tags?.length || 0) > 2 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-medium border text-muted-foreground bg-muted border-muted-foreground/20">
                  +{workout.tags!.length - 2}
                </span>
             )}
           </div>
        </Link>

        {/* Footer Info */}
        <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
                <button onClick={handleLike} className={`flex items-center gap-1 transition-colors group/like ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : 'group-hover/like:scale-110 transition-transform'}`} />
                  <span className="font-medium">{likesCount}</span>
                </button>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{duration}m</span>
                </div>
            </div>
            
            <div className="flex items-center gap-1 text-amber-500">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="font-bold">{xpEarned} XP</span>
            </div>
        </div>
      </div>
    </Card>
  )
}