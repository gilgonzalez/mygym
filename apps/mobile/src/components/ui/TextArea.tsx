import { forwardRef } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'

import { useTheme } from '@/theme'

// Puerto de src/components/form/TextArea.tsx — para descripciones largas
// (workout, bio de perfil, notas de un log).
interface TextAreaProps extends TextInputProps {
  error?: string
  minHeight?: number
}

export const TextArea = forwardRef<TextInput, TextAreaProps>(function TextArea(
  { error, minHeight = 96, style, ...props },
  ref
) {
  const theme = useTheme()

  return (
    <View style={styles.wrapper}>
      <TextInput
        ref={ref}
        multiline
        textAlignVertical="top"
        placeholderTextColor={theme.colors.mutedForeground}
        style={[
          styles.input,
          {
            minHeight,
            borderRadius: theme.radius.lg,
            borderColor: error ? theme.colors.destructive : theme.colors.border,
            backgroundColor: theme.colors.card,
            color: theme.colors.foreground,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.base,
          },
          style,
        ]}
        {...props}
      />
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
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: {
    fontSize: 12,
  },
})
