import { forwardRef } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useTheme } from '@/theme'

// Puerto de src/components/ui/input.tsx. `pill` cubre el caso del buscador
// del feed (rounded-full); por default usa el radius "lg" de los forms de
// auth/creación.
interface TextFieldProps extends TextInputProps {
  icon?: LucideIcon
  error?: string
  pill?: boolean
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { icon: Icon, error, pill = false, style, ...props },
  ref
) {
  const theme = useTheme()

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            borderRadius: pill ? theme.radius.full : theme.radius.lg,
            borderColor: error ? theme.colors.destructive : theme.colors.border,
            backgroundColor: theme.colors.card,
          },
        ]}
      >
        {Icon && <Icon size={17} color={theme.colors.mutedForeground} style={styles.icon} />}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.mutedForeground}
          style={[
            styles.input,
            { color: theme.colors.foreground, fontFamily: theme.fontFamily.regular, fontSize: theme.fontSize.base },
            style,
          ]}
          {...props}
        />
      </View>
      {error ? (
        <Text style={[styles.error, { color: theme.colors.destructive, fontFamily: theme.fontFamily.regular }]}>
          {error}
        </Text>
      ) : null}
    </View>
  )
})

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  error: {
    fontSize: 12,
  },
})
