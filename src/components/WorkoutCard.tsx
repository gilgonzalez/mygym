'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Clock, User, Play, MoreVertical, Edit, Trash2, Loader2, Zap, Brain, Footprints, Swords, Shield, Share2, MessageSquare } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Workout } from '../types/workout/composite'
import { Card } from './Card'
import { Button } from './Button'
import { deleteWorkoutAction } from '@/app/actions/workout/delete'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ShareWorkoutDialog } from './share/ShareWorkoutDialog'
import { WorkoutCommentsSheet } from './workout/WorkoutCommentsSheet'
import { formatDuration } from '@/lib/time'

interface WorkoutCardProps {
  workout: Workout
}

export default function WorkoutCard({ workout }: WorkoutCardProps) {
  const likesCount = workout.likes_count || 0
  const isLiked = workout.is_liked || false
  const [showShare, setShowShare] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { user } = useAuthStore()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)

  const isOwner = user?.id === workout.user_id

  // Calculate Stats & Rewards
  // @ts-ignore - estimated_time exists in DB but might be missing in type
  const durationSeconds = workout.estimated_time || 45 * 60
  const durationLabel = formatDuration(durationSeconds)
  const durationMinutes = Math.ceil(durationSeconds / 60)
  const xpEarned = Math.ceil(durationMinutes * 5) + 50
  const hasCover = Boolean(workout.cover)

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

  return (
    <Card className="group overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm glow-card hover:border-primary/50 transition-all duration-300 w-full">
      <div className="flex flex-col p-6">
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

          {isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
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
                      onClick={() => router.push(`/editor/workout/create?id=${workout.id}`)}
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

        <div className="space-y-3">
          {workout.description ? (
            <p className="text-sm text-muted-foreground line-clamp-3 transition-all duration-300">
              {workout.description}
            </p>
          ) : null}
        </div>

        <div className="relative mt-5 overflow-hidden rounded-[28px] border border-border/60 shadow-[0_18px_45px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_55px_rgba(0,0,0,0.34)]">
          <div className={`absolute inset-0 ${hasCover ? '' : 'bg-white dark:bg-black'}`}>
            {hasCover ? (
              <>
                <img
                  src={workout.cover || ''}
                  alt={`Cover de ${workout.title}`}
                  className="h-full w-full object-contain"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0.16)_0%,rgba(5,8,22,0.48)_26%,rgba(5,8,22,0.9)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.24),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_32%)]" />
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1.5px]" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.10),transparent_30%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.14),transparent_30%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.75),rgba(255,255,255,0.92))] dark:bg-[linear-gradient(180deg,rgba(10,14,28,0.76),rgba(5,8,22,0.95))]" />
              </>
            )}
          </div>

          <div className="relative z-10 flex min-h-[260px] sm:min-h-[300px] flex-col gap-5 p-4 sm:gap-6 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <h4 className="max-w-[18rem] text-2xl font-bold leading-tight tracking-tight text-emerald-950 drop-shadow-md transition-all duration-300 group-hover:text-emerald-700 dark:text-white sm:text-[2rem]">
                {workout.title}
              </h4>
              <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur-md dark:bg-white/10 dark:text-white">
                {durationLabel}
              </div>
            </div>

            <div className="space-y-3">
              {workout.difficulty ? (
                <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wider border backdrop-blur-md ${getDifficultyColor(workout.difficulty)} ${hasCover ? 'bg-black/25 text-white border-white/10' : ''}`}>
                  {workout.difficulty}
                </span>
              ) : null}
            </div>

            {workout.sections && workout.sections.length > 0 ? (
              <div className="flex flex-row flex-wrap gap-3">
                {workout.sections.map((section, index) => (
                  <div
                    key={section.id || `${section.name}-${index}`}
                    className="w-full sm:w-[calc(50%-0.375rem)] xl:w-[calc(25%-0.5625rem)] rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.14)] dark:bg-black/25"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/20">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white dark:text-white">
                          {section.name}
                        </p>
                        <p className="truncate text-[11px] text-white/70 dark:text-white/70">
                          {section.total_exercises || 0} exercises
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {workout.tags?.[0] ? (
              <div className="flex justify-start">
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/80 backdrop-blur-md dark:bg-white/10 dark:text-white/80">
                  {workout.tags[0]}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-border/50 pt-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
          <div className="space-y-4">
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

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <button onClick={handleLike} className={`flex items-center gap-2 transition-colors group/like ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : 'group-hover/like:scale-110 transition-transform'}`} />
                <span className="font-medium text-xs">{likesCount}</span>
              </button>
              <WorkoutCommentsSheet workoutId={workout.id}>
                <button className="flex items-center gap-2 transition-colors hover:text-primary group/comments">
                  <MessageSquare className="w-4 h-4 group-hover/comments:scale-110 transition-transform" />
                  <span className="text-xs font-medium">Comments</span>
                </button>
              </WorkoutCommentsSheet>
              <button onClick={() => setShowShare(true)} className="flex items-center gap-2 transition-colors hover:text-primary group/share">
                <Share2 className="w-4 h-4 group-hover/share:scale-110 transition-transform" />
                <span className="text-xs font-medium">Share</span>
              </button>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs">{durationLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-500">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-bold">{xpEarned} XP</span>
              </div>
            </div>
          </div>

          <div className="lg:justify-self-end lg:w-full">
            <Link href={`/workout/${workout.id}`} className="block">
              <Button className="w-full gap-2 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300 lg:h-11">
                <Play className="w-4 h-4 fill-current" />
                Start Workout
              </Button>
            </Link>
          </div>
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
