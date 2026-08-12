'use client'

import { Dumbbell, Home, RefreshCw, AlertTriangle, Shield, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

type WorkoutErrorCode = 'notFound' | 'forbidden' | 'unknown'

interface WorkoutErrorProps {
  onRetry?: () => void
  error?: string
  errorCode?: WorkoutErrorCode
}

export function WorkoutError({ onRetry, error, errorCode }: WorkoutErrorProps) {
  const router = useRouter()

  const visual = (() => {
    switch (errorCode) {
      case 'notFound':
        return {
          icon: SearchX,
          accent: 'border-destructive/10 bg-destructive/5',
          iconColor: 'text-destructive',
          pingColor: 'bg-destructive/20',
          badge: AlertTriangle,
          badgeColor: 'text-destructive',
          title: 'Este entrenamiento no está disponible',
          description:
            'Puede que haya sido eliminado por su autor, el enlace que seguías es incorrecto o ya no está accesible en este momento.',
          showRetry: false,
        }
      case 'forbidden':
        return {
          icon: Shield,
          accent: 'border-amber-500/15 bg-amber-500/5',
          iconColor: 'text-amber-500',
          pingColor: 'bg-amber-500/20',
          badge: Shield,
          badgeColor: 'text-amber-500',
          title: 'No tienes acceso a este entrenamiento',
          description:
            'Este entrenamiento es privado o su autor ha limitado su visibilidad. Prueba a seguir a la persona si acepta seguidores, o vuelve al feed para descubrir otros.',
          showRetry: false,
        }
      default:
        return {
          icon: Dumbbell,
          accent: 'border-destructive/10 bg-destructive/5',
          iconColor: 'text-destructive',
          pingColor: 'bg-destructive/20',
          badge: AlertTriangle,
          badgeColor: 'text-destructive',
          title: '¡Entrenamiento caído!',
          description:
            error ||
            'Parece que este entrenamiento se ha saltado el día de pierna... o simplemente no hemos podido encontrarlo.',
          showRetry: true,
        }
    }
  })()

  const Icon = visual.icon
  const BadgeIcon = visual.badge

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        <div className="relative mb-8 group">
          <div
            className={`absolute inset-0 ${visual.pingColor} rounded-full animate-ping opacity-75 duration-1000`}
          />
          <div className={`relative bg-background border-4 ${visual.accent} p-6 rounded-full shadow-2xl`}>
            <div className="relative">
              <Icon className={`w-16 h-16 ${visual.iconColor} -rotate-12 group-hover:rotate-12 transition-transform duration-300`} />
              <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 border-2 border-background shadow-sm">
                <BadgeIcon className={`w-6 h-6 ${visual.badgeColor} fill-background`} />
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-black mb-3 tracking-tight text-foreground">
          {visual.title}
        </h1>

        <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
          {visual.description}
        </p>

        {errorCode === 'notFound' && (
          <div className="mb-6 w-full rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-left">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="space-y-0.5 text-sm">
                <p className="font-semibold text-foreground">Identificador:</p>
                <p className="font-mono text-xs text-muted-foreground break-all">
                  {typeof window !== 'undefined'
                    ? window.location.pathname.replace(/^\/workout\//, '')
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full sm:w-auto sm:min-w-[200px]">
          {visual.showRetry && onRetry && (
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
            variant={visual.showRetry ? 'outline' : 'default'}
            size="lg"
            onClick={() => router.push('/feed')}
            className={
              visual.showRetry
                ? 'w-full gap-2 border-2 hover:bg-accent/50'
                : 'w-full gap-2 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white'
            }
          >
            <Home className="w-4 h-4" />
            Volver al feed
          </Button>
        </div>
      </div>
    </div>
  )
}