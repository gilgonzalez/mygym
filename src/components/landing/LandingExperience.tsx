'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
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
  SkipBack,
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
  GripVertical,
  Trash2,
  Zap,
  Layers,
  ImagePlus,
  Settings2,
  Heart,
  MessageCircle,
  Bookmark,
  X,
  MoreHorizontal,
  Calendar,
} from 'lucide-react'

const musclePalette = ['Gluteos', 'Piernas', 'Pecho', 'Espalda', 'Hombros', 'Core', 'Brazos', 'Isquios']
const equipmentPalette = ['Barra', 'Mancuernas', 'Maquina', 'Banco', 'Peso corporal', 'Barra fija']

function formatWithCommas(n: number): string {
  if (n < 1000) return String(n)
  const int = Math.trunc(n)
  let s = String(int)
  let out = ''
  while (s.length > 3) {
    out = ',' + s.slice(-3) + out
    s = s.slice(0, -3)
  }
  return s + out
}

function ExerciseVaultMockup() {
  const [search, setSearch] = useState('')
  const [activeMuscles, setActiveMuscles] = useState<string[]>([])
  const [activeEquipment, setActiveEquipment] = useState<string[]>([])

  const exercises = useMemo(
    () => [
      { name: 'Hip Thrust con barra', muscle: 'Gluteos', equipment: 'Barra', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=400&auto=format&fit=crop' },
      { name: 'Sentadilla Búlgara', muscle: 'Piernas', equipment: 'Banco', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=400&auto=format&fit=crop' },
      { name: 'Peso Muerto Rumano', muscle: 'Isquios', equipment: 'Mancuernas', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop' },
      { name: 'Leg Extension', muscle: 'Cuadriceps', equipment: 'Maquina', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop' },
      { name: 'Flexiones', muscle: 'Pecho', equipment: 'Peso corporal', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop' },
      { name: 'Pull Ups', muscle: 'Espalda', equipment: 'Barra fija', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop' },
      { name: 'Press Militar', muscle: 'Hombros', equipment: 'Mancuernas', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop' },
      { name: 'Plancha', muscle: 'Core', equipment: 'Peso corporal', img: 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?q=80&w=400&auto=format&fit=crop' },
      { name: 'Press Inclinado con Mancuernas', muscle: 'Pecho', equipment: 'Banco', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop' },
      { name: 'Jalón al Pecho', muscle: 'Espalda', equipment: 'Maquina', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&auto=format&fit=crop' },
      { name: 'Elevaciones Laterales', muscle: 'Hombros', equipment: 'Mancuernas', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop' },
      { name: 'Curl de Bíceps con Barra', muscle: 'Brazos', equipment: 'Barra', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&auto=format&fit=crop' },
    ],
    []
  )

  const filtered = exercises.filter((e) => {
    const q = search.toLowerCase().trim()
    const matchQ = !q || e.name.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q) || e.equipment.toLowerCase().includes(q)
    const matchM = activeMuscles.length === 0 || activeMuscles.includes(e.muscle)
    const matchE = activeEquipment.length === 0 || activeEquipment.includes(e.equipment)
    return matchQ && (matchM || activeMuscles.length === 0 || activeEquipment.length === 0 ? matchM || matchE : false)
  })

  const toggle = (arr: string[], v: string, setter: (x: string[]) => void) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  }

  const activeFiltersCount = activeMuscles.length + activeEquipment.length + (search ? 1 : 0)

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0c0c0e] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.7)] overflow-hidden">
      <div className="border-b border-white/10 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, musculo o material..."
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm font-semibold text-white placeholder:text-white/40 outline-none focus:border-orange-500/40 focus:bg-white/[0.07] transition"
            />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <SlidersHorizontal className="h-4 w-4 text-white/40" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-black text-orange-300">{activeFiltersCount}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-white/10 bg-white/[0.02] p-5 space-y-6 hidden lg:block">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-orange-500/15 p-2 text-orange-300">
                <Target className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/50">Musculos</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {musclePalette.map((m) => {
                const on = activeMuscles.includes(m)
                return (
                  <button
                    key={m}
                    onClick={() => toggle(activeMuscles, m, setActiveMuscles)}
                    className={`rounded-xl border px-3 py-2 text-[11px] font-bold transition ${
                      on
                        ? 'border-orange-500/35 bg-orange-500/15 text-orange-300 shadow-[0_8px_24px_-8px_rgba(249,115,22,0.4)]'
                        : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-sky-500/15 p-2 text-sky-300">
                <Wrench className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/50">Material</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {equipmentPalette.map((e) => {
                const on = activeEquipment.includes(e)
                return (
                  <button
                    key={e}
                    onClick={() => toggle(activeEquipment, e, setActiveEquipment)}
                    className={`rounded-xl border px-3 py-2 text-[11px] font-bold transition ${
                      on
                        ? 'border-sky-500/35 bg-sky-500/15 text-sky-300 shadow-[0_8px_24px_-8px_rgba(56,189,248,0.4)]'
                        : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {e}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        <section className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[12px] font-bold text-white/85">
              {filtered.length} resultados
            </span>
            {activeFiltersCount > 0 && (
              <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-[12px] font-bold text-orange-300">
                {activeFiltersCount} filtros activos
              </span>
            )}
            <button
              onClick={() => {
                setActiveMuscles([])
                setActiveEquipment([])
                setSearch('')
              }}
              className="ml-auto rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/10 transition"
            >
              Limpiar
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {filtered.map((ex, idx) => {
              const muscles = [ex.muscle]
              const equipment = [ex.equipment]
              const muscleSummary = {
                primary: muscles[0] ?? null,
                remaining: Math.max(0, muscles.length - 1),
              }
              const equipmentSummary = {
                primary: equipment[0] ?? null,
                remaining: Math.max(0, equipment.length - 1),
              }
              const isSelected = idx === 0
              return (
                <article
                  key={ex.name}
                  className={`group flex h-full flex-col overflow-hidden rounded-[22px] border border-white/10 bg-card/95 shadow-[0_18px_50px_-35px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-border/40 hover:shadow-[0_30px_80px_-45px_rgba(0,0,0,0.55)] ${idx >= 2 ? 'hidden sm:flex' : ''}`}
                >
                  <div className="relative isolate aspect-square overflow-hidden rounded-t-[22px] bg-[#111111] sm:aspect-[4/3]">
                    <img
                      src={ex.img}
                      alt={ex.name}
                      className="absolute -inset-px block h-[calc(100%+2px)] w-[calc(100%+2px)] max-w-none rounded-t-[22px] object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.03]"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/42 to-transparent sm:h-32" />
                    {isSelected ? (
                      <div className="absolute inset-x-0 top-0 z-10 overflow-hidden rounded-t-[22px] md:block">
                        <button className="flex h-11 w-full items-center justify-center gap-2 rounded-t-[22px] border-b border-black/10 bg-white/95 text-sm font-bold tracking-[0.08em] text-slate-950 shadow-[0_16px_34px_-24px_rgba(255,255,255,0.95)] backdrop-blur-md">
                          <Plus className="h-4 w-4" /> Agregar al workout
                        </button>
                      </div>
                    ) : (
                      <div className="absolute inset-x-0 top-0 z-10 hidden overflow-hidden rounded-t-[22px] md:block">
                        <button
                          type="button"
                          className="flex h-11 w-full -translate-y-[102%] items-center justify-center gap-2 rounded-t-[22px] border-b border-black/10 bg-white/95 text-sm font-bold tracking-[0.08em] text-slate-950 opacity-0 shadow-[0_16px_34px_-24px_rgba(255,255,255,0.95)] backdrop-blur-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
                        >
                          <Plus className="h-4 w-4" /> Agregar al workout
                        </button>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 sm:px-3 sm:pb-3">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <div className="flex min-w-0 items-center gap-1 rounded-full border border-orange-300/35 bg-orange-500/22 px-2 py-1 text-orange-50 backdrop-blur-md sm:gap-1.5 sm:px-2.5 sm:py-1.5">
                          <Target className="h-3.5 w-3.5 shrink-0 text-orange-200" />
                          {muscleSummary.primary ? (
                            <>
                              <span className="max-w-[84px] truncate text-[10px] font-medium sm:max-w-[120px] sm:text-[11px]">
                                {muscleSummary.primary}
                              </span>
                              {muscleSummary.remaining > 0 && (
                                <span className="text-[10px] text-orange-100 sm:text-[11px]">+{muscleSummary.remaining}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-orange-100 sm:text-[11px]">Sin tags</span>
                          )}
                        </div>
                        <div className="flex min-w-0 items-center gap-1 rounded-full border border-sky-300/35 bg-sky-500/22 px-2 py-1 text-sky-50 backdrop-blur-md sm:gap-1.5 sm:px-2.5 sm:py-1.5">
                          <Wrench className="h-3.5 w-3.5 shrink-0 text-sky-200" />
                          {equipmentSummary.primary ? (
                            <>
                              <span className="max-w-[84px] truncate text-[10px] font-medium sm:max-w-[120px] sm:text-[11px]">
                                {equipmentSummary.primary}
                              </span>
                              {equipmentSummary.remaining > 0 && (
                                <span className="text-[10px] text-sky-100 sm:text-[11px]">+{equipmentSummary.remaining}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-sky-100 sm:text-[11px]">Sin equipo</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <h3
                        className="line-clamp-2 text-sm font-semibold leading-4 tracking-tight text-foreground sm:text-base sm:leading-5"
                        title={ex.name}
                      >
                        {ex.name}
                      </h3>
                    </div>
                    {isSelected ? (
                      <Button className="mt-auto h-9 rounded-xl px-2.5 text-[11px] font-semibold bg-emerald-500 hover:bg-emerald-600 text-emerald-950 shadow-[0_12px_30px_-8px_rgba(16,185,129,0.5)] md:hidden">
                        <Plus className="mr-2 h-4 w-4" /> Agregar
                      </Button>
                    ) : (
                      <Button className="mt-auto h-9 rounded-xl px-2.5 text-[11px] font-semibold md:hidden" variant="outline">
                        <Eye className="mr-2 h-4 w-4" /> Ver
                      </Button>
                    )}
                  </div>
                </article>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-[24px] border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
                <Search className="h-10 w-10 text-white/30 mx-auto mb-3" />
                <p className="font-bold text-white/60">Sin resultados</p>
                <p className="text-sm text-white/40 mt-1">Prueba a limpiar los filtros o buscar otra palabra</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

type CreatorSection = {
  id: number
  name: string
  gradient: string
  chip: string
  exercises: CreatorExercise[]
  isChallenge?: boolean
  challengeType?: string
  challengeMinutes?: number
}
type CreatorExercise = {
  id: string
  name: string
  img: string
  type: 'time' | 'reps'
  value: string
  sets: number
  rest: number
}

function WorkoutCreatorMockup() {
  const [workoutName, setWorkoutName] = useState('Power Legs - Volumen Gluteo + Quad')
  const [category, setCategory] = useState('Fuerza')
  const [level, setLevel] = useState('Intermedio')
  const [duration, setDuration] = useState('58')
  const [privacy, setPrivacy] = useState('Publico')
  const [muscles, setMuscles] = useState<string[]>(['Gluteos', 'Cuadriceps', 'Isquios', 'Core'])
  const [equipment, setEquipment] = useState<string[]>(['Barra', 'Mancuernas', 'Banco', 'Maquina'])
  const [expandedId, setExpandedId] = useState<number | null>(2)

  const initialSections: CreatorSection[] = [
    {
      id: 1,
      name: 'Calentamiento',
      gradient: 'from-sky-500 to-blue-500',
      chip: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
      exercises: [
        { id: 'e1', name: 'Saltos de Tijera', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=300&auto=format&fit=crop', type: 'time', value: '45', sets: 2, rest: 20 },
        { id: 'e2', name: 'Rodillas Altas', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=300&auto=format&fit=crop', type: 'time', value: '30', sets: 2, rest: 15 },
        { id: 'e0b', name: 'Sentadillas Corporales', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=300&auto=format&fit=crop', type: 'reps', value: '15', sets: 2, rest: 20 },
      ],
    },
    {
      id: 2,
      name: 'Pierna Potente',
      gradient: 'from-violet-500 to-fuchsia-500',
      chip: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
      
      exercises: [
        { id: 'e3', name: 'Hip Thrust con barra', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=300&auto=format&fit=crop', type: 'reps', value: '12', sets: 4, rest: 90 },
        { id: 'e4', name: 'Bulgarian Split Squat', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=300&auto=format&fit=crop', type: 'reps', value: '10', sets: 3, rest: 75 },
        { id: 'e5', name: 'Romanian Deadlift', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=300&auto=format&fit=crop', type: 'reps', value: '12', sets: 3, rest: 75 },
        { id: 'e6', name: 'Leg Extension', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=300&auto=format&fit=crop', type: 'reps', value: '15', sets: 3, rest: 60 },
        { id: 'e6b', name: 'Zancadas Caminantes', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=300&auto=format&fit=crop', type: 'reps', value: '12', sets: 3, rest: 60 },
      ],
    },
    {
      id: 3,
      name: 'Finisher',
      gradient: 'from-emerald-500 to-teal-500',
      isChallenge: true,
      challengeType: 'AMRAP',
      challengeMinutes: 12,
      chip: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      exercises: [
        { id: 'e7', name: 'Plank', img: 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?q=80&w=300&auto=format&fit=crop', type: 'time', value: '60', sets: 3, rest: 30 },
        { id: 'e8', name: 'Giros Rusos', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=300&auto=format&fit=crop', type: 'reps', value: '20', sets: 3, rest: 20 },
        { id: 'e8b', name: 'Escaladores', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=300&auto=format&fit=crop', type: 'time', value: '40', sets: 3, rest: 20 },
      ],
    },
  ]
  const [sections] = useState<CreatorSection[]>(initialSections)
  const totalExercises = sections.reduce((acc, s) => acc + s.exercises.length, 0)

  const toggleChip = (arr: string[], v: string, setter: (x: string[]) => void) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0c0c0e] shadow-[0_40px_120px_-40px_rgba(139,92,246,0.35)] overflow-hidden">
      <div className="relative h-[170px] overflow-hidden border-b border-white/10">
        <img
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1400&auto=format&fit=crop"
          alt="Portada"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,12,14,0.25)_0%,rgba(12,12,14,0.92)_100%)]" />
        <div className="relative h-full p-5 sm:p-6 flex items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <button className="relative flex h-24 w-36 shrink-0 items-end justify-end rounded-[22px] overflow-hidden border border-white/15 bg-black/40 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] group">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop"
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-95 group-hover:scale-[1.03] transition"
              />
              <span className="relative z-10 mr-2 mb-2 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                <ImagePlus className="h-3.5 w-3.5" /> Portada
              </span>
            </button>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-300/80 mb-1.5 inline-flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5" /> Editor de workout
              </p>
              <input
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="w-full bg-transparent text-2xl sm:text-3xl font-black tracking-tight text-white outline-none border-b border-transparent focus:border-violet-400/40 pb-0.5 transition"
              />
            </div>
          </div>
          <div className="hidden sm:flex items-end gap-6 text-right">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Duracion</p>
              <div className="mt-1 flex items-baseline gap-1">
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-14 bg-transparent text-xl font-black text-white outline-none text-right"
                />
                <span className="text-sm font-bold text-white/55">min</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Ejercicios</p>
              <p className="mt-1 text-xl font-black text-white">{totalExercises}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 mb-2">Categoria</p>
            <div className="flex gap-2 flex-wrap">
              {['Fuerza', 'Hipertrofia', 'Cardio', 'Movilidad'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                    category === c
                      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 mb-2">Nivel</p>
            <div className="flex gap-2 flex-wrap">
              {['Principiante', 'Intermedio', 'Avanzado'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                    level === l
                      ? 'border-sky-500/30 bg-sky-500/15 text-sky-300'
                      : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 mb-2">Privacidad</p>
            <div className="flex gap-2 flex-wrap">
              {['Publico', 'Privado', 'Solo amigos'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPrivacy(p)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                    privacy === p
                      ? 'border-violet-500/30 bg-violet-500/15 text-violet-300'
                      : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 mb-2">Duracion est.</p>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white">
              {duration} min · {totalExercises} ejercicios
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-xl bg-orange-500/15 p-2 text-orange-300">
                <Target className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55">Musculos objetivo</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Gluteos', 'Cuadriceps', 'Isquios', 'Core', 'Pecho', 'Espalda', 'Hombros'].map((m) => {
                const on = muscles.includes(m)
                return (
                  <button
                    key={m}
                    onClick={() => toggleChip(muscles, m, setMuscles)}
                    className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                      on
                        ? 'border-orange-500/30 bg-orange-500/15 text-orange-300'
                        : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {m}
                    {on && <X className="h-3 w-3 ml-0.5 text-orange-300/80 group-hover:text-orange-200" />}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-xl bg-sky-500/15 p-2 text-sky-300">
                <Wrench className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55">Material necesario</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Barra', 'Mancuernas', 'Banco', 'Maquina', 'Peso corporal', 'Barra fija'].map((e) => {
                const on = equipment.includes(e)
                return (
                  <button
                    key={e}
                    onClick={() => toggleChip(equipment, e, setEquipment)}
                    className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                      on
                        ? 'border-sky-500/30 bg-sky-500/15 text-sky-300'
                        : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {e}
                    {on && <X className="h-3 w-3 ml-0.5 text-sky-300/80 group-hover:text-sky-200" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((s) => (
            <div key={s.id} className="rounded-[24px] border border-white/10 bg-white/[0.02] overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                className={`w-full flex items-center gap-4 px-4 sm:px-5 py-4 text-left bg-gradient-to-r ${s.gradient} via-transparent to-transparent`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/40 text-white font-black backdrop-blur-md">
                  {s.id}
                </div>
                <div className="flex-1">
                  <h4 className="text-base sm:text-lg font-black tracking-tight text-white">{s.name}</h4>
                  <p className="text-[11px] font-bold text-white/55 mt-0.5">{s.exercises.length} ejercicios</p>
                </div>
                {s.isChallenge && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 backdrop-blur-md">
                    <Zap className="h-3.5 w-3.5" />
                    {s.challengeType} {s.challengeMinutes}min
                  </div>
                )}
                <ChevronRight
                  className={`h-5 w-5 text-white/60 transition-transform ${expandedId === s.id ? 'rotate-90' : ''}`}
                />
              </button>
              {expandedId === s.id && (
                <div className="p-4 sm:p-5 space-y-3 border-t border-white/10">
                  {s.exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="group flex items-center gap-3 sm:gap-4 rounded-[22px] border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.05] transition"
                    >
                      <div className="text-white/30 hover:text-white/60 cursor-grab transition">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <img src={ex.img} alt="" className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-bold text-white truncate">{ex.name}</p>
                      </div>
                      <div className="hidden sm:grid grid-cols-4 gap-2 items-center shrink-0">
                        <select
                          defaultValue={ex.type}
                          className="h-9 rounded-xl border border-white/10 bg-white/5 px-2 text-[11px] font-bold text-white/80 outline-none"
                        >
                          <option value="reps">Repeticiones</option>
                          <option value="time">Tiempo</option>
                        </select>
                        <input
                          defaultValue={ex.value}
                          className="h-9 w-16 rounded-xl border border-white/10 bg-white/5 px-2 text-center text-[12px] font-bold text-white outline-none"
                        />
                        <input
                          defaultValue={ex.sets}
                          className="h-9 w-14 rounded-xl border border-white/10 bg-white/5 px-2 text-center text-[12px] font-bold text-white outline-none"
                        />
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-white/40 shrink-0" />
                          <input
                            defaultValue={ex.rest}
                            className="h-9 w-16 rounded-xl border border-white/10 bg-white/5 px-2 text-center text-[12px] font-bold text-white outline-none"
                          />
                        </div>
                      </div>
                      <button className="text-white/30 hover:text-red-400 transition p-1.5">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button className="w-full flex items-center justify-center gap-2 h-12 rounded-[20px] border border-dashed border-white/15 bg-white/[0.02] text-[11px] font-black uppercase tracking-[0.2em] text-white/60 hover:bg-white/[0.05] hover:text-white transition">
                    <Plus className="h-4 w-4" /> Agregar ejercicio
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-white/10 bg-[rgba(12,12,14,0.92)] backdrop-blur-xl px-5 sm:px-6 py-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Lista para guardar
            </span>
            <span className="text-[11px] font-bold text-white/50">{totalExercises} ejercicios · {duration} min</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" className="rounded-full h-11 px-4 border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white text-xs font-bold">
              Previsualizar
            </Button>
            <Button className="rounded-full h-11 px-6 text-xs font-black shadow-[0_18px_40px_-10px_rgba(16,185,129,0.55)] bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
              Guardar workout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkoutExecutionMockup() {
  const [seconds, setSeconds] = useState(32)
  const [running, setRunning] = useState(true)
  const exerciseIndex = 2
  const totalExercises = 8
  const setIndex = 1
  const totalSets = 4

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds((s) => (s + 1) % 10000), 1000)
    return () => clearInterval(id)
  }, [running])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  const radius = 170
  const circumference = 2 * Math.PI * radius
  const progress = ((seconds % 120) / 120) * circumference

  return (
    <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(1200px_600px_at_top_left,rgba(59,130,246,0.08),transparent_55%),radial-gradient(900px_500px_at_bottom_right,rgba(16,185,129,0.06),transparent_55%),#0b0c0f] shadow-[0_40px_120px_-40px_rgba(59,130,246,0.35)] overflow-hidden">
      <div className="px-5 sm:px-7 pt-5 sm:pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Bloque Principal</p>
              <p className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">Hip Thrust con barra</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45">Ejercicio</p>
              <p className="text-sm font-black text-white tabular-nums">
                {exerciseIndex}<span className="text-white/40">/{totalExercises}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300/75">Tiempo total</p>
              <p className="text-sm font-black text-emerald-300 tabular-nums">24:18</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[26px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/50">Serie {setIndex + 1} de {totalSets}</p>
            <p className="text-[11px] font-black text-white/50">12 reps objetivo</p>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSets }).map((_, i) => {
              const state = i < setIndex ? 'done' : i === setIndex ? 'current' : 'pending'
              return (
                <div key={i} className="flex-1 flex items-center gap-2">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black transition ${
                      state === 'done'
                        ? 'bg-emerald-500 text-emerald-950'
                        : state === 'current'
                        ? 'bg-orange-500 text-white ring-4 ring-orange-500/20'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {state === 'done' ? <Check className="h-4.5 w-4.5" /> : i + 1}
                  </div>
                  {i < totalSets - 1 && (
                    <div className={`flex-1 h-1.5 rounded-full ${state === 'done' ? 'bg-emerald-500/70' : 'bg-white/10'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-7 pb-5 sm:pb-7">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Actividad</p>
            <p className="mt-1 text-xs font-bold text-emerald-300 inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> EN CURSO
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Tiempo</p>
            <p className="mt-1 text-xl font-black text-white tabular-nums">
              {mm}:{ss}
            </p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[400px] aspect-square flex items-center justify-center">
          <div className="absolute inset-0 pointer-events-none">
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <defs>
                <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              <circle cx="200" cy="200" r={radius} fill="rgba(255,255,255,0.03)" />
              <circle
                cx="200"
                cy="200"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="16"
              />
              <circle
                cx="200"
                cy="200"
                r={radius}
                fill="none"
                stroke="url(#ring)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                transform="rotate(-90 200 200)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
          </div>
          <div className="relative z-10 w-[65%] aspect-square rounded-full overflow-hidden border-4 border-[#0b0c0f] shadow-[0_30px_80px_-20px_rgba(16,185,129,0.45)]">
            <img
              src="https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop"
              alt="Hip Thrust"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="text-center max-w-md mx-auto mt-4">
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Hip Thrust con barra</h3>
          <p className="mt-2 text-sm sm:text-base text-white/60 font-semibold leading-relaxed">
            Empuja con gluteos, controla la bajada y manten la contraccion 1 segundo arriba.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 max-w-lg mx-auto">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Ejercicio</p>
            <p className="mt-1 text-2xl font-black text-white tabular-nums">
              {exerciseIndex}<span className="text-white/40">/{totalExercises}</span>
            </p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Serie</p>
            <p className="mt-1 text-2xl font-black text-white tabular-nums">
              {setIndex + 1}<span className="text-white/40">/{totalSets}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center">
          <div className="flex items-center justify-center gap-2">
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition">
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={() => setRunning((r) => !r)}
              className={`flex h-14 items-center justify-center gap-2 rounded-2xl px-7 font-black text-sm transition shadow-[0_20px_50px_-12px_${
                running ? 'rgba(249,115,22,0.55)' : 'rgba(16,185,129,0.55)'
              }] ${
                running
                  ? 'bg-orange-500 text-white hover:bg-orange-400'
                  : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
              }`}
            >
              {running ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
              {running ? 'Pausar' : 'Reanudar'}
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition">
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
          <button className="flex-1 sm:max-w-xs h-14 rounded-2xl bg-emerald-500 text-emerald-950 font-black text-sm hover:bg-emerald-400 transition inline-flex items-center justify-center gap-2 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.55)]">
            <CheckCircle2 className="h-5 w-5" /> Hecho - Siguiente ejercicio
          </button>
        </div>
      </div>
    </div>
  )
}

function WorkoutChallengeExecutionMockup() {
  const [secondsLeft, setSecondsLeft] = useState(7 * 60 + 32)
  const [score, setScore] = useState(200)
  const [rounds, setRounds] = useState(2)
  const [running, setRunning] = useState(true)
  const currentIdx = 1
  const circuit = [
    { name: 'Hip Thrust con barra', reps: '12 reps', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=300&auto=format&fit=crop' },
    { name: 'Sentadilla Búlgara', reps: '10 reps', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=300&auto=format&fit=crop' },
    { name: 'Peso Muerto Rumano', reps: '12 reps', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=300&auto=format&fit=crop' },
    { name: 'Extensión de Pierna', reps: '15 reps', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=300&auto=format&fit=crop' },
  ]
  const next = circuit[(currentIdx + 1) % circuit.length]

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const totalSeconds = 12 * 60
  const progress = 1 - secondsLeft / totalSeconds

  return (
    <div className="rounded-[28px] border border-amber-500/15 bg-[radial-gradient(1200px_600px_at_top_left,rgba(251,191,36,0.08),transparent_55%),radial-gradient(900px_500px_at_bottom_right,rgba(16,185,129,0.06),transparent_55%),#0b0d0c] shadow-[0_40px_120px_-40px_rgba(251,146,60,0.4)] overflow-hidden">
      <div className="px-5 sm:px-7 pt-5 sm:pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-4xl sm:text-5xl font-black tracking-[-0.04em] text-white tabular-nums">
                {mm}<span className="text-white">:</span>{ss}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Power Legs Challenge</p>
            <p className="text-[11px] font-bold text-white/55 mt-0.5">BLOQUE PRINCIPAL</p>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-orange-400"
            style={{ width: `${Math.min(100, progress * 100)}%`, transition: 'width 0.8s ease' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-5 sm:gap-6 px-5 sm:px-7 py-5 sm:py-6">
        <div className="space-y-4 sm:space-y-5">
          <div className="rounded-[26px] border border-emerald-500/20 bg-emerald-500/[0.06] p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300/80 mb-2">Ejercicio actual</p>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{circuit[currentIdx].name}</h3>
              <p className="mt-1 text-lg font-black text-emerald-300">{circuit[currentIdx].reps}</p>
            </div>
            <div className="mt-5 relative rounded-[24px] overflow-hidden border border-white/10">
              <img
                src={circuit[currentIdx].img}
                alt=""
                className="w-full h-48 sm:h-56 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setScore((s) => s + 100)
                  setRounds((r) => r + 1)
                }}
                className="h-14 rounded-2xl bg-emerald-500 text-emerald-950 font-black text-sm hover:bg-emerald-400 transition inline-flex items-center justify-center gap-2 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.55)]"
              >
                <Zap className="h-5 w-5" /> SIGUIENTE
              </button>
              <button
                onClick={() => setRunning((r) => !r)}
                className={`h-14 rounded-2xl font-black text-sm transition inline-flex items-center justify-center gap-2 ${
                  running
                    ? 'bg-orange-500 text-white hover:bg-orange-400 shadow-[0_20px_50px_-12px_rgba(249,115,22,0.55)]'
                    : 'border border-white/15 bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {running ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
                {running ? 'Pausar' : 'Reanudar'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45 mb-1">Puntuación actual</p>
                <p className="text-4xl font-black tracking-tight text-emerald-300 tabular-nums">{score} <span className="text-white/50 text-xl">pts</span></p>
                <p className="mt-1.5 text-xs font-bold text-white/55">{rounds} rondas completadas</p>
              </div>
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300 inline-flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Modo Reto
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45 mb-2">Seguimiento</p>
              <div className="flex items-center justify-between text-[11px] font-black text-white/55 mb-2.5">
                <span>PROGRESO DE LA VUELTA</span>
                <span className="tabular-nums text-white/85">{currentIdx + 1}/{circuit.length}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${((currentIdx + 1) / circuit.length) * 100}%` }}
                />
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Circuito</p>
            <div className="space-y-2">
              {circuit.map((ex, i) => {
                const state = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'pending'
                return (
                  <button
                    key={ex.name}
                    className={`w-full flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      state === 'current'
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : state === 'done'
                        ? 'border-white/10 bg-white/[0.02] opacity-80'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                        state === 'done'
                          ? 'border-emerald-500/30 bg-emerald-500/30 text-emerald-200'
                          : state === 'current'
                          ? 'border-emerald-400 bg-emerald-400 text-emerald-950 ring-4 ring-emerald-400/15'
                          : 'border-white/15 bg-white/5 text-white/50'
                      }`}
                    >
                      {state === 'done' ? <Check className="h-4 w-4" /> : <span className="text-[11px] font-black">{i + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`truncate text-sm font-bold ${state === 'current' ? 'text-white' : state === 'done' ? 'text-white/70' : 'text-white/85'}`}>
                        {ex.name}
                      </p>
                    </div>
                    <span className={`text-[11px] font-black tabular-nums ${state === 'current' ? 'text-emerald-300' : 'text-white/60'}`}>
                      {ex.reps}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45 mb-3">Siguiente cambio</p>
            <div className="flex items-center gap-4">
              <img src={next.img} alt="" className="h-14 w-14 rounded-2xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-white truncate">{next.name}</p>
                <p className="text-xs text-white/55 font-bold mt-0.5">{next.reps}</p>
              </div>
              <button className="h-12 rounded-2xl bg-amber-500 text-amber-950 font-black text-xs hover:bg-amber-400 transition inline-flex items-center gap-2 px-5 shadow-[0_18px_40px_-10px_rgba(251,191,36,0.55)]">
                <Trophy className="h-4 w-4" /> FINALIZAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type FeedPost = {
  id: string
  author: { name: string; handle: string; avatar: string; verified?: boolean; premium?: boolean }
  workoutTitle: string
  duration: string
  difficulty: string
  muscles: string[]
  cover: string
  exercises: number
  likes: number
  comments: number
  saves: number
  timeAgo: string
  tags?: string[]
}

function WorkoutFeedMockup() {
  const [liked, setLiked] = useState<Record<string, boolean>>({ p1: true })
  const [saved, setSaved] = useState<Record<string, boolean>>({ p2: true })

  const posts: FeedPost[] = [
    {
      id: 'p1',
      author: { name: 'Laura Campos', handle: '@laura.powerlift', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop', verified: true, premium: true },
      workoutTitle: 'Full Body Hipertrofia · Dia A',
      duration: '62 min',
      difficulty: 'Intermedio',
      muscles: ['Pecho', 'Espalda', 'Piernas'],
      cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
      exercises: 11,
      likes: 1284,
      comments: 47,
      saves: 283,
      timeAgo: 'hace 2h',
      tags: ['Volumen', 'FullBody'],
    },
    {
      id: 'p2',
      author: { name: 'Carlos Peña', handle: '@carlos.fit', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' },
      workoutTitle: 'Tiraje Vertical - Espalda Ancha',
      duration: '48 min',
      difficulty: 'Avanzado',
      muscles: ['Espalda', 'Brazos'],
      cover: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop',
      exercises: 7,
      likes: 612,
      comments: 21,
      saves: 156,
      timeAgo: 'hace 5h',
      tags: ['Pull', 'Espalda'],
    },
    {
      id: 'p3',
      author: { name: 'Marta Ruiz', handle: '@marta.core', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop', premium: true },
      workoutTitle: 'Core Killer · 15 min Finisher',
      duration: '15 min',
      difficulty: 'Principiante',
      muscles: ['Core'],
      cover: 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?q=80&w=800&auto=format&fit=crop',
      exercises: 5,
      likes: 2341,
      comments: 89,
      saves: 512,
      timeAgo: 'hace 1d',
      tags: ['Core', 'Finisher'],
    },
  ]

  const toggle = (dict: Record<string, boolean>, key: string, setter: (x: Record<string, boolean>) => void) => {
    setter({ ...dict, [key]: !dict[key] })
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0c0c0e] shadow-[0_40px_120px_-40px_rgba(56,189,248,0.35)] overflow-hidden">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-gradient-to-b from-sky-500/10 via-transparent to-transparent">
        <div className="flex items-center gap-3 overflow-x-auto">
          {[
            { label: 'Para ti', icon: Sparkles, active: true },
            { label: 'Siguiendo', icon: Users, active: false },
            { label: 'Tendencia', icon: Flame, active: false },
            { label: 'Explorar', icon: Eye, active: false },
          ].map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.label}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                  t.active
                    ? 'border-sky-500/30 bg-sky-500/15 text-sky-300'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            )
          })}
        </div>
        <button className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-white/70 hover:bg-white/10 transition shrink-0">
          <Layers className="h-3.5 w-3.5" /> Filtrar
        </button>
      </div>

      <div className="max-w-[640px] mx-auto p-5 sm:p-6 space-y-6">
        {posts.map((p) => {
          const isLiked = !!liked[p.id]
          const isSaved = !!saved[p.id]
          return (
            <article key={p.id} className="rounded-[26px] border border-white/10 bg-white/[0.025] overflow-hidden hover:bg-white/[0.04] transition">
              <header className="flex items-center gap-3 p-4 sm:p-5 pb-4">
                <img src={p.author.avatar} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-black text-white tracking-tight truncate">{p.author.name}</p>
                    {p.author.verified && (
                      <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />
                    )}
                    {p.author.premium && (
                      <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-white/55 font-semibold truncate">{p.author.handle} · {p.timeAgo}</p>
                </div>
                <button className="text-white/50 hover:text-white transition p-2 rounded-xl hover:bg-white/5">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </header>

              <div className="relative mx-4 sm:mx-5 rounded-[22px] overflow-hidden border border-white/10">
                <img src={p.cover} alt="" className="w-full h-64 sm:h-72 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/25" />
                <div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between">
                  <div className="rounded-2xl border border-black/20 bg-black/60 px-3 py-1.5 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.18em] text-white/90 inline-flex items-center gap-1.5">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {p.exercises} ejercicios
                  </div>
                  <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/25 px-3 py-1.5 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.18em] text-emerald-50 inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {p.duration}
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">{p.workoutTitle}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                      p.difficulty === 'Principiante' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/20' :
                      p.difficulty === 'Intermedio' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/20' :
                      'bg-orange-500/20 text-orange-200 border border-orange-500/20'
                    }`}>
                      {p.difficulty}
                    </span>
                    {p.muscles.map((m) => (
                      <span key={m} className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/90 backdrop-blur-md">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 mt-1">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggle(liked, p.id, setLiked)}
                    className="group flex items-center gap-1.5 text-xs font-bold transition"
                  >
                    <Heart className={`h-5 w-5 transition ${isLiked ? 'text-rose-400 fill-rose-400 scale-110' : 'text-white/70 group-hover:text-rose-400'}`} />
                    <span className={`tabular-nums ${isLiked ? 'text-rose-400' : 'text-white/80'}`}>{formatWithCommas(p.likes + (isLiked ? 1 : 0))}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-bold text-white/75 hover:text-sky-300 transition">
                    <MessageCircle className="h-5 w-5" />
                    <span className="tabular-nums">{p.comments}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-bold text-white/75 hover:text-emerald-300 transition">
                    <Share2 className="h-5 w-5" />
                    <span className="tabular-nums hidden sm:inline">Compartir</span>
                  </button>
                </div>
                <button
                  onClick={() => toggle(saved, p.id, setSaved)}
                  className="flex items-center gap-1.5 text-xs font-bold transition"
                >
                  <Bookmark className={`h-5 w-5 transition ${isSaved ? 'text-amber-400 fill-amber-400 scale-110' : 'text-white/70 group-hover:text-amber-400'}`} />
                  <span className={`tabular-nums hidden sm:inline ${isSaved ? 'text-amber-400' : 'text-white/80'}`}>{formatWithCommas(p.saves + (isSaved ? 1 : 0))}</span>
                </button>
              </div>

              {p.tags && (
                <div className="px-4 sm:px-5 pb-5 pt-0 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-sky-300">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </article>
          )
        })}
        </div>
      </div>
  )
}

function ProfileHeaderMockup() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.18),transparent_30%),radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.16),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.6)] p-5 sm:p-6 lg:p-8 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-5 lg:gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <div className="h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-[28px] border border-white/10 bg-muted shadow-[0_20px_40px_rgba(0,0,0,0.35)] ring-2 ring-emerald-500/25">
              <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=300&auto=format&fit=crop" alt="Avatar" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500 px-3.5 py-1 text-[11px] font-black text-emerald-950 shadow-lg">
              <ShieldCheck className="h-3.5 w-3.5" /> Lvl 14
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
              <Medal className="h-3.5 w-3.5" /> Guerrero Avanzado
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
              <Crown className="h-3.5 w-3.5" /> Premium
            </div>
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Alex Martinez</h2>
              <p className="text-base text-white/60 font-semibold">@alex.fitlife</p>
            </div>
            <div className="flex items-center justify-center lg:justify-end gap-2 rounded-2xl border border-indigo-500/15 bg-indigo-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 w-fit mx-auto lg:mx-0">
              <Sparkles className="h-3.5 w-3.5" /> XP Boost x 1.5
            </div>
          </div>
          <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3 sm:col-span-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">XP actual</p>
              <p className="mt-1.5 text-xl font-black tracking-tight text-white">14,320<span className="ml-1 text-xs font-semibold text-white/50">/ 16,000</span></p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-slate-950/30 px-4 py-3 sm:col-span-3 flex flex-col justify-center">
              <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
                <span>Progreso a Lvl 15</span>
                <span className="text-white">89.5%</span>
              </div>
              <div className="mt-2.5 h-3 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[89.5%] rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400" />
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Seguidores</p>
              <p className="mt-1.5 flex items-center gap-2 text-xl font-black tracking-tight text-white"><Users className="h-4 w-4 text-emerald-400" /> 1,247</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Siguiendo</p>
              <p className="mt-1.5 flex items-center gap-2 text-xl font-black tracking-tight text-white"><UserPlus className="h-4 w-4 text-sky-400" /> 89</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Workouts</p>
              <p className="mt-1.5 flex items-center gap-2 text-xl font-black tracking-tight text-white"><Dumbbell className="h-4 w-4 text-violet-400" /> 32</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileProgressMockup() {
  const [month, setMonth] = useState(0) // 0 = agosto, 1 = julio
  const months = ['Agosto 2026', 'Julio 2026']
  const heatmaps: number[][] = [
    [2, 4, 1, 3, 0, 4, 2, 3, 1, 4, 0, 2, 3, 4, 1, 2, 0, 4, 3, 2, 1, 4, 2, 3, 0, 1, 4, 2, 3, 4],
    [1, 3, 2, 0, 4, 2, 3, 1, 0, 3, 4, 1, 2, 3, 0, 4, 2, 1, 3, 0, 4, 2, 3, 1, 0, 2, 4, 1, 3, 2, 0],
  ]
  const headers = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const startPadding = [2, 2] // agosto empieza en sabado (idx 6? → ponemos 2 para rellenar 2 primeros dias)
  const colors = [
    'bg-white/[0.04] border-white/8',
    'bg-emerald-500/20 border-transparent',
    'bg-emerald-400/40 border-transparent',
    'bg-emerald-500/70 border-transparent',
    'bg-emerald-500 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.6)] border-transparent',
  ]

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0c0c0e] shadow-[0_40px_120px_-40px_rgba(16,185,129,0.35)] overflow-hidden">
      <div className="px-5 sm:px-6 py-5 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white inline-flex items-center gap-2.5">
              <Activity className="w-5 h-6 text-emerald-400" /> Tu progreso semanal
            </h2>
            <p className="text-sm text-white/55 font-semibold mt-1.5">Consistencia, atributos y racha historica acumulada.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Racha', value: '23', color: 'text-orange-300', icon: Flame, bg: 'bg-orange-500/10 border-orange-500/20' },
              { label: 'Workouts', value: '148', color: 'text-sky-300', icon: Trophy, bg: 'bg-sky-500/10 border-sky-500/20' },
              { label: 'Tiempo', value: '76h 32m', color: 'text-emerald-300', icon: Clock, bg: 'bg-emerald-500/10 border-emerald-500/20' },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className={`rounded-2xl border ${s.bg} px-4 py-2.5 text-center`}>
                  <Icon className={`h-4 w-4 mx-auto ${s.color}`} />
                  <p className={`mt-1 text-lg font-black tracking-tight ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45">{s.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-5 sm:gap-6 p-5 sm:p-6">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
            <h3 className="font-black text-white text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-400" /> Mapa de Actividad
            </h3>
            <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
              <button
                onClick={() => setMonth((m) => Math.max(0, m - 1))}
                disabled={month === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[120px] text-center text-sm font-bold tabular-nums text-white">{months[month]}</span>
              <button
                onClick={() => setMonth((m) => Math.min(months.length - 1, m + 1))}
                disabled={month === months.length - 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="w-full">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
              {headers.map((d) => (
                <div key={d} className="text-center text-[11px] text-white/40 w-full aspect-square flex items-center justify-center font-black tracking-wider">
                  {d}
                </div>
              ))}
              {Array.from({ length: startPadding[month] }).map((_, i) => (
                <div key={`sp-${i}`} className="w-full aspect-square" />
              ))}
              {heatmaps[month].map((intensity, i) => (
                <button
                  key={i}
                  title={`Dia ${i + 1} · Intensidad ${intensity}`}
                  className={`group relative w-full aspect-square rounded-lg sm:rounded-xl border transition-all hover:scale-[1.08] hover:z-10 ${colors[intensity]}`}
                >
                  {intensity >= 4 && (
                    <span className="absolute inset-0 rounded-lg sm:rounded-xl ring-2 ring-emerald-400/50 animate-pulse pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Leyenda de intensidad</p>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {['Nada', 'Baja', 'Media', 'Alta', 'Maxima'].map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`h-4 w-4 rounded-md border ${colors[i]}`} />
                    <span className="text-[10px] font-bold text-white/55 hidden sm:inline">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-white text-lg flex items-center gap-2.5">
              <BarChart2 className="w-5 h-5 text-violet-400" /> Atributos RPG
            </h3>
            <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
              4 atributos
            </span>
          </div>
          <div className="space-y-3.5 sm:space-y-4 flex-1 flex flex-col justify-center">
            {[
              { name: 'Fuerza', icon: Swords, color: 'text-red-400', bg: 'bg-red-500/10', bar: 'bg-gradient-to-r from-red-500 to-orange-400', border: 'border-red-500/20', level: 14, points: 140, max: 150 },
              { name: 'Agilidad', icon: Footprints, color: 'text-sky-400', bg: 'bg-sky-500/10', bar: 'bg-gradient-to-r from-sky-400 to-cyan-300', border: 'border-sky-500/20', level: 11, points: 110, max: 120 },
              { name: 'Resistencia', icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10', bar: 'bg-gradient-to-r from-emerald-400 to-teal-300', border: 'border-emerald-500/20', level: 17, points: 170, max: 180 },
              { name: 'Sabiduria', icon: Brain, color: 'text-violet-400', bg: 'bg-violet-500/10', bar: 'bg-gradient-to-r from-violet-400 to-fuchsia-400', border: 'border-violet-500/20', level: 9, points: 90, max: 100 },
            ].map((attr) => {
              const Icon = attr.icon
              return (
              <div key={attr.name} className={`p-4 rounded-2xl border bg-white/[0.02] space-y-3 ${attr.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`p-2.5 rounded-xl shadow-sm ${attr.bg}`}>
                      <Icon className={`w-5 h-5 ${attr.color}`} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white leading-none">{attr.name}</h4>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-white">Lvl {attr.level}</span>
                    <span className="text-[11px] text-white/50 tabular-nums font-semibold">{attr.points}/{attr.max} pts</span>
                  </div>
                </div>
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${attr.bar} shadow-[0_0_12px_rgba(255,255,255,0.1)]`}
                    style={{ width: `${(attr.points / attr.max) * 100}%` }}
                  />
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function PricingMockup({ hasSession, onRegister }: { hasSession: boolean; onRegister: (e: React.MouseEvent) => void }) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [hovered, setHovered] = useState<'free' | 'pro' | null>(null)
  const saveMonth = Math.round((9 - 4) / 9 * 100)

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0a0a0d] shadow-[0_40px_120px_-40px_rgba(16,185,129,0.35)] overflow-hidden">
      <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 text-center border-b border-white/10">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300 mb-4">
          <Crown className="h-3.5 w-3.5" /> Elige tu plan
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.05em] text-white leading-[1.05] px-2">
          Entrena sin limites.
          <br />
          <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
            Evoluciona mas rapido.
          </span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-white/55 font-semibold max-w-xl mx-auto">
          Empieza gratis. Actualiza a Pro cuando necesites IA, estadisticas y generacion de workouts.
        </p>
        <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 p-1.5">
          {([
            { k: 'monthly', label: 'Mensual' },
            { k: 'yearly', label: 'Anual' },
          ] as const).map((opt) => (
            <button
              key={opt.k}
              onClick={() => setBilling(opt.k)}
              className={`relative inline-flex items-center gap-2 rounded-full px-5 sm:px-6 py-2 text-xs font-black uppercase tracking-wider transition ${
                billing === opt.k
                  ? 'bg-emerald-500 text-emerald-950 shadow-[0_14px_35px_-10px_rgba(16,185,129,0.6)]'
                  : 'text-white/65 hover:text-white'
              }`}
            >
              {opt.label}
              {opt.k === 'yearly' && (
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${billing === opt.k ? 'bg-emerald-950/30 text-emerald-900' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'}`}>
                  AHORRA {saveMonth}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-5 sm:gap-6 p-5 sm:p-6 lg:p-8">
        <div
          onMouseEnter={() => setHovered('free')}
          onMouseLeave={() => setHovered(null)}
          className={`rounded-[28px] sm:rounded-[32px] border p-5 sm:p-8 backdrop-blur-xl transition relative overflow-hidden ${
            hovered === 'free'
              ? 'border-white/20 bg-white/[0.06] translate-y-[-2px]'
              : 'border-white/10 bg-white/[0.04]'
          }`}
        >
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl -z-0" />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/45">Free</p>
                <h3 className="mt-3 text-4xl sm:text-5xl font-black tracking-[-0.06em] text-white">0€</h3>
                <p className="mt-1 text-xs font-bold text-white/50">{billing === 'monthly' ? '/ mes' : '/ año'} · sin tarjeta</p>
              </div>
            </div>
            <ul className="mt-7 space-y-3.5">
              {['Crear y editar workouts', 'Banco de 2,300+ ejercicios', 'Publicar y compartir', 'Seguir creadores', 'Modo ejecucion basico'].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/85">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-base leading-7 text-white/65 font-semibold">{item}</p>
                </li>
              ))}
            </ul>
            <Link href="#" onClick={onRegister} className="mt-8 block">
              <Button variant="outline" className="w-full h-14 rounded-full border-white/15 bg-white/5 text-white font-black text-sm hover:bg-white/10">
                {hasSession ? 'Ir al feed' : 'Empezar gratis'}
              </Button>
            </Link>
          </div>
        </div>

        <div
          onMouseEnter={() => setHovered('pro')}
          onMouseLeave={() => setHovered(null)}
          className={`rounded-[28px] sm:rounded-[32px] border p-5 sm:p-8 relative overflow-hidden transition ${
            hovered === 'pro'
              ? 'border-emerald-300/40 bg-[linear-gradient(180deg,rgba(16,185,129,0.22),rgba(255,255,255,0.05))] translate-y-[-3px]'
              : 'border-emerald-300/25 bg-[linear-gradient(180deg,rgba(16,185,129,0.16),rgba(255,255,255,0.05))]'
          } shadow-[0_30px_100px_-10px_rgba(74,222,128,0.3)]`}
        >
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl -z-0" />
          <div className="absolute top-5 right-5 z-10">
            <div className="rounded-full border border-emerald-200/25 bg-emerald-300/15 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-50">
              RECOMENDADO
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200 mb-3">
                  <Crown className="h-3.5 w-3.5" /> Plan Premium
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-100">Premium</p>
                <div className="mt-3 flex items-end gap-3">
                  <h3 className="text-5xl sm:text-6xl font-black tracking-[-0.06em] text-white">
                    {billing === 'yearly' ? 'Pro' : '9€'}
                  </h3>
                  {billing === 'yearly' && (
                    <div className="pb-3">
                      <p className="text-sm font-bold text-emerald-200 line-through opacity-70">9€ / mes</p>
                      <p className="text-base font-black text-emerald-200">4€ / mes facturado anualmente</p>
                    </div>
                  )}
                </div>
                {billing === 'monthly' && <p className="mt-1 text-xs font-bold text-white/60">/ mes · cancelas cuando quieras</p>}
              </div>
            </div>
            <ul className="mt-7 space-y-3.5">
              {[
                { icon: Sparkles, text: 'Workouts generados con IA', highlight: true },
                { icon: Play, text: 'Tutoriales en la sesion (form + cues)', highlight: false },
                { icon: BarChart2, text: 'Progreso, estadisticas y metricas 1RM', highlight: true },
                { icon: Activity, text: 'Mapa de calor y atributos RPG', highlight: false },
                { icon: Share2, text: 'Plantillas premium y exportar PDF', highlight: false },
                { icon: Crown, text: 'Badges exclusivos y XP boost', highlight: true },
              ].map((item) => {
                const Icon = item.icon
                return (
                <li key={item.text} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.highlight ? 'bg-emerald-300/20 text-emerald-100' : 'bg-white/15 text-white'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className={`text-base leading-7 font-semibold ${item.highlight ? 'text-white' : 'text-white/80'}`}>{item.text}</p>
                </li>
              )
              })}
            </ul>
            <div className="mt-6 rounded-[24px] border border-emerald-300/20 bg-emerald-500/10 p-4 flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-emerald-950 shadow-[0_10px_25px_-6px_rgba(16,185,129,0.6)] shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm">14 dias gratis</p>
                <p className="text-xs text-emerald-100/80 font-semibold">Prueba Pro sin compromiso, cancela antes.</p>
              </div>
            </div>
            <Link href="#" onClick={onRegister} className="mt-6 block">
              <Button size="lg" className="w-full h-14 rounded-full bg-emerald-400 text-emerald-950 hover:bg-emerald-300 font-black text-base shadow-[0_20px_50px_-10px_rgba(74,222,128,0.55)]">
                {hasSession ? 'Ir al feed' : 'Empezar prueba gratis'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionCard({ eyebrow, eyebrowIcon, eyebrowColor, title, hook }: {
  eyebrow: string
  eyebrowIcon: React.ComponentType<{ className?: string }>
  eyebrowColor: string
  title: string
  hook: string
}) {
  const Icon = eyebrowIcon
  return (
    <div className="text-center max-w-4xl sm:max-w-5xl mx-auto mb-10 sm:mb-14">
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] ${eyebrowColor}`}>
        <Icon className="h-3.5 w-3.5" /> {eyebrow}
      </span>
      <h2 className="mt-4 sm:mt-5 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-[-0.05em] text-white leading-[1.02]">
        {title}
      </h2>
      <p className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl text-white/55 font-semibold max-w-2xl sm:max-w-3xl mx-auto leading-relaxed">
        {hook}
      </p>
    </div>
  )
}

export default function LandingExperience() {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const hasSession = Boolean(user) && !isLoading

  const handleAuthAction = (e: React.MouseEvent) => {
    e.preventDefault()
    if (hasSession) {
      router.push('/feed')
    } else {
      router.push('/auth/login?next=%2Ffeed')
    }
  }

  const handleRegisterAction = (e: React.MouseEvent) => {
    e.preventDefault()
    if (hasSession) {
      router.push('/feed')
    } else {
      router.push('/auth/register?next=%2Ffeed')
    }
  }

  const handleFeedAction = (e: React.MouseEvent) => {
    e.preventDefault()
    if (hasSession) {
      router.push('/feed')
    } else {
      router.push('/auth/register?next=%2Ffeed')
    }
  }

  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main className="relative min-h-screen bg-[#050608] text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[1600px] rounded-full bg-emerald-500/[0.08] blur-[140px]" />
        <div className="absolute top-[500px] right-0 h-[500px] w-[900px] rounded-full bg-violet-500/[0.10] blur-[130px]" />
        <div className="absolute top-[1200px] left-0 h-[500px] w-[900px] rounded-full bg-orange-500/[0.08] blur-[140px]" />
        <div className="absolute top-[2100px] right-10 h-[500px] w-[900px] rounded-full bg-sky-500/[0.08] blur-[140px]" />
        <div className="absolute top-[3000px] left-1/2 -translate-x-1/2 h-[500px] w-[1100px] rounded-full bg-emerald-500/[0.08] blur-[140px]" />
      </div>

      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md transition-all duration-300 ${
          scrolled
            ? 'border-white/10 bg-black/70 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.8)]'
            : 'border-white/10 bg-black/40'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <img
              src="/logo.png"
              alt="MyGym"
              className="h-9 sm:h-10 w-auto object-contain rounded-2xl"
            />
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: 'Crear', href: '#crear' },
              { label: 'Entrenar', href: '#entrenar' },
              { label: 'Compartir', href: '#compartir' },
              { label: 'Progreso', href: '#progreso' },
              { label: 'Precios', href: '#precios' },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-4 py-2 text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="#" onClick={handleAuthAction}>
              <Button className="rounded-full px-3.5 sm:px-5 h-9 sm:h-11 text-xs sm:text-sm font-black shadow-[0_18px_40px_rgba(74,222,128,0.22)]">
                {hasSession ? 'Ir al feed' : 'Iniciar sesion'}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div aria-hidden className="h-[52px] sm:h-[68px]" />

      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 sm:pt-10 md:pt-14 pb-16 sm:pb-24 md:pb-28">
        <div className="text-center max-w-5xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" /> Nueva v2.0 · Retos AMRAP y gamificacion
          </span>
          <h1 className="mt-6 sm:mt-8 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-[-0.08em] text-white leading-[0.95]">
            Entrena.
            <span className="block bg-gradient-to-r from-emerald-300 via-sky-300 to-orange-200 bg-clip-text text-transparent">
              Comparte. Evoluciona.
            </span>
          </h1>
          <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl text-white/55 font-semibold max-w-xl sm:max-w-2xl mx-auto px-4 sm:px-0 leading-relaxed">
            Crea workouts profesionales, ejecuta entrenamientos con retos AMRAP, comparte tu progreso y gamifica cada repeticion. Todo en una sola app.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            <Link href="#" onClick={handleFeedAction}>
              <Button size="lg" className="h-12 sm:h-14 rounded-full px-6 sm:px-8 font-black text-sm sm:text-base shadow-[0_20px_50px_-10px_rgba(16,185,129,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_60px_-12px_rgba(16,185,129,0.65)] active:translate-y-0">
                {hasSession ? 'Ir al feed' : 'Probar MyGym gratis'}
                <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link href="#crear">
              <Button
                variant="outline"
                size="lg"
                className="group h-12 sm:h-14 rounded-full px-6 sm:px-8 font-black text-sm sm:text-base border-white/15 bg-white/5 text-white transition-all duration-200 hover:border-white/25 hover:bg-white/[0.08] hover:text-white hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-18px_rgba(255,255,255,0.18)] active:translate-y-0"
              >
                <Play className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5 fill-current transition-transform group-hover:scale-110" />
                Ver demo
              </Button>
            </Link>
          </div>
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-bold text-white/45">
            {['Sin tarjeta', '2,300+ ejercicios', 'Modo reto incluido', 'Comunidad 25k+'].map((t) => (
              <div key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="crear" className="relative z-10 mx-auto max-w-[1500px] sm:max-w-[1700px] px-3 sm:px-5 md:px-7 lg:px-10 pb-20 sm:pb-28 md:pb-36 scroll-mt-16 sm:scroll-mt-[72px] pt-4 sm:pt-6">
        <SectionCard
          eyebrow="01 · Creacion"
          eyebrowIcon={Dumbbell}
          eyebrowColor="border-orange-500/25 bg-orange-500/10 text-orange-300"
          title="Construye tu workout de A a Z"
          hook="Navega un vault de 2,300+ ejercicios filtrados y arma cada bloque (calentamiento, principal, finisher) con el editor visual. Sin cambiar de pantalla, sin salir de tu flujo."
        />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-7">
          <ExerciseVaultMockup />
          <WorkoutCreatorMockup />
        </div>
      </section>

      <section id="entrenar" className="relative z-10 mx-auto max-w-[1500px] sm:max-w-[1700px] px-3 sm:px-5 md:px-7 lg:px-10 pb-20 sm:pb-28 md:pb-36 scroll-mt-16 sm:scroll-mt-[72px] pt-4 sm:pt-6">
        <SectionCard
          eyebrow="02 · Realizacion"
          eyebrowIcon={Play}
          eyebrowColor="border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
          title="Elige como quieres entrenar hoy"
          hook="Workout normal con timer circular y guia de series, o modo reto AMRAP a contrareloj con score y rondas. Los dos modos incluyen cues, descansos y progreso visual en tiempo real."
        />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-7">
          <WorkoutExecutionMockup />
          <WorkoutChallengeExecutionMockup />
        </div>
      </section>

      <section id="compartir" className="relative z-10 mx-auto max-w-[1500px] sm:max-w-[1700px] px-3 sm:px-5 md:px-7 lg:px-10 pb-20 sm:pb-28 md:pb-36 scroll-mt-16 sm:scroll-mt-[72px] pt-4 sm:pt-6">
        <SectionCard
          eyebrow="03 · Tablon de workouts"
          eyebrowIcon={Users}
          eyebrowColor="border-sky-500/25 bg-sky-500/10 text-sky-300"
          title="Descubre, inspirate y conecta con la comunidad"
          hook="Explora el feed publico de workouts, sigue a creadores, da like y guarda tus plantillas favoritas. Un solo lugar para ver que entrena la gente y encontrar tu proxima sesion."
        />
        <div className="grid grid-cols-1 gap-5 sm:gap-7 max-w-4xl xl:max-w-5xl mx-auto">
          <WorkoutFeedMockup />
        </div>
      </section>

      <section id="progreso" className="relative z-10 mx-auto max-w-[1500px] sm:max-w-[1700px] px-3 sm:px-5 md:px-7 lg:px-10 pb-20 sm:pb-28 md:pb-36 scroll-mt-16 sm:scroll-mt-[72px] pt-4 sm:pt-6">
        <SectionCard
          eyebrow="04 · Perfil y progreso"
          eyebrowIcon={Trophy}
          eyebrowColor="border-violet-500/25 bg-violet-500/10 text-violet-300"
          title="Tu evolucion, medida y gamificada"
          hook="Day streak, mapa de calor de 2 meses, atributos RPG, XP progresivo hacia tu siguiente nivel y estadisticas acumuladas. Cada cuenta suma, cada racha cuenta."
        />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-7">
          <ProfileHeaderMockup />
          <ProfileProgressMockup />
        </div>
      </section>

      <section id="precios" className="relative z-10 mx-auto max-w-[1500px] sm:max-w-[1700px] px-3 sm:px-5 md:px-7 lg:px-10 pb-20 sm:pb-28 md:pb-36 scroll-mt-16 sm:scroll-mt-[72px] pt-4 sm:pt-6">
        <SectionCard
          eyebrow="05 · Free y Premium"
          eyebrowIcon={Crown}
          eyebrowColor="border-amber-500/25 bg-amber-500/10 text-amber-300"
          title="Empieza gratis. Sube a Pro cuando quieras."
          hook="Todo lo basico para entrenar 100% gratis. Actualiza a Pro para desbloquear IA, metricas avanzadas, plantillas premium, gamificacion completa y 14 dias de prueba sin riesgo."
        />
        <div className="grid grid-cols-1 gap-5 sm:gap-7 max-w-5xl mx-auto">
          <PricingMockup hasSession={hasSession} onRegister={handleRegisterAction} />
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl sm:max-w-6xl px-4 sm:px-6 lg:px-8 xl:px-10 py-14 sm:py-20 md:py-24">
          <div className="rounded-[32px] sm:rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] p-6 sm:p-8 md:p-12 lg:p-16 text-center overflow-hidden">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/15 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-100 mb-5">
              <Sparkles className="h-3.5 w-3.5" /> Sin compromiso · 14 dias Pro gratis
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-[-0.06em] text-white leading-[1.02] px-2">
              Listo para entrenar de verdad?
            </h2>
            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-white/55 font-semibold max-w-xl mx-auto px-4 sm:px-0 leading-relaxed">
              Crea tu cuenta en 60 segundos y empieza hoy mismo. Cancela cuando quieras, sin preguntas.
            </p>
            <div className="mt-9 sm:mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="#" onClick={handleRegisterAction}>
                <Button size="lg" className="h-14 rounded-full px-10 font-black text-base shadow-[0_20px_50px_rgba(74,222,128,0.28)]">
                  {hasSession ? 'Ir al feed' : 'Empezar gratis'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <footer className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm font-bold text-white/45">
            <p className="text-white/60">© 2026 MyGym · Todos los derechos reservados</p>
            <div className="flex items-center gap-5">
              <a href="#" className="hover:text-white transition">Privacidad</a>
              <a href="#" className="hover:text-white transition">Terminos</a>
              <a href="#" className="hover:text-white transition">Soporte</a>
            </div>
          </div>
        </footer>
      </section>
    </main>
  )
}
