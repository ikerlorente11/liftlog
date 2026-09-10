import { describe, expect, it } from 'vitest'
import type { Measurement } from '../types'
import { composition, fmtComposition, kgFromPercent, percentOfWeight, weightNear } from './measurements'

const d = (s: string) => new Date(s + 'T12:00:00').getTime()
const ms: Measurement[] = [
  { id: 'w1', key: 'weight', value: 90.7, date: d('2026-09-07'), source: 'official' },
  { id: 'w2', key: 'weight', value: 90.8, date: d('2026-09-06'), source: 'home' },
  { id: 'f1', key: 'fat_mass', value: 17.1, date: d('2026-09-07'), source: 'official' },
]

describe('percentOfWeight', () => {
  it('usa el peso del mismo origen y del mismo día', () => {
    expect(weightNear(ms, 'official', d('2026-09-07'))).toBe(90.7)
    expect(percentOfWeight(17.1, 90.7)).toBe(18.9)
  })
  it('no mezcla orígenes ni fechas lejanas', () => {
    expect(weightNear(ms, 'official', d('2026-05-07'))).toBeNull()
    expect(weightNear(ms, 'home', d('2026-09-07'))).toBe(90.8)
    expect(percentOfWeight(17.1, null)).toBeNull()
  })
})

describe('composition', () => {
  it('deriva el % de las masas en kg y los kg de un % con el peso', () => {
    expect(composition('muscle_mass', 70.3, 90.7)).toEqual({ pct: 77.5, kg: 70.3 })
    expect(composition('fat_mass', 17.1, null)).toEqual({ pct: null, kg: 17.1 })
    expect(kgFromPercent(18.9, 90.7)).toBe(17.1)
  })
  it('formatea "% (kg)" y degrada si falta uno', () => {
    expect(fmtComposition({ pct: 18.9, kg: 17.1 }, 'kg')).toBe('18,9 % (17,1 kg)')
    expect(fmtComposition({ pct: null, kg: 18 }, 'kg')).toBe('18 kg')
    expect(fmtComposition({ pct: 20, kg: null }, 'kg')).toBe('20 %')
  })
})
