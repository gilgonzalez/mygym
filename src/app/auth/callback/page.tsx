'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/Button'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase client automatically handles the session exchange from URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) throw sessionError
        
        if (!session) {
           setError("No session found. Please try logging in again.")
           return
        }

        // Check if user profile exists in public table
        // Since a trigger creates the user, we should wait/retry if it's not found immediately
        let existingUser = null
        let retries = 3
        
        while (retries > 0 && !existingUser) {
           const { data, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
            
           if (data) {
             existingUser = data
             break
           }
           
           if (fetchError && fetchError.code !== 'PGRST116') {
             console.error("Error fetching user:", fetchError)
           }
           
           // Wait 1s before retrying to allow trigger to complete
           await new Promise(resolve => setTimeout(resolve, 1000))
           retries--
        }
        
        if (existingUser) {
            setUser(existingUser)
        } else {
            // Even if we can't fetch the profile immediately, the auth session is valid.
            // We can let the user proceed, and the profile might load later or on next refresh.
            // Alternatively, we could show a "Setting up profile..." state longer.
            // For now, let's proceed but warn.
             console.warn("User profile not found after retries. Trigger might be slow.")
             // Construct a temporary user object from session metadata to not block the user
             const tempUser = {
                id: session.user.id,
                email: session.user.email!,
                username: session.user.user_metadata.name?.split(' ').join('').toLowerCase() || session.user.email?.split('@')[0] || 'user',
                name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
                avatar_url: session.user.user_metadata.avatar_url,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
            setUser(tempUser as any)
        }
        
        router.push('/')
        router.refresh()

      } catch (err: any) {
        console.error('Auth callback error:', err)
        setError(err.message || "An error occurred during authentication")
      }
    }

    handleAuthCallback()
  }, [router, setUser])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <div className="text-center space-y-4 bg-white dark:bg-slate-900 p-8 rounded-lg shadow-lg max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold">Authentication Failed</h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Button onClick={() => router.push('/auth/login')} className="w-full">
            Return to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Setting up your profile...</p>
      </div>
    </div>
  )
}