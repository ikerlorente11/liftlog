// Composición corporal como porcentaje del peso. Los informes de bioimpedancia
// dan la masa grasa, muscular, el agua, etc. en kg; aquí se prefieren como
// % del peso corporal (9/09/2026), que es lo que cambia de verdad cuando el
// peso sube. El % se calcula con el peso del MISMO origen medido el mismo día
// (o a pocos días): mezclar un kg de la Tanita con un peso de la báscula de
// casa daría un número sin sentido.
import type { Measurement, MeasurementSource } from '../types'

// Qué medidas se muestran como "% (kg)" lo decide la configuración del usuario
// (isPercentOfWeightField en measurementConfig.ts): masas de composición
// distintas del propio peso.

const DAY = 86_400_000

/** Peso (kg) del mismo origen más cercano a la fecha, dentro de una tolerancia. */
export function weightNear(measurements: Measurement[], source: MeasurementSource, date: number, toleranceDays = 3): number | null {
  let best: Measurement | null = null
  let bestGap = Infinity
  for (const m of measurements) {
    if (m.key !== 'weight' || (m.source ?? 'home') !== source) continue
    const gap = Math.abs(m.date - date)
    if (gap <= toleranceDays * DAY && gap < bestGap) { best = m; bestGap = gap }
  }
  return best ? best.value : null
}

/** Valor en kg como % del peso, con un decimal; null si no hay peso comparable. */
export function percentOfWeight(valueKg: number, weightKg: number | null): number | null {
  if (weightKg == null || weightKg <= 0) return null
  return Math.round((valueKg / weightKg) * 1000) / 10
}

// Nota histórica: hasta el 9/09/2026 existía `body_fat` en %, que era la grasa
// con otra unidad; la base la convierte a `fat_mass` en kg con el peso de ese
// día (`convertBodyFatRows`).

/** % y kg de una medida de composición. El % falta si no hay peso comparable. */
export function composition(_key: string, valueKg: number, weightKg: number | null): { pct: number | null; kg: number | null } {
  return { pct: percentOfWeight(valueKg, weightKg), kg: valueKg }
}

/** kg a partir de un % del peso (para apuntar la grasa como la da la báscula). */
export function kgFromPercent(pct: number, weightKg: number): number {
  return Math.round((pct / 100) * weightKg * 10) / 10
}

const num1 = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',')

/** "18,9 % (17,1 kg)"; si falta una de las dos, solo la que hay. */
export function fmtComposition(c: { pct: number | null; kg: number | null }, weightUnit: string): string {
  if (c.pct != null && c.kg != null) return `${num1(c.pct)} % (${num1(c.kg)} ${weightUnit})`
  if (c.pct != null) return `${num1(c.pct)} %`
  if (c.kg != null) return `${num1(c.kg)} ${weightUnit}`
  return '—'
}

/** Las dos cifras por separado para darles distinto peso visual: la principal
 *  es el % cuando lo hay (si no, lo que haya) y la secundaria va entre paréntesis. */
export function compositionParts(c: { pct: number | null; kg: number | null }, weightUnit: string): { primary: string; secondary: string | null } {
  if (c.pct != null) return { primary: `${num1(c.pct)} %`, secondary: c.kg != null ? `${num1(c.kg)} ${weightUnit}` : null }
  if (c.kg != null) return { primary: `${num1(c.kg)} ${weightUnit}`, secondary: null }
  return { primary: '—', secondary: null }
}
