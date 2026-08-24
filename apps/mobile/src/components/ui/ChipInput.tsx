import { useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Plus, X } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { Badge } from './Badge'

// Puerto de src/app/editor/workout/components/TagInput.tsx (apps/web): texto
// libre + Enter/botón "+" arma una lista de chips removibles. A diferencia
// de TagSelector.tsx (que elige de un catálogo fijo, WORKOUT_TAGS), este
// acepta cualquier texto — para grupos musculares/equipment de un ejercicio,
// que no salen de una lista cerrada. `color` es lo que le da la identidad
// visual por tipo de dato (naranja músculos, celeste materiales — ver
// ExerciseInstanceRow.tsx), tal como en la web.
interface ChipInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  color: string
  icon?: LucideIcon
  disabled?: boolean
}

export function ChipInput({ value, onChange, placeholder, color, icon: Icon, disabled = false }: ChipInputProps) {
  const theme = useTheme()
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const trimmed = input.trim()
    if (trimmed) {
      onChange([...value, trimmed])
      setInput('')
    }
  }

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.inputRow,
          { borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.card },
        ]}
      >
        {Icon ? <Icon size={15} color={color} style={styles.icon} /> : null}
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleAdd}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.mutedForeground}
          editable={!disabled}
          style={[
            styles.input,
            { color: theme.colors.foreground, fontFamily: theme.fontFamily.regular, fontSize: theme.fontSize.base },
          ]}
        />
        {!disabled ? (
          <Pressable onPress={handleAdd} hitSlop={8} style={styles.addButton}>
            <Plus size={16} color={color} />
          </Pressable>
        ) : null}
      </View>

      {value.length > 0 ? (
        <View style={styles.chipsRow}>
          {value.map((item, index) => (
            <Badge
              key={`${item}-${index}`}
              label={item}
              color={color}
              variant="soft"
              onRemove={disabled ? undefined : () => onChange(value.filter((_, i) => i !== index))}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
  addButton: {
    padding: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
})
