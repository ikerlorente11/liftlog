// Lista de ejercicios con buscador y filtros (usada por el selector y la biblioteca).
import { memo, useCallback, useMemo, useState } from 'react'
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native'
import { compareByName, matchesQuery } from '../lib/exercises'
import { EQUIPMENTS, EQUIPMENT_LABEL, MUSCLE_GROUPS, MUSCLE_LABEL } from '../lib/labels'
import { useData } from '../store/dataStore'
import { useColors } from '../theme'
import type { Equipment, Exercise, MuscleGroup } from '../types'
import { ExerciseThumb } from '../ui/ExerciseImage'
import { Chip, Icon, SearchBar } from '../ui/primitives'
import { OptionSheet } from '../ui/sheets'

export function ExerciseList({ onPress, onInfo, selectedIds = [], usedIds = [], footerSpace = 120, showCount }: {
  onPress: (ex: Exercise) => void
  onInfo?: (ex: Exercise) => void
  selectedIds?: string[]
  usedIds?: string[]
  footerSpace?: number
  showCount?: boolean
}) {
  const c = useColors()
  const exercises = useData((s) => s.exercises)
  const workouts = useData((s) => s.workouts)
  const [query, setQuery] = useState('')
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null)
  const [sheet, setSheet] = useState<'equipment' | 'muscle' | null>(null)

  const usage = useMemo(() => {
    const m = new Map<string, number>()
    for (const w of workouts) for (const e of w.exercises) m.set(e.exerciseId, (m.get(e.exerciseId) ?? 0) + 1)
    return m
  }, [workouts])

  const recentIds = useMemo(() => {
    const seen = new Set<string>()
    for (const w of workouts) for (const e of w.exercises) seen.add(e.exerciseId)
    return [...seen].slice(0, 12)
  }, [workouts])

  const sections = useMemo(() => {
    const filtered = exercises.filter((e) => matchesQuery(e, query) && (!equipment || e.equipment === equipment) && (!muscle || e.muscle === muscle || e.secondary.includes(muscle)))
    const sorted = filtered.sort(compareByName)
    const out: { title: string; data: Exercise[] }[] = []
    if (!query && !equipment && !muscle) {
      const map = new Map(exercises.map((e) => [e.id, e]))
      const custom = exercises.filter((e) => e.isCustom)
      if (custom.length) out.push({ title: 'Personalizados', data: custom })
      const recent = recentIds.map((id) => map.get(id)).filter((x): x is Exercise => !!x)
      if (recent.length) out.push({ title: 'Recientes', data: recent })
    }
    let letter = ''
    let cur: Exercise[] = []
    for (const e of sorted) {
      const l = e.nameEs.charAt(0).toUpperCase()
      if (l !== letter) { if (cur.length) out.push({ title: letter, data: cur }); letter = l; cur = [] }
      cur.push(e)
    }
    if (cur.length) out.push({ title: letter, data: cur })
    return out
  }, [exercises, query, equipment, muscle, recentIds])

  const renderItem = useCallback(({ item }: { item: Exercise }) => (
    <ExerciseRow
      item={item}
      selected={selectedIds.includes(item.id)}
      used={usedIds.includes(item.id)}
      count={showCount ? usage.get(item.id) ?? 0 : 0}
      onPress={onPress}
      onInfo={onInfo}
    />
  ), [selectedIds, usedIds, showCount, usage, onPress, onInfo])

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12, gap: 10 }}>
        <SearchBar value={query} onChange={setQuery} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Chip label={equipment ? EQUIPMENT_LABEL[equipment] : 'Todos los equipos'} active={!!equipment} onPress={() => setSheet('equipment')} /></View>
          <View style={{ flex: 1 }}><Chip label={muscle ? MUSCLE_LABEL[muscle] : 'Todos los músculos'} active={!!muscle} onPress={() => setSheet('muscle')} /></View>
        </View>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item, i) => item.id + i}
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section }) => (
          <View style={{ backgroundColor: c.bg, paddingHorizontal: 16, paddingVertical: 4 }}>
            <Text style={{ color: c.textMuted, fontWeight: '700', fontSize: 13 }}>{section.title}</Text>
          </View>
        )}
        renderItem={renderItem}
        initialNumToRender={14}
        maxToRenderPerBatch={16}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={<Text style={{ color: c.textMuted, textAlign: 'center', padding: 32 }}>Sin resultados. Puedes crear un ejercicio personalizado con “+”.</Text>}
        contentContainerStyle={{ paddingBottom: footerSpace }}
      />
      <OptionSheet
        visible={sheet === 'equipment'} onClose={() => setSheet(null)} title="Equipamiento" value={equipment}
        options={[{ value: '' as Equipment, label: 'Todos los equipos' }, ...EQUIPMENTS.map((e) => ({ value: e, label: EQUIPMENT_LABEL[e] }))]}
        onSelect={(v) => setEquipment(v ? v : null)}
      />
      <OptionSheet
        visible={sheet === 'muscle'} onClose={() => setSheet(null)} title="Grupo muscular" value={muscle}
        options={[{ value: '' as MuscleGroup, label: 'Todos los músculos' }, ...MUSCLE_GROUPS.map((m) => ({ value: m, label: MUSCLE_LABEL[m] }))]}
        onSelect={(v) => setMuscle(v ? v : null)}
      />
    </View>
  )
}

const ExerciseRow = memo(function ExerciseRow({ item, selected, used, count, onPress, onInfo }: {
  item: Exercise; selected: boolean; used: boolean; count: number; onPress: (ex: Exercise) => void; onInfo?: (ex: Exercise) => void
}) {
  const c = useColors()
  return (
    <Pressable onPress={() => onPress(item)} style={({ pressed }) => [styles.row, { backgroundColor: selected ? c.primarySoft : pressed ? c.cardAlt : 'transparent' }]}>
      {selected ? <View style={[styles.selBar, { backgroundColor: c.primary }]} /> : null}
      <ExerciseThumb exercise={item} size={46} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{item.nameEs}</Text>
        <Text style={{ color: c.textMuted, fontSize: 13 }}>{MUSCLE_LABEL[item.muscle]}{item.isCustom ? ' · Personalizado' : ''}</Text>
      </View>
      {count > 0 ? <Text style={{ color: c.textMuted, fontSize: 13 }}>{count}</Text> : null}
      {used ? <Icon name="checkmark-done" size={18} color={c.textFaint} /> : null}
      {onInfo ? (
        <Pressable hitSlop={8} onPress={() => onInfo(item)} style={{ padding: 6 }}>
          <Icon name="information-circle-outline" size={22} color={c.textMuted} />
        </Pressable>
      ) : <Icon name="chevron-forward" size={18} color={c.textFaint} />}
    </Pressable>
  )
})

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 16 },
  selBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
})
