import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Path, Polyline, Stop } from 'react-native-svg'

import { useTheme } from '@/theme'
import type { WeightEntry } from '@/lib/profile'
import { MONTH_LABELS } from './ActivityHeatmap'

const CHART_HEIGHT = 140
const PADDING_TOP = 20
const PADDING_BOTTOM = 22

function shortDate(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  return `${date.getUTCDate()} ${MONTH_LABELS[date.getUTCMonth()]}`
}

// Gráfica de peso — antes un sparkline mudo (solo la línea, sin nodos ni
// valores). Cada registro es un nodo real con su fecha (weight_logs guarda
// weight_kg + logged_at por fila, ver migración
// 20260820_0001_extend_user_profile.sql), así que acá se dibujan todos:
// círculo por punto, relleno degradado debajo de la línea, mín/máx en el
// eje y fecha del primer/último registro. Sin librería de charts, react-
// native-svg a mano — mismo criterio que ActivityHeatmap.tsx.
export function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const theme = useTheme()
  // fetchWeightHistory trae desc (más reciente primero) — acá se invierte
  // para dibujar en orden cronológico, izquierda→derecha.
  const chronological = useMemo(() => [...entries].reverse(), [entries])

  const chart = useMemo(() => {
    if (chronological.length < 2) return null

    const weights = chronological.map((e) => e.weightKg)
    const rawMin = Math.min(...weights)
    const rawMax = Math.max(...weights)
    // Si todos los registros pesan lo mismo, el rango sería 0 y la línea
    // quedaría pegada al borde — se infla artificialmente para que la
    // gráfica tenga altura.
    const min = rawMin
    const max = rawMin === rawMax ? rawMin + 1 : rawMax
    const range = max - min || 1
    const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM
    const stepX = 100 / (chronological.length - 1)

    const points = chronological.map((entry, i) => ({
      x: i * stepX,
      y: PADDING_TOP + (1 - (entry.weightKg - min) / range) * plotHeight,
      entry,
    }))

    const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ')
    const areaPath = `M${points[0].x},${CHART_HEIGHT - PADDING_BOTTOM} L${points
      .map((p) => `${p.x},${p.y}`)
      .join(' L')} L${points[points.length - 1].x},${CHART_HEIGHT - PADDING_BOTTOM} Z`

    return { points, linePoints, areaPath, min, max }
  }, [chronological])

  if (!chart) return null

  const last = chart.points[chart.points.length - 1]
  const first = chart.points[0]

  return (
    <View style={styles.wrapper}>
      <View style={{ height: CHART_HEIGHT }}>
        <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 100 ${CHART_HEIGHT}`} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.colors.primary} stopOpacity={0.35} />
              <Stop offset="1" stopColor={theme.colors.primary} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          <Path d={chart.areaPath} fill="url(#weightFill)" stroke="none" />
          <Polyline
            points={chart.linePoints}
            fill="none"
            stroke={theme.colors.primary}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {chart.points.map((p, i) => {
            const isLast = i === chart.points.length - 1
            return (
              <Circle
                key={p.entry.id}
                cx={p.x}
                cy={p.y}
                r={isLast ? 3.2 : 2}
                fill={isLast ? theme.colors.primary : theme.colors.background}
                stroke={theme.colors.primary}
                strokeWidth={isLast ? 0 : 1.4}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </Svg>

        {/* Mín/máx sobre el eje y las fechas del primer/último registro
            debajo — Text de RN posicionado encima del SVG en vez de <SvgText>
            (más simple de alinear con la tipografía del resto de la app). */}
        <Text
          style={[styles.axisLabel, styles.axisTop, { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium }]}
        >
          {chart.max.toFixed(1)} kg
        </Text>
        <Text
          style={[
            styles.axisLabel,
            styles.axisBottom,
            { color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.medium },
          ]}
        >
          {chart.min.toFixed(1)} kg
        </Text>
        <Text
          style={[
            styles.dateLabel,
            { left: `${first.x}%`, color: theme.colors.mutedForeground, fontFamily: theme.fontFamily.regular },
          ]}
        >
          {shortDate(first.entry.loggedAt)}
        </Text>
        <Text
          style={[
            styles.dateLabel,
            styles.dateLabelRight,
            { color: theme.colors.foreground, fontFamily: theme.fontFamily.semibold },
          ]}
        >
          {shortDate(last.entry.loggedAt)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  axisLabel: {
    position: 'absolute',
    left: 0,
    fontSize: 10,
  },
  axisTop: {
    top: 0,
  },
  axisBottom: {
    bottom: PADDING_BOTTOM - 12,
  },
  dateLabel: {
    position: 'absolute',
    bottom: 0,
    fontSize: 11,
  },
  dateLabelRight: {
    right: 0,
  },
})
