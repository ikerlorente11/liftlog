// Entreno en curso ("Registrar entreno"): cronómetro, métricas, ejercicios con
// series, temporizadores (descanso y series de tiempo), añadir/reemplazar/superserie,
// terminar/descartar.
import { useKeepAwake } from 'expo-keep-awake'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EntryEditor, REST_OPTIONS, restLabel, type EntryEditorProps } from '../../src/components/EntryEditor'
import { ExercisePicker } from '../../src/components/ExercisePicker'
import { RestTimerBar } from '../../src/components/RestTimerBar'
import { SetTimerBar } from '../../src/components/SetTimer'
import { usePreviousSets, useSupersetIndex } from '../../src/components/useEntryHelpers'
import { fmtClock, fmtDuration, fmtWeight, uid } from '../../src/lib/format'
import { completedSets, workoutVolume } from '../../src/lib/stats'
import { useData } from '../../src/store/dataStore'
import { useSettings } from '../../src/store/settingsStore'
import { useWorkout } from '../../src/store/workoutStore'
import { useColors } from '../../src/theme'
import type { ExerciseEntry } from '../../src/types'
import { Button, Header, HeaderButton, Icon } from '../../src/ui/primitives'
import { ActionSheet, ConfirmDialog, OptionSheet } from '../../src/ui/sheets'

export default function ActiveWorkoutScreen() {
  const c = useColors()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const settings = useSettings((s) => s.settings)
  // Solo el entreno: suscribirse a todo el store repintaba la pantalla entera
  // con cada cambio del descanso o del temporizador de serie.
  const active = useWorkout((s) => s.active)
  const w = useWorkout.getState()
  const getExercise = useData((s) => s.getExercise)
  const typeOf = useData((s) => s.typeOf)
  const workouts = useData((s) => s.workouts)
  const prevSets = usePreviousSets(workouts, active?.routineId)
  const ssIndex = useSupersetIndex(active?.exercises ?? [])
  useKeepAwake()

  // Montaje progresivo: al abrir el entreno se pintan las dos primeras tarjetas
  // y luego una por fotograma (crear las vistas nativas de una tarjeta cuesta
  // ~100 ms en el Redmi); así la pantalla aparece enseguida y no se traba.
  const total = active?.exercises.length ?? 0
  const [mounted, setMounted] = useState(2)
  useEffect(() => {
    if (mounted >= total) return
    const id = requestAnimationFrame(() => setMounted((m) => m + 1))
    return () => cancelAnimationFrame(id)
  }, [mounted, total])
  const [picker, setPicker] = useState<{ mode: 'multi' | 'single'; entryId?: string } | null>(null)
  // Callbacks estables por ejercicio: con funciones flecha nuevas en cada render
  // el memo de EntryEditor no servía y marcar una serie repintaba las 7 tarjetas.
  const latest = useRef({ defaultRest: settings.defaultRestSeconds, typeOf })
  latest.current = { defaultRest: settings.defaultRestSeconds, typeOf }
  const handlers = useRef(new Map<string, EntryHandlers>())
  const handlersFor = (id: string, exerciseId: string): EntryHandlers => {
    let h = handlers.current.get(id)
    if (!h) {
      const s = useWorkout.getState()
      h = {
        onUpdateSet: (sid, patch) => s.updateSet(id, sid, patch),
        onAddSet: () => s.addSet(id),
        onRemoveSet: (sid) => s.removeSet(id, sid),
        onSetType: (sid, t) => s.setSetType(id, sid, t),
        onToggle: (sid) => s.toggleSet(id, sid, latest.current.typeOf(exerciseId), latest.current.defaultRest),
        onToggleAll: () => s.toggleAllSets(id, latest.current.typeOf(exerciseId)),
        onNotes: (t) => s.updateEntry(id, { notes: t }),
        onRest: (r) => s.updateEntry(id, { restSeconds: r }),
        onMenu: () => { const e = useWorkout.getState().active?.exercises.find((x) => x.id === id); if (e) setMenuFor(e) },
      }
      handlers.current.set(id, h)
    }
    return h
  }
  const [menuFor, setMenuFor] = useState<ExerciseEntry | null>(null)
  const [restFor, setRestFor] = useState<ExerciseEntry | null>(null)
  const [supersetFor, setSupersetFor] = useState<ExerciseEntry | null>(null)
  const [confirm, setConfirm] = useState<{ title: string; message: string; label: string; onOk: () => void } | null>(null)

  const volume = useMemo(() => (active ? workoutVolume(active, typeOf) : 0), [active, typeOf])
  const sets = active ? completedSets(active) : 0

  if (!active) return null

  const minimize = () => { w.setMinimized(true); router.back() }

  const finish = () => {
    if (sets === 0) {
      setConfirm({ title: 'No hay series completadas', message: 'Marca al menos una serie como hecha, o descarta el entreno.', label: 'Descartar entreno', onOk: () => { w.discard(); router.back() } })
      return
    }
    // Los calentamientos sin marcar no cuentan como pendientes al terminar.
    const pending = active.exercises.reduce((a, e) => a + e.sets.filter((s) => !s.completed && s.type !== 'warmup').length, 0)
    if (pending > 0) {
      setConfirm({ title: 'Series sin completar', message: `Hay ${pending} series sin marcar. Se descartarán al terminar. ¿Terminar el entreno?`, label: 'Terminar', onOk: () => router.push('/workout/finish') })
    } else router.push('/workout/finish')
  }

  const discard = () => setConfirm({ title: '¿Descartar entreno?', message: 'Se perderán todas las series registradas.', label: 'Descartar', onOk: () => { w.discard(); router.back() } })

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <Header
        title="Registrar entreno"
        left={<HeaderButton icon="chevron-down" onPress={minimize} color={c.text} />}
        right={<Button label="Terminar" onPress={finish} small />}
      />
      {/* Con edge-to-edge Android no redimensiona la ventana al salir el teclado (adjustResize no hace nada): el padding hace falta en ambas plataformas para que se pueda hacer scroll hasta lo que tapa el teclado. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <View style={styles.stats}>
            <ElapsedStat startedAt={active.startedAt} />
            <Stat label="Volumen" value={fmtWeight(volume, settings.weightUnit)} />
            <Stat label="Series" value={String(sets)} />
          </View>
          <TextInput value={active.title} onChangeText={w.setTitle} style={[styles.title, { color: c.text }]} placeholder="Título del entreno" placeholderTextColor={c.textFaint} />
          <TextInput value={active.notes} onChangeText={w.setNotes} style={[styles.notes, { color: c.textMuted }]} placeholder="Notas del entreno" placeholderTextColor={c.textFaint} multiline />

          {/* Registro a posteriori (p. ej. piscina sin móvil): sin temporizador de descanso */}
          <View style={[styles.restToggle, { backgroundColor: c.card, borderColor: c.border }]}>
            <Icon name="timer-outline" size={18} color={active.restTimerOff ? c.textFaint : c.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: '600' }}>Descanso automático</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{active.restTimerOff ? 'Desactivado: apunta el entreno ya hecho sin avisos' : 'Al marcar una serie arranca el temporizador'}</Text>
            </View>
            <Switch value={!active.restTimerOff} onValueChange={(v) => w.setRestTimerOff(!v)} trackColor={{ true: c.primary }} />
          </View>

          {active.exercises.slice(0, Math.max(mounted, 2)).map((e) => (
            <EntryEditor
              key={e.id}
              entry={e}
              exercise={getExercise(e.exerciseId)}
              mode="workout"
              settings={settings}
              prevSets={prevSets.get(e.exerciseId)}
              supersetIndex={e.supersetId ? ssIndex.get(e.supersetId) : undefined}
              {...handlersFor(e.id, e.exerciseId)}
              enableSetTimer
            />
          ))}

          {active.exercises.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 24, gap: 6 }}>
              <Icon name="barbell-outline" size={40} color={c.textFaint} />
              <Text style={{ color: c.text, fontWeight: '700' }}>Empieza</Text>
              <Text style={{ color: c.textMuted, textAlign: 'center' }}>Añade un ejercicio para empezar tu entrenamiento</Text>
            </View>
          ) : null}

          <Button label="Añadir ejercicio" icon="add" onPress={() => setPicker({ mode: 'multi' })} style={{ marginTop: 4 }} />
          <View style={{ height: 10 }} />
          <Button label="Descartar entreno" variant="danger" onPress={discard} />
        </ScrollView>
        <SetTimerBar />
        <RestTimerBar />
        <View style={{ height: insets.bottom, backgroundColor: c.card }} />
      </KeyboardAvoidingView>

      <ExercisePicker
        visible={!!picker}
        mode={picker?.mode ?? 'multi'}
        onClose={() => setPicker(null)}
        usedIds={active.exercises.map((e) => e.exerciseId)}
        onSelect={(ids, superset) => {
          if (picker?.mode === 'single' && picker.entryId) w.replaceExercise(picker.entryId, ids[0])
          else w.addExercises(ids, superset, null)
        }}
      />

      <ActionSheet
        visible={!!menuFor}
        onClose={() => setMenuFor(null)}
        title={menuFor ? getExercise(menuFor.exerciseId)?.nameEs : undefined}
        actions={menuFor ? [
          { label: 'Reordenar: subir', icon: 'arrow-up-outline', onPress: () => w.moveExercise(menuFor.id, -1), disabled: active.exercises[0]?.id === menuFor.id },
          { label: 'Reordenar: bajar', icon: 'arrow-down-outline', onPress: () => w.moveExercise(menuFor.id, 1), disabled: active.exercises[active.exercises.length - 1]?.id === menuFor.id },
          { label: 'Reemplazar ejercicio', icon: 'swap-horizontal-outline', onPress: () => setPicker({ mode: 'single', entryId: menuFor.id }) },
          menuFor.supersetId
            ? { label: 'Quitar de la superserie', icon: 'unlink-outline', onPress: () => w.updateEntry(menuFor.id, { supersetId: null }) }
            : { label: 'Crear superserie', icon: 'link-outline', onPress: () => setSupersetFor(menuFor), disabled: active.exercises.length < 2 },
          { label: `Temporizador de descanso: ${restLabel(menuFor.restSeconds, settings.defaultRestSeconds)}`, icon: 'timer-outline', onPress: () => setRestFor(menuFor) },
          { label: 'Ver detalles del ejercicio', icon: 'information-circle-outline', onPress: () => router.push(`/exercises/${menuFor.exerciseId}`) },
          { label: 'Eliminar ejercicio', icon: 'trash-outline', destructive: true, onPress: () => w.removeExercise(menuFor.id) },
        ] : []}
      />
      <OptionSheet
        visible={!!restFor}
        onClose={() => setRestFor(null)}
        title="Temporizador de descanso"
        value={restFor?.restSeconds == null ? -1 : restFor.restSeconds}
        options={[{ value: -1, label: `Por defecto (${restLabel(null, settings.defaultRestSeconds)})` }, ...REST_OPTIONS.map((s) => ({ value: s, label: s === 0 ? 'Desactivado' : fmtDuration(s) }))]}
        onSelect={(v) => restFor && w.updateEntry(restFor.id, { restSeconds: v === -1 ? null : v })}
      />
      <OptionSheet
        visible={!!supersetFor}
        onClose={() => setSupersetFor(null)}
        title="Superserie con..."
        value={null}
        options={active.exercises.filter((e) => e.id !== supersetFor?.id).map((e) => ({ value: e.id, label: getExercise(e.exerciseId)?.nameEs ?? e.exerciseId, sub: e.supersetId ? 'Ya está en una superserie' : undefined }))}
        onSelect={(otherId) => {
          if (!supersetFor) return
          const other = active.exercises.find((e) => e.id === otherId)
          const ssId = other?.supersetId ?? uid()
          w.setSuperset([supersetFor.id, otherId], ssId)
        }}
      />
      <ConfirmDialog
        visible={!!confirm}
        title={confirm?.title ?? ''}
        message={confirm?.message}
        confirmLabel={confirm?.label}
        destructive={confirm?.label !== 'Terminar'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { const fn = confirm?.onOk; setConfirm(null); fn?.() }}
      />
    </View>
  )
}

type EntryHandlers = Pick<EntryEditorProps, 'onUpdateSet' | 'onAddSet' | 'onRemoveSet' | 'onSetType' | 'onToggle' | 'onToggleAll' | 'onNotes' | 'onRest' | 'onMenu'>

/** Reloj de duración con su propio intervalo: así el segundero no repinta toda la pantalla. */
function ElapsedStat({ startedAt }: { startedAt: number }) {
  const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t) }, [])
  return <Stat label="Duración" value={fmtClock(Math.floor((Date.now() - startedAt) / 1000))} accent />
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const c = useColors()
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: accent ? c.primary : c.text, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', paddingHorizontal: 4, paddingVertical: 4 },
  notes: { fontSize: 14, paddingHorizontal: 4, paddingBottom: 10 },
  restToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
})
