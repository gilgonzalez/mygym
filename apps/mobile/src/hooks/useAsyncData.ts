import { useCallback, useEffect, useState } from 'react'

// Antes este mismo boilerplate (loading/error + .then/.catch/.finally +
// useEffect que dispara el load) estaba escrito a mano en cada pantalla que
// hace un solo fetch al montar/cambiar de dependencia — ver p.ej.
// app/workout/[id].tsx y profile/WorkoutsTab.tsx. No sirve para los casos
// con paginación (esos necesitan su propio manejo de página/hasMore/
// race-guard, ver p.ej. app/(tabs)/index.tsx) ni para pantallas que
// hidratan varios campos de un form desde el resultado (esas necesitan más
// que un solo `data`, ver app/edit-profile.tsx).
export function useAsyncData<T>(
  // Devolver null/undefined en vez de una promesa salta el fetch por
  // completo (se queda en loading) — mismo criterio que el "if (!id) return"
  // que tenían las pantallas antes de esto, para pantallas cuyo fetch
  // depende de un param que puede no estar listo todavía.
  fetchFn: () => Promise<T> | null | undefined,
  deps: unknown[],
  errorFallback = 'Ocurrió un error inesperado'
): { data: T | null; loading: boolean; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    const promise = fetchFn()
    if (!promise) return

    setLoading(true)
    setError(null)
    promise
      .then(setData)
      .catch((err: any) => setError(err?.message ?? errorFallback))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}
