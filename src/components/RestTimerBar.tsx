// Barra inferior del temporizador de descanso (cuenta atrás, -15/+15, saltar) y
// hook de tick compartido. Vibra al terminar (aviso en primer plano; en segundo
// plano avisa la notificación del sistema, ver lib/notifications.ts).
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { fmtClock } from '../lib/format'
import { buzzTimerEnd } from '../lib/notifications'
import { useSettings } from '../store/settingsStore'
import { useWorkout } from '../store/workoutStore'
import { useColors } from '../theme'
import { Icon } from '../ui/primitives'

let firedFor: number | null = null

/** Segundos restantes del descanso (re-render cada 250 ms). Devuelve null si no hay descanso. */
export function useRestRemaining(): { remaining: number; total: number } | null {
  const rest = useWorkout((s) => s.rest)
  const skip = useWorkout((s) => s.skipRest)
  const vibrate = useSettings((s) => s.settings.restTimerVibrate)
  const [, tick] = useState(0)
  useEffect(() => {
    if (!rest) return
    const t = setInterval(() => tick((x) => x + 1), 250)
    return () => clearInterval(t)
  }, [rest])
  if (!rest) return null
  const remaining = Math.max(0, Math.ceil((rest.endsAt - Date.now()) / 1000))
  if (remaining === 0 && firedFor !== rest.endsAt) {
    const endsAt = rest.endsAt
    firedFor = endsAt
    if (vibrate) buzzTimerEnd()
    // Solo cierra ESTE descanso: si en el margen ya se ha lanzado otro (marcar la
    // siguiente serie con el 0:00 aún en pantalla), no hay que tocarlo.
    setTimeout(() => { if (useWorkout.getState().rest?.endsAt === endsAt) skip() }, 1200)
  }
  return { remaining, total: rest.totalS }
}

export function RestTimerBar() {
  const c = useColors()
  const r = useRestRemaining()
  const adjust = useWorkout((s) => s.adjustRest)
  const skip = useWorkout((s) => s.skipRest)
  if (!r) return null
  const pct = r.total > 0 ? Math.min(1, Math.max(0, r.remaining / r.total)) : 0
  return (
    <View style={[styles.bar, { backgroundColor: c.card, borderTopColor: c.border }]}>
      <View style={[styles.progress, { backgroundColor: c.primary, width: `${pct * 100}%` }]} />
      <Pressable onPress={() => adjust(-15)} style={[styles.side, { backgroundColor: c.cardAlt }]}><Text style={[styles.sideText, { color: c.text }]}>-15</Text></Pressable>
      <View style={styles.center}>
        <Icon name="timer-outline" size={18} color={c.primary} />
        <Text style={[styles.time, { color: c.text }]}>{fmtClock(r.remaining)}</Text>
      </View>
      <Pressable onPress={() => adjust(15)} style={[styles.side, { backgroundColor: c.cardAlt }]}><Text style={[styles.sideText, { color: c.text }]}>+15</Text></Pressable>
      <Pressable onPress={skip} style={[styles.skip, { backgroundColor: c.primary }]}><Text style={styles.skipText}>Saltar</Text></Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  progress: { position: 'absolute', left: 0, top: 0, height: 3 },
  side: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  sideText: { fontWeight: '700' },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  time: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  skip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  skipText: { color: '#fff', fontWeight: '700' },
})
