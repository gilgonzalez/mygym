import { useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

import { useTheme } from '@/theme'

// Avatar con fallback a inicial + gradiente cuando no hay avatar_url o falla
// la carga — antes vivía duplicado dentro de WorkoutCard, ahora es el único
// lugar que resuelve esa lógica (feed, perfil, comentarios, etc.). `ring`
// agrega el anillo fino con glow verde (estética HUD del resto de la app).
interface AvatarProps {
  uri?: string | null
  name?: string | null
  size?: number
  ring?: boolean
}

export function Avatar({ uri, name, size = 36, ring = true }: AvatarProps) {
  const theme = useTheme()
  const [failed, setFailed] = useState(false)
  const initial = (name || 'U').trim().charAt(0).toUpperCase()
  const dimension = { width: size, height: size, borderRadius: size / 2 }

  const content =
    uri && !failed ? (
      <Image source={{ uri }} style={dimension} onError={() => setFailed(true)} />
    ) : (
      <LinearGradient colors={theme.gradients.primaryButton} style={[dimension, styles.fallback]}>
        <Text style={[styles.initial, { fontSize: size * 0.42, fontFamily: theme.fontFamily.bold }]}>{initial}</Text>
      </LinearGradient>
    )

  if (!ring) return content

  return (
    <View
      style={[
        styles.ring,
        {
          width: size + 4,
          height: size + 4,
          borderRadius: (size + 4) / 2,
          borderColor: theme.colors.glowBorder,
          shadowColor: theme.colors.primary,
        },
      ]}
    >
      {content}
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#fff',
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
})
