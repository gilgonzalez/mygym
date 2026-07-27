import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/user'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setIsLoading: (loading: boolean) => void
  logout: () => void
  initialize: () => Promise<() => void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      logout: () => {
        set({ user: null, isAuthenticated: false })
        supabase.auth.signOut()
      },
      initialize: async () => {
        const withTimeout = async <T>(promise: PromiseLike<T>, label: string, timeoutMs = 10000): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
              setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs)
            ),
          ])
        }

        try {
          // Primero intentamos recuperar la sesión del almacenamiento local
          const sessionResponse: Awaited<ReturnType<typeof supabase.auth.getSession>> = await withTimeout(
            supabase.auth.getSession(),
            'Supabase getSession'
          )
          const { data: { session } } = sessionResponse
          
          if (session?.user) {
            // Si hay sesión local, intentamos refrescarla para asegurar que las cookies estén sincronizadas
            // Esto es crucial para que las Server Actions funcionen si las cookies se borraron
            const refreshResponse: Awaited<ReturnType<typeof supabase.auth.refreshSession>> = await withTimeout(
              supabase.auth.refreshSession(),
              'Supabase refreshSession'
            )
            const { data: { session: refreshedSession }, error: refreshError } = refreshResponse
            
            if (refreshError) {
               console.warn('Error refreshing session:', refreshError)
               // Si falla el refresh (token inválido), hacemos logout
               set({ user: null, isAuthenticated: false })
               await supabase.auth.signOut()
               // Return a dummy cleanup function to satisfy the type
               return () => {}
            }

            const activeSession = refreshedSession || session
            if (activeSession?.user) {
                const userResponse = await withTimeout(
                  supabase
                    .from('users')
                    .select('*')
                    .eq('id', activeSession.user.id)
                    .single() as PromiseLike<{ data: User | null }>,
                  'Load authenticated user'
                )
                const { data: userData } = userResponse
                
                if (userData) {
                  set({ user: userData, isAuthenticated: true })
                }
            }
          } else {
            set({ user: null, isAuthenticated: false })
          }
        } catch (error) {
          console.error('Error checking user:', error)
          set({ user: null, isAuthenticated: false })
        } finally {
          set({ isLoading: false })
        }

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (userData) {
              set({ user: userData, isAuthenticated: true })
            }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, isAuthenticated: false })
          }
        })

        return () => authListener.subscription.unsubscribe()
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
