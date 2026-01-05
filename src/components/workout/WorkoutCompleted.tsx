'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/Button'
import { Card, CardContent } from '@/components/Card'
import { LocalWorkout } from '@/types/workout/viewTypes'
import { Trophy, Dumbbell, Loader2, Star, Timer, Frown, Meh, Smile, Zap, BatteryWarning } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { logWorkoutCompletion } from '@/app/actions/workout/log'
import { useWorkoutStore } from '@/store/workOutStore'


interface WorkoutCompletedProps {
  workout: LocalWorkout
  onRestart: () => void
  initialLogId?: string | null
  xpEarned?: number
}

export function WorkoutCompleted({ workout, onRestart, initialLogId, xpEarned }: WorkoutCompletedProps) {
  const router = useRouter()
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [feeling, setFeeling] = useState<string>('happy')
  const [isPending, startTransition] = useTransition()
  
  const { startTime, endTime } = useWorkoutStore()

  // Calculate Duration
  const durationMs = (endTime || Date.now()) - (startTime || Date.now())
  const durationMinutes = Math.floor(durationMs / 60000)
  const durationSeconds = Math.floor((durationMs % 60000) / 1000)
  const timeString = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`

  // Calculate Stats
  const totalExercises = workout.sections.reduce((acc, section) => acc + section.exercises.length, 0)
  const totalSets = workout.sections.reduce((acc, section) => 
    acc + section.exercises.reduce((exAcc, ex) => exAcc + (ex.sets || 0), 0)
  , 0)
  
  // XP Calculation (Use prop if available, otherwise 0)
  const displayXp = xpEarned || 0

  const handleFinish = () => {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 overflow-y-auto">
      <Card className="max-w-lg w-full border-primary/20 glow-card animate-in zoom-in-95 duration-500 shadow-2xl my-auto">
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

          {/* Stats Grid - Single Row */}
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

          {/* Feedback Section */}
          <div className="flex flex-col gap-6 w-full py-2">
            {/* Rating Section */}
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

            {/* Feeling Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">How do you feel?</label>
              <div className="flex items-center justify-center gap-4">
                  {[
                      { value: 'tired', icon: BatteryWarning, label: 'Tired', color: 'text-red-500' },
                      { value: 'sad', icon: Frown, label: 'Bad', color: 'text-orange-500' },
                      { value: 'normal', icon: Meh, label: 'Okay', color: 'text-yellow-500' },
                      { value: 'happy', icon: Smile, label: 'Good', color: 'text-green-500' },
                      { value: 'pumped', icon: Zap, label: 'Pumped', color: 'text-blue-500' },
                  ].map((item) => (
                      <button
                          key={item.value}
                          onClick={() => setFeeling(item.value)}
                          className={cn(
                              "flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300",
                              feeling === item.value 
                                  ? "bg-background shadow-lg scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background" 
                                  : "hover:bg-secondary/50 opacity-50 hover:opacity-100 hover:scale-105"
                          )}
                          title={item.label}
                      >
                          <item.icon className={cn("w-7 h-7", item.color, feeling === item.value && "fill-current/10")} />
                      </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="w-full space-y-1 text-left">
            <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about your workout... (Optional)"
                className="w-full h-20 p-3 rounded-xl bg-secondary/20 border border-input focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all text-sm placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 w-full pt-2">
            <Button 
              className="w-full h-11 text-base font-bold shadow-lg shadow-primary/20"
              size="lg"
              onClick={handleFinish}
              disabled={isPending}
            >
              {isPending ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Progress...
                </>
              ) : (
                "Save & Finish Workout"
              )}
            </Button>
            
            {!isPending && (
                <button 
                    onClick={onRestart}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors py-2"
                >
                    I want to repeat this workout
                </button>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  )
}