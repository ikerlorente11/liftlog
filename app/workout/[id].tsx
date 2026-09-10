// Detalle de un entreno guardado (y edición: título, notas, series).
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { EntryEditor } from '../../src/components/EntryEditor'
import { ExercisePicker } from '../../src/components/ExercisePicker'
import { usePreviousSets, useSupersetIndex } from '../../src/components/useEntryHelpers'
import { fmtDateLong, fmtDuration, fmtWeight, uid } from '../../src/lib/format'
import { completedSets, countPRs, fmtSet, workoutVolume } from '../../src/lib/stats'
import { useData } from '../../src/store/dataStore'
import { useSettings } from '../../src/store/settingsStore'
import { useColors } from '../../src/theme'
import type { ExerciseEntry, SetData, Workout } from '../../src/types'
import { ExerciseThumb } from '../../src/ui/ExerciseImage'
import { Button, Card, Header, HeaderButton, Icon, Screen } from '../../src/ui/primitives'
import { ActionSheet, ConfirmDialog } from '../../src/ui/sheets'

export default function WorkoutDetail() {
  const c = useColors()
  const router = useRouter()
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>()
  const settings = useSettings((s) => s.settings)
  const workouts = useData((s) => s.workouts)
  const { getExercise, typeOf, updateWorkout, deleteWorkout } = useData()
  const stored = workouts.find((w) => w.id === id)
  const [editing, setEditing] = useState(edit === '1')
  const [draft, setDraft] = useState<Workout | null>(null)
  const [menuFor, setMenuFor] = useState<ExerciseEntry | null>(null)
  const [picker, setPicker] = useState<{ mode: 'multi' | 'single'; entryId?: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [menu, setMenu] = useState(false)
  const prevSets = usePreviousSets(workouts, stored?.routineId, id)

  const workout = editing ? (draft ?? stored) : stored
  const ssIndex = useSupersetIndex(workout?.exercises ?? [])
  const volume = useMemo(() => (workout ? workoutVolume(workout, typeOf) : 0), [workout, typeOf])
  if (!workout) return <Screen><Header title="Entreno" left={<HeaderButton icon="chevron-back" onPress={() => router.back()} color={c.text} />} /><Text style={{ color: c.textMuted, padding: 24 }}>Entreno no encontrado.</Text></Screen>

  const startEdit = () => { setDraft(JSON.parse(JSON.stringify(stored)) as Workout); setEditing(true) }
  const mutate = (fn: (w: Workout) => void) => setDraft((d) => { const copy = JSON.parse(JSON.stringify(d ?? stored)) as Workout; fn(copy); return copy })
  const save = async () => {
    if (!draft) { setEditing(false); return }
    const cleaned: Workout = { ...draft, exercises: draft.exercises.map((e) => ({ ...e, sets: e.sets.filter((s) => s.completed) })).filter((e) => e.sets.length > 0) }
    await updateWorkout(cleaned)
    setEditing(false)
    setDraft(null)
  }

  const findEntry = (w: Workout, entryId: string) => w.exercises.find((e) => e.id === entryId)!
  const setPatch = (entryId: string, setId: string, patch: Partial<SetData>) => mutate((w) => { const s = findEntry(w, entryId).sets.find((x) => x.id === setId); if (s) Object.assign(s, patch) })

  return (
    <Screen>
      <Header
        title={editing ? 'Editar entreno' : 'Entreno'}
        left={<HeaderButton icon={editing ? 'close' : 'chevron-back'} onPress={() => (editing ? (setEditing(false), setDraft(null)) : router.back())} color={c.text} />}
        right={editing ? <Button label="Guardar" small onPress={() => void save()} /> : <HeaderButton icon="ellipsis-horizontal" color={c.text} onPress={() => setMenu(true)} />}
      />
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 6 }}>
          {editing ? (
            <TextInput value={workout.title} onChangeText={(t) => mutate((w) => { w.title = t })} style={[styles.titleInput, { color: c.text, backgroundColor: c.input }]} />
          ) : (
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '800' }}>{workout.title}</Text>
          )}
          <Text style={{ color: c.textMuted, fontSize: 13 }}>{fmtDateLong(workout.startedAt)}</Text>
          {editing ? (
            <TextInput value={workout.notes} onChangeText={(t) => mutate((w) => { w.notes = t })} placeholder="Notas" placeholderTextColor={c.textFaint} multiline style={[styles.notesInput, { color: c.text, backgroundColor: c.input }]} />
          ) : workout.notes ? <Text style={{ color: c.textMuted }}>{workout.notes}</Text> : null}
          <View style={styles.stats}>
            <Stat label="Duración" value={fmtDuration(workout.durationS)} />
            <Stat label="Volumen" value={fmtWeight(volume, settings.weightUnit)} />
            <Stat label="Series" value={String(completedSets(workout))} />
            <Stat label="Récords" value={String(countPRs(workout))} />
          </View>
        </Card>

        {editing ? workout.exercises.map((e) => (
          <EntryEditor
            key={e.id}
            entry={e}
            exercise={getExercise(e.exerciseId)}
            mode="workout"
            settings={settings}
            prevSets={prevSets.get(e.exerciseId)}
            supersetIndex={e.supersetId ? ssIndex.get(e.supersetId) : undefined}
            onUpdateSet={(sid, patch) => setPatch(e.id, sid, patch)}
            onAddSet={() => mutate((w) => { const en = findEntry(w, e.id); const last = en.sets[en.sets.length - 1]; en.sets.push({ id: uid(), type: 'normal', weightKg: last?.weightKg ?? null, reps: last?.reps ?? null, distanceM: last?.distanceM ?? null, durationS: last?.durationS ?? null, rpe: null, completed: true }) })}
            onRemoveSet={(sid) => mutate((w) => { const en = findEntry(w, e.id); en.sets = en.sets.filter((s) => s.id !== sid) })}
            onSetType={(sid, t) => setPatch(e.id, sid, { type: t })}
            onToggle={(sid) => mutate((w) => { const s = findEntry(w, e.id).sets.find((x) => x.id === sid); if (s) s.completed = !s.completed })}
            onToggleAll={() => mutate((w) => { const en = findEntry(w, e.id); const allDone = en.sets.length > 0 && en.sets.every((s) => s.completed); for (const s of en.sets) s.completed = !allDone })}
            onNotes={(t) => mutate((w) => { findEntry(w, e.id).notes = t })}
            onRest={(s) => mutate((w) => { findEntry(w, e.id).restSeconds = s })}
            onMenu={() => setMenuFor(e)}
          />
        )) : workout.exercises.map((e) => {
          const ex = getExercise(e.exerciseId)
          const t = typeOf(e.exerciseId)
          const ssI = e.supersetId ? ssIndex.get(e.supersetId) : undefined
          return (
            <Card key={e.id} style={{ gap: 6 }} onPress={() => router.push(`/exercises/${e.exerciseId}`)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ExerciseThumb exercise={ex} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.primary, fontWeight: '700', fontSize: 16 }}>{ex?.nameEs ?? e.exerciseId}</Text>
                  {ssI != null ? <Text style={{ color: c.textMuted, fontSize: 12 }}>Superserie {String.fromCharCode(65 + ssI)}</Text> : null}
                </View>
              </View>
              {e.notes ? <Text style={{ color: c.textMuted, fontSize: 13 }}>{e.notes}</Text> : null}
              <View style={styles.setHead}>
                <Text style={[styles.setHeadText, { color: c.textMuted, width: 44 }]}>SERIE</Text>
                <Text style={[styles.setHeadText, { color: c.textMuted, flex: 1 }]}>{t === 'duration' ? 'TIEMPO' : t === 'distance_duration' ? 'DISTANCIA Y TIEMPO' : 'PESO Y REPS'}</Text>
              </View>
              {e.sets.map((s, i) => (
                <View key={s.id} style={styles.setRow}>
                  <Text style={{ width: 44, color: s.type === 'warmup' ? c.warning : s.type === 'failure' ? c.danger : s.type === 'dropset' ? '#a855f7' : c.text, fontWeight: '700', textAlign: 'center' }}>
                    {s.type === 'normal' ? i + 1 : s.type === 'warmup' ? 'W' : s.type === 'dropset' ? 'D' : 'F'}
                  </Text>
                  <Text style={{ flex: 1, color: c.text }}>{fmtSet(s, t, settings)}{s.rpe ? `  @${s.rpe}` : ''}</Text>
                  {s.isPr ? <View style={[styles.pr, { backgroundColor: c.prGold }]}><Icon name="trophy" size={12} color="#000" /><Text style={styles.prText}>PR</Text></View> : null}
                </View>
              ))}
            </Card>
          )
        })}

        {editing ? <Button label="Añadir ejercicio" icon="add" onPress={() => setPicker({ mode: 'multi' })} /> : null}
      </ScrollView>

      <ActionSheet
        visible={menu}
        onClose={() => setMenu(false)}
        actions={[
          { label: 'Editar entreno', icon: 'create-outline', onPress: startEdit },
          { label: 'Guardar como rutina', icon: 'bookmark-outline', onPress: () => router.push({ pathname: '/routine/edit', params: { fromWorkout: workout.id } }) },
          { label: 'Eliminar entreno', icon: 'trash-outline', destructive: true, onPress: () => setConfirmDelete(true) },
        ]}
      />
      <ActionSheet
        visible={!!menuFor}
        onClose={() => setMenuFor(null)}
        actions={menuFor ? [
          { label: 'Reemplazar ejercicio', icon: 'swap-horizontal-outline', onPress: () => setPicker({ mode: 'single', entryId: menuFor.id }) },
          { label: 'Eliminar ejercicio', icon: 'trash-outline', destructive: true, onPress: () => mutate((w) => { w.exercises = w.exercises.filter((x) => x.id !== menuFor.id) }) },
        ] : []}
      />
      <ExercisePicker
        visible={!!picker}
        mode={picker?.mode ?? 'multi'}
        onClose={() => setPicker(null)}
        onSelect={(ids, superset) => mutate((w) => {
          if (picker?.mode === 'single' && picker.entryId) { findEntry(w, picker.entryId).exerciseId = ids[0]; return }
          const ssId = superset && ids.length > 1 ? uid() : null
          for (const exId of ids) w.exercises.push({ id: uid(), exerciseId: exId, notes: '', restSeconds: null, supersetId: ssId, sets: [{ id: uid(), type: 'normal', weightKg: null, reps: null, distanceM: null, durationS: null, rpe: null, completed: true }] })
        })}
      />
      <ConfirmDialog visible={confirmDelete} title="¿Eliminar entreno?" confirmLabel="Eliminar" destructive onCancel={() => setConfirmDelete(false)} onConfirm={async () => { setConfirmDelete(false); await deleteWorkout(workout.id); router.back() }} />
    </Screen>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  const c = useColors()
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  titleInput: { fontSize: 18, fontWeight: '700', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  notesInput: { fontSize: 14, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minHeight: 60, textAlignVertical: 'top' },
  stats: { flexDirection: 'row', marginTop: 6 },
  setHead: { flexDirection: 'row', marginTop: 4 },
  setHeadText: { fontSize: 11, fontWeight: '700' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  pr: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  prText: { fontSize: 11, fontWeight: '800', color: '#000' },
})
