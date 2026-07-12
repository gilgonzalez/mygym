'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/Button'
import { User, LogIn, UserPlus, LogOut, Settings, Flame, Trophy, Timer, Dumbbell, Medal, FileEdit, Crown, Sparkles, Users, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap'
import { useState } from 'react'
import { getUserWorkoutsAction } from '@/app/actions/workout/list'
import { getUserStatsAction } from '@/app/actions/user/getStats'
import SimplifiedWorkoutCard from '@/components/SimplifiedWorkoutCard'
import { PremiumFeatureDialog } from '@/components/premium/PremiumFeatureDialog'
import { PremiumLockedOverlay } from '@/components/premium/PremiumLockedOverlay'
import { formatDurationFromMinutes } from '@/lib/time'

interface UserStats {
    level: number
    current_xp: number
    next_level_xp: number
    streak_current: number
    total_workouts: number
    total_minutes: number
    rank_title: string
    attributes: {
        strength: number
        agility: number
        endurance: number
        wisdom: number
    }
}

import { useQuery } from '@tanstack/react-query'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'public' | 'private' | 'draft'>('all')
  const [showPremiumDialog, setShowPremiumDialog] = useState(false)

  const { data: workouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ['userWorkouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const res = await getUserWorkoutsAction(user.id)
      return res.success && res.data ? res.data : []
    },
    enabled: !!user?.id
  })

  const { data: stats } = useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const res = await getUserStatsAction(user.id)
      
      if (!res.success && res.error) {
        console.error('Error fetching stats:', res.error)
      }

      const data = res.data

      if (data) {
        return {
          level: data.level ?? 1,
          current_xp: data.current_xp ?? 0,
          next_level_xp: data.next_level_xp ?? 1000,
          streak_current: data.streak_current ?? 0,
          total_workouts: data.total_workouts ?? 0,
          total_minutes: data.total_minutes ?? 0,
          rank_title: data.rank_title ?? 'Novice',
          // @ts-ignore
          attributes: data.attributes || {
            strength: 0,
            agility: 0,
            endurance: 0,
            wisdom: 0
          }
        } as UserStats
      }
      
      // Return default stats if not found
      return {
        level: 1,
        current_xp: 0,
        next_level_xp: 1000,
        streak_current: 0,
        total_workouts: 0,
        total_minutes: 0,
        rank_title: 'Novice',
        attributes: {
          strength: 0,
          agility: 0,
          endurance: 0,
          wisdom: 0
        }
      } as UserStats
    },
    enabled: !!user?.id
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    router.push('/auth/login')
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center space-y-6">
        <div className="bg-primary/10 p-6 rounded-full">
          <User className="w-16 h-16 text-primary" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to MyGym</h1>
          <p className="text-muted-foreground">
            Join our community to create workouts, track your progress, and share with others.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Link href="/auth/login" className="w-full">
            <Button className="w-full gap-2" size="lg">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </Link>
          <Link href="/auth/register" className="w-full">
            <Button variant="outline" className="w-full gap-2" size="lg">
              <UserPlus className="w-4 h-4" />
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentStats = stats || {
      level: 1,
      current_xp: 0,
      next_level_xp: 1000,
      streak_current: 0,
      total_workouts: 0,
      total_minutes: 0,
      rank_title: 'Novice',
      attributes: {
          strength: 0,
          agility: 0,
          endurance: 0,
          wisdom: 0
      }
  }

  const xpPercentage = (currentStats.current_xp / currentStats.next_level_xp) * 100
  const totalTimeLabel = formatDurationFromMinutes(currentStats.total_minutes)
  const isPremiumUser = Boolean(user.isPremium)
  const displayName = user.name || 'Gym Enthusiast'
  const roleLabel = user.role.charAt(0) + user.role.slice(1).toLowerCase()
  const profileStatsCards = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
      <div className="group relative overflow-hidden rounded-[26px] border border-orange-500/15 bg-gradient-to-br from-card via-card to-orange-500/[0.07] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
        <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-orange-500/12 blur-2xl transition-transform duration-500 group-hover:scale-125" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/12 text-orange-500 ring-1 ring-orange-500/20">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black tracking-tight text-foreground">{currentStats.streak_current}</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Day Streak</p>
          </div>
        </div>
      </div>

      <div className="group relative overflow-hidden rounded-[26px] border border-sky-500/15 bg-gradient-to-br from-card via-card to-sky-500/[0.07] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
        <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-sky-500/12 blur-2xl transition-transform duration-500 group-hover:scale-125" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/12 text-sky-500 ring-1 ring-sky-500/20">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black tracking-tight text-foreground">{currentStats.total_workouts}</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Workouts</p>
          </div>
        </div>
      </div>

      <div className="group relative overflow-hidden rounded-[26px] border border-emerald-500/15 bg-gradient-to-br from-card via-card to-emerald-500/[0.07] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.16)] sm:col-span-3 lg:col-span-1">
        <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-emerald-500/12 blur-2xl transition-transform duration-500 group-hover:scale-125" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-500 ring-1 ring-emerald-500/20">
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-black tracking-tight text-foreground">{totalTimeLabel}</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Total Time</p>
          </div>
        </div>
      </div>
    </div>
  )

  const filteredWorkouts = workouts.filter(w => {
    if (filter === 'all') return true
    return w.visibility === filter
  })

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-12 pt-5">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.24)] sm:p-6">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.02)_35%,transparent_70%)]" />
        <div className="relative mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">
                Perfil
              </span>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${
                isPremiumUser
                  ? 'border border-emerald-500/25 bg-emerald-500/12 text-emerald-300'
                  : 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
              }`}>
                {isPremiumUser ? 'Premium activo' : 'Plan free'}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Tu espacio de progreso
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Gestiona tu identidad, revisa tu evolucion y accede a tus workouts desde una vista mas clara y mas premium.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="sm" className="gap-2 border-white/10 bg-white/[0.03] hover:bg-white/[0.06]">
              <Settings className="h-4 w-4" />
              Edit Profile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]">
          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start">
              <div className="flex flex-col items-center gap-4 text-center xl:items-start xl:text-left">
                <div className="relative">
                  <div className="h-28 w-28 overflow-hidden rounded-[28px] border border-white/10 bg-muted shadow-[0_18px_34px_rgba(0,0,0,0.28)] ring-2 ring-primary/20">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name || 'User avatar'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/10">
                        <User className="h-12 w-12 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500 px-3 py-1 text-xs font-black text-emerald-950 shadow-lg xl:left-auto xl:right-0 xl:translate-x-0">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Lvl {currentStats.level}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 xl:justify-start">
                  <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-500">
                    <Medal className="h-3.5 w-3.5" />
                    {currentStats.rank_title}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                    <Crown className="h-3.5 w-3.5" />
                    {roleLabel}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-5">
                <div className="space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-3xl font-black tracking-tight text-foreground">{displayName}</h2>
                      <p className="text-base text-muted-foreground">@{user.username || 'username'}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-indigo-500/15 bg-indigo-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      XP Boost x 1.5
                    </div>
                  </div>

                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {user.bio || 'Crea rutinas, sigue tu progreso y construye tu identidad fitness dentro de MyGym.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">XP actual</p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-foreground">
                      {currentStats.current_xp}
                      <span className="ml-1 text-sm font-semibold text-muted-foreground">/ {currentStats.next_level_xp}</span>
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Seguidores</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-foreground">
                      <Users className="h-5 w-5 text-primary" />
                      12
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Siguiendo</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-foreground">
                      <UserPlus className="h-5 w-5 text-primary" />
                      8
                    </p>
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-slate-950/30 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.22em] text-white/45">
                    <span>Progression</span>
                    <span className="text-foreground">{currentStats.current_xp} / {currentStats.next_level_xp} XP</span>
                  </div>
                  <Progress value={xpPercentage} className="h-3 bg-white/10" />
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      Nivel {currentStats.level}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {isPremiumUser ? 'Acceso premium activo' : 'Funciones premium bloqueadas'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isPremiumUser ? (
            profileStatsCards
          ) : (
            <PremiumLockedOverlay
              className="rounded-[30px]"
              onUnlockClick={() => setShowPremiumDialog(true)}
              title="Stats premium"
              description="Desbloquea tus metricas avanzadas y una lectura mas completa de tu rendimiento."
            >
              {profileStatsCards}
            </PremiumLockedOverlay>
          )}
        </div>
      </div>

      {/* 2. ACTIVITY HEATMAP (MONTHLY + RPG DETAILS) */}
      {isPremiumUser ? (
        <ActivityHeatmap 
          userId={user.id} 
          attributes={stats?.attributes} 
        />
      ) : (
        <PremiumLockedOverlay
          className="rounded-[28px]"
          onUnlockClick={() => setShowPremiumDialog(true)}
          title="Actividad premium"
          description="Desbloquea el mapa de actividad, la vista mensual y tus atributos de progreso."
        >
          <ActivityHeatmap 
            userId={user.id} 
            attributes={stats?.attributes} 
          />
        </PremiumLockedOverlay>
      )}

      {/* 2. WORKOUTS FEED */}
      <div className="space-y-6 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">
                Biblioteca
              </span>
            </div>
            <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight text-foreground">
              <Dumbbell className="h-5 w-5 text-primary" />
              Tus workouts
            </h2>
            <p className="text-sm text-muted-foreground">
              Filtra, revisa y gestiona tus entrenamientos desde un panel mas compacto y ordenado.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex w-fit items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
              {(['all', 'public', 'private', 'draft'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-all ${
                    filter === f
                      ? 'bg-white text-slate-950 shadow-lg'
                      : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <Link href="/editor/workout/create">
              <Button size="sm" className="gap-2 rounded-xl px-4">
                <FileEdit className="h-4 w-4" />
                Create New
              </Button>
            </Link>
          </div>
        </div>

        {workoutsLoading ? (
             <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 rounded-[28px] border border-white/10 bg-white/[0.04] animate-pulse" />
                ))}
             </div>
        ) : filteredWorkouts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {filteredWorkouts.map(workout => (
                <div key={workout.id} className="relative group">
                  <SimplifiedWorkoutCard workout={workout} />
                </div>
              ))}
            </div>
        ) : (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] py-14 text-center">
                <Dumbbell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">No workouts found</h3>
                <p className="mb-4 text-sm text-muted-foreground">You haven't created any workouts yet.</p>
                <Link href="/editor/workout/create">
                    <Button variant="outline" size="sm" className="rounded-xl">Create your first workout</Button>
                </Link>
            </div>
        )}
      </div>

      <PremiumFeatureDialog
        open={showPremiumDialog}
        onOpenChange={setShowPremiumDialog}
        description="Esta seccion del perfil esta disponible solo para usuarios premium. Actualiza tu plan para desbloquear actividad avanzada y estadisticas."
      />
    </div>
  )
}
