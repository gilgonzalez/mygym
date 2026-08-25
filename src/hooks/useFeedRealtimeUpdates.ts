import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FeedFilter, FeedSort } from '@/app/actions/workout/list'
import type { Database } from '@/types/database'

type DbWorkoutRow = Database['public']['Tables']['workouts']['Row']

interface UseFeedRealtimeUpdatesParams {
  newestCreatedAt: string | null
  filter: FeedFilter
  sortBy: FeedSort
  viewerId: string | null
  followingIds: string[]
  debouncedSearch: string
}

// Extraído de feed/page.tsx — se suscribe a INSERTs en `workouts` y cuenta
// cuántos matchean los filtros activos (visibilidad, "following", búsqueda)
// sin refetchear la lista entera; el feed solo muestra el conteo como un
// aviso ("N nuevos") y el usuario decide cuándo refrescar.
export function useFeedRealtimeUpdates({
  newestCreatedAt,
  filter,
  sortBy,
  viewerId,
  followingIds,
  debouncedSearch,
}: UseFeedRealtimeUpdatesParams): { newCount: number; resetCount: () => void } {
  const [newCount, setNewCount] = useState(0)

  useEffect(() => {
    setNewCount(0)
  }, [debouncedSearch, filter, sortBy])

  useEffect(() => {
    const channelName = 'feed-workouts-inserts'
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    })

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workouts',
        },
        (payload: any) => {
          const row = payload.new as (DbWorkoutRow & { cover?: string | null; estimated_time?: number | null }) | null | undefined
          if (!row) return

          // Un workout recién insertado nunca puede estar ya en tus favoritos
          // (todavía no tuviste tiempo de likearlo) — el aviso de "N nuevos"
          // no aplica a este filtro.
          if (filter === 'favorites') return

          if (row.visibility !== 'public' && row.visibility !== 'followers') return
          if (!row.created_at) return
          if (newestCreatedAt && new Date(row.created_at).getTime() <= new Date(newestCreatedAt).getTime()) return

          if (filter === 'following') {
            const allowed = viewerId ? [...followingIds, viewerId] : [...followingIds]
            if (!row.user_id || !allowed.includes(row.user_id)) return
          }

          const needle = debouncedSearch.trim().toLowerCase()
          if (needle) {
            const haystack = [
              row.title ?? '',
              row.description ?? '',
              ...(Array.isArray(row.tags) ? (row.tags as string[]) : []),
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
            if (!haystack.includes(needle)) return
          }

          setNewCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [newestCreatedAt, filter, viewerId, followingIds, debouncedSearch])

  return { newCount, resetCount: () => setNewCount(0) }
}
