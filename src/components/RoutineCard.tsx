// Tarjeta de rutina en la pestaña Entreno: título, resumen de ejercicios y
// botón "Empezar rutina" (con menú ⋯).
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { programChip } from '../lib/program'
import { useData } from '../store/dataStore'
import { useSettings } from '../store/settingsStore'
import { useColors } from '../theme'
import type { Routine } from '../types'
import { Button, Card, Icon } from '../ui/primitives'

export function RoutineCard({ routine, onStart, onMenu }: { routine: Routine; onStart: () => void; onMenu: () => void }) {
  const c = useColors()
  const router = useRouter()
  const getExercise = useData((s) => s.getExercise)
  const mondayFirst = useSettings((s) => s.settings.weekStartsMonday)
  const names = routine.exercises.map((e) => getExercise(e.exerciseId)?.nameEs ?? e.exerciseId).join(', ')
  const chip = programChip(routine, Date.now(), mondayFirst)
  return (
    <Card style={{ gap: 10 }} onPress={() => router.push(`/routine/${routine.id}`)}>
      <View style={styles.head}>
        <Text numberOfLines={2} style={[styles.title, { color: c.text }]}>{routine.name}</Text>
        <Pressable onPress={onMenu} hitSlop={10} style={{ padding: 2 }}>
          <Icon name="ellipsis-horizontal" size={20} color={c.textMuted} />
        </Pressable>
      </View>
      {chip ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Icon name="calendar-outline" size={14} color={c.primary} />
          <Text style={{ color: c.primary, fontSize: 13, fontWeight: '600' }}>{chip}</Text>
        </View>
      ) : null}
      <Text numberOfLines={2} style={{ color: c.textMuted, fontSize: 13, lineHeight: 18 }}>{names || 'Sin ejercicios'}</Text>
      <Button label="Empezar rutina" onPress={onStart} />
    </Card>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '700' },
})
