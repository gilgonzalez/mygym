'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Supabase client automatically handles the session exchange from URL
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // Check if user profile exists in public table
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
        
        if (user) {
            setUser(user)
        } else {
            // Optional: Create user profile if it doesn't exist (First time Google Login)
            // You might want to move this to a database trigger or handle it here
            try {
                const newUser = {
                    id: session.user.id,
                    email: session.user.email,
                    username: session.user.user_metadata.name?.split(' ').join('').toLowerCase() || session.user.email?.split('@')[0],
                    name: session.user.user_metadata.name || session.user.email?.split('@')[0],
                    avatar_url: session.user.user_metadata.avatar_url
                }
                
                const { error: insertError } = await supabase.from('users').insert([newUser])
                if (!insertError) {
                    setUser(newUser as any)
                }
            } catch (e) {
                console.error('Error creating user profile', e)
            }
        }
        
        router.push('/')
        router.refresh()
      } else {
        // Fallback listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
             router.push('/')
             router.refresh()
          }
        })
        return () => subscription.unsubscribe()
      }
    }

    handleAuthCallback()
  }, [router, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  )
}