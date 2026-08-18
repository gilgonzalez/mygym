'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Home, User, LogOut, PlusSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { ModeToggle } from '@/components/ModeSwitcher'

export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    // signOut() puede rechazar (sesión ya vencida, error de red, etc.). Si
    // pasa eso sin try/catch, el estado nunca se limpia ni se redirige y la
    // UI queda "logueada" hasta refrescar. Limpiamos y navegamos siempre,
    // haya pasado lo que haya pasado con la llamada a Supabase.
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    } finally {
      logout()
      router.push('/auth/login')
      router.refresh()
    }
  }

  const isActive = (path: string) => pathname === path

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background pb-16 md:pb-0">
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-8">
          <div className="flex min-h-14 sm:min-h-16 items-center justify-between gap-2 sm:gap-3 py-2">
            <div className="flex min-w-0 shrink-0 items-center">
              <Link href="/feed" className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-90">
                <img
                  src="/logo.png"
                  alt="MyGym"
                  className="h-8 sm:h-9 w-auto shrink-0 object-contain rounded-xl"
                />
              </Link>
            </div>

            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
              {user && (
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <Link href="/editor/workout/create" className="contents">
                    <Button size="sm" className="hidden sm:flex shrink-0 gap-2 shadow-sm">
                      <PlusSquare className="h-4 w-4 shrink-0" />
                      Crear Workout
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 sm:hidden">
                      <PlusSquare className="h-5 w-5 shrink-0" />
                    </Button>
                  </Link>
                </div>
              )}

              <div className="hidden h-6 w-px shrink-0 bg-border/60 sm:block" />

              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <Link href="/profile" className="contents">
                  <Button variant="ghost" size="icon" className={`h-9 w-9 shrink-0 ${isActive('/profile') ? 'text-primary' : ''}`}>
                    <User className="h-5 w-5 shrink-0" />
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                </Button>
              </div>

              <div className="hidden h-6 w-px shrink-0 bg-border/60 sm:block" />

              <div className="flex shrink-0 items-center">
                <ModeToggle />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background p-2 grid grid-cols-2 gap-1 z-50 pb-safe">
        <Link
          href="/feed"
          className={`flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium ${
            isActive('/feed')
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
          Perfil
        </Link>
      </div>
    </div>
  )
}
