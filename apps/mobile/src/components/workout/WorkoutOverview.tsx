import { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Clock, Play, Target, Trophy, Wrench } from 'lucide-react-native'

import { visibilityLabelMap, type WorkoutVisibility } from '@mygym/shared'
import { useTheme } from '@/theme'
import { Badge, Card } from '@/components/ui'
import type { WorkoutDetail } from '@/lib/workouts'
import { DifficultyBadge } from './DifficultyBadge'
import { WorkoutSectionAccordion } from './WorkoutSectionAccordion'

// Puerto de src/components/workout/WorkoutOverview.tsx (apps/web, 700+
// líneas). Se deja afuera a propósito, para cuando se aborden esas features
// puntuales:
// - Diálogo de login (acá no hace falta: esta pantalla solo es alcanzable
//   ya logueado, no hay link público sin sesión como en la web).
// - Compartir (ShareWorkoutDialog) y preview de ejercicio con tutorial
//   (ExercisePreviewDialog) — por eso ExerciseListItem se usa sin `onPress`.
// - "Continuar sesión" (hasActiveSession/onResume) — todavía no hay un
//   store de sesión activa en mobile (ver Timer.tsx/SetRow.tsx: las piezas
//   de ejecución ya existen, falta la pantalla que las orqueste).
// - El fallback de thumbnail con imágenes de Unsplash según el nombre del
//   ejercicio (regex larga en la web) — acá un ícono simple alcanza
//   (ExerciseListItem ya lo resuelve).
interface WorkoutOverviewProps {
  workout: WorkoutDetail
  onStart: () => void
  onBack: () => void
}

// Tags controlados (ver packages/shared/src/workout-tags.ts — WORKOUT_TAGS),
// no texto libre como en la web: match exacto contra el catálogo alcanza,
// no hace falta la heurística por regex de formatCategoryFromTags.
const CATEGORY_BY_TAG: Record<string, string> = {
  Hipertrofia: 'Hipertrofia',
  Bodybuilding: 'Hipertrofia',
  GVT: 'Hipertrofia',
  Cardio: 'Cardio',
  HIIT: 'Cardio',
  Tabata: 'Cardio',
  LISS: 'Cardio',
  Carrera: 'Cardio',
  Ciclismo: 'Cardio',
  Movilidad: 'Movilidad',
  Yoga: 'Movilidad',
  Pilates: 'Movilidad',
  Flexibilidad: 'Movilidad',
  Resistencia: 'Resistencia',
  Fondo: 'Resistencia',
  Hyrox: 'Resistencia',
  Fuerza: 'Fuerza',
  Powerlifting: 'Fuerza',
  Strongman: 'Fuerza',
  Halterofilia: 'Fuerza',
}

function getWorkoutCategory(tags: string[]): string {
  for (const tag of tags) {
    const category = CATEGORY_BY_TAG[tag]
    if (category) return category
  }
  return 'Fuerza'
}

export function WorkoutOverview({ workout, onStart, onBack }: WorkoutOverviewProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [coverFailed, setCoverFailed] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const hasCover = Boolean(workout.cover) && !coverFailed

  let totalSeconds = 0
  let totalExercises = 0
  const muscleGroups = new Set<string>()
  const equipment = new Set<string>()

  for (const section of workout.sections) {
    for (const ex of section.exercises) {
      totalExercises += 1
      const sets = ex.sets || 1
      const timePerSet = ex.duration > 0 ? ex.duration : 45
      totalSeconds += (timePerSet + ex.rest) * sets
      ex.muscle_groups.forEach((m) => muscleGroups.add(m))
      ex.equipment.forEach((e) => equipment.add(e))
    }
  }

  const durationMinutes = Math.max(1, Math.round(totalSeconds / 60))
  const category = getWorkoutCategory(workout.tags)
  const privacy = visibilityLabelMap[(workout.visibility as WorkoutVisibility) ?? 'public'] ?? 'Publico'
  const challengeSectionIndex = workout.sections.findIndex((s) => s.id === workout.challenge?.challengeSectionId)
  const challengeMinutes = workout.challenge ? Math.max(1, Math.round(workout.challenge.timeCapSeconds / 60)) : undefined

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {hasCover ? (
            <Image source={{ uri: workout.cover! }} style={StyleSheet.absoluteFill} onError={() => setCoverFailed(true)} />
          ) : (
            <LinearGradient colors={theme.gradients.coverFallback} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient colors={['rgba(5,6,8,0.15)', 'rgba(5,6,8,0.92)']} style={StyleSheet.absoluteFill} />
          <View style={[styles.heroContent, { paddingTop: insets.top + 44 }]}>
            <Text style={[styles.heroEyebrow, { color: '#c4b5fd', fontFamily: theme.fontFamily.bold }]}>WORKOUT</Text>
            <Text style={[styles.heroTitle, { fontFamily: theme.fontFamily.bold }]} numberOfLines={2}>
              {workout.title}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.pillsRow}>
            <View style={styles.pillGroup}>
              <Text style={[styles.pillLabel, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.bold }]}>
                Categoría
              </Text>
              <Badge label={category} color={theme.colors.emerald} />
            </View>
            <View style={styles.pillGroup}>
              <Text style={[styles.pillLabel, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.bold }]}>
                Nivel
              </Text>
              <DifficultyBadge difficulty={workout.difficulty} />
            </View>
            <View style={styles.pillGroup}>
              <Text style={[styles.pillLabel, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.bold }]}>
                Privacidad
              </Text>
              <Badge label={privacy} color="#a78bfa" />
            </View>
          </View>

          <View style={[styles.durationChip, { backgroundColor: theme.colors.secondary, borderRadius: theme.radius.lg }]}>
            <Clock size={15} color={theme.colors.mutedForeground} />
            <Text style={[styles.durationChipText, { color: theme.colors.foreground, fontFamily: theme.fontFamily.semibold }]}>
              {durationMinutes} min · {totalExercises} ejercicio{totalExercises === 1 ? '' : 's'}
            </Text>
          </View>

          <View style={styles.infoCards}>
            <InfoTagCard
              icon={Target}
              iconColor="#fb923c"
              title="Músculos objetivo"
              items={Array.from(muscleGroups)}
              emptyLabel="Sin datos — derivados del workout"
              tagColor="#fb923c"
            />
            <InfoTagCard
              icon={Wrench}
              iconColor="#38bdf8"
              title="Material necesario"
              items={Array.from(equipment)}
              emptyLabel="Sin datos — peso corporal por defecto"
              tagColor="#38bdf8"
            />
          </View>

          {workout.description.trim().length > 0 && (
            <Card glow={false} style={styles.descriptionCard}>
              <Text style={[styles.cardTitle, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.bold }]}>
                Notas del entrenamiento
              </Text>
              <Text style={[styles.descriptionText, { color: theme.colors.foreground, fontFamily: theme.fontFamily.medium }]}>
                {workout.description}
              </Text>
            </Card>
          )}

          <View style={styles.sections}>
            {workout.sections.map((section, idx) => (
              <WorkoutSectionAccordion
                key={section.id}
                index={idx}
                section={section}
                expanded={expandedIndex === idx}
                onToggle={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                isChallengeSection={challengeSectionIndex === idx}
                challengeMinutes={challengeMinutes}
              />
            ))}
          </View>

          {workout.challenge && (
            <View
              style={[
                styles.challengeBanner,
                { borderRadius: theme.radius.card, borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.08)' },
              ]}
            >
              <View style={[styles.challengeIcon, { backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: theme.radius.lg }]}>
                <Trophy size={20} color="#f59e0b" />
              </View>
              <View style={styles.challengeText}>
                <Text style={[styles.challengeLabel, { color: '#f59e0b', fontFamily: theme.fontFamily.bold }]}>
                  Modo reto incluido
                </Text>
                <Text style={[styles.challengeDescription, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
                  Reto AMRAP · {challengeMinutes ?? 12} min · Score: rondas + reps extra
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={onBack}
        hitSlop={10}
        style={[styles.backButton, { top: insets.top + 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: theme.radius.xl }]}
      >
        <ChevronLeft size={22} color="#fff" />
      </Pressable>

      <View
        style={[
          styles.ctaBar,
          { paddingBottom: insets.bottom + 12, backgroundColor: theme.colors.background, borderTopColor: theme.colors.border },
        ]}
      >
        <Pressable onPress={onStart} style={styles.ctaPressable}>
          <LinearGradient
            colors={theme.gradients.primaryButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaButton, { borderRadius: theme.radius.xl }]}
          >
            <Play size={20} color="#fff" fill="#fff" />
            <Text style={[styles.ctaText, { fontFamily: theme.fontFamily.bold }]}>Empezar entrenamiento</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  )
}

function InfoTagCard({
  icon: Icon,
  iconColor,
  title,
  items,
  emptyLabel,
  tagColor,
}: {
  icon: typeof Target
  iconColor: string
  title: string
  items: string[]
  emptyLabel: string
  tagColor: string
}) {
  const theme = useTheme()
  return (
    <Card glow={false} style={styles.infoCard}>
      <View style={styles.infoCardHeader}>
        <View style={[styles.infoCardIcon, { backgroundColor: `${iconColor}26`, borderRadius: theme.radius.md }]}>
          <Icon size={15} color={iconColor} />
        </View>
        <Text style={[styles.cardTitle, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.bold }]}>
          {title}
        </Text>
      </View>
      {items.length === 0 ? (
        <Text style={[styles.infoCardEmpty, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]}>
          {emptyLabel}
        </Text>
      ) : (
        <View style={styles.infoCardTags}>
          {items.map((item) => {
            const label = item.replace(/_/g, ' ').trim()
            return <Badge key={item} label={label.charAt(0).toUpperCase() + label.slice(1)} color={tagColor} />
          })}
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
  },
  hero: {
    height: 210,
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  heroEyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 24,
    color: '#fff',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  pillGroup: {
    gap: 6,
  },
  pillLabel: {
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  durationChipText: {
    fontSize: 13,
  },
  infoCards: {
    gap: 12,
  },
  infoCard: {
    padding: 14,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  infoCardIcon: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardEmpty: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  infoCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTitle: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  descriptionCard: {
    padding: 16,
    gap: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 21,
  },
  sections: {
    gap: 12,
  },
  challengeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 14,
  },
  challengeIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeText: {
    flex: 1,
  },
  challengeLabel: {
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  challengeDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaPressable: {
    width: '100%',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
  },
  ctaText: {
    fontSize: 16,
    color: '#fff',
  },
})
