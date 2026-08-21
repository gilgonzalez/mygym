'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { deleteWorkoutAction } from '@/app/actions/workout/delete'
import { toggleWorkoutLikeAction } from '@/app/actions/workout/likes'
import { WorkoutLikerPreview } from '@/types/workout/composite'

export interface UseWorkoutCardActionsOptions {
  workoutId: string
  userId?: string | null
  initialLikesCount?: number
  initialIsLiked?: boolean
  initialLikesPreview?: WorkoutLikerPreview[]
  redirectToLogin?: boolean
}

export interface UseWorkoutCardActionsResult {
  likesCount: number
  isLiked: boolean
  likesPreview: WorkoutLikerPreview[]
  isLiking: boolean
  isDeleting: boolean
  showMenu: boolean
  setShowMenu: (v: boolean) => void
  menuRef: React.RefObject<HTMLDivElement>
  handleLike: (e?: React.MouseEvent) => Promise<void>
  // Antes hacía window.confirm() + la operación en un solo paso — ahora solo
  // pide confirmación (abre el diálogo, ver ConfirmDialog); confirmDelete es
  // quien de verdad borra, para poder mostrar un diálogo real en vez de uno
  // nativo del browser.
  showDeleteConfirm: boolean
  setShowDeleteConfirm: (v: boolean) => void
  handleDelete: () => void
  confirmDelete: () => Promise<void>
  syncFromProps: (p: { likes_count?: number; is_liked?: boolean; likes_preview?: WorkoutLikerPreview[] }) => void
}

export function useWorkoutCardActions({
  workoutId,
  initialLikesCount = 0,
  initialIsLiked = false,
  initialLikesPreview = [],
  redirectToLogin = true,
}: UseWorkoutCardActionsOptions): UseWorkoutCardActionsResult {
  const { user: authUser } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const menuRef = useRef<HTMLDivElement>(null)

  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likesPreview, setLikesPreview] = useState<WorkoutLikerPreview[]>(initialLikesPreview)
  const [isLiking, setIsLiking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const syncFromProps = useCallback(
    (p: { likes_count?: number; is_liked?: boolean; likes_preview?: WorkoutLikerPreview[] }) => {
      setLikesCount(p.likes_count || 0)
      setIsLiked(p.is_liked || false)
      setLikesPreview(p.likes_preview || [])
    },
    []
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    setShowDeleteConfirm(false)
    setIsDeleting(true)
    const res = await deleteWorkoutAction(workoutId)
    if (res.success) {
      await queryClient.invalidateQueries({ queryKey: ['workouts'] })
      setIsDeleting(false)
      router.refresh()
    } else {
      toast.error('Error al borrar el workout: ' + res.error)
      setIsDeleting(false)
    }
  }, [workoutId, queryClient, router])

  const handleLike = useCallback(
    async (e?: React.MouseEvent) => {
      e?.preventDefault?.()
      e?.stopPropagation?.()

      if (!authUser) {
        if (redirectToLogin) router.push('/auth/login')
        return
      }
      if (isLiking) return

      const optimisticLiked = !isLiked
      const optimisticCount = optimisticLiked ? likesCount + 1 : Math.max(0, likesCount - 1)

      let optimisticPreview: WorkoutLikerPreview[] = likesPreview
      if (optimisticLiked) {
        const selfLiker: WorkoutLikerPreview = {
          id: authUser.id,
          username: (authUser as any).username ?? null,
          name: (authUser as any).name ?? null,
          avatar_url: (authUser as any).avatar_url ?? null,
        }
        optimisticPreview = [
          selfLiker,
          ...likesPreview.filter((l) => l.id !== selfLiker.id),
        ].slice(0, 3)
      } else {
        optimisticPreview = likesPreview.filter((l) => l.id !== authUser.id)
      }

      setIsLiked(optimisticLiked)
      setLikesCount(optimisticCount)
      setLikesPreview(optimisticPreview)
      setIsLiking(true)

      try {
        const res = await toggleWorkoutLikeAction(workoutId)
        if (!res.success) {
          setIsLiked(initialIsLiked)
          setLikesCount(initialLikesCount)
          setLikesPreview(initialLikesPreview)
          console.error('Error toggling like:', res.error)
          return
        }
        if (res.liked !== undefined) setIsLiked(res.liked)
        if (res.likesCount !== undefined) setLikesCount(res.likesCount)
        await queryClient.invalidateQueries({ queryKey: ['workouts'] })
        await queryClient.invalidateQueries({ queryKey: ['workout', workoutId] })
      } catch (error) {
        setIsLiked(initialIsLiked)
        setLikesCount(initialLikesCount)
        setLikesPreview(initialLikesPreview)
        console.error('Error toggling like:', error)
      } finally {
        setIsLiking(false)
      }
    },
    [
      authUser,
      isLiked,
      likesCount,
      likesPreview,
      initialIsLiked,
      initialLikesCount,
      initialLikesPreview,
      isLiking,
      workoutId,
      queryClient,
      router,
      redirectToLogin,
    ]
  )

  return {
    likesCount,
    isLiked,
    likesPreview,
    isLiking,
    isDeleting,
    showMenu,
    setShowMenu,
    menuRef,
    handleLike,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleDelete,
    confirmDelete,
    syncFromProps,
  }
}
