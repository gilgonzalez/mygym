module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    // Requerido por react-native-reanimated (dependencia de expo-router para
    // las transiciones del stack nativo). Tiene que ser el último plugin.
    plugins: ['react-native-reanimated/plugin'],
  }
}
