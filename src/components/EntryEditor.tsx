// Editor de un ejercicio dentro de una rutina o de un entreno en curso: cabecera
// (imagen, nombre, menú), notas, temporizador de descanso y tabla de series
// (SERIE · ANTERIOR · KG · REPS · ✓). Borrar serie: mantener pulsada la fila
// o tocar el número de serie → menú.
import { useRouter } from 'expo-router'
import { memo, useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { fmtClock, fmtDuration, fmtNum, fromDisplayDistance, fromDisplayWeight, parseClock, toDisplayDistance, toDisplayWeight } from '../lib/format'
import { columnsFor, SET_TYPE_SHORT } from '../lib/labels'
import { fmtPrev } from '../lib/stats'
import { useColors } from '../theme'
import type { Exercise, ExerciseEntry, SetData, SetType, Settings } from '../types'
import { ExerciseThumb } from '../ui/ExerciseImage'
import { Icon } from '../ui/primitives'
import { ActionSheet, OptionSheet, RepRangeDialog } from '../ui/sheets'
import { SetTimerButton } from './SetTimer'

export const REST_OPTIONS = [0, 15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300]
export function restLabel(s: number | null, defaultRest: number): string {
  const v = s == null ? defaultRest : s
  return v === 0 ? 'Desactivado' : fmtDuration(v)
}

export const SUPERSET_COLORS = ['#3d8bff', '#f5a623', '#a855f7', '#2ecc71', '#ff5a5f', '#22d3ee']

export interface EntryEditorProps {
  entry: ExerciseEntry
  exercise: Exercise | undefined
  mode: 'routine' | 'workout'
  settings: Settings
  prevSets?: SetData[]
  supersetIndex?: number
  onUpdateSet: (setId: string, patch: Partial<SetData>) => void
  onAddSet: () => void
  onRemoveSet: (setId: string) => void
  onSetType: (setId: string, type: SetType) => void
  onToggle?: (setId: string) => void
  /** Tick de la cabecera: marca todas las series de golpe (sin arrancar el descanso) */
  onToggleAll?: () => void
  onNotes: (text: string) => void
  onRest: (seconds: number | null) => void
  /** Modo rutina: rango de reps para la doble progresión (null = sin rango) */
  onRepRange?: (range: { min: number; max: number } | null) => void
  onMenu: () => void
  /** Entreno en curso: botón de temporizador en las series de tiempo */
  enableSetTimer?: boolean
}

function NumInput({ value, placeholder, onCommit, kind, style, disabled }: {
  value: number | null; placeholder?: string; onCommit: (v: number | null) => void; kind: 'decimal' | 'int' | 'clock'; style?: object; disabled?: boolean
}) {
  const c = useColors()
  const toText = (v: number | null) => (v == null ? '' : kind === 'clock' ? fmtClock(v) : fmtNum(v))
  const [text, setText] = useState(toText(value))
  // La caja de texto nativa solo existe mientras se edita: crear ~100 TextInput
  // al abrir un entreno era lo que hacía lenta la pantalla. En reposo es un
  // Text con el mismo aspecto; al tocarlo se monta el TextInput ya enfocado.
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    if (!editing) setText(toText(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  const commit = (t: string) => {
    setText(t)
    if (kind === 'clock') { onCommit(parseClock(t)); return }
    const norm = t.replace(',', '.')
    if (norm === '' || norm === '.') { onCommit(null); return }
    const n = Number(norm)
    if (!Number.isNaN(n)) onCommit(kind === 'int' ? Math.round(n) : n)
  }
  if (!editing) {
    return (
      <Text onPress={disabled ? undefined : () => setEditing(true)} style={[styles.input, styles.inputIdle, { backgroundColor: c.input, color: text ? c.text : c.textFaint }, style]}>{text || placeholder || ''}</Text>
    )
  }
  return (
    <TextInput
      value={text}
      onChangeText={commit}
      autoFocus
      onBlur={() => { setEditing(false); setText(toText(value)) }}
      placeholder={placeholder}
      placeholderTextColor={c.textFaint}
      keyboardType={kind === 'clock' ? 'numbers-and-punctuation' : kind === 'int' ? 'number-pad' : 'decimal-pad'}
      selectTextOnFocus
      editable={!disabled}
      style={[styles.input, { backgroundColor: c.inputFocus, color: c.text }, style]}
    />
  )
}

function SetRow({ set, index, exType, mode, settings, prev, entryId, setTimer, onUpdate, onRemove, onType, onToggle }: {
  set: SetData; index: number; exType: Exercise['type']; mode: 'routine' | 'workout'; settings: Settings; prev?: SetData
  entryId: string; setTimer?: boolean
  onUpdate: (patch: Partial<SetData>) => void; onRemove: () => void; onType: (t: SetType) => void; onToggle?: () => void
}) {
  const c = useColors()
  const [typeSheet, setTypeSheet] = useState(false)
  const cols = columnsFor(exType, settings.weightUnit, settings.distanceUnit)
  const done = mode === 'workout' && set.completed
  const typeColor = set.type === 'warmup' ? c.warning : set.type === 'dropset' ? '#a855f7' : set.type === 'failure' ? c.danger : c.text
  const label = set.type === 'normal' ? String(index) : SET_TYPE_SHORT[set.type]

  const cell = (key: 'weight' | 'reps' | 'distance' | 'duration') => {
    const ph = prev ? prevPlaceholder(prev, key, settings) : undefined
    switch (key) {
      case 'weight':
        return <NumInput key={key} kind="decimal" placeholder={ph} value={set.weightKg == null ? null : toDisplayWeight(set.weightKg, settings.weightUnit)} onCommit={(v) => onUpdate({ weightKg: v == null ? null : fromDisplayWeight(v, settings.weightUnit) })} />
      case 'reps':
        return <NumInput key={key} kind="int" placeholder={ph} value={set.reps} onCommit={(v) => onUpdate({ reps: v })} />
      case 'distance':
        return <NumInput key={key} kind="decimal" placeholder={ph} value={set.distanceM == null ? null : toDisplayDistance(set.distanceM, settings.distanceUnit)} onCommit={(v) => onUpdate({ distanceM: v == null ? null : fromDisplayDistance(v, settings.distanceUnit) })} />
      case 'duration': {
        const input = <NumInput kind="clock" placeholder={ph} value={set.durationS} onCommit={(v) => onUpdate({ durationS: v })} style={setTimer ? { flex: 1 } : undefined} />
        if (!setTimer) return <View key={key}>{input}</View>
        // Objetivo del temporizador: el tiempo de la serie o, si está vacía, el de la
        // vez anterior; sin ninguno de los dos hace de cronómetro.
        const target = set.durationS ?? prev?.durationS ?? null
        return (
          <View key={key} style={styles.durationCell}>
            {input}
            <SetTimerButton entryId={entryId} setId={set.id} targetS={target} />
          </View>
        )
      }
    }
  }

  return (
    <>
      {/* Sin Swipeable por fila: el gesto costaba un tercio del tiempo de abrir
          un entreno; borrar sigue en el menú del número de serie / pulsación larga. */}
        <Pressable
          onLongPress={() => { Haptics.selectionAsync().catch(() => undefined); setTypeSheet(true) }}
          delayLongPress={350}
          style={[styles.setRow, { backgroundColor: done ? c.successSoft : c.card }]}
        >
          <Pressable onPress={() => setTypeSheet(true)} style={styles.setNumCell} hitSlop={6}>
            <Text style={[styles.setNum, { color: typeColor }]}>{label}</Text>
          </Pressable>
          {mode === 'workout' ? (
            <View style={styles.prevCell}>
              <Text numberOfLines={1} style={{ color: c.textFaint, fontSize: 13, textAlign: 'center' }}>{prev ? fmtPrev(prev, exType, settings) : '-'}</Text>
            </View>
          ) : null}
          <View style={[styles.inputsCell, cols.length === 1 && { justifyContent: 'center' }]}>
            {cols.map((col) => <View key={col.key} style={{ flex: 1, maxWidth: cols.length === 1 ? (setTimer && col.key === 'duration' ? 150 : 110) : undefined }}>{cell(col.key)}</View>)}
          </View>
          {mode === 'workout' ? (
            <Pressable onPress={() => {
              if (!set.completed && prev && !hasValues(set)) onUpdate({ weightKg: prev.weightKg, reps: prev.reps, distanceM: prev.distanceM, durationS: prev.durationS })
              onToggle?.()
            }} hitSlop={6} style={[styles.checkCell]}>
              <View style={[styles.check, { backgroundColor: done ? c.success : c.cardAlt }]}>
                <Icon name="checkmark" size={18} color={done ? '#fff' : c.textMuted} />
              </View>
            </Pressable>
          ) : null}
        </Pressable>
      <ActionSheet
        visible={typeSheet}
        onClose={() => setTypeSheet(false)}
        title={`Serie ${index}`}
        actions={[
          { label: 'Serie de calentamiento', icon: 'flame-outline', onPress: () => onType('warmup') },
          { label: 'Serie normal', icon: 'ellipse-outline', onPress: () => onType('normal') },
          { label: 'Drop set', icon: 'arrow-down-circle-outline', onPress: () => onType('dropset') },
          { label: 'Serie al fallo', icon: 'flash-outline', onPress: () => onType('failure') },
          { label: 'Eliminar serie', icon: 'trash-outline', destructive: true, onPress: onRemove },
        ]}
      />
    </>
  )
}

function hasValues(s: SetData): boolean {
  return s.weightKg != null || s.reps != null || s.distanceM != null || s.durationS != null
}

function prevPlaceholder(prev: SetData, key: 'weight' | 'reps' | 'distance' | 'duration', settings: Settings): string | undefined {
  switch (key) {
    case 'weight': return prev.weightKg == null ? undefined : fmtNum(toDisplayWeight(prev.weightKg, settings.weightUnit))
    case 'reps': return prev.reps == null ? undefined : String(prev.reps)
    case 'distance': return prev.distanceM == null ? undefined : fmtNum(toDisplayDistance(prev.distanceM, settings.distanceUnit))
    case 'duration': return prev.durationS == null ? undefined : fmtClock(prev.durationS)
  }
}

/** Notas del ejercicio: Text en reposo, TextInput solo al tocar (misma razón que NumInput). */
function LazyNotes({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const c = useColors()
  const [editing, setEditing] = useState(false)
  if (!editing) {
    return (
      <Text onPress={() => setEditing(true)} style={[styles.notes, { color: value ? c.text : c.textFaint }]}>{value || 'Añadir notas aquí...'}</Text>
    )
  }
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      autoFocus
      onBlur={() => setEditing(false)}
      placeholder="Añadir notas aquí..."
      placeholderTextColor={c.textFaint}
      multiline
      style={[styles.notes, { color: c.text }]}
    />
  )
}

export const EntryEditor = memo(function EntryEditor(p: EntryEditorProps) {
  const c = useColors()
  const router = useRouter()
  const [restSheet, setRestSheet] = useState(false)
  const [rangeDialog, setRangeDialog] = useState(false)
  const type = p.exercise?.type ?? 'weight_reps'
  const cols = columnsFor(type, p.settings.weightUnit, p.settings.distanceUnit)
  const timed = !!p.enableSetTimer && p.mode === 'workout' && cols.some((col) => col.key === 'duration')
  const ssColor = p.supersetIndex != null ? SUPERSET_COLORS[p.supersetIndex % SUPERSET_COLORS.length] : null
  // "anterior": emparejamos por índice de serie de trabajo
  const prevByIndex = useMemo(() => p.prevSets ?? [], [p.prevSets])
  const allDone = p.entry.sets.length > 0 && p.entry.sets.every((s) => s.completed)

  let normalIndex = 0
  return (
    <View style={[styles.card, { backgroundColor: c.card }, ssColor ? { borderLeftWidth: 4, borderLeftColor: ssColor } : null]}>
      <View style={styles.head}>
        <Pressable onPress={() => p.exercise && router.push(`/exercises/${p.exercise.id}`)} style={styles.headLeft}>
          <ExerciseThumb exercise={p.exercise} size={40} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={2} style={{ color: c.primary, fontSize: 16, fontWeight: '700' }}>{p.exercise?.nameEs ?? p.entry.exerciseId}</Text>
            {ssColor ? <Text style={{ color: ssColor, fontSize: 12, fontWeight: '600' }}>Superserie {String.fromCharCode(65 + (p.supersetIndex ?? 0))}</Text> : null}
          </View>
        </Pressable>
        <Pressable onPress={p.onMenu} hitSlop={8} style={[styles.menuBtn, { backgroundColor: c.primarySoft }]}>
          <Icon name="ellipsis-horizontal" size={20} color={c.primary} />
        </Pressable>
      </View>

      <LazyNotes value={p.entry.notes} onChange={p.onNotes} />

      <Pressable onPress={() => setRestSheet(true)} style={styles.restRow}>
        <Icon name="timer-outline" size={18} color={c.primary} />
        <Text style={{ color: c.primary, fontSize: 14, fontWeight: '600' }}>Temporizador de descanso: {restLabel(p.entry.restSeconds, p.settings.defaultRestSeconds)}</Text>
      </Pressable>
      {p.mode === 'routine' && p.onRepRange && cols.some((col) => col.key === 'reps') ? (
        <Pressable onPress={() => setRangeDialog(true)} style={styles.restRow}>
          <Icon name="trending-up-outline" size={18} color={c.primary} />
          <Text style={{ color: c.primary, fontSize: 14, fontWeight: '600' }}>Rango de reps: {p.entry.repRange ? `${p.entry.repRange.min}-${p.entry.repRange.max}` : 'sin rango'}</Text>
        </Pressable>
      ) : p.entry.repRange && p.mode === 'workout' ? (
        <View style={styles.restRow}>
          <Icon name="trending-up-outline" size={18} color={c.textMuted} />
          <Text style={{ color: c.textMuted, fontSize: 13 }}>Rango {p.entry.repRange.min}-{p.entry.repRange.max} reps: al llegar a {p.entry.repRange.max} en todas, sube peso y vuelve a {p.entry.repRange.min}</Text>
        </View>
      ) : null}

      <View style={styles.tableHead}>
        <Text style={[styles.th, styles.setNumCell, { color: c.textMuted }]}>SERIE</Text>
        {p.mode === 'workout' ? <Text style={[styles.th, styles.prevCell, { color: c.textMuted }]}>ANTERIOR</Text> : null}
        <View style={[styles.inputsCell, cols.length === 1 && { justifyContent: 'center' }]}>
          {cols.map((col) => <Text key={col.key} style={[styles.th, { flex: 1, maxWidth: cols.length === 1 ? (timed && col.key === 'duration' ? 150 : 110) : undefined, color: c.textMuted }]}>{col.label}</Text>)}
        </View>
        {p.mode === 'workout' ? (
          <Pressable
            disabled={!p.onToggleAll || p.entry.sets.length === 0}
            onPress={() => {
              Haptics.selectionAsync().catch(() => undefined)
              if (!allDone) {
                p.entry.sets.forEach((s, i) => {
                  const prev = prevByIndex[i]
                  if (!s.completed && prev && !hasValues(s)) p.onUpdateSet(s.id, { weightKg: prev.weightKg, reps: prev.reps, distanceM: prev.distanceM, durationS: prev.durationS })
                })
              }
              p.onToggleAll?.()
            }}
            hitSlop={6}
            style={styles.checkCell}
          >
            <View style={[styles.check, { backgroundColor: allDone ? c.success : c.cardAlt }]}>
              <Icon name="checkmark-done" size={18} color={allDone ? '#fff' : c.textMuted} />
            </View>
          </Pressable>
        ) : null}
      </View>

      {p.entry.sets.map((s) => {
        if (s.type === 'normal') normalIndex++
        const idx = normalIndex
        return (
          <SetRow
            key={s.id}
            set={s}
            index={idx}
            exType={type}
            mode={p.mode}
            settings={p.settings}
            prev={prevByIndex[p.entry.sets.indexOf(s)]}
            entryId={p.entry.id}
            setTimer={timed}
            onUpdate={(patch) => p.onUpdateSet(s.id, patch)}
            onRemove={() => p.onRemoveSet(s.id)}
            onType={(t) => p.onSetType(s.id, t)}
            onToggle={p.onToggle ? () => { Haptics.selectionAsync().catch(() => undefined); p.onToggle!(s.id) } : undefined}
          />
        )
      })}

      <Pressable onPress={p.onAddSet} style={({ pressed }) => [styles.addSet, { backgroundColor: c.cardAlt, opacity: pressed ? 0.7 : 1 }]}>
        <Icon name="add" size={18} color={c.text} />
        <Text style={{ color: c.text, fontWeight: '600' }}>Añadir serie</Text>
      </Pressable>

      <OptionSheet
        visible={restSheet}
        onClose={() => setRestSheet(false)}
        title="Temporizador de descanso"
        value={p.entry.restSeconds == null ? -1 : p.entry.restSeconds}
        options={[{ value: -1, label: `Por defecto (${restLabel(null, p.settings.defaultRestSeconds)})` }, ...REST_OPTIONS.map((s) => ({ value: s, label: s === 0 ? 'Desactivado' : fmtDuration(s) }))]}
        onSelect={(v) => p.onRest(v === -1 ? null : v)}
      />
      {p.onRepRange ? (
        <RepRangeDialog visible={rangeDialog} value={p.entry.repRange ?? null} onClose={() => setRangeDialog(false)} onConfirm={(r) => { p.onRepRange?.(r); setRangeDialog(false) }} />
      ) : null}
    </View>
  )
})

const styles = StyleSheet.create({
  card: { borderRadius: 14, paddingVertical: 10, marginBottom: 12, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  headLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuBtn: { width: 34, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  notes: { paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, minHeight: 32 },
  restRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingBottom: 8 },
  tableHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 },
  th: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, minHeight: 44 },
  setNumCell: { width: 44, alignItems: 'center', justifyContent: 'center' },
  setNum: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  prevCell: { width: 92, alignItems: 'center', justifyContent: 'center' },
  inputsCell: { flex: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  checkCell: { width: 44, alignItems: 'center', justifyContent: 'center' },
  check: { width: 30, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  durationCell: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: { height: 34, borderRadius: 8, textAlign: 'center', fontSize: 15, fontWeight: '600', paddingVertical: 0 },
  inputIdle: { lineHeight: 34, overflow: 'hidden' },
  addSet: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 12, marginTop: 8, paddingVertical: 8, borderRadius: 8 },
})
