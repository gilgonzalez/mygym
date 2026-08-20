import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { Check, Search, Tag } from 'lucide-react-native'
import { WORKOUT_TAGS } from '@mygym/shared'

import { useTheme } from '@/theme'
import { Badge, Button, Sheet, TextField } from '@/components/ui'

// Puerto de src/components/ui/workout-tag-selector.tsx — en la web es un
// dropdown; en mobile lo resolvemos como un Sheet con buscador (los
// dropdowns flotantes no son un patrón táctil natural). Usado en el form de
// creación de workout.
interface TagSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function TagSelector({ value, onChange }: TagSelectorProps) {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredTags = useMemo(() => {
    const term = search.trim().toLowerCase()
    const tags = WORKOUT_TAGS as readonly string[]
    if (!term) return tags
    return tags.filter((tag) => tag.toLowerCase().includes(term))
  }, [search])

  const toggleTag = (tag: string) => {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag])
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.card }]}
      >
        <Tag size={16} color={theme.colors.mutedForeground} />
        <Text style={[styles.triggerText, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
          {value.length > 0 ? `${value.length} etiquetas seleccionadas` : 'Seleccionar etiquetas...'}
        </Text>
      </Pressable>

      {value.length > 0 && (
        <View style={styles.selectedRow}>
          {value.map((tag) => (
            <Badge key={tag} label={tag} variant="solid" />
          ))}
        </View>
      )}

      <Sheet visible={open} onClose={() => setOpen(false)} title="Etiquetas">
        <TextField
          icon={Search}
          placeholder="Buscar etiquetas..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        <BottomSheetFlatList
          data={filteredTags}
          keyExtractor={(tag) => tag}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: tag }) => {
            const selected = value.includes(tag)
            return (
              <Pressable onPress={() => toggleTag(tag)} style={styles.item}>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: theme.colors.primary,
                      backgroundColor: selected ? theme.colors.primary : 'transparent',
                    },
                  ]}
                >
                  {selected ? <Check size={12} color="#fff" /> : null}
                </View>
                <Text style={[styles.itemText, { color: theme.colors.foreground, fontFamily: theme.fontFamily.regular }]}>
                  {tag}
                </Text>
              </Pressable>
            )
          }}
        />
        <Button title="Listo" onPress={() => setOpen(false)} style={{ marginTop: 8 }} />
      </Sheet>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerText: {
    fontSize: 14,
  },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  list: {
    maxHeight: 360,
    marginTop: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 14,
  },
})
