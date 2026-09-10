// Tarjeta de entreno en el feed (Inicio): cabecera con avatar/fecha, título,
// métricas (duración, volumen, récords) y lista de ejercicios con mejor serie.
import { useRouter } from 'expo-router'
import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { fmtDuration, fmtRelativeDate, fmtWeight } from '../lib/format'
import { bestSet, countPRs, fmtSet, workoutVolume } from '../lib/stats'
import { useData } from '../store/dataStore'
import { useSettings } from '../store/settingsStore'
import { useColors } from '../theme'
import type { Workout } from '../types'
import { ExerciseThumb } from '../ui/ExerciseImage'
import { Card, Icon } from '../ui/primitives'

// memo: al guardar un entreno la lista de Inicio recibe un array nuevo y solo
// debe pintar la tarjeta nueva, no las 24 anteriores.
export const WorkoutCard = memo(function WorkoutCard({ workout, onMenu, compact }: { workout: Workout; onMenu?: (w: Workout) => void; compact?: boolean }) {
  const c = useColors()
  const router = useRouter()
  const settings = useSettings((s) => s.settings)
  const getExercise = useData((s) => s.getExercise)
  const typeOf = useData((s) => s.typeOf)
  const volume = workoutVolume(workout, typeOf)
  const prs = countPRs(workout)
  const maxRows = compact ? 3 : 6
  const initial = (settings.userName || 'U').charAt(0).toUpperCase()

  return (
    <Card style={{ padding: 0 }} onPress={() => router.push(`/workout/${workout.id}`)}>
      <View style={styles.top}>
        <View style={[styles.avatar, { backgroundColor: c.primary }]}><Text style={styles.avatarText}>{initial}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>{settings.userName || 'Tú'}</Text>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>{fmtRelativeDate(workout.startedAt)}</Text>
        </View>
        {onMenu ? (
          <Pressable onPress={() => onMenu?.(workout)} hitSlop={10} style={{ padding: 4 }}>
            <Icon name="ellipsis-horizontal" size={20} color={c.textMuted} />
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.title, { color: c.text }]}>{workout.title}</Text>
      {workout.notes ? <Text numberOfLines={2} style={{ color: c.textMuted, paddingHorizontal: 14, marginBottom: 6, fontSize: 13 }}>{workout.notes}</Text> : null}
      <View style={styles.stats}>
        <Stat label="Duración" value={fmtDuration(workout.durationS)} />
        <Stat label="Volumen" value={fmtWeight(volume, settings.weightUnit)} />
        <Stat label="Récords" value={prs > 0 ? `🏆 ${prs}` : '0'} />
      </View>
      <View style={[styles.sep, { backgroundColor: c.border }]} />
      <View style={styles.exHeader}>
        <Text style={[styles.exHeaderText, { color: c.textMuted }]}>Ejercicio</Text>
        <Text style={[styles.exHeaderText, { color: c.textMuted }]}>Mejor serie</Text>
      </View>
      {workout.exercises.slice(0, maxRows).map((e) => {
        const ex = getExercise(e.exerciseId)
        const type = typeOf(e.exerciseId)
        const best = bestSet(e, type)
        return (
          <View key={e.id} style={styles.exRow}>
            <ExerciseThumb exercise={ex} size={34} />
            <Text numberOfLines={1} style={{ flex: 1, color: c.text, fontSize: 14 }}>
              {e.sets.length} {e.sets.length === 1 ? 'serie' : 'series'} {ex?.nameEs ?? e.exerciseId}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 13 }}>{best ? fmtSet(best, type, settings) : '-'}</Text>
          </View>
        )
      })}
      {workout.exercises.length > maxRows ? (
        <Text style={{ color: c.textMuted, paddingHorizontal: 14, paddingBottom: 12, fontSize: 13 }}>Ver {workout.exercises.length - maxRows} ejercicios más</Text>
      ) : <View style={{ height: 8 }} />}
    </Card>
  )
})

function Stat({ label, value }: { label: string; value: string }) {
  const c = useColors()
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 8 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  title: { fontSize: 17, fontWeight: '700', paddingHorizontal: 14, marginBottom: 6 },
  stats: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 12 },
  sep: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 },
  exHeaderText: { fontSize: 12, fontWeight: '600' },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 5 },
})
