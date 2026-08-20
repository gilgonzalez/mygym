import { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Activity, Compass, Swords, User } from 'lucide-react-native'

import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/session'
import { fetchUserProfile, type UserProfile } from '@/lib/profile'
import { useTheme } from '@/theme'
import { FluidTabs, type FluidTabOption } from '@/components/ui'
import { AccountTab, ActivityTab, ProfileTopHeader, StatsTab, WorkoutsTab } from '@/components/profile'

// Perfil autenticado — versión mobile de src/app/(app)/profile/page.tsx
// (apps/web), reestructurada en 2 franjas fijas en vez de una sola pantalla
// larga con scroll (la web mete todo — identidad, stats, workouts, heatmap,
// atributos, logout — en una sola página):
//   - Header (ProfileTopHeader.tsx): avatar (dispara el menú contextual de
//     cuenta, ver AccountMenu.tsx — ahí vive "Cerrar sesión", como último
//     item) + nombre + switcher de tema.
//   - Content: el tab de abajo seleccionado con FluidTabs (fondo verde que
//     se desliza al tab activo, ver ui/FluidTabs.tsx) — Cuenta (nivel/XP/
//     stats, antes vivía siempre visible arriba), Workouts (los del
//     usuario, filtrados por visibilidad), Actividad (heatmap + historial
//     con scroll infinito) y Stats (medallas + atributos RPG).
// Ya no hay un footer fijo con el botón de logout (aprovecha mejor el alto
// de pantalla) — cada tab de Content tiene su propia lista/ScrollView.
type ProfileTab = 'account' | 'workouts' | 'activity' | 'stats'

const CONTENT_TABS: FluidTabOption<ProfileTab>[] = [
  { value: 'account', label: 'Cuenta', icon: User },
  { value: 'workouts', label: 'Workouts', icon: Compass },
  { value: 'activity', label: 'Actividad', icon: Activity },
  { value: 'stats', label: 'Stats', icon: Swords },
]

export default function ProfileScreen() {
  const theme = useTheme()
  const { session } = useSession()
  // Garantizado por el guard del layout raíz — esta pantalla no se monta sin
  // sesión.
  const user = session!.user

  const [activeTab, setActiveTab] = useState<ProfileTab>('account')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  const loadProfile = useCallback(() => {
    fetchUserProfile(user.id)
      .then(setProfile)
      .catch(() => {
        // Si falla, el tab Cuenta se queda con los skeletons — no bloquea
        // el resto de la pantalla (los otros tabs no dependen de esto).
      })
      .finally(() => setLoading(false))
  }, [user.id])

  // useFocusEffect (no useEffect) para que el perfil se refresque solo al
  // volver de "Editar información" (ver AccountMenu.tsx → app/edit-profile.tsx):
  // esa pantalla es un push encima de este stack, así que este componente
  // nunca se desmonta — un useEffect común solo correría una vez, al entrar
  // la primera vez al tab. `loading` arranca en true y nunca vuelve a
  // ponerse en true acá, así que los refetch por refoco no hacen parpadear
  // los skeletons — actualizan `profile` calladitos de fondo.
  useFocusEffect(
    useCallback(() => {
      loadProfile()
    }, [loadProfile])
  )

  const handleLogout = async () => {
    setLoggingOut(true)
    // No hace falta redirigir a mano: useSession() (ver lib/session.tsx)
    // recibe el evento SIGNED_OUT y el guard del layout raíz saca solo al
    // usuario del grupo autenticado.
    await supabase.auth.signOut()
    setLoggingOut(false)
  }

  const displayName = profile?.name || user.email || 'Entusiasta del Gym'
  const usernameOrEmail = profile?.username ? `@${profile.username}` : user.email ?? ''

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <ProfileTopHeader
        displayName={displayName}
        usernameOrEmail={usernameOrEmail}
        avatarUrl={profile?.avatarUrl}
        loggingOut={loggingOut}
        onLogout={handleLogout}
      />

      <View style={styles.content}>
        <View style={styles.tabs}>
          {/* scrollable: 4 labels con ícono no entran cómodos en un ancho de
              iPhone chico (ver iPhone 16e) — mismo criterio que el filtro de
              visibilidad de WorkoutsTab.tsx. */}
          <FluidTabs options={CONTENT_TABS} value={activeTab} onChange={setActiveTab} scrollable />
        </View>

        <View style={styles.fill}>
          {activeTab === 'account' && <AccountTab profile={profile} loading={loading} />}
          {activeTab === 'workouts' && <WorkoutsTab userId={user.id} />}
          {activeTab === 'activity' && <ActivityTab userId={user.id} />}
          {activeTab === 'stats' && <StatsTab attributes={profile?.stats.attributes ?? null} />}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabs: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
})
