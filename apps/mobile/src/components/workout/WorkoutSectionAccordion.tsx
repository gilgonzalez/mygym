import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { ChevronRight, Zap } from 'lucide-react-native'

import { useTheme } from '@/theme'
import { Badge, Card } from '@/components/ui'
import type { WorkoutDetailSection } from '@/lib/workouts'
import { ExerciseListItem } from './ExerciseListItem'

// Fila expandible de una sección dentro de WorkoutOverview — separado en su
// propio archivo porque la animación (rotar el chevron + abrir/cerrar el
// cuerpo) necesita react-native-reanimated de verdad, no solo un
// `transform` estático como tenía antes.
//
// Dos animaciones combinadas, ambas con reanimated:
// - El chevron rota con un shared value (`progress`) manejado a mano —
//   necesita interpolar un ángulo exacto, no algo que FadeIn/Layout resuelvan.
// - El cuerpo (lista de ejercicios) entra/sale con FadeIn/FadeOut, y el
//   <Animated.View> raíz de todo el componente lleva `layout={LinearTransition}`.
//   Con eso alcanza para que el alto se anime solo: no hace falta medir el
//   contenido a mano (onLayout + interpolar height, la forma "clásica" de
//   animar un acordeón) — Reanimated ve que este componente cambió de alto
//   entre renders y lo interpola. Como CADA sección usa este mismo
//   componente, las de abajo (que no cambiaron de alto, solo de posición)
//   también lo animan solas, así que toda la lista se reacomoda junta en
//   vez de "saltar".
//
// Abrir y cerrar usan duraciones distintas a propósito: abrir es rápido
// (reacciona al toque), cerrar es más lento y con una curva más suave — un
// cierre a la misma velocidad que el toque de apertura se sentía brusco.
const OPEN_DURATION = 220
const CLOSE_DURATION = 380

// Mismo criterio que sectionGradientPalette en WorkoutOverview.tsx (apps/web):
// un color de acento por sección, rotando por índice, para diferenciarlas
// de un vistazo en vez de que todas se vean iguales. La web arma un
// degradé "from-X via-transparent to-transparent" — acá alcanza con
// degradé de 2 stops del color al transparente, mismo efecto visual (el
// "to-Y" de la web quedaba pisado por el "to-transparent" que se agrega
// después, así que en la práctica ahí tampoco se ve un segundo color).
const SECTION_ACCENT_COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4']

interface WorkoutSectionAccordionProps {
  index: number
  section: WorkoutDetailSection
  expanded: boolean
  onToggle: () => void
  isChallengeSection?: boolean
  challengeMinutes?: number
}

export function WorkoutSectionAccordion({
  index,
  section,
  expanded,
  onToggle,
  isChallengeSection = false,
  challengeMinutes,
}: WorkoutSectionAccordionProps) {
  const theme = useTheme()
  const progress = useSharedValue(expanded ? 1 : 0)
  const accentColor = SECTION_ACCENT_COLORS[index % SECTION_ACCENT_COLORS.length]

  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, {
      duration: expanded ? OPEN_DURATION : CLOSE_DURATION,
      easing: expanded ? Easing.out(Easing.cubic) : Easing.out(Easing.quad),
    })
  }, [expanded, progress])

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 90}deg` }],
  }))

  return (
    <Animated.View layout={LinearTransition.duration(expanded ? OPEN_DURATION : CLOSE_DURATION)}>
      <Card glow={false} style={styles.card}>
        <Pressable onPress={onToggle} style={styles.header}>
          <LinearGradient
            colors={[accentColor, `${accentColor}00`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.index, { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: theme.radius.full }]}>
            <Text style={[styles.indexText, { color: '#fff', fontFamily: theme.fontFamily.bold }]}>{index + 1}</Text>
          </View>

          <View style={styles.headerText}>
            <Text style={[styles.name, { fontFamily: theme.fontFamily.bold }]} numberOfLines={1}>
              {section.name}
            </Text>
            <Text style={[styles.meta, { fontFamily: theme.fontFamily.medium }]}>
              {section.exercises.length} ejercicio{section.exercises.length === 1 ? '' : 's'}
            </Text>
          </View>

          {isChallengeSection && <Badge label={`AMRAP ${challengeMinutes ?? 12}MIN`} icon={Zap} color="#f59e0b" />}

          <Animated.View style={chevronStyle}>
            <ChevronRight size={18} color="rgba(255,255,255,0.75)" />
          </Animated.View>
        </Pressable>

        {expanded && (
          <Animated.View
            entering={FadeIn.duration(OPEN_DURATION)}
            exiting={FadeOut.duration(CLOSE_DURATION)}
            style={styles.body}
          >
            {section.exercises.map((ex) => (
              <ExerciseListItem
                key={ex.id}
                name={ex.name}
                thumbnailUrl={ex.thumbnail_url}
                type={ex.type}
                reps={ex.reps}
                duration={ex.duration}
                sets={ex.sets}
                restSeconds={ex.rest}
              />
            ))}
          </Animated.View>
        )}
      </Card>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    overflow: 'hidden',
  },
  index: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 14,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    color: '#fff',
  },
  meta: {
    fontSize: 11,
    marginTop: 2,
    color: 'rgba(255,255,255,0.65)',
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
})
