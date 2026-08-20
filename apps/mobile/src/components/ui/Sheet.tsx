import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  useBottomSheetInternal,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { X } from 'lucide-react-native'

import { useTheme } from '@/theme'

// Bottom sheet real, no uno hecho a mano: @gorhom/bottom-sheet arriba de
// react-native-gesture-handler + reanimated (las dos ya eran dependencias
// del proyecto). Esto da drag-to-dismiss nativo de verdad — arrastrás hacia
// abajo y se cierra con inercia — que un Modal + Animated.View propio no
// replica bien. Requiere <GestureHandlerRootView> y <BottomSheetModalProvider>
// en la raíz (ver app/_layout.tsx).
//
// La API de afuera se mantiene igual que la versión anterior (visible/
// onClose/title/children/fullHeight) para no tocar los consumidores
// (CommentsSheet, TagSelector) — solo cambiaron las tripas.
interface SheetProps {
  visible: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  // Panel a una altura fija (85%) para contenido con scroll interno largo
  // (listas paginadas) en vez de achicarse/agrandarse según el contenido.
  fullHeight?: boolean
}

export function Sheet({ visible, onClose, title, children, fullHeight = false }: SheetProps) {
  const theme = useTheme()
  const sheetRef = useRef<BottomSheetModal>(null)
  // Si nunca se presentó, no hay nada que descartar — y llamar dismiss()
  // en el montaje inicial (visible arranca en false) rompe el sheet para
  // SIEMPRE: @gorhom/bottom-sheet@5 deja el status interno del modal
  // trabado en DISMISSING (bottomSheetRef todavía no existe, así que el
  // close nunca "completa" y nunca pasa a DISMISSED), y con status
  // DISMISSING el próximo present() actualiza el estado de React pero el
  // guard interno de la librería bloquea el render del portal — el sheet
  // queda invisible para siempre aunque present()/el estado de visible
  // sean correctos. Por eso hacía falta este flag.
  const hasPresented = useRef(false)
  // Mismo problema, otro disparador: cuando el USUARIO cierra el sheet
  // (swipe, tap en el backdrop) @gorhom/bottom-sheet@5 ya se está cerrando
  // solo y dispara onDismiss → handleDismiss → onClose → el padre pasa
  // visible a false → este efecto corre de nuevo y llamaba a dismiss() por
  // segunda vez sobre un sheet que ya se estaba cerrando. Ese dismiss()
  // redundante deja el status trabado en DISMISSING igual que el caso de
  // arriba, y el sheet no vuelve a abrir nunca más. dismissedBySheet marca
  // que el cierre ya vino del propio sheet para que el efecto no lo repita.
  const dismissedBySheet = useRef(false)

  useEffect(() => {
    if (visible) {
      hasPresented.current = true
      sheetRef.current?.present()
    } else if (hasPresented.current && !dismissedBySheet.current) {
      sheetRef.current?.dismiss()
    }
    dismissedBySheet.current = false
  }, [visible])

  const handleDismiss = useCallback(() => {
    dismissedBySheet.current = true
    onClose()
  }, [onClose])

  const snapPoints = useMemo(() => (fullHeight ? ['85%'] : undefined), [fullHeight])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} pressBehavior="close" />
    ),
    []
  )

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={!fullHeight}
      enablePanDownToClose
      // onDismiss cubre TODAS las formas de cerrarlo (arrastrar, tocar el
      // backdrop, .dismiss() programático) — así el `visible` del padre
      // siempre queda sincronizado, sin importar quién lo cerró. Pasa por
      // handleDismiss (no onClose directo) para marcar dismissedBySheet y
      // que el efecto de arriba no dispare un dismiss() redundante.
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.colors.card }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border, width: 36 }}
    >
      <SheetPanel fullHeight={fullHeight} title={title} onClose={onClose}>
        {children}
      </SheetPanel>
    </BottomSheetModal>
  )
}

interface SheetPanelProps {
  fullHeight: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
}

// View común, no BottomSheetView: BottomSheetView y BottomSheetFlatList/
// BottomSheetScrollView comparten el mismo registro interno de "cuál es el
// scrollable activo" (useScrollableSetter → animatedScrollableState, un
// solo valor, no una pila). Si envolvemos un BottomSheetFlatList (ver
// CommentsSheet, TagSelector) dentro de un BottomSheetView, el efecto del
// BottomSheetView (padre) corre después del de la lista (hijo — los efectos
// de React corren de adentro hacia afuera) y pisa ese registro con "no hay
// nada scrolleable, es contenido estático" — la lista queda sin poder
// scrollear.
//
// Pero BottomSheetView tenía UN segundo trabajo, aparte de ese registro:
// reportar el alto real del contenido para enableDynamicSizing (su propio
// onLayout llama a animatedLayoutState.modify). Sacarlo del todo (como
// quedó en el fix del scroll) resuelve el conflicto pero rompe ese segundo
// trabajo para cualquier <Sheet> con contenido SIN scrollable propio — por
// ejemplo el sheet de detalle de ejercicio en ExecutionView (solo texto +
// badges, sin FlatList): con enableDynamicSizing y contentHeight sin
// reportar nunca, @gorhom/bottom-sheet no le da altura al panel — queda
// montado pero invisible (0px), y el backdrop se queda tapando touches para
// siempre.
//
// Por eso este panel replica SOLO la mitad de BottomSheetView que hace
// falta (el onLayout → animatedLayoutState), sin la otra mitad
// (useScrollableSetter) que causaba el conflicto — un View normal con
// onLayout no compite por el registro de "cuál es el scrollable activo",
// así que sigue siendo seguro para CommentsSheet/TagSelector.
function SheetPanel({ fullHeight, title, onClose, children }: SheetPanelProps) {
  const theme = useTheme()
  const { enableDynamicSizing, animatedLayoutState } = useBottomSheetInternal()

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!enableDynamicSizing) return
      const height = event.nativeEvent.layout.height
      animatedLayoutState.modify((state) => {
        'worklet'
        state.contentHeight = height
        return state
      })
    },
    [enableDynamicSizing, animatedLayoutState]
  )

  return (
    <View onLayout={handleLayout} style={[styles.content, fullHeight && styles.contentFullHeight]}>
      {title ? (
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.foreground, fontFamily: theme.fontFamily.bold }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={20} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>
      ) : null}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  contentFullHeight: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
  },
})
