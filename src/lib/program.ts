// Programas por semanas: una rutina puede llevar un plan de N semanas dividido
// en fases (bloques, descargas, semanas de test). La semana actual se deriva de
// program.startedAt y decide qué objetivos se muestran y con qué se entrena.
import type { ExerciseEntry, ProgramPhase, Routine, RoutineProgram } from '../types'
import { fmtDayMonth, startOfDay, startOfWeek } from './format'

const WEEK_MS = 7 * 24 * 3600 * 1000

/** Semana actual del programa (1-based, sin tope). null si el plan no ha empezado. */
export function programWeek(p: RoutineProgram, now = Date.now(), mondayFirst = true): number | null {
  if (p.startedAt == null) return null
  // En pausa: se muestra la semana en la que se reanudará el plan
  const at = isPaused(p, now) ? (p.pausedUntil as number) : now
  const diff = startOfWeek(at, mondayFirst) - startOfWeek(p.startedAt, mondayFirst)
  return Math.max(1, Math.round(diff / WEEK_MS) + 1)
}

/** startedAt necesario para que la semana actual pase a ser `week`. */
export function startedAtForWeek(week: number, now = Date.now(), mondayFirst = true): number {
  return startOfWeek(now, mondayFirst) - (week - 1) * WEEK_MS
}

/** true mientras el plan está en pausa (días que no cuentan). */
export function isPaused(p: RoutineProgram, now = Date.now()): boolean {
  return p.pausedUntil != null && now < p.pausedUntil
}

/** Semanas de calendario entre la semana de `from` y la de `until` (puede ser 0). */
function weeksBetween(from: number, until: number, mondayFirst: boolean): number {
  return Math.max(0, Math.round((startOfWeek(until, mondayFirst) - startOfWeek(from, mondayFirst)) / WEEK_MS))
}

/**
 * Pausa el plan hasta el día `until` (inclusive el día anterior): lo que hay
 * entre hoy y esa fecha no cuenta. startedAt se desplaza las semanas necesarias
 * para que la semana de `until` sea la misma que toca ahora. Si ya había una
 * pausa, se sustituye (sirve para acortarla o alargarla).
 */
export function pauseProgramUntil(p: RoutineProgram, until: number, now = Date.now(), mondayFirst = true): RoutineProgram {
  const base = resumeProgram(p, now, mondayFirst)
  const day = startOfDay(until)
  if (day <= startOfDay(now)) return base
  const n = weeksBetween(now, day, mondayFirst)
  return { ...base, startedAt: base.startedAt == null ? null : base.startedAt + n * WEEK_MS, pausedUntil: day }
}

/** Pausa `weeks` semanas enteras a partir de la actual (o alarga una pausa activa). */
export function pauseProgram(p: RoutineProgram, weeks: number, now = Date.now(), mondayFirst = true): RoutineProgram {
  const n = Math.max(1, Math.round(weeks))
  const from = isPaused(p, now) ? (p.pausedUntil as number) : startOfWeek(now, mondayFirst)
  return pauseProgramUntil(p, from + n * WEEK_MS, now, mondayFirst)
}

/** Reanuda el plan hoy: la semana mostrada durante la pausa pasa a ser la actual. */
export function resumeProgram(p: RoutineProgram, now = Date.now(), mondayFirst = true): RoutineProgram {
  if (!isPaused(p, now)) return p.pausedUntil == null ? p : { ...p, pausedUntil: null }
  const remaining = weeksBetween(now, p.pausedUntil as number, mondayFirst)
  return { ...p, startedAt: p.startedAt == null ? null : p.startedAt - remaining * WEEK_MS, pausedUntil: null }
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
  /** Plan en pausa: los días hasta pausedUntil no cuentan */
  paused: boolean
  pausedUntil: number | null
  phase: ProgramPhase | null
  /** Objetivos con los que se muestra/empieza el entreno esta semana */
  entries: ExerciseEntry[]
}

/** Objetivos efectivos de la rutina para la semana actual de su programa. */
export function effectiveTargets(r: Routine, now = Date.now(), mondayFirst = true): EffectiveTargets {
  const p = r.program
  if (!p || !p.phases.length) return { week: 1, started: false, finished: false, paused: false, pausedUntil: null, phase: null, entries: r.exercises }
  const real = programWeek(p, now, mondayFirst)
  const finished = real != null && real > p.totalWeeks
  const week = real == null ? 1 : Math.min(real, p.totalWeeks)
  const phase = phaseForWeek(p, week)
  let entries = phase?.exercises ?? r.exercises
  if (phase?.deload && !phase.exercises) entries = deloadEntries(entries)
  const paused = isPaused(p, now)
  return { week, started: real != null, finished, paused, pausedUntil: paused ? (p.pausedUntil as number) : null, phase, entries }
}

/** Texto corto para tarjetas: "Semana 3/24 · Bloque 1". */
export function programChip(r: Routine, now = Date.now(), mondayFirst = true): string | null {
  const p = r.program
  if (!p || !p.phases.length) return null
  const t = effectiveTargets(r, now, mondayFirst)
  if (!t.started) return `Plan de ${p.totalWeeks} semanas · sin empezar`
  if (t.finished) return `Plan completado (${p.totalWeeks} semanas) 🎉`
  const label = t.phase ? ` · ${t.phase.label}` : ''
  if (t.paused) return `Semana ${t.week}/${p.totalWeeks} · en pausa, vuelve el ${fmtDayMonth(t.pausedUntil as number)}`
  return `Semana ${t.week}/${p.totalWeeks}${label}`
}
