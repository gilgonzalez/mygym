import { useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NestableDraggableFlatList, NestableScrollContainer, type RenderItemParams } from 'react-native-draggable-flatlist'
import { ChevronLeft, Plus } from 'lucide-react-native'
import type { Difficulty, WorkoutVisibility } from '@mygym/shared'

import { useTheme } from '@/theme'
import { useSession } from '@/lib/session'
import { FormError } from '@/components/ui'
import {
  ExerciseVaultSheet,
  SectionCard,
  SectionPickerSheet,
  WorkoutCoverField,
  WorkoutMetaForm,
  createEmptyExercise,
  createEmptySection,
  createExerciseFromVault,
} from '@/components/workout-editor'
import { createWorkout, fetchWorkoutForEdit, updateWorkout, type SectionEditorInput, type VaultExercise } from '@/lib/workoutEditor'
import { persistExerciseThumbnails, persistWorkoutCover } from '@/lib/mediaUpload'

// Pantalla de creación/edición de workout — construida desde cero (no existía
// nada en mobile antes de esto, ver el comentario "sin ... crear nuevo" que
// tenía WorkoutsTab.tsx). Misma ruta para las dos cosas: `id === 'new'` es
// creación, cualquier otro valor es edición de un workout propio existente.
//
// Alcance v1 (ver también lib/workoutEditor.ts): sin reto AMRAP, sin editor
// de tutorial por ejercicio. Las miniaturas de ejercicios NUEVOS sí se
// pueden tomar con la cámara (foto o GIF de ≤5s — ver thumbnailCapture.ts:
// el "GIF" es en realidad un clip de video mudo en loop, nunca se procesa).
export default function WorkoutEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const isCreating = id === 'new'
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { session } = useSession()
  const userId = session!.user.id

  const [loading, setLoading] = useState(!isCreating)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')
  const [tags, setTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState<WorkoutVisibility>('private')
  const [cover, setCover] = useState<string | null>(null)
  const [sections, setSections] = useState<SectionEditorInput[]>([])

  const [vaultSheetSectionKey, setVaultSheetSectionKey] = useState<string | null>(null)
  const [movingExercise, setMovingExercise] = useState<{ sectionKey: string; exerciseKey: string } | null>(null)

  useEffect(() => {
    if (isCreating) return

    setLoading(true)
    fetchWorkoutForEdit(id)
      .then((data) => {
        setTitle(data.title)
        setDescription(data.description)
        setDifficulty(data.difficulty)
        setTags(data.tags)
        setVisibility(data.visibility)
        setCover(data.cover)
        setSections(data.sections)
      })
      .catch((err: any) => setError(err?.message ?? 'No se pudo cargar el workout'))
      .finally(() => setLoading(false))
  }, [id, isCreating])

  const updateSection = (sectionKey: string, patch: Partial<SectionEditorInput>) => {
    setSections((prev) => prev.map((section) => (section.key === sectionKey ? { ...section, ...patch } : section)))
  }

  const removeSection = (sectionKey: string) => {
    setSections((prev) => prev.filter((section) => section.key !== sectionKey))
  }

  const addSection = () => {
    setSections((prev) => [...prev, createEmptySection()])
  }

  const handleAddExercise = (sectionKey: string) => {
    updateSection(sectionKey, {
      exercises: [...(sections.find((s) => s.key === sectionKey)?.exercises ?? []), createEmptyExercise()],
    })
  }

  const handleSelectFromVault = (exercise: VaultExercise) => {
    const sectionKey = vaultSheetSectionKey
    if (!sectionKey) return
    const section = sections.find((s) => s.key === sectionKey)
    if (!section) return
    updateSection(sectionKey, { exercises: [...section.exercises, createExerciseFromVault(exercise)] })
  }

  const handleMoveExercise = (targetSectionKey: string) => {
    if (!movingExercise) return
    const { sectionKey: sourceSectionKey, exerciseKey } = movingExercise
    if (sourceSectionKey === targetSectionKey) return

    setSections((prev) => {
      const sourceSection = prev.find((s) => s.key === sourceSectionKey)
      const exercise = sourceSection?.exercises.find((e) => e.key === exerciseKey)
      if (!exercise) return prev

      return prev.map((section) => {
        if (section.key === sourceSectionKey) {
          return { ...section, exercises: section.exercises.filter((e) => e.key !== exerciseKey) }
        }
        if (section.key === targetSectionKey) {
          return { ...section, exercises: [...section.exercises, exercise] }
        }
        return section
      })
    })
  }

  const validate = (): string | null => {
    if (title.trim().length < 3) return 'El título tiene que tener al menos 3 caracteres.'
    if (sections.length === 0) return 'Agregá al menos una sección.'
    for (const section of sections) {
      if (!section.name.trim()) return 'Todas las secciones necesitan un nombre.'
      if (section.exercises.length === 0) return `La sección "${section.name}" no tiene ejercicios.`
      for (const exercise of section.exercises) {
        if (!exercise.name.trim()) return `Hay un ejercicio sin nombre en "${section.name}".`
      }
    }
    return null
  }

  const handleSave = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError(null)

    const input = { title: title.trim(), description: description.trim(), difficulty, tags, cover, visibility, sections }

    try {
      const [sectionsWithThumbnails, uploadedCover] = await Promise.all([
        persistExerciseThumbnails(sections, userId),
        persistWorkoutCover(cover, userId),
      ])
      setSections(sectionsWithThumbnails)
      setCover(uploadedCover)
      const payload = { ...input, cover: uploadedCover, sections: sectionsWithThumbnails }

      if (isCreating) {
        const newId = await createWorkout(userId, payload)
        router.replace({ pathname: '/workout/[id]', params: { id: newId } })
      } else {
        await updateWorkout(id, userId, payload)
        router.back()
      }
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo guardar el workout')
      setSaving(false)
    }
  }

  const movingExerciseSection = movingExercise ? sections.find((s) => s.key === movingExercise.sectionKey) : null
  const movingExerciseName = movingExerciseSection?.exercises.find((e) => e.key === movingExercise?.exerciseKey)?.name

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
          {isCreating ? 'Nuevo workout' : 'Editar workout'}
        </Text>
        <Pressable onPress={handleSave} disabled={saving || loading} hitSlop={8}>
          <Text
            style={[
              styles.saveText,
              { color: theme.colors.primary, fontFamily: theme.fontFamily.semibold },
              (saving || loading) && styles.saveTextDisabled,
            ]}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <NestableScrollContainer contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <WorkoutCoverField uri={cover} onChange={setCover} />

          <View style={styles.paddedContent}>
            <FormError message={error} />

            <WorkoutMetaForm
              title={title}
              onChangeTitle={setTitle}
              description={description}
              onChangeDescription={setDescription}
              difficulty={difficulty}
              onChangeDifficulty={setDifficulty}
              tags={tags}
              onChangeTags={setTags}
              visibility={visibility}
              onChangeVisibility={setVisibility}
            />

            <View style={styles.sectionsHeader}>
              <Text style={[styles.sectionsTitle, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
                Secciones
              </Text>
            </View>

            <NestableDraggableFlatList
              data={sections}
              keyExtractor={(section) => section.key}
              scrollEnabled={false}
              onDragEnd={({ data }) => setSections(data)}
              ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
              renderItem={({ item, drag, isActive }: RenderItemParams<SectionEditorInput>) => (
                <SectionCard
                  section={item}
                  currentUserId={userId}
                  onChange={(patch) => updateSection(item.key, patch)}
                  onRemove={() => removeSection(item.key)}
                  onAddExercise={() => handleAddExercise(item.key)}
                  onAddFromVault={() => setVaultSheetSectionKey(item.key)}
                  onMoveExerciseToOtherSection={(exerciseKey) => setMovingExercise({ sectionKey: item.key, exerciseKey })}
                  canMoveExercises={sections.length > 1}
                  drag={drag}
                  isActive={isActive}
                />
              )}
            />

            <Pressable
              onPress={addSection}
              style={[styles.addSectionButton, { borderColor: theme.colors.border, borderRadius: theme.radius.xl }]}
            >
              <Plus size={16} color={theme.colors.mutedForeground} />
              <Text style={[styles.addSectionText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.semibold }]}>
                Agregar sección
              </Text>
            </Pressable>
          </View>
        </NestableScrollContainer>
      )}

      <ExerciseVaultSheet
        visible={vaultSheetSectionKey !== null}
        onClose={() => setVaultSheetSectionKey(null)}
        userId={userId}
        onSelect={handleSelectFromVault}
      />

      <SectionPickerSheet
        visible={movingExercise !== null}
        onClose={() => setMovingExercise(null)}
        sections={sections.map((s) => ({ key: s.key, name: s.name }))}
        currentSectionKey={movingExercise?.sectionKey ?? ''}
        onSelect={handleMoveExercise}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 32,
  },
  headerTitle: {
    fontSize: 16,
  },
  saveText: {
    fontSize: 15,
    minWidth: 70,
    textAlign: 'right',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 60,
  },
  // La portada (WorkoutCoverField) se pinta edge-to-edge, antes de este
  // bloque — todo lo demás del form sí lleva el padding/gap de siempre.
  paddedContent: {
    padding: 16,
    gap: 20,
  },
  sectionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionsTitle: {
    fontSize: 16,
  },
  addSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 14,
  },
  addSectionText: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
})
