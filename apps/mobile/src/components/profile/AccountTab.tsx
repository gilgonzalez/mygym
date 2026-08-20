import { useCallback, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Award, Cake, Flame, Plus, Ruler, Scale, Target, Timer, Trophy, User } from 'lucide-react-native'

import { calculateAge, formatDuration, type StreakStatus } from '@mygym/shared'
import { useTheme } from '@/theme'
import { Badge, Button } from '@/components/ui'
import { deleteWeightEntry, fetchWeightHistory, type UserProfile, type WeightEntry } from '@/lib/profile'
import { LogWeightSheet } from './LogWeightSheet'
import { ProfileSection } from './ProfileSection'
import { StatCard } from './StatCard'
import { StatCardSkeleton } from './StatCardSkeleton'
import { WeightChart } from './WeightChart'
import { WeightHistoryList } from './WeightHistoryList'
import { XPBar } from './XPBar'
import { XPBarSkeleton } from './XPBarSkeleton'

interface AccountTabProps {
  profile: UserProfile | null
  loading: boolean
}

const STREAK_STATUS_META: Record<StreakStatus, { label: string; color: string }> = {
  active_today: { label: 'Entrenaste hoy', color: '#f59e0b' },
  at_risk: { label: 'En riesgo — entrená hoy', color: '#f97316' },
  broken: { label: 'Se cortó', color: '#a1a1aa' },
  none: { label: 'Arrancá tu racha', color: '#a1a1aa' },
}

// Tab "Cuenta" del perfil: nivel/XP/racha, y toda la info personal nueva
// (bio, edad, altura, peso con historial, metas, logros — ver migración
// 20260820_0001_extend_user_profile.sql) que antes no existía en ningún
// lado del perfil. Es de solo lectura a propósito: la edición vive en el
// menú de cuenta → "Editar información" (ver AccountMenu.tsx y
// app/edit-profile.tsx), salvo el registro de peso, que tiene su propio
// atajo acá mismo (LogWeightSheet) porque es algo que se carga seguido, no
// un dato que se edita una vez y ya.
export function AccountTab({ profile, loading }: AccountTabProps) {
  const theme = useTheme()
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([])
  const [weightLoading, setWeightLoading] = useState(true)
  const [logWeightVisible, setLogWeightVisible] = useState(false)

  const loadWeight = useCallback(() => {
    if (!profile) return
    setWeightLoading(true)
    fetchWeightHistory(profile.id)
      .then(setWeightHistory)
      // Sección de peso vacía si falla — no bloquea el resto del tab.
      .catch(() => {})
      .finally(() => setWeightLoading(false))
  }, [profile])

  useEffect(() => {
    loadWeight()
  }, [loadWeight])

  const handleDeleteWeight = (id: string) => {
    // Optimista: la fila desaparece al toque en vez de esperar el
    // round-trip — es un registro puntual, si el delete falla en el
    // servidor el próximo loadWeight() (foco de la pantalla) la vuelve a
    // traer, no queda desincronizado para siempre.
    setWeightHistory((prev) => prev.filter((entry) => entry.id !== id))
    deleteWeightEntry(id).catch(() => loadWeight())
  }

  if (loading || !profile) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <XPBarSkeleton />
        <View style={styles.statsRow}>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </View>
      </ScrollView>
    )
  }

  const age = calculateAge(profile.birthDate)
  const streakStatus = STREAK_STATUS_META[profile.stats.streakInfo.status]
  const totalTimeLabel = formatDuration(profile.stats.totalMinutes * 60)
  const latestWeight = weightHistory[0] ?? null

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.progressSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
          Tu progreso
        </Text>
        <XPBar
          level={profile.stats.level}
          currentXp={profile.stats.currentXp}
          nextLevelXp={profile.stats.nextLevelXp}
          rankTitle={profile.stats.rankTitle}
        />

        <View style={styles.statsRow}>
          <StatCard
            icon={Flame}
            label="Racha de días"
            value={profile.stats.streakInfo.current}
            color={streakStatus.color}
          />
          <StatCard icon={Trophy} label="Workouts" value={profile.stats.totalWorkouts} color="#0ea5e9" />
          <StatCard icon={Timer} label="Tiempo total" value={totalTimeLabel} color={theme.colors.emerald} />
        </View>
        <Text style={[styles.streakCaption, { color: streakStatus.color, fontFamily: theme.fontFamily.semibold }]}>
          {streakStatus.label}
          {profile.stats.streakLongest > 0 ? (
            <Text style={{ color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }}>
              {' '}
              · Récord: {profile.stats.streakLongest} días
            </Text>
          ) : null}
        </Text>
      </View>

      <ProfileSection icon={User} title="Sobre mí">
        {profile.bio ? (
          <Text style={[styles.bio, { color: theme.colors.foreground, fontFamily: theme.fontFamily.regular }]}>
            {profile.bio}
          </Text>
        ) : (
          <EmptyHint text="Todavía no agregaste una bio." />
        )}

        <View style={styles.factsRow}>
          <FactChip icon={Cake} label={age != null ? `${age} años` : 'Sin edad'} />
          <FactChip icon={Ruler} label={profile.heightCm ? `${profile.heightCm} cm` : 'Sin altura'} />
        </View>
      </ProfileSection>

      <ProfileSection
        icon={Scale}
        title="Peso"
        action={
          <Button
            title="Registrar"
            icon={Plus}
            size="sm"
            fullWidth={false}
            onPress={() => setLogWeightVisible(true)}
          />
        }
      >
        {weightLoading ? null : weightHistory.length > 0 ? (
          <>
            <Text style={[styles.weightValue, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>
              {latestWeight?.weightKg} kg
            </Text>
            <WeightChart entries={weightHistory} />
            <WeightHistoryList entries={weightHistory} onDelete={handleDeleteWeight} />
          </>
        ) : (
          <EmptyHint text="Todavía no registraste tu peso." />
        )}
      </ProfileSection>

      <ProfileSection icon={Target} title="Metas">
        {profile.goals.length > 0 ? (
          <View style={styles.factsRow}>
            {profile.goals.map((goal) => (
              <Badge key={goal} label={goal} variant="soft" />
            ))}
          </View>
        ) : (
          <EmptyHint text="Todavía no definiste tus metas." />
        )}
      </ProfileSection>

      <ProfileSection icon={Award} title="Logros">
        {profile.achievements ? (
          <Text style={[styles.bio, { color: theme.colors.foreground, fontFamily: theme.fontFamily.regular }]}>
            {profile.achievements}
          </Text>
        ) : (
          <EmptyHint text="Todavía no cargaste tus logros." />
        )}
      </ProfileSection>

      <LogWeightSheet
        visible={logWeightVisible}
        onClose={() => setLogWeightVisible(false)}
        userId={profile.id}
        lastWeightKg={latestWeight?.weightKg ?? null}
        onLogged={loadWeight}
      />
    </ScrollView>
  )
}

function FactChip({ icon: Icon, label }: { icon: typeof Cake; label: string }) {
  const theme = useTheme()
  return (
    <View
      style={[styles.factChip, { backgroundColor: theme.colors.secondary, borderRadius: theme.radius.full }]}
    >
      <Icon size={13} color={theme.colors.mutedForeground} />
      <Text style={[styles.factChipText, { color: theme.colors.foreground, fontFamily: theme.fontFamily.medium }]}>
        {label}
      </Text>
    </View>
  )
}

function EmptyHint({ text }: { text: string }) {
  const theme = useTheme()
  return (
    <Text style={[styles.emptyHint, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular }]}>
      {text}
    </Text>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },
  progressSection: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  streakCaption: {
    fontSize: 12,
    textAlign: 'center',
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
  },
  factsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  factChipText: {
    fontSize: 12,
  },
  weightValue: {
    fontSize: 22,
  },
  emptyHint: {
    fontSize: 13,
  },
})
