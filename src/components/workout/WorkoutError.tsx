'use client'

import { Dumbbell, Home, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import { useRouter } from 'next/navigation'

interface WorkoutErrorProps {
  onRetry?: () => void
  error?: string
}

export function WorkoutError({ onRetry, error }: WorkoutErrorProps) {
  const router = useRouter()
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-destructive/20 rounded-full animate-ping opacity-75 duration-1000" />
          <div className="relative bg-background border-4 border-destructive/10 p-6 rounded-full shadow-2xl">
            <div className="relative">
                 <Dumbbell className="w-16 h-16 text-destructive -rotate-12 group-hover:rotate-12 transition-transform duration-300" />
                 <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 border-2 border-background shadow-sm">
                    <AlertCircle className="w-6 h-6 text-destructive fill-background" />
                 </div>
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-black mb-3 tracking-tight text-foreground">
          ¡Entrenamiento Caído!
        </h1>
        
        <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
          {error || "Parece que este entrenamiento se ha saltado el día de pierna... o simplemente no hemos podido encontrarlo."}
        </p>

        <div className="flex flex-col gap-3 w-full sm:w-auto sm:min-w-[200px]">
          {onRetry && (
            <Button 
                onClick={onRetry} 
                size="lg" 
                className="w-full gap-2 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
            >
                <RefreshCw className="w-4 h-4" />
                Reintentar
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => router.push('/')} 
            className="w-full gap-2 border-2 hover:bg-accent/50"
          >
            <Home className="w-4 h-4" />
            Volver al Gimnasio
          </Button>
        </div>
      </div>
    </div>
  )
}