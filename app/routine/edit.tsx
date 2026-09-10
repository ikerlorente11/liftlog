// Crear/editar rutina: título, notas, ejercicios con series objetivo,
// superseries, descanso por ejercicio. También "guardar entreno como rutina".
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EntryEditor, REST_OPTIONS, restLabel } from '../../src/components/EntryEditor'
import { ExercisePicker } from '../../src/components/ExercisePicker'
import { useSupersetIndex } from '../../src/components/useEntryHelpers'
import { fmtDuration, uid } from '../../src/lib/format'
import { useData } from '../../src/store/dataStore'
import { useSettings } from '../../src/store/settingsStore'
import { useColors } from '../../src/theme'
import type { ExerciseEntry, Routine, SetData } from '../../src/types'
import { Button, Header, HeaderButton, Icon } from '../../src/ui/primitives'
import { ActionSheet, ConfirmDialog, OptionSheet } from '../../src/ui/sheets'

function blankSet(): SetData {
  return { id: uid(), type: 'normal', weightKg: null, reps: null, distanceM: null, durationS: null, rpe: null, completed: false }
}

export default function RoutineEditor() {
  const c = useColors()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { id, folderId, fromWorkout } = useLocalSearchParams<{ id?: string; folderId?: string; fromWorkout?: string }>()
  const settings = useSettings((s) => s.settings)
  const { routines, workouts, getExercise, saveRoutine } = useData()

  const initial = useMemo<Routine>(() => {
    const now = Date.now()
    if (id) {
      const r = routines.find((x) => x.id === id)
      if (r) return JSON.parse(JSON.stringify(r)) as Routine
    }
    if (fromWorkout) {
      const w = workouts.find((x) => x.id === fromWorkout)
      if (w) {
        return {
          id: uid(), name: w.title, notes: '', folderId: folderId ?? null, position: routines.length, createdAt: now, updatedAt: now,
          exercises: w.exercises.map((e) => ({ id: uid(), exerciseId: e.exerciseId, notes: e.notes, restSeconds: e.restSeconds, supersetId: e.supersetId, sets: e.sets.map((s) => ({ ...s, id: uid(), completed: false, isPr: false, rpe: null })) })),
        }
      }
    }
    return { id: uid(), name: '', notes: '', folderId: folderId ?? null, position: routines.length, createdAt: now, updatedAt: now, exercises: [] }
  }, [id, fromWorkout, folderId, routines, workouts])

  const [routine, setRoutine] = useState<Routine>(initial)
  const [picker, setPicker] = useState<{ mode: 'multi' | 'single'; entryId?: string } | null>(null)
  const [menuFor, setMenuFor] = useState<ExerciseEntry | null>(null)
  const [restFor, setRestFor] = useState<ExerciseEntry | null>(null)
  const [supersetFor, setSupersetFor] = useState<ExerciseEntry | null>(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ssIndex = useSupersetIndex(routine.exercises)

  const mutate = (fn: (r: Routine) => void) => setRoutine((r) => { const copy = JSON.parse(JSON.stringify(r)) as Routine; fn(copy); return copy })
  const entry = (r: Routine, entryId: string) => r.exercises.find((e) => e.id === entryId)!

  const save = async () => {
    if (!routine.name.trim()) { setError('Ponle un título a la rutina.'); return }
    if (routine.exercises.length === 0) { setError('Añade al menos un ejercicio.'); return }
    await saveRoutine({ ...routine, name: routine.name.trim(), updatedAt: Date.now() })
    router.back()
  }

  const dirty = JSON.stringify(routine) !== JSON.stringify(initial)

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <Header
        title={id ? 'Editar rutina' : 'Crear rutina'}
        left={<HeaderButton icon="close" color={c.text} onPress={() => (dirty ? setConfirmClose(true) : router.back())} />}
        right={<Button label="Guardar" small onPress={() => void save()} />}
      />
      {/* Con edge-to-edge Android no redimensiona la ventana al salir el teclado (adjustResize no hace nada): el padding hace falta en ambas plataformas para que se pueda hacer scroll hasta lo que tapa el teclado. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <TextInput
            value={routine.name}
            onChangeText={(t) => { setError(null); mutate((r) => { r.name = t }) }}
            placeholder="Título de la rutina"
            placeholderTextColor={c.textFaint}
            style={[styles.title, { color: c.text, borderBottomColor: c.border }]}
          />
          <TextInput
            value={routine.notes}
            onChangeText={(t) => mutate((r) => { r.notes = t })}
            placeholder="Notas de la rutina (opcional)"
            placeholderTextColor={c.textFaint}
            multiline
            style={[styles.notes, { color: c.textMuted }]}
          />
          {error ? <Text style={{ color: c.danger, marginBottom: 8 }}>{error}</Text> : null}

          {routine.exercises.map((e) => (
            <EntryEditor
              key={e.id}
              entry={e}
              exercise={getExercise(e.exerciseId)}
              mode="routine"
              settings={settings}
              supersetIndex={e.supersetId ? ssIndex.get(e.supersetId) : undefined}
              onUpdateSet={(sid, patch) => mutate((r) => { const s = entry(r, e.id).sets.find((x) => x.id === sid); if (s) Object.assign(s, patch) })}
              onAddSet={() => mutate((r) => { const en = entry(r, e.id); const last = en.sets[en.sets.length - 1]; en.sets.push({ ...blankSet(), weightKg: last?.weightKg ?? null, reps: last?.reps ?? null, distanceM: last?.distanceM ?? null, durationS: last?.durationS ?? null }) })}
              onRemoveSet={(sid) => mutate((r) => { const en = entry(r, e.id); en.sets = en.sets.filter((s) => s.id !== sid) })}
              onSetType={(sid, t) => mutate((r) => { const s = entry(r, e.id).sets.find((x) => x.id === sid); if (s) s.type = t })}
              onNotes={(t) => mutate((r) => { entry(r, e.id).notes = t })}
              onRest={(s) => mutate((r) => { entry(r, e.id).restSeconds = s })}
              onRepRange={(range) => mutate((r) => { entry(r, e.id).repRange = range })}
              onMenu={() => setMenuFor(e)}
            />
          ))}

          {routine.exercises.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 24, gap: 6 }}>
              <Icon name="barbell-outline" size={40} color={c.textFaint} />
              <Text style={{ color: c.text, fontWeight: '700' }}>Empieza añadiendo un ejercicio a tu rutina</Text>
            </View>
          ) : null}
          <Button label="Añadir ejercicio" icon="add" onPress={() => setPicker({ mode: 'multi' })} />
        </ScrollView>
      </KeyboardAvoidingView>

      <ExercisePicker
        visible={!!picker}
        mode={picker?.mode ?? 'multi'}
        onClose={() => setPicker(null)}
        usedIds={routine.exercises.map((e) => e.exerciseId)}
        onSelect={(ids, superset) => mutate((r) => {
          if (picker?.mode === 'single' && picker.entryId) { entry(r, picker.entryId).exerciseId = ids[0]; return }
          const ssId = superset && ids.length > 1 ? uid() : null
          for (const exId of ids) r.exercises.push({ id: uid(), exerciseId: exId, notes: '', restSeconds: null, supersetId: ssId, sets: [blankSet(), blankSet(), blankSet()] })
        })}
      />
      <ActionSheet
        visible={!!menuFor}
        onClose={() => setMenuFor(null)}
        title={menuFor ? getExercise(menuFor.exerciseId)?.nameEs : undefined}
        actions={menuFor ? [
          { label: 'Reordenar: subir', icon: 'arrow-up-outline', disabled: routine.exercises[0]?.id === menuFor.id, onPress: () => mutate((r) => { const i = r.exercises.findIndex((x) => x.id === menuFor.id); if (i > 0) { const t = r.exercises[i - 1]; r.exercises[i - 1] = r.exercises[i]; r.exercises[i] = t } }) },
          { label: 'Reordenar: bajar', icon: 'arrow-down-outline', disabled: routine.exercises[routine.exercises.length - 1]?.id === menuFor.id, onPress: () => mutate((r) => { const i = r.exercises.findIndex((x) => x.id === menuFor.id); if (i < r.exercises.length - 1) { const t = r.exercises[i + 1]; r.exercises[i + 1] = r.exercises[i]; r.exercises[i] = t } }) },
          { label: 'Reemplazar ejercicio', icon: 'swap-horizontal-outline', onPress: () => setPicker({ mode: 'single', entryId: menuFor.id }) },
          menuFor.supersetId
            ? { label: 'Quitar de la superserie', icon: 'unlink-outline', onPress: () => mutate((r) => { entry(r, menuFor.id).supersetId = null }) }
            : { label: 'Crear superserie', icon: 'link-outline', disabled: routine.exercises.length < 2, onPress: () => setSupersetFor(menuFor) },
          { label: `Temporizador de descanso: ${restLabel(menuFor.restSeconds, settings.defaultRestSeconds)}`, icon: 'timer-outline', onPress: () => setRestFor(menuFor) },
          { label: 'Eliminar ejercicio', icon: 'trash-outline', destructive: true, onPress: () => mutate((r) => { r.exercises = r.exercises.filter((x) => x.id !== menuFor.id) }) },
        ] : []}
      />
      <OptionSheet
        visible={!!restFor}
        onClose={() => setRestFor(null)}
        title="Temporizador de descanso"
        value={restFor?.restSeconds == null ? -1 : restFor.restSeconds}
        options={[{ value: -1, label: `Por defecto (${restLabel(null, settings.defaultRestSeconds)})` }, ...REST_OPTIONS.map((s) => ({ value: s, label: s === 0 ? 'Desactivado' : fmtDuration(s) }))]}
        onSelect={(v) => restFor && mutate((r) => { entry(r, restFor.id).restSeconds = v === -1 ? null : v })}
      />
      <OptionSheet
        visible={!!supersetFor}
        onClose={() => setSupersetFor(null)}
        title="Superserie con..."
        value={null}
        options={routine.exercises.filter((e) => e.id !== supersetFor?.id).map((e) => ({ value: e.id, label: getExercise(e.exerciseId)?.nameEs ?? e.exerciseId }))}
        onSelect={(otherId) => supersetFor && mutate((r) => {
          const other = entry(r, otherId)
          const ssId = other.supersetId ?? uid()
          other.supersetId = ssId
          entry(r, supersetFor.id).supersetId = ssId
        })}
      />
      <ConfirmDialog visible={confirmClose} title="¿Descartar cambios?" message="Los cambios de la rutina no se guardarán." confirmLabel="Descartar" destructive onCancel={() => setConfirmClose(false)} onConfirm={() => { setConfirmClose(false); router.back() }} />
    </View>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 6 },
  notes: { fontSize: 14, paddingHorizontal: 4, paddingVertical: 6, marginBottom: 10 },
})
