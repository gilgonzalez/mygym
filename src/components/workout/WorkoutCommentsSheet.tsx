'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Star, User, Trophy, Timer, RotateCcw, Crown } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { getWorkoutComments, countWorkoutComments } from '@/app/actions/workout/get-comment'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { FEELING_CONFIG } from '@/constants/feeling'
import { formatCount, timeAgo } from '@/lib/workout-utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface WorkoutCommentsSheetProps {
  workoutId: string
  isChallenge?: boolean
  children: React.ReactNode
}

const FEELING_LEVELS: Record<string, number> = {
  tired: 1,
  sad: 2,
  normal: 3,
  happy: 4,
  pumped: 5
}

export function WorkoutCommentsSheet({ workoutId, isChallenge = false, children }: WorkoutCommentsSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const observerTarget = useRef(null)
  const isDesktop = useMediaQuery('(min-width: 640px)')
  const direction = isDesktop ? 'right' : 'bottom'

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['workout-comments', workoutId, isChallenge],
    queryFn: async ({ pageParam }) => {
      const res = await getWorkoutComments(workoutId, pageParam as number, 10, isChallenge)
      if (!res.success) throw new Error(res.error)
      return res.data || []
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  })

  const { data: totalCountData } = useQuery({
    queryKey: ['workout-comments-count', workoutId],
    queryFn: async () => {
      const res = await countWorkoutComments(workoutId)
      if (!res.success) throw new Error(res.error)
      return res.count
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasNextPage, fetchNextPage])

  const comments = data?.pages.flatMap((page) => page) || []
  const totalCount = totalCountData ?? comments.length

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>

      <Drawer
        open={isOpen}
        onOpenChange={setIsOpen}
        shouldScaleBackground
        direction={direction as any}
      >
        <DrawerContent
          direction={direction as any}
          className={cn(
            "overflow-hidden p-0",
            !isDesktop && "h-[85dvh] max-h-[90dvh]"
          )}
        >
          <DrawerHeader className={cn(
            "border-b border-border/40 space-y-2 shrink-0 text-left",
            isDesktop ? "pb-6 px-7 pt-7" : "pb-4 px-5 pt-2"
          )}>
            <div className="flex items-center justify-between gap-3">
              <div className={cn("flex items-center gap-3 min-w-0", isDesktop ? "" : "gap-2")}>
                 <div className={cn(
                   "bg-primary/10 shrink-0 rounded-xl",
                   isDesktop ? "p-2.5" : "p-2 rounded-lg"
                 )}>
                   <MessageSquare className={cn(
                     "text-primary",
                     isDesktop ? "w-5 h-5" : "w-4 h-4"
                   )} />
                 </div>
                 <div className="flex flex-col min-w-0">
                    <DrawerTitle className={cn(
                      "font-black italic tracking-tighter uppercase text-foreground truncate",
                      isDesktop ? "text-2xl" : "text-lg"
                    )}>
                      Locker Room
                    </DrawerTitle>
                    <DrawerDescription className={cn(
                      "font-bold uppercase tracking-widest text-muted-foreground/80 truncate",
                      isDesktop ? "text-xs" : "text-[10px]"
                    )}>
                      Comunidad y estadísticas
                    </DrawerDescription>
                 </div>
              </div>
              <div className={cn(
                "flex items-center bg-primary/10 border border-primary/20 shrink-0 rounded-full",
                isDesktop ? "gap-2 px-3 py-1.5" : "gap-1.5 px-2.5 py-1"
              )}>
                <span className={cn(
                  "font-black text-primary font-mono tabular-nums",
                  isDesktop ? "text-sm" : "text-xs"
                )}>
                  {formatCount(totalCount)}
                </span>
                {isDesktop && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">
                    comentarios
                  </span>
                )}
              </div>
            </div>
          </DrawerHeader>

          <div className={cn(
            "flex-1 overflow-y-auto custom-scrollbar",
            isDesktop ? "mt-6 px-7 pb-8" : "mt-4 px-5 pb-safe overscroll-contain"
          )}>
            <div className={cn(isDesktop ? "space-y-6" : "space-y-4")}>
              {isLoading ? (
                <div className={cn("animate-pulse", isDesktop ? "space-y-6" : "space-y-4")}>
                   {[1, 2, 3].map((i) => (
                      <CommentCardSkeleton key={i} compact={!isDesktop} />
                   ))}
                </div>
              ) : comments.length > 0 ? (
                <>
                  {comments.map((comment, index) => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      index={index}
                      compact={!isDesktop}
                    />
                  ))}

                  <div
                    ref={observerTarget}
                    className={cn(
                      "w-full flex flex-col items-center justify-center gap-2",
                      isDesktop ? "h-20 mt-4" : "h-16 mt-2"
                    )}
                  >
                     {isFetchingNextPage && (
                       <>
                          <div className="flex gap-1">
                             <div className={cn(
                               "bg-primary rounded-full animate-bounce [animation-delay:-0.3s]",
                               isDesktop ? "w-2 h-2" : "w-1.5 h-1.5"
                             )} />
                             <div className={cn(
                               "bg-primary rounded-full animate-bounce [animation-delay:-0.15s]",
                               isDesktop ? "w-2 h-2" : "w-1.5 h-1.5"
                             )} />
                             <div className={cn(
                               "bg-primary rounded-full animate-bounce",
                               isDesktop ? "w-2 h-2" : "w-1.5 h-1.5"
                             )} />
                          </div>
                          <span className={cn(
                            "font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse",
                            isDesktop ? "text-[10px]" : "text-[9px]"
                          )}>
                            {isDesktop ? 'Cargando datos' : 'Cargando'}
                          </span>
                       </>
                     )}
                  </div>
                </>
              ) : (
                <EmptyState compact={!isDesktop} />
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

function EmptyState({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground" style={{ padding: compact ? '3rem 1rem' : '3rem 1rem' }}>
       <MessageSquare className={cn("opacity-20 mb-4", compact ? "h-10 w-10" : "h-12 w-12")} />
       <p className={cn("font-medium", compact ? "text-sm" : "text-base")}>Todavía no hay comentarios.</p>
       <p className={cn("mt-1", compact ? "text-[11px]" : "text-xs")}>¡Sé el primero en completar este workout y dejar una reseña!</p>
    </div>
  )
}

function CommentCard({ comment, index, compact = false }: { comment: any; index: number; compact?: boolean }) {
  const feeling = comment.feeling ? FEELING_CONFIG[comment.feeling as keyof typeof FEELING_CONFIG] : null
  const isWorkoutRecord = !!comment.challenge?.is_workout_record

  return (
    <div
      className={cn(
        "group relative perspective-1000 animate-in fade-in zoom-in-95 duration-500 fill-mode-backwards",
        isWorkoutRecord && "z-10"
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className={cn(
        "relative overflow-hidden backdrop-blur-md border transition-all duration-300 hover:scale-[1.015] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]",
        isWorkoutRecord
          ? "bg-gradient-to-br from-amber-500/15 via-yellow-400/10 to-orange-500/10 border-amber-400/50 shadow-[0_0_40px_-16px_rgba(245,158,11,0.5)] hover:border-amber-300/70"
          : "bg-gradient-to-br from-background/80 via-background/60 to-background/40 border-white/10 hover:border-primary/30",
        compact ? "rounded-[1.25rem] p-4" : "rounded-[2rem] p-6"
      )}>
        {isWorkoutRecord && (
          <>
            <div className="absolute top-0 right-0 w-52 h-52 bg-amber-400/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-70 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl -ml-8 -mb-8 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/0 via-amber-400/[0.04] to-amber-400/0 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-300/70 to-transparent opacity-80 pointer-events-none" />
            <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 z-30 rotate-[12deg] drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]">
              <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full shadow-lg shadow-amber-500/40 border border-white/50 animate-[pulse_2s_ease-in-out_infinite]">
                <Crown className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5", "text-amber-900 drop-shadow-sm")} />
                <span className={cn(
                  "font-black uppercase tracking-widest italic",
                  compact ? "text-[10px]" : "text-[10px] sm:text-[11px]"
                )}>
                  New Record
                </span>
              </div>
            </div>
          </>
        )}
        {!isWorkoutRecord && (
          <>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-70" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl -ml-5 -mb-5" />
          </>
        )}

        <div className="flex justify-between items-start mb-3 sm:mb-4 relative z-10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
             <div className={cn("relative shrink-0 group-hover:scale-105 transition-transform duration-300", compact ? "w-10 h-10" : "w-12 h-12")}>
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                {comment.user.avatar_url ? (
                  <img
                    src={comment.user.avatar_url}
                    alt={comment.user.name || 'Usuario'}
                    className={cn(
                      "relative rounded-xl object-cover shadow-lg border border-white/10 bg-background",
                      compact ? "w-10 h-10" : "w-12 h-12"
                    )}
                  />
                ) : (
                  <div className={cn(
                    "relative rounded-xl bg-secondary/30 flex items-center justify-center border border-white/10 backdrop-blur-sm",
                    compact ? "w-10 h-10" : "w-12 h-12"
                  )}>
                    <User className={cn("text-muted-foreground", compact ? "h-4 w-4" : "h-5 w-5")} />
                  </div>
                )}
             </div>

             <div className="flex flex-col min-w-0 flex-1">
                <h4 className={cn(
                  "font-black tracking-tight uppercase italic text-foreground flex items-center gap-1.5 truncate",
                  compact ? "text-sm" : "text-base"
                )}>
                  {comment.user.name || 'Anónimo'}
                </h4>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={cn(
                    "font-mono text-muted-foreground/60 uppercase truncate",
                    compact ? "text-[9px]" : "text-[10px]"
                  )}>
                    @{comment.user.username}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                  <span className={cn(
                    "font-bold text-primary/60 uppercase tracking-wider shrink-0",
                    compact ? "text-[9px]" : "text-[10px]"
                  )}>
                    {comment.completed_at ? timeAgo(comment.completed_at) : 'N/A'}
                  </span>
                </div>
             </div>
          </div>
        </div>

        <div className="relative z-10">
           <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-transparent rounded-full opacity-50" />

           <div className={cn("space-y-2.5 sm:space-y-3 mb-3 sm:mb-4 pt-1", compact ? "pl-3" : "pl-4")}>

               {comment.challenge && (
                 <ChallengeStats challenge={comment.challenge} compact={compact} />
               )}

               <div className="flex items-center gap-2 sm:gap-3">
                  <div className={cn(
                    "flex items-center gap-1 opacity-70 shrink-0",
                    compact ? "w-[60px]" : "w-16"
                  )}>
                    <Star className={cn("text-amber-500 fill-amber-500", compact ? "w-2.5 h-2.5" : "w-3 h-3")} />
                    <span className={cn(
                      "font-black uppercase tracking-widest text-muted-foreground hidden sm:inline",
                      "text-[9px]"
                    )}>Rating</span>
                  </div>
                  <div className={cn(
                    "flex gap-1 flex-1 h-1.5 max-w-[140px]"
                  )}>
                     {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 rounded-[1px] skew-x-[-12deg] transition-all duration-500",
                            comment.rating && i <= comment.rating
                              ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_-2px_rgba(245,158,11,0.5)]"
                              : "bg-muted/20"
                          )}
                        />
                     ))}
                  </div>
                  <span className={cn(
                    "font-black text-amber-500 font-mono tabular-nums",
                    compact ? "w-5 text-[11px]" : "w-6 text-xs"
                  )}>
                    {comment.rating || 0}
                  </span>
               </div>

               {feeling && (
                 <div className={cn("flex items-center gap-2 sm:gap-3", feeling.color)}>
                    <div className={cn(
                      "flex items-center gap-1 opacity-90 shrink-0",
                      compact ? "w-[60px]" : "w-16"
                    )}>
                      <feeling.icon className={cn("", compact ? "w-2.5 h-2.5" : "w-3 h-3")} />
                      <span className={cn(
                        "font-black uppercase tracking-widest text-muted-foreground hidden sm:inline",
                        "text-[9px]"
                      )}>Energía</span>
                    </div>
                    <div className="flex gap-1 flex-1 h-1.5 max-w-[140px]">
                       {[1, 2, 3, 4, 5].map((i) => {
                          const level = FEELING_LEVELS[comment.feeling || ''] || 0
                          const isActive = i <= level
                          return (
                             <div
                               key={i}
                               className={cn(
                                 "flex-1 rounded-[1px] skew-x-[-12deg] transition-all duration-500",
                                 isActive
                                   ? "bg-current shadow-[0_0_8px_-2px_currentColor]"
                                   : "bg-muted/20"
                               )}
                             />
                          )
                       })}
                    </div>
                    <span className={cn(
                      "font-black uppercase tracking-wide opacity-80",
                      compact ? "text-[9px]" : "text-[9px]"
                    )}>
                      {feeling.label}
                    </span>
                 </div>
               )}
           </div>

           <p className={cn(
             "font-medium leading-relaxed text-foreground/90 pb-1",
             compact ? "pl-3 text-[13px]" : "pl-4 text-sm"
           )}>
              {comment.notes}
           </p>
        </div>

        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
           <div className="w-16 h-16 border-t-2 border-r-2 border-primary rounded-tr-3xl" />
        </div>
      </div>
    </div>
  )
}

function ChallengeStats({ challenge, compact = false }: { challenge: any; compact?: boolean }) {
  const isWorkoutRecord = !!challenge.is_workout_record

  return (
    <div className={cn(
      "rounded-2xl border",
      isWorkoutRecord
        ? "bg-gradient-to-r from-amber-400/25 via-yellow-300/10 to-amber-500/15 border-amber-400/60 shadow-[0_0_24px_-8px_rgba(251,191,36,0.4)]"
        : "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20",
      compact ? "mb-2 p-2.5" : "mb-2 p-3"
    )}>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={cn(
            "rounded-lg flex items-center justify-center",
            isWorkoutRecord
              ? compact ? "p-1 bg-amber-400/40" : "p-1.5 bg-amber-400/40"
              : compact ? "p-1 bg-primary/20" : "p-1.5 bg-primary/20"
          )}>
            <Trophy className={cn(
              isWorkoutRecord ? "text-amber-700 dark:text-amber-300" : "text-primary",
              compact ? "w-3 h-3" : "w-3.5 h-3.5"
            )} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="hidden sm:block text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">Puntuación</span>
            <span className={cn(
              "font-black font-mono tabular-nums",
              isWorkoutRecord
                ? "text-amber-700 dark:text-amber-300"
                : "text-primary",
              compact ? "text-sm" : "text-sm"
            )}>{challenge.score}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={cn(
            "bg-emerald-500/20 rounded-lg flex items-center justify-center",
            compact ? "p-1" : "p-1.5"
          )}>
            <RotateCcw className={cn("text-emerald-500", compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="hidden sm:block text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">Rondas</span>
            <span className={cn(
              "font-black text-emerald-500 font-mono tabular-nums",
              compact ? "text-sm" : "text-sm"
            )}>{challenge.rounds_completed}</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className={cn(
            "rounded-lg",
            isWorkoutRecord ? "p-1.5 bg-amber-400/30" : "p-1.5 bg-amber-500/20"
          )}>
            <Timer className={cn(
              "w-3.5 h-3.5",
              isWorkoutRecord ? "text-amber-700 dark:text-amber-300" : "text-amber-500"
            )} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">Límite</span>
            <span className={cn(
              "text-sm font-black font-mono tabular-nums",
              isWorkoutRecord ? "text-amber-700 dark:text-amber-300" : "text-amber-500"
            )}>
              {Math.floor(challenge.time_cap_seconds / 60)}:{String(challenge.time_cap_seconds % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CommentCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn(
      "relative overflow-hidden bg-gradient-to-br from-background/80 via-background/60 to-background/40 backdrop-blur-md border border-white/10",
      compact ? "rounded-[1.25rem] p-4" : "rounded-[2rem] p-6"
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl -ml-5 -mb-5" />

      <div className={cn("flex justify-between items-start mb-3 sm:mb-4 relative z-10", !compact && "sm:mb-4")}>
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className={cn(
            "relative shrink-0 rounded-xl bg-secondary/30 border border-white/10 backdrop-blur-sm overflow-hidden",
            compact ? "w-10 h-10" : "w-12 h-12"
          )}>
            <div className="w-full h-full bg-muted/70" />
          </div>

          <div className="flex flex-col min-w-0 flex-1 gap-1.5">
            <div className={cn("rounded bg-muted/60", compact ? "h-3.5 w-24" : "h-4 w-32")} />
            <div className="flex items-center gap-1.5 min-w-0">
              <div className={cn("rounded bg-muted/50", compact ? "h-2.5 w-16" : "h-3 w-20")} />
              <div className="w-1 h-1 rounded-full bg-muted/40 shrink-0" />
              <div className={cn("rounded bg-muted/50", compact ? "h-2.5 w-10" : "h-3 w-14")} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/30 to-transparent rounded-full opacity-40" />

        <div className={cn("space-y-2.5 sm:space-y-3 mb-3 sm:mb-4 pt-1", compact ? "pl-3" : "pl-4")}>
          <div className={cn(
            "rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/15 mb-1",
            compact ? "p-2.5" : "p-3"
          )}>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={cn("rounded-lg bg-muted/60", compact ? "w-7 h-7" : "w-8 h-8")} />
                <div className={cn("rounded bg-muted/60", compact ? "h-4 w-8" : "h-5 w-10")} />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={cn("rounded-lg bg-muted/60", compact ? "w-7 h-7" : "w-8 h-8")} />
                <div className={cn("rounded bg-muted/60", compact ? "h-4 w-6" : "h-5 w-8")} />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={cn("rounded-lg bg-muted/60", compact ? "w-7 h-7" : "w-8 h-8")} />
                <div className={cn("rounded bg-muted/60", compact ? "h-4 w-6" : "h-5 w-8")} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn(
              "rounded bg-muted/60 shrink-0",
              compact ? "w-[60px] h-3" : "w-16 h-3.5"
            )} />
            <div className={cn(
              "flex gap-1 flex-1 h-1.5 max-w-[140px]"
            )}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex-1 rounded-[1px] skew-x-[-12deg] bg-muted/40"
                />
              ))}
            </div>
            <div className={cn(
              "rounded bg-muted/60",
              compact ? "w-5 h-4" : "w-6 h-5"
            )} />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn(
              "rounded bg-muted/60 shrink-0",
              compact ? "w-[60px] h-3" : "w-16 h-3.5"
            )} />
            <div className="flex gap-1 flex-1 h-1.5 max-w-[140px]">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex-1 rounded-[1px] skew-x-[-12deg] bg-muted/40"
                />
              ))}
            </div>
            <div className={cn("rounded bg-muted/50", compact ? "h-3 w-10" : "h-3.5 w-14")} />
          </div>
        </div>

        <div className="space-y-2 pb-1" style={{ paddingLeft: compact ? '0.75rem' : '1rem' }}>
          <div className={cn("rounded bg-muted/60", compact ? "h-3.5 w-full" : "h-4 w-full")} />
          <div className={cn("rounded bg-muted/50", compact ? "h-3.5 w-4/5" : "h-4 w-3/4")} />
          <div className={cn("rounded bg-muted/40", compact ? "h-3.5 w-2/3" : "h-4 w-1/2")} />
        </div>
      </div>

      <div className="absolute top-0 right-0 p-3 opacity-20">
        <div className="w-16 h-16 border-t-2 border-r-2 border-primary/50 rounded-tr-3xl" />
      </div>
    </div>
  )
}
