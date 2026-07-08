'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/Button'
import { Card, CardContent } from '@/components/Card'
import { LocalWorkout } from '@/types/workout/viewTypes'
import { ShareWorkoutDialog } from '../share/ShareWorkoutDialog'
import { Trophy, Dumbbell, Loader2, Star, Timer, Lock, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { logWorkoutCompletion } from '@/app/actions/workout/log'
import { useWorkoutStore } from '@/store/workOutStore'
import { FEELING_CONFIG } from '@/constants/feeling'
import { PremiumFeatureDialog } from '@/components/premium/PremiumFeatureDialog'


interface WorkoutCompletedProps {
  workout: LocalWorkout
  onRestart: () => void
  initialLogId?: string | null
  xpEarned?: number
  canSaveProgress: boolean
}

export function WorkoutCompleted({ workout, onRestart, initialLogId, xpEarned, canSaveProgress }: WorkoutCompletedProps) {
  const router = useRouter()
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [feeling, setFeeling] = useState<string>('happy')
  const [isPending, startTransition] = useTransition()
  const [showShare, setShowShare] = useState(false)
  const [showPremiumDialog, setShowPremiumDialog] = useState(false)
  
  const { startTime, endTime } = useWorkoutStore()

  // Calculate Duration
  const durationMs = (endTime || Date.now()) - (startTime || Date.now())
  const durationMinutes = Math.floor(durationMs / 60000)
  const durationSeconds = Math.floor((durationMs % 60000) / 1000)
  const timeString = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`

  // Calculate Stats
  const totalSets = workout.sections.reduce((acc, section) => 
    acc + section.exercises.reduce((exAcc, ex) => exAcc + (ex.sets || 0), 0)
  , 0)
  
  // XP Calculation (Use prop if available, otherwise 0)
  const displayXp = xpEarned || 0

  const handleFinish = () => {
    if (!canSaveProgress) {
      setShowPremiumDialog(true)
      return
    }

    startTransition(async () => {
      const result = await logWorkoutCompletion(workout.id, notes, rating, initialLogId, feeling)
      if (result.success) {
        router.push('/profile')
        router.refresh()
      } else {
        // Handle error (could add toast here)
        console.error('Failed to log workout')
      }
    })
  }

  const saveProgressBlock = (
    <>
      <div className="grid grid-cols-3 gap-3 w-full">
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <Dumbbell className="w-5 h-5 text-blue-500 mb-1" />
            <span className="text-xl font-bold tracking-tight">{totalSets}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sets</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <Timer className="w-5 h-5 text-green-500 mb-1" />
            <span className="text-xl font-bold tracking-tight">{timeString}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Time</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-secondary/20 hover:bg-secondary/30 transition-colors relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Trophy className="w-5 h-5 text-amber-500 mb-1" />
            <span className="text-xl font-black text-amber-500 drop-shadow-sm">+{displayXp}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">XP</span>
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full py-2">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Rate Workout</label>
          <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                  <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                      <Star 
                          className={cn(
                              "w-8 h-8 transition-colors duration-200",
                              (hoverRating ? star <= hoverRating : star <= rating)
                                  ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                                  : "text-muted-foreground/20"
                          )} 
                      />
                  </button>
              ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">How do you feel?</label>
          <div className="flex items-center justify-center gap-4">
              {Object.values(FEELING_CONFIG).map((item) => (
                  <button
                      key={item.value}
                      onClick={() => setFeeling(item.value)}
                      className={cn(
                          "flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300",
                          feeling === item.value 
                              ? "bg-primary/5 shadow-md scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background" 
                              : "hover:bg-secondary/30 hover:scale-105 opacity-80 hover:opacity-100"
                      )}
                      title={item.label}
                  >
                      <item.icon className={cn("w-8 h-8", item.color, feeling === item.value && "fill-current/20")} />
                  </button>
              ))}
          </div>
        </div>
      </div>

      <div className="w-full space-y-1 text-left">
        <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about your workout... (Optional)"
            className="w-full h-20 p-3 rounded-xl bg-secondary/20 border border-input focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all text-sm placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="flex w-full flex-col gap-3 pt-2">
        <Button
          className="h-11 w-full text-base font-bold shadow-lg shadow-primary/20"
          size="lg"
          onClick={handleFinish}
          disabled={isPending || !canSaveProgress}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Progress...
            </>
          ) : (
            'Save & Finish Workout'
          )}
        </Button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 overflow-y-auto">
      <Card className="max-w-lg w-full border-primary/20 glow-card animate-in zoom-in-95 duration-500 shadow-2xl my-auto relative">
        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
          
          {/* Header */}
          <div className="space-y-1">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 ring-4 ring-primary/10 animate-bounce-slow">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">Workout Crushed!</h2>
            <p className="text-sm text-muted-foreground">
              You completed <span className="font-bold text-primary">{workout.title}</span>
            </p>
          </div>

          {canSaveProgress ? (
            saveProgressBlock
          ) : (
            <>
           
              <div className="pointer-events-none select-none space-y-4 opacity-40 blur-[3px]">
                {saveProgressBlock}
              </div>

              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="flex w-full max-w-sm flex-col gap-4 rounded-[26px] border border-amber-500/20 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.86))] px-5 py-5 text-center shadow-[0_32px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-3 text-left">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/14 text-amber-500 ring-1 ring-amber-500/20">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">Guardado de progreso</p>
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                            Premium
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Este formulario de guardado, con tus stats, valoracion, sensaciones y notas, solo puede almacenarse si eres usuario premium.
                        </p>
                      </div>
                    </div>

                    <div className="hidden shrink-0 items-center gap-1 rounded-full border border-amber-500/15 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-500 sm:flex">
                      <Sparkles className="h-3 w-3" />
                      Locked
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setShowPremiumDialog(true)}>
                      Ver ventajas premium
                    </Button>
                    <Button type="button" variant="ghost" className="flex-1 rounded-xl text-muted-foreground hover:text-foreground" onClick={onRestart}>
                      Repetir workout
                    </Button>
                  </div>
                </div>
              </div>
               </>
          )}

          {!isPending && canSaveProgress && (
              <button 
                  onClick={onRestart}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors py-2"
              >
                  I want to repeat this workout
              </button>
          )}

        </CardContent>
      </Card>
      
      <ShareWorkoutDialog 
        open={showShare} 
        onOpenChange={setShowShare} 
        workout={workout} 
      />

      <PremiumFeatureDialog
        open={showPremiumDialog}
        onOpenChange={setShowPremiumDialog}
        description="Guardar el progreso al finalizar un workout esta disponible solo para usuarios premium. Actualiza tu plan para registrar notas, valoraciones, XP y estadisticas."
      />
    </div>
  )
}
