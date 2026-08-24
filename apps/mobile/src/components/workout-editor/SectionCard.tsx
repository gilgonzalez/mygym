import { Pressable, StyleSheet, Text, View } from 'react-native'
import { NestableDraggableFlatList, type RenderItemParams } from 'react-native-draggable-flatlist'
import { GripVertical, Package, Plus, Trash2 } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { Button, SegmentedControl, TextField, type SegmentedOption } from '@/components/ui'
import type { SectionEditorInput, ExerciseEditorInput } from '@/lib/workoutEditor'
import { ExerciseInstanceRow } from './ExerciseInstanceRow'

// Card de una sección — equivalente mobile del bloque de sección en
// create/page.tsx (apps/web). El drag handle de la sección lo maneja el
// padre (SectionList, vía NestableDraggableFlatList) — acá solo se pinta;
// el reorder de EJERCICIOS dentro de la sección sí es propio de esta card,
// con su propia NestableDraggableFlatList (ver nota sobre nesting en
// SectionPickerSheet.tsx: mover un ejercicio ENTRE secciones es una acción
// aparte, no un drag, porque cada lista solo reordena su propio array).
const ORDER_TYPE_OPTIONS: SegmentedOption<'single' | 'linear'>[] = [
  { value: 'single', label: 'Series' },
  { value: 'linear', label: 'Circuito' },
]

interface SectionCardProps {
  section: SectionEditorInput
  onChange: (patch: Partial<SectionEditorInput>) => void
  onRemove: () => void
  onAddExercise: () => void
  onAddFromVault: () => void
  onMoveExerciseToOtherSection: (exerciseKey: string) => void
  canMoveExercises: boolean
  drag?: () => void
  isActive?: boolean
}

export function SectionCard({
  section,
  onChange,
  onRemove,
  onAddExercise,
  onAddFromVault,
  onMoveExerciseToOtherSection,
  canMoveExercises,
  drag,
  isActive = false,
}: SectionCardProps) {
  const theme = useTheme()

  const updateExercise = (exerciseKey: string, patch: Partial<ExerciseEditorInput>) => {
    onChange({
      exercises: section.exercises.map((exercise) => (exercise.key === exerciseKey ? { ...exercise, ...patch } : exercise)),
    })
  }

  const removeExercise = (exerciseKey: string) => {
    onChange({ exercises: section.exercises.filter((exercise) => exercise.key !== exerciseKey) })
  }

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: theme.radius.card,
          borderColor: theme.colors.border,
          backgroundColor: isActive ? theme.colors.secondary : theme.colors.card,
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable onLongPress={drag} disabled={!drag} hitSlop={8} style={styles.handle}>
          <GripVertical size={20} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={styles.nameInput}>
          <TextField
            value={section.name}
            onChangeText={(name) => onChange({ name })}
            placeholder="Nombre de la sección"
          />
        </View>
        <Pressable onPress={onRemove} hitSlop={8} style={styles.removeButton}>
          <Trash2 size={18} color={theme.colors.destructive} />
        </Pressable>
      </View>

      <SegmentedControl options={ORDER_TYPE_OPTIONS} value={section.orderType} onChange={(orderType) => onChange({ orderType })} />

      <NestableDraggableFlatList
        data={section.exercises}
        keyExtractor={(exercise) => exercise.key}
        scrollEnabled={false}
        onDragEnd={({ data }) => onChange({ exercises: data })}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item, drag: dragExercise, isActive: exerciseActive }: RenderItemParams<ExerciseEditorInput>) => (
          <ExerciseInstanceRow
            exercise={item}
            onChange={(patch) => updateExercise(item.key, patch)}
            onRemove={() => removeExercise(item.key)}
            onMoveToOtherSection={canMoveExercises ? () => onMoveExerciseToOtherSection(item.key) : undefined}
            drag={dragExercise}
            isActive={exerciseActive}
          />
        )}
      />

      <View style={styles.addRow}>
        <View style={styles.addButton}>
          <Button title="Agregar ejercicio" icon={Plus} variant="outline" size="sm" onPress={onAddExercise} />
        </View>
        <View style={styles.addButton}>
          <Button title="Desde el vault" icon={Package} variant="outline" size="sm" onPress={onAddFromVault} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  handle: {
    padding: 4,
  },
  nameInput: {
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  addRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    flex: 1,
  },
})
