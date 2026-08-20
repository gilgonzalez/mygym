import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { darkColors, gradients, lightColors, type ThemeColors } from './colors'
import { radius } from './radius'
import { spacing } from './spacing'
import { fontFamily, fontSize } from './typography'

export type ThemeMode = 'system' | 'light' | 'dark'

export interface Theme {
  scheme: 'light' | 'dark'
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  colors: ThemeColors
  gradients: typeof gradients
  radius: typeof radius
  spacing: typeof spacing
  fontFamily: typeof fontFamily
  fontSize: typeof fontSize
}

const ThemeContext = createContext<Theme | null>(null)

// Storage key propio del namespace de la app — sigue la misma AsyncStorage
// que ya usa el cliente de Supabase (ver src/lib/supabase.ts).
const MODE_STORAGE_KEY = 'mygym.themeMode'

// Igual que next-themes en la web (ModeSwitcher.tsx): por default sigue el
// esquema del sistema operativo; si el usuario elige manualmente claro u
// oscuro, esa preferencia se guarda y prevalece hasta que la cambie de
// nuevo. "system" no se persiste como tal — solo se persiste una elección
// explícita (ver setMode).
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light'
  const [mode, setModeState] = useState<ThemeMode>('system')

  useEffect(() => {
    AsyncStorage.getItem(MODE_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setModeState(stored)
    })
  }, [])

  const setMode = (next: ThemeMode) => {
    setModeState(next)
    if (next === 'system') {
      AsyncStorage.removeItem(MODE_STORAGE_KEY).catch(() => {})
    } else {
      AsyncStorage.setItem(MODE_STORAGE_KEY, next).catch(() => {})
    }
  }

  const scheme = mode === 'system' ? systemScheme : mode

  const theme = useMemo<Theme>(
    () => ({
      scheme,
      mode,
      setMode,
      colors: scheme === 'dark' ? darkColors : lightColors,
      gradients,
      radius,
      spacing,
      fontFamily,
      fontSize,
    }),
    [scheme, mode]
  )

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme() tiene que usarse dentro de <ThemeProvider>')
  return ctx
}
