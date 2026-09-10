// Formateo de unidades, duraciones y fechas (español).
import type { Settings } from '../types'

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

export const KG_PER_LB = 0.45359237
export const M_PER_MI = 1609.344

export function toDisplayWeight(kg: number, unit: Settings['weightUnit']): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB
}
export function fromDisplayWeight(v: number, unit: Settings['weightUnit']): number {
  return unit === 'kg' ? v : v * KG_PER_LB
}
export function fmtWeight(kg: number | null | undefined, unit: Settings['weightUnit'], withUnit = true): string {
  if (kg == null) return '-'
  const v = toDisplayWeight(kg, unit)
  const s = Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100)
  return withUnit ? `${s} ${unit}` : s
}
export function fmtNum(v: number | null | undefined): string {
  if (v == null) return ''
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100)
}

export function toDisplayDistance(m: number, unit: Settings['distanceUnit']): number {
  return unit === 'km' ? m / 1000 : m / M_PER_MI
}
export function fromDisplayDistance(v: number, unit: Settings['distanceUnit']): number {
  return unit === 'km' ? v * 1000 : v * M_PER_MI
}
export function fmtDistance(m: number | null | undefined, unit: Settings['distanceUnit']): string {
  if (m == null) return '-'
  const v = toDisplayDistance(m, unit)
  return `${Math.round(v * 100) / 100} ${unit}`
}

/** 95 → "1:35"; 3700 → "1:01:40" */
export function fmtClock(totalS: number): string {
  const s = Math.max(0, Math.floor(totalS))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? h + ':' : ''}${mm}:${String(sec).padStart(2, '0')}`
}

/** 95 → "1min 35s"; 3700 → "1h 1min" */
export function fmtDuration(totalS: number): string {
  const s = Math.max(0, Math.round(totalS))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return m > 0 ? `${h}h ${m}min` : `${h}h`
  if (m > 0) return sec > 0 && m < 10 ? `${m}min ${sec}s` : `${m}min`
  return `${sec}s`
}

/** Para inputs de duración: "1:30" ⇄ 90 */
export function parseClock(text: string): number | null {
  const t = text.trim()
  if (!t) return null
  if (/^\d+$/.test(t)) return Number(t)
  const parts = t.split(':').map((p) => Number(p))
  if (parts.some((p) => Number.isNaN(p))) return null
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return null
}

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function fmtTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function isSameDay(a: number, b: number): boolean {
  const x = new Date(a), y = new Date(b)
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate()
}

/** "Hoy, 06:12" · "Ayer, 06:10" · "lunes, 06:05" · "12 ago 2026, 06:00" */
export function fmtRelativeDate(ts: number, now = Date.now()): string {
  const d = new Date(ts)
  const time = fmtTime(ts)
  if (isSameDay(ts, now)) return `Hoy, ${time}`
  if (isSameDay(ts, now - 86400000)) return `Ayer, ${time}`
  const diffDays = Math.floor((now - ts) / 86400000)
  if (diffDays < 7) return `${cap(DAYS[d.getDay()])}, ${time}`
  const year = d.getFullYear() === new Date(now).getFullYear() ? '' : ` ${d.getFullYear()}`
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${year}, ${time}`
}

export function fmtDateShort(ts: number): string {
  const d = new Date(ts)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
export function fmtDateLong(ts: number): string {
  const d = new Date(ts)
  return `${cap(DAYS[d.getDay()])}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]} de ${d.getFullYear()}`
}
export function fmtMonthYear(ts: number): string {
  const d = new Date(ts)
  return `${cap(MONTHS_LONG[d.getMonth()])} ${d.getFullYear()}`
}
export function fmtDayMonth(ts: number): string {
  const d = new Date(ts)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Lunes de la semana (00:00) del timestamp */
export function startOfWeek(ts: number, mondayFirst = true): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = mondayFirst ? (day + 6) % 7 : day
  d.setDate(d.getDate() - diff)
  return d.getTime()
}
export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Saludo en función de la hora */
export function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 6) return 'Buenas noches'
  if (h < 13) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}
