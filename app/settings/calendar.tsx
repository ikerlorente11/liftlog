// Calendario mensual con los días entrenados y lista de entrenos del día.
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { WorkoutCard } from '../../src/components/WorkoutCard'
import { fmtMonthYear, isSameDay, startOfDay } from '../../src/lib/format'
import { useData } from '../../src/store/dataStore'
import { useSettings } from '../../src/store/settingsStore'
import { useColors } from '../../src/theme'
import { Card, Header, HeaderButton, Icon, Screen } from '../../src/ui/primitives'

export default function CalendarScreen() {
  const c = useColors()
  const router = useRouter()
  const workouts = useData((s) => s.workouts)
  const monday = useSettings((s) => s.settings.weekStartsMonday)
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime() })
  const [selected, setSelected] = useState<number>(startOfDay(Date.now()))

  const days = useMemo(() => {
    const d = new Date(month)
    const first = new Date(d.getFullYear(), d.getMonth(), 1)
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const lead = monday ? (first.getDay() + 6) % 7 : first.getDay()
    const cells: (number | null)[] = Array(lead).fill(null)
    for (let i = 1; i <= last.getDate(); i++) cells.push(new Date(d.getFullYear(), d.getMonth(), i).getTime())
    while (cells.length % 7) cells.push(null)
    return cells
  }, [month, monday])

  const trained = useMemo(() => new Set(workouts.map((w) => startOfDay(w.startedAt))), [workouts])
  const dayWorkouts = workouts.filter((w) => isSameDay(w.startedAt, selected))
  const monthCount = workouts.filter((w) => { const d = new Date(w.startedAt); const m = new Date(month); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear() }).length
  const shift = (n: number) => { const d = new Date(month); d.setMonth(d.getMonth() + n); setMonth(d.getTime()) }
  const weekdays = monday ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'] : ['D', 'L', 'M', 'X', 'J', 'V', 'S']

  return (
    <Screen>
      <Header title="Calendario" left={<HeaderButton icon="chevron-back" onPress={() => router.back()} color={c.text} />} />
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 60 }}>
        <Card style={{ gap: 8 }}>
          <View style={styles.monthRow}>
            <Pressable onPress={() => shift(-1)} hitSlop={10}><Icon name="chevron-back" size={22} color={c.primary} /></Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>{fmtMonthYear(month)}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{monthCount} entrenos</Text>
            </View>
            <Pressable onPress={() => shift(1)} hitSlop={10}><Icon name="chevron-forward" size={22} color={c.primary} /></Pressable>
          </View>
          <View style={styles.grid}>
            {weekdays.map((d, i) => <Text key={i} style={[styles.cell, { color: c.textMuted, fontSize: 12, fontWeight: '700' }]}>{d}</Text>)}
            {days.map((ts, i) => {
              if (ts == null) return <View key={i} style={styles.cell} />
              const has = trained.has(ts)
              const isSel = isSameDay(ts, selected)
              const isToday = isSameDay(ts, Date.now())
              return (
                <Pressable key={i} onPress={() => setSelected(ts)} style={styles.cell}>
                  <View style={[styles.day, isSel && { backgroundColor: c.primary }, !isSel && has && { backgroundColor: c.primarySoft }, isToday && !isSel && { borderWidth: 1, borderColor: c.primary }]}>
                    <Text style={{ color: isSel ? '#fff' : has ? c.primary : c.text, fontWeight: has ? '700' : '400' }}>{new Date(ts).getDate()}</Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </Card>
        {dayWorkouts.length ? dayWorkouts.map((w) => <WorkoutCard key={w.id} workout={w} compact />) : (
          <Text style={{ color: c.textMuted, textAlign: 'center', padding: 16 }}>Sin entrenos este día.</Text>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, textAlign: 'center' },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
})
