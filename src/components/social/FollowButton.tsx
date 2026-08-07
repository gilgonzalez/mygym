'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Check, Loader2, UserPlus, UserRoundX, UserRoundCheck } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  cancelFollowRequestAction,
  requestFollowAction,
  unfollowUserAction,
} from '@/app/actions/user/follows'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { FollowStatus } from '@/types/social'

interface FollowButtonProps {
  userId: string
  initialStatus?: FollowStatus
  className?: string
  size?: 'sm' | 'default'
  onStatusChange?: (status: FollowStatus) => void
}

const FOLLOW_COPY: Record<
  FollowStatus,
  {
    label: string
    pendingLabel: string
    icon: typeof UserPlus
    variant: 'default' | 'outline' | 'secondary'
    nextStatus: FollowStatus
  }
> = {
  none: {
    label: 'Seguir',
    pendingLabel: 'Enviando...',
    icon: UserPlus,
    variant: 'default',
    nextStatus: 'pending',
  },
  pending: {
    label: 'Solicitado',
    pendingLabel: 'Cancelando...',
    icon: Check,
    variant: 'outline',
    nextStatus: 'none',
  },
  accepted: {
    label: 'Siguiendo',
    pendingLabel: 'Quitando...',
    icon: UserRoundCheck,
    variant: 'secondary',
    nextStatus: 'none',
  },
}

export function FollowButton({
  userId,
  initialStatus = 'none',
  className,
  size = 'sm',
  onStatusChange,
}: FollowButtonProps) {
  const { user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<FollowStatus>(initialStatus)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus, userId])

  if (!userId || user?.id === userId) {
    return null
  }

  const currentConfig = FOLLOW_COPY[status]
  const CurrentIcon = currentConfig.icon

  const handleClick = () => {
    if (!user) {
      const redirectTo = pathname || '/feed'
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`)
      return
    }

    const previousStatus = status
    const optimisticStatus = currentConfig.nextStatus

    startTransition(async () => {
      setStatus(optimisticStatus)

      const result =
        previousStatus === 'accepted'
          ? await unfollowUserAction(userId)
          : previousStatus === 'pending'
            ? await cancelFollowRequestAction(userId)
            : await requestFollowAction(userId)

      if (!result.success) {
        setStatus(previousStatus)
        window.alert(result.error || 'No pudimos actualizar la relacion de seguimiento.')
        return
      }

      const nextStatus = result.data?.status ?? optimisticStatus
      setStatus(nextStatus)
      onStatusChange?.(nextStatus)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workouts'] }),
        queryClient.invalidateQueries({ queryKey: ['followOverview'] }),
      ])
    })
  }

  return (
    <Button
      type="button"
      size={size}
      variant={currentConfig.variant}
      disabled={isPending}
      className={cn(
        'gap-2 rounded-full px-3 shadow-sm',
        status === 'none' && 'shadow-primary/20',
        status === 'pending' && 'border-white/15 bg-white/[0.03]',
        status === 'accepted' && 'bg-emerald-500/12 text-emerald-300 hover:bg-emerald-500/18',
        className
      )}
      onClick={handleClick}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : status === 'accepted' ? (
        <UserRoundX className="h-3.5 w-3.5" />
      ) : (
        <CurrentIcon className="h-3.5 w-3.5" />
      )}
      <span>{isPending ? currentConfig.pendingLabel : currentConfig.label}</span>
    </Button>
  )
}
