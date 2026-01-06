import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/Button'
import { LocalWorkout } from '@/types/workout/viewTypes'
import { ChevronLeft, Dumbbell, Info, Play, TimerIcon, Lock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton'

interface WorkoutOverviewProps {
  workout: LocalWorkout
  onStart: () => void
  onResume?: () => void
  onBack: () => void
  hasActiveSession?: boolean
  onExerciseClick: (sectionIndex: number, exerciseIndex: number) => void
  isAuthenticated?: boolean
}

export function WorkoutOverview({ 
  workout, 
  onStart, 
  onResume, 
  onBack, 
  hasActiveSession, 
  onExerciseClick,
  isAuthenticated = false 
}: WorkoutOverviewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const heroImage = workout.cover
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const handleStart = () => {
    if (!isAuthenticated) {
      setShowLoginDialog(true)
      return
    }
    onStart()
  }

  const handleResume = () => {
    if (!isAuthenticated) {
      setShowLoginDialog(true)
      return
    }
    if (onResume) onResume()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 relative">
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">Join to Start Training</DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              Create an account or log in to track your progress, earn XP, and save your workout history.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <GoogleAuthButton 
                text="Continue with Google" 
                className="w-full h-12 text-base"
                next={pathname}
            />
            
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
            </div>

            <Button 
                className="w-full h-12 text-base font-semibold" 
                onClick={() => router.push(`/auth/login?redirect=${pathname}`)}
            >
              Log In
            </Button>
            
            <Button 
                variant="outline" 
                className="w-full h-12 text-base"
                onClick={() => router.push(`/auth/register?redirect=${pathname}`)}
            >
              Create Account
            </Button>
          </div>

          <DialogFooter className="sm:justify-center">
             <Button variant="ghost" size="sm" onClick={() => setShowLoginDialog(false)} className="text-muted-foreground">
              Maybe later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative h-[45vh] min-h-[350px] w-full overflow-hidden">
         <div className="absolute top-4 left-4 z-50">
           <Button 
             variant="ghost" 
             size="icon" 
             className="h-10 w-10 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 border border-white/10" 
             onClick={onBack}
           >
             <ChevronLeft className="w-6 h-6" />
           </Button>
         </div>

         <div className="absolute inset-0">
           <img 
             src={heroImage} 
             alt="Workout Cover" 
             className="w-full h-full object-cover opacity-80"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/30" />
         </div>
         
         <div className="absolute bottom-0 left-0 right-0 p-6 max-w-3xl mx-auto w-full z-10">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md text-primary text-xs font-medium mb-4 border border-primary/20">
             <Dumbbell className="w-3 h-3" /> Strength Training
           </div>
           <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-2 drop-shadow-sm">
             {workout.title}
           </h1>
           <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
             <span className="flex items-center gap-1">
               <TimerIcon className="w-4 h-4" /> 45 mins
             </span>
             <span className="flex items-center gap-1">
               <Info className="w-4 h-4" /> Intermediate
             </span>
           </div>
         </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
         <div className="prose prose-invert max-w-none">
           <p className="text-lg text-muted-foreground leading-relaxed">
             {workout.description}
           </p>
         </div>

         <div className="space-y-8">
           {workout.sections.map((section, idx) => (
             <div key={idx} className="space-y-4">
               <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                 <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-sm font-bold text-primary ring-1 ring-border">
                   {idx + 1}
                 </span>
                 <h3 className="text-xl font-bold tracking-tight">{section.name}</h3>
               </div>
               
               <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                 {section.exercises.map((ex, exIdx) => (
                   <div 
                     key={exIdx} 
                     className="group relative flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer"
                     onClick={() => onExerciseClick(idx, exIdx)}
                   >
                     <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/30">
                      {ex.media_url ? (
                        /\.(mp4|webm|ogg|mov)($|\?)/i.test(ex.media_url) ? (
                          <video 
                            src={ex.media_url} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            muted
                            loop
                            playsInline
                            autoPlay
                          />
                        ) : (
                          <img src={ex.media_url} alt={ex.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Dumbbell className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                     
                     <div className="flex-1 min-w-0">
                       <h4 className="font-semibold text-foreground truncate pr-2">{ex.name}</h4>
                       <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                         <span className="bg-secondary px-2 py-0.5 rounded-md font-medium">
                           {ex.type === 'reps' ? `${ex.reps} reps` : `${ex.duration}s`}
                         </span>
                         {ex.sets && <span>{ex.sets} sets</span>}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           ))}
         </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent z-50 pb-8">
         <div className="max-w-md mx-auto w-full flex gap-3">
           <Button 
             className="flex-1 h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl" 
             onClick={handleStart}
           >
             <Play className="w-6 h-6 mr-2 fill-current" /> 
             {hasActiveSession ? 'Restart Workout' : 'Start Workout'}
           </Button>

           {hasActiveSession && onResume && (
             <Button 
               className="flex-1 h-14 text-lg font-bold shadow-xl shadow-orange-500/20 bg-orange-500 hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl text-white" 
               onClick={handleResume}
             >
               <Play className="w-6 h-6 mr-2 fill-current" /> 
               Resume
             </Button>
           )}
         </div>
      </div>
    </div>
  )
}