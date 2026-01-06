'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/Button'
import { User, LogIn, UserPlus, LogOut, Settings, Flame, Trophy, Timer, Dumbbell, Medal, Zap, FileEdit } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap'
import { useState } from 'react'
import { getUserWorkoutsAction } from '@/app/actions/workout/list'
import { getUserStatsAction } from '@/app/actions/user/getStats'
import SimplifiedWorkoutCard from '@/components/SimplifiedWorkoutCard'

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

  const { data: workouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ['userWorkouts', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const res = await getUserWorkoutsAction(user.id)
      return res.success && res.data ? res.data : []
    },
    enabled: !!user?.id
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
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
  const totalHours = (currentStats.total_minutes / 60).toFixed(1)

  const filteredWorkouts = workouts.filter(w => {
    if (filter === 'all') return true
    return w.visibility === filter
  })

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      {/* 1. RPG HEADER & STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile Card */}
        <div className="md:col-span-2 bg-card rounded-xl p-6 shadow-sm border flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-background shadow-sm ring-2 ring-primary/20">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.name || 'User avatar'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-md border-2 border-background flex items-center gap-1">
              <span>Lvl {currentStats.level}</span>
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-3 w-full z-10">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                 <h1 className="text-2xl font-bold">
                    {user.name || 'Gym Enthusiast'}
                 </h1>
                 {/* NEW BADGE DESIGN */}
                 <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 border border-yellow-400/50">
                    <Medal className="w-3 h-3 fill-yellow-200 text-yellow-100" />
                    {currentStats.rank_title}
                 </div>
              </div>
              <p className="text-muted-foreground">@{user.username || 'username'}</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-end text-xs font-medium">
                
                    <span className="text-muted-foreground">
                        <span className="text-foreground font-bold">{currentStats.current_xp}</span> 
                        <span className="mx-1">/</span> 
                        {currentStats.next_level_xp} XP
                    </span>
                <div className="flex items-center justify-end flex-1 gap-2">
                    <div className="bg-indigo-500 text-white gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shadow-sm flex items-center">
                        <Zap className="w-3 h-3 fill-indigo-200" />
                        x 1.5
                    </div>
                </div>
              </div>
              <Progress value={xpPercentage} className="h-3 bg-secondary/50" />
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground pt-1">
               <div className="flex items-center gap-1">
                  <UserPlus className="w-4 h-4" /> 12 Followers
               </div>
               <div className="flex items-center gap-1">
                  <User className="w-4 h-4" /> 8 Following
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto self-start z-10">
            <Button variant="outline" size="sm" className="gap-2 w-full">
              <Settings className="w-4 h-4" />
              Edit Profile
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 w-full justify-start md:justify-center" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Grid - Right Column */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            <div className="bg-card rounded-xl p-4 shadow-sm border flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-full dark:bg-orange-900/30">
                    <Flame className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{currentStats.streak_current}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Day Streak</p>
                </div>
            </div>
            
            <div className="bg-card rounded-xl p-4 shadow-sm border flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/30">
                    <Trophy className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{currentStats.total_workouts}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Workouts</p>
                </div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-card rounded-xl p-4 shadow-sm border flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-full dark:bg-green-900/30">
                    <Timer className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{totalHours}h</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Time</p>
                </div>
            </div>
        </div>
      </div>

      {/* 2. ACTIVITY HEATMAP (MONTHLY + RPG DETAILS) */}
      <ActivityHeatmap 
        userId={user.id} 
        attributes={stats?.attributes} 
      />

      {/* 2. WORKOUTS FEED */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            Your Workouts
          </h2>
          <Link href="/editor/workout/create">
            <Button size="sm" className="gap-2">
              <FileEdit className="w-4 h-4" />
              Create New
            </Button>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
            {([ 'all', 'public', 'private', 'draft'] as const).map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                        filter === f 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>

        {workoutsLoading ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 bg-card rounded-xl animate-pulse" />
                ))}
             </div>
        ) : filteredWorkouts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredWorkouts.map(workout => (
                <div key={workout.id} className="relative group">
                  <SimplifiedWorkoutCard workout={workout} />
                </div>
              ))}
            </div>
        ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="font-semibold text-lg" >No workouts found</h3>
                <p className="text-muted-foreground text-sm mb-4">You haven't created any workouts yet.</p>
                <Link href="/editor/workout/create">
                    <Button variant="outline" size="sm">Create your first workout</Button>
                </Link>
            </div>
        )}
      </div>
    </div>
  )
}