// Utilidades compartidas por el editor de rutina y el entreno en curso:
// índice de superseries y "series anteriores" por ejercicio.
import { useMemo } from 'react'
import type { ExerciseEntry, SetData, Workout } from '../types'

export function useSupersetIndex(entries: ExerciseEntry[]): Map<string, number> {
  return useMemo(() => {
    const m = new Map<string, number>()
    for (const e of entries) if (e.supersetId && !m.has(e.supersetId)) m.set(e.supersetId, m.size)
    return m
  }, [entries])
}

/** Últimas series completadas de cada ejercicio. Si el entreno viene de una
 * rutina, "la última vez" es la última sesión de ESA rutina: la prensa de
 * Pierna A (5×5 pesada) no debe comparar con la de Pierna B (3×10 ligera).
 * Solo si la rutina nunca ha hecho el ejercicio se mira cualquier entreno. */
export function usePreviousSets(workouts: Workout[], routineId?: string | null, excludeWorkoutId?: string): Map<string, SetData[]> {
  return useMemo(() => {
    const m = new Map<string, SetData[]>()
    const collect = (ws: Workout[]) => {
      for (const w of ws) {
        if (w.id === excludeWorkoutId) continue
        for (const e of w.exercises) {
          if (m.has(e.exerciseId)) continue
          const done = e.sets.filter((s) => s.completed)
          if (done.length) m.set(e.exerciseId, done)
        }
      }
    }
    if (routineId) collect(workouts.filter((w) => w.routineId === routineId))
    collect(workouts)
    return m
  }, [workouts, routineId, excludeWorkoutId])
}
