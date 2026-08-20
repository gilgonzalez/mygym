import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Minus, Plus } from 'lucide-react-native'

import { useTheme } from '@/theme'

// No existe como componente propio en la web (ahí son <input type="number">
// dentro del form de creación), pero en mobile escribir números de a dígito
// en un teclado táctil es incómodo — un stepper +/- es el patrón nativo
// estándar. Pensado para series/repeticiones/peso/descanso en el editor de
// workout y en la ejecución (registrar peso usado, etc.).
interface NumberStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  label?: string
}

export function NumberStepper({ value, onChange, min = 0, max = 999, step = 1, suffix, label }: NumberStepperProps) {
  const theme = useTheme()

  const decrement = () => onChange(Math.max(min, roundStep(value - step)))
  const increment = () => onChange(Math.min(max, roundStep(value + step)))

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.control, { borderColor: theme.colors.border, borderRadius: theme.radius.full }]}>
        <StepButton icon={Minus} onPress={decrement} disabled={value <= min} />
        <Text style={[styles.value, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
          {value}
          {suffix ? <Text style={[styles.suffix, { color: theme.colors.mutedForeground }]}> {suffix}</Text> : null}
        </Text>
        <StepButton icon={Plus} onPress={increment} disabled={value >= max} />
      </View>
    </View>
  )
}

function StepButton({ icon: Icon, onPress, disabled }: { icon: typeof Plus; onPress: () => void; disabled: boolean }) {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={[styles.stepButton, disabled && styles.stepButtonDisabled]}
    >
      <Icon size={16} color={disabled ? theme.colors.mutedForeground : theme.colors.foreground} />
    </Pressable>
  )
}

function roundStep(n: number) {
  return Math.round(n * 100) / 100
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 12,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingHorizontal: 6,
    height: 40,
  },
  stepButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  value: {
    fontSize: 16,
    minWidth: 40,
    textAlign: 'center',
  },
  suffix: {
    fontSize: 12,
  },
})
