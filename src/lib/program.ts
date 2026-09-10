// Programas por semanas: una rutina puede llevar un plan de N semanas dividido
// en fases (bloques, descargas, semanas de test). La semana actual se deriva de
// program.startedAt y decide qué objetivos se muestran y con qué se entrena.
import type { ExerciseEntry, ProgramPhase, Routine, RoutineProgram } from '../types'
import { startOfWeek } from './format'

const WEEK_MS = 7 * 24 * 3600 * 1000

/** Semana actual del programa (1-based, sin tope). null si el plan no ha empezado. */
export function programWeek(p: RoutineProgram, now = Date.now(), mondayFirst = true): number | null {
  if (p.startedAt == null) return null
  const diff = startOfWeek(now, mondayFirst) - startOfWeek(p.startedAt, mondayFirst)
  return Math.max(1, Math.round(diff / WEEK_MS) + 1)
}

/** startedAt necesario para que la semana actual pase a ser `week`. */
export function startedAtForWeek(week: number, now = Date.now(), mondayFirst = true): number {
  return startOfWeek(now, mondayFirst) - (week - 1) * WEEK_MS
}

export function phaseForWeek(p: RoutineProgram, week: number): ProgramPhase | null {
  const w = Math.min(Math.max(1, week), p.totalWeeks)
  return p.phases.find((ph) => ph.weeks.includes(w)) ?? null
}

/** Descarga: mitad de series normales (redondeo hacia arriba); calentamientos intactos. */
export function deloadEntries(entries: ExerciseEntry[]): ExerciseEntry[] {
  return entries.map((e) => {
    const keep = Math.ceil(e.sets.filter((s) => s.type !== 'warmup').length / 2)
    let n = 0
    return { ...e, sets: e.sets.filter((s) => s.type === 'warmup' || ++n <= keep) }
  })
}

export interface EffectiveTargets {
  /** Semana usada para elegir la fase (si el plan no ha empezado, 1) */
  week: number
  started: boolean
  /** La semana real ya pasó de totalWeeks */
  finished: boolean
  phase: ProgramPhase | null
  /** Objetivos con los que se muestra/empieza el entreno esta semana */
  entries: ExerciseEntry[]
}

/** Objetivos efectivos de la rutina para la semana actual de su programa. */
export function effectiveTargets(r: Routine, now = Date.now(), mondayFirst = true): EffectiveTargets {
  const p = r.program
  if (!p || !p.phases.length) return { week: 1, started: false, finished: false, phase: null, entries: r.exercises }
  const real = programWeek(p, now, mondayFirst)
  const finished = real != null && real > p.totalWeeks
  const week = real == null ? 1 : Math.min(real, p.totalWeeks)
  const phase = phaseForWeek(p, week)
  let entries = phase?.exercises ?? r.exercises
  if (phase?.deload && !phase.exercises) entries = deloadEntries(entries)
  return { week, started: real != null, finished, phase, entries }
}

/** Texto corto para tarjetas: "Semana 3/24 · Bloque 1". */
export function programChip(r: Routine, now = Date.now(), mondayFirst = true): string | null {
  const p = r.program
  if (!p || !p.phases.length) return null
  const t = effectiveTargets(r, now, mondayFirst)
  if (!t.started) return `Plan de ${p.totalWeeks} semanas · sin empezar`
  if (t.finished) return `Plan completado (${p.totalWeeks} semanas) 🎉`
  const label = t.phase ? ` · ${t.phase.label}` : ''
  return `Semana ${t.week}/${p.totalWeeks}${label}`
}
