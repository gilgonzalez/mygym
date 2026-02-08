'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Star, User } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet'
import { getWorkoutComments, Comment } from '@/app/actions/workout/get-comment'
import { useInfiniteQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { FEELING_CONFIG } from '@/constants/feeling'

interface WorkoutCommentsSheetProps {
  workoutId: string
  children: React.ReactNode
}

function timeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

const FEELING_LEVELS: Record<string, number> = {
  tired: 1,
  sad: 2,
  normal: 3,
  happy: 4,
  pumped: 5
}

export function WorkoutCommentsSheet({ workoutId, children }: WorkoutCommentsSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const observerTarget = useRef(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['workout-comments', workoutId],
    queryFn: async ({ pageParam }) => {
      const res = await getWorkoutComments(workoutId, pageParam as number)
      if (!res.success) throw new Error(res.error)
      return res.data || []
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
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

  return (
    <Sheet onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col h-full border-l-primary/10 bg-background/95 backdrop-blur-xl">
        <SheetHeader className="pb-6 border-b border-border/40 space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-primary/10 rounded-xl">
               <MessageSquare className="w-5 h-5 text-primary" />
             </div>
             <div className="flex flex-col">
                <SheetTitle className="text-2xl font-black italic tracking-tighter uppercase text-foreground">
                  Locker Room
                </SheetTitle>
                <SheetDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                  Community Vibes & Stats
                </SheetDescription>
             </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto mt-6 -mr-6 pr-6 custom-scrollbar pb-8">
          <div className="space-y-6">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                 {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 rounded-3xl bg-muted/20 border border-white/5" />
                 ))}
              </div>
            ) : comments.length > 0 ? (
              <>
                {comments.map((comment, index) => {
                  const feeling = comment.feeling ? FEELING_CONFIG[comment.feeling as keyof typeof FEELING_CONFIG] : null
                  
                  return (
                    <div 
                      key={comment.id} 
                      className="group relative perspective-1000 animate-in fade-in zoom-in-95 duration-500 fill-mode-backwards"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* The Card */}
                      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-background/80 via-background/60 to-background/40 backdrop-blur-md border border-white/10 p-5 transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
                        
                        {/* Decorative Background Blobs */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-70" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl -ml-5 -mb-5" />
                        
                        {/* Header: User & Meta */}
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex items-center gap-3">
                             {/* Angular Avatar Container */}
                             <div className="relative w-12 h-12 shrink-0 group-hover:scale-105 transition-transform duration-300">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                                {comment.user.avatar_url ? (
                                  <img 
                                    src={comment.user.avatar_url} 
                                    alt={comment.user.name || 'User'} 
                                    className="relative w-12 h-12 rounded-xl object-cover shadow-lg border border-white/10 bg-background" 
                                  />
                                ) : (
                                  <div className="relative w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center border border-white/10 backdrop-blur-sm">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                             </div>
                             
                             <div className="flex flex-col">
                                <h4 className="font-black text-base tracking-tight uppercase italic text-foreground flex items-center gap-2">
                                  {comment.user.name || 'Anonymous'}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">
                                    @{comment.user.username}
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-primary/40" />
                                  <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">
                                    {comment.completed_at ? timeAgo(comment.completed_at) : 'N/A'}
                                  </span>
                                </div>
                             </div>
                          </div>
                        </div>

                        {/* The Comment & Metrics (Data Log) */}
                        <div className="relative z-10">
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-transparent rounded-full opacity-50" />
                           
                           {/* Integrated Metrics */}
                           <div className="pl-4 space-y-3 mb-4 pt-1">
                               {/* Rating Row */}
                               <div className="flex items-center gap-3">
                                  <div className="w-16 flex items-center gap-1.5 opacity-70 shrink-0">
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Rating</span>
                                  </div>
                                  <div className="flex gap-1 flex-1 h-1.5 max-w-[140px]">
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
                                  <span className="w-6 text-xs font-black text-amber-500 font-mono tabular-nums">
                                    {comment.rating || 0}
                                  </span>
                               </div>

                               {/* Energy Row */}
                               {feeling && (
                                 <div className={cn("flex items-center gap-3", feeling.color)}>
                                    <div className="w-16 flex items-center gap-1.5 opacity-90 shrink-0">
                                      <feeling.icon className="w-3 h-3" />
                                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Energy</span>
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
                                    <span className="text-[9px] font-black uppercase tracking-wide opacity-80">
                                      {feeling.label}
                                    </span>
                                 </div>
                               )}
                           </div>

                           {/* Comment Text */}
                           <p className="text-sm font-medium leading-relaxed text-foreground/90 pl-4 pb-1">
                              {comment.notes}
                           </p>
                        </div>
                        
                        {/* Decorative Corner */}
                        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                           <div className="w-16 h-16 border-t-2 border-r-2 border-primary rounded-tr-3xl" />
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {/* Intersection Observer Target */}
                <div ref={observerTarget} className="h-20 w-full flex flex-col items-center justify-center mt-4 gap-2">
                   {isFetchingNextPage && (
                     <>
                        <div className="flex gap-1">
                           <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                           <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                           <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
                          Loading Data
                        </span>
                     </>
                   )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                 <MessageSquare className="h-12 w-12 opacity-20 mb-4" />
                 <p>No comments yet.</p>
                 <p className="text-xs">Be the first to complete this workout and leave a review!</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}