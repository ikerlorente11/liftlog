// Programación semanal de rutinas: qué rutina toca hoy (para que la pestaña
// Entreno se desplace sola hasta ella) y textos cortos de día/hora. Si la
// rutina no tiene horario explícito se deduce del nombre ("Viernes · Pierna B")
// y de la hora entre paréntesis del nombre de la rutina o de su carpeta
// ("Gimnasio (6:00)").
import type { Folder, Routine, RoutineSchedule } from '../types'

/** Etiquetas cortas por Date.getDay() (0 = domingo). */
export const DAY_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
export const DAY_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

/** Días de la semana en el orden en que se muestran (lunes o domingo primero). */
export function weekDays(mondayFirst = true): number[] {
  return mondayFirst ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]
}

/** "HH:MM" → minutos desde medianoche; null si no es una hora válida. */
export function parseTime(t: string | null | undefined): number | null {
  if (!t) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim())
  if (!m) return null
  const h = Number(m[1]); const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

export function fmtTimeOfDay(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** "Lunes y jueves · 18:00" para tarjetas y detalle; null si no hay programación. */
export function scheduleLabel(s: RoutineSchedule | null | undefined, mondayFirst = true): string | null {
  if (!s?.days.length) return null
  const days = weekDays(mondayFirst).filter((d) => s.days.includes(d))
  const names = days.map((d, i) => (i === 0 ? DAY_LONG[d] : DAY_LONG[d].toLowerCase()))
  const text = names.length > 1 ? `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}` : names[0]
  const t = parseTime(s.time)
  return t == null ? text : `${text} · ${fmtTimeOfDay(t)}`
}

const DAY_WORDS: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
  // abreviaturas habituales en nombres de rutina
  dom: 0, lun: 1, mar: 2, mie: 3, jue: 4, vie: 5, sab: 6,
}

function fold(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Días de la semana que aparecen como palabra en el texto ("Lunes y jueves · Torso"). */
export function daysFromText(text: string): number[] {
  const out = new Set<number>()
  for (const w of fold(text).split(/[^a-z]+/)) if (w in DAY_WORDS) out.add(DAY_WORDS[w])
  return [...out].sort()
}

/** Hora "(6:00)" / "(15:30)" dentro del texto, en minutos; null si no hay. */
export function timeFromText(text: string): number | null {
  const m = /\(\s*(\d{1,2})[:.h](\d{2})\s*\)/.exec(text) ?? /\b(\d{1,2}):(\d{2})\b/.exec(text)
  return m ? parseTime(`${m[1]}:${m[2]}`) : null
}

/**
 * Horario efectivo de una rutina: el explícito si lo tiene; si no, el que se
 * deduce del nombre (día) y de la hora del nombre de la rutina o de su carpeta.
 * null si no se puede deducir el día.
 */
export function effectiveSchedule(r: Routine, folders: Folder[] = []): RoutineSchedule | null {
  const days = r.schedule?.days.length ? r.schedule.days : daysFromText(r.name)
  if (!days.length) return null
  if (parseTime(r.schedule?.time) != null) return { days, time: r.schedule?.time }
  // Sin hora explícita: la del nombre de la rutina o, si no, la de su carpeta
  const folder = r.folderId ? folders.find((f) => f.id === r.folderId) : undefined
  const t = timeFromText(r.name) ?? (folder ? timeFromText(folder.name) : null)
  return { days, time: t == null ? null : fmtTimeOfDay(t) }
}

/** Rutinas que tocan hoy, ordenadas por cercanía de su hora a la actual
 * (las que no tienen hora van detrás, por posición). */
export function todayRoutines(routines: Routine[], folders: Folder[] = [], now = Date.now()): Routine[] {
  const d = new Date(now)
  const day = d.getDay()
  const nowMin = d.getHours() * 60 + d.getMinutes()
  const score = (r: Routine) => {
    const t = parseTime(effectiveSchedule(r, folders)?.time)
    return t == null ? Number.POSITIVE_INFINITY : Math.abs(t - nowMin)
  }
  return routines
    .filter((r) => effectiveSchedule(r, folders)?.days.includes(day))
    .sort((a, b) => score(a) - score(b) || a.position - b.position)
}

/**
 * Rutina que toca hoy. Si hay varias para el día de hoy gana la que tenga la
 * hora más cercana a la actual; las que no tienen hora van detrás (por orden
 * de posición). null si ninguna rutina está programada para hoy.
 */
export function todayRoutine(routines: Routine[], folders: Folder[] = [], now = Date.now()): Routine | null {
  return todayRoutines(routines, folders, now)[0] ?? null
}
