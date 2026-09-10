// Estado global de datos persistidos (rutinas, carpetas, entrenos, ejercicios,
// medidas). Cada acción escribe en SQLite y actualiza la caché en memoria.
import { create } from 'zustand'
import * as db from '../db/database'
import { BUNDLED_EXERCISES } from '../lib/exercises'
import { uid } from '../lib/format'
import { startedAtForWeek } from '../lib/program'
import { markPRs } from '../lib/stats'
import { CONFIG_SETTING_KEY, DEFAULT_CONFIG, parseConfig, serializeConfig, type MeasurementConfig } from '../lib/measurementConfig'
import type { Exercise, ExerciseType, Folder, Measurement, MeasurementSource, Routine, Workout } from '../types'

interface DataState {
  ready: boolean
  error: string | null
  exercises: Exercise[]
  exerciseMap: Map<string, Exercise>
  folders: Folder[]
  routines: Routine[]
  workouts: Workout[]
  measurements: Measurement[]
  /** Campos y orígenes de Medidas, editables (ver src/lib/measurementConfig.ts). */
  measurementConfig: MeasurementConfig

  bootstrap: () => Promise<void>
  refreshExercises: () => Promise<void>
  typeOf: (exerciseId: string) => ExerciseType
  getExercise: (id: string) => Exercise | undefined

  saveCustomExercise: (ex: Exercise) => Promise<void>
  deleteCustomExercise: (id: string) => Promise<void>

  createFolder: (name: string) => Promise<Folder>
  renameFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (id: string, deleteRoutines: boolean) => Promise<void>

  saveRoutine: (r: Routine) => Promise<void>
  /** Fija la semana actual del programa de la rutina (ajusta startedAt). */
  setProgramWeek: (routineId: string, week: number, mondayFirst: boolean) => Promise<void>
  deleteRoutine: (id: string) => Promise<void>
  duplicateRoutine: (id: string) => Promise<Routine | null>
  moveRoutine: (id: string, folderId: string | null) => Promise<void>
  reorderRoutines: (ids: string[]) => Promise<void>

  /** Guarda un entreno terminado; marca PRs comparando con el historial. Devuelve nº de PRs. */
  saveWorkout: (w: Workout) => Promise<number>
  updateWorkout: (w: Workout) => Promise<void>
  deleteWorkout: (id: string) => Promise<void>

  addMeasurement: (key: string, value: number, date?: number, source?: MeasurementSource) => Promise<void>
  deleteMeasurement: (id: string) => Promise<void>
  setMeasurementConfig: (cfg: MeasurementConfig) => Promise<void>

  importBackup: (data: db.BackupData, mode: 'merge' | 'replace') => Promise<db.ImportResult>
  wipeAll: () => Promise<void>
}

function buildMap(list: Exercise[]): Map<string, Exercise> {
  return new Map(list.map((e) => [e.id, e]))
}

export const useData = create<DataState>((set, get) => ({
  ready: false,
  error: null,
  exercises: BUNDLED_EXERCISES,
  exerciseMap: buildMap(BUNDLED_EXERCISES),
  folders: [],
  routines: [],
  workouts: [],
  measurements: [],
  measurementConfig: DEFAULT_CONFIG,

  bootstrap: async () => {
    try {
      const [custom, folders, routines, workouts, measurements, cfgRaw] = await Promise.all([
        db.listCustomExercises(), db.listFolders(), db.listRoutines(), db.listWorkouts(), db.listMeasurements(), db.getSetting(CONFIG_SETTING_KEY),
      ])
      const exercises = [...BUNDLED_EXERCISES, ...custom]
      set({ exercises, exerciseMap: buildMap(exercises), folders, routines, workouts, measurements, measurementConfig: parseConfig(cfgRaw), ready: true, error: null })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), ready: true })
    }
  },

  refreshExercises: async () => {
    const custom = await db.listCustomExercises()
    const exercises = [...BUNDLED_EXERCISES, ...custom]
    set({ exercises, exerciseMap: buildMap(exercises) })
  },

  typeOf: (id) => get().exerciseMap.get(id)?.type ?? 'weight_reps',
  getExercise: (id) => get().exerciseMap.get(id),

  saveCustomExercise: async (ex) => {
    await db.saveCustomExercise(ex)
    await get().refreshExercises()
  },
  deleteCustomExercise: async (id) => {
    await db.deleteCustomExercise(id)
    await get().refreshExercises()
  },

  createFolder: async (name) => {
    const f: Folder = { id: uid(), name, position: get().folders.length }
    await db.saveFolder(f)
    set({ folders: [...get().folders, f] })
    return f
  },
  renameFolder: async (id, name) => {
    const f = get().folders.find((x) => x.id === id)
    if (!f) return
    const nf = { ...f, name }
    await db.saveFolder(nf)
    set({ folders: get().folders.map((x) => (x.id === id ? nf : x)) })
  },
  deleteFolder: async (id, deleteRoutines) => {
    await db.deleteFolder(id, deleteRoutines)
    set({
      folders: get().folders.filter((f) => f.id !== id),
      routines: deleteRoutines ? get().routines.filter((r) => r.folderId !== id) : get().routines.map((r) => (r.folderId === id ? { ...r, folderId: null } : r)),
    })
  },

  saveRoutine: async (r) => {
    await db.saveRoutine(r)
    const exists = get().routines.some((x) => x.id === r.id)
    set({ routines: exists ? get().routines.map((x) => (x.id === r.id ? r : x)) : [...get().routines, r] })
  },
  setProgramWeek: async (routineId, week, mondayFirst) => {
    const r = get().routines.find((x) => x.id === routineId)
    if (!r?.program) return
    const w = Math.min(Math.max(1, week), r.program.totalWeeks)
    await get().saveRoutine({ ...r, program: { ...r.program, startedAt: startedAtForWeek(w, Date.now(), mondayFirst) }, updatedAt: Date.now() })
  },
  deleteRoutine: async (id) => {
    await db.deleteRoutine(id)
    set({ routines: get().routines.filter((r) => r.id !== id) })
  },
  duplicateRoutine: async (id) => {
    const r = get().routines.find((x) => x.id === id)
    if (!r) return null
    const now = Date.now()
    const copy: Routine = {
      ...r, id: uid(), name: `${r.name} (copia)`, createdAt: now, updatedAt: now, position: get().routines.length,
      exercises: r.exercises.map((e) => ({ ...e, id: uid(), sets: e.sets.map((s) => ({ ...s, id: uid() })) })),
    }
    await get().saveRoutine(copy)
    return copy
  },
  moveRoutine: async (id, folderId) => {
    await db.updateRoutineMeta(id, { folderId })
    set({ routines: get().routines.map((r) => (r.id === id ? { ...r, folderId } : r)) })
  },
  reorderRoutines: async (ids) => {
    const pos = new Map(ids.map((id, i) => [id, i]))
    for (const [id, p] of pos) await db.updateRoutineMeta(id, { position: p })
    set({ routines: get().routines.map((r) => (pos.has(r.id) ? { ...r, position: pos.get(r.id)! } : r)).sort((a, b) => a.position - b.position) })
  },

  saveWorkout: async (w) => {
    const previous = get().workouts.filter((x) => x.id !== w.id && x.startedAt < w.startedAt)
    const prs = markPRs(w, previous, get().typeOf)
    await db.saveWorkout(w)
    // La lista de entrenos se actualiza un poco después: repintar el historial y
    // las estadísticas (montados debajo) tardaba más que el propio guardado y
    // retrasaba la pantalla de "Entreno guardado" (con 0 ms React lo metía en el
    // mismo repintado). El entreno ya está en disco.
    setTimeout(() => set({ workouts: [w, ...get().workouts.filter((x) => x.id !== w.id)].sort((a, b) => b.startedAt - a.startedAt) }), 300)
    return prs
  },
  updateWorkout: async (w) => {
    const previous = get().workouts.filter((x) => x.id !== w.id && x.startedAt < w.startedAt)
    markPRs(w, previous, get().typeOf)
    await db.saveWorkout(w)
    set({ workouts: get().workouts.map((x) => (x.id === w.id ? w : x)).sort((a, b) => b.startedAt - a.startedAt) })
  },
  deleteWorkout: async (id) => {
    await db.deleteWorkout(id)
    set({ workouts: get().workouts.filter((w) => w.id !== id) })
  },

  addMeasurement: async (key, value, date = Date.now(), source = 'home') => {
    const m: Measurement = { id: uid(), key, value, date, source }
    await db.saveMeasurement(m)
    set({ measurements: [m, ...get().measurements].sort((a, b) => b.date - a.date) })
  },
  deleteMeasurement: async (id) => {
    await db.deleteMeasurement(id)
    set({ measurements: get().measurements.filter((m) => m.id !== id) })
  },
  setMeasurementConfig: async (cfg) => {
    set({ measurementConfig: cfg })
    await db.setSetting(CONFIG_SETTING_KEY, serializeConfig(cfg))
  },

  importBackup: async (data, mode) => {
    const res = await db.importAll(data, mode)
    await get().bootstrap()
    return res
  },
  wipeAll: async () => {
    await db.wipeAll()
    await get().bootstrap()
  },
}))
