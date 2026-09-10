// Evolución de las medidas con diferencias, al estilo del informe "Evolutivo"
// de la nutricionista: para cada medida, una barra por medición con el valor y
// el cambio respecto a la anterior. Se elige el origen (nutricionista o
// báscula de casa) porque mezclar los dos en la misma barra engañaría: la
// diferencia útil es entre mediciones del mismo aparato.
//
// Rendimiento: puede haber ~20 tarjetas, cada una con una gráfica SVG de
// decenas de nodos. Para que la pantalla abra fluida, (1) los datos de cada
// tarjeta se precalculan una vez en un useMemo, (2) la lista es un FlatList que
// pinta pocas tarjetas por lote, (3) no se monta hasta que termina la
// animación de entrada (InteractionManager) y (4) DeltaBarChart es flexbox
// puro, sin SVG, que en Android era lo que hacía pesado el scroll.
import { useRouter } from 'expo-router'
import { memo, useEffect, useMemo, useState } from 'react'
import { FlatList, InteractionManager, Pressable, StyleSheet, Text, View } from 'react-native'
import { DeltaBarChart } from '../../src/components/Charts'
import { fmtDateShort, fmtDayMonth, toDisplayWeight } from '../../src/lib/format'
import { MEASUREMENT_COLOR, MEASUREMENT_GOOD_DIRECTION } from '../../src/lib/labels'
import { GROUP_INFO, type FieldGroup, type MeasurementConfig, fieldLabel, fieldUnit, isMassField, isPercentOfWeightField, sourceLabel, visibleFields, visibleSources } from '../../src/lib/measurementConfig'
import { composition, weightNear } from '../../src/lib/measurements'
import { useData } from '../../src/store/dataStore'
import { useSettings } from '../../src/store/settingsStore'
import { useColors } from '../../src/theme'
import type { Measurement, MeasurementSource } from '../../src/types'
import { Card, Header, HeaderButton, Icon, Screen } from '../../src/ui/primitives'

const MAX_BARS = 6

const fmt1 = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',')

/** Todo lo que necesita una tarjeta, calculado una vez fuera del render. */
interface CardItem {
  kind: 'card'
  key: string
  title: string
  color: string
  good?: 'up' | 'down'
  unit: string
  weightUnit: string
  pct: boolean
  compKey: boolean
  last: { value: number; kg: number | null; pctV: number | null }
  dLast: number | null
  dTotal: number | null
  firstLabel: string
  bars: { label: string; value: number; sub?: string }[]
  total: number
  skipped: number
}
interface HeaderItem { kind: 'header'; key: string; group: FieldGroup }
type Item = CardItem | HeaderItem

function buildItems(cfg: MeasurementConfig, measurements: Measurement[], source: MeasurementSource, asPercent: boolean, weightUnit: 'kg' | 'lb'): { items: Item[]; lastDate: number } {
  // Por medida, las mediciones del origen elegido en orden cronológico.
  const byKey = new Map<string, Measurement[]>()
  for (const m of measurements) {
    if ((m.source ?? 'home') !== source) continue
    const arr = byKey.get(m.key) ?? []
    arr.push(m)
    byKey.set(m.key, arr)
  }
  let lastDate = 0
  for (const arr of byKey.values()) {
    arr.sort((a, b) => a.date - b.date)
    lastDate = Math.max(lastDate, arr[arr.length - 1]?.date ?? 0)
  }
  // Pesos del origen, para derivar % sin recorrer todas las medidas cada vez.
  const weights = measurements.filter((m) => m.key === 'weight' && (m.source ?? 'home') === source)
  const dispKg = (v: number) => Math.round(toDisplayWeight(v, weightUnit) * 10) / 10

  const items: Item[] = []
  for (const group of ['composition', 'perimeter'] as FieldGroup[]) {
    const cards: CardItem[] = []
    for (const f of visibleFields(cfg, group)) {
      const everything = byKey.get(f.key)
      if (!everything?.length) continue
      const compKey = isPercentOfWeightField(cfg, f.key)
      const pct = asPercent && compKey
      // Composición: cada medición tiene % y kg; el que no está guardado se deriva del
      // peso del mismo origen de ese día. Sin peso comparable (evolutivos antiguos) la
      // medición solo existe en su unidad guardada y se queda fuera del otro modo.
      const points = everything
        .map((m) => {
          if (!compKey) return { m, value: (isMassField(cfg, f.key) ? dispKg(m.value) : m.value) as number | null, kg: null as number | null, pctV: null as number | null }
          const comp = composition(f.key, m.value, weightNear(weights, source, m.date))
          const kg = comp.kg == null ? null : dispKg(comp.kg)
          return { m, value: pct ? comp.pct : kg, kg, pctV: comp.pct }
        })
        .filter((x): x is { m: Measurement; value: number; kg: number | null; pctV: number | null } => x.value != null)
      if (!points.length) continue
      const list = points.slice(-MAX_BARS)
      const last = list[list.length - 1]
      const prev = list.length > 1 ? list[list.length - 2] : null
      const first = list[0]
      // Si la serie cruza de un año a otro, la etiqueta lleva el año para no confundir "28 ago" de 2025 con 2026.
      const multiYear = new Date(first.m.date).getFullYear() !== new Date(last.m.date).getFullYear()
      const label = (d: number) => (multiYear ? `${fmtDayMonth(d)} ${String(new Date(d).getFullYear()).slice(2)}` : fmtDayMonth(d))
      cards.push({
        kind: 'card',
        key: f.key,
        title: fieldLabel(cfg, f.key),
        color: MEASUREMENT_COLOR[f.key] ?? (group === 'composition' ? '#3d8bff' : '#b86bff'),
        good: MEASUREMENT_GOOD_DIRECTION[f.key],
        unit: pct ? '%' : fieldUnit(cfg, f.key, weightUnit),
        weightUnit,
        pct,
        compKey,
        last: { value: last.value, kg: last.kg, pctV: last.pctV },
        dLast: prev ? last.value - prev.value : null,
        dTotal: list.length > 1 ? last.value - first.value : null,
        firstLabel: label(first.m.date),
        bars: list.map((x) => ({
          label: label(x.m.date),
          value: Math.round(x.value * 10) / 10,
          sub: pct ? (x.kg != null ? `(${fmt1(x.kg)} ${weightUnit})` : undefined) : compKey && x.pctV != null ? `(${fmt1(x.pctV)} %)` : undefined,
        })),
        total: points.length,
        skipped: everything.length - points.length,
      })
    }
    if (cards.length) items.push({ kind: 'header', key: `h:${group}`, group }, ...cards)
  }
  return { items, lastDate }
}

export default function EvolutionScreen() {
  const c = useColors()
  const router = useRouter()
  const settings = useSettings((s) => s.settings)
  const measurements = useData((s) => s.measurements)
  const cfg = useData((s) => s.measurementConfig)
  const sources = useMemo(() => visibleSources(cfg), [cfg])
  // Por defecto, el último origen visible que tenga medidas (de serie, la nutricionista: el que da la referencia).
  const [source, setSource] = useState<MeasurementSource>(() => {
    const withData = sources.filter((s) => measurements.some((m) => (m.source ?? 'home') === s.id))
    return (withData[withData.length - 1] ?? sources[sources.length - 1])?.id ?? 'home'
  })
  useEffect(() => { if (!sources.some((s) => s.id === source) && sources[0]) setSource(sources[0].id) }, [source, sources])
  // Masa grasa, muscular, agua… como % del peso (por defecto) o en kg.
  const [asPercent, setAsPercent] = useState(true)
  // La lista pesada se monta cuando termina la animación de entrada.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true))
    return () => task.cancel()
  }, [])

  const { items, lastDate } = useMemo(
    () => buildItems(cfg, measurements, source, asPercent, settings.weightUnit),
    [cfg, measurements, source, asPercent, settings.weightUnit],
  )

  return (
    <Screen>
      <Header title="Evolución" left={<HeaderButton icon="chevron-back" onPress={() => router.back()} color={c.text} />} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingTop: 8 }}>
        {sources.map((s) => {
          const active = source === s.id
          return (
            <Pressable key={s.id} onPress={() => setSource(s.id)} style={[styles.seg, { minWidth: '45%', flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: active ? s.color : c.chip }]}>
              {!active ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} /> : null}
              <Text style={{ color: active ? '#fff' : c.text, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{s.label}</Text>
            </Pressable>
          )
        })}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text style={{ color: c.textMuted, fontSize: 12, flex: 1 }}>Grasa, músculo, agua, proteínas y hueso:</Text>
        {([true, false] as const).map((pct) => {
          const active = asPercent === pct
          return (
            <Pressable key={String(pct)} onPress={() => setAsPercent(pct)} style={[styles.mini, { backgroundColor: active ? c.primary : c.chip }]}>
              <Text style={{ color: active ? '#fff' : c.text, fontWeight: '600', fontSize: 12 }}>{pct ? '% del peso' : settings.weightUnit}</Text>
            </Pressable>
          )
        })}
      </View>
      {ready ? (
        <FlatList
          data={items}
          keyExtractor={(it) => it.key}
          renderItem={({ item }) => (item.kind === 'header' ? <GroupHeader group={item.group} /> : <EvolutionCard item={item} />)}
          contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 60 }}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          updateCellsBatchingPeriod={40}
          windowSize={5}
          removeClippedSubviews
          ListHeaderComponent={lastDate ? (
            <Text style={{ color: c.textMuted, fontSize: 12 }}>
              Última medición: {fmtDateShort(lastDate)} · cada barra lleva su valor y, debajo, la diferencia con la medición anterior.
            </Text>
          ) : null}
          ListEmptyComponent={(
            <Card>
              <Text style={{ color: c.textMuted }}>Sin mediciones de {sourceLabel(cfg, source).toLowerCase()}. Añádelas desde Medidas eligiendo ese origen.</Text>
            </Card>
          )}
        />
      ) : null}
    </Screen>
  )
}

const GroupHeader = memo(function GroupHeader({ group }: { group: FieldGroup }) {
  const c = useColors()
  const tint = group === 'composition' ? c.primary : c.accent
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2, marginTop: 4 }}>
      <Icon name={group === 'composition' ? 'scale-outline' : 'resize-outline'} size={14} color={tint} />
      <Text style={{ color: tint, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }}>{GROUP_INFO[group].label.toUpperCase()}</Text>
    </View>
  )
})

const EvolutionCard = memo(function EvolutionCard({ item }: { item: CardItem }) {
  const c = useColors()
  const { last, pct, compKey, unit, weightUnit } = item
  return (
    <Card style={{ gap: 6, borderLeftWidth: 3, borderLeftColor: item.color }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text style={{ color: c.text, fontWeight: '700' }}>{item.title}</Text>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '800' }}>
          {fmt1(last.value)} <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600' }}>{unit}</Text>
          {pct && last.kg != null ? <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: '600' }}> ({fmt1(last.kg)} {weightUnit})</Text> : null}
          {!pct && compKey && last.pctV != null ? <Text style={{ color: c.textMuted, fontSize: 13, fontWeight: '600' }}> ({fmt1(last.pctV)} %)</Text> : null}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Delta label="vs anterior" value={item.dLast} unit={unit} good={item.good} />
        <Delta label={`desde ${item.firstLabel}`} value={item.dTotal} unit={unit} good={item.good} />
      </View>
      <DeltaBarChart color={item.color} bars={item.bars} formatY={fmt1} goodDirection={item.good} />
      {item.total > MAX_BARS ? <Text style={{ color: c.textFaint, fontSize: 11 }}>Últimas {MAX_BARS} de {item.total} mediciones.</Text> : null}
      {item.skipped ? <Text style={{ color: c.textFaint, fontSize: 11 }}>{item.skipped} {item.skipped === 1 ? 'medición sin peso de ese día: solo se ve' : 'mediciones sin peso de ese día: solo se ven'} en {pct ? weightUnit : '%'}.</Text> : null}
    </Card>
  )
})

function Delta({ label, value, unit, good }: { label: string; value: number | null; unit: string; good?: 'up' | 'down' }) {
  const c = useColors()
  if (value == null) return <Text style={{ color: c.textFaint, fontSize: 12 }}>{label}: —</Text>
  const r = Math.round(value * 10) / 10
  const color = r === 0 || !good ? c.textMuted : (good === 'up' ? r > 0 : r < 0) ? c.success : c.danger
  return (
    <Text style={{ color: c.textMuted, fontSize: 12 }}>
      {label}: <Text style={{ color, fontWeight: '700' }}>{r > 0 ? '+' : ''}{fmt1(r)} {unit}</Text>
    </Text>
  )
}

const styles = StyleSheet.create({
  seg: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  mini: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
})
