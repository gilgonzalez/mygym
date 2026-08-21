'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { getPasswordLengthError, isPasswordValid, MIN_PASSWORD_LENGTH } from '@mygym/shared'

// Paso 2 del flujo: acá cae el link de recuperación (?code=...). El cliente
// browser de Supabase (@supabase/ssr, flowType pkce) intercambia ese code
// por una sesión automáticamente al cargar la página, así que solo hace
// falta confirmar con getSession() antes de dejar definir la contraseña
// nueva con updateUser. Misma pantalla sirve para "primera contraseña" de
// una cuenta creada con Google que para un reset normal.
function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [checkingSession, setCheckingSession] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const errorDescription = searchParams?.get('error_description')
      if (errorDescription) {
        setSessionError(errorDescription)
        setCheckingSession(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setSessionError('Este link no es válido o venció. Pedí uno nuevo.')
      }

      setCheckingSession(false)
    }

    checkSession()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isPasswordValid(password)) {
      setError(getPasswordLengthError())
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="max-w-md w-full space-y-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-gray-600 dark:text-gray-400">{sessionError}</p>
        <Button className="w-full h-11" onClick={() => router.push('/auth/forgot-password')}>
          Pedir un link nuevo
        </Button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="max-w-md w-full space-y-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
        <p className="text-gray-600 dark:text-gray-400">Contraseña actualizada. Ya podés usarla para entrar.</p>
        <Button className="w-full h-11" onClick={() => router.push('/feed')}>
          Ir a la app
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Elige tu nueva contraseña</h2>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nueva contraseña
          </label>
          <Input
            id="password"
            type="password"
            required
            className="mt-1"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            minLength={MIN_PASSWORD_LENGTH}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Repetir contraseña
          </label>
          <Input
            id="confirmPassword"
            type="password"
            required
            className="mt-1"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            minLength={MIN_PASSWORD_LENGTH}
          />
        </div>

        <Button type="submit" className="w-full h-11 gap-2" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar contraseña
        </Button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
