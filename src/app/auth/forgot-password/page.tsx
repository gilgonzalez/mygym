'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

// Paso 1 del flujo "olvidé mi contraseña" (ver también apps/mobile para el
// equivalente en la app). Sirve tanto para resetear una contraseña existente
// como para que alguien que se registró con Google configure una contraseña
// por primera vez: resetPasswordForEmail no distingue entre ambos casos.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setSent(true)
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el mail de recuperación')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Recuperar contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Te mandamos un link para crear o restablecer tu contraseña, aunque hoy entres solo con Google.
          </p>
        </div>

        {sent ? (
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Si {email} está registrado, revisá tu bandeja de entrada (o spam) para continuar.
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Correo electrónico
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full h-11 gap-2" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar link
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
