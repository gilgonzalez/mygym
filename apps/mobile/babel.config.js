module.exports = function (api) {
  api.cache(true)
  return {
    // babel-preset-expo (SDK 57) ya agrega el plugin de worklets/reanimated
    // automáticamente al detectar `react-native-worklets` entre las
    // dependencias — NO declararlo de nuevo acá. Antes se agregaba a mano
    // como `plugins: ['react-native-reanimated/plugin']`, pero con
    // Reanimated 4 ese plugin es solo un re-export de
    // `react-native-worklets/plugin`, así que quedaba aplicado DOS veces
    // sobre el mismo código: eso rompía en silencio las animaciones/gestos
    // basados en worklets (sin error de compilación) — entre ellas el
    // present()/pan-gesture de @gorhom/bottom-sheet, que es por lo que el
    // sheet de comentarios no abría al tocar el botón.
    presets: ['babel-preset-expo'],
  }
}
