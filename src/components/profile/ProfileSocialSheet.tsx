'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Check, Inbox, Loader2, UserPlus, Users, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/Button'
import {
  acceptFollowRequestAction,
  rejectFollowRequestAction,
  removeFollowerAction,
  unfollowUserAction,
} from '@/app/actions/user/follows'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { FollowListItem, FollowOverview } from '@/types/social'

type SocialTab = 'requests' | 'followers' | 'following'

interface ProfileSocialSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  overview: FollowOverview
  isLoading: boolean
}

interface SocialRowAction {
  label: string
  pendingLabel: string
  icon: typeof Check
  variant?: 'default' | 'outline' | 'secondary'
  confirmTitle?: string
  confirmDescription?: string
  confirmButtonClassName?: string
  onClick: () => Promise<void>
}

interface SocialUserRowProps {
  kind: SocialTab
  item: FollowListItem
  meta: string
  primaryAction?: SocialRowAction
  secondaryAction?: SocialRowAction
}

const EMPTY_OVERVIEW: FollowOverview = {
  followersCount: 0,
  followingCount: 0,
  pendingRequestsCount: 0,
  followers: [],
  following: [],
  pendingRequests: [],
}

const X_ACTION_BUTTON_CLASS =
  'h-9 w-9 rounded-full border border-rose-500/20 bg-rose-500 p-0 text-white shadow-[0_10px_20px_rgba(244,63,94,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-400'

function formatRelativeDate(dateString: string | null) {
  if (!dateString) return 'Reciente'

  const date = new Date(dateString)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'Hace un momento'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Hace ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`

  const days = Math.floor(hours / 24)
  if (days < 30) return `Hace ${days} d`

  const months = Math.floor(days / 30)
  if (months < 12) return `Hace ${months} mes${months === 1 ? '' : 'es'}`

  const years = Math.floor(months / 12)
  return `Hace ${years} ano${years === 1 ? '' : 's'}`
}

function SocialUserRow({
  kind,
  item,
  meta,
  primaryAction,
  secondaryAction,
}: SocialUserRowProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<SocialRowAction | null>(null)
  const [isPending, startTransition] = useTransition()
  const isRequestCard = Boolean(primaryAction && secondaryAction && item.status === 'pending')

  const runAction = (action?: SocialRowAction) => {
    if (!action) return

    startTransition(async () => {
      setPendingAction(action.label)

      try {
        await action.onClick()
      } finally {
        setPendingAction(null)
      }
    })
  }

  const handleActionClick = (action?: SocialRowAction) => {
    if (!action) return

    if (action.confirmTitle || action.confirmDescription) {
      setConfirmAction(action)
      return
    }

    runAction(action)
  }

  const confirmDialog = (
    <Dialog open={!!confirmAction} onOpenChange={(open: boolean) => !open && setConfirmAction(null)}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.10),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_28%),linear-gradient(180deg,rgba(12,16,30,0.98),rgba(8,11,22,0.96))] p-0 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
      >
        <div className="p-5">
          <DialogHeader className="items-center text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
              {confirmAction?.label === 'Aceptar' ? (
                <Check className="h-4.5 w-4.5 text-emerald-300" />
              ) : (
                <X className="h-4.5 w-4.5 text-rose-300" />
              )}
            </div>
            <DialogTitle className="text-lg font-black tracking-tight text-foreground">
              {confirmAction?.confirmTitle || 'Confirmar acción'}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-relaxed text-white/60">
              {confirmAction?.confirmDescription || 'Esta accion no se puede deshacer desde este paso.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-muted">
              {item.user.avatar_url ? (
                <img
                  src={item.user.avatar_url}
                  alt={item.user.name || item.user.username || 'Usuario'}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                  <Users className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold text-foreground">
                {item.user.name || item.user.username || 'Usuario'}
              </p>
              <p className="truncate text-[11px] text-white/45">{meta}</p>
            </div>
          </div>

          <DialogFooter className="mt-5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-2xl border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white"
              onClick={() => setConfirmAction(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className={cn(
                'h-10 rounded-2xl',
                confirmAction?.confirmButtonClassName || 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
              onClick={async () => {
                const actionToRun = confirmAction
                setConfirmAction(null)
                runAction(actionToRun || undefined)
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (isRequestCard && primaryAction && secondaryAction) {
    return (
      <>
        <div className="px-2 pb-2 pt-1">
          <div className="mx-auto max-w-[330px]">
            <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.10),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-4 py-3 shadow-[0_16px_32px_rgba(0,0,0,0.18)]">
              <div className="absolute inset-x-0 top-0 h-8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
              <div className="relative flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-muted shadow-[0_8px_16px_rgba(0,0,0,0.14)] ring-2 ring-primary/15">
                  {item.user.avatar_url ? (
                    <img
                      src={item.user.avatar_url}
                      alt={item.user.name || item.user.username || 'Usuario'}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-black tracking-tight text-foreground">
                    {item.user.name || item.user.username || 'Usuario'}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">quiere seguirte</p>
                  <p className="truncate text-[10px] text-white/38">{meta}</p>
                </div>

                <div className="ml-1 flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 w-9 rounded-full border border-emerald-500/20 bg-emerald-500 p-0 text-emerald-950 shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400"
                    disabled={isPending}
                    onClick={() => setConfirmAction(primaryAction)}
                  >
                    {isPending && pendingAction === primaryAction.label ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={X_ACTION_BUTTON_CLASS}
                    disabled={isPending}
                    onClick={() => setConfirmAction(secondaryAction)}
                  >
                    {isPending && pendingAction === secondaryAction.label ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {confirmDialog}
      </>
    )
  }

  return (
    <>
      <div
        className={cn(
          'group relative overflow-hidden rounded-[22px] border px-3.5 py-3 shadow-[0_14px_32px_rgba(0,0,0,0.12)] transition-all duration-300 hover:border-white/15',
          kind === 'followers'
            ? 'border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.024))]'
            : 'border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.024))]'
        )}
      >
        <div
          className={cn(
            'absolute inset-x-0 top-0 h-px opacity-80',
            kind === 'followers'
              ? 'bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent'
              : 'bg-gradient-to-r from-transparent via-sky-400/60 to-transparent'
          )}
        />
        <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-white/[0.03] blur-2xl transition-transform duration-500 group-hover:scale-110" />
        <div className="relative flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-muted shadow-[0_10px_22px_rgba(0,0,0,0.16)]">
            {item.user.avatar_url ? (
              <img
                src={item.user.avatar_url}
                alt={item.user.name || item.user.username || 'Usuario'}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                {item.user.name || item.user.username || 'Usuario'}
              </p>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em]',
                  kind === 'followers'
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                    : 'border-sky-500/20 bg-sky-500/10 text-sky-300'
                )}
              >
                {kind === 'followers' ? 'Seguidor' : 'Siguiendo'}
              </span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground">
              @{item.user.username || 'sin-username'}
            </p>
            <p className="truncate text-[10px] text-white/40">{meta}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {secondaryAction ? (
              <Button
                type="button"
                size="sm"
                variant={secondaryAction.variant || 'outline'}
                className="h-8 rounded-full border-white/12 bg-white/[0.03] px-3 text-[11px] text-white/72 hover:bg-white/[0.06] hover:text-white"
                disabled={isPending}
                onClick={() => handleActionClick(secondaryAction)}
              >
                {isPending && pendingAction === secondaryAction.label ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <secondaryAction.icon className="h-3 w-3" />
                )}
                {isPending && pendingAction === secondaryAction.label
                  ? secondaryAction.pendingLabel
                  : secondaryAction.label}
              </Button>
            ) : null}

            {primaryAction ? (
              <Button
                type="button"
                size="sm"
                variant={primaryAction.variant || 'outline'}
                className={X_ACTION_BUTTON_CLASS}
                disabled={isPending}
                onClick={() => handleActionClick(primaryAction)}
                aria-label={primaryAction.label}
                title={primaryAction.label}
              >
                {isPending && pendingAction === primaryAction.label ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <primaryAction.icon className="h-3.5 w-3.5" />
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {confirmDialog}
    </>
  )
}

export function ProfileSocialSheet({
  open,
  onOpenChange,
  overview,
  isLoading,
}: ProfileSocialSheetProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<SocialTab>('requests')

  const safeOverview = overview || EMPTY_OVERVIEW

  useEffect(() => {
    if (!open) return

    if (safeOverview.pendingRequestsCount > 0) {
      setActiveTab('requests')
      return
    }

    if (safeOverview.followersCount > 0) {
      setActiveTab('followers')
      return
    }

    if (safeOverview.followingCount > 0) {
      setActiveTab('following')
    }
  }, [
    open,
    safeOverview.followersCount,
    safeOverview.followingCount,
    safeOverview.pendingRequestsCount,
  ])

  const tabOptions = useMemo(
    () => [
      {
        key: 'requests' as const,
        label: 'Solicitudes',
        count: safeOverview.pendingRequestsCount,
        icon: Inbox,
        activeClass: 'border-white/20 bg-white text-slate-950 shadow-lg',
        idleClass: 'border-white/10 bg-white/[0.03] text-white/72 hover:border-amber-500/20 hover:bg-white/[0.05]',
        accentClass: 'bg-amber-500/70',
        iconClass: 'text-amber-400',
      },
      {
        key: 'followers' as const,
        label: 'Seguidores',
        count: safeOverview.followersCount,
        icon: Users,
        activeClass: 'border-white/20 bg-white text-slate-950 shadow-lg',
        idleClass: 'border-white/10 bg-white/[0.03] text-white/72 hover:border-emerald-500/20 hover:bg-white/[0.05]',
        accentClass: 'bg-emerald-500/70',
        iconClass: 'text-emerald-400',
      },
      {
        key: 'following' as const,
        label: 'Siguiendo',
        count: safeOverview.followingCount,
        icon: UserPlus,
        activeClass: 'border-white/20 bg-white text-slate-950 shadow-lg',
        idleClass: 'border-white/10 bg-white/[0.03] text-white/72 hover:border-sky-500/20 hover:bg-white/[0.05]',
        accentClass: 'bg-sky-500/70',
        iconClass: 'text-sky-400',
      },
    ],
    [safeOverview]
  )

  const currentItems =
    activeTab === 'requests'
      ? safeOverview.pendingRequests
      : activeTab === 'followers'
        ? safeOverview.followers
        : safeOverview.following

  const activeCopy =
    activeTab === 'requests'
      ? {
          title: 'Solicitudes',
          description: 'Gestiona quien puede seguirte.',
          emptyTitle: 'No hay solicitudes pendientes',
          emptyDescription: 'Las nuevas solicitudes apareceran aqui.',
        }
      : activeTab === 'followers'
        ? {
            title: 'Seguidores',
            description: 'Personas que siguen tu perfil.',
            emptyTitle: 'Todavia no tienes seguidores',
            emptyDescription: 'Cuando alguien te siga, aparecera aqui.',
          }
        : {
            title: 'Siguiendo',
            description: 'Cuentas que sigues ahora mismo.',
            emptyTitle: 'Todavia no sigues a nadie',
            emptyDescription: 'Las cuentas que sigas apareceran aqui.',
          }

  const refreshSocialData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['followOverview'] }),
      queryClient.invalidateQueries({ queryKey: ['workouts'] }),
    ])
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-hidden border-l-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.10),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.10),transparent_30%),linear-gradient(180deg,rgba(8,11,22,0.98),rgba(8,11,22,0.94))] p-0 sm:max-w-[600px]"
        showCloseButton={false}
      >
        <div className="relative flex h-full min-h-0 flex-col">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
          <div className="pointer-events-none absolute -right-12 top-8 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-16 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl" />

          <SheetHeader className="relative border-b border-white/10 px-6 pb-5 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-primary shadow-[0_14px_32px_rgba(0,0,0,0.18)]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-black leading-none tracking-tight text-foreground">
                    Tu circulo
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-sm text-white/60">
                    Social de tu perfil.
                  </SheetDescription>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Cerrar panel social"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {tabOptions.map(({ key, label, count, icon: Icon, activeClass, idleClass, accentClass, iconClass }) => (
                <button
                  key={`metric-${key}`}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'group/tab relative overflow-hidden rounded-[18px] border px-3 py-3 text-left transition-all duration-300',
                    activeTab === key
                      ? activeClass
                      : idleClass
                  )}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-70" />
                  <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-white/[0.04] blur-2xl transition-transform duration-500 group-hover/tab:scale-125" />
                  <div className="mb-2 flex items-center justify-between">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-xl border transition-transform duration-300 group-hover/tab:scale-105',
                        activeTab === key
                          ? 'border-slate-950/10 bg-slate-950/8 text-slate-700'
                          : 'border-white/10 bg-white/[0.04]',
                        activeTab !== key && iconClass
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xl font-black tracking-tight">{count}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em]">{label}</p>
                  {activeTab !== key ? (
                    <div className={cn('mt-2 h-1 w-10 rounded-full', accentClass)} />
                  ) : null}
                </button>
              ))}
            </div>
          </SheetHeader>

          <div className="relative flex min-h-0 flex-1 flex-col px-6 pb-6 pt-5">
            <div className="mb-4 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3.5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">{activeCopy.title}</h3>
                  <p className="mt-1 text-sm text-white/60">
                    {activeCopy.description}
                  </p>
                </div>
                <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/65 sm:block">
                  {currentItems.length} items
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-24 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.04]"
                    />
                  ))}
                </div>
              ) : currentItems.length > 0 ? (
                <div className="space-y-3">
                  {currentItems.map((item) => {
                    if (activeTab === 'requests') {
                      return (
                        <SocialUserRow
                          key={`${activeTab}-${item.user.id}`}
                          kind="requests"
                          item={item}
                          meta={`Pidio seguirte ${formatRelativeDate(item.requested_at)}`}
                          secondaryAction={{
                            label: 'Rechazar',
                            pendingLabel: 'Rechazando...',
                            icon: X,
                            variant: 'outline',
                            confirmTitle: '¿Denegar solicitud?',
                            confirmDescription: `Vas a denegar la solicitud de ${item.user.name || item.user.username || 'este usuario'}.`,
                            confirmButtonClassName: 'bg-rose-500 text-white hover:bg-rose-400',
                            onClick: async () => {
                              const result = await rejectFollowRequestAction(item.user.id)

                              if (!result.success) {
                                window.alert(result.error || 'No pudimos rechazar la solicitud.')
                                return
                              }

                              await refreshSocialData()
                            },
                          }}
                          primaryAction={{
                            label: 'Aceptar',
                            pendingLabel: 'Aceptando...',
                            icon: Check,
                            confirmTitle: '¿Aceptar solicitud?',
                            confirmDescription: `${item.user.name || item.user.username || 'Este usuario'} pasara a formar parte de tus seguidores.`,
                            confirmButtonClassName: 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400',
                            onClick: async () => {
                              const result = await acceptFollowRequestAction(item.user.id)

                              if (!result.success) {
                                window.alert(result.error || 'No pudimos aceptar la solicitud.')
                                return
                              }

                              await refreshSocialData()
                            },
                          }}
                        />
                      )
                    }

                    if (activeTab === 'followers') {
                      return (
                        <SocialUserRow
                          key={`${activeTab}-${item.user.id}`}
                          kind="followers"
                          item={item}
                          meta={`Te sigue ${formatRelativeDate(item.accepted_at || item.requested_at)}`}
                          primaryAction={{
                            label: 'Eliminar',
                            pendingLabel: 'Eliminando...',
                            icon: X,
                            variant: 'outline',
                            confirmTitle: '¿Eliminar seguidor?',
                            confirmDescription: `Vas a quitar a ${item.user.name || item.user.username || 'este usuario'} de tus seguidores.`,
                            confirmButtonClassName: 'bg-rose-500 text-white hover:bg-rose-400',
                            onClick: async () => {
                              const result = await removeFollowerAction(item.user.id)

                              if (!result.success) {
                                window.alert(result.error || 'No pudimos eliminar al seguidor.')
                                return
                              }

                              await refreshSocialData()
                            },
                          }}
                        />
                      )
                    }

                    return (
                      <SocialUserRow
                        key={`${activeTab}-${item.user.id}`}
                        kind="following"
                        item={item}
                        meta={`Sigues a esta cuenta desde ${formatRelativeDate(item.accepted_at || item.requested_at)}`}
                        primaryAction={{
                          label: 'Dejar de seguir',
                          pendingLabel: 'Actualizando...',
                          icon: X,
                          variant: 'outline',
                          confirmTitle: '¿Dejar de seguir?',
                          confirmDescription: `Dejaras de seguir a ${item.user.name || item.user.username || 'este usuario'}.`,
                          confirmButtonClassName: 'bg-white text-slate-950 hover:bg-white/90',
                          onClick: async () => {
                            const result = await unfollowUserAction(item.user.id)

                            if (!result.success) {
                              window.alert(result.error || 'No pudimos actualizar esta relacion.')
                              return
                            }

                            await refreshSocialData()
                          },
                        }}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70">
                    {activeTab === 'requests' ? (
                      <Inbox className="h-6 w-6" />
                    ) : activeTab === 'followers' ? (
                      <Users className="h-6 w-6" />
                    ) : (
                      <UserPlus className="h-6 w-6" />
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                    {activeCopy.emptyTitle}
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-white/60">
                    {activeCopy.emptyDescription}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
