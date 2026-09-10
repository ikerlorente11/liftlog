// Detalle de ejercicio: Resumen (imagen animada, vídeo, músculos, instrucciones),
// Historial, Gráficas y Récords.
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LineChart } from '../../src/components/Charts'
import { videoSearchUrl } from '../../src/lib/exercises'
import { fmtClock, fmtDayMonth, fmtDistance, fmtRelativeDate, fmtWeight, toDisplayWeight } from '../../src/lib/format'
import { EQUIPMENT_LABEL, EXERCISE_TYPE_LABEL, MUSCLE_LABEL } from '../../src/lib/labels'
import { chartSeries, computeRecords, fmtSet, type ChartMetric } from '../../src/lib/stats'
import { useData } from '../../src/store/dataStore'
import { useSettings } from '../../src/store/settingsStore'
import { useColors } from '../../src/theme'
import { ExerciseAnimatedImage } from '../../src/ui/ExerciseImage'
import { Button, Card, Header, HeaderButton, Icon, Screen } from '../../src/ui/primitives'
import { ActionSheet, ConfirmDialog } from '../../src/ui/sheets'

type Tab = 'about' | 'history' | 'charts' | 'records'

export default function ExerciseDetail() {
  const c = useColors()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const settings = useSettings((s) => s.settings)
  const ex = useData((s) => s.exerciseMap.get(id))
  const workouts = useData((s) => s.workouts)
  const deleteCustomExercise = useData((s) => s.deleteCustomExercise)
  const [tab, setTab] = useState<Tab>('about')
  const [menu, setMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const type = ex?.type ?? 'weight_reps'

  const history = useMemo(() => workouts.filter((w) => w.exercises.some((e) => e.exerciseId === id)), [workouts, id])
  const records = useMemo(() => computeRecords(workouts, id, type), [workouts, id, type])

  const metricOptions: { key: ChartMetric; label: string }[] = useMemo(() => {
    if (type === 'weight_reps' || type === 'weighted_bodyweight') return [{ key: 'best1RM', label: '1RM estimado' }, { key: 'heaviest', label: 'Peso máx.' }, { key: 'volume', label: 'Volumen' }, { key: 'reps', label: 'Reps máx.' }]
    if (type === 'duration' || type === 'weight_duration') return [{ key: 'duration', label: 'Tiempo máx.' }]
    if (type === 'distance_duration') return [{ key: 'distance', label: 'Distancia' }, { key: 'duration', label: 'Tiempo' }]
    return [{ key: 'reps', label: 'Reps máx.' }]
  }, [type])
  const [metric, setMetric] = useState<ChartMetric>(metricOptions[0].key)
  const series = useMemo(() => chartSeries(workouts, id, type, metricOptions.some((m) => m.key === metric) ? metric : metricOptions[0].key), [workouts, id, type, metric, metricOptions])

  if (!ex) return <Screen><Header title="Ejercicio" left={<HeaderButton icon="chevron-back" onPress={() => router.back()} color={c.text} />} /><Text style={{ color: c.textMuted, padding: 24 }}>Ejercicio no encontrado.</Text></Screen>

  const fmtY = (v: number) => (metric === 'duration' ? fmtClock(v) : metric === 'distance' ? fmtDistance(v, settings.distanceUnit) : metric === 'reps' ? String(Math.round(v)) : fmtWeight(v, settings.weightUnit, false))

  return (
    <Screen>
      <Header
        title={ex.nameEs}
        subtitle={ex.nameEs !== ex.name ? ex.name : undefined}
        left={<HeaderButton icon="chevron-back" onPress={() => router.back()} color={c.text} />}
        right={ex.isCustom ? <HeaderButton icon="ellipsis-horizontal" color={c.text} onPress={() => setMenu(true)} /> : undefined}
      />
      <View style={[styles.tabs, { borderBottomColor: c.border }]}>
        {([['about', 'Resumen'], ['history', 'Historial'], ['charts', 'Gráficas'], ['records', 'Récords']] as [Tab, string][]).map(([k, l]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}>
            <Text style={{ color: tab === k ? c.primary : c.textMuted, fontWeight: '700', fontSize: 13 }}>{l}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {tab === 'about' ? (
          <View style={{ gap: 12 }}>
            <ExerciseAnimatedImage exercise={ex} />
            {ex.imageCredit ? <Text style={{ color: c.textFaint, fontSize: 11, paddingHorizontal: 12, marginTop: -6 }}>{ex.imageCredit}</Text> : null}
            <View style={{ paddingHorizontal: 12, gap: 12 }}>
              <Button label="Ver vídeo demostrativo (YouTube)" icon="logo-youtube" variant="secondary" onPress={() => void Linking.openURL(videoSearchUrl(ex))} />
              <Card style={{ gap: 6 }}>
                <InfoRow label="Músculo principal" value={MUSCLE_LABEL[ex.muscle]} />
                {ex.secondary.length ? <InfoRow label="Secundarios" value={ex.secondary.map((m) => MUSCLE_LABEL[m]).join(', ')} /> : null}
                <InfoRow label="Equipamiento" value={EQUIPMENT_LABEL[ex.equipment]} />
                <InfoRow label="Tipo" value={EXERCISE_TYPE_LABEL[ex.type]} />
                {ex.level ? <InfoRow label="Nivel" value={ex.level === 'beginner' ? 'Principiante' : ex.level === 'intermediate' ? 'Intermedio' : 'Avanzado'} /> : null}
              </Card>
              {ex.instructions.length ? (
                <Card style={{ gap: 8 }}>
                  <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Cómo hacerlo</Text>
                  {ex.instructions.map((s, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                      <Text style={{ color: c.primary, fontWeight: '700', width: 20 }}>{i + 1}.</Text>
                      <Text style={{ color: c.text, flex: 1, lineHeight: 20 }}>{s}</Text>
                    </View>
                  ))}
                </Card>
              ) : null}
              {history.length ? (
                <Card style={{ gap: 4 }}>
                  <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Resumen</Text>
                  <InfoRow label="Sesiones" value={String(records.sessions)} />
                  <InfoRow label="Series totales" value={String(records.totalSets)} />
                  {records.totalVolume ? <InfoRow label="Volumen total" value={fmtWeight(records.totalVolume, settings.weightUnit)} /> : null}
                </Card>
              ) : null}
            </View>
          </View>
        ) : null}

        {tab === 'history' ? (
          <View style={{ padding: 12, gap: 12 }}>
            {history.length === 0 ? <Text style={{ color: c.textMuted, textAlign: 'center', padding: 24 }}>Todavía no has hecho este ejercicio.</Text> : null}
            {history.map((w) => (
              <Card key={w.id} style={{ gap: 6 }} onPress={() => router.push(`/workout/${w.id}`)}>
                <Text style={{ color: c.text, fontWeight: '700' }}>{w.title}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{fmtRelativeDate(w.startedAt)}</Text>
                {w.exercises.filter((e) => e.exerciseId === id).map((e) => (
                  <View key={e.id} style={{ gap: 2, marginTop: 4 }}>
                    {e.notes ? <Text style={{ color: c.textMuted, fontSize: 12, fontStyle: 'italic' }}>{e.notes}</Text> : null}
                    {e.sets.map((s, i) => (
                      <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ width: 36, color: s.type === 'warmup' ? c.warning : c.text, fontWeight: '700' }}>{s.type === 'normal' ? i + 1 : s.type === 'warmup' ? 'W' : s.type === 'dropset' ? 'D' : 'F'}</Text>
                        <Text style={{ color: c.text, flex: 1 }}>{fmtSet(s, type, settings)}</Text>
                        {s.isPr ? <Icon name="trophy" size={14} color={c.prGold} /> : null}
                      </View>
                    ))}
                  </View>
                ))}
              </Card>
            ))}
          </View>
        ) : null}

        {tab === 'charts' ? (
          <View style={{ padding: 12, gap: 12 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {metricOptions.map((m) => (
                <Pressable key={m.key} onPress={() => setMetric(m.key)} style={[styles.metricBtn, { backgroundColor: metric === m.key ? c.primary : c.cardAlt }]}>
                  <Text style={{ color: metric === m.key ? '#fff' : c.text, fontWeight: '600', fontSize: 13 }}>{m.label}</Text>
                </Pressable>
              ))}
            </View>
            <Card>
              <LineChart points={series} formatY={fmtY} formatX={(x) => fmtDayMonth(x)} />
            </Card>
            {series.length ? (
              <Card style={{ gap: 4 }}>
                <InfoRow label="Último" value={fmtY(series[series.length - 1].y)} />
                <InfoRow label="Mejor" value={fmtY(Math.max(...series.map((p) => p.y)))} />
                <InfoRow label="Sesiones" value={String(series.length)} />
              </Card>
            ) : null}
          </View>
        ) : null}

        {tab === 'records' ? (
          <View style={{ padding: 12, gap: 12 }}>
            {records.sessions === 0 ? <Text style={{ color: c.textMuted, textAlign: 'center', padding: 24 }}>Sin récords todavía. ¡A entrenar!</Text> : (
              <>
                <Card style={{ gap: 6 }}>
                  <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Récords personales</Text>
                  {(type === 'weight_reps' || type === 'weighted_bodyweight') ? (
                    <>
                      <InfoRow label="Peso máximo" value={fmtWeight(records.heaviestKg, settings.weightUnit)} />
                      <InfoRow label="Mejor 1RM estimado" value={fmtWeight(Math.round(records.best1RM * 10) / 10, settings.weightUnit)} />
                      <InfoRow label="Mejor volumen de serie" value={fmtWeight(records.bestSetVolume, settings.weightUnit)} />
                      <InfoRow label="Mejor volumen de sesión" value={fmtWeight(records.bestSessionVolume, settings.weightUnit)} />
                    </>
                  ) : null}
                  {records.maxReps ? <InfoRow label="Reps máximas" value={String(records.maxReps)} /> : null}
                  {records.maxDurationS ? <InfoRow label="Tiempo máximo" value={fmtClock(records.maxDurationS)} /> : null}
                  {records.maxDistanceM ? <InfoRow label="Distancia máxima" value={fmtDistance(records.maxDistanceM, settings.distanceUnit)} /> : null}
                </Card>
                {Object.keys(records.repRecords).length ? (
                  <Card style={{ gap: 4 }}>
                    <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Récords por repeticiones</Text>
                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                      <Text style={[styles.th, { color: c.textMuted, width: 60 }]}>REPS</Text>
                      <Text style={[styles.th, { color: c.textMuted, flex: 1 }]}>MEJOR PESO</Text>
                      <Text style={[styles.th, { color: c.textMuted, flex: 1 }]}>1RM EST.</Text>
                    </View>
                    {Array.from({ length: 12 }, (_, i) => i + 1).filter((r) => records.repRecords[r]).map((r) => (
                      <View key={r} style={{ flexDirection: 'row', paddingVertical: 3 }}>
                        <Text style={{ color: c.text, width: 60, fontWeight: '700' }}>{r}{r === 12 ? '+' : ''}</Text>
                        <Text style={{ color: c.text, flex: 1 }}>{fmtWeight(records.repRecords[r], settings.weightUnit)}</Text>
                        <Text style={{ color: c.textMuted, flex: 1 }}>{Math.round(toDisplayWeight(records.repRecords[r] * (1 + r / 30), settings.weightUnit) * 10) / 10} {settings.weightUnit}</Text>
                      </View>
                    ))}
                  </Card>
                ) : null}
              </>
            )}
          </View>
        ) : null}
      </ScrollView>
      <ActionSheet visible={menu} onClose={() => setMenu(false)} actions={[
        { label: 'Editar ejercicio', icon: 'create-outline', onPress: () => router.push({ pathname: '/exercises/new', params: { id: ex.id } }) },
        { label: 'Eliminar ejercicio', icon: 'trash-outline', destructive: true, onPress: () => setConfirmDelete(true) },
      ]} />
      <ConfirmDialog visible={confirmDelete} title="¿Eliminar ejercicio personalizado?" message="Los entrenos que lo usan conservarán el registro." confirmLabel="Eliminar" destructive onCancel={() => setConfirmDelete(false)} onConfirm={async () => { setConfirmDelete(false); await deleteCustomExercise(ex.id); router.back() }} />
    </Screen>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const c = useColors()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ color: c.textMuted }}>{label}</Text>
      <Text style={{ color: c.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  metricBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  th: { fontSize: 11, fontWeight: '700' },
})
