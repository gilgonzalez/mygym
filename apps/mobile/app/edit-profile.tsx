import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import { ChevronLeft } from 'lucide-react-native'

import { FITNESS_GOALS } from '@mygym/shared'
import { useSession } from '@/lib/session'
import { fetchUserProfile, updateUserProfile } from '@/lib/profile'
import { useTheme } from '@/theme'
import { Badge, FormError, TextArea, TextField } from '@/components/ui'

const DEFAULT_BIRTH_DATE = new Date(2000, 0, 1)

// Pantalla completa de edición (no un sheet: son bastantes campos) para los
// datos de perfil nuevos — se llega acá desde el menú de cuenta → "Editar
// información" (ver AccountMenu.tsx). El peso NO se edita acá: tiene su
// propio atajo rápido en el tab Cuenta (LogWeightSheet), porque es un dato
// que se carga seguido, no algo que se completa una vez.
export default function EditProfileScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { session } = useSession()
  const user = session!.user

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [birthDate, setBirthDate] = useState<string | null>(null)
  const [heightCm, setHeightCm] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [achievements, setAchievements] = useState('')

  useEffect(() => {
    fetchUserProfile(user.id)
      .then((profile) => {
        setName(profile.name ?? '')
        setBio(profile.bio ?? '')
        setBirthDate(profile.birthDate)
        setHeightCm(profile.heightCm != null ? String(profile.heightCm) : '')
        setGoals(profile.goals)
        setAchievements(profile.achievements ?? '')
      })
      .catch((err: any) => setError(err?.message ?? 'No se pudo cargar tu perfil'))
      .finally(() => setLoading(false))
  }, [user.id])

  const toggleGoal = (goal: string) => {
    setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const parsedHeight = heightCm.trim() ? Number(heightCm.replace(',', '.')) : null
    if (parsedHeight != null && (Number.isNaN(parsedHeight) || parsedHeight <= 0)) {
      setError('La altura tiene que ser un número válido')
      setSaving(false)
      return
    }

    try {
      await updateUserProfile(user.id, {
        name: name.trim() || null,
        bio: bio.trim() || null,
        birthDate,
        heightCm: parsedHeight,
        goals,
        achievements: achievements.trim() || null,
      })
      router.back()
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo guardar tu perfil')
      setSaving(false)
    }
  }

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
          Editar información
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

      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormError message={error} />

          <Field label="Nombre">
            <TextField value={name} onChangeText={setName} placeholder="Tu nombre" editable={!loading} />
          </Field>

          <Field label="Bio">
            <TextArea value={bio} onChangeText={setBio} placeholder="Contá algo sobre vos" editable={!loading} minHeight={80} />
          </Field>

          <Field label="Fecha de nacimiento">
            <DateTimePicker
              value={birthDate ? new Date(birthDate) : DEFAULT_BIRTH_DATE}
              mode="date"
              maximumDate={new Date()}
              onChange={(_event, date) => {
                if (date) setBirthDate(date.toISOString().slice(0, 10))
              }}
            />
          </Field>

          <Field label="Altura (cm)">
            <TextField
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="178"
              keyboardType="numeric"
              editable={!loading}
            />
          </Field>

          <Field label="Metas">
            <View style={styles.goalsGrid}>
              {FITNESS_GOALS.map((goal) => {
                const selected = goals.includes(goal)
                return (
                  <Pressable key={goal} onPress={() => toggleGoal(goal)} disabled={loading}>
                    <Badge label={goal} variant={selected ? 'solid' : 'outline'} />
                  </Pressable>
                )
              })}
            </View>
          </Field>

          <Field label="Logros">
            <TextArea
              value={achievements}
              onChangeText={setAchievements}
              placeholder="Tus logros más importantes"
              editable={!loading}
              minHeight={80}
            />
          </Field>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useTheme()
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]}>
        {label}
      </Text>
      {children}
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
    minWidth: 60,
    textAlign: 'right',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  content: {
    padding: 16,
    gap: 18,
    paddingBottom: 40,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
})
