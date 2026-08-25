import { StyleSheet, Text, View } from 'react-native'
import type { Difficulty, WorkoutVisibility } from '@mygym/shared'

import { useTheme } from '@/theme'
import { TextArea, TextField } from '@/components/ui'
import { TagSelector, VisibilitySelector } from '@/components/form'
import { DifficultyPicker } from '@/components/workout'

// Metadata del workout (todo lo que no es secciones/ejercicios) — equivalente
// mobile del bloque de la derecha en create/page.tsx (apps/web): título,
// descripción, dificultad, tags, visibilidad. La portada NO vive acá — es la
// cabecera de toda la pantalla (WorkoutCoverField, ver [id].tsx), no "un
// campo más" del form, así que se renderiza edge-to-edge por fuera de este
// bloque con padding.
interface WorkoutMetaFormProps {
  title: string
  onChangeTitle: (value: string) => void
  description: string
  onChangeDescription: (value: string) => void
  difficulty: Difficulty
  onChangeDifficulty: (value: Difficulty) => void
  tags: string[]
  onChangeTags: (value: string[]) => void
  visibility: WorkoutVisibility
  onChangeVisibility: (value: WorkoutVisibility) => void
}

export function WorkoutMetaForm({
  title,
  onChangeTitle,
  description,
  onChangeDescription,
  difficulty,
  onChangeDifficulty,
  tags,
  onChangeTags,
  visibility,
  onChangeVisibility,
}: WorkoutMetaFormProps) {
  return (
    <View style={styles.wrapper}>
      <Field label="Título">
        <TextField value={title} onChangeText={onChangeTitle} placeholder="Nombre del workout" />
      </Field>

      <Field label="Descripción">
        <TextArea value={description} onChangeText={onChangeDescription} placeholder="¿De qué se trata este workout?" minHeight={80} />
      </Field>

      <Field label="Dificultad">
        <DifficultyPicker value={difficulty} onChange={onChangeDifficulty} />
      </Field>

      <Field label="Etiquetas">
        <TagSelector value={tags} onChange={onChangeTags} />
      </Field>

      <Field label="Visibilidad">
        <VisibilitySelector value={visibility} onChange={onChangeVisibility} />
      </Field>
    </View>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useTheme()
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]}>{label}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
})
