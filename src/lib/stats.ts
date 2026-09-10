// Cálculos puros: 1RM estimado, volumen, resumen de series, récords.
import type { ExerciseEntry, ExerciseType, SetData, Settings, Workout } from '../types'
import { fmtClock, fmtDistance, fmtWeight } from './format'

/** 1RM estimado (fórmula de Epley; para 1 rep devuelve el peso). */
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0
  if (reps === 1) return weightKg
  return weightKg * (1 + reps / 30)
}

export function setVolume(set: SetData, type: ExerciseType): number {
  if (!set.completed) return 0
  if (type === 'weight_reps' || type === 'weighted_bodyweight') return (set.weightKg ?? 0) * (set.reps ?? 0)
  return 0
}

export function entryVolume(entry: ExerciseEntry, type: ExerciseType): number {
  return entry.sets.reduce((acc, s) => acc + setVolume(s, type), 0)
}

export function workoutVolume(w: { exercises: ExerciseEntry[] }, typeOf: (id: string) => ExerciseType): number {
  return w.exercises.reduce((acc, e) => acc + entryVolume(e, typeOf(e.exerciseId)), 0)
}

export function completedSets(w: { exercises: ExerciseEntry[] }): number {
  return w.exercises.reduce((acc, e) => acc + e.sets.filter((s) => s.completed).length, 0)
}

export function isSetFilled(set: SetData, type: ExerciseType): boolean {
  switch (type) {
    case 'weight_reps':
    case 'weighted_bodyweight':
    case 'assisted_bodyweight':
      return set.reps != null && set.reps > 0
    case 'bodyweight_reps':
    case 'reps_only':
      return set.reps != null && set.reps > 0
    case 'duration':
      return set.durationS != null && set.durationS > 0
    case 'distance_duration':
      return (set.distanceM != null && set.distanceM > 0) || (set.durationS != null && set.durationS > 0)
    case 'weight_duration':
      return set.durationS != null && set.durationS > 0
  }
}

/** Texto compacto de una serie: "72,5 kg × 5", "+10 kg × 6", "12 reps", "1:30", "1,2 km · 28:00" */
export function fmtSet(set: SetData, type: ExerciseType, settings: Pick<Settings, 'weightUnit' | 'distanceUnit'>): string {
  const w = set.weightKg
  const r = set.reps
  switch (type) {
    case 'weight_reps':
      return `${fmtWeight(w ?? 0, settings.weightUnit)} × ${r ?? 0}`
    case 'weighted_bodyweight':
      return w ? `+${fmtWeight(w, settings.weightUnit)} × ${r ?? 0}` : `${r ?? 0} reps`
    case 'assisted_bodyweight':
      return w ? `-${fmtWeight(w, settings.weightUnit)} × ${r ?? 0}` : `${r ?? 0} reps`
    case 'bodyweight_reps':
    case 'reps_only':
      return `${r ?? 0} reps`
    case 'duration':
      return fmtClock(set.durationS ?? 0)
    case 'distance_duration': {
      const parts: string[] = []
      if (set.distanceM) parts.push(fmtDistance(set.distanceM, settings.distanceUnit))
      if (set.durationS) parts.push(fmtClock(set.durationS))
      return parts.join(' · ') || '-'
    }
    case 'weight_duration':
      return `${fmtWeight(w ?? 0, settings.weightUnit)} · ${fmtClock(set.durationS ?? 0)}`
  }
}

/** Valor "anterior" compacto para la columna ANTERIOR (sin la palabra reps). */
export function fmtPrev(set: SetData, type: ExerciseType, settings: Pick<Settings, 'weightUnit' | 'distanceUnit'>): string {
  switch (type) {
    case 'weight_reps':
      return `${fmtWeight(set.weightKg ?? 0, settings.weightUnit, false)} ${settings.weightUnit} × ${set.reps ?? 0}`
    case 'weighted_bodyweight':
      return set.weightKg ? `+${fmtWeight(set.weightKg, settings.weightUnit, false)} ${settings.weightUnit} × ${set.reps ?? 0}` : `${set.reps ?? 0} reps`
    case 'assisted_bodyweight':
      return set.weightKg ? `-${fmtWeight(set.weightKg, settings.weightUnit, false)} ${settings.weightUnit} × ${set.reps ?? 0}` : `${set.reps ?? 0} reps`
    default:
      return fmtSet(set, type, settings)
  }
}

/** Mejor serie de una entrada (por 1RM estimado, o por reps/tiempo/distancia). */
export function bestSet(entry: ExerciseEntry, type: ExerciseType): SetData | null {
  const done = entry.sets.filter((s) => s.completed && s.type !== 'warmup')
  if (!done.length) return null
  return done.reduce((best, s) => (setScore(s, type) > setScore(best, type) ? s : best))
}

export function setScore(set: SetData, type: ExerciseType): number {
  switch (type) {
    case 'weight_reps':
    case 'weighted_bodyweight':
    case 'weight_duration':
      return type === 'weight_duration' ? (set.weightKg ?? 0) * 1000 + (set.durationS ?? 0) : estimate1RM(set.weightKg ?? 0, set.reps ?? 0)
    case 'assisted_bodyweight':
      return (set.reps ?? 0) * 1000 - (set.weightKg ?? 0)
    case 'bodyweight_reps':
    case 'reps_only':
      return set.reps ?? 0
    case 'duration':
      return set.durationS ?? 0
    case 'distance_duration':
      return set.distanceM ?? 0
  }
}

export interface ExerciseRecords {
  heaviestKg: number
  best1RM: number
  bestSetVolume: number
  bestSessionVolume: number
  maxReps: number
  maxDurationS: number
  maxDistanceM: number
  /** mejor peso por número de repeticiones (1..12+) */
  repRecords: Record<number, number>
  totalSets: number
  totalReps: number
  totalVolume: number
  sessions: number
}

export function emptyRecords(): ExerciseRecords {
  return { heaviestKg: 0, best1RM: 0, bestSetVolume: 0, bestSessionVolume: 0, maxReps: 0, maxDurationS: 0, maxDistanceM: 0, repRecords: {}, totalSets: 0, totalReps: 0, totalVolume: 0, sessions: 0 }
}

/** Récords de un ejercicio a partir de la lista de entrenos (ya guardados). */
export function computeRecords(workouts: Workout[], exerciseId: string, type: ExerciseType): ExerciseRecords {
  const r = emptyRecords()
  for (const w of workouts) {
    let sessionVol = 0
    let has = false
    for (const e of w.exercises) {
      if (e.exerciseId !== exerciseId) continue
      for (const s of e.sets) {
        if (!s.completed) continue
        has = true
        r.totalSets++
        r.totalReps += s.reps ?? 0
        const vol = setVolume(s, type)
        sessionVol += vol
        r.totalVolume += vol
        if (s.type === 'warmup') continue
        const wKg = s.weightKg ?? 0
        if (wKg > r.heaviestKg) r.heaviestKg = wKg
        if (s.reps && wKg) {
          const rm = estimate1RM(wKg, s.reps)
          if (rm > r.best1RM) r.best1RM = rm
          if (vol > r.bestSetVolume) r.bestSetVolume = vol
          const rk = Math.min(s.reps, 12)
          if (!r.repRecords[rk] || wKg > r.repRecords[rk]) r.repRecords[rk] = wKg
        }
        if ((s.reps ?? 0) > r.maxReps) r.maxReps = s.reps ?? 0
        if ((s.durationS ?? 0) > r.maxDurationS) r.maxDurationS = s.durationS ?? 0
        if ((s.distanceM ?? 0) > r.maxDistanceM) r.maxDistanceM = s.distanceM ?? 0
      }
    }
    if (has) r.sessions++
    if (sessionVol > r.bestSessionVolume) r.bestSessionVolume = sessionVol
  }
  return r
}

/**
 * Marca `isPr` en las series del entreno que superen los récords previos
 * (peso máximo, 1RM estimado o volumen de serie; reps/tiempo/distancia según tipo).
 * Devuelve el número de PRs.
 */
export function markPRs(workout: Workout, previous: Workout[], typeOf: (id: string) => ExerciseType): number {
  let count = 0
  const cache = new Map<string, ExerciseRecords>()
  for (const e of workout.exercises) {
    const type = typeOf(e.exerciseId)
    if (!cache.has(e.exerciseId)) cache.set(e.exerciseId, computeRecords(previous, e.exerciseId, type))
    const rec = cache.get(e.exerciseId)!
    // los récords se van actualizando dentro del propio entreno para no marcar dos veces lo mismo
    for (const s of e.sets) {
      s.isPr = false
      if (!s.completed || s.type === 'warmup') continue
      let pr = false
      if (type === 'weight_reps' || type === 'weighted_bodyweight') {
        const wKg = s.weightKg ?? 0
        const rm = estimate1RM(wKg, s.reps ?? 0)
        const vol = wKg * (s.reps ?? 0)
        if (wKg > 0 && (s.reps ?? 0) > 0) {
          if (wKg > rec.heaviestKg) { pr = true; rec.heaviestKg = wKg }
          if (rm > rec.best1RM) { pr = true; rec.best1RM = rm }
          if (vol > rec.bestSetVolume) { pr = true; rec.bestSetVolume = vol }
        }
      } else if (type === 'bodyweight_reps' || type === 'reps_only' || type === 'assisted_bodyweight') {
        if ((s.reps ?? 0) > rec.maxReps) { pr = true; rec.maxReps = s.reps ?? 0 }
      } else if (type === 'duration' || type === 'weight_duration') {
        if ((s.durationS ?? 0) > rec.maxDurationS) { pr = true; rec.maxDurationS = s.durationS ?? 0 }
      } else if (type === 'distance_duration') {
        if ((s.distanceM ?? 0) > rec.maxDistanceM) { pr = true; rec.maxDistanceM = s.distanceM ?? 0 }
      }
      if (pr) { s.isPr = true; count++ }
    }
  }
  return count
}

export function countPRs(w: Workout): number {
  return w.exercises.reduce((a, e) => a + e.sets.filter((s) => s.isPr).length, 0)
}

/** Serie de puntos (fecha, valor) para gráficas de un ejercicio */
export type ChartMetric = 'best1RM' | 'heaviest' | 'volume' | 'reps' | 'duration' | 'distance'
export function chartSeries(workouts: Workout[], exerciseId: string, type: ExerciseType, metric: ChartMetric): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = []
  for (const w of [...workouts].sort((a, b) => a.startedAt - b.startedAt)) {
    let y = 0
    let has = false
    for (const e of w.exercises) {
      if (e.exerciseId !== exerciseId) continue
      for (const s of e.sets) {
        if (!s.completed) continue
        has = true
        switch (metric) {
          case 'best1RM': if (s.type !== 'warmup') y = Math.max(y, estimate1RM(s.weightKg ?? 0, s.reps ?? 0)); break
          case 'heaviest': if (s.type !== 'warmup') y = Math.max(y, s.weightKg ?? 0); break
          case 'volume': y += setVolume(s, type); break
          case 'reps': y = Math.max(y, s.reps ?? 0); break
          case 'duration': y = Math.max(y, s.durationS ?? 0); break
          case 'distance': y = Math.max(y, s.distanceM ?? 0); break
        }
      }
    }
    if (has) pts.push({ x: w.startedAt, y })
  }
  return pts
}
