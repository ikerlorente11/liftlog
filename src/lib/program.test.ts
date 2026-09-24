import { describe, expect, it } from 'vitest'
import type { ExerciseEntry, Routine, RoutineProgram, SetData } from '../types'
import { deloadEntries, effectiveTargets, isPaused, pauseProgram, pauseProgramUntil, phaseForWeek, programChip, programWeek, resumeProgram, startedAtForWeek } from './program'

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

describe('pausa del plan', () => {
  const WEEK = 7 * DAY
  const P24 = { ...prog(MON), totalWeeks: 24 }
  it('en pausa se muestra la semana en la que se reanudará y startedAt se desplaza', () => {
    // semana 5 (lunes MON + 4 semanas); pausa de 2 semanas
    const now = MON + 4 * WEEK + 3 * DAY
    const p = pauseProgram(P24, 2, now)
    expect(p.startedAt).toBe(MON + 2 * WEEK)
    expect(p.pausedUntil).toBe(MON + 6 * WEEK)
    expect(isPaused(p, now)).toBe(true)
    expect(programWeek(p, now)).toBe(5) // esta semana
    expect(programWeek(p, now + WEEK)).toBe(5) // la siguiente sigue en pausa
    expect(isPaused(p, now + 2 * WEEK)).toBe(false)
    expect(programWeek(p, now + 2 * WEEK)).toBe(5) // al volver toca la semana 5
    expect(programWeek(p, now + 3 * WEEK)).toBe(6)
    expect(programChip(routine({ ...p }), now)).toMatch(/Semana 5\/24 · en pausa, vuelve el/)
  })
  it('pausar hasta un día concreto (miércoles de dentro de dos semanas)', () => {
    const now = MON + 4 * WEEK + 3 * DAY // jueves de la semana 5
    const until = MON + 6 * WEEK + 2 * DAY + 15 * 3600 * 1000 // miércoles, con hora
    const p = pauseProgramUntil(P24, until, now)
    expect(p.pausedUntil).toBe(MON + 6 * WEEK + 2 * DAY) // a las 00:00
    expect(p.startedAt).toBe(MON + 2 * WEEK)
    expect(programWeek(p, now)).toBe(5)
    expect(isPaused(p, MON + 6 * WEEK + DAY)).toBe(true) // el martes de esa semana aún no cuenta
    expect(programWeek(p, MON + 6 * WEEK + DAY)).toBe(5)
    expect(isPaused(p, MON + 6 * WEEK + 2 * DAY)).toBe(false) // el miércoles se reanuda en la 5
    expect(programWeek(p, MON + 6 * WEEK + 2 * DAY)).toBe(5)
    expect(programWeek(p, MON + 7 * WEEK)).toBe(6)
  })
  it('pausar hasta un día de la misma semana no mueve el plan pero marca la pausa', () => {
    const now = MON + 4 * WEEK + 3 * DAY
    const p = pauseProgramUntil(P24, now + 2 * DAY, now)
    expect(p.startedAt).toBe(MON)
    expect(isPaused(p, now)).toBe(true)
    expect(programWeek(p, now)).toBe(5)
  })
  it('una fecha pasada o de hoy no pausa nada', () => {
    const now = MON + 4 * WEEK + 3 * DAY
    expect(pauseProgramUntil(P24, now, now).pausedUntil).toBeUndefined()
    expect(pauseProgramUntil(P24, now - DAY, now).startedAt).toBe(MON)
  })
  it('cambiar la fecha de una pausa activa la sustituye (acortar y alargar)', () => {
    const now = MON + 4 * WEEK
    const p3 = pauseProgram(P24, 3, now)
    const shorter = pauseProgramUntil(p3, MON + 5 * WEEK, now + 2 * DAY)
    expect(shorter.startedAt).toBe(MON + WEEK)
    expect(programWeek(shorter, MON + 5 * WEEK)).toBe(5)
    const longer = pauseProgramUntil(p3, MON + 8 * WEEK, now + 2 * DAY)
    expect(longer.startedAt).toBe(MON + 4 * WEEK)
    expect(programWeek(longer, MON + 8 * WEEK)).toBe(5)
  })
  it('alargar una pausa activa suma semanas al final', () => {
    const now = MON + 4 * WEEK
    const p = pauseProgram(pauseProgram(P24, 1, now), 1, now + 2 * DAY)
    expect(p.pausedUntil).toBe(MON + 6 * WEEK)
    expect(programWeek(p, now + 2 * WEEK)).toBe(5)
  })
  it('reanudar antes de tiempo hace que la semana actual sea la mostrada', () => {
    const now = MON + 4 * WEEK
    const paused = pauseProgram(P24, 3, now)
    const p = resumeProgram(paused, now + WEEK + DAY) // en la 2ª semana de pausa
    expect(p.pausedUntil).toBeNull()
    expect(programWeek(p, now + WEEK + DAY)).toBe(5)
    expect(programWeek(p, now + 2 * WEEK)).toBe(6)
  })
  it('reanudar sin pausa activa no cambia nada', () => {
    expect(resumeProgram(P24, MON)).toBe(P24)
    expect(effectiveTargets(routine(P24), MON).paused).toBe(false)
  })
  it('un plan sin empezar puede pausarse sin startedAt', () => {
    const p = pauseProgram(prog(null), 1, MON)
    expect(p.startedAt).toBeNull()
    expect(programWeek(p, MON)).toBeNull()
  })
})
