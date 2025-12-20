import { Button } from '@/components/Button'
import { Card, CardContent } from '@/components/Card'
import { LocalWorkout } from '@/types/workout/viewTypes'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface WorkoutCompletedProps {
  workout: LocalWorkout
  onRestart: () => void
}

export function WorkoutCompleted({ workout, onRestart }: WorkoutCompletedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md w-full border-primary/20 glow-card animate-in zoom-in-95 duration-500">
        <CardContent className="pt-10 flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 ring-4 ring-primary/10">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Workout Complete!</h2>
          <p className="text-muted-foreground text-lg">
            You crushed {workout.title}. Great work!
          </p>
          <div className="grid grid-cols-2 gap-4 w-full mt-8">
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full h-12">
                Back Home
              </Button>
            </Link>
            <Button 
              className="w-full h-12"
              onClick={onRestart}
            >
              Repeat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}