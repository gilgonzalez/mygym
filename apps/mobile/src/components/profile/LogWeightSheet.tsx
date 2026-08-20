import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { Button, FormError, NumberStepper, Sheet } from '@/components/ui'
import { logWeight } from '@/lib/profile'

interface LogWeightSheetProps {
  visible: boolean
  onClose: () => void
  userId: string
  lastWeightKg: number | null
  onLogged: () => void
}

// Alta rápida de un registro de peso — sheet propio en vez de mandar al
// usuario a la pantalla completa de editar perfil (ver app/edit-profile.tsx):
// "llevar registro" del peso implica cargarlo seguido, así que el camino
// corto tiene que ser eso, un par de toques, no un formulario largo.
export function LogWeightSheet({ visible, onClose, userId, lastWeightKg, onLogged }: LogWeightSheetProps) {
  const [weight, setWeight] = useState(lastWeightKg ?? 70)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setWeight(lastWeightKg ?? 70)
      setError(null)
    }
  }, [visible, lastWeightKg])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await logWeight(userId, weight)
      onLogged()
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo guardar el registro')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Registrar peso">
      <View style={styles.content}>
        <NumberStepper value={weight} onChange={setWeight} min={20} max={300} step={0.1} suffix="kg" />
        <FormError message={error} />
        <Button title={saving ? 'Guardando...' : 'Guardar'} onPress={handleSave} loading={saving} />
      </View>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingTop: 4,
  },
})
