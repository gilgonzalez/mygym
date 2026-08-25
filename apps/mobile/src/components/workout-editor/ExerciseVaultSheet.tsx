import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { Dumbbell, Search } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { Sheet, TextField } from '@/components/ui'
import { DifficultyBadge, TagList, ThumbnailMedia } from '@/components/workout'
import { fetchExerciseVault, type VaultExercise } from '@/lib/workoutEditor'

// Picker "Agregar desde vault" — equivalente mobile de ExercisesVault.tsx
// (apps/web). Muestra solo lo que el vault realmente guarda ahora (nombre/
// descripción/dificultad/materiales/thumbnail) — sin type/reps/sets/etc,
// que se definen recién al agregar el ejercicio a una sección (ver
// createExerciseFromVault en formHelpers.ts).
interface ExerciseVaultSheetProps {
  visible: boolean
  onClose: () => void
  userId: string
  onSelect: (exercise: VaultExercise) => void
}

export function ExerciseVaultSheet({ visible, onClose, userId, onSelect }: ExerciseVaultSheetProps) {
  const theme = useTheme()
  const [search, setSearch] = useState('')
  const [exercises, setExercises] = useState<VaultExercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return

    let cancelled = false
    setLoading(true)
    setError(null)

    // Debounce simple: espera a que el usuario deje de tipear antes de
    // pegarle a la DB en cada letra.
    const timeout = setTimeout(() => {
      fetchExerciseVault(userId, search)
        .then((data) => {
          if (!cancelled) setExercises(data)
        })
        .catch((err: any) => {
          if (!cancelled) setError(err?.message ?? 'No se pudo cargar el catálogo de ejercicios')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [visible, search, userId])

  return (
    <Sheet visible={visible} onClose={onClose} title="Agregar desde el vault" fullHeight>
      <TextField
        icon={Search}
        placeholder="Buscar ejercicios..."
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.centered} />
      ) : error ? (
        <Text style={[styles.emptyText, { color: theme.colors.destructive, fontFamily: theme.fontFamily.regular }]}>
          {error}
        </Text>
      ) : (
        <BottomSheetFlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
              No encontramos ejercicios con ese término.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onSelect(item)
                onClose()
              }}
              style={[styles.row, { borderColor: theme.colors.border }]}
            >
              {item.thumbnailUrl ? (
                <ThumbnailMedia uri={item.thumbnailUrl} style={[styles.thumb, { borderRadius: theme.radius.md }]} />
              ) : (
                <View
                  style={[
                    styles.thumb,
                    styles.thumbFallback,
                    { borderRadius: theme.radius.md, backgroundColor: theme.colors.secondary },
                  ]}
                >
                  <Dumbbell size={18} color={theme.colors.mutedForeground} />
                </View>
              )}
              <View style={styles.info}>
                <Text
                  style={[styles.name, { color: theme.colors.foreground, fontFamily: theme.fontFamily.semibold }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <View style={styles.metaRow}>
                  <DifficultyBadge difficulty={item.difficulty} />
                  <TagList tags={item.muscleGroups} max={2} />
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </Sheet>
  )
}

const styles = StyleSheet.create({
  centered: {
    marginTop: 24,
  },
  list: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  thumb: {
    width: 48,
    height: 48,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
  },
})
