import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Brain, Footprints, Shield, Swords, type LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/theme'
import type { UserAttributes } from '@/lib/profile'
import { AttributeBar } from './AttributeBar'
import { MedalsPlaceholder } from './MedalsPlaceholder'

interface StatsTabProps {
  attributes: UserAttributes | null
}

const ATTRIBUTE_CONFIG: { key: keyof UserAttributes; label: string; icon: LucideIcon; color: string }[] = [
  { key: 'strength', label: 'Fuerza', icon: Swords, color: '#dc2626' },
  { key: 'agility', label: 'Agilidad', icon: Footprints, color: '#2563eb' },
  { key: 'endurance', label: 'Resistencia', icon: Shield, color: '#16a34a' },
  { key: 'wisdom', label: 'Sabiduría', icon: Brain, color: '#9333ea' },
]

// Tab "Stats" del perfil: medallas (placeholder, ver MedalsPlaceholder.tsx) +
// atributos RPG — puerto de la columna derecha ("Stats") de
// src/components/profile/ActivityHeatmap.tsx (apps/web).
export function StatsTab({ attributes }: StatsTabProps) {
  const theme = useTheme()

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <MedalsPlaceholder />

      <View style={styles.attributesSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
          Atributos
        </Text>
        <View style={styles.attributesGrid}>
          {ATTRIBUTE_CONFIG.map(({ key, label, icon, color }) => (
            <AttributeBar key={key} icon={icon} label={label} level={attributes?.[key] ?? 0} color={color} />
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 24,
  },
  attributesSection: {
    gap: 10,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
  },
})
