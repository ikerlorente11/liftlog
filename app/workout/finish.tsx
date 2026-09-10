// Terminar entreno: título/notas, resumen y guardado; después pantalla de
// "Entreno guardado" con estadísticas, PRs y dos pasos sobre la rutina.
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fmtDateLong, fmtDuration, fmtNum, fmtWeight, fromDisplayWeight, toDisplayWeight, uid } from '../../src/lib/format'
import { effectiveTargets } from '../../src/lib/program'
import { bestSet, completedSets, countPRs, fmtSet, workoutVolume } from '../../src/lib/stats'
import { useData } from '../../src/store/dataStore'
import { useSettings } from '../../src/store/settingsStore'
import { useWorkout } from '../../src/store/workoutStore'
import { useColors } from '../../src/theme'
import type { Exercise, ExerciseEntry, ExerciseType, Routine, SetData, Settings, Workout } from '../../src/types'
import { ExerciseThumb } from '../../src/ui/ExerciseImage'
import { Button, Card, Header, HeaderButton, Icon } from '../../src/ui/primitives'

// Al guardar, la pantalla "Entreno guardado" lleva dos pasos en orden:
//  1) ¿Guardar en la rutina lo que has hecho hoy? (pesos/reps/tiempos cambiados
//     durante el entreno). Se aplica sobre las series de trabajo; los
//     calentamientos de la rutina se conservan si hoy no los has apuntado.
//  2) Subir para la próxima semana, ejercicio a ejercicio y campo a campo:
//     +peso, +1 rep o +5 s por separado, u "Otro…" para fijar a mano peso y
//     reps a la vez (p. ej. subir peso bajando reps). Las asistidas y la
//     piscina/descargas no se ofrecen (goma hacia abajo / fases del programa).
type ProgressionField = 'weightKg' | 'reps' | 'durationS'

/** `resetReps`: opción combinada de la doble progresión (+peso y volver al mínimo del rango). */
interface FieldOption { field: ProgressionField; step: number; resetReps?: number }

interface RoutineChange { name: string; before: string; after: string; kind: 'changed' | 'added' | 'skipped' }

function weightStep(equipment?: string): number { return equipment === 'machine' || equipment === 'plate' ? 5 : 2.5 }

/** Campos por los que puede subir un ejercicio según su tipo (en orden de preferencia). */
function fieldOptions(t: ExerciseType, equipment?: string): FieldOption[] {
  const w = { field: 'weightKg' as const, step: weightStep(equipment) }
  const r = { field: 'reps' as const, step: 1 }
  const d = { field: 'durationS' as const, step: 5 }
  switch (t) {
    case 'weight_reps': return [w, r]
    case 'weighted_bodyweight': return [r, w]
    case 'weight_duration': return [w, d]
    case 'bodyweight_reps': case 'reps_only': return [r]
    case 'duration': return [d]
    default: return []
  }
}

const working = (sets: SetData[]) => sets.filter((s) => s.type !== 'warmup')

const cloneSet = (s: SetData): SetData => ({ id: uid(), type: s.type, weightKg: s.weightKg, reps: s.reps, distanceM: s.distanceM, durationS: s.durationS, rpe: null, completed: false })

/** "220 kg × 5 ×5" agrupando series de trabajo iguales consecutivas. */
function summarizeSets(sets: SetData[], t: ExerciseType, settings: Settings): string {
  const groups: { label: string; n: number }[] = []
  for (const s of working(sets)) {
    const label = fmtSet(s, t, settings)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.n++
    else groups.push({ label, n: 1 })
  }
  return groups.map((g) => (g.n > 1 ? `${g.label} ×${g.n}` : g.label)).join(', ') || '-'
}

const sameValues = (a: SetData, b: SetData) => a.weightKg === b.weightKg && a.reps === b.reps && a.durationS === b.durationS && a.distanceM === b.distanceM

/** Empareja cada ejercicio del entreno con una entrada de la rutina (mismo ejercicio, en orden). */
function pairEntries(workout: Workout, routine: Routine): Map<string, ExerciseEntry> {
  const m = new Map<string, ExerciseEntry>()
  const used = new Set<string>()
  for (const we of workout.exercises) {
    const re = routine.exercises.find((r) => r.exerciseId === we.exerciseId && !used.has(r.id))
    if (re) { used.add(re.id); m.set(we.id, re) }
  }
  return m
}

/** Rutina con los valores de hoy y la lista de cambios que supone. */
function applyWorkoutToRoutine(workout: Workout, routine: Routine, typeOf: (id: string) => ExerciseType, getExercise: (id: string) => Exercise | undefined, settings: Settings): { routine: Routine; changes: RoutineChange[] } {
  const pairs = pairEntries(workout, routine)
  const changes: RoutineChange[] = []
  const nameOf = (id: string) => getExercise(id)?.nameEs ?? id
  const nextEntries: ExerciseEntry[] = []
  const handled = new Set<string>()
  for (const we of workout.exercises) {
    const t = typeOf(we.exerciseId)
    const re = pairs.get(we.id)
    const todayWork = working(we.sets)
    if (!re) {
      nextEntries.push({ id: uid(), exerciseId: we.exerciseId, notes: we.notes, restSeconds: we.restSeconds, supersetId: we.supersetId, sets: we.sets.map(cloneSet) })
      changes.push({ name: nameOf(we.exerciseId), before: '', after: summarizeSets(we.sets, t, settings), kind: 'added' })
      continue
    }
    handled.add(re.id)
    const routineWork = working(re.sets)
    const differs = routineWork.length !== todayWork.length || routineWork.some((s, i) => !sameValues(s, todayWork[i]))
    if (!differs || !todayWork.length) { nextEntries.push(re); continue }
    // Calentamientos: los de hoy si los has apuntado; si no, los de la rutina.
    const todayWarm = we.sets.filter((s) => s.type === 'warmup')
    const warm = todayWarm.length ? todayWarm.map(cloneSet) : re.sets.filter((s) => s.type === 'warmup')
    const work = todayWork.map((s, i) => ({ ...cloneSet(s), id: routineWork[i]?.id ?? uid() }))
    nextEntries.push({ ...re, sets: [...warm, ...work] })
    changes.push({ name: nameOf(we.exerciseId), before: summarizeSets(re.sets, t, settings), after: summarizeSets(we.sets, t, settings), kind: 'changed' })
  }
  // Un ejercicio de la rutina que hoy no has hecho se mantiene: saltarlo un día
  // no lo borra del plan (para quitarlo, edita la rutina).
  for (const re of routine.exercises) {
    if (handled.has(re.id)) continue
    nextEntries.push(re)
    changes.push({ name: nameOf(re.exerciseId), before: summarizeSets(re.sets, typeOf(re.exerciseId), settings), after: '', kind: 'skipped' })
  }
  return { routine: { ...routine, updatedAt: Date.now(), exercises: nextEntries }, changes }
}

interface ProgressionRow {
  entryId: string
  name: string
  type: ExerciseType
  options: FieldOption[]
  /** Todas las series de trabajo hechas y al objetivo de la rutina */
  clean: boolean
  /** Texto de ayuda de la doble progresión (si el ejercicio tiene rango) */
  hint: string | null
}

function computeProgressionRows(workout: Workout, routine: Routine, typeOf: (id: string) => ExerciseType, getExercise: (id: string) => Exercise | undefined): ProgressionRow[] {
  const pairs = pairEntries(workout, routine)
  const rows: ProgressionRow[] = []
  for (const we of workout.exercises) {
    const re = pairs.get(we.id)
    if (!re) continue
    const t = typeOf(we.exerciseId)
    const ex = getExercise(we.exerciseId)
    const target = working(re.sets)
    if (!target.length) continue
    // Solo campos con objetivo definido en todas las series (si no, es día de calibración)
    let options = fieldOptions(t, ex?.equipment).filter((o) => target.every((s) => s[o.field] != null))
    if (!options.length) continue
    const work = working(we.sets)
    // Doble progresión con rango: por debajo del máximo solo se ofrece +1 rep;
    // con todas las series hechas al máximo, +peso volviendo al mínimo.
    let hint: string | null = null
    const range = re.repRange
    if (range && options.some((o) => o.field === 'reps')) {
      const atMax = work.length >= target.length && target.every((_, i) => (work[i]?.reps ?? 0) >= range.max && work[i]?.completed)
      const weightOpt = options.find((o) => o.field === 'weightKg')
      if (atMax && weightOpt) {
        options = [{ ...weightOpt, resetReps: range.min }]
        hint = `Rango ${range.min}-${range.max}: has llegado al máximo en todas las series → toca subir peso y volver a ${range.min}.`
      } else if (atMax) {
        options = []
        hint = `Rango ${range.min}-${range.max}: tope alcanzado. A peso corporal se progresa cambiando de variante o palanca (mira la nota) y volviendo a ${range.min}.`
      } else {
        options = options.filter((o) => o.field === 'reps')
        const cap = Math.min(...target.map((s) => s.reps ?? range.max))
        hint = `Rango ${range.min}-${range.max}: sube reps hasta ${range.max} (objetivo actual ${cap}); el peso se sube al completar ${range.max} en todas.`
      }
    }
    const clean = work.length >= target.length && work.every((s) => s.completed) && target.every((ts, i) => {
      const ws = work[i]
      if (ts.weightKg != null && (ws.weightKg ?? 0) < ts.weightKg) return false
      if (ts.reps != null && (ws.reps ?? 0) < ts.reps) return false
      if (ts.durationS != null && (ws.durationS ?? 0) < ts.durationS) return false
      return true
    })
    rows.push({ entryId: re.id, name: ex?.nameEs ?? we.exerciseId, type: t, options, clean, hint })
  }
  return rows
}

export default function FinishScreen() {
  const c = useColors()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const settings = useSettings((s) => s.settings)
  const active = useWorkout((s) => s.active)
  const buildFinal = useWorkout((s) => s.buildFinal)
  const discard = useWorkout((s) => s.discard)
  const setManualDuration = useWorkout((s) => s.setManualDuration)
  const { saveWorkout, getExercise, typeOf, routines, saveRoutine } = useData()

  const [title, setTitle] = useState(active?.title ?? 'Entrenamiento')
  const [notes, setNotes] = useState(active?.notes ?? '')
  const [saved, setSaved] = useState<{ workout: Workout; prs: number } | null>(null)
  // Paso 1 (rutina con lo de hoy): pendiente, aplicada o rechazada.
  const [step1, setStep1] = useState<'pending' | 'applied' | 'kept'>('pending')
  const [changes, setChanges] = useState<RoutineChange[]>([])
  // Paso 2: filas congeladas al guardar (si recalculara tras una subida, cambiarían).
  const [rows, setRows] = useState<ProgressionRow[]>([])
  /** Entrada anterior de cada ejercicio subido, para deshacer */
  const [bumped, setBumped] = useState<Record<string, ExerciseEntry>>({})
  const [customFor, setCustomFor] = useState<string | null>(null)
  const [custom, setCustom] = useState<Record<ProgressionField, string>>({ weightKg: '', reps: '', durationS: '' })
  const [saving, setSaving] = useState(false)
  // Duración editable (en minutos) para entrenos apuntados a posteriori.
  const [durationMin, setDurationMin] = useState<string | null>(null)

  const preview = useMemo(() => buildFinal(title, notes), [buildFinal, title, notes])
  const workout = saved?.workout ?? preview
  const routine: Routine | undefined = workout?.routineId ? routines.find((r) => r.id === workout.routineId) : undefined

  // En semanas con objetivos propios del plan (natación) o de descarga, los
  // valores del día no deben convertirse en los objetivos base de la rutina.
  const phaseManaged = useMemo(() => {
    if (!workout || !routine?.program) return false
    const t = effectiveTargets(routine, workout.startedAt, settings.weekStartsMonday)
    return !!(t.phase?.exercises || t.phase?.deload)
  }, [workout, routine, settings.weekStartsMonday])

  useEffect(() => { if (!workout) router.back() }, [workout, router])
  if (!workout) return null

  const volume = workoutVolume(workout, typeOf)
  const sets = completedSets(workout)

  const save = async () => {
    if (saving) return
    setSaving(true)
    const w = buildFinal(title, notes)!
    const prs = await saveWorkout(w)
    const r = w.routineId ? routines.find((x) => x.id === w.routineId) : undefined
    if (r && !phaseManaged) {
      const diff = applyWorkoutToRoutine(w, r, typeOf, getExercise, settings)
      setChanges(diff.changes)
      // Sin cambios de valores no hay nada que preguntar: al paso 2 directamente.
      if (!diff.changes.some((ch) => ch.kind !== 'skipped')) setStep1('kept')
      setRows(computeProgressionRows(w, r, typeOf, getExercise))
    }
    setSaved({ workout: w, prs })
    setSaving(false)
    // Cerrar el entreno activo desmonta la pantalla de registro y repinta las
    // pestañas: mejor después de que se vea "Entreno guardado".
    setTimeout(discard, 300)
  }

  const currentRoutine = () => (workout.routineId ? routines.find((x) => x.id === workout.routineId) : undefined)

  const applyToday = async () => {
    const r = currentRoutine()
    if (!r) return
    const { routine: updated } = applyWorkoutToRoutine(workout, r, typeOf, getExercise, settings)
    await saveRoutine(updated)
    // Las entradas conservan su id al aplicar el paso 1, pero las filas del paso 2
    // se recalculan para que "limpio" se mida contra los objetivos nuevos.
    setRows(computeProgressionRows(workout, updated, typeOf, getExercise))
    setStep1('applied')
  }

  const saveEntry = async (entryId: string, patch: (s: SetData) => SetData) => {
    const r = currentRoutine()
    if (!r) return
    const prev = r.exercises.find((e) => e.id === entryId)
    if (!prev) return
    const updated: Routine = { ...r, updatedAt: Date.now(), exercises: r.exercises.map((e) => (e.id !== entryId ? e : { ...e, sets: e.sets.map((s) => (s.type === 'warmup' ? s : patch(s))) })) }
    await saveRoutine(updated)
    setBumped((b) => ({ ...b, [entryId]: prev }))
    setCustomFor(null)
  }

  const bump = (entryId: string, o: FieldOption) => saveEntry(entryId, (s) => (s[o.field] == null ? s : { ...s, [o.field]: s[o.field]! + o.step, ...(o.resetReps != null ? { reps: o.resetReps } : {}) }))

  const applyCustom = (entryId: string) => {
    const w = custom.weightKg.trim() ? fromDisplayWeight(parseFloat(custom.weightKg.replace(',', '.')), settings.weightUnit) : null
    const r = custom.reps.trim() ? parseInt(custom.reps, 10) : null
    const d = custom.durationS.trim() ? parseInt(custom.durationS, 10) : null
    return saveEntry(entryId, (s) => ({
      ...s,
      weightKg: w != null && Number.isFinite(w) ? w : s.weightKg,
      reps: r != null && Number.isFinite(r) ? r : s.reps,
      durationS: d != null && Number.isFinite(d) ? d : s.durationS,
    }))
  }

  const undoBump = async (entryId: string) => {
    const r = currentRoutine()
    const prev = bumped[entryId]
    if (!r || !prev) return
    await saveRoutine({ ...r, updatedAt: Date.now(), exercises: r.exercises.map((e) => (e.id === entryId ? prev : e)) })
    setBumped((b) => { const { [entryId]: _omit, ...rest } = b; return rest })
  }

  const openCustom = (entryId: string) => {
    const re = currentRoutine()?.exercises.find((e) => e.id === entryId)
    const w = working(re?.sets ?? [])
    const uniform = (f: ProgressionField) => { const v = [...new Set(w.map((s) => s[f]))]; return v.length === 1 && v[0] != null ? v[0] : null }
    const wk = uniform('weightKg')
    setCustom({ weightKg: wk != null ? fmtNum(toDisplayWeight(wk, settings.weightUnit)) : '', reps: uniform('reps')?.toString() ?? '', durationS: uniform('durationS')?.toString() ?? '' })
    setCustomFor(entryId)
  }

  const share = async () => {
    const lines = [
      `${workout.title} · ${fmtDateLong(workout.startedAt)}`,
      `Duración ${fmtDuration(workout.durationS)} · Volumen ${fmtWeight(volume, settings.weightUnit)} · ${sets} series`,
      '',
      ...workout.exercises.map((e) => {
        const ex = getExercise(e.exerciseId)
        const t = typeOf(e.exerciseId)
        return `${ex?.nameEs ?? e.exerciseId}\n${e.sets.map((s, i) => `  ${i + 1}. ${fmtSet(s, t, settings)}${s.isPr ? ' 🏆' : ''}`).join('\n')}`
      }),
    ]
    await Share.share({ message: lines.join('\n') })
  }

  const done = () => router.dismissAll()

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <Header
        title={saved ? 'Entreno guardado' : 'Guardar entreno'}
        left={saved ? undefined : <HeaderButton icon="chevron-back" onPress={() => router.back()} color={c.text} />}
        right={saved ? <HeaderButton icon="share-outline" onPress={() => void share()} /> : <Button label="Guardar" small onPress={() => void save()} loading={saving} />}
      />
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: insets.bottom + 100 }} keyboardShouldPersistTaps="handled">
        {saved ? (
          <View style={{ alignItems: 'center', gap: 6, paddingVertical: 12 }}>
            <View style={[styles.trophy, { backgroundColor: c.primarySoft }]}><Icon name="trophy" size={36} color={c.prGold} /></View>
            <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>¡Buen trabajo!</Text>
            <Text style={{ color: c.textMuted }}>{saved.prs > 0 ? `${saved.prs} ${saved.prs === 1 ? 'récord personal' : 'récords personales'} 🏆` : 'Entreno registrado correctamente'}</Text>
          </View>
        ) : null}

        <Card style={{ gap: 8 }}>
          {saved ? (
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{workout.title}</Text>
          ) : (
            <TextInput value={title} onChangeText={setTitle} style={[styles.title, { color: c.text, backgroundColor: c.input }]} placeholder="Título" placeholderTextColor={c.textFaint} />
          )}
          <Text style={{ color: c.textMuted, fontSize: 13 }}>{fmtDateLong(workout.startedAt)}</Text>
          {saved ? (workout.notes ? <Text style={{ color: c.textMuted }}>{workout.notes}</Text> : null) : (
            <TextInput value={notes} onChangeText={setNotes} style={[styles.notes, { color: c.text, backgroundColor: c.input }]} placeholder="¿Cómo ha ido el entreno?" placeholderTextColor={c.textFaint} multiline />
          )}
          {!saved ? (
            <View style={styles.durationRow}>
              <Text style={{ color: c.textMuted, fontSize: 13, flex: 1 }}>Duración (min) · edítala si lo apuntas después</Text>
              <TextInput
                value={durationMin ?? String(Math.max(1, Math.round(workout.durationS / 60)))}
                onChangeText={setDurationMin}
                onBlur={() => {
                  if (durationMin == null) return
                  const n = parseInt(durationMin, 10)
                  if (Number.isFinite(n) && n > 0) setManualDuration(n * 60)
                  else setDurationMin(null)
                }}
                keyboardType="number-pad"
                selectTextOnFocus
                style={[styles.durationInput, { color: c.text, backgroundColor: c.input }]}
              />
            </View>
          ) : null}
          <View style={styles.stats}>
            <Stat label="Duración" value={fmtDuration(workout.durationS)} />
            <Stat label="Volumen" value={fmtWeight(volume, settings.weightUnit)} />
            <Stat label="Series" value={String(sets)} />
            <Stat label="Récords" value={String(saved ? saved.prs : countPRs(workout))} />
          </View>
        </Card>

        <Card style={{ gap: 10 }}>
          {workout.exercises.map((e) => {
            const ex = getExercise(e.exerciseId)
            const t = typeOf(e.exerciseId)
            const best = bestSet(e, t)
            return (
              <View key={e.id} style={styles.exRow}>
                <ExerciseThumb exercise={ex} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: '600' }}>{e.sets.length} × {ex?.nameEs ?? e.exerciseId}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>Mejor serie: {best ? fmtSet(best, t, settings) : '-'}{e.sets.some((s) => s.isPr) ? ' 🏆' : ''}</Text>
                </View>
              </View>
            )
          })}
        </Card>

        {saved && routine && !phaseManaged && step1 === 'pending' ? (
          <Card style={{ gap: 10 }}>
            <Text style={{ color: c.text, fontWeight: '700' }}>1 · ¿Guardar en la rutina lo de hoy?</Text>
            <Text style={{ color: c.textMuted, fontSize: 13 }}>Has hecho series distintas a las de "{routine.name}". Si lo guardas, estos valores serán los objetivos de los próximos entrenos.</Text>
            {changes.map((ch, i) => (
              <View key={i} style={{ gap: 1 }}>
                <Text style={{ color: c.text, fontWeight: '600' }}>{ch.name}{ch.kind === 'added' ? ' · nuevo' : ch.kind === 'skipped' ? ' · hoy no hecho (se mantiene)' : ''}</Text>
                {ch.kind === 'changed' ? <Text style={{ color: c.textMuted, fontSize: 12 }}>{ch.before}  →  {ch.after}</Text> : null}
                {ch.kind === 'added' ? <Text style={{ color: c.textMuted, fontSize: 12 }}>{ch.after}</Text> : null}
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="Dejar como está" variant="secondary" onPress={() => setStep1('kept')} style={{ flex: 1 }} />
              <Button label="Guardar en la rutina" onPress={() => void applyToday()} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : null}
        {saved && step1 === 'applied' ? <Text style={{ color: c.success, textAlign: 'center' }}>Rutina actualizada con lo de hoy ✓</Text> : null}

        {saved && routine && !phaseManaged && step1 !== 'pending' && rows.length > 0 ? (
          <Card style={{ gap: 12 }}>
            <Text style={{ color: c.text, fontWeight: '700' }}>2 · ¿Subir algo para la próxima semana?</Text>
            <Text style={{ color: c.textMuted, fontSize: 13 }}>Elige qué subir en cada ejercicio. "Limpio" = todas las series hechas al objetivo; si además te ha sobrado margen (RIR 1-2), sube. Con "Otro…" fijas peso y reps a la vez (p. ej. más peso con menos reps).</Text>
            {rows.map((row) => {
              const re = routine.exercises.find((e) => e.id === row.entryId)
              if (!re) return null
              const done = !!bumped[row.entryId]
              const prevSummary = done ? summarizeSets(bumped[row.entryId].sets, row.type, settings) : null
              const optLabel = (o: FieldOption) => o.resetReps != null ? `+${fmtWeight(o.step, settings.weightUnit)} y volver a ${o.resetReps} reps` : o.field === 'weightKg' ? `+${fmtWeight(o.step, settings.weightUnit)}` : o.field === 'reps' ? '+1 rep' : '+5 s'
              return (
                <View key={row.entryId} style={{ gap: 6 }}>
                  <View style={styles.exRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontWeight: '600' }}>{row.name} <Text style={{ color: row.clean ? c.success : c.textFaint, fontSize: 12 }}>{row.clean ? '· limpio ✓' : '· no completado al objetivo'}</Text></Text>
                      <Text style={{ color: done ? c.success : c.textMuted, fontSize: 12 }}>{prevSummary ? `${prevSummary}  →  ` : ''}{summarizeSets(re.sets, row.type, settings)}</Text>
                    </View>
                    {done ? <Button label="Deshacer" small variant="ghost" onPress={() => void undoBump(row.entryId)} /> : null}
                  </View>
                  {!done && row.hint ? <Text style={{ color: c.textFaint, fontSize: 12 }}>{row.hint}</Text> : null}
                  {!done ? (
                    <View style={styles.optRow}>
                      {row.options.map((o) => <Button key={o.field} label={optLabel(o)} small variant={row.clean ? 'primary' : 'secondary'} onPress={() => void bump(row.entryId, o)} />)}
                      <Button label="Otro…" small variant="secondary" onPress={() => (customFor === row.entryId ? setCustomFor(null) : openCustom(row.entryId))} />
                    </View>
                  ) : null}
                  {!done && customFor === row.entryId ? (
                    <View style={[styles.customBox, { backgroundColor: c.cardAlt }]}>
                      <Text style={{ color: c.textMuted, fontSize: 12 }}>Nuevo objetivo para todas las series de trabajo (deja en blanco lo que no cambie):</Text>
                      <View style={styles.optRow}>
                        {row.options.some((o) => o.field === 'weightKg') ? <CustomField label={settings.weightUnit} value={custom.weightKg} onChange={(v) => setCustom((x) => ({ ...x, weightKg: v }))} decimal /> : null}
                        {row.options.some((o) => o.field === 'reps') ? <CustomField label="reps" value={custom.reps} onChange={(v) => setCustom((x) => ({ ...x, reps: v }))} /> : null}
                        {row.options.some((o) => o.field === 'durationS') ? <CustomField label="s" value={custom.durationS} onChange={(v) => setCustom((x) => ({ ...x, durationS: v }))} /> : null}
                        <Button label="Aplicar" small onPress={() => void applyCustom(row.entryId)} />
                      </View>
                    </View>
                  ) : null}
                </View>
              )
            })}
          </Card>
        ) : null}
      </ScrollView>
      {saved ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: c.bg, borderTopColor: c.border }]}>
          <Button label="Listo" onPress={done} />
        </View>
      ) : null}
    </View>
  )
}

function CustomField({ label, value, onChange, decimal }: { label: string; value: string; onChange: (v: string) => void; decimal?: boolean }) {
  const c = useColors()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <TextInput value={value} onChangeText={onChange} keyboardType={decimal ? 'decimal-pad' : 'number-pad'} selectTextOnFocus style={[styles.customInput, { color: c.text, backgroundColor: c.input }]} />
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
    </View>
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
  trophy: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  notes: { fontSize: 14, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minHeight: 70, textAlignVertical: 'top' },
  stats: { flexDirection: 'row', marginTop: 4 },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  durationInput: { width: 72, textAlign: 'center', fontWeight: '700', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontVariant: ['tabular-nums'] },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  customBox: { borderRadius: 10, padding: 10, gap: 8 },
  customInput: { width: 64, textAlign: 'center', fontWeight: '700', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontVariant: ['tabular-nums'] },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
})
