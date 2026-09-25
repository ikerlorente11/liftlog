import { describe, expect, it } from 'vitest'
import type { Folder, Routine, RoutineSchedule } from '../types'
import { daysFromText, effectiveSchedule, parseTime, scheduleLabel, timeFromText, todayRoutine, todayRoutines, weekDays } from './schedule'

function routine(id: string, position: number, schedule: RoutineSchedule | null, name = id, folderId: string | null = null): Routine {
  return { id, name, notes: '', folderId, position, createdAt: 0, updatedAt: 0, exercises: [], schedule }
}

// jueves 2026-09-24 a las 18:30
const THU_1830 = new Date(2026, 8, 24, 18, 30).getTime()

describe('parseTime', () => {
  it('acepta HH:MM y rechaza lo demás', () => {
    expect(parseTime('18:00')).toBe(1080)
    expect(parseTime('7:05')).toBe(425)
    expect(parseTime('24:00')).toBeNull()
    expect(parseTime('')).toBeNull()
    expect(parseTime(null)).toBeNull()
    expect(parseTime('tarde')).toBeNull()
  })
})

describe('scheduleLabel', () => {
  it('ordena los días según el inicio de semana y añade la hora', () => {
    expect(scheduleLabel({ days: [0, 1], time: '18:00' })).toBe('Lunes y domingo · 18:00')
    expect(scheduleLabel({ days: [0, 1], time: '18:00' }, false)).toBe('Domingo y lunes · 18:00')
    expect(scheduleLabel({ days: [1, 3, 5] })).toBe('Lunes, miércoles y viernes')
    expect(scheduleLabel({ days: [] })).toBeNull()
    expect(scheduleLabel(null)).toBeNull()
  })
  it('weekDays empieza en lunes o domingo', () => {
    expect(weekDays(true)).toEqual([1, 2, 3, 4, 5, 6, 0])
    expect(weekDays(false)[0]).toBe(0)
  })
})

describe('todayRoutine', () => {
  it('devuelve null si ninguna rutina es de hoy', () => {
    expect(todayRoutine([routine('a', 0, { days: [1] }), routine('b', 1, null)], [], THU_1830)).toBeNull()
  })
  it('devuelve la única rutina de hoy aunque no tenga hora', () => {
    expect(todayRoutine([routine('a', 0, { days: [1] }), routine('b', 1, { days: [4] })], [], THU_1830)?.id).toBe('b')
  })
  it('con varias rutinas hoy elige la de hora más cercana', () => {
    const list = [
      routine('mañana', 0, { days: [4], time: '07:00' }),
      routine('tarde', 1, { days: [4], time: '19:00' }),
      routine('noche', 2, { days: [4], time: '21:30' }),
    ]
    expect(todayRoutine(list, [], THU_1830)?.id).toBe('tarde')
    expect(todayRoutine(list, [], new Date(2026, 8, 24, 6, 0).getTime())?.id).toBe('mañana')
  })
  it('las rutinas con hora van antes que las que no la tienen; sin hora decide la posición', () => {
    expect(todayRoutine([routine('sin', 0, { days: [4] }), routine('con', 1, { days: [4], time: '09:00' })], [], THU_1830)?.id).toBe('con')
    expect(todayRoutine([routine('b', 1, { days: [4] }), routine('a', 0, { days: [4] })], [], THU_1830)?.id).toBe('a')
  })
})

describe('deducción del horario a partir de nombres', () => {
  const gym: Folder = { id: 'gym', name: 'Plan 24 semanas · Gimnasio (6:00)', position: 0 }
  const cal: Folder = { id: 'cal', name: 'Plan 24 semanas · Calistenia (20:00)', position: 1 }
  const folders = [gym, cal]
  // viernes 2026-09-25 a las 06:10
  const FRI_0610 = new Date(2026, 8, 25, 6, 10).getTime()

  it('saca el día del nombre de la rutina, con o sin acentos', () => {
    expect(daysFromText('Viernes · Pierna B: glúteo')).toEqual([5])
    expect(daysFromText('Miércoles noche · Calistenia: tirón')).toEqual([3])
    expect(daysFromText('Lunes y jueves · Torso')).toEqual([1, 4])
    expect(daysFromText('Test · cada 6 semanas (en vez del martes)')).toEqual([2])
    expect(daysFromText('Vacaciones · Cuerpo entero')).toEqual([])
  })
  it('saca la hora entre paréntesis', () => {
    expect(timeFromText('Gimnasio (6:00)')).toBe(360)
    expect(timeFromText('Piscina (15:30)')).toBe(930)
    expect(timeFromText('Finde · Calistenia (opcional)')).toBeNull()
  })
  it('el horario explícito manda; si no, nombre de rutina + hora de la carpeta', () => {
    const pierna = routine('p', 4, null, 'Viernes · Pierna B', 'gym')
    expect(effectiveSchedule(pierna, folders)).toEqual({ days: [5], time: '06:00' })
    const explicit = routine('c', 7, { days: [5], time: '21:00' }, 'Viernes noche · Calistenia', 'cal')
    expect(effectiveSchedule(explicit, folders)).toEqual({ days: [5], time: '21:00' })
    expect(effectiveSchedule(routine('v', 9, null, 'Vacaciones · Exprés', null), folders)).toBeNull()
    // días explícitos sin hora: la hora sale de la carpeta
    expect(effectiveSchedule(routine('d', 2, { days: [1, 5], time: null }, 'Torso', 'gym'), folders)).toEqual({ days: [1, 5], time: '06:00' })
    // hora en el propio nombre de la rutina gana a la de la carpeta
    expect(effectiveSchedule(routine('x', 1, null, 'Lunes (7:30) · Torso', 'gym'), folders)?.time).toBe('07:30')
  })
  it('a las 6 de la mañana del viernes toca Pierna B antes que la calistenia de las 20', () => {
    const list = [
      routine('c', 7, null, 'Viernes noche · Calistenia: skills + core', 'cal'),
      routine('p', 4, null, 'Viernes · Pierna B: glúteo y cadena posterior', 'gym'),
      routine('l', 0, null, 'Lunes · Torso A', 'gym'),
    ]
    expect(todayRoutines(list, folders, FRI_0610).map((r) => r.id)).toEqual(['p', 'c'])
    expect(todayRoutine(list, folders, FRI_0610)?.id).toBe('p')
    expect(todayRoutine(list, folders, new Date(2026, 8, 25, 19, 0).getTime())?.id).toBe('c')
  })
})
