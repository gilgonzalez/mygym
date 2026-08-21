import { StyleSheet } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'

// Wrapper fino sobre el botón nativo de Apple. A diferencia de GoogleButton
// (maquetado a mano, ver GoogleButton.tsx), Apple exige que "Sign in with
// Apple" use su propio componente con uno de sus estilos oficiales (HIG) —
// no se puede clonar a mano sin arriesgar el rechazo en review. Solo se
// monta en iOS (ver login.tsx), así que este archivo no necesita chequear
// Platform.OS.
interface AppleButtonProps {
  onPress: () => void
  disabled?: boolean
}

export function AppleButton({ onPress, disabled = false }: AppleButtonProps) {
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
      cornerRadius={24}
      style={[styles.button, disabled && styles.disabled]}
      onPress={disabled ? () => {} : onPress}
    />
  )
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 48,
  },
  disabled: {
    opacity: 0.6,
  },
})
