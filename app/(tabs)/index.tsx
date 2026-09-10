// Inicio: feed de entrenos realizados (tarjetas) + resumen semanal.
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { WorkoutCard } from '../../src/components/WorkoutCard'
import { fmtDuration, fmtWeight, greeting, startOfWeek } from '../../src/lib/format'
import { workoutVolume } from '../../src/lib/stats'
import { useData } from '../../src/store/dataStore'
import { useSettings } from '../../src/store/settingsStore'
import { useWorkout } from '../../src/store/workoutStore'
import { useColors } from '../../src/theme'
import { Button, Card, EmptyState, Header, HeaderButton, Screen } from '../../src/ui/primitives'
import { ActionSheet, ConfirmDialog } from '../../src/ui/sheets'
import type { Workout } from '../../src/types'

export default function HomeScreen() {
  const c = useColors()
  const router = useRouter()
  const workouts = useData((s) => s.workouts)
  const typeOf = useData((s) => s.typeOf)
  const deleteWorkout = useData((s) => s.deleteWorkout)
  const settings = useSettings((s) => s.settings)
  // Solo si hay entreno en curso: suscribirse al entreno entero repintaba esta
  // pantalla (montada debajo) con cada serie marcada en el entreno activo.
  const active = useWorkout((s) => !!s.active)
  const startEmpty = useWorkout((s) => s.startEmpty)
  const [menuFor, setMenuFor] = useState<Workout | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Workout | null>(null)

  const week = useMemo(() => {
    const from = startOfWeek(Date.now(), settings.weekStartsMonday)
    const list = workouts.filter((w) => w.startedAt >= from)
    return {
      count: list.length,
      volume: list.reduce((a, w) => a + workoutVolume(w, typeOf), 0),
      duration: list.reduce((a, w) => a + w.durationS, 0),
    }
  }, [workouts, settings.weekStartsMonday, typeOf])

  return (
    <Screen>
      <Header title="Inicio" right={<HeaderButton icon="settings-outline" onPress={() => router.push('/settings')} color={c.text} />} />
      <FlatList
        data={workouts}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 140 }}
        ListHeaderComponent={
          <Card style={{ gap: 6 }}>
            <Text style={{ color: c.textMuted, fontSize: 13 }}>{greeting()}, {settings.userName || 'campeón'} 👋</Text>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>Esta semana</Text>
            <View style={styles.weekRow}>
              <WeekStat label="Entrenos" value={String(week.count)} />
              <WeekStat label="Volumen" value={fmtWeight(week.volume, settings.weightUnit)} />
              <WeekStat label="Tiempo" value={fmtDuration(week.duration)} />
            </View>
            {!active ? <Button label="Empezar un entrenamiento" icon="add" onPress={() => { startEmpty(); router.push('/workout/active') }} style={{ marginTop: 6 }} /> : null}
          </Card>
        }
        renderItem={({ item }) => <WorkoutCard workout={item} onMenu={setMenuFor} />}
        ListEmptyComponent={
          <EmptyState
            icon="barbell-outline"
            title="Aún no has registrado ningún entreno"
            text="Empieza uno vacío o lanza una rutina desde la pestaña Entreno. Tus entrenos aparecerán aquí."
            action={<Button label="Ir a rutinas" variant="secondary" onPress={() => router.push('/workout')} />}
          />
        }
      />
      <ActionSheet
        visible={!!menuFor}
        onClose={() => setMenuFor(null)}
        title={menuFor?.title}
        actions={[
          { label: 'Ver entreno', icon: 'eye-outline', onPress: () => menuFor && router.push(`/workout/${menuFor.id}`) },
          { label: 'Editar entreno', icon: 'create-outline', onPress: () => menuFor && router.push({ pathname: '/workout/[id]', params: { id: menuFor.id, edit: '1' } }) },
          { label: 'Guardar como rutina', icon: 'bookmark-outline', onPress: () => menuFor && router.push({ pathname: '/routine/edit', params: { fromWorkout: menuFor.id } }) },
          { label: 'Eliminar entreno', icon: 'trash-outline', destructive: true, onPress: () => setConfirmDelete(menuFor) },
        ]}
      />
      <ConfirmDialog
        visible={!!confirmDelete}
        title="¿Eliminar entreno?"
        message="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) void deleteWorkout(confirmDelete.id); setConfirmDelete(null) }}
      />
    </Screen>
  )
}

function WeekStat({ label, value }: { label: string; value: string }) {
  const c = useColors()
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({ weekRow: { flexDirection: 'row', marginTop: 4 } })
