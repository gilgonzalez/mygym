'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Heart, Clock, User, Play, MoreVertical, Edit, Trash2, Loader2, Zap, Brain, Footprints, Swords, Shield, Share2, MessageSquare, Dumbbell, Lock, Globe, FileEdit, Users } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Workout } from '../types/workout/composite'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ShareWorkoutDialog } from './share/ShareWorkoutDialog'
import { FollowButton } from './social/FollowButton'
import { WorkoutCommentsSheet } from './workout/WorkoutCommentsSheet'
import { formatDuration } from '@/lib/time'
import { cn } from '@/lib/utils'
import { calcWorkoutXP, formatCount, getDifficultyColor, visibilityLabelMap } from '@/lib/workout-utils'
import { VerifiedBadge } from './common/VerifiedBadge'
import { useWorkoutCardActions } from '@/hooks/useWorkoutCardActions'

interface WorkoutCardProps {
  workout: Workout
  variant?: 'full' | 'simplified'
}

export default function WorkoutCard({ workout, variant = 'full' }: WorkoutCardProps) {
  const { user } = useAuthStore()
  const isOwner = user?.id === workout.user_id

  const {
    likesCount,
    isLiked,
    likesPreview,
    isLiking,
    isDeleting,
    showMenu,
    setShowMenu,
    menuRef,
    handleLike,
    handleDelete,
    syncFromProps,
  } = useWorkoutCardActions({
    workoutId: workout.id,
    userId: workout.user_id,
    initialLikesCount: workout.likes_count || 0,
    initialIsLiked: workout.is_liked || false,
    initialLikesPreview: workout.likes_preview || [],
  })

  const commentsCount = workout.comments_count || 0

  useEffect(() => {
    syncFromProps({
      likes_count: workout.likes_count,
      is_liked: workout.is_liked,
      likes_preview: workout.likes_preview,
    })
  }, [workout.likes_count, workout.is_liked, workout.likes_preview, syncFromProps])

  const durationSeconds = workout.estimated_time || 45 * 60
  const durationLabel = formatDuration(durationSeconds)
  const durationMinutes = Math.ceil(durationSeconds / 60)
  const xpEarned = calcWorkoutXP(durationMinutes, false)
  const hasCover = Boolean(workout.cover)

  const attributes = useMemo(() => {
    let strength = 0, agility = 0, endurance = 0, wisdom = 0
    const tags = workout.tags || []
    if (tags.some((t) => ['Fuerza', 'Barbell', 'Dumbbell'].includes(t))) strength += 2
    if (tags.some((t) => ['Cardio', 'HIIT', 'Run'].includes(t))) endurance += 2
    if (tags.some((t) => ['Yoga', 'Mobility'].includes(t))) {
      agility += 2
      wisdom += 1
    }
    if (strength === 0 && agility === 0 && endurance === 0 && wisdom === 0) {
      strength = 1
      endurance = 1
    }
    return { strength, agility, endurance, wisdom }
  }, [workout.tags])

  const totalExercises = workout.sections?.reduce((acc, s) => acc + (s.total_exercises || 0), 0) || 0
  const totalSections = workout.sections?.length || 0

  const [showShare, setShowShare] = useState(false)

  if (variant === 'simplified') {
    return (
      <SimplifiedWorkoutCardView
        workout={workout}
        isOwner={isOwner}
        isLiked={isLiked}
        likesCount={likesCount}
        likesPreview={likesPreview}
        xpEarned={xpEarned}
        durationLabel={durationLabel}
        isLiking={isLiking}
        isDeleting={isDeleting}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        menuRef={menuRef}
        onLike={handleLike}
        onDelete={handleDelete}
      />
    )
  }

  return (
    <Card className="group overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm glow-card hover:border-primary/50 transition-all duration-300 w-full">
      <MobileWorkoutCard
        workout={workout}
        isOwner={isOwner}
        isLiked={isLiked}
        likesCount={likesCount}
        commentsCount={commentsCount}
        xpEarned={xpEarned}
        durationLabel={durationLabel}
        totalSections={totalSections}
        totalExercises={totalExercises}
        attributes={attributes}
        hasCover={hasCover}
        onLike={handleLike}
        onShare={() => setShowShare(true)}
        isDeleting={isDeleting}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        onDelete={handleDelete}
        menuRef={menuRef}
      />
      <DesktopWorkoutCard
        workout={workout}
        isOwner={isOwner}
        isLiked={isLiked}
        likesCount={likesCount}
        commentsCount={commentsCount}
        xpEarned={xpEarned}
        durationLabel={durationLabel}
        attributes={attributes}
        likesPreview={likesPreview}
        hasCover={hasCover}
        onLike={handleLike}
        onShare={() => setShowShare(true)}
        isDeleting={isDeleting}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        onDelete={handleDelete}
        menuRef={menuRef}
      />

      <ShareWorkoutDialog open={showShare} onOpenChange={setShowShare} workout={workout} />
    </Card>
  )
}

function SimplifiedWorkoutCardView(props: any) {
  const {
    workout, isOwner, isLiked, likesCount, likesPreview,
    xpEarned, durationLabel, isDeleting,
    showMenu, setShowMenu, menuRef, onLike, onDelete
  } = props
  const router = useRouter()
  const [showShare, setShowShare] = useState(false)

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm glow-card hover:border-primary/50 transition-all duration-300 w-full flex flex-col">
      <div className="p-5 flex flex-col h-full relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-primary/20">
              {workout.user?.avatar_url ? (
                <img
                  src={workout.user.avatar_url}
                  alt={workout.user.name || 'Usuario'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-foreground">{workout.user?.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isOwner && workout.user_id ? (
              <FollowButton userId={workout.user_id} initialStatus={workout.viewer_follow_status} />
            ) : null}

            {isOwner && (
              <div
                className="mr-1"
                title={workout.visibility ? visibilityLabelMap[workout.visibility as keyof typeof visibilityLabelMap] ?? workout.visibility : ''}
              >
                {workout.visibility === 'private' && <Lock className="w-3.5 h-3.5 text-muted-foreground stroke-red-500" />}
                {workout.visibility === 'followers' && <Users className="w-3.5 h-3.5 text-muted-foreground stroke-sky-500" />}
                {workout.visibility === 'public' && <Globe className="w-3.5 h-3.5 text-muted-foreground stroke-emerald-500" />}
                {workout.visibility === 'draft' && <FileEdit className="w-3.5 h-3.5 text-muted-foreground stroke-orange-500" />}
              </div>
            )}

            {isOwner && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowMenu(!showMenu)
                  }}
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
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          router.push(`/editor/workout/create?id=${workout.id}`)
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors text-left"
                      >
                        <Edit className="h-3 w-3" />
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowMenu(false)
                          onDelete()
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-md transition-colors text-left"
                      >
                        <Trash2 className="h-3 w-3" />
                        Borrar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Link href={`/workout/${workout.id}`} className="block flex-1 group-hover:opacity-90 transition-opacity">
          <h4 className="text-lg font-bold leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors duration-300 mb-2">
            {workout.title}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {workout.description || 'Sin descripción.'}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${getDifficultyColor(workout.difficulty || 'beginner')}`}>
              {workout.difficulty}
            </span>
            {workout.tags?.slice(0, 2).map((tag: string) => (
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

        {likesCount > 0 && (
          <div className="flex items-center gap-2 mb-3 text-[11px] text-foreground">
            <div className="flex items-center -space-x-1.5">
              {likesPreview.slice(0, 3).map((liker: any) => (
                <div
                  key={liker.id}
                  className="relative h-5 w-5 shrink-0 rounded-full ring-2 ring-background bg-muted overflow-hidden"
                >
                  {liker.avatar_url ? (
                    <img
                      src={liker.avatar_url}
                      alt={liker.name || liker.username || 'usuario'}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="leading-tight text-muted-foreground">
              {likesPreview.length === 1 && likesCount === 1 ? (
                <span>
                  A{' '}
                  <span className="font-semibold text-foreground">
                    {likesPreview[0].name || `@${likesPreview[0].username}` || 'alguien'}
                  </span>
                </span>
              ) : likesPreview.length >= 2 && likesCount === 2 ? (
                <span>
                  A{' '}
                  <span className="font-semibold text-foreground">
                    {likesPreview[0].name || `@${likesPreview[0].username}` || 'alguien'}
                  </span>{' '}
                  y{' '}
                  <span className="font-semibold text-foreground">1 más</span>
                </span>
              ) : likesCount >= 3 ? (
                <span>
                  A{' '}
                  <span className="font-semibold text-foreground">
                    {likesPreview[0]?.name || (likesPreview[0]?.username ? `@${likesPreview[0].username}` : 'alguien')}
                  </span>{' '}
                  y{' '}
                  <span className="font-semibold text-foreground">{likesCount - 1} más</span>
                </span>
              ) : (
                <span className="font-semibold text-foreground">{likesCount}</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <button
              onClick={onLike}
              className={`flex items-center gap-1 transition-colors group/like ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : 'group-hover/like:scale-110 transition-transform'}`} />
              <span className="font-medium">{likesCount}</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                setShowShare(true)
              }}
              className="flex items-center gap-1 transition-colors hover:text-primary group/share"
            >
              <Share2 className="w-3.5 h-3.5 group-hover/share:scale-110 transition-transform" />
            </button>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{durationLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-amber-500">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="font-bold">{xpEarned} XP</span>
          </div>
        </div>
      </div>

      <ShareWorkoutDialog open={showShare} onOpenChange={setShowShare} workout={workout} />
    </Card>
  )
}

function MobileWorkoutCard(props: any) {
  const {
    workout, isOwner, isLiked, likesCount, commentsCount,
    xpEarned, durationLabel, totalSections, totalExercises,
    attributes, hasCover, onLike,
    isDeleting, showMenu, setShowMenu, onDelete, menuRef
  } = props
  const router = useRouter()

  return (
    <div className="sm:hidden p-3 space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20 shrink-0">
          {workout.user?.avatar_url ? (
            <img src={workout.user.avatar_url} alt={workout.user.name || 'Usuario'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-xs text-foreground truncate">{workout.user?.name}</span>
            {workout.user?.verified_badge ? <VerifiedBadge size="sm" /> : null}
          </div>
          <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wide truncate block">@{workout.user?.username}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isOwner && workout.user_id ? (
            <FollowButton userId={workout.user_id} initialStatus={workout.viewer_follow_status} className="h-7 text-[10px] px-2 py-0 rounded-full" />
          ) : null}
          {isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                className="p-1 rounded-full hover:bg-muted/50 text-muted-foreground"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 w-32 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex flex-col p-1">
                    <button onClick={() => router.push(`/editor/workout/create?id=${workout.id}`)} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md text-left">
                      <Edit className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                        onDelete()
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md text-left"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Borrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Link href={`/workout/${workout.id}`} className="block relative rounded-2xl overflow-hidden border border-border/60 shadow-[0_6px_20px_rgba(0,0,0,0.10)]">
        <div className={`absolute inset-0 ${hasCover ? '' : 'bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 dark:from-emerald-950 dark:via-slate-950 dark:to-black'}`}>
          {hasCover && (
            <>
              <img src={workout.cover} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.20),transparent_45%)]" />
            </>
          )}
          {!hasCover && (
            <div className="absolute inset-0 opacity-40">
              <Dumbbell className="absolute right-4 top-4 w-14 h-14 text-primary/30 -rotate-12" strokeWidth={1.2} />
              <Dumbbell className="absolute left-6 bottom-6 w-10 h-10 text-white/10 rotate-12" strokeWidth={1.2} />
            </div>
          )}
        </div>

        <div className="relative z-10 p-4 min-h-[190px] flex flex-col justify-between">
          <div className="space-y-2.5">
            <h3 className="text-[22px] leading-[1.1] font-black tracking-tight italic text-white line-clamp-2 drop-shadow-md">
              {workout.title}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {workout.difficulty ? (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border backdrop-blur-md",
                  hasCover ? 'text-white bg-black/40 border-white/15' : getDifficultyColor(workout.difficulty)
                )}>
                  {workout.difficulty}
                </span>
              ) : null}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
                <Clock className="w-2.5 h-2.5 text-white/80" />
                <span className="text-[10px] font-bold text-white tabular-nums">{durationLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="bg-black/25 border border-white/10 backdrop-blur-sm rounded-xl px-2.5 py-2 flex items-center gap-1.5 shrink-0">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-300 shrink-0" strokeWidth={2} />
              <span className="text-sm font-black text-white tabular-nums">{totalExercises}</span>
            </div>
            <div className="bg-black/25 border border-white/10 backdrop-blur-sm rounded-xl px-2.5 py-2 flex items-center gap-1.5 shrink-0">
              <RotateCcwCustom className="w-3.5 h-3.5 text-sky-300 shrink-0" />
              <span className="text-sm font-black text-white tabular-nums">{totalSections}</span>
            </div>
            <div className="bg-gradient-to-br from-amber-500/25 to-orange-500/20 border border-amber-400/25 backdrop-blur-sm rounded-xl px-2.5 py-2 flex items-center justify-center gap-1.5 flex-1 min-w-0">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
              <span className="text-sm font-black text-amber-200 tabular-nums truncate">+{xpEarned}</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between px-0.5 pt-0.5">
        <div className="flex items-center gap-4">
          <button onClick={onLike} className={cn(
            "flex items-center gap-1.5 transition-all active:scale-95",
            isLiked ? "text-red-500" : "text-foreground/70 hover:text-red-500"
          )}>
            <Heart className={cn("w-5 h-5", isLiked ? "fill-current" : "")} />
            <span className="text-[11px] font-bold tabular-nums">{likesCount}</span>
          </button>

          <WorkoutCommentsSheet workoutId={workout.id} isChallenge={!!workout.challenge}>
            <button className="flex items-center gap-1.5 text-foreground/70 hover:text-primary transition-all active:scale-95">
              <MessageSquare className="w-5 h-5" />
              <span className="text-[11px] font-bold tabular-nums">{formatCount(commentsCount)}</span>
            </button>
          </WorkoutCommentsSheet>
        </div>

        <div className="flex items-center gap-1.5">
          {attributes.strength > 0 && <AttributeChip color="rose" label={`+${attributes.strength}`} icon={Swords} />}
          {attributes.endurance > 0 && <AttributeChip color="sky" label={attributes.endurance} icon={Shield} />}
          {attributes.agility > 0 && <AttributeChip color="emerald" label={attributes.agility} icon={Footprints} />}
          {attributes.wisdom > 0 && <AttributeChip color="violet" label={attributes.wisdom} icon={Brain} />}
        </div>
      </div>

      <div className="pt-1">
        <Link href={`/workout/${workout.id}`}>
          <Button className="w-full h-11 gap-2 text-sm font-bold rounded-xl shadow-[0_4px_20px_-6px_rgba(16,185,129,0.5)] bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white border-0">
            <Play className="w-4 h-4 fill-white" />
            INICIAR WORKOUT
          </Button>
        </Link>
      </div>
    </div>
  )
}

function AttributeChip({ color, label, icon: Icon }: any) {
  const palette: any = {
    rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    sky: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  }
  return (
    <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-md border font-mono", palette[color])}>
      <Icon className="w-3 h-3" />
      <span className="text-[10px] font-black tabular-nums leading-none">{label}</span>
    </div>
  )
}

function RotateCcwCustom({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9" />
      <polyline points="3 4 3 12 11 12" />
    </svg>
  )
}

function DesktopWorkoutCard(props: any) {
  const {
    workout, isOwner, isLiked, likesCount, commentsCount,
    xpEarned, durationLabel, attributes, likesPreview,
    hasCover, onLike, onShare,
    isDeleting, showMenu, setShowMenu, onDelete, menuRef
  } = props
  const router = useRouter()

  return (
    <div className="hidden sm:flex flex-col p-6 group/card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20 transition-transform group-hover:scale-105 shrink-0">
            {workout.user?.avatar_url ? (
              <img src={workout.user.avatar_url} alt={workout.user.name || 'Usuario'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-foreground hover:text-primary cursor-pointer transition-colors duration-300 truncate flex items-center gap-1.5">
              {workout.user?.name}
              {workout.user?.verified_badge ? <VerifiedBadge size="md" /> : null}
            </span>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider transition-colors duration-300 truncate">@{workout.user?.username}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isOwner && workout.user_id ? (
            <FollowButton userId={workout.user_id} initialStatus={workout.viewer_follow_status} className="h-9 text-xs px-3" />
          ) : null}

          {isOwner && (
            <div className="relative" ref={menuRef}>
              <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }} className="p-1 rounded-full hover:bg-muted/50 text-muted-foreground transition-colors">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 w-32 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex flex-col p-1">
                    <button onClick={() => router.push(`/editor/workout/create?id=${workout.id}`)} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors text-left">
                      <Edit className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete() }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md transition-colors text-left">
                      <Trash2 className="h-3.5 w-3.5" /> Borrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {workout.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3 transition-all duration-300">
            {workout.description}
          </p>
        ) : null}
      </div>

      <div className="relative mt-5 overflow-hidden rounded-[28px] border border-border/60 shadow-[0_10px_30px_rgba(0,0,0,0.10)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.28)]">
        <div className={`absolute inset-0 ${hasCover ? '' : 'bg-white dark:bg-black'}`}>
          {hasCover ? (
            <>
              <img src={workout.cover || ''} alt={`Cover de ${workout.title}`} className="h-full w-full object-contain" />
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

        <div className="relative z-10 flex min-h-[260px] lg:min-h-[300px] flex-col gap-5 p-4 lg:gap-6 lg:p-5">
          <div className="flex items-start justify-between gap-4">
            <h4 className="max-w-[18rem] text-2xl sm:text-[2rem] font-bold leading-tight tracking-tight drop-shadow-md transition-all duration-300 group-hover:text-emerald-700 dark:text-white line-clamp-2">
              {workout.title}
            </h4>
            <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur-md dark:bg-white/10 dark:text-white shrink-0">
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
              {workout.sections.map((section: any, index: number) => (
                <div
                  key={section.id || `${section.name}-${index}`}
                  className="w-[calc(50%-0.375rem)] xl:w-[calc(25%-0.5625rem)] rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.10)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.14)] dark:bg-black/25"
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
                        {section.total_exercises || 0} ejercicios
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {workout.tags?.[0] ? (
            <div className="flex justify-start">
              <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-white/80 backdrop-blur-md dark:bg-white/10 dark:text-white/80">
                {workout.tags[0]}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 border-t border-border/50 pt-4 space-y-4">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {attributes.strength > 0 && (
              <div className="flex items-center gap-1.5 text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20" title="Fuerza">
                <Swords className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">+{attributes.strength} FUE</span>
              </div>
            )}
            {attributes.endurance > 0 && (
              <div className="flex items-center gap-1.5 text-sky-500 bg-sky-500/10 px-2 py-1 rounded-md border border-sky-500/20" title="Resistencia">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">+{attributes.endurance} RES</span>
              </div>
            )}
            {attributes.agility > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20" title="Agilidad">
                <Footprints className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">+{attributes.agility} AGI</span>
              </div>
            )}
            {attributes.wisdom > 0 && (
              <div className="flex items-center gap-1.5 text-violet-500 bg-violet-500/10 px-2 py-1 rounded-md border border-violet-500/20" title="Sabiduría">
                <Brain className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">+{attributes.wisdom} SAB</span>
              </div>
            )}
          </div>

          {likesCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-foreground">
              <div className="flex items-center -space-x-2">
                {likesPreview.slice(0, 3).map((liker: any) => (
                  <div key={liker.id} className="relative h-6 w-6 shrink-0 rounded-full ring-2 ring-background bg-muted overflow-hidden">
                    {liker.avatar_url ? (
                      <img src={liker.avatar_url} alt={liker.name || liker.username || 'usuario'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/10">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="leading-tight text-muted-foreground">
                {likesPreview.length === 1 && likesCount === 1 ? (
                  <span>A <span className="font-semibold text-foreground">{likesPreview[0].name || `@${likesPreview[0].username}` || 'alguien'} le gusta esto</span></span>
                ) : likesPreview.length >= 2 && likesCount === 2 ? (
                  <span>A <span className="font-semibold text-foreground">{likesPreview[0].name || `@${likesPreview[0].username}` || 'alguien'}</span> y <span className="font-semibold text-foreground">{likesPreview[1].name || `@${likesPreview[1].username}` || 'otra persona'}</span> les gusta esto</span>
                ) : likesCount >= 3 ? (
                  <span>A <span className="font-semibold text-foreground">{likesPreview[0]?.name || (likesPreview[0]?.username ? `@${likesPreview[0].username}` : 'alguien')}</span>, <span className="font-semibold text-foreground">{likesPreview[1]?.name || (likesPreview[1]?.username ? `@${likesPreview[1].username}` : 'otra persona')}</span> y a <span className="font-semibold text-foreground">{likesCount - 2}</span> {likesCount - 2 === 1 ? 'persona más' : 'personas más'} les gusta esto</span>
                ) : (
                  <span className="font-semibold text-foreground">{likesCount} me gusta</span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <button onClick={onLike} className={`flex items-center gap-2 transition-colors group/like ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : 'group-hover/like:scale-110 transition-transform'}`} />
              <span className="font-medium text-xs">{likesCount}</span>
            </button>
            <WorkoutCommentsSheet workoutId={workout.id} isChallenge={!!workout.challenge}>
              <button className="flex items-center gap-2 transition-colors hover:text-primary group/comments">
                <MessageSquare className="w-4 h-4 group-hover/comments:scale-110 transition-transform" />
                <span className="text-xs font-medium">{formatCount(commentsCount)}</span>
              </button>
            </WorkoutCommentsSheet>
            <button onClick={onShare} className="flex items-center gap-2 transition-colors hover:text-primary group/share">
              <Share2 className="w-4 h-4 group-hover/share:scale-110 transition-transform" />
              <span className="text-xs font-medium">Compartir</span>
            </button>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs">{durationLabel}</span>
            </div>

            <Link href={`/workout/${workout.id}`} className="mx-auto block shrink-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] opacity-0 translate-y-4 pointer-events-none group-hover/card:opacity-100 group-hover/card:translate-y-0 group-hover/card:pointer-events-auto">
              <Button className="h-9 pl-3.5 pr-4 gap-2 rounded-xl bg-emerald-500/10 hover:from-emerald-500 hover:to-emerald-400 text-emerald-600 dark:text-emerald-400 hover:!text-white font-bold border border-emerald-500/30 hover:border-transparent shadow-none hover:shadow-[0_8px_28px_-6px_rgba(16,185,129,0.75)] hover:-translate-y-0.5 transition-all duration-200 ease-in-out text-xs">
                <Play className="w-3.5 h-3.5 fill-current" />
                Iniciar Workout
              </Button>
            </Link>

            <div className="flex items-center gap-1.5 text-amber-500 ml-auto shrink-0">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-bold">{xpEarned} XP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
