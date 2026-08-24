import { View } from 'react-native'

// Ruta "fantasma": tiene que existir como screen del Tabs para que el botón
// del medio del tab bar sea una entrada válida de la navegación (ver
// _layout.tsx, CreateTabButton), pero nunca se monta contenido real acá —
// el botón intercepta el press y navega directo a /workout-editor/new en
// vez de dejar que el tab navigator cambie a esta pantalla.
export default function CreateWorkoutTabPlaceholder() {
  return <View />
}
