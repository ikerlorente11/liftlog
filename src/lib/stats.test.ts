import { describe, expect, it } from 'vitest'
import { computeRecords, estimate1RM, fmtSet, markPRs, workoutVolume } from './stats'
import { fmtClock, fmtDuration, parseClock, startOfWeek } from './format'
import type { SetData, Workout } from '../types'

const set = (p: Partial<SetData>): SetData => ({ id: Math.random().toString(36), type: 'normal', weightKg: null, reps: null, distanceM: null, durationS: null, rpe: null, completed: true, ...p })
const workout = (startedAt: number, exerciseId: string, sets: SetData[]): Workout => ({
  id: String(startedAt), title: 'W', notes: '', startedAt, endedAt: startedAt + 3600000, durationS: 3600, routineId: null,
  exercises: [{ id: 'e' + startedAt, exerciseId, notes: '', restSeconds: null, supersetId: null, sets }],
})
const settings = { weightUnit: 'kg' as const, distanceUnit: 'km' as const }

describe('1RM y volumen', () => {
  it('Epley', () => {
    expect(estimate1RM(100, 1)).toBe(100)
    expect(estimate1RM(72.5, 5)).toBeCloseTo(84.58, 1)
    expect(estimate1RM(0, 5)).toBe(0)
  })
  it('volumen solo de series completadas', () => {
    const w = workout(1, 'bench', [set({ weightKg: 72.5, reps: 5 }), set({ weightKg: 72.5, reps: 5, completed: false })])
    expect(workoutVolume(w, () => 'weight_reps')).toBe(362.5)
  })
})

describe('récords y PRs', () => {
  it('detecta PR de peso, 1RM y volumen y no marca calentamientos', () => {
    const prev = [workout(1, 'bench', [set({ weightKg: 70, reps: 5 })])]
    const w = workout(2, 'bench', [set({ weightKg: 40, reps: 8, type: 'warmup' }), set({ weightKg: 72.5, reps: 5 }), set({ weightKg: 72.5, reps: 5 })])
    const n = markPRs(w, prev, () => 'weight_reps')
    expect(n).toBe(1)
    expect(w.exercises[0].sets[0].isPr).toBe(false)
    expect(w.exercises[0].sets[1].isPr).toBe(true)
    expect(w.exercises[0].sets[2].isPr).toBe(false)
  })
  it('primer entreno marca PR', () => {
    const w = workout(2, 'pull', [set({ reps: 8 })])
    expect(markPRs(w, [], () => 'bodyweight_reps')).toBe(1)
  })
  it('computeRecords acumula por reps', () => {
    const ws = [workout(1, 'bench', [set({ weightKg: 70, reps: 5 }), set({ weightKg: 60, reps: 8 })]), workout(2, 'bench', [set({ weightKg: 75, reps: 5 })])]
    const r = computeRecords(ws, 'bench', 'weight_reps')
    expect(r.heaviestKg).toBe(75)
    expect(r.repRecords[5]).toBe(75)
    expect(r.repRecords[8]).toBe(60)
    expect(r.sessions).toBe(2)
    expect(r.bestSessionVolume).toBe(830)
  })
})

describe('formato', () => {
  it('fmtSet por tipo', () => {
    expect(fmtSet(set({ weightKg: 72.5, reps: 5 }), 'weight_reps', settings)).toBe('72.5 kg × 5')
    expect(fmtSet(set({ weightKg: 10, reps: 6 }), 'weighted_bodyweight', settings)).toBe('+10 kg × 6')
    expect(fmtSet(set({ reps: 6 }), 'weighted_bodyweight', settings)).toBe('6 reps')
    expect(fmtSet(set({ durationS: 45 }), 'duration', settings)).toBe('0:45')
    expect(fmtSet(set({ distanceM: 1250, durationS: 1800 }), 'distance_duration', settings)).toBe('1.25 km · 30:00')
  })
  it('reloj y duración', () => {
    expect(fmtClock(95)).toBe('1:35')
    expect(fmtClock(3700)).toBe('1:01:40')
    expect(fmtDuration(90)).toBe('1min 30s')
    expect(fmtDuration(3660)).toBe('1h 1min')
    expect(parseClock('1:30')).toBe(90)
    expect(parseClock('45')).toBe(45)
    expect(parseClock('x')).toBeNull()
  })
  it('inicio de semana en lunes', () => {
    const wed = new Date(2026, 7, 19, 15).getTime() // miércoles 19 ago 2026
    expect(new Date(startOfWeek(wed)).getDate()).toBe(17)
    expect(new Date(startOfWeek(wed, false)).getDate()).toBe(16)
  })
})
