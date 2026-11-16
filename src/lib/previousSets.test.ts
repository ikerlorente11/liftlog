import { describe, expect, it } from 'vitest'
import type { SetData } from '../types'
import { matchPreviousSets } from './previousSets'

let n = 0
const set = (type: SetData['type'], weightKg: number, completed = true): SetData =>
  ({ id: `s${n++}`, type, weightKg, reps: 5, completed }) as SetData

describe('matchPreviousSets', () => {
  it('calentamientos saltados salen en blanco y las efectivas no se desplazan', () => {
    // Prensa: 3 calentamientos (solo se hizo el 3º) + 5 efectivas a 220
    const prev = [set('warmup', 100, false), set('warmup', 140, false), set('warmup', 180), ...Array.from({ length: 5 }, () => set('normal', 220))]
    const today = [set('warmup', 0), set('warmup', 0), set('warmup', 0), ...Array.from({ length: 5 }, () => set('normal', 0))]
    const m = matchPreviousSets(today, prev)
    expect(m.map((s) => s?.weightKg)).toEqual([undefined, undefined, 180, 220, 220, 220, 220, 220])
  })

  it('empareja por tipo aunque hoy haya más calentamientos que la última vez', () => {
    const prev = [set('warmup', 60), set('normal', 80), set('normal', 82.5)]
    const today = [set('warmup', 0), set('warmup', 0), set('normal', 0), set('normal', 0)]
    expect(matchPreviousSets(today, prev).map((s) => s?.weightKg)).toEqual([60, undefined, 80, 82.5])
  })

  it('dropset y fallo cuentan como efectivas', () => {
    const prev = [set('normal', 80), set('failure', 70)]
    const today = [set('normal', 0), set('dropset', 0)]
    expect(matchPreviousSets(today, prev).map((s) => s?.weightKg)).toEqual([80, 70])
  })

  it('una efectiva no completada la última vez sale en blanco', () => {
    const prev = [set('normal', 80), set('normal', 80, false)]
    const today = [set('normal', 0), set('normal', 0), set('normal', 0)]
    expect(matchPreviousSets(today, prev).map((s) => s?.weightKg)).toEqual([80, undefined, undefined])
  })

  it('sin anterior todo en blanco', () => {
    expect(matchPreviousSets([set('normal', 0)], undefined)).toEqual([undefined])
  })
})
