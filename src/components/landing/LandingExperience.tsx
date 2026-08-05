'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/Button'
import {
  ArrowRight,
  Dumbbell,
  Target,
  Wrench,
  Play,
  Pause,
  Clock,
  Flame,
  Trophy,
  Medal,
  Swords,
  Footprints,
  Shield,
  Brain,
  Activity,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  SkipForward,
  CheckCircle2,
  Eye,
  BarChart2,
  Share2,
  Users,
  UserPlus,
  ShieldCheck,
  Sparkles,
  Crown,
  Check,
} from 'lucide-react'

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
      <div className="border-b border-border/60 bg-gradient-to-b from-orange-500/10 via-background to-background p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Buscar por nombre, musculo o material..."
                className="h-12 w-full rounded-2xl border border-border/60 bg-background/90 pl-10 pr-4 text-sm"
                defaultValue="gluteo"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/90 px-4 py-3">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">Filtros</span>
              <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-orange-600 dark:text-orange-300">3</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-border/60 bg-muted/20 p-5 space-y-5 hidden lg:block">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-orange-500/10 p-2 text-orange-600 dark:text-orange-300">
                <Target className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Musculos</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {muscleFilters.map((m, i) => (
                <button
                  key={m}
                  className={`rounded-xl border px-3 py-2 text-[11px] font-bold ${
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-sky-500/10 p-2 text-sky-600 dark:text-sky-300">
                <Wrench className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Material</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {equipmentFilters.map((e, i) => (
                <button
                  key={e}
                  className={`rounded-xl border px-3 py-2 text-[11px] font-bold ${
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

        <section className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="rounded-full border border-border/60 bg-background px-4 py-1.5 text-[12px] font-bold text-foreground">2,347 ejercicios</span>
            <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-[12px] font-bold text-orange-600 dark:text-orange-300">3 filtros activos</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {exercises.map((ex, idx) => (
              <article key={ex.name} className="group relative flex flex-col overflow-hidden rounded-[24px] border border-border/60 bg-card/95 transition-all hover:-translate-y-1 shadow-sm hover:shadow-lg">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img src={ex.img} alt={ex.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/42 to-transparent" />
                  {idx === 0 && (
                    <div className="absolute inset-x-0 top-0 z-10">
                      <button className="flex h-10 w-full items-center justify-center gap-2 rounded-t-[24px] border-b border-black/10 bg-white/95 text-[12px] font-bold tracking-wider text-slate-950">
                        <Plus className="h-4 w-4" /> Agregar al workout
                      </button>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 px-3 pb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="flex items-center gap-1 rounded-full border border-orange-300/35 bg-orange-500/22 px-2.5 py-1 text-[10px] font-medium text-orange-50 backdrop-blur-md">
                        <Target className="h-3.5 w-3.5 shrink-0 text-orange-200" />
                        <span>{ex.muscle}</span>
                      </div>
                      <div className="flex items-center gap-1 rounded-full border border-sky-300/35 bg-sky-500/22 px-2.5 py-1 text-[10px] font-medium text-sky-50 backdrop-blur-md">
                        <Wrench className="h-3.5 w-3.5 shrink-0 text-sky-200" />
                        <span>{ex.equipment}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="line-clamp-2 text-sm font-bold leading-5 text-foreground">{ex.name}</h4>
                  {idx === 0 && (
                    <button className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[12px] font-bold text-primary-foreground">
                      <Plus className="h-4 w-4" /> Agregar
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
    <div className="rounded-[32px] border border-white/10 bg-background overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)]">
      <div className="relative h-64 sm:h-72 w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop"
          alt="Workout Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute top-5 left-5">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute top-5 right-5">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 max-w-4xl mx-auto w-full z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-300 text-xs font-bold mb-4 border border-emerald-400/20">
            <Dumbbell className="w-4 h-4" /> Fuerza · Pierna
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">Power Legs - Volumen Gluteo + Quad</h1>
          <div className="flex flex-wrap items-center gap-5 text-sm text-white/70 font-bold mt-3">
            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> 58 min</span>
            <span className="flex items-center gap-2 capitalize">Intermedio</span>
            <span className="flex items-center gap-2">8 Ejercicios</span>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-8 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-2xl p-5 border border-border/50 bg-card/50">
            <div className="flex items-center gap-2 mb-4 text-primary font-bold text-lg">
              <Target className="w-6 h-6" />
              <h4>Musculos objetivo</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Gluteos', 'Cuadriceps', 'Isquios', 'Core'].map(m => (
                <span key={m} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-bold capitalize border border-border/50">{m}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-5 border border-border/50 bg-card/50">
            <div className="flex items-center gap-2 mb-4 text-primary font-bold text-lg">
              <Dumbbell className="w-6 h-6" />
              <h4>Material necesario</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Barra', 'Mancuernas', 'Banco', 'Maquina'].map(e => (
                <span key={e} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-bold capitalize border border-border/50">{e}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {sections.map((section, idx) => (
            <div key={section.name} className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary text-base font-black text-primary ring-1 ring-border">{idx + 1}</span>
                <h3 className="text-xl font-black tracking-tight text-foreground">{section.name}</h3>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {section.exercises.map((ex) => (
                  <div key={ex.name} className="group relative flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all cursor-pointer hover:shadow-md">
                    <button
                      className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 border border-border/50 shadow-sm"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/30">
                      <img src={ex.img} alt={ex.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base text-foreground truncate pr-6">{ex.name}</h4>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <span className="bg-secondary px-2 py-0.5 rounded-md font-bold">{ex.type}</span>
                        <span className="font-semibold">{ex.sets}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 p-5 sm:p-6 bg-gradient-to-t from-background via-background/95 to-transparent pb-8">
        <div className="max-w-lg mx-auto w-full">
          <button className="w-full h-14 shadow-2xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl bg-primary text-primary-foreground font-black text-lg flex items-center justify-center gap-2">
            <Play className="w-6 h-6 fill-current" /> Start Workout
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
    <div className="relative rounded-[40px] overflow-hidden border border-white/10 bg-[#050816] text-white shadow-[0_50px_140px_rgba(0,0,0,0.5)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_38%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.2),_transparent_32%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_20%,transparent_80%,rgba(255,255,255,0.02))]" />

      <header className="relative z-20 px-6 sm:px-8 py-5 sm:py-6">
        <div className="flex items-center gap-4">
          <button className="h-12 w-12 shrink-0 rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur-xl flex items-center justify-center">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="w-full min-w-0 rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Bloque Principal</p>
                <p className="truncate text-base font-bold leading-tight text-white/90">Hip Thrust con barra</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <p className="flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white/70">
                  3 / 8
                </p>
                <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[12px] tracking-[0.08em] text-emerald-200 font-bold">
                  <Clock className="w-4" /> <span>24:18</span>
                </span>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-white/55">Serie 2 de 4</span>
              </div>
              <div className="mt-3 flex items-center gap-2 overflow-hidden">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black ${
                      n === 2
                        ? 'animate-pulse border-orange-300/50 bg-orange-400 text-slate-950 shadow-[0_0_20px_rgba(249,115,22,0.5)]'
                        : n < 2
                          ? 'border-emerald-300/40 bg-emerald-400 text-slate-950'
                          : 'border-white/70 bg-white text-slate-950'
                    }`}>
                      {n}
                    </div>
                    {n < 4 && (
                      <div className="flex items-center gap-2">
                        <div className="h-px w-3 bg-white/15" />
                        <div className={`h-3 w-3 rounded-full ${n <= 1 ? 'bg-emerald-400' : 'bg-white/50'}`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center px-6 sm:px-8 pb-10">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-[18px] border px-5 py-2.5 text-sm font-black uppercase tracking-[0.16em] border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
            Actividad
          </span>
          <span className="rounded-[18px] border border-white/10 bg-white/[0.06] px-5 py-2.5 text-lg font-black tracking-[0.08em] text-white/80">
            00:32
          </span>
        </div>

        <div className="relative h-72 w-72 sm:h-80 sm:w-80 md:h-96 md:w-96">
          <div className="absolute inset-0 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(34,197,94,0.28)' }} />
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
          <div className="absolute inset-6 overflow-hidden rounded-full border border-white/10 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <img
              src="https://images.unsplash.com/photo-1598971639058-fab37b45e303?q=80&w=600&auto=format&fit=crop"
              alt="Hip thrust"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,23,42,0.08))]" />
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Hip Thrust con barra</h2>
          <p className="mt-3 text-base sm:text-lg leading-8 text-white/60 max-w-xl">
            Empuja con gluteos, controla la bajada y mantén la contracción 1 segundo arriba.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
          <div className="rounded-[20px] border border-white/10 bg-white/[0.04] px-5 py-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Ejercicio</p>
            <p className="mt-2 text-lg font-bold text-white/80">3 / 8</p>
          </div>
          <div className="rounded-[20px] border border-white/10 bg-white/[0.04] px-5 py-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Serie</p>
            <p className="mt-2 text-lg font-bold text-white/80">2 / 4</p>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-center gap-4">
          <button className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/10 text-white backdrop-blur-xl">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsPaused(p => !p)}
            className="h-16 w-52 rounded-[20px] font-black shadow-[0_20px_50px_rgba(59,130,246,0.3)] bg-primary text-primary-foreground flex items-center justify-center gap-2 text-base"
          >
            {isPaused ? <Play className="h-6 w-6 fill-current" /> : <Pause className="h-6 w-6 fill-current" />}
            {isPaused ? 'Reanudar' : 'Pausar'}
          </button>
          <button
            onClick={() => setTimer(t => Math.max(0, t - 1))}
            className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/10 text-white backdrop-blur-xl"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={() => setTimer(45)}
          className="mt-5 h-14 w-full max-w-md rounded-2xl px-5 font-black shadow-[0_22px_50px_rgba(16,185,129,0.32)] bg-emerald-500 text-white flex items-center justify-center gap-2 text-base"
        >
          <CheckCircle2 className="h-6 w-6" /> Hecho - Siguiente ejercicio
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
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-6 sm:p-8 shadow-[0_40px_100px_rgba(0,0,0,0.28)]">
        <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)] gap-5 sm:gap-6">
          <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
              <div className="flex flex-col items-center gap-5 text-center xl:items-start xl:text-left">
                <div className="relative">
                  <div className="h-28 w-28 overflow-hidden rounded-[32px] border border-white/10 bg-muted shadow-[0_20px_40px_rgba(0,0,0,0.3)] ring-2 ring-primary/20">
                    <img
                      src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=300&auto=format&fit=crop"
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500 px-4 py-1.5 text-xs font-black text-emerald-950 shadow-lg xl:left-auto xl:right-0 xl:translate-x-0">
                    <ShieldCheck className="h-4 w-4" /> Lvl 14
                  </div>
                </div>
                <div className="flex flex-col items-start justify-center gap-2.5">
                  <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-500">
                    <Medal className="h-4 w-4" /> Guerrero Avanzado
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/12 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
                    <Crown className="h-4 w-4" /> Premium
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Alex Martinez</h2>
                    <p className="text-lg text-white/60 font-semibold">@alex.fitlife</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-indigo-500/15 bg-indigo-500/10 px-4 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-indigo-300">
                    <Sparkles className="h-4 w-4" /> XP Boost x 1.5
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-3.5 sm:col-span-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">XP actual</p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-white">
                      14,320<span className="ml-1 text-sm font-semibold text-white/50">/ 16,000</span>
                    </p>
                  </div>
                  <div className="rounded-[28px] border border-white/10 bg-slate-950/30 px-5 py-3.5 sm:col-span-3">
                    <div className="flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                      <span>Progreso a Lvl 15</span>
                      <span className="text-white">89.5%</span>
                    </div>
                    <div className="mt-3 h-3.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-[89.5%] rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <button className="rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-3.5 text-left">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">Seguidores</p>
                    <p className="mt-2 flex items-center gap-3 text-2xl font-black tracking-tight text-white">
                      <Users className="h-5 w-5 text-primary" /> 1,247
                    </p>
                  </button>
                  <button className="rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-3.5 text-left">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">Siguiendo</p>
                    <p className="mt-2 flex items-center gap-3 text-2xl font-black tracking-tight text-white">
                      <UserPlus className="h-5 w-5 text-primary" /> 89
                    </p>
                  </button>
                  <button className="rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-3.5 text-left">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">Workouts</p>
                    <p className="mt-2 flex items-center gap-3 text-2xl font-black tracking-tight text-white">
                      <Dumbbell className="h-5 w-5 text-primary" /> 32
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="group relative overflow-hidden rounded-[30px] border border-orange-500/15 bg-gradient-to-br from-card via-card to-orange-500/[0.07] p-5">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-orange-500/12 blur-2xl" />
              <div className="relative flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/12 text-orange-500 ring-1 ring-orange-500/20">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tight text-white">23</p>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">Day Streak</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-[30px] border border-sky-500/15 bg-gradient-to-br from-card via-card to-sky-500/[0.07] p-5">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-sky-500/12 blur-2xl" />
              <div className="relative flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/12 text-sky-500 ring-1 ring-sky-500/20">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tight text-white">148</p>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">Workouts</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-[30px] border border-emerald-500/15 bg-gradient-to-br from-card via-card to-emerald-500/[0.07] p-5 sm:col-span-2 lg:col-span-1">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-500/12 blur-2xl" />
              <div className="relative flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-500 ring-1 ring-emerald-500/20">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tight text-white">76h 32m</p>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">Tiempo total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-border/60 bg-card p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
            <h2 className="text-xl font-black flex items-center gap-3 text-foreground">
              <Activity className="w-6 h-6 text-primary" /> Mapa de Actividad - Agosto 2026
            </h2>
            <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-xl w-fit">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-background shadow-sm">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[120px] text-center text-base font-bold tabular-nums">Agosto 2026</span>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-background shadow-sm">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="w-full">
            <div className="grid grid-cols-7 gap-2.5">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="text-center text-[11px] text-muted-foreground w-full aspect-square flex items-center justify-center font-black tracking-wider">
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
                    className={`w-full aspect-square rounded-lg sm:rounded-xl border transition-all ${colors[intensity]}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
        <div className="space-y-6 border-t lg:border-t-0 lg:border-l border-border/40 pt-8 lg:pt-0 lg:pl-10 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-lg flex items-center gap-3 text-foreground">
              <BarChart2 className="w-5 h-5" /> Atributos RPG
            </h3>
          </div>
          <div className="space-y-5">
            {attributes.map(attr => (
              <div key={attr.name} className={`p-5 rounded-2xl border bg-card space-y-4 ${attr.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl shadow-sm ${attr.bg}`}>
                      <attr.icon className={`w-5 h-5 ${attr.color}`} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-foreground leading-none">{attr.name}</h4>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-foreground">Lvl {attr.level}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums font-semibold">{attr.points}/{attr.max} pts</span>
                  </div>
                </div>
                <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden">
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
  return (
    <main className="min-h-screen overflow-hidden bg-[#04070f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.16),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(96,165,250,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.18),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <section className="relative">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 pb-10 sm:pb-16 pt-6 sm:pt-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(74,222,128,0.12)]">
                <Dumbbell className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.26em] text-white/40">MYGYM</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 text-sm font-bold h-11">
                  Iniciar sesion
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="rounded-full px-5 h-11 text-sm font-bold shadow-[0_18px_40px_rgba(74,222,128,0.22)]">
                  Empieza gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 pb-16 sm:pb-24">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.08em] text-white leading-[0.95]">
              Entrena.
              <span className="block bg-gradient-to-r from-emerald-300 via-sky-300 to-orange-200 bg-clip-text text-transparent">
                Comparte. Evoluciona.
              </span>
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-white/55 font-semibold max-w-2xl mx-auto">
              Todo el proceso del entrenamiento en una sola app. Visualiza como es dentro.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/auth/register">
                <Button size="lg" className="h-14 rounded-full px-8 font-black text-base">
                  Probar MyGym
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 pb-20 sm:pb-32">
        <div className="space-y-24 sm:space-y-36">

          <div className="space-y-8 sm:space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                <Dumbbell className="h-4 w-4" /> Paso 1
              </span>
              <h2 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.06em] text-white">
                Crea rutinas con la biblioteca
              </h2>
            </div>
            <div className="scale-[1.02]">
              <ExerciseVaultMockup />
            </div>
          </div>

          <div className="space-y-8 sm:space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-sky-300">
                <Eye className="h-4 w-4" /> Paso 2
              </span>
              <h2 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.06em] text-white">
                Toda la estructura de un vistazo
              </h2>
            </div>
            <WorkoutOverviewMockup />
          </div>

          <div className="space-y-8 sm:space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                <Play className="h-4 w-4 fill-current" /> Paso 3
              </span>
              <h2 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.06em] text-white">
                Ejecuta con foco total
              </h2>
            </div>
            <div className="max-w-5xl mx-auto">
              <WorkoutExecutionMockup />
            </div>
          </div>

          <div className="space-y-8 sm:space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                <Trophy className="h-4 w-4" /> Paso 4
              </span>
              <h2 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.06em] text-white">
                Tu progreso, medido y gamificado
              </h2>
            </div>
            <ProfileMockup />
          </div>

        </div>
      </section>

      <section className="relative border-t border-white/10 bg-black/20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10 py-16 sm:py-24">
          <div className="rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-8 sm:p-12 md:p-16 text-center overflow-hidden">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.06em] text-white leading-[1]">
              Listo para entrenar?
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-white/55 font-semibold max-w-xl mx-auto">
              Empieza gratis y escala cuando necesites mas potencia.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2 max-w-4xl mx-auto text-left">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/45">Free</p>
                    <h3 className="mt-3 text-4xl sm:text-5xl font-black tracking-[-0.06em] text-white">0€</h3>
                  </div>
                </div>
                <div className="mt-7 space-y-3.5">
                  {[
                    'Crear y editar rutinas',
                    'Banco de 2,300+ ejercicios',
                    'Publicar y compartir',
                    'Seguir creadores',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/85">
                        <Check className="h-4 w-4" />
                      </div>
                      <p className="text-base leading-7 text-white/65 font-semibold">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-emerald-300/25 bg-[linear-gradient(180deg,rgba(74,222,128,0.18),rgba(255,255,255,0.05))] p-6 sm:p-8 shadow-[0_30px_100px_rgba(74,222,128,0.18)] relative overflow-hidden">
                <div className="absolute top-5 right-5">
                  <div className="rounded-full border border-emerald-200/25 bg-emerald-300/12 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-50">
                    RECOMENDADO
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-100">Premium</p>
                    <h3 className="mt-3 text-4xl sm:text-5xl font-black tracking-[-0.06em] text-white">Pro</h3>
                  </div>
                </div>
                <div className="mt-7 space-y-3.5">
                  {[
                    'Rutinas generadas con IA',
                    'Tutoriales en la sesion',
                    'Progreso y estadisticas',
                    'Mapa de calor y atributos RPG',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-50">
                        <Check className="h-4 w-4" />
                      </div>
                      <p className="text-base leading-7 text-white/80 font-semibold">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/auth/register">
                <Button size="lg" className="h-14 rounded-full px-10 font-black text-base shadow-[0_20px_50px_rgba(74,222,128,0.25)]">
                  Empezar gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
