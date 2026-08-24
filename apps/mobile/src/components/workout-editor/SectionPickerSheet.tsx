import { FlatList, Pressable, StyleSheet, Text } from 'react-native'
import { Check } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { Sheet } from '@/components/ui'

// Sheet chico para elegir a qué sección mover un ejercicio — necesario
// porque react-native-draggable-flatlist no soporta arrastrar un item entre
// dos listas independientes (a diferencia de @hello-pangea/dnd en la web,
// que sí permite soltar en otro Droppable). En vez de simular ese gesto acá
// (nested DraggableFlatList tienen conflictos de gestos conocidos, ver
// formHelpers.ts / SectionList), mover entre secciones es una acción
// explícita — el botón de flechas en ExerciseInstanceRow abre esto.
interface SectionOption {
  key: string
  name: string
}

interface SectionPickerSheetProps {
  visible: boolean
  onClose: () => void
  sections: SectionOption[]
  currentSectionKey: string
  onSelect: (sectionKey: string) => void
}

export function SectionPickerSheet({ visible, onClose, sections, currentSectionKey, onSelect }: SectionPickerSheetProps) {
  const theme = useTheme()

  return (
    <Sheet visible={visible} onClose={onClose} title="Mover a otra sección">
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          const isCurrent = item.key === currentSectionKey
          return (
            <Pressable
              disabled={isCurrent}
              onPress={() => {
                onSelect(item.key)
                onClose()
              }}
              style={[styles.row, { borderColor: theme.colors.border }]}
            >
              <Text
                style={[
                  styles.name,
                  { color: isCurrent ? theme.colors.mutedForeground : theme.colors.foreground, fontFamily: theme.fontFamily.medium },
                ]}
              >
                {item.name || 'Sección sin nombre'}
              </Text>
              {isCurrent ? <Check size={16} color={theme.colors.primary} /> : null}
            </Pressable>
          )
        }}
      />
    </Sheet>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: {
    fontSize: 14,
  },
})
