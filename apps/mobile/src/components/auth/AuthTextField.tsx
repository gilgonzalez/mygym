import { forwardRef } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

// Input "glass" para los forms de auth — mismo layout que ui/TextField.tsx
// pero con colores fijos (blanco translúcido) en vez de theme.colors: estas
// pantallas viven siempre sobre el fondo oscuro de <AuthBackground>, sin
// importar el tema claro/oscuro del resto de la app.
interface AuthTextFieldProps extends TextInputProps {
  icon?: LucideIcon
  error?: string
}

export const AuthTextField = forwardRef<TextInput, AuthTextFieldProps>(function AuthTextField(
  { icon: Icon, error, style, ...props },
  ref
) {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, error && styles.containerError]}>
        {Icon && <Icon size={17} color="rgba(255,255,255,0.5)" style={styles.icon} />}
        <TextInput ref={ref} placeholderTextColor="rgba(255,255,255,0.45)" style={[styles.input, style]} {...props} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  containerError: {
    borderColor: '#f87171',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    color: '#fafafa',
    fontSize: 15,
  },
  error: {
    fontSize: 12,
    color: '#f87171',
  },
})
