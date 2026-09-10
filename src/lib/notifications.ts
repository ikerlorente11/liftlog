// Avisos de fin de temporizador (descanso o serie de tiempo). Jerarquía:
//  1. App en primer plano (pantalla encendida y LiftLog visible): NO hay
//     notificación del sistema; avisa la propia app (vibración + barra a 0:00).
//  2. App en segundo plano o pantalla bloqueada: notificación del sistema con
//     sonido y vibración, programada con alarma EXACTA (USE_EXACT_ALARM en
//     app.json; sin ella Android la retrasa minutos con la pantalla apagada).
//  3. Al volver a la app se retiran los avisos ya mostrados: el estado lo
//     enseña la barra, no la bandeja.
import * as Notifications from 'expo-notifications'
import { AppState, Platform, Vibration } from 'react-native'

let configured = false
let permission: boolean | null = null

/** Patrón único de vibración de "temporizador terminado" (app y canal del sistema). */
const BUZZ_PATTERN = [0, 250, 250, 250]
const CHANNEL_ID = 'timers-v2'

/** Aviso en primer plano: vibración larga (el háptico corto pasa desapercibido en el gimnasio). */
export function buzzTimerEnd(): void {
  try {
    Vibration.vibrate(BUZZ_PATTERN)
  } catch {
    // sin vibración (p.ej. web)
  }
}

export async function setupNotifications(): Promise<void> {
  if (configured) return
  configured = true
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        // En primer plano avisa la app (buzzTimerEnd + barra); la del sistema se calla.
        const show = AppState.currentState !== 'active'
        return { shouldShowAlert: show, shouldPlaySound: show, shouldSetBadge: false, shouldShowBanner: show, shouldShowList: show }
      },
    })
    if (Platform.OS === 'android') {
      // Android no deja cambiar un canal ya creado: el id lleva versión y el viejo se borra.
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Temporizadores de entreno',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: BUZZ_PATTERN,
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      })
      await Notifications.deleteNotificationChannelAsync('rest-timer').catch(() => undefined)
    }
    // De vuelta en la app, la bandeja no tiene que seguir enseñando "Descanso terminado".
    AppState.addEventListener('change', (st) => {
      if (st === 'active') void dismissDelivered()
    })
  } catch {
    // sin notificaciones (p.ej. web)
  }
}

async function ensurePermission(): Promise<boolean> {
  // Solo se cachea el "sí": si el usuario lo concede después en Ajustes, se recupera solo.
  if (permission) return true
  try {
    const cur = await Notifications.getPermissionsAsync()
    if (cur.granted) return (permission = true)
    const req = await Notifications.requestPermissionsAsync()
    return (permission = req.granted)
  } catch {
    return (permission = false)
  }
}

async function dismissDelivered(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync()
  } catch {
    // ignorar
  }
}

// Las llamadas se serializan con una "generación": si mientras se cancela/programa
// llega otra (marcar varias series seguidas), la anterior se abandona. Antes cada
// llamada solo cancelaba el id que conocía y las que se solapaban dejaban
// notificaciones huérfanas que seguían sonando mucho después del entreno.
let generation = 0
let queue: Promise<void> = Promise.resolve()

async function cancelAllRest(): Promise<void> {
  try {
    // La app solo programa notificaciones de temporizador: cancelar todas es seguro.
    await Notifications.cancelAllScheduledNotificationsAsync()
    await Notifications.dismissAllNotificationsAsync()
  } catch {
    // ignorar (p.ej. web)
  }
}

export type TimerKind = 'rest' | 'set'

const CONTENT: Record<TimerKind, { title: string; body: string }> = {
  rest: { title: 'Descanso terminado', body: '¡A por la siguiente serie!' },
  set: { title: 'Serie terminada', body: 'Tiempo cumplido, para el ejercicio.' },
}

/** Programa el aviso de fin de temporizador. Solo hay uno activo a la vez
 * (descanso y serie de tiempo son excluyentes). */
export function scheduleTimerNotification(seconds: number, kind: TimerKind = 'rest'): Promise<void> {
  const gen = ++generation
  queue = queue.then(async () => {
    await cancelAllRest()
    if (gen !== generation || seconds <= 0) return
    if (!(await ensurePermission())) return
    if (gen !== generation) return
    try {
      await Notifications.scheduleNotificationAsync({
        content: { ...CONTENT[kind], sound: 'default' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, Math.round(seconds)), channelId: CHANNEL_ID },
      })
      // Si otra llamada nos adelantó mientras programábamos, deshacer.
      if (gen !== generation) await cancelAllRest()
    } catch {
      // sin notificación
    }
  })
  return queue
}

export function scheduleRestNotification(seconds: number): Promise<void> {
  return scheduleTimerNotification(seconds, 'rest')
}

export function cancelTimerNotification(): Promise<void> {
  ++generation
  queue = queue.then(cancelAllRest)
  return queue
}

export const cancelRestNotification = cancelTimerNotification
