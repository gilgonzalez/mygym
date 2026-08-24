import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter'

import { ThemeProvider, useTheme } from '@/theme'
import { SessionProvider, useSession } from '@/lib/session'
import { Splash } from '@/components/Splash'

// Misma tipografía que la web (Inter, ver src/app/layout.tsx) y mismo
// esquema de colores por sistema (ver theme/ThemeProvider.tsx). Se mantiene
// visible el splash nativo hasta que la fuente termina de cargar para no
// mostrar un frame con la tipografía default del sistema.
SplashScreen.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Convertidos localmente desde @fontsource/dseg7-classic (woff2 → ttf,
    // ver assets/fonts/DSEG7Classic-LICENSE.txt) porque expo-font solo carga
    // ttf/otf. Usada por components/workout/Timer.tsx.
    'DSEG7Classic-Regular': require('../assets/fonts/DSEG7Classic-Regular.ttf'),
    'DSEG7Classic-Bold': require('../assets/fonts/DSEG7Classic-Bold.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {})
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <ThemeProvider>
      <SessionProvider>
        <RootLayoutContent />
      </SessionProvider>
    </ThemeProvider>
  )
}

function RootLayoutContent() {
  const theme = useTheme()
  // El splash nativo (config plugin en app.json) solo existe en un build
  // standalone; en Expo Go y en dev lo único que se ve con marca es este
  // <Splash> en JS, montado por encima del stack hasta que termina su
  // animación de entrada/salida (ver components/Splash.tsx).
  const [showSplash, setShowSplash] = useState(true)

  return (
    // GestureHandlerRootView: lo pide react-native-gesture-handler para que
    // los pan gestures (drag-to-dismiss del BottomSheet, swipe-back del
    // stack) funcionen. BottomSheetModalProvider monta el portal donde
    // @gorhom/bottom-sheet renderiza los sheets — sin esto un <Sheet> nested
    // dentro de una card en un FlatList quedaría recortado por el overflow
    // de sus padres (ver ui/Sheet.tsx). SafeAreaProvider es lo que le da a
    // useSafeAreaInsets()/al tab bar de app/(tabs)/_layout.tsx los insets
    // reales del dispositivo (notch/Dynamic Island en iOS, status+nav bar en
    // Android) — sin este provider en la raíz, esos hooks devuelven 0.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
            <RootNavigator />
            {showSplash && <Splash onFinish={() => setShowSplash(false)} />}
          </View>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

// Separado de RootLayoutContent para que el spinner de "cargando sesión" no
// dispare un remount del resto del árbol (GestureHandlerRootView,
// SafeAreaProvider, BottomSheetModalProvider) cada vez que `loading` cambia.
function RootNavigator() {
  const theme = useTheme()
  const { session, loading } = useSession()

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {/* Autenticado: el tab bar (feed/perfil, ver app/(tabs)/_layout.tsx —
          agregar una ruta nueva ahí es tocar ese archivo, no este) más las
          pantallas de ejecución que se abren por encima de él, sin tab bar. */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="session/[id]" />
        <Stack.Screen name="workout/[id]" />
        <Stack.Screen name="workout-editor/[id]" />
        <Stack.Screen name="edit-profile" />
      </Stack.Protected>

      {/* Sin sesión: solo login vive acá. forgot-password/reset-password
          quedan registradas siempre (abajo), fuera de los dos grupos —
          reset-password arranca sin sesión pero exchangeCodeForSession la
          crea a mitad de camino (ver comentario en ese archivo); si
          viviera solo en este grupo, el guard cambiaría de golpe apenas se
          resuelve el código y el router la sacaría de encima antes de que
          el usuario llegue a elegir la contraseña nueva. */}
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
      </Stack.Protected>

      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
