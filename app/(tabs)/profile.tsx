// Perfil: nombre, nº de entrenos, gráfica semanal (entrenos/volumen/duración),
// panel de control (Estadísticas, Ejercicios, Medidas, Calendario) y ajustes.
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { BarChart } from '../../src/components/Charts'
import { fmtDayMonth, fmtDuration, fmtWeight, startOfWeek } from '../../src/lib/format'
import { workoutVolume } from '../../src/lib/stats'
import { useData } from '../../src/store/dataStore'
import { useSettings } from '../../src/store/settingsStore'
import { useColors } from '../../src/theme'
import { Card, Header, HeaderButton, Icon, Screen, type IconName } from '../../src/ui/primitives'

type Metric = 'count' | 'volume' | 'duration'

export default function ProfileScreen() {
  const c = useColors()
  const router = useRouter()
  const workouts = useData((s) => s.workouts)
  const typeOf = useData((s) => s.typeOf)
  const settings = useSettings((s) => s.settings)
  const [metric, setMetric] = useState<Metric>('count')

  const bars = useMemo(() => {
    const weeks = 8
    const thisWeek = startOfWeek(Date.now(), settings.weekStartsMonday)
    const out: { label: string; value: number }[] = []
    for (let i = weeks - 1; i >= 0; i--) {
      const from = thisWeek - i * 7 * 86400000
      const to = from + 7 * 86400000
      const list = workouts.filter((w) => w.startedAt >= from && w.startedAt < to)
      const value = metric === 'count' ? list.length : metric === 'volume' ? Math.round(list.reduce((a, w) => a + workoutVolume(w, typeOf), 0)) : Math.round(list.reduce((a, w) => a + w.durationS, 0) / 60)
      out.push({ label: fmtDayMonth(from), value })
    }
    return out
  }, [workouts, metric, settings.weekStartsMonday, typeOf])

  const initial = (settings.userName || 'U').charAt(0).toUpperCase()
  const totalVolume = useMemo(() => workouts.reduce((a, w) => a + workoutVolume(w, typeOf), 0), [workouts, typeOf])
  const totalTime = useMemo(() => workouts.reduce((a, w) => a + w.durationS, 0), [workouts])

  return (
    <Screen>
      <Header title="Perfil" right={<HeaderButton icon="settings-outline" color={c.text} onPress={() => router.push('/settings')} />} />
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 140 }}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: c.primary }]}><Text style={styles.avatarText}>{initial}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '800' }}>{settings.userName || 'Tu perfil'}</Text>
            <Text style={{ color: c.textMuted }}>{workouts.length} {workouts.length === 1 ? 'entreno' : 'entrenos'}</Text>
          </View>
        </View>

        <Card style={{ gap: 8 }}>
          <View style={styles.metricRow}>
            {(['count', 'volume', 'duration'] as Metric[]).map((m) => (
              <Pressable key={m} onPress={() => setMetric(m)} style={[styles.metricBtn, { backgroundColor: metric === m ? c.primary : c.cardAlt }]}>
                <Text style={{ color: metric === m ? '#fff' : c.text, fontWeight: '600', fontSize: 13 }}>{m === 'count' ? 'Entrenos' : m === 'volume' ? 'Volumen' : 'Duración'}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>Últimas 8 semanas · {metric === 'volume' ? settings.weightUnit : metric === 'duration' ? 'minutos' : 'entrenos'}</Text>
          <BarChart bars={bars} formatY={(v) => (metric === 'volume' && v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v))} />
        </Card>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatCard label="Volumen total" value={fmtWeight(totalVolume, settings.weightUnit)} />
          <StatCard label="Tiempo total" value={fmtDuration(totalTime)} />
        </View>

        <Text style={{ color: c.text, fontSize: 17, fontWeight: '700', marginTop: 6 }}>Panel de control</Text>
        <View style={styles.grid}>
          <Tile icon="stats-chart-outline" label="Estadísticas" onPress={() => router.push('/settings/stats')} />
          <Tile icon="barbell-outline" label="Ejercicios" onPress={() => router.push('/exercises')} />
          <Tile icon="body-outline" label="Medidas" onPress={() => router.push('/settings/measurements')} />
          <Tile icon="calendar-outline" label="Calendario" onPress={() => router.push('/settings/calendar')} />
        </View>
      </ScrollView>
    </Screen>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  const c = useColors()
  return (
    <Card style={{ flex: 1 }}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{value}</Text>
    </Card>
  )
}

function Tile({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const c = useColors()
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.8 : 1 }]}>
      <Icon name={icon} size={22} color={c.primary} />
      <Text style={{ color: c.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  metricRow: { flexDirection: 'row', gap: 8 },
  metricBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
})
