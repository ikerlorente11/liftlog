// Medidas corporales: composición (peso, grasa, músculo, proteínas, agua,
// mineral óseo, grasa visceral, metabolismo basal) y perímetros. Los distintos
// orígenes (por defecto báscula de casa y nutricionista) se dibujan en la misma
// gráfica, separados por color, porque son complementarios: la báscula da la
// tendencia y la nutricionista el valor de referencia. Qué campos y qué
// orígenes existen lo decide el usuario en "Configurar medidas".
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { MultiLineChart } from '../../src/components/Charts'
import { MeasurementDialog } from '../../src/components/MeasurementDialog'
import { fmtDateShort, fmtDayMonth, fromDisplayWeight, toDisplayWeight } from '../../src/lib/format'
import { GROUP_INFO, type FieldGroup, fieldLabel, fieldUnit, isMassField, isPercentOfWeightField, sourceLabel, visibleFields, visibleSources } from '../../src/lib/measurementConfig'
import { composition, compositionParts, kgFromPercent, weightNear } from '../../src/lib/measurements'
import { useData } from '../../src/store/dataStore'
import type { Measurement, MeasurementSource } from '../../src/types'
import { useSettings } from '../../src/store/settingsStore'
import { useColors } from '../../src/theme'
import { Button, Card, Header, HeaderButton, Icon, IconName, Screen } from '../../src/ui/primitives'

const sourceOf = (m: Measurement): MeasurementSource => m.source ?? 'home'

export default function MeasurementsScreen() {
  const c = useColors()
  const router = useRouter()
  const settings = useSettings((s) => s.settings)
  const measurements = useData((s) => s.measurements)
  const cfg = useData((s) => s.measurementConfig)
  const { addMeasurement, deleteMeasurement } = useData()
  const [key, setKey] = useState('weight')
  const [prompt, setPrompt] = useState(false)

  const sources = useMemo(() => visibleSources(cfg), [cfg])
  const [source, setSource] = useState<MeasurementSource>(sources[0]?.id ?? 'home')
  const groups: { id: FieldGroup; keys: string[] }[] = (['composition', 'perimeter'] as FieldGroup[]).map((g) => ({ id: g, keys: visibleFields(cfg, g).map((f) => f.key) }))
  const allVisible = useMemo(() => new Set(visibleFields(cfg).map((f) => f.key)), [cfg])
  const group: FieldGroup = groups[1].keys.includes(key) ? 'perimeter' : 'composition'
  const groupTint = group === 'composition' ? c.primary : c.accent
  const srcColor = (id: string) => sources.find((s) => s.id === id)?.color ?? cfg.sources.find((s) => s.id === id)?.color ?? c.textFaint

  // Si el campo o el origen seleccionados se quitan desde la configuración, volvemos a uno válido.
  useEffect(() => { if (!allVisible.has(key)) setKey('weight') }, [key, allVisible])
  useEffect(() => { if (!sources.some((s) => s.id === source) && sources[0]) setSource(sources[0].id) }, [source, sources])

  const isMass = isMassField(cfg, key)
  const dispKg = (v: number) => Math.round(toDisplayWeight(v, settings.weightUnit) * 10) / 10
  const unit = fieldUnit(cfg, key, settings.weightUnit)
  const disp = (v: number) => (isMass ? dispKg(v) : v)
  // Grasa, músculo, agua, proteínas y hueso se muestran como "% (kg)": el % se
  // deriva del peso del mismo origen de ese día.
  const compKey = isPercentOfWeightField(cfg, key)
  const partsOf = (m: Measurement): { primary: string; secondary: string | null } => {
    if (!compKey) return { primary: `${disp(m.value)} ${unit}`, secondary: null }
    const kgWeight = weightNear(measurements, sourceOf(m), m.date)
    const comp = composition(key, m.value, kgWeight)
    return compositionParts({ pct: comp.pct, kg: comp.kg == null ? null : dispKg(comp.kg) }, settings.weightUnit)
  }
  /** Valor con jerarquía: la cifra principal grande y la secundaria entre paréntesis, más pequeña y apagada. */
  const ValueText = ({ m, size }: { m: Measurement; size: number }) => {
    const p = partsOf(m)
    return (
      <Text style={{ color: c.text, fontSize: size, fontWeight: '800' }} numberOfLines={1}>
        {p.primary}
        {p.secondary ? <Text style={{ color: c.textMuted, fontSize: Math.round(size * 0.6), fontWeight: '500' }}>  ({p.secondary})</Text> : null}
      </Text>
    )
  }

  // measurements ya viene ordenado por fecha descendente desde el store.
  const list = useMemo(() => measurements.filter((m) => m.key === key), [measurements, key])
  const bySource = useMemo(() => {
    const map = new Map<string, Measurement[]>()
    for (const s of sources) map.set(s.id, [])
    for (const m of list) {
      const arr = map.get(sourceOf(m))
      if (arr) arr.push(m)
    }
    return map
  }, [list, sources])

  const series = useMemo(() => sources.map((s) => ({
    label: s.label,
    color: s.color,
    points: (bySource.get(s.id) ?? []).map((m) => ({ x: m.date, y: disp(m.value) })),
  })), [bySource, sources, settings.weightUnit]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Screen>
      <Header
        title="Medidas"
        left={<HeaderButton icon="chevron-back" onPress={() => router.back()} color={c.text} />}
        right={(
          <>
            <HeaderButton icon="trending-up-outline" onPress={() => router.push('/settings/evolution')} color={c.primary} />
            <HeaderButton icon="options-outline" onPress={() => router.push('/settings/measurement-config')} color={c.primary} />
          </>
        )}
      />
      {/* Dos familias con color propio: composición (báscula) en azul y perímetros (cinta) en morado. */}
      {groups.map((g) => {
        const info = GROUP_INFO[g.id]
        const tint = g.id === 'composition' ? c.primary : c.accent
        const icon: IconName = g.id === 'composition' ? 'scale-outline' : 'resize-outline'
        if (!g.keys.length) return null
        return (
          <View key={g.id} style={{ paddingTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, marginBottom: 6 }}>
              <Icon name={icon} size={14} color={tint} />
              <Text style={{ color: tint, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 }}>{info.label.toUpperCase()}</Text>
              <Text style={{ color: c.textFaint, fontSize: 11 }}>· {info.hint}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
              {g.keys.map((k) => {
                const active = key === k
                return (
                  <Pressable key={k} onPress={() => setKey(k)} style={[styles.chip, { backgroundColor: active ? tint : c.chip, borderColor: active ? tint : c.border }]}>
                    <Text style={{ color: active ? '#fff' : c.text, fontWeight: '600', fontSize: 13 }}>{fieldLabel(cfg, k)}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
        )
      })}
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 60 }}>
        <Card style={{ gap: 10, borderLeftWidth: 3, borderLeftColor: groupTint }}>
          <Text style={{ color: groupTint, fontWeight: '600' }}>{fieldLabel(cfg, key)}</Text>
          {/* Último valor por origen; con más de dos orígenes la fila salta de línea. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {sources.map((s) => {
              const latest = bySource.get(s.id)?.[0]
              return (
                <View key={s.id} style={{ flexBasis: '45%', flexGrow: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                    <Text style={{ color: c.textMuted, fontSize: 12 }} numberOfLines={1}>{s.label}</Text>
                  </View>
                  {latest ? <ValueText m={latest} size={22} /> : <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>—</Text>}
                  {latest ? <Text style={{ color: c.textFaint, fontSize: 11 }}>{fmtDateShort(latest.date)}</Text> : null}
                </View>
              )
            })}
          </View>
          <MultiLineChart series={series} height={190} formatY={(v) => String(Math.round(v * 10) / 10)} formatX={(x) => fmtDayMonth(x)} />
        </Card>

        <Button label="Añadir medida" icon="add" onPress={() => setPrompt(true)} />

        {list.length ? (
          <Card style={{ gap: 2 }}>
            <Text style={{ color: c.text, fontWeight: '700', marginBottom: 6 }}>Historial</Text>
            {list.map((m) => (
              <View key={m.id} style={styles.row}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: srcColor(sourceOf(m)), marginRight: 8 }} />
                <Text style={{ color: c.textMuted, flex: 1 }}>{fmtDateShort(m.date)}</Text>
                <ValueText m={m} size={16} />
                <Pressable onPress={() => void deleteMeasurement(m.id)} hitSlop={8} style={{ marginLeft: 12 }}>
                  <Icon name="trash-outline" size={18} color={c.textFaint} />
                </Pressable>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
      <MeasurementDialog
        visible={prompt}
        label={key === 'fat_mass' ? fieldLabel(cfg, key) : `${fieldLabel(cfg, key)} (${unit})`}
        unit={unit}
        // La grasa se puede teclear como la da la báscula (%) y se guarda en kg con el peso de ese día.
        unitOptions={key === 'fat_mass' ? ['%', unit] : undefined}
        sources={sources}
        defaultSource={source}
        onCancel={() => setPrompt(false)}
        onConfirm={(n, src, date, unitUsed) => {
          // Recordamos el último origen usado para no repetir la elección.
          setSource(src)
          let valueKg = isMass ? fromDisplayWeight(n, settings.weightUnit) : n
          if (key === 'fat_mass' && unitUsed === '%') {
            const w = weightNear(measurements, src, date)
            if (w == null) {
              Alert.alert('Falta el peso', `Para guardar la grasa en % necesito el peso de ${sourceLabel(cfg, src).toLowerCase()} de ese día (±3 días). Apunta primero el peso o introduce la grasa en ${unit}.`)
              return
            }
            valueKg = kgFromPercent(n, w)
          }
          void addMeasurement(key, valueKg, date, src)
          setPrompt(false)
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
})
