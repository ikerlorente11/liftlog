// Temporizador de las series de tiempo (plancha, isométricos, natación...): botón
// de play dentro de la propia serie + barra inferior con la cuenta atrás. Si la
// serie tiene un tiempo objetivo hace cuenta atrás y avisa (vibración + notificación)
// al terminar, marcando la serie como hecha y arrancando el descanso; si no lo tiene
// funciona como cronómetro y guarda el tiempo al pararlo.
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { fmtClock } from '../lib/format'
import { buzzTimerEnd } from '../lib/notifications'
import { useSettings } from '../store/settingsStore'
import { useWorkout } from '../store/workoutStore'
import type { SetTimer } from '../store/workoutStore'
import { useColors } from '../theme'
import { Icon } from '../ui/primitives'

/** Tipos de ejercicio con columna TIEMPO: son los que llevan temporizador. */
export function isTimedType(type: string): boolean {
  return type === 'duration' || type === 'distance_duration' || type === 'weight_duration'
}

/** Re-render cada 250 ms mientras haya temporizador de serie. */
function useTick(active: boolean) {
  const [, tick] = useState(0)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => tick((x) => x + 1), 250)
    return () => clearInterval(t)
  }, [active])
}

export interface SetTimerView {
  timer: SetTimer
  /** Segundos que se llevan hechos (lo que se guardará en la serie). */
  elapsed: number
  /** Segundos que faltan; null en modo cronómetro. */
  remaining: number | null
}

function view(t: SetTimer): SetTimerView {
  const elapsed = Math.max(0, Math.floor((Date.now() - t.startedAt) / 1000))
  return { timer: t, elapsed, remaining: t.endsAt == null ? null : Math.max(0, Math.ceil((t.endsAt - Date.now()) / 1000)) }
}

/** Estado del temporizador de serie, sin efectos. */
export function useSetTimer(): SetTimerView | null {
  const t = useWorkout((s) => s.setTimer)
  useTick(!!t)
  return t ? view(t) : null
}

/** Igual, pero solo re-renderiza si el temporizador es el de esa serie. */
function useSetTimerFor(entryId: string, setId: string): SetTimerView | null {
  const t = useWorkout((s) => (s.setTimer && s.setTimer.entryId === entryId && s.setTimer.setId === setId ? s.setTimer : null))
  useTick(!!t)
  return t ? view(t) : null
}

let firedFor: string | null = null

/** Igual que useSetTimer, pero además cierra la serie cuando la cuenta atrás llega a 0.
 * Se monta en la barra inferior y en el banner de entreno minimizado (el guard evita
 * que se dispare dos veces). */
export function useSetTimerWithFinish(): SetTimerView | null {
  const v = useSetTimer()
  const complete = useWorkout((s) => s.completeSetTimer)
  const defaultRest = useSettings((s) => s.settings.defaultRestSeconds)
  const vibrate = useSettings((s) => s.settings.restTimerVibrate)
  if (v && v.remaining === 0) {
    const key = `${v.timer.setId}:${v.timer.endsAt}`
    if (firedFor !== key) {
      firedFor = key
      if (vibrate) buzzTimerEnd()
      setTimeout(() => complete(defaultRest), 0)
    }
  }
  return v
}

/** Botón de la serie: arranca / para el temporizador de esa serie. Sigue activo
 * con la serie ya hecha: en ejercicios a una ejecución por lado (plancha lateral)
 * permite relanzar la cuenta atrás para el segundo lado. */
export function SetTimerButton({ entryId, setId, targetS }: {
  entryId: string; setId: string; targetS: number | null
}) {
  const c = useColors()
  const start = useWorkout((s) => s.startSetTimer)
  const cancel = useWorkout((s) => s.cancelSetTimer)
  const complete = useWorkout((s) => s.completeSetTimer)
  const defaultRest = useSettings((s) => s.settings.defaultRestSeconds)
  const running = useSetTimerFor(entryId, setId)

  const press = () => {
    Haptics.selectionAsync().catch(() => undefined)
    if (!running) { start(entryId, setId, targetS); return }
    // Cuenta atrás en marcha: pararla no cuenta la serie; el cronómetro sí la guarda.
    if (running.remaining != null) cancel()
    else complete(defaultRest)
  }

  return (
    <Pressable onPress={press} hitSlop={6} style={[styles.btn, { backgroundColor: running ? c.primary : c.cardAlt }]}>
      {running ? (
        <Text style={[styles.btnTime, { color: '#fff' }]}>{fmtClock(running.remaining ?? running.elapsed)}</Text>
      ) : (
        <Icon name="play" size={16} color={c.primary} />
      )}
    </Pressable>
  )
}

/** Barra inferior mientras corre una serie de tiempo (sustituye a la de descanso). */
export function SetTimerBar() {
  const c = useColors()
  const v = useSetTimerWithFinish()
  const adjust = useWorkout((s) => s.adjustSetTimer)
  const cancel = useWorkout((s) => s.cancelSetTimer)
  const complete = useWorkout((s) => s.completeSetTimer)
  const defaultRest = useSettings((s) => s.settings.defaultRestSeconds)
  if (!v) return null
  const countdown = v.remaining != null
  const pct = countdown && v.timer.totalS > 0 ? Math.min(1, Math.max(0, (v.remaining as number) / v.timer.totalS)) : 0
  return (
    <View style={[styles.bar, { backgroundColor: c.card, borderTopColor: c.border }]}>
      <View style={[styles.progress, { backgroundColor: c.success, width: `${pct * 100}%` }]} />
      {countdown ? (
        <Pressable onPress={() => adjust(-15)} style={[styles.side, { backgroundColor: c.cardAlt }]}><Text style={[styles.sideText, { color: c.text }]}>-15</Text></Pressable>
      ) : null}
      <View style={styles.center}>
        <Icon name="stopwatch-outline" size={18} color={c.success} />
        <Text style={[styles.time, { color: c.text }]}>{fmtClock(countdown ? (v.remaining as number) : v.elapsed)}</Text>
      </View>
      {countdown ? (
        <Pressable onPress={() => adjust(15)} style={[styles.side, { backgroundColor: c.cardAlt }]}><Text style={[styles.sideText, { color: c.text }]}>+15</Text></Pressable>
      ) : null}
      <Pressable onPress={cancel} style={[styles.side, { backgroundColor: c.cardAlt }]}><Icon name="close" size={18} color={c.text} /></Pressable>
      <Pressable onPress={() => complete(defaultRest)} style={[styles.done, { backgroundColor: c.success }]}><Text style={styles.doneText}>Hecha</Text></Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  btn: { width: 34, height: 34, minWidth: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  btnTime: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  progress: { position: 'absolute', left: 0, top: 0, height: 3 },
  side: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  sideText: { fontWeight: '700' },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  time: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  done: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  doneText: { color: '#fff', fontWeight: '700' },
})
