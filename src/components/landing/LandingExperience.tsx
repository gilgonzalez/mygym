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

function ModePreview({ mode }: { mode: ModeKey }) {
  if (mode === 'create') {
    return (
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
              { section: 'Primer', detail: '2 ejercicios · activacion', tint: 'bg-emerald-400/12 text-emerald-200' },
              { section: 'Main block', detail: '4 ejercicios · volumen', tint: 'bg-cyan-400/12 text-cyan-200' },
              { section: 'Finisher', detail: '2 ejercicios · tempo', tint: 'bg-lime-400/12 text-lime-200' },
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
                  "Creame una rutina de pierna potente, 45 minutos, con enfoque gluteo y quad."
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
    )
  }

  if (mode === 'discover') {
    return (
      <div className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#08101b]/90 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Creator orbit</p>
          <div className="mt-4 space-y-3">
            {socialPulse.map((creator, index) => (
              <div
                key={creator.handle}
                className="group flex items-center justify-between rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3 transition-transform duration-300 hover:-translate-y-0.5"
                style={{ animationDelay: `${index * 120}ms` }}
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
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[28px] border border-white/10 bg-[#08101a]/90 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Session view</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Execution workout</h3>
          </div>
          <div className="rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-200">
            active
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
            <div className="absolute inset-4 rounded-full border border-orange-300/25" />
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.22),transparent_60%)]" />
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">timed block</p>
              <p className="mt-3 text-5xl font-black tracking-[-0.06em] text-white">00:45</p>
              <p className="mt-2 text-sm text-white/60">Jump squat</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[28px] border border-white/10 bg-[#06101a]/90 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Serie', value: '3 / 5' },
              { label: 'Tutorial', value: 'Premium' },
              { label: 'XP', value: '+120' },
            ].map((item) => (
              <div key={item.label} className="rounded-[22px] border border-white/8 bg-white/[0.04] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-orange-300/15 bg-orange-400/10 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-300/15 text-orange-100">
              <TimerReset className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Hecha para entrenar, no solo para mirar</p>
              <p className="mt-1 text-sm leading-6 text-white/62">
                La sesion entra en modo foco: progreso, descanso, tutoriales y ritmo de trabajo.
              </p>
            </div>
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

                <ModePreview mode={activeMode} />

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
          <div className="grid gap-5 lg:grid-cols-[0.84fr_1.16fr]">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">por que se siente distinta</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
                Porque une producto y comunidad en la misma superficie.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/60 sm:text-base">
                En MyGym no creas una rutina para que se quede escondida. La puedes compartir, descubrir,
                seguir, ejecutar y volver a mejorar. Esa continuidad es el valor real de la app.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Dumbbell,
                  title: 'Creacion de rutinas',
                  body: 'Editor con bloques, series, ejercicios y ayuda premium con IA.',
                },
                {
                  icon: Sparkles,
                  title: 'Banco de 2300+ ejercicios',
                  body: 'Catalogo amplio para montar sesiones con variedad real.',
                },
                {
                  icon: Share2,
                  title: 'Compartir y seguir',
                  body: 'Publica workouts, sigue perfiles y convierte el entrenamiento en red.',
                },
                {
                  icon: PlayCircle,
                  title: 'Realizar las rutinas',
                  body: 'Modo sesion con foco movil, progreso, descanso y ritmo.',
                },
                {
                  icon: Users,
                  title: 'Creadores favoritos',
                  body: 'Mantente cerca de quienes programan entrenamientos que te encajan.',
                },
                {
                  icon: Crown,
                  title: 'Capa premium',
                  body: 'IA, tutoriales y guardado de progreso para usuarios avanzados.',
                },
              ].map((item) => {
                const Icon = item.icon

                return (
                  <article
                    key={item.title}
                    className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.07]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-emerald-300 transition-transform duration-300 group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/58">{item.body}</p>
                  </article>
                )
              })}
            </div>
          </div>
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
