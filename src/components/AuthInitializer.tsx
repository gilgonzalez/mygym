'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'

export function AuthInitializer() {
  const initialize = useAuthStore((state) => state.initialize)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      const cleanupPromise = initialize()
      return () => {
        cleanupPromise.then(cleanup => cleanup && cleanup())
      }
    }
  }, [initialize])

  return null
}