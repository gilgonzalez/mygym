'use client'

import { Button } from '@/components/ui/button'
import { LocalSection, LocalWorkout } from '@/types/workout/viewTypes'
import { ChevronLeft, Dumbbell, Flame, LucideIcon, Repeat, Timer, Zap } from 'lucide-react'
import { formatDuration } from '@/lib/time'
import { WorkoutSegmentKind } from '@/lib/workout/segmentKind'

interface WorkoutSegmentStat {
  icon: LucideIcon
  label: string
  value: string
}

interface WorkoutChangeTypeViewProps {
  workout: LocalWorkout
  /** The section the user is about to enter. */
  section: LocalSection
  /** The mode of the section being entered — decides copy, icon and stats shown. */
  toKind: WorkoutSegmentKind
  /** The mode of the section just finished, if any (omit for the very first segment). */
  fromKind?: WorkoutSegmentKind | null
  /** Time cap for time-boxed modes (amrap, and future modes like emom). Ignored otherwise. */
  timeCapSeconds?: number
  onContinue: () => void
  onExit: () => void
}

interface KindConfig {
  title: string
  defaultBadge: string
  ctaLabel: string
  icon: LucideIcon
  iconWrapClassName: string
  ctaClassName: string
  statIconClassName: string
  describe: (section: LocalSection) => string
  buildStats: (section: LocalSection, timeCapSeconds?: number) => WorkoutSegmentStat[]
}

const KIND_CONFIG: Record<WorkoutSegmentKind, KindConfig> = {
  amrap: {
    title: 'Reto AMRAP',
    defaultBadge: 'Siguiente sección',
    ctaLabel: 'Comenzar reto AMRAP',
    icon: Zap,
    iconWrapClassName: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.25)]',
    ctaClassName: 'bg-emerald-400 text-slate-950 shadow-[0_18px_50px_rgba(34,197,94,0.28)] hover:bg-emerald-300',
    statIconClassName: 'text-emerald-300',
    describe: (section) =>
      `${section.name}. Completa tantas rondas del circuito como puedas antes de que se acabe el tiempo.`,
    buildStats: (section, timeCapSeconds) => [
      {
        icon: Timer,
        label: 'Tiempo límite',
        value: formatDuration(timeCapSeconds || 0, { style: 'clock' }),
      },
      {
        icon: Flame,
        label: 'Ejercicios / ronda',
        value: String(section.exercises.length),
      },
    ],
  },
  standard: {
    title: 'Modo estándar',
    defaultBadge: 'Siguiente sección',
    ctaLabel: 'Continuar entrenamiento',
    icon: Dumbbell,
    iconWrapClassName: 'border-sky-400/30 bg-sky-400/10 text-sky-300 shadow-[0_0_40px_rgba(56,189,248,0.25)]',
    ctaClassName: 'bg-sky-400 text-slate-950 shadow-[0_18px_50px_rgba(56,189,248,0.28)] hover:bg-sky-300',
    statIconClassName: 'text-sky-300',
    describe: (section) => `${section.name}. Sigue cada ejercicio a tu ritmo, con series y descansos guiados.`,
    buildStats: (section) => [
      {
        icon: Repeat,
        label: 'Ejercicios',
        value: String(section.exercises.length),
      },
      {
        icon: Timer,
        label: 'Series máx.',
        value: String(Math.max(...section.exercises.map((exercise) => exercise.sets || 1), 1)),
      },
    ],
  },
}

// Copy shown above the title when the transition is meaningful enough to name explicitly
// (right now, coming out of an AMRAP). Falls back to each kind's generic defaultBadge.
function getTransitionBadge(fromKind: WorkoutSegmentKind | null | undefined, toKind: WorkoutSegmentKind) {
  if (fromKind === 'amrap' && toKind === 'standard') return 'Reto completado'
  return KIND_CONFIG[toKind].defaultBadge
}

// Bridges any change of section "mode" during a session — normal exercises into an AMRAP
// circuit, an AMRAP back into normal exercises, and (once added) other timed modes like
// EMOM. Each mode has very different pacing and visual language, so cutting straight from
// one execution view into another reads as jarring; this screen gives the user a beat to
// read the rules of what's coming before it starts.
export function WorkoutChangeTypeView({
  workout,
  section,
  toKind,
  fromKind,
  timeCapSeconds,
  onContinue,
  onExit,
}: WorkoutChangeTypeViewProps) {
  const config = KIND_CONFIG[toKind]
  const exercises = section.exercises || []
  const stats = config.buildStats(section, timeCapSeconds)
  const Icon = config.icon

  return (
    <div className="relative flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#040612] text-white animate-reveal-vertical">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.1),transparent_26%),linear-gradient(180deg,#09111f_0%,#050816_55%,#040612_100%)]" />
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="px-4 pb-3 pt-3 sm:px-6">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
              onClick={onExit}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <p className="truncate text-sm font-semibold text-white/60">{workout.title}</p>
          </div>
        </header>

        <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-4 text-center sm:gap-8 sm:px-6">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full border sm:h-20 sm:w-20 ${config.iconWrapClassName}`}>
            <Icon className="h-8 w-8 sm:h-9 sm:w-9" />
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/45">
              {getTransitionBadge(fromKind, toKind)}
            </p>
            <h1 className="mt-2 text-[clamp(2rem,7vw,3.2rem)] font-black leading-[0.95] tracking-[-0.03em] text-white">
              {config.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/55 sm:text-base">
              {config.describe(section)}
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:max-w-sm">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1.5 rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4"
              >
                <stat.icon className={`h-5 w-5 ${config.statIconClassName}`} />
                <p className="font-timer text-xl font-bold tracking-[0.05em] text-white">{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>

          {exercises.length > 0 && (
            <div className="w-full max-w-sm text-left">
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
                {section.name}
              </p>
              <div className="space-y-1.5">
                {exercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className="flex items-center gap-3 rounded-[16px] border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-bold text-white/70">
                      {index + 1}
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.05]">
                      {exercise.thumbnail_url ? (
                        <img
                          src={exercise.thumbnail_url}
                          alt={exercise.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Dumbbell className="h-4 w-4 text-white/25" />
                      )}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white/85">{exercise.name}</p>
                    <p className="shrink-0 text-xs font-semibold text-white/40">
                      {exercise.type === 'time'
                        ? formatDuration(exercise.duration || 0)
                        : exercise.type === 'emom'
                          ? `${exercise.reps || 0} reps · ${formatDuration(exercise.duration || 0)}`
                          : `${exercise.reps || 0} reps`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-2 sm:px-6 sm:pb-6">
          <div className="mx-auto w-full max-w-3xl">
            <Button
              className={`h-14 w-full rounded-[18px] text-base font-bold ${config.ctaClassName}`}
              onClick={onContinue}
            >
              {config.ctaLabel}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
