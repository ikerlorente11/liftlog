// Entreno en curso: estado en memoria + copia en AsyncStorage para sobrevivir a
// cierres de la app. Incluye el temporizador de descanso.
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import type { ExerciseEntry, ExerciseType, Routine, SetData, SetType, Workout } from '../types'
import { uid } from '../lib/format'
import { cancelTimerNotification, scheduleTimerNotification } from '../lib/notifications'
import { isSetFilled } from '../lib/stats'

const KEY = 'liftlog.activeWorkout.v1'

export interface ActiveWorkout {
  id: string
  title: string
  notes: string
  startedAt: number
  routineId: string | null
  exercises: ExerciseEntry[]
  /** Registro a posteriori: marcar series no arranca el temporizador de descanso. */
  restTimerOff?: boolean
  /** Duración fijada a mano (registro a posteriori); si no, se calcula desde startedAt. */
  manualDurationS?: number | null
}

export interface RestTimer {
  endsAt: number
  totalS: number
}

/** Temporizador de una serie de tiempo (plancha, plancha isométrica, natación...).
 * `endsAt` null = cronómetro libre (cuenta hacia arriba, sin objetivo). */
export interface SetTimer {
  entryId: string
  setId: string
  startedAt: number
  endsAt: number | null
  totalS: number
}

interface WorkoutState {
  active: ActiveWorkout | null
  rest: RestTimer | null
  /** Serie de tiempo en marcha (solo una a la vez) */
  setTimer: SetTimer | null
  /** entreno minimizado (barra inferior visible) */
  minimized: boolean
  hydrated: boolean

  hydrate: () => Promise<void>
  startEmpty: () => void
  /** entries: objetivos efectivos (p. ej. los de la semana actual del programa); por defecto los de la rutina */
  startFromRoutine: (r: Routine, entries?: ExerciseEntry[]) => void
  setMinimized: (v: boolean) => void
  setTitle: (t: string) => void
  setNotes: (n: string) => void
  /** Activa/desactiva el descanso automático en este entreno (registro a posteriori). */
  setRestTimerOff: (off: boolean) => void
  setManualDuration: (seconds: number | null) => void

  addExercises: (exerciseIds: string[], asSuperset?: boolean, defaultRest?: number | null) => void
  removeExercise: (entryId: string) => void
  replaceExercise: (entryId: string, exerciseId: string) => void
  reorderExercises: (entryIds: string[]) => void
  moveExercise: (entryId: string, dir: -1 | 1) => void
  updateEntry: (entryId: string, patch: Partial<Pick<ExerciseEntry, 'notes' | 'restSeconds' | 'supersetId'>>) => void
  setSuperset: (entryIds: string[], supersetId: string | null) => void

  addSet: (entryId: string) => void
  updateSet: (entryId: string, setId: string, patch: Partial<SetData>) => void
  removeSet: (entryId: string, setId: string) => void
  setSetType: (entryId: string, setId: string, type: SetType) => void
  /** Marca/desmarca; al marcar arranca el descanso (si procede). Devuelve true si se marcó como hecha. */
  toggleSet: (entryId: string, setId: string, type: ExerciseType, defaultRest: number) => boolean
  /** Marca todas las series del ejercicio de golpe (si ya están todas, las desmarca). Nunca arranca el descanso. */
  toggleAllSets: (entryId: string, type: ExerciseType) => void

  startRest: (seconds: number) => void
  adjustRest: (deltaS: number) => void
  skipRest: () => void

  /** Arranca la serie: cuenta atrás si hay objetivo (targetS), cronómetro si es null. */
  startSetTimer: (entryId: string, setId: string, targetS: number | null) => void
  /** Suma/resta segundos al objetivo de la serie en curso (solo en cuenta atrás). */
  adjustSetTimer: (deltaS: number) => void
  /** Para sin guardar nada. */
  cancelSetTimer: () => void
  /** Guarda el tiempo hecho en la serie, la marca como completada y arranca el descanso. */
  completeSetTimer: (defaultRest: number) => void

  /** Construye el Workout final (solo series completadas y con datos). */
  buildFinal: (title?: string, notes?: string) => Workout | null
  discard: () => void
}

function persist(state: Pick<WorkoutState, 'active' | 'rest' | 'setTimer'>) {
  AsyncStorage.setItem(KEY, JSON.stringify({ active: state.active, rest: state.rest, setTimer: state.setTimer })).catch(() => undefined)
}

function newSet(): SetData {
  return { id: uid(), type: 'normal', weightKg: null, reps: null, distanceM: null, durationS: null, rpe: null, completed: false }
}

/** No queda ninguna serie efectiva pendiente en todo el entreno (la última no
 * necesita descanso). Los calentamientos no cuentan como pendientes. */
function allSetsCompleted(a: ActiveWorkout | null): boolean {
  return a != null && a.exercises.every((e) => e.sets.every((s) => s.completed || s.type === 'warmup'))
}

/** Tras una serie de calentamiento no aplica el descanso completo del ejercicio. */
const WARMUP_REST_S = 60

function shallowEq(a: object, b: object): boolean {
  const ka = Object.keys(a) as (keyof typeof a)[]
  if (ka.length !== Object.keys(b).length) return false
  return ka.every((k) => (a as Record<string, unknown>)[k] === (b as Record<string, unknown>)[k])
}

/** Devuelve la entrada original si la editada es idéntica (series incluidas). */
function shareEntry(next: ExerciseEntry, prev: ExerciseEntry | undefined): ExerciseEntry {
  if (!prev) return next
  const sets = next.sets.map((s, i) => (prev.sets[i] && shallowEq(s, prev.sets[i]) ? prev.sets[i] : s))
  const sameSets = sets.length === prev.sets.length && sets.every((s, i) => s === prev.sets[i])
  const { sets: _n, ...restNext } = next
  const { sets: _p, ...restPrev } = prev
  if (sameSets && shallowEq(restNext, restPrev)) return prev
  return { ...next, sets }
}

export const useWorkout = create<WorkoutState>((set, get) => {
  // Edita una copia y conserva las referencias de lo que no ha cambiado: así
  // marcar una serie solo vuelve a pintar la tarjeta de ese ejercicio (las
  // demás reciben el mismo objeto `entry` y su memo las salta).
  const mutate = (fn: (a: ActiveWorkout) => ActiveWorkout | void) => {
    const a = get().active
    if (!a) return
    const draft: ActiveWorkout = { ...a, exercises: a.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) })) }
    const res = fn(draft) ?? draft
    const shared = res === draft ? { ...res, exercises: res.exercises.map((e) => shareEntry(e, a.exercises.find((o) => o.id === e.id))) } : res
    set({ active: shared })
    persist({ active: shared, rest: get().rest, setTimer: get().setTimer })
  }

  return {
    active: null,
    rest: null,
    setTimer: null,
    minimized: false,
    hydrated: false,

    hydrate: async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as { active: ActiveWorkout | null; rest: RestTimer | null; setTimer?: SetTimer | null }
          const rest = parsed.rest && parsed.rest.endsAt > Date.now() ? parsed.rest : null
          // El cronómetro (endsAt null) sigue corriendo; la cuenta atrás caducada se descarta.
          const st = parsed.setTimer ?? null
          const setTimer = st && (st.endsAt == null || st.endsAt > Date.now()) ? st : null
          set({ active: parsed.active ?? null, rest, setTimer, minimized: !!parsed.active })
          if (!rest && !setTimer) void cancelTimerNotification()
        } else void cancelTimerNotification()
      } catch {
        // sin entreno previo
      }
      set({ hydrated: true })
    },

    startEmpty: () => {
      const a: ActiveWorkout = { id: uid(), title: 'Entrenamiento', notes: '', startedAt: Date.now(), routineId: null, exercises: [] }
      set({ active: a, rest: null, setTimer: null, minimized: false })
      persist({ active: a, rest: null, setTimer: null })
    },

    startFromRoutine: (r, entries) => {
      const a: ActiveWorkout = {
        id: uid(), title: r.name, notes: '', startedAt: Date.now(), routineId: r.id,
        exercises: (entries ?? r.exercises).map((e) => ({
          id: uid(), exerciseId: e.exerciseId, notes: e.notes, restSeconds: e.restSeconds, supersetId: e.supersetId, repRange: e.repRange ?? null,
          sets: e.sets.map((s) => ({ ...s, id: uid(), completed: false, isPr: false, rpe: null })),
        })),
      }
      set({ active: a, rest: null, setTimer: null, minimized: false })
      persist({ active: a, rest: null, setTimer: null })
    },

    setMinimized: (v) => set({ minimized: v }),
    setTitle: (t) => mutate((a) => { a.title = t }),
    setNotes: (n) => mutate((a) => { a.notes = n }),
    setRestTimerOff: (off) => {
      mutate((a) => { a.restTimerOff = off })
      if (off) get().skipRest()
    },
    setManualDuration: (seconds) => mutate((a) => { a.manualDurationS = seconds }),

    addExercises: (ids, asSuperset = false, defaultRest = null) => mutate((a) => {
      const supersetId = asSuperset && ids.length > 1 ? uid() : null
      for (const exerciseId of ids) {
        a.exercises.push({ id: uid(), exerciseId, notes: '', restSeconds: defaultRest, supersetId, sets: [newSet(), newSet(), newSet()] })
      }
    }),
    removeExercise: (entryId) => {
      if (get().setTimer?.entryId === entryId) get().cancelSetTimer()
      mutate((a) => { a.exercises = a.exercises.filter((e) => e.id !== entryId) })
    },
    replaceExercise: (entryId, exerciseId) => {
      if (get().setTimer?.entryId === entryId) get().cancelSetTimer()
      mutate((a) => {
        const e = a.exercises.find((x) => x.id === entryId)
        if (e) { e.exerciseId = exerciseId; e.sets = e.sets.map((s) => ({ ...s, completed: false })) }
      })
    },
    reorderExercises: (entryIds) => mutate((a) => {
      const byId = new Map(a.exercises.map((e) => [e.id, e]))
      a.exercises = entryIds.map((id) => byId.get(id)!).filter(Boolean)
    }),
    moveExercise: (entryId, dir) => mutate((a) => {
      const i = a.exercises.findIndex((e) => e.id === entryId)
      const j = i + dir
      if (i < 0 || j < 0 || j >= a.exercises.length) return
      const tmp = a.exercises[i]; a.exercises[i] = a.exercises[j]; a.exercises[j] = tmp
    }),
    updateEntry: (entryId, patch) => mutate((a) => {
      const e = a.exercises.find((x) => x.id === entryId)
      if (e) Object.assign(e, patch)
    }),
    setSuperset: (entryIds, supersetId) => mutate((a) => {
      for (const e of a.exercises) if (entryIds.includes(e.id)) e.supersetId = supersetId
    }),

    addSet: (entryId) => mutate((a) => {
      const e = a.exercises.find((x) => x.id === entryId)
      if (!e) return
      const last = e.sets[e.sets.length - 1]
      const s = newSet()
      if (last) { s.weightKg = last.weightKg; s.reps = last.reps; s.distanceM = last.distanceM; s.durationS = last.durationS }
      e.sets.push(s)
    }),
    updateSet: (entryId, setId, patch) => mutate((a) => {
      const s = a.exercises.find((x) => x.id === entryId)?.sets.find((y) => y.id === setId)
      if (s) Object.assign(s, patch)
    }),
    removeSet: (entryId, setId) => {
      const t = get().setTimer
      if (t && t.entryId === entryId && t.setId === setId) get().cancelSetTimer()
      mutate((a) => {
        const e = a.exercises.find((x) => x.id === entryId)
        if (e) e.sets = e.sets.filter((s) => s.id !== setId)
      })
    },
    setSetType: (entryId, setId, type) => mutate((a) => {
      const s = a.exercises.find((x) => x.id === entryId)?.sets.find((y) => y.id === setId)
      if (s) s.type = type
    }),
    toggleSet: (entryId, setId, type, defaultRest) => {
      const t = get().setTimer
      if (t && t.entryId === entryId && t.setId === setId) get().cancelSetTimer()
      let done = false
      let restS = 0
      mutate((a) => {
        const e = a.exercises.find((x) => x.id === entryId)
        const s = e?.sets.find((y) => y.id === setId)
        if (!e || !s) return
        if (s.completed) { s.completed = false; return }
        if (!isSetFilled(s, type)) {
          // Si la serie está vacía se rellena con 0 para no perderla
          if (['weight_reps', 'weighted_bodyweight', 'assisted_bodyweight', 'bodyweight_reps', 'reps_only'].includes(type)) s.reps = s.reps ?? 0
        }
        s.completed = true
        done = true
        restS = e.restSeconds == null ? defaultRest : e.restSeconds
        if (s.type === 'warmup') restS = Math.min(restS, WARMUP_REST_S)
      })
      // Si era la última serie pendiente del entreno, no hay nada que descansar.
      if (done && restS > 0 && !get().active?.restTimerOff && !allSetsCompleted(get().active)) get().startRest(restS)
      return done
    },
    toggleAllSets: (entryId, type) => {
      const t = get().setTimer
      if (t && t.entryId === entryId) get().cancelSetTimer()
      mutate((a) => {
        const e = a.exercises.find((x) => x.id === entryId)
        if (!e || e.sets.length === 0) return
        const allDone = e.sets.every((s) => s.completed)
        for (const s of e.sets) {
          if (allDone) { s.completed = false; continue }
          if (s.completed) continue
          if (!isSetFilled(s, type)) {
            if (['weight_reps', 'weighted_bodyweight', 'assisted_bodyweight', 'bodyweight_reps', 'reps_only'].includes(type)) s.reps = s.reps ?? 0
          }
          s.completed = true
        }
      })
    },

    startRest: (seconds) => {
      const rest = { endsAt: Date.now() + seconds * 1000, totalS: seconds }
      set({ rest })
      persist({ active: get().active, rest, setTimer: get().setTimer })
      void scheduleTimerNotification(seconds, 'rest')
    },
    adjustRest: (deltaS) => {
      const r = get().rest
      if (!r) return
      const remaining = Math.max(0, (r.endsAt - Date.now()) / 1000 + deltaS)
      const rest = { endsAt: Date.now() + remaining * 1000, totalS: Math.max(1, r.totalS + deltaS) }
      set({ rest })
      persist({ active: get().active, rest, setTimer: get().setTimer })
      void scheduleTimerNotification(remaining, 'rest')
    },
    skipRest: () => {
      set({ rest: null })
      persist({ active: get().active, rest: null, setTimer: get().setTimer })
      void cancelTimerNotification()
    },

    startSetTimer: (entryId, setId, targetS) => {
      const now = Date.now()
      const total = targetS != null && targetS > 0 ? Math.round(targetS) : 0
      const setTimer: SetTimer = { entryId, setId, startedAt: now, endsAt: total > 0 ? now + total * 1000 : null, totalS: total }
      // Descanso y serie de tiempo son excluyentes: solo hay un aviso programado.
      set({ rest: null, setTimer })
      persist({ active: get().active, rest: null, setTimer })
      if (total > 0) void scheduleTimerNotification(total, 'set')
      else void cancelTimerNotification()
    },
    adjustSetTimer: (deltaS) => {
      const t = get().setTimer
      if (!t || t.endsAt == null) return
      const remaining = Math.max(1, (t.endsAt - Date.now()) / 1000 + deltaS)
      const setTimer: SetTimer = { ...t, endsAt: Date.now() + remaining * 1000, totalS: Math.max(1, t.totalS + deltaS) }
      set({ setTimer })
      persist({ active: get().active, rest: get().rest, setTimer })
      void scheduleTimerNotification(remaining, 'set')
    },
    cancelSetTimer: () => {
      if (!get().setTimer) return
      set({ setTimer: null })
      persist({ active: get().active, rest: get().rest, setTimer: null })
      void cancelTimerNotification()
    },
    completeSetTimer: (defaultRest) => {
      const t = get().setTimer
      if (!t) return
      // Cuenta atrás: cuenta el objetivo aunque el aviso llegue un poco tarde.
      const elapsed = t.endsAt != null ? t.totalS : Math.max(0, Math.round((Date.now() - t.startedAt) / 1000))
      set({ setTimer: null })
      void cancelTimerNotification()
      let restS = 0
      mutate((a) => {
        const e = a.exercises.find((x) => x.id === t.entryId)
        const s2 = e?.sets.find((y) => y.id === t.setId)
        if (!e || !s2) return
        if (elapsed > 0) s2.durationS = elapsed
        s2.completed = true
        restS = e.restSeconds == null ? defaultRest : e.restSeconds
        if (s2.type === 'warmup') restS = Math.min(restS, WARMUP_REST_S)
      })
      if (restS > 0 && !get().active?.restTimerOff && !allSetsCompleted(get().active)) get().startRest(restS)
    },

    buildFinal: (title, notes) => {
      const a = get().active
      if (!a) return null
      const now = Date.now()
      const exercises: ExerciseEntry[] = a.exercises
        .map((e) => ({ ...e, sets: e.sets.filter((s) => s.completed) }))
        .filter((e) => e.sets.length > 0)
      // Duración manual (registro a posteriori): el entreno se da por terminado
      // ahora y empezado hace "durationS".
      const durationS = a.manualDurationS != null ? Math.max(0, Math.round(a.manualDurationS)) : Math.round((now - a.startedAt) / 1000)
      const startedAt = a.manualDurationS != null ? now - durationS * 1000 : a.startedAt
      return {
        id: a.id, title: (title ?? a.title).trim() || 'Entrenamiento', notes: notes ?? a.notes,
        startedAt, endedAt: now, durationS, routineId: a.routineId, exercises,
      }
    },
    discard: () => {
      set({ active: null, rest: null, setTimer: null, minimized: false })
      AsyncStorage.removeItem(KEY).catch(() => undefined)
      void cancelTimerNotification()
    },
  }
})
