// Estadísticas globales: totales, distribución por grupo muscular, ejercicios más usados.
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { fmtDuration, fmtWeight } from '../../src/lib/format'
import { MUSCLE_LABEL } from '../../src/lib/labels'
import { entryVolume, workoutVolume } from '../../src/lib/stats'
import { useData } from '../../src/store/dataStore'
import { useSettings } from '../../src/store/settingsStore'
import { useColors } from '../../src/theme'
import type { MuscleGroup } from '../../src/types'
import { ExerciseThumb } from '../../src/ui/ExerciseImage'
import { Card, Header, HeaderButton, Screen } from '../../src/ui/primitives'

export default function StatsScreen() {
  const c = useColors()
  const router = useRouter()
  const settings = useSettings((s) => s.settings)
  const workouts = useData((s) => s.workouts)
  const { getExercise, typeOf } = useData()

  const stats = useMemo(() => {
    let sets = 0, reps = 0, volume = 0, duration = 0, prs = 0
    const byMuscle = new Map<MuscleGroup, number>()
    const byExercise = new Map<string, { count: number; volume: number }>()
    for (const w of workouts) {
      duration += w.durationS
      volume += workoutVolume(w, typeOf)
      for (const e of w.exercises) {
        const ex = getExercise(e.exerciseId)
        const done = e.sets.filter((s) => s.completed)
        sets += done.length
        reps += done.reduce((a, s) => a + (s.reps ?? 0), 0)
        prs += done.filter((s) => s.isPr).length
        if (ex) byMuscle.set(ex.muscle, (byMuscle.get(ex.muscle) ?? 0) + done.length)
        const cur = byExercise.get(e.exerciseId) ?? { count: 0, volume: 0 }
        cur.count += 1
        cur.volume += entryVolume(e, typeOf(e.exerciseId))
        byExercise.set(e.exerciseId, cur)
      }
    }
    const muscles = [...byMuscle.entries()].sort((a, b) => b[1] - a[1])
    const top = [...byExercise.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 10)
    return { sets, reps, volume, duration, prs, muscles, top, maxMuscle: muscles[0]?.[1] ?? 1 }
  }, [workouts, getExercise, typeOf])

  return (
    <Screen>
      <Header title="Estadísticas" left={<HeaderButton icon="chevron-back" onPress={() => router.back()} color={c.text} />} />
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 60 }}>
        <View style={styles.grid}>
          <Tile label="Entrenos" value={String(workouts.length)} />
          <Tile label="Tiempo total" value={fmtDuration(stats.duration)} />
          <Tile label="Volumen total" value={fmtWeight(stats.volume, settings.weightUnit)} />
          <Tile label="Series" value={String(stats.sets)} />
          <Tile label="Repeticiones" value={String(stats.reps)} />
          <Tile label="Récords" value={String(stats.prs)} />
        </View>
        <Card style={{ gap: 8 }}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Series por grupo muscular</Text>
          {stats.muscles.length === 0 ? <Text style={{ color: c.textMuted }}>Sin datos todavía.</Text> : stats.muscles.map(([m, n]) => (
            <View key={m} style={{ gap: 3 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: c.text }}>{MUSCLE_LABEL[m]}</Text>
                <Text style={{ color: c.textMuted }}>{n}</Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: c.cardAlt }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: c.primary, width: `${(n / stats.maxMuscle) * 100}%` }} />
              </View>
            </View>
          ))}
        </Card>
        <Card style={{ gap: 8 }}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Ejercicios más frecuentes</Text>
          {stats.top.length === 0 ? <Text style={{ color: c.textMuted }}>Sin datos todavía.</Text> : stats.top.map(([id, v]) => {
            const ex = getExercise(id)
            return (
              <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ExerciseThumb exercise={ex} size={34} />
                <Text style={{ flex: 1, color: c.text }} numberOfLines={1}>{ex?.nameEs ?? id}</Text>
                <Text style={{ color: c.textMuted, fontSize: 13 }}>{v.count}× · {fmtWeight(v.volume, settings.weightUnit)}</Text>
              </View>
            )
          })}
        </Card>
      </ScrollView>
    </Screen>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  const c = useColors()
  return (
    <View style={[styles.tile, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '31%', flexGrow: 1, padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
})
