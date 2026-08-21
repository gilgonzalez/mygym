'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

// Antes duplicado byte a byte en AppLayoutClient.tsx y profile/page.tsx.
// signOut() puede rechazar (sesión ya vencida, error de red, etc.) — si eso
// pasa sin try/catch, el estado nunca se limpia ni se redirige y la UI queda
// "logueada" hasta refrescar. Limpiamos y navegamos siempre, haya pasado lo
// que haya pasado con la llamada a Supabase.
export function useLogout() {
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)

  return async () => {
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
}
