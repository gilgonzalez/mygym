

'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/Button'
import { User, LogIn, UserPlus, LogOut, Settings, Flame, Trophy, Timer, Dumbbell, Medal, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap'

// --- MOCK DATA ---
const MOCK_STATS = {
  level: 5,
  currentXp: 750,
  nextLevelXp: 1000,
  streak: 12,
  totalWorkouts: 48,
  totalHours: 32.5,
  rank: "Gym Warrior"
}

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

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

  const xpPercentage = (MOCK_STATS.currentXp / MOCK_STATS.nextLevelXp) * 100

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
              <span>Lvl {MOCK_STATS.level}</span>
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
                    {MOCK_STATS.rank}
                 </div>
              </div>
              <p className="text-muted-foreground">@{user.username || 'username'}</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-end text-xs font-medium">
                
                    <span className="text-muted-foreground">
                        <span className="text-foreground font-bold">{MOCK_STATS.currentXp}</span> 
                        <span className="mx-1">/</span> 
                        {MOCK_STATS.nextLevelXp} XP
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
                    <p className="text-2xl font-bold">{MOCK_STATS.streak}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Day Streak</p>
                </div>
            </div>
            
            <div className="bg-card rounded-xl p-4 shadow-sm border flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/30">
                    <Trophy className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{MOCK_STATS.totalWorkouts}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Workouts</p>
                </div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-card rounded-xl p-4 shadow-sm border flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-full dark:bg-green-900/30">
                    <Timer className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{MOCK_STATS.totalHours}h</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Time</p>
                </div>
            </div>
        </div>
      </div>

      {/* 2. ACTIVITY HEATMAP (MONTHLY + RPG DETAILS) */}
      <ActivityHeatmap />

      {/* 3. CONTENT TABS (Workouts, etc) */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            My Workouts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-lg p-8 text-center text-muted-foreground bg-muted/30 border-dashed">
                <p>No workouts created yet.</p>
                <Link href="/editor/workout/create" className="text-primary hover:underline mt-2 inline-block">
                    Create your first workout
                </Link>
            </div>
        </div>
      </div>
    </div>
  )
}

