import { useEffect, useState } from 'react'
import { Check, UserPlus, UserRoundX } from 'lucide-react-native'

import type { ButtonVariant } from '@/components/ui'
import { Button } from '@/components/ui'

// Puerto visual de src/components/social/FollowButton.tsx. La mutación
// (requestFollow/unfollow/cancelRequest contra Supabase) todavía no está
// portada — se conecta pasando `onPress` cuando se arme la pantalla de
// perfil/detalle de usuario; por ahora expone los 3 estados con su copy e
// icono correctos, igual que la web.
export type FollowStatus = 'none' | 'pending' | 'accepted'

interface FollowButtonProps {
  status: FollowStatus
  onPress: (current: FollowStatus) => Promise<void> | void
  disabled?: boolean
}

const COPY: Record<FollowStatus, { label: string; pendingLabel: string; variant: ButtonVariant }> = {
  none: { label: 'Seguir', pendingLabel: 'Enviando...', variant: 'default' },
  pending: { label: 'Solicitado', pendingLabel: 'Cancelando...', variant: 'outline' },
  accepted: { label: 'Siguiendo', pendingLabel: 'Quitando...', variant: 'secondary' },
}

export function FollowButton({ status, onPress, disabled }: FollowButtonProps) {
  const [loading, setLoading] = useState(false)
  const [localStatus, setLocalStatus] = useState(status)

  useEffect(() => setLocalStatus(status), [status])

  const config = COPY[localStatus]

  const handlePress = async () => {
    setLoading(true)
    try {
      await onPress(localStatus)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      title={loading ? config.pendingLabel : config.label}
      onPress={handlePress}
      variant={config.variant}
      loading={loading}
      disabled={disabled}
      fullWidth={false}
      icon={localStatus === 'accepted' ? UserRoundX : localStatus === 'pending' ? Check : UserPlus}
    />
  )
}
