'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Button } from '@/components/Button'
import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  Crown,
  Dumbbell,
  Heart,
  PlayCircle,
  Share2,
  Sparkles,
  TimerReset,
  Users,
  WandSparkles,
  Target,
  Wrench,
  Play,
  Pause,
  Clock,
  Flame,
  Trophy,
  Medal,
  Zap,
  User,
  FileEdit,
  Lock,
  Globe,
  UserPlus,
  Inbox,
  ShieldCheck,
  Settings,
  LogOut,
  Swords,
  Footprints,
  Shield,
  Brain,
  Activity,
  ChevronLeft,
  Plus,
  Search,
  SlidersHorizontal,
  Info,
  SkipForward,
  CheckCircle2,
  Eye,
  BarChart2,
} from 'lucide-react'

type ModeKey = 'create' | 'discover' | 'execute'

const modes = [
  {
    key: 'create' as const,
    label: 'Crear',
    eyebrow: 'Workout builder',
    title: 'Convierte una idea en una rutina con estructura real.',
    description:
      'MyGym no se limita a un formulario. Puedes montar bloques, series, ejercicios, IA y contexto para construir workouts con identidad propia.',
    accent: 'from-emerald-400 via-lime-300 to-cyan-300',
    halo: 'rgba(74,222,128,0.34)',
    bullets: [
      'Creacion de rutinas por secciones y flujo real de entrenamiento',
      'Asistente de IA premium para acelerar el primer borrador',
      'Banco de mas de 2300 ejercicios como materia prima',
    ],
  },
  {
    key: 'discover' as const,
    label: 'Red social',
    eyebrow: 'Feed + creators',
    title: 'Descubre creadores, guarda ideas y sigue a quienes entrenan como tu.',
    description:
      'La aplicacion tambien es red social: exploras workouts, compartes tu estilo y sigues perfiles que te inspiran para entrenar mejor.',
    accent: 'from-sky-400 via-violet-300 to-fuchsia-300',
    halo: 'rgba(96,165,250,0.30)',
    bullets: [
      'Compartir rutinas publicas y construir perfil como creador',
      'Seguir a tus creadores de rutinas favoritos',
      'Feed social para descubrir nuevos enfoques de entrenamiento',
    ],
  },
  {
    key: 'execute' as const,
    label: 'Ejecutar',
    eyebrow: 'Session mode',
    title: 'Pasa del scroll a la accion con una vista centrada en entrenar.',
    description:
      'Cuando toca entrenar, MyGym cambia de lenguaje: timer, progreso, descanso, tutoriales y una experiencia movil pensada para ejecutar de verdad.',
    accent: 'from-orange-300 via-amber-300 to-rose-300',
    halo: 'rgba(251,146,60,0.32)',
    bullets: [
      'Realizar las rutinas con una interfaz enfocada y clara',
      'Tutoriales guiados y apoyo premium durante la sesion',
      'Persistencia de progreso, XP y estadisticas cuando eres premium',
    ],
  },
]

const socialPulse = [
  { name: 'Luna Coach', handle: '@luna.strength', badge: 'HIIT', stat: '12.4k' },
  { name: 'Javi Flow', handle: '@javiflow', badge: 'Mobility', stat: '8.1k' },
  { name: 'Nadia Core', handle: '@nadia.core', badge: 'Core', stat: '9.7k' },
]

const pricingFree = [
  'Crear y editar rutinas manualmente',
  'Explorar el banco de ejercicios',
  'Publicar y compartir workouts',
  'Descubrir y seguir creadores',
]

const pricingPremium = [
  'Asistente de IA para generar rutinas',
  'Tutoriales guiados durante la sesion',
  'Guardado de progreso y estadisticas',
  'Experiencia avanzada para entrenar con mas contexto',
]

function ExerciseVaultMockup() {
  const exercises = [
    { name: 'Hip Thrust con barra', muscle: 'Gluteos', equipment: 'Barra', img: 'https://images.unsplash.com/photo-1598971639058-fab37b45e303?q=80&w=400&auto=format&fit=crop' },
    { name: 'Bulgarian Split Squat', muscle: 'Piernas', equipment: 'Banco', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=400&auto=format&fit=crop' },
    { name: 'Romanian Deadlift', muscle: 'Isquios', equipment: 'Mancuernas', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop' },
    { name: 'Leg Extension', muscle: 'Cuadriceps', equipment: 'Maquina', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop' },
    { name: 'Push Ups', muscle: 'Pecho', equipment: 'Peso corporal', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop' },
    { name: 'Pull Ups', muscle: 'Espalda', equipment: 'Barra fija', img: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?q=80&w=400&auto=format&fit=crop' },
    { name: 'Shoulder Press', muscle: 'Hombros', equipment: 'Mancuernas', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=400&auto=format&fit=crop' },
    { name: 'Plank', muscle: 'Core', equipment: 'Peso corporal', img: 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?q=80&w=400&auto=format&fit=crop' },
  ]

  const muscleFilters = ['Gluteos', 'Piernas', 'Pecho', 'Espalda', 'Hombros', 'Core', 'Brazos', 'Isquios']
  const equipmentFilters = ['Barra', 'Mancuernas', 'Maquina', 'Banco', 'Peso corporal', 'Barra fija']

  return (
    <div className="rounded-[28px] border border-border/60 bg-[#fcfbf8] dark:bg-[#0d0d0d] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)] overflow-hidden">
      <div className="border-b border-border/60 bg-gradient-to-b from-orange-500/10 via-background to-background p-4">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Biblioteca de ejercicios</p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">Elige ejercicios y reutilizalos en todas tus rutinas</h3>
          </div>
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Buscar por nombre, musculo o material..."
                className="h-10 w-full rounded-2xl border border-border/60 bg-background/90 pl-9 pr-4 text-sm"
                defaultValue="gluteo"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/90 px-3 py-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">Filtros</span>
              <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-600 dark:text-orange-300">3</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[240px_1fr]">
        <aside className="border-r border-border/60 bg-muted/20 p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-orange-500/10 p-1.5 text-orange-600 dark:text-orange-300">
                <Target className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Musculos</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {muscleFilters.map((m, i) => (
                <button
                  key={m}
                  className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold ${
                    i < 2
                      ? 'border-orange-500/35 bg-orange-500/15 text-orange-600 dark:text-orange-300'
                      : 'border-border/60 bg-background text-muted-foreground'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-sky-500/10 p-1.5 text-sky-600 dark:text-sky-300">
                <Wrench className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Material</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {equipmentFilters.map((e, i) => (
                <button
                  key={e}
                  className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold ${
                    i === 0
                      ? 'border-sky-500/35 bg-sky-500/15 text-sky-600 dark:text-sky-300'
                      : 'border-border/60 bg-background text-muted-foreground'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="p-4">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="rounded-full border border-border/60 bg-background px-3 py-1 text-[11px] font-semibold text-foreground">2,347 ejercicios</span>
            <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold text-orange-600 dark:text-orange-300">3 filtros activos</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {exercises.map((ex, idx) => (
              <article key={ex.name} className="group relative flex flex-col overflow-hidden rounded-[22px] border border-border/60 bg-card/95 transition-all hover:-translate-y-0.5">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img src={ex.img} alt={ex.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/42 to-transparent" />
                  {idx === 0 && (
                    <div className="absolute inset-x-0 top-0 z-10">
                      <button className="flex h-9 w-full items-center justify-center gap-1.5 rounded-t-[22px] border-b border-black/10 bg-white/95 text-xs font-bold tracking-wider text-slate-950">
                        <Plus className="h-3.5 w-3.5" /> Agregar al workout
                      </button>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5">
                    <div className="flex flex-wrap items-center gap-1">
                      <div className="flex items-center gap-1 rounded-full border border-orange-300/35 bg-orange-500/22 px-2 py-0.5 text-[10px] font-medium text-orange-50 backdrop-blur-md">
                        <Target className="h-3 w-3 shrink-0 text-orange-200" />
                        <span>{ex.muscle}</span>
                      </div>
                      <div className="flex items-center gap-1 rounded-full border border-sky-300/35 bg-sky-500/22 px-2 py-0.5 text-[10px] font-medium text-sky-50 backdrop-blur-md">
                        <Wrench className="h-3 w-3 shrink-0 text-sky-200" />
                        <span>{ex.equipment}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="line-clamp-2 text-sm font-semibold leading-4 text-foreground">{ex.name}</h4>
                  {idx === 0 && (
                    <button className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-[11px] font-semibold text-primary-foreground">
                      <Plus className="h-3.5 w-3.5" /> Agregar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function WorkoutOverviewMockup() {
  const sections = [
    {
      name: 'Calentamiento',
      exercises: [
        { name: 'Jumping Jacks', type: '45 seg', sets: '2 sets', img: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=300&auto=format&fit=crop' },
        { name: 'High Knees', type: '30 seg', sets: '2 sets', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=300&auto=format&fit=crop' },
      ],
    },
    {
      name: 'Bloque Principal - Pierna Potente',
      exercises: [
        { name: 'Hip Thrust con barra', type: '12 reps', sets: '4 sets', img: 'https://images.unsplash.com/photo-1598971639058-fab37b45e303?q=80&w=300&auto=format&fit=crop' },
        { name: 'Bulgarian Split Squat', type: '10 reps', sets: '3 sets', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=300&auto=format&fit=crop' },
        { name: 'Romanian Deadlift', type: '12 reps', sets: '3 sets', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=300&auto=format&fit=crop' },
        { name: 'Leg Extension', type: '15 reps', sets: '3 sets', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=300&auto=format&fit=crop' },
      ],
    },
    {
      name: 'Finisher - Core',
      exercises: [
        { name: 'Plank', type: '60 seg', sets: '3 sets', img: 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?q=80&w=300&auto=format&fit=crop' },
        { name: 'Russian Twists', type: '20 reps', sets: '3 sets', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=300&auto=format&fit=crop' },
      ],
    },
  ]

  return (
    <div className="rounded-[28px] border border-white/10 bg-background overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
      <div className="relative h-52 w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1400&auto=format&fit=crop"
          alt="Workout Cover"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-black/30" />
        <div className="absolute top-4 left-4">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute top-4 right-4">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-3xl mx-auto w-full z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-300 text-xs font-medium mb-3 border border-emerald-400/20">
            <Dumbbell className="w-3 h-3" /> Fuerza · Pierna
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">Power Legs - Volumen Gluteo + Quad</h1>
          <div className="flex items-center gap-4 text-sm text-white/70 font-medium mt-2">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 58 min</span>
            <span className="flex items-center gap-1 capitalize"><Info className="w-4 h-4" /> Intermedio</span>
            <span className="flex items-center gap-1">8 Ejercicios</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-4 border border-border/50 bg-card/50">
            <div className="flex items-center gap-2 mb-3 text-primary font-semibold">
              <Target className="w-5 h-5" />
              <h4>Musculos objetivo</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Gluteos', 'Cuadriceps', 'Isquios', 'Core'].map(m => (
                <span key={m} className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium capitalize border border-border/50">{m}</span>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-4 border border-border/50 bg-card/50">
            <div className="flex items-center gap-2 mb-3 text-primary font-semibold">
              <Dumbbell className="w-5 h-5" />
              <h4>Material necesario</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Barra', 'Mancuernas', 'Banco', 'Maquina'].map(e => (
                <span key={e} className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium capitalize border border-border/50">{e}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {sections.map((section, idx) => (
            <div key={section.name} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-sm font-bold text-primary ring-1 ring-border">{idx + 1}</span>
                <h3 className="text-lg font-bold tracking-tight text-foreground">{section.name}</h3>
              </div>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {section.exercises.map((ex, exIdx) => (
                  <div key={ex.name} className="group relative flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all cursor-pointer">
                    <button
                      className="absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 border border-border/50 shadow-sm"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/30">
                      <img src={ex.img} alt={ex.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate pr-6">{ex.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="bg-secondary px-1.5 py-0.5 rounded-md font-medium">{ex.type}</span>
                        <span>{ex.sets}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent pb-6">
        <div className="max-w-md mx-auto w-full flex gap-3">
          <button className="flex-1 h-12 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2">
            <Play className="w-5 h-5 fill-current" /> Start Workout
          </button>
        </div>
      </div>
    </div>
  )
}

function WorkoutExecutionMockup() {
  const [timer, setTimer] = useState(32)
  const [isPaused, setIsPaused] = useState(false)

  const progress = 1 - timer / 45
  const circumference = 2 * Math.PI * 170
  const dashOffset = circumference * progress

  return (
    <div className="relative rounded-[32px] overflow-hidden border border-white/10 bg-[#050816] text-white shadow-[0_40px_120px_rgba(0,0,0,0.5)] aspect-[4/3]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.18),_transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_20%,transparent_80%,rgba(255,255,255,0.02))]" />

      <header className="relative z-20 px-5 py-4">
        <div className="flex items-center gap-3">
          <button className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur-xl flex items-center justify-center">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="w-full min-w-0 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Bloque Principal</p>
                <p className="truncate text-sm font-semibold leading-tight text-white/90">Hip Thrust con barra</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <p className="flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                  3 / 8
                </p>
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] tracking-[0.08em] text-emerald-200">
                  <Clock className="w-4" /> <span>24:18</span>
                </span>
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">Serie 2 de 4</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 overflow-hidden">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="flex items-center gap-1.5">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-bold ${
                      n === 2
                        ? 'animate-pulse border-orange-300/50 bg-orange-400 text-slate-950 shadow-[0_0_16px_rgba(249,115,22,0.45)]'
                        : n < 2
                          ? 'border-emerald-300/40 bg-emerald-400 text-slate-950'
                          : 'border-white/70 bg-white text-slate-950'
                    }`}>
                      {n}
                    </div>
                    {n < 4 && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-px w-2 bg-white/15" />
                        <div className={`h-2.5 w-2.5 rounded-full ${n <= 1 ? 'bg-emerald-400' : 'bg-white/50'}`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden lg:flex h-full shrink-0 flex-col items-center rounded-[18px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200/70">Sesion</span>
            <span className="mt-1 text-2xl tracking-[0.08em] text-emerald-200">24:18</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center px-6 pb-8">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-[16px] border px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
            Actividad
          </span>
          <span className="rounded-[16px] border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold tracking-[0.08em] text-white/78">
            00:32
          </span>
        </div>

        <div className="relative h-64 w-64 sm:h-72 sm:w-72">
          <div className="absolute inset-0 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(34,197,94,0.22)' }} />
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 400 400"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          >
            <circle cx="200" cy="200" r="170" fill="transparent" stroke="rgba(255,255,255,0.10)" strokeWidth="14" />
            <circle
              cx="200"
              cy="200"
              r="170"
              fill="transparent"
              stroke="#22c55e"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-4 overflow-hidden rounded-full border border-white/10 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <img
              src="https://images.unsplash.com/photo-1598971639058-fab37b45e303?q=80&w=500&auto=format&fit=crop"
              alt="Hip thrust"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,23,42,0.08))]" />
          </div>
        </div>

        <div className="mt-6 text-center">
          <h2 className="text-2xl font-black tracking-tight text-white">Hip Thrust con barra</h2>
          <p className="mt-2 text-base leading-7 text-white/62 max-w-md">
            Empuja con gluteos, controla la bajada y mantén la contracción 1 segundo arriba.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-sm">
          <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Ejercicio</p>
            <p className="mt-2 text-sm font-semibold text-white/80">3 / 8</p>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Serie</p>
            <p className="mt-2 text-sm font-semibold text-white/80">2 / 4</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-white/10 text-white backdrop-blur-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsPaused(p => !p)}
            className="h-14 w-44 rounded-[18px] font-semibold shadow-[0_18px_40px_rgba(59,130,246,0.28)] bg-primary text-primary-foreground flex items-center justify-center gap-2"
          >
            {isPaused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5 fill-current" />}
            {isPaused ? 'Reanudar' : 'Pausar'}
          </button>
          <button
            onClick={() => setTimer(t => Math.max(0, t - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-white/10 text-white backdrop-blur-xl"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => setTimer(45)}
          className="mt-3 col-span-4 h-11 w-full max-w-sm rounded-2xl px-4 font-semibold shadow-[0_18px_40px_rgba(16,185,129,0.28)] bg-emerald-500 text-white flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="h-5 w-5" /> Hecho - Siguiente ejercicio
        </button>
      </main>
    </div>
  )
}

function ProfileMockup() {
  const attributes = [
    { name: 'Fuerza', icon: Swords, color: 'text-red-500', bg: 'bg-red-500/10', bar: 'bg-red-500', border: 'border-red-500/20', level: 14, points: 140, max: 150 },
    { name: 'Agilidad', icon: Footprints, color: 'text-blue-500', bg: 'bg-blue-500/10', bar: 'bg-blue-500', border: 'border-blue-500/20', level: 11, points: 110, max: 120 },
    { name: 'Resistencia', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500', border: 'border-emerald-500/20', level: 17, points: 170, max: 180 },
    { name: 'Sabiduria', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-500/10', bar: 'bg-purple-500', border: 'border-purple-500/20', level: 9, points: 90, max: 100 },
  ]

  const daysInMonth = 30
  const firstDayOffset = 2

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.24)]">
        <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)] gap-4">
          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
              <div className="flex flex-col items-center gap-4 text-center xl:items-start xl:text-left">
                <div className="relative">
                  <div className="h-24 w-24 overflow-hidden rounded-[28px] border border-white/10 bg-muted shadow-[0_18px_34px_rgba(0,0,0,0.28)] ring-2 ring-primary/20">
                    <img
                      src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&auto=format&fit=crop"
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500 px-3 py-1 text-xs font-black text-emerald-950 shadow-lg xl:left-auto xl:right-0 xl:translate-x-0">
                    <ShieldCheck className="h-3.5 w-3.5" /> Lvl 14
                  </div>
                </div>
                <div className="flex flex-col items-start justify-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-500">
                    <Medal className="h-3.5 w-3.5" /> Guerrero Avanzado
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                    <Crown className="h-3.5 w-3.5" /> Premium
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white">Alex Martinez</h2>
                    <p className="text-base text-white/60">@alex.fitlife</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-indigo-500/15 bg-indigo-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">
                    <Sparkles className="h-3.5 w-3.5" /> XP Boost x 1.5
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-2.5 sm:col-span-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">XP actual</p>
                    <p className="mt-1.5 text-xl font-black tracking-tight text-white">
                      14,320<span className="ml-1 text-xs font-semibold text-white/50">/ 16,000</span>
                    </p>
                  </div>
                  <div className="rounded-[26px] border border-white/10 bg-slate-950/30 px-4 py-2.5 sm:col-span-3">
                    <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                      <span>Progreso a Lvl 15</span>
                      <span className="text-white">89.5%</span>
                    </div>
                    <div className="mt-2 h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-[89.5%] rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-2.5 text-left">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Seguidores</p>
                    <p className="mt-1.5 flex items-center gap-2 text-xl font-black tracking-tight text-white">
                      <Users className="h-4 w-4 text-primary" /> 1,247
                    </p>
                  </button>
                  <button className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-2.5 text-left">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Siguiendo</p>
                    <p className="mt-1.5 flex items-center gap-2 text-xl font-black tracking-tight text-white">
                      <UserPlus className="h-4 w-4 text-primary" /> 89
                    </p>
                  </button>
                  <button className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-2.5 text-left">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Workouts</p>
                    <p className="mt-1.5 flex items-center gap-2 text-xl font-black tracking-tight text-white">
                      <Dumbbell className="h-4 w-4 text-primary" /> 32
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="group relative overflow-hidden rounded-[26px] border border-orange-500/15 bg-gradient-to-br from-card via-card to-orange-500/[0.07] p-4">
              <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-orange-500/12 blur-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/12 text-orange-500 ring-1 ring-orange-500/20">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight text-white">23</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Day Streak</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-[26px] border border-sky-500/15 bg-gradient-to-br from-card via-card to-sky-500/[0.07] p-4">
              <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-sky-500/12 blur-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/12 text-sky-500 ring-1 ring-sky-500/20">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight text-white">148</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Workouts</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-[26px] border border-emerald-500/15 bg-gradient-to-br from-card via-card to-emerald-500/[0.07] p-4 sm:col-span-2 lg:col-span-1">
              <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-emerald-500/12 blur-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-500 ring-1 ring-emerald-500/20">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight text-white">76h 32m</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Tiempo total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-border/60 bg-card p-5 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Activity className="w-5 h-5 text-primary" /> Mapa de Actividad - Agosto 2026
            </h2>
            <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-lg w-fit">
              <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-background shadow-sm">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[100px] text-center text-sm font-semibold tabular-nums">Agosto 2026</span>
              <button className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-background shadow-sm">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="w-full">
            <div className="grid grid-cols-7 gap-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="text-center text-[10px] text-muted-foreground w-full aspect-square flex items-center justify-center font-bold tracking-wider">
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`e-${i}`} className="w-full aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const intensity = [2, 4, 1, 3, 0, 4, 2, 3, 1, 4, 0, 2, 3, 4, 1, 2, 0, 4, 3, 2, 1, 4, 2, 3, 0, 1, 4, 2, 3, 4][i]
                const colors = [
                  'bg-secondary/10 border-border/30',
                  'bg-emerald-500/20 border-transparent',
                  'bg-emerald-400/50 border-transparent',
                  'bg-emerald-500/70 border-transparent',
                  'bg-emerald-500 shadow-emerald-500/30 shadow-lg border-transparent',
                ]
                return (
                  <button
                    key={i}
                    className={`w-full aspect-square rounded-md sm:rounded-lg border transition-all ${colors[intensity]}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
        <div className="space-y-5 border-t lg:border-t-0 lg:border-l border-border/40 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
              <BarChart2 className="w-4 h-4" /> Atributos RPG
            </h3>
          </div>
          <div className="space-y-4">
            {attributes.map(attr => (
              <div key={attr.name} className={`p-4 rounded-xl border bg-card space-y-3 ${attr.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg shadow-sm ${attr.bg}`}>
                      <attr.icon className={`w-4 h-4 ${attr.color}`} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-foreground leading-none">{attr.name}</h4>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-foreground">Lvl {attr.level}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums font-medium">{attr.points}/{attr.max} pts</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${attr.bar}`} style={{ width: `${(attr.points / attr.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandingExperience() {
  const [activeMode, setActiveMode] = useState<ModeKey>('discover')
  const currentMode = useMemo(
    () => modes.find((mode) => mode.key === activeMode) || modes[1],
    [activeMode]
  )

  return (
    <main className="min-h-screen overflow-hidden bg-[#04070f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.16),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(96,165,250,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.18),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_20%,transparent_80%,rgba(255,255,255,0.04))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />

      <section className="relative">
        <div className="mx-auto max-w-7xl px-5 pb-20 pt-6 sm:px-8 lg:px-10 lg:pb-28 lg:pt-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(74,222,128,0.12)]">
                <Dumbbell className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/40">MYGYM</p>
                <p className="text-sm text-white/62">Create. Share. Execute.</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10">
                  Iniciar sesion
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="rounded-full px-5 shadow-[0_18px_40px_rgba(74,222,128,0.22)]">
                  Empieza gratis
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                <WandSparkles className="h-3.5 w-3.5 text-emerald-300" />
                una red social hecha para entrenar
              </div>

              <h1 className="mt-6 text-5xl font-black tracking-[-0.08em] text-white sm:text-6xl lg:text-8xl">
                No es una landing.
                <span className="block bg-gradient-to-r from-emerald-300 via-sky-300 to-orange-200 bg-clip-text text-transparent">
                  Es una demostracion del ecosistema.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/62 sm:text-lg">
                MyGym junta tres mundos que normalmente viven separados: la creacion de rutinas,
                el descubrimiento social y la ejecucion real del entrenamiento. Cambia de modo y mira
                como respira el producto.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {modes.map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setActiveMode(mode.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                      activeMode === mode.key
                        ? 'border-white/20 bg-white text-slate-950 shadow-[0_12px_30px_rgba(255,255,255,0.18)]'
                        : 'border-white/10 bg-white/[0.04] text-white/72 hover:bg-white/[0.08]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="mt-8 max-w-2xl rounded-[30px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">{currentMode.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">{currentMode.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/60 sm:text-base">{currentMode.description}</p>

                <div className="mt-5 space-y-3">
                  {currentMode.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3">
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm leading-6 text-white/72">{bullet}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link href="/auth/register">
                    <Button size="lg" className="h-12 rounded-full px-6 font-semibold">
                      Crear cuenta gratis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button
                      size="lg"
                      variant="ghost"
                      className="h-12 rounded-full border border-white/10 bg-white/[0.04] px-6 font-semibold text-white hover:bg-white/[0.08]"
                    >
                      Ver la parte social
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative">
              <div
                className={`absolute inset-x-[10%] top-[12%] h-40 rounded-full bg-gradient-to-r ${currentMode.accent} opacity-25 blur-3xl transition-all duration-500`}
                style={{ boxShadow: `0 0 140px ${currentMode.halo}` }}
              />

              <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-4 shadow-[0_40px_120px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:p-5">
                <div className="mb-4 flex items-center justify-between rounded-[24px] border border-white/10 bg-black/20 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">product pulse</p>
                    <p className="mt-1 text-sm font-semibold text-white">MyGym en movimiento</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.65)]" />
                    <span className="text-xs text-white/45">live</span>
                  </div>
                </div>

                {activeMode === 'create' && (
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[28px] border border-white/10 bg-[#07111f]/90 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Builder</p>
                          <h3 className="mt-1 text-lg font-semibold text-white">Power Legs / Creator mode</h3>
                        </div>
                        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                          live draft
                        </div>
                      </div>
                      <div className="mt-4 space-y-3">
                        {[
                          { section: 'Calentamiento', detail: '2 ejercicios · activacion', tint: 'bg-emerald-400/12 text-emerald-200' },
                          { section: 'Main block', detail: '4 ejercicios · volumen', tint: 'bg-cyan-400/12 text-cyan-200' },
                          { section: 'Finisher', detail: '2 ejercicios · core', tint: 'bg-lime-400/12 text-lime-200' },
                        ].map((item) => (
                          <div key={item.section} className="rounded-[22px] border border-white/8 bg-white/[0.04] p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{item.section}</p>
                                <p className="text-xs text-white/45">{item.detail}</p>
                              </div>
                              <div className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${item.tint}`}>
                                ready
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-[26px] border border-emerald-300/15 bg-emerald-400/10 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-200">
                            <Bot className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">AI Assistant premium</p>
                            <p className="mt-1 text-sm leading-6 text-white/60">
                              "Creame una rutina de pierna potente, 45 min, con enfoque gluteo y quad."
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">2300+ ejercicios</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {['Hip thrust', 'Bulgarian split', 'Romanian deadlift', 'Leg extension'].map((item) => (
                            <div key={item} className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-white/70">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeMode === 'discover' && (
                  <div className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
                    <div className="rounded-[28px] border border-white/10 bg-[#08101b]/90 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Creator orbit</p>
                      <div className="mt-4 space-y-3">
                        {socialPulse.map((creator, index) => (
                          <div
                            key={creator.handle}
                            className="group flex items-center justify-between rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3 transition-transform duration-300 hover:-translate-y-0.5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/40 to-violet-400/25 text-sm font-bold text-white">
                                {creator.name.slice(0, 1)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">{creator.name}</p>
                                <p className="text-xs text-white/45">{creator.handle}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-200">
                                {creator.badge}
                              </p>
                              <p className="mt-1 text-xs text-white/50">{creator.stat} follows</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[28px] border border-white/10 bg-[#06111d]/90 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Public feed</p>
                          <h3 className="mt-1 text-lg font-semibold text-white">Rutinas que se mueven en la red</h3>
                        </div>
                        <div className="rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-fuchsia-200">
                          trending
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {[
                          { title: 'Upper power density', author: 'Luna Coach', likes: 182, saves: 64, tint: 'from-sky-400/25 to-violet-400/15' },
                          { title: 'Core + mobility reset', author: 'Javi Flow', likes: 147, saves: 53, tint: 'from-fuchsia-400/20 to-cyan-400/15' },
                        ].map((item) => (
                          <div key={item.title} className={`rounded-[24px] border border-white/8 bg-gradient-to-br ${item.tint} p-4`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                <p className="mt-1 text-xs text-white/55">por {item.author}</p>
                              </div>
                              <Share2 className="h-4 w-4 text-white/55" />
                            </div>
                            <div className="mt-6 flex items-center gap-3 text-xs text-white/55">
                              <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {item.likes}</span>
                              <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> {item.saves} saves</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeMode === 'execute' && <WorkoutExecutionMockup />}

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: '2300+', value: 'ejercicios' },
                    { label: 'social', value: 'creadores y feed' },
                    { label: 'premium', value: 'IA + progreso + tutoriales' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{item.label}</p>
                      <p className="mt-2 text-sm text-white/70">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/8 bg-black/10">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">por que se siente distinta</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">
              Porque une producto y comunidad en la misma superficie.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/60 sm:text-base">
              En MyGym no creas una rutina para que se quede escondida. La puedes compartir, descubrir,
              seguir, ejecutar y volver a mejorar. Esa continuidad es el valor real de la app.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Dumbbell, title: 'Creacion de rutinas', body: 'Editor con bloques, series, ejercicios y ayuda premium con IA.', accent: 'from-emerald-400/20 to-emerald-400/0' },
              { icon: Sparkles, title: 'Banco de 2300+ ejercicios', body: 'Catalogo amplio para montar sesiones con variedad real.', accent: 'from-sky-400/20 to-sky-400/0' },
              { icon: Share2, title: 'Compartir y seguir', body: 'Publica workouts, sigue perfiles y convierte el entrenamiento en red.', accent: 'from-fuchsia-400/20 to-fuchsia-400/0' },
              { icon: PlayCircle, title: 'Realizar las rutinas', body: 'Modo sesion con foco movil, progreso, descanso y ritmo.', accent: 'from-orange-400/20 to-orange-400/0' },
              { icon: Users, title: 'Creadores favoritos', body: 'Mantente cerca de quienes programan entrenamientos que te encajan.', accent: 'from-violet-400/20 to-violet-400/0' },
              { icon: Crown, title: 'Capa premium', body: 'IA, tutoriales y guardado de progreso para usuarios avanzados.', accent: 'from-amber-400/20 to-amber-400/0' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className="group relative rounded-[28px] border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.07] overflow-hidden"
                >
                  <div className={`absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br ${item.accent} blur-3xl`} />
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-emerald-300 transition-transform duration-300 group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/58">{item.body}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28 space-y-20">
        <div className="space-y-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300">
              <Dumbbell className="h-3.5 w-3.5" /> Crear rutinas
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">
              Crea rutinas reutilizando ejercicios de la biblioteca
            </h2>
            <p className="mt-4 text-base leading-7 text-white/60 sm:text-lg">
              Accede a mas de 2,300 ejercicios clasificados por musculo y material. Filtra, busca y
              agrega con un clic a tus rutinas. Los ejercicios se pueden reutilizar en todas tus creaciones.
            </p>
          </div>
          <ExerciseVaultMockup />
        </div>

        <div className="space-y-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
              <Eye className="h-3.5 w-3.5" /> Vista previa del workout
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">
              Resumen claro de todas las series y ejercicios
            </h2>
            <p className="mt-4 text-base leading-7 text-white/60 sm:text-lg">
              Antes de empezar, visualiza toda la estructura: secciones, ejercicios, repeticiones,
              series, material necesario y musculos objetivo. Todo en una sola pantalla.
            </p>
          </div>
          <WorkoutOverviewMockup />
        </div>

        <div className="space-y-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              <Play className="h-3.5 w-3.5 fill-current" /> Modo sesion
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">
              Ejecuta con foco: timer, progreso, series y tutoriales
            </h2>
            <p className="mt-4 text-base leading-7 text-white/60 sm:text-lg">
              Cuando toca entrenar, la interfaz se transforma. Timer circular, seguimiento de series,
              mapa de progreso, pausa, y tutoriales visuales. Disenado para usarse en el gimnasio.
            </p>
          </div>
          <WorkoutExecutionMockup />
        </div>

        <div className="space-y-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">
              <User className="h-3.5 w-3.5" /> Perfil y progreso
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">
              Tu evolucion en un solo lugar: XP, stats, mapa de calor y atributos RPG
            </h2>
            <p className="mt-4 text-base leading-7 text-white/60 sm:text-lg">
              Sigue tu racha de entrenos, los workouts completados, el tiempo total, el mapa mensual
              de actividad y mejora tus atributos RPG con cada sesion completada.
            </p>
          </div>
          <ProfileMockup />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04]">
            <div className="border-b border-white/10 px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">social layer</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">El entrenamiento tambien se contagia.</h2>
            </div>

            <div className="grid gap-0 md:grid-cols-2">
              <div className="border-b border-white/10 p-6 md:border-b-0 md:border-r">
                <p className="text-sm font-semibold text-white">Lo que ves en la red</p>
                <div className="mt-5 space-y-3">
                  {[
                    'Rutinas publicadas por creadores',
                    'Perfiles que puedes seguir',
                    'Ideas para inspirarte antes de entrenar',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <ChevronRight className="mt-1 h-4 w-4 text-emerald-300" />
                      <p className="text-sm leading-6 text-white/62">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <p className="text-sm font-semibold text-white">Lo que pasa cuando te quedas</p>
                <div className="mt-5 space-y-3">
                  {[
                    'Empiezas a seguir una metodologia concreta',
                    'Guardas referencias para tus siguientes sesiones',
                    'Creas tus propias rutinas y entras en el circuito',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <ChevronRight className="mt-1 h-4 w-4 text-sky-300" />
                      <p className="text-sm leading-6 text-white/62">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-amber-300/15 bg-[linear-gradient(180deg,rgba(251,191,36,0.14),rgba(255,255,255,0.04))] p-6 shadow-[0_30px_90px_rgba(251,191,36,0.1)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">premium edge</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">El salto a premium se nota.</h2>
              </div>
              <div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 p-3 text-amber-100">
                <Crown className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                'Generacion de rutinas con IA',
                'Tutoriales guiados en la sesion',
                'Guardado de progreso y estadisticas',
                'Contexto extra para quienes entrenan de forma seria',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-black/15 px-4 py-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300/15 text-amber-100">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm leading-6 text-white/72">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
        <div className="mb-8 max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">pricing</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
            Entra gratis. Escala a premium cuando quieras exprimir la experiencia.
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">Free</p>
                <h3 className="mt-2 text-4xl font-black tracking-[-0.06em] text-white">0 EUR</h3>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                para entrar en la red
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {pricingFree.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/85">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm leading-6 text-white/65">{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[32px] border border-emerald-300/20 bg-[linear-gradient(180deg,rgba(74,222,128,0.16),rgba(255,255,255,0.05))] p-6 shadow-[0_30px_100px_rgba(74,222,128,0.14)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">Premium</p>
                <h3 className="mt-2 text-4xl font-black tracking-[-0.06em] text-white">Mas potencia</h3>
              </div>
              <div className="rounded-full border border-emerald-200/25 bg-emerald-300/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-50">
                recomendado
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {pricingPremium.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-50">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm leading-6 text-white/78">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/register">
                <Button className="h-12 rounded-full px-6 font-semibold">
                  Probar MyGym
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="ghost"
                  className="h-12 rounded-full border border-white/10 bg-white/[0.05] px-6 font-semibold text-white hover:bg-white/[0.08]"
                >
                  Ver feed publico
                </Button>
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
