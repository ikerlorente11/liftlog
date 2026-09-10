// Gráficas ligeras con react-native-svg: línea (progreso de un ejercicio) y
// barras (entrenos por semana / volumen).
import { useState } from 'react'
import { LayoutChangeEvent, Text, View } from 'react-native'
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg'
import { useColors } from '../theme'

export function LineChart({ points, height = 180, formatY = (v) => String(Math.round(v)), formatX = () => '' }: {
  points: { x: number; y: number }[]; height?: number; formatY?: (v: number) => string; formatX?: (x: number, i: number) => string
}) {
  const c = useColors()
  const [w, setW] = useState(0)
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)
  const padL = 44, padR = 12, padT = 12, padB = 24
  const iw = Math.max(0, w - padL - padR), ih = height - padT - padB
  if (points.length === 0) {
    return <View onLayout={onLayout} style={{ height, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.textMuted }}>Sin datos todavía</Text></View>
  }
  const ys = points.map((p) => p.y)
  let minY = Math.min(...ys), maxY = Math.max(...ys)
  if (minY === maxY) { minY = minY * 0.9; maxY = maxY * 1.1 || 1 }
  const span = maxY - minY
  const xs = points.map((_, i) => (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw) + padL)
  const yOf = (v: number) => padT + ih - ((v - minY) / span) * ih
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xs[i]} ${yOf(p.y)}`).join(' ')
  const ticks = [minY, minY + span / 2, maxY]
  const labelEvery = Math.max(1, Math.ceil(points.length / 5))
  return (
    <View onLayout={onLayout} style={{ height }}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          {ticks.map((t, i) => (
            <Line key={i} x1={padL} x2={w - padR} y1={yOf(t)} y2={yOf(t)} stroke={c.border} strokeWidth={1} />
          ))}
          {ticks.map((t, i) => (
            <SvgText key={'l' + i} x={padL - 6} y={yOf(t) + 4} fill={c.textMuted} fontSize={10} textAnchor="end">{formatY(t)}</SvgText>
          ))}
          <Path d={d} stroke={c.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <Circle key={i} cx={xs[i]} cy={yOf(p.y)} r={points.length > 40 ? 2 : 4} fill={c.primary} stroke={c.card} strokeWidth={1.5} />
          ))}
          {points.map((p, i) => (i % labelEvery === 0 || i === points.length - 1) ? (
            <SvgText key={'x' + i} x={xs[i]} y={height - 6} fill={c.textMuted} fontSize={10} textAnchor="middle">{formatX(p.x, i)}</SvgText>
          ) : null)}
        </Svg>
      ) : null}
    </View>
  )
}

/**
 * Varias series en la misma gráfica, distinguidas por color. A diferencia de
 * LineChart (que reparte los puntos por índice), aquí el eje X es la fecha real:
 * es la única forma de que dos series con fechas distintas queden alineadas.
 */
export function MultiLineChart({ series, height = 190, formatY = (v) => String(Math.round(v)), formatX = () => '' }: {
  series: { label: string; color: string; points: { x: number; y: number }[] }[]
  height?: number; formatY?: (v: number) => string; formatX?: (x: number) => string
}) {
  const c = useColors()
  const [w, setW] = useState(0)
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)
  const padL = 44, padR = 12, padT = 12, padB = 24
  const iw = Math.max(0, w - padL - padR), ih = height - padT - padB
  const all = series.flatMap((s) => s.points)
  if (all.length === 0) {
    return <View onLayout={onLayout} style={{ height, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.textMuted }}>Sin datos todavía</Text></View>
  }
  const ys = all.map((p) => p.y)
  let minY = Math.min(...ys), maxY = Math.max(...ys)
  if (minY === maxY) { minY = minY * 0.98; maxY = maxY * 1.02 || 1 }
  const spanY = maxY - minY
  const xsAll = all.map((p) => p.x)
  const minX = Math.min(...xsAll), maxX = Math.max(...xsAll)
  const spanX = maxX - minX
  // Con una sola fecha (o todas iguales) centramos para no dividir por cero.
  const xOf = (v: number) => padL + (spanX === 0 ? iw / 2 : ((v - minX) / spanX) * iw)
  const yOf = (v: number) => padT + ih - ((v - minY) / spanY) * ih
  const ticks = [minY, minY + spanY / 2, maxY]
  const dotR = all.length > 40 ? 2.5 : 4
  return (
    <View onLayout={onLayout}>
      <View style={{ height }}>
        {w > 0 ? (
          <Svg width={w} height={height}>
            {ticks.map((t, i) => (
              <Line key={i} x1={padL} x2={w - padR} y1={yOf(t)} y2={yOf(t)} stroke={c.border} strokeWidth={1} />
            ))}
            {ticks.map((t, i) => (
              <SvgText key={'l' + i} x={padL - 6} y={yOf(t) + 4} fill={c.textMuted} fontSize={10} textAnchor="end">{formatY(t)}</SvgText>
            ))}
            {series.map((s) => {
              const pts = [...s.points].sort((a, b) => a.x - b.x)
              const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.x)} ${yOf(p.y)}`).join(' ')
              return (
                <G key={s.label}>
                  {pts.length > 1 ? <Path d={d} stroke={s.color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
                  {pts.map((p, i) => (
                    <Circle key={i} cx={xOf(p.x)} cy={yOf(p.y)} r={dotR} fill={s.color} stroke={c.card} strokeWidth={1.5} />
                  ))}
                </G>
              )
            })}
            {[minX, ...(spanX > 0 ? [maxX] : [])].map((x, i) => (
              <SvgText key={'x' + i} x={xOf(x)} y={height - 6} fill={c.textMuted} fontSize={10} textAnchor={spanX === 0 ? 'middle' : i === 0 ? 'start' : 'end'}>{formatX(x)}</SvgText>
            ))}
          </Svg>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', paddingTop: 2 }}>
        {series.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
            <Text style={{ color: c.textMuted, fontSize: 12 }}>{s.label}{s.points.length ? '' : ' (sin datos)'}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export function BarChart({ bars, height = 160, highlightLast = true, formatY = (v) => String(v) }: {
  bars: { label: string; value: number }[]; height?: number; highlightLast?: boolean; formatY?: (v: number) => string
}) {
  const c = useColors()
  const [w, setW] = useState(0)
  const padT = 18, padB = 22, padL = 8, padR = 8
  const iw = Math.max(0, w - padL - padR), ih = height - padT - padB
  const max = Math.max(1, ...bars.map((b) => b.value))
  const bw = bars.length ? iw / bars.length : 0
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height }}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          {bars.map((b, i) => {
            const h = (b.value / max) * ih
            const x = padL + i * bw + bw * 0.2
            const y = padT + ih - h
            const active = highlightLast && i === bars.length - 1
            return (
              <G key={i}>
                <Rect x={x} y={y} width={bw * 0.6} height={Math.max(h, b.value > 0 ? 2 : 0)} rx={4} fill={active ? c.primary : c.textFaint} />
                {b.value > 0 ? <SvgText x={x + bw * 0.3} y={y - 4} fill={c.textMuted} fontSize={10} textAnchor="middle">{formatY(b.value)}</SvgText> : null}
                <SvgText x={x + bw * 0.3} y={height - 6} fill={c.textMuted} fontSize={10} textAnchor="middle">{b.label}</SvgText>
              </G>
            )
          })}
        </Svg>
      ) : null}
    </View>
  )
}


/**
 * Barras de evolución al estilo del informe "Evolutivo" de la nutricionista:
 * una barra por medición con el valor encima y, debajo del valor, la
 * diferencia respecto a la medición anterior (+1,3 / -0,2). La última barra va
 * en el color de la medida y las anteriores en una versión apagada. El eje
 * empieza cerca del mínimo para que las diferencias pequeñas se vean.
 *
 * Sin SVG a propósito: en Android cada <Text> de react-native-svg es una vista
 * nativa con su propio layout y, con ~25 por gráfica y una decena de gráficas
 * en pantalla, el scroll de Evolución iba a tirones. Con View + Text normales
 * la lista se mueve fluida.
 */
export function DeltaBarChart({ bars, color, height = 170, formatY = (v) => String(v), formatDelta, goodDirection }: {
  bars: { label: string; value: number; sub?: string }[]; color: string; height?: number
  formatY?: (v: number) => string; formatDelta?: (d: number) => string
  /** Sentido "bueno" del cambio; sin él la diferencia va en gris. */
  goodDirection?: 'up' | 'down'
}) {
  const c = useColors()
  const hasSub = bars.some((b) => b.sub)
  // Espacio reservado encima de la barra más alta para valor, sub y diferencia.
  const padT = hasSub ? 46 : 34, padB = 22
  const ih = height - padT - padB
  const values = bars.map((b) => b.value)
  const max = Math.max(...values, 0), min = Math.min(...values, 0)
  // Base del eje: un poco por debajo del mínimo (nunca por debajo de 0) para
  // que una serie casi plana siga mostrando las diferencias.
  const span = Math.max(max - min, Math.abs(max) * 0.05, 0.1)
  const base = Math.max(0, min - span * 0.6)
  const top = max + span * 0.15
  const scale = (v: number) => ((v - base) / Math.max(top - base, 0.001)) * ih
  const fmtDelta = formatDelta ?? ((d: number) => `${d > 0 ? '+' : ''}${Math.round(d * 10) / 10}`.replace('.', ','))
  return (
    <View style={{ height, flexDirection: 'row', paddingHorizontal: 8 }}>
      {/* Línea base del eje */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 8, right: 8, bottom: padB, height: 1, backgroundColor: c.border }} />
      {bars.map((b, i) => {
        const h = Math.max(scale(b.value), 2)
        const last = i === bars.length - 1
        const delta = i > 0 ? b.value - bars[i - 1].value : null
        const good = delta != null && goodDirection ? (goodDirection === 'up' ? delta > 0 : delta < 0) : null
        const deltaColor = delta == null || delta === 0 || good == null ? c.textMuted : good ? c.success : c.danger
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
              <Text numberOfLines={1} style={{ color: c.text, fontSize: 12, fontWeight: '700', lineHeight: 14 }}>{formatY(b.value)}</Text>
              {b.sub ? <Text numberOfLines={1} style={{ color: c.textMuted, fontSize: 9, lineHeight: 12 }}>{b.sub}</Text> : null}
              {delta != null ? <Text numberOfLines={1} style={{ color: deltaColor, fontSize: 10, fontWeight: '600', lineHeight: 13, marginBottom: 3 }}>{fmtDelta(delta)}</Text> : <View style={{ height: 6 }} />}
              <View style={{ width: '64%', height: h, borderRadius: 5, backgroundColor: color, opacity: last ? 1 : 0.38 }} />
            </View>
            <Text numberOfLines={1} style={{ color: c.textMuted, fontSize: 10, lineHeight: padB, height: padB }}>{b.label}</Text>
          </View>
        )
      })}
    </View>
  )
}
