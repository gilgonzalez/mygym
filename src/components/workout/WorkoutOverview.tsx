import { useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LocalExercise, LocalWorkout } from '@/types/workout/viewTypes'
import {
  ChevronLeft,
  Eye,
  Play,
  Lock,
  Target,
  Wrench,
  Share2,
  Trophy,
  ChevronRight,
  Clock,
  Zap,
  X,
  Info,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton'
import { ShareWorkoutDialog } from '../share/ShareWorkoutDialog'
import { ExercisePreviewDialog } from './ExercisePreviewDialog'
import { formatDuration } from '@mygym/shared'

interface WorkoutOverviewProps {
  workout: LocalWorkout
  onStart: () => void
  onResume?: () => void
  onBack: () => void
  hasActiveSession?: boolean
  onExerciseClick: (sectionIndex: number, exerciseIndex: number) => void
  isAuthenticated?: boolean
  canViewPremiumTutorial?: boolean
}

const categoryPalette = ['Fuerza', 'Hipertrofia', 'Cardio', 'Movilidad', 'Resistencia']
const sectionGradientPalette = [
  'from-sky-500 to-blue-500',
  'from-violet-500 to-fuchsia-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-cyan-500 to-sky-500',
]

const safeThumbnail = (url?: string | null): string | undefined => {
  if (!url) return undefined
  const u = String(url).trim()
  if (!u) return undefined
  if (u.startsWith('/')) return u
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')) return u
  return undefined
}

const fallbackThumbnail = (exerciseName: string): string => {
  const key = exerciseName.trim().toLowerCase()
  if (/hip\s*thrust|pelvic|glute.*bridge|puente|gluteo/i.test(key)) {
    return 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop'
  }
  if (/split\s*squat|lung|bulgarian|zancada/i.test(key)) {
    return 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600&auto=format&fit=crop'
  }
  if (/deadlift|romanian|peso\s*muerto|rumano/i.test(key)) {
    return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop'
  }
  if (/leg\s*extension|cuadricep|extension.*pierna/i.test(key)) {
    return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop'
  }
  if (/push\s*up|flexion|fondos/i.test(key)) {
    return 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600&auto=format&fit=crop'
  }
  if (/pull\s*up|dominada|jalon/i.test(key)) {
    return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop'
  }
  if (/shoulder\s*press|press\s*militar|hombro/i.test(key)) {
    return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop'
  }
  if (/plank|plancha|core/i.test(key)) {
    return 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?q=80&w=600&auto=format&fit=crop'
  }
  if (/squat|sentadilla/i.test(key)) {
    return 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop'
  }
  if (/jumping\s*jack|star\s*jump|salto.*jack/i.test(key)) {
    return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop'
  }
  if (/high\s*knee|rodilla\s*alta/i.test(key)) {
    return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop'
  }
  if (/russian\s*twist|giro\s*ruso/i.test(key)) {
    return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=600&auto=format&fit=crop'
  }
  if (/mountain\s*climber|escalad/i.test(key)) {
    return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop'
  }
  if (/curl|bicep|brazos/i.test(key)) {
    return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=600&auto=format&fit=crop'
  }
  if (/lat\s*pulldown|jalon\s*alto|polea/i.test(key)) {
    return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=600&auto=format&fit=crop'
  }
  if (/lateral\s*raise|elevacion\s*lateral|laterales/i.test(key)) {
    return 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600&auto=format&fit=crop'
  }
  if (/incline|press.*banco|banco.*inclinad/i.test(key)) {
    return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop'
  }
  return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop'
}

const formatDifficulty = (difficulty?: string): string => {
  if (!difficulty) return 'Principiante'
  const key = difficulty.trim().toLowerCase()
  if (/principiant|facil|easy|beginner|general|all|mix|todos|todas/i.test(key)) return 'Principiante'
  if (/intermed|medium|intermediate/i.test(key)) return 'Intermedio'
  if (/avanz|hard|dificil|advanced|expert/i.test(key)) return 'Avanzado'
  return 'Principiante'
}

const formatCategoryFromTags = (tags?: string[] | null): string => {
  if (!tags || tags.length === 0) return 'Fuerza'
  for (const raw of tags) {
    const t = String(raw).trim()
    const k = t.toLowerCase()
    if (/hipertr|hypertrophy|volumen|muscular/i.test(k)) return 'Hipertrofia'
    if (/cardio|aerob|resistance|resisten|endurance/i.test(k)) return 'Cardio'
    if (/movil|mobility|flex|estiram/i.test(k)) return 'Movilidad'
    if (/fuerza|strength|power|forza/i.test(k) || /fuer|fuer/i.test(k)) return 'Fuerza'
    if (categoryPalette.includes(t)) return t
  }
  return 'Fuerza'
}

const formatPrivacy = (workout: LocalWorkout): string => {
  const w = workout as unknown as { privacy?: string; is_public?: boolean; visibility?: string }
  const p = (w.privacy || w.visibility || '').trim().toLowerCase()
  if (p) {
    if (/privat|private|solo\s*yo|only/i.test(p)) return 'Privado'
    if (/friend|amig|solo\s*amigos|followers/i.test(p)) return 'Solo amigos'
    if (/public|publi/i.test(p)) return 'Publico'
  }
  if (typeof w.is_public === 'boolean') return w.is_public ? 'Publico' : 'Privado'
  return 'Publico'
}

const renderExerciseMedia = (
  ex: LocalExercise,
  sizeClass: string,
  containerClass: string
) => {
  const thumb = safeThumbnail(ex.thumbnail_url)
  if (!thumb) {
    const fb = fallbackThumbnail(ex.name)
    return (
      <div className={`${sizeClass} ${containerClass}`}>
        <img
          src={fb}
          alt={ex.name}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }
  const isVideo = /\.(mp4|webm|ogg|mov)($|\?)/i.test(thumb)
  return (
    <div className={`${sizeClass} ${containerClass}`}>
      {isVideo ? (
        <video
          src={thumb}
          className="h-full w-full object-cover"
          muted
          loop
          playsInline
          autoPlay
        />
      ) : (
        <img
          src={thumb}
          alt={ex.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            const tgt = e.currentTarget
            if (tgt.dataset.fbApplied === '1') return
            tgt.dataset.fbApplied = '1'
            tgt.src = fallbackThumbnail(ex.name)
          }}
        />
      )}
    </div>
  )
}

export function WorkoutOverview({
  workout,
  onStart,
  onResume,
  onBack,
  hasActiveSession,
  onExerciseClick,
  isAuthenticated = false,
  canViewPremiumTutorial = false,
}: WorkoutOverviewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const heroImage = workout.cover
  const [hasHeroImageError, setHasHeroImageError] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [previewExercise, setPreviewExercise] = useState<LocalExercise | null>(null)
  const [previewSectionName, setPreviewSectionName] = useState<string | undefined>(undefined)
  const [expandedId, setExpandedId] = useState<number | null>(0)

  useEffect(() => {
    setHasHeroImageError(false)
  }, [heroImage])

  const { totalDurationSeconds, uniqueMuscleGroups, uniqueEquipment, totalExercises } = useMemo(() => {
    let totalSeconds = 0
    let exerciseCount = 0
    const muscleGroups = new Set<string>()
    const equipment = new Set<string>()

    workout.sections.forEach(section => {
      section.exercises.forEach(ex => {
        exerciseCount++
        const sets = ex.sets || 1
        const duration = ex.duration || 0
        const rest = ex.rest || 0
        const timePerSet = duration > 0 ? duration : 45
        totalSeconds += (timePerSet + rest) * sets

        ex.muscle_groups?.forEach(m => muscleGroups.add(m))
        ex.equipment?.forEach(e => equipment.add(e))
      })
    })

    return {
      totalDurationSeconds: totalSeconds,
      uniqueMuscleGroups: Array.from(muscleGroups),
      uniqueEquipment: Array.from(equipment),
      totalExercises: exerciseCount,
    }
  }, [workout])

  const durationMinutes = Math.max(1, Math.round(totalDurationSeconds / 60))
  const hasHeroImage = Boolean(heroImage && !hasHeroImageError)
  const isChallengeWorkout = Boolean(workout.challenge)
  const challengeSectionIndex = workout.sections.findIndex(
    (section) => section.id === workout.challenge?.challengeSectionId
  )
  const challengeMinutes = isChallengeWorkout && workout.challenge
    ? Math.max(1, Math.round(workout.challenge.timeCapSeconds / 60))
    : undefined

  const coverImage = hasHeroImage && heroImage
    ? heroImage
    : 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1800&auto=format&fit=crop'

  const level = formatDifficulty(workout.difficulty)
  const category = formatCategoryFromTags(workout.tags)
  const privacy = formatPrivacy(workout)

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

  const handleExerciseClick = (sectionIndex: number, exerciseIndex: number) => {
    if (!isAuthenticated) {
      setShowLoginDialog(true)
      return
    }
    onExerciseClick(sectionIndex, exerciseIndex)
  }

  const handlePreviewOpen = (exercise: LocalExercise, sectionName: string) => {
    setPreviewExercise(exercise)
    setPreviewSectionName(sectionName)
  }

  const sectionCount = workout.sections.length

  return (
    <div className="min-h-screen w-full bg-[#050608] text-foreground pb-32 relative">
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

      <ShareWorkoutDialog
        open={showShare}
        onOpenChange={setShowShare}
        workout={workout}
      />

      <ExercisePreviewDialog
        open={!!previewExercise}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewExercise(null)
            setPreviewSectionName(undefined)
          }
        }}
        exercise={previewExercise}
        sectionName={previewSectionName}
        canViewTutorial={canViewPremiumTutorial}
      />

      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-2xl bg-black/30 backdrop-blur-md text-white hover:bg-black/50 border border-white/10"
          onClick={onBack}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      </div>

      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-2xl bg-black/30 backdrop-blur-md text-white hover:bg-black/50 border border-white/10"
          onClick={() => setShowShare(true)}
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      <div className="relative h-[180px] sm:h-[200px] overflow-hidden border-b border-white/10">
        <img
          src={coverImage}
          alt="Portada"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
          onError={() => setHasHeroImageError(true)}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,12,14,0.25)_0%,rgba(12,12,14,0.92)_100%)]" />
        <div className="relative h-full px-4 sm:px-6 lg:px-8 pt-12 flex items-end justify-between gap-4 max-w-7xl mx-auto w-full pb-5 sm:pb-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] text-violet-300/80 mb-1 sm:mb-1.5 inline-flex items-center gap-1.5">
                <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Workout
              </p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white truncate">
                {workout.title}
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex items-end gap-4 sm:gap-6 md:gap-8 text-right">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Duracion</p>
              <p className="mt-1 text-xl font-black text-white">{durationMinutes} <span className="text-sm font-bold text-white/55">min</span></p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Ejercicios</p>
              <p className="mt-1 text-xl font-black text-white">{totalExercises}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 mb-2">Categoria</p>
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-[13px] font-black text-emerald-300 inline-flex items-center">
              {category}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 mb-2">Nivel</p>
            <div className="rounded-full border border-sky-500/30 bg-sky-500/15 px-4 py-2 text-[13px] font-black text-sky-300 inline-flex items-center">
              {level}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 mb-2">Privacidad</p>
            <div className="rounded-full border border-violet-500/30 bg-violet-500/15 px-4 py-2 text-[13px] font-black text-violet-300 inline-flex items-center">
              {privacy}
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 mb-2">Duracion est.</p>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white">
              {durationMinutes} min · {totalExercises} ejercicios
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="rounded-xl bg-orange-500/15 p-2 text-orange-300">
                <Target className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55">Musculos objetivo</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {uniqueMuscleGroups.length === 0 ? (
                <span className="text-[11px] font-bold text-white/40 italic">Sin datos — derivados del workout</span>
              ) : (
                uniqueMuscleGroups.map((muscle) => {
                  const label = muscle.replace(/_/g, ' ').trim()
                  return (
                    <span
                      key={muscle}
                      className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/12 px-3 py-1.5 text-[11px] font-bold text-orange-200"
                    >
                      {label.length > 0 ? label[0].toUpperCase() + label.slice(1) : label}
                    </span>
                  )
                })
              )}
            </div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="rounded-xl bg-sky-500/15 p-2 text-sky-300">
                <Wrench className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55">Material necesario</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {uniqueEquipment.length === 0 ? (
                <span className="text-[11px] font-bold text-white/40 italic">Sin datos — peso corporal por defecto</span>
              ) : (
                uniqueEquipment.map((item) => {
                  const label = item.replace(/_/g, ' ').trim()
                  return (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/12 px-3 py-1.5 text-[11px] font-bold text-sky-100"
                    >
                      {label.length > 0 ? label[0].toUpperCase() + label.slice(1) : label}
                    </span>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {workout.description && String(workout.description).trim().length > 0 && (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55 mb-2">Notas del entrenamiento</p>
            <p className="text-sm sm:text-base text-white/65 font-semibold leading-relaxed whitespace-pre-line">
              {workout.description}
            </p>
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {workout.sections.map((section, idx) => {
            const gradient = sectionGradientPalette[idx % sectionGradientPalette.length]
            const sectionId = section.id
            const isChallengeSection = isChallengeWorkout && challengeSectionIndex === idx
            return (
              <div
                key={String(sectionId || idx)}
                className="rounded-[24px] sm:rounded-[26px] border border-white/10 bg-white/[0.02] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                  className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 text-left bg-gradient-to-r ${gradient} via-transparent to-transparent`}
                >
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-black/40 text-white font-black backdrop-blur-md">
                    {sectionCount > 0 ? idx + 1 : 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-white truncate">{section.name}</h3>
                    <p className="text-[11px] font-bold text-white/55 mt-0.5">
                      {section.exercises.length} ejercicio{section.exercises.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  {isChallengeSection && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 backdrop-blur-md whitespace-nowrap">
                      <Zap className="h-3.5 w-3.5" />
                      AMRAP {challengeMinutes || 12}MIN
                    </div>
                  )}
                  <ChevronRight
                    className={`h-5 w-5 text-white/60 shrink-0 transition-transform ${expandedId === idx ? 'rotate-90' : ''}`}
                  />
                </button>
                {expandedId === idx && (
                  <div className="p-3 sm:p-4 md:p-5 space-y-2.5 sm:space-y-3 border-t border-white/10">
                    {section.exercises.map((ex, exIdx) => {
                      const loadValue = ex.type === 'reps'
                        ? `${ex.reps || 0} reps`
                        : ex.type === 'emom'
                          ? `${ex.reps || 0} reps · ${formatDuration(ex.duration || 0)}`
                          : formatDuration(ex.duration || 0)
                      return (
                        <div
                          key={String(ex.id || exIdx)}
                          className={`group relative flex items-center gap-3 sm:gap-4 rounded-[20px] sm:rounded-[22px] border border-white/10 bg-white/[0.03] p-2.5 sm:p-3 hover:bg-white/[0.05] transition ${
                            !isAuthenticated ? 'opacity-90' : 'cursor-pointer'
                          }`}
                          onClick={() => isAuthenticated && handleExerciseClick(idx, exIdx)}
                        >
                          {!isAuthenticated && (
                            <div className="pointer-events-none absolute inset-0 z-20 rounded-[20px] sm:rounded-[22px] flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                              <div className="bg-black/80 p-2 rounded-full shadow-lg border border-white/15">
                                <Lock className="w-5 h-5 text-white/80" />
                              </div>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={`Vista previa de ${ex.name}`}
                            title={`Vista previa de ${ex.name}`}
                            className="absolute right-2.5 sm:right-3 top-2.5 sm:top-3 z-30 h-8 w-8 rounded-2xl bg-black/60 border border-white/15 shadow-sm backdrop-blur-sm hover:bg-black/80"
                            onClick={(event) => {
                              event.stopPropagation()
                              handlePreviewOpen(ex, section.name)
                            }}
                          >
                            <Eye className="h-3.5 w-3.5 text-white/85" />
                          </Button>

                          {renderExerciseMedia(
                            ex,
                            'h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 shrink-0',
                            'rounded-[18px] sm:rounded-2xl overflow-hidden border border-white/10 bg-black/30'
                          )}

                          <div className="flex-1 min-w-0 pr-20 sm:pr-24 md:pr-0">
                            <p className="text-sm sm:text-base font-bold text-white truncate pr-1">{ex.name}</p>
                            <div className="mt-1.5 grid grid-cols-1 md:grid-cols-[auto_auto_auto_auto] md:gap-3 md:items-center">
                              <span className="inline-flex items-center gap-1 rounded-xl bg-white/[0.04] border border-white/10 px-2.5 py-1 text-[10px] sm:text-[11px] font-black text-white/80 w-fit">
                                {loadValue}
                              </span>
                              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-white/60">
                                {ex.sets || 0} series
                              </span>
                              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-white/60 whitespace-nowrap">
                                <Clock className="h-3 w-3 text-white/40 shrink-0" />
                                {`${ex.rest || 0}s descanso`}
                              </span>
                              <div className="hidden md:flex md:ml-auto items-center gap-1 rounded-2xl bg-white/[0.03] border border-white/10 px-2.5 py-1.5">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                                  {ex.type === 'emom'
                                    ? 'EMOM'
                                    : ex.type === 'reps'
                                      ? 'Repeticiones'
                                      : 'Tiempo'}
                                </span>
                                <X className="h-3 w-3 text-white/20" />
                                <span className="text-[11px] font-black text-white/80 tabular-nums">
                                  {ex.type === 'reps'
                                    ? ex.reps || 0
                                    : ex.type === 'emom'
                                      ? `${ex.reps || 0}r · ${formatDuration(ex.duration || 0)}`
                                      : formatDuration(ex.duration || 0)}
                                </span>
                                <X className="h-3 w-3 text-white/20" />
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Series</span>
                                <span className="text-[11px] font-black text-white/80 tabular-nums">{ex.sets || 0}</span>
                                <X className="h-3 w-3 text-white/20" />
                                <Clock className="h-3.5 w-3.5 text-white/45 shrink-0" />
                                <span className="text-[11px] font-black text-white/80 tabular-nums">
                                  {ex.type === 'emom' ? '0s' : `${ex.rest || 0}s`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {isChallengeWorkout && (
          <div className="rounded-[24px] sm:rounded-[26px] border border-amber-500/20 bg-[radial-gradient(1200px_400px_at_top_left,rgba(251,191,36,0.08),transparent_55%),rgba(250,204,21,0.04)] p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/20 p-3 text-amber-300 border border-amber-500/25">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300/80">Modo reto incluido</p>
                <p className="text-sm sm:text-base font-black tracking-tight text-white mt-0.5">
                  Reto AMRAP · {challengeMinutes || 12} min · Score: rondas + reps extra
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 sm:pb-5 bg-[linear-gradient(180deg,transparent_0%,rgba(5,6,8,0.85)_40%,rgba(5,6,8,0.98)_85%)] z-50 pb-safe">
        <div className="max-w-md mx-auto w-full flex flex-col sm:flex-row gap-2 sm:gap-3">
          {hasActiveSession && onResume ? (
            <Button
              className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-black shadow-xl shadow-orange-500/20 bg-orange-500 hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.99] transition-all rounded-2xl sm:rounded-[22px] text-white"
              onClick={handleResume}
            >
              <Play className="w-6 h-6 mr-2 fill-current" />
              Continuar sesion
            </Button>
          ) : null}
          <Button
            className={`flex-1 h-12 sm:h-14 shadow-xl transition-all rounded-2xl sm:rounded-[22px] relative overflow-hidden group bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white shadow-[0_4px_20px_-6px_rgba(16,185,129,0.55)] hover:shadow-[0_8px_28px_-6px_rgba(16,185,129,0.75)] ${
              isAuthenticated ? 'hover:scale-[1.01] active:scale-[0.99]' : ''
            }`}
            onClick={handleStart}
          >
            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur-sm transition-transform duration-500 group-hover:rotate-12">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                  <span className="text-base font-bold">Inicia sesión para empezar</span>
                  <span className="text-[10px] font-medium opacity-90 uppercase tracking-wider">Sigue tu progreso</span>
                </div>
              </div>
            ) : (
              <>
                <Play className="w-6 h-6 mr-2 fill-current" />
                <span className="text-lg font-bold">
                  {hasActiveSession ? 'Reiniciar entrenamiento' : 'Empezar entrenamiento'}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
