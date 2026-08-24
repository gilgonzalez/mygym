import { router, Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Pressable, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Compass, Plus, User, type LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/theme'

// Único lugar donde se define qué tabs existen — para sumar una ruta nueva
// al bottom tab alcanza con crear app/(tabs)/<nombre>.tsx y agregar una
// entrada acá; no hace falta tocar nada más de navegación.
//
// "create-workout" es un tab fantasma en el medio (ver create-workout.tsx):
// no tiene contenido propio, su tabBarButton reemplaza el botón default por
// uno elevado tipo FAB que navega directo a /workout-editor/new — mismo
// patrón que Instagram/TikTok para la acción de "crear" en el centro del
// tab bar, en vez de un ítem más que compite con Feed/Perfil.
const TABS: { name: string; title: string; icon: LucideIcon }[] = [
  { name: 'index', title: 'Feed', icon: Compass },
  { name: 'profile', title: 'Perfil', icon: User },
]

export default function TabsLayout() {
  const theme = useTheme()
  // @react-navigation/bottom-tabs ya suma esto solo al alto del tab bar,
  // pero solo si SafeAreaProvider está montado en la raíz (ver
  // app/_layout.tsx) — acá lo leemos de nuevo nomás para el ítem activo, no
  // hace falta pasarlo a mano a tabBarStyle.
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 48 + insets.bottom,
          paddingTop: 2,
          paddingBottom: insets.bottom,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fontFamily.medium,
          fontSize: 11,
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        key="index"
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="create-workout"
        options={{
          title: '',
          tabBarButton: () => <CreateWorkoutTabButton />,
        }}
      />

      {TABS.slice(1).map(({ name, title, icon: Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size }) => <Icon color={color} size={size} />,
          }}
        />
      ))}
    </Tabs>
  )
}

function CreateWorkoutTabButton() {
  const theme = useTheme()

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Pressable onPress={() => router.push('/workout-editor/new')} hitSlop={10} style={styles.pressable}>
        <LinearGradient
          colors={theme.gradients.primaryButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, { borderColor: theme.colors.background }]}
        >
          <Plus size={26} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  )
}

const BUTTON_SIZE = 52

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pressable: {
    // Sube el botón por encima del tab bar, como el FAB central de
    // Instagram/TikTok en vez de quedar alineado con los otros dos ítems.
    marginBottom: 14,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
})
