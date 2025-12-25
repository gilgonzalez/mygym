

'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/Button'
import { User, LogIn, UserPlus, LogOut, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* Profile Header */}
      <div className="bg-card rounded-xl p-6 shadow-sm border flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-background shadow-sm">
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
        
        <div className="flex-1 text-center md:text-left space-y-2">
          <h1 className="text-2xl font-bold">{user.name || 'Gym Enthusiast'}</h1>
          <p className="text-muted-foreground">@{user.username || 'username'}</p>
          <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
            <div className="text-sm">
              <span className="font-bold">0</span> <span className="text-muted-foreground">Workouts</span>
            </div>
            <div className="text-sm">
              <span className="font-bold">0</span> <span className="text-muted-foreground">Followers</span>
            </div>
            <div className="text-sm">
              <span className="font-bold">0</span> <span className="text-muted-foreground">Following</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            Edit Profile
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Content Tabs/Area - Placeholder for now as requested primarily for user info */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Workouts</h2>
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

