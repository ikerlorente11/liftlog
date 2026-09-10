import { describe, expect, it } from 'vitest'
import type { ExerciseEntry, Routine, RoutineProgram, SetData } from '../types'
import { deloadEntries, effectiveTargets, phaseForWeek, programChip, programWeek, startedAtForWeek } from './program'

const DAY = 24 * 3600 * 1000

function set(type: SetData['type'] = 'normal'): SetData {
  return { id: Math.random().toString(36).slice(2), type, weightKg: 50, reps: 8, distanceM: null, durationS: null, rpe: null, completed: false }
}
function entry(nSets: number, nWarmup = 0): ExerciseEntry {
  return {
    id: 'e', exerciseId: 'x', notes: '', restSeconds: null, supersetId: null,
    sets: [...Array.from({ length: nWarmup }, () => set('warmup')), ...Array.from({ length: nSets }, () => set())],
  }
}
function routine(program: RoutineProgram | null): Routine {
  return { id: 'r', name: 'R', notes: '', folderId: null, position: 0, createdAt: 0, updatedAt: 0, exercises: [entry(4, 1)], program }
}

// lunes 2026-08-17 00:00 (semana del 17 al 23)
const MON = new Date(2026, 7, 17).getTime()

const prog = (startedAt: number | null): RoutineProgram => ({
  totalWeeks: 4,
  startedAt,
  phases: [
    { weeks: [1, 2], label: 'Bloque 1' },
    { weeks: [3], label: 'Descarga', deload: true },
    { weeks: [4], label: 'Final', exercises: [entry(2)] },
  ],
})

describe('programWeek', () => {
  it('null si no ha empezado', () => {
    expect(programWeek(prog(null), MON)).toBeNull()
  })
  it('semana 1 durante la primera semana, aunque empezara en miércoles', () => {
    const wed = MON + 2 * DAY
    expect(programWeek(prog(wed), wed)).toBe(1)
    expect(programWeek(prog(wed), MON + 6 * DAY)).toBe(1) // domingo de la misma semana
  })
  it('avanza al cambiar de semana', () => {
    expect(programWeek(prog(MON), MON + 7 * DAY)).toBe(2)
    expect(programWeek(prog(MON), MON + 27 * DAY)).toBe(4)
    expect(programWeek(prog(MON), MON + 28 * DAY)).toBe(5) // ya fuera del plan
  })
})

describe('startedAtForWeek', () => {
  it('fijar la semana N deja programWeek en N', () => {
    const now = MON + 3 * DAY // jueves
    for (const w of [1, 2, 3, 4]) {
      expect(programWeek(prog(startedAtForWeek(w, now)), now)).toBe(w)
    }
  })
})

describe('phaseForWeek / effectiveTargets', () => {
  it('elige la fase por semana', () => {
    expect(phaseForWeek(prog(MON), 2)?.label).toBe('Bloque 1')
    expect(phaseForWeek(prog(MON), 3)?.label).toBe('Descarga')
    expect(phaseForWeek(prog(MON), 99)?.label).toBe('Final') // clamp a totalWeeks
  })
  it('sin programa usa los ejercicios de la rutina', () => {
    const t = effectiveTargets(routine(null), MON)
    expect(t.phase).toBeNull()
    expect(t.entries[0].sets).toHaveLength(5)
  })
  it('fase con exercises usa los objetivos de la fase', () => {
    const t = effectiveTargets(routine(prog(MON)), MON + 21 * DAY) // semana 4
    expect(t.phase?.label).toBe('Final')
    expect(t.entries[0].sets).toHaveLength(2)
  })
  it('descarga = mitad de series normales, calentamiento intacto', () => {
    const t = effectiveTargets(routine(prog(MON)), MON + 14 * DAY) // semana 3
    expect(t.phase?.label).toBe('Descarga')
    const sets = t.entries[0].sets
    expect(sets.filter((s) => s.type === 'warmup')).toHaveLength(1)
    expect(sets.filter((s) => s.type !== 'warmup')).toHaveLength(2) // ceil(4/2)
  })
  it('plan sin empezar muestra semana 1', () => {
    const t = effectiveTargets(routine(prog(null)), MON)
    expect(t.started).toBe(false)
    expect(t.week).toBe(1)
    expect(t.phase?.label).toBe('Bloque 1')
  })
  it('plan terminado se queda en la última fase', () => {
    const t = effectiveTargets(routine(prog(MON)), MON + 60 * DAY)
    expect(t.finished).toBe(true)
    expect(t.week).toBe(4)
  })
})

describe('deloadEntries', () => {
  it('redondea hacia arriba y aguanta 1 serie', () => {
    expect(deloadEntries([entry(5)])[0].sets).toHaveLength(3)
    expect(deloadEntries([entry(1)])[0].sets).toHaveLength(1)
  })
})

describe('programChip', () => {
  it('estados: sin empezar, en curso, completado', () => {
    expect(programChip(routine(prog(null)), MON)).toBe('Plan de 4 semanas · sin empezar')
    expect(programChip(routine(prog(MON)), MON + 8 * DAY)).toBe('Semana 2/4 · Bloque 1')
    expect(programChip(routine(prog(MON)), MON + 60 * DAY)).toContain('Plan completado')
    expect(programChip(routine(null), MON)).toBeNull()
  })
})
