import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Compass, User, type LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/theme'

// Único lugar donde se define qué tabs existen — para sumar una ruta nueva
// al bottom tab alcanza con crear app/(tabs)/<nombre>.tsx y agregar una
// entrada acá; no hace falta tocar nada más de navegación.
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
      {TABS.map(({ name, title, icon: Icon }) => (
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
