'use client'

import { useEffect, useRef } from 'react'

// Keeps the screen awake for as long as `active` is true. Desktop browsers don't suspend a
// foreground tab, but mobile ones dim/lock the display after a short idle period — losing
// that mid-workout would drop the session's elapsed-time clock and the current exercise off
// screen. No-ops where the Wake Lock API isn't supported; the workout still works, it just
// risks the screen turning off like it would have before.
export function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active) return
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return

    let cancelled = false

    const requestWakeLock = async () => {
      try {
        const sentinel = await navigator.wakeLock.request('screen')

        if (cancelled) {
          void sentinel.release()
          return
        }

        wakeLockRef.current = sentinel
      } catch {
        // Can be refused (low battery saver, no user gesture yet, etc.) — fail silently,
        // the session keeps working without the wake lock.
      }
    }

    void requestWakeLock()

    // Mobile browsers auto-release the lock whenever the tab is backgrounded (app switch,
    // power-button screen lock…) and never re-acquire it on their own — reclaim it as soon
    // as the tab is visible again so coming back to the workout keeps the screen awake.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        void requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void wakeLockRef.current?.release()
      wakeLockRef.current = null
    }
  }, [active])
}
