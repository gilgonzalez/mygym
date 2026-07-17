'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Home, User, LogOut, Dumbbell, PlusSquare } from 'lucide-react'
import { Button } from '@/components/Button'

import { ModeToggle } from '@/components/ModeSwitcher'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    router.push('/auth/login')
  }

  const isActive = (path: string) => pathname === path

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background pb-16 md:pb-0">
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 items-center justify-between gap-3 py-2">
            {/* Left: Logo (Home) */}
            <div className="flex min-w-0 items-center">
              <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <Dumbbell className="h-7 w-7 shrink-0 text-primary sm:h-8 sm:w-8" />
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent hidden sm:block">
                  MyGym
                </span>
              </Link>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="sm:hidden">
                <ModeToggle />
              </div>

              {/* Create Workout Action */}
              {user && (
                <Link href="/editor/workout/create">
                  <Button size="sm" className="hidden sm:flex gap-2 shadow-sm">
                    <PlusSquare className="h-4 w-4" />
                    Create Workout
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 sm:hidden">
                      <PlusSquare className="h-5 w-5" />
                  </Button>
                </Link>
              )}

              {/* Divider */}
              <div className="hidden h-6 w-px bg-border/50 sm:block" />

              {/* User Utilities Group */}
              <div className="flex items-center gap-1 sm:gap-2">
                <Link href="/profile">
                  <Button variant="ghost" size="icon" className={`h-9 w-9 ${isActive('/profile') ? 'text-primary' : ''}`}>
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout}
                  title="Sign out"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>

            </div>
          </div>
        </div>
        <div className="absolute right-4 top-0 hidden h-full items-center sm:flex">
            <ModeToggle />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>
      
      {/* Mobile Navigation Bar (Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background p-2 grid grid-cols-2 gap-1 z-50 pb-safe">
        <Link
            href="/"
            className={`flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium ${
            isActive('/') 
                ? 'text-primary' 
                : 'text-muted-foreground'
            }`}
        >
            <Home className="h-5 w-5 mb-1" />
            Feed
        </Link>
        <Link
            href="/profile"
            className={`flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium ${
            isActive('/profile') 
                ? 'text-primary' 
                : 'text-muted-foreground'
            }`}
        >
            <User className="h-5 w-5 mb-1" />
            Profile
        </Link>
      </div>
    </div>
  )
}
