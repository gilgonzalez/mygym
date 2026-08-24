import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ArrowRightLeft, GripVertical, Lock, Target, Trash2, Wrench } from 'lucide-react-native'

import { useTheme, orange, sky } from '@/theme'
import { ChipInput, NumberStepper, SegmentedControl, Switch, TextArea, TextField, type SegmentedOption } from '@/components/ui'
import { DifficultyBadge, DifficultyPicker, TagList } from '@/components/workout'
import type { ExerciseEditorInput } from '@/lib/workoutEditor'

// Card de un ejercicio dentro de una sección — equivalente mobile de la
// card de ExercisesFieldArray.tsx (apps/web), sin useFieldArray/RHF: el
// estado vive en el padre (ver SectionCard), acá solo se recibe el valor y
// un onChange que manda un patch parcial.
//
// Si el ejercicio viene del vault (`exercise.id` presente), nombre/
// descripción/dificultad/materiales/músculos son de solo lectura acá — son
// propios del ejercicio compartido, se editan en el vault, no por-instancia
// (misma regla que en la web, ver isFromVault en ExercisesFieldArray.tsx) —
// igual se muestran (colores y todo) para no perder ese contexto, solo que
// sin controles para tocarlos. Lo de esta sección (type/reps/sets/rest/
// duration/weight) siempre se edita, venga o no del vault.
//
// Colores: mismos que usa el vault de la web (ExercisesVault.tsx) para que
// el editor hable el mismo lenguaje visual — naranja músculos, celeste
// materiales, y la escala de siempre para dificultad (getDifficultyColor).
const TYPE_OPTIONS: SegmentedOption<'reps' | 'time' | 'emom'>[] = [
  { value: 'reps', label: 'Reps' },
  { value: 'time', label: 'Tiempo' },
  { value: 'emom', label: 'EMOM' },
]

const MUSCLE_COLOR = orange[500]
const EQUIPMENT_COLOR = sky[500]

interface ExerciseInstanceRowProps {
  exercise: ExerciseEditorInput
  onChange: (patch: Partial<ExerciseEditorInput>) => void
  onRemove: () => void
  onMoveToOtherSection?: () => void
  drag?: () => void
  isActive?: boolean
}

export function ExerciseInstanceRow({
  exercise,
  onChange,
  onRemove,
  onMoveToOtherSection,
  drag,
  isActive = false,
}: ExerciseInstanceRowProps) {
  const theme = useTheme()
  const isFromVault = Boolean(exercise.id)
  const hasWeight = exercise.weightKg !== undefined && exercise.weightKg !== null

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: theme.radius.xl,
          borderColor: theme.colors.border,
          backgroundColor: isActive ? theme.colors.secondary : theme.colors.card,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Pressable onLongPress={drag} disabled={!drag} hitSlop={8} style={styles.handle}>
          <GripVertical size={18} color={theme.colors.mutedForeground} />
        </Pressable>

        <View style={styles.headerRight}>
          {isFromVault ? (
            <View style={[styles.lockBadge, { borderColor: theme.colors.border }]}>
              <Lock size={11} color={theme.colors.mutedForeground} />
              <Text style={[styles.lockText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.semibold }]}>
                Del vault
              </Text>
            </View>
          ) : null}
          {onMoveToOtherSection ? (
            <Pressable onPress={onMoveToOtherSection} hitSlop={8} style={styles.iconButton}>
              <ArrowRightLeft size={16} color={theme.colors.mutedForeground} />
            </Pressable>
          ) : null}
          <Pressable onPress={onRemove} hitSlop={8} style={styles.iconButton}>
            <Trash2 size={16} color={theme.colors.destructive} />
          </Pressable>
        </View>
      </View>

      {isFromVault ? (
        <View style={styles.vaultDetails}>
          <Text style={[styles.name, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
            {exercise.name}
          </Text>
          {exercise.description ? (
            <Text style={[styles.description, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
              {exercise.description}
            </Text>
          ) : null}
          <View style={styles.vaultBadgesRow}>
            <DifficultyBadge difficulty={exercise.difficulty} />
          </View>
          <TagList tags={exercise.muscleGroups} color={MUSCLE_COLOR} max={4} />
          <TagList tags={exercise.equipment} color={EQUIPMENT_COLOR} max={4} />
        </View>
      ) : (
        <View style={styles.newExerciseDetails}>
          <TextField value={exercise.name} onChangeText={(name) => onChange({ name })} placeholder="Nombre del ejercicio" />
          <TextArea
            value={exercise.description}
            onChangeText={(description) => onChange({ description })}
            placeholder="Notas breves sobre el ejercicio..."
            minHeight={60}
          />
          <DifficultyPicker value={exercise.difficulty} onChange={(difficulty) => onChange({ difficulty })} />
          <ChipInput
            value={exercise.muscleGroups}
            onChange={(muscleGroups) => onChange({ muscleGroups })}
            placeholder="Agregar músculo..."
            color={MUSCLE_COLOR}
            icon={Target}
          />
          <ChipInput
            value={exercise.equipment}
            onChange={(equipment) => onChange({ equipment })}
            placeholder="Agregar material..."
            color={EQUIPMENT_COLOR}
            icon={Wrench}
          />
        </View>
      )}

      <SegmentedControl
        options={TYPE_OPTIONS}
        value={exercise.type}
        onChange={(type) => onChange({ type, rest: type === 'emom' ? 0 : exercise.rest })}
      />

      <View style={styles.steppersRow}>
        {exercise.type === 'time' ? (
          <NumberStepper
            label="Duración"
            value={exercise.duration}
            onChange={(duration) => onChange({ duration })}
            min={0}
            step={5}
            suffix="s"
          />
        ) : (
          <NumberStepper label="Reps" value={exercise.reps} onChange={(reps) => onChange({ reps })} min={0} />
        )}
        <NumberStepper label="Series" value={exercise.sets} onChange={(sets) => onChange({ sets })} min={1} />
      </View>

      <View style={styles.steppersRow}>
        {exercise.type === 'emom' ? (
          <NumberStepper
            label="Ventana"
            value={exercise.duration}
            onChange={(duration) => onChange({ duration })}
            min={0}
            step={5}
            suffix="s"
          />
        ) : (
          <NumberStepper label="Descanso" value={exercise.rest} onChange={(rest) => onChange({ rest })} min={0} step={5} suffix="s" />
        )}
      </View>

      <View style={[styles.weightRow, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.weightLabel, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]}>
          Peso / carga
        </Text>
        <Switch
          value={hasWeight}
          onValueChange={(checked) => onChange({ weightKg: checked ? 0 : null })}
        />
      </View>
      {hasWeight ? (
        <NumberStepper
          value={exercise.weightKg ?? 0}
          onChange={(weightKg) => onChange({ weightKg })}
          min={0}
          step={2.5}
          suffix="kg"
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  handle: {
    padding: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lockText: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  iconButton: {
    padding: 4,
  },
  vaultDetails: {
    gap: 8,
  },
  newExerciseDetails: {
    gap: 10,
  },
  name: {
    fontSize: 16,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  vaultBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  steppersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  weightLabel: {
    fontSize: 13,
  },
})
