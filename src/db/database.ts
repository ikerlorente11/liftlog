// Persistencia local (expo-sqlite). Esquema: carpetas, rutinas, entrenos,
// series, ejercicios custom, medidas y ajustes. Toda lectura devuelve objetos
// del dominio ya montados (rutina con ejercicios y series).
import * as SQLite from 'expo-sqlite'
import type { Exercise, ExerciseEntry, Folder, Measurement, Routine, SetData, Workout } from '../types'
import { uid } from '../lib/format'

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('liftlog.db')
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS custom_exercises (id TEXT PRIMARY KEY, json TEXT NOT NULL, created_at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS folders (id TEXT PRIMARY KEY, name TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS routines (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', folder_id TEXT,
          position INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
          program TEXT
        );
        CREATE TABLE IF NOT EXISTS routine_exercises (
          id TEXT PRIMARY KEY, routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
          exercise_id TEXT NOT NULL, position INTEGER NOT NULL, notes TEXT NOT NULL DEFAULT '',
          rest_seconds INTEGER, superset_id TEXT
        );
        CREATE TABLE IF NOT EXISTS routine_sets (
          id TEXT PRIMARY KEY, routine_exercise_id TEXT NOT NULL REFERENCES routine_exercises(id) ON DELETE CASCADE,
          position INTEGER NOT NULL, type TEXT NOT NULL DEFAULT 'normal',
          weight_kg REAL, reps INTEGER, distance_m REAL, duration_s INTEGER
        );
        CREATE TABLE IF NOT EXISTS workouts (
          id TEXT PRIMARY KEY, title TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '',
          started_at INTEGER NOT NULL, ended_at INTEGER NOT NULL, duration_s INTEGER NOT NULL, routine_id TEXT
        );
        CREATE TABLE IF NOT EXISTS workout_exercises (
          id TEXT PRIMARY KEY, workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
          exercise_id TEXT NOT NULL, position INTEGER NOT NULL, notes TEXT NOT NULL DEFAULT '',
          rest_seconds INTEGER, superset_id TEXT
        );
        CREATE TABLE IF NOT EXISTS workout_sets (
          id TEXT PRIMARY KEY, workout_exercise_id TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
          position INTEGER NOT NULL, type TEXT NOT NULL DEFAULT 'normal',
          weight_kg REAL, reps INTEGER, distance_m REAL, duration_s INTEGER, rpe REAL,
          completed INTEGER NOT NULL DEFAULT 1, is_pr INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS measurements (id TEXT PRIMARY KEY, key TEXT NOT NULL, value REAL NOT NULL, date INTEGER NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_we_workout ON workout_exercises(workout_id);
        CREATE INDEX IF NOT EXISTS idx_we_exercise ON workout_exercises(exercise_id);
        CREATE INDEX IF NOT EXISTS idx_ws_we ON workout_sets(workout_exercise_id);
        CREATE INDEX IF NOT EXISTS idx_re_routine ON routine_exercises(routine_id);
        CREATE INDEX IF NOT EXISTS idx_rs_re ON routine_sets(routine_exercise_id);
        CREATE INDEX IF NOT EXISTS idx_workouts_started ON workouts(started_at);
      `)
      // Migración v1.1: programas por semanas en rutinas (bases anteriores a la columna)
      try { await db.execAsync('ALTER TABLE routines ADD COLUMN program TEXT') } catch { /* ya existe */ }
      // Migración v1.2: origen de las medidas (báscula de casa vs nutricionista)
      try { await db.execAsync("ALTER TABLE measurements ADD COLUMN source TEXT NOT NULL DEFAULT 'home'") } catch { /* ya existe */ }
      // Migración v1.4: rango de reps por ejercicio de rutina (doble progresión)
      try { await db.execAsync('ALTER TABLE routine_exercises ADD COLUMN rep_min INTEGER') } catch { /* ya existe */ }
      try { await db.execAsync('ALTER TABLE routine_exercises ADD COLUMN rep_max INTEGER') } catch { /* ya existe */ }
      // Migración v1.5: la grasa corporal en % (body_fat) pasa a kg (fat_mass)
      await convertBodyFatRows(db)
      return db
    })()
  }
  return dbPromise
}

/**
 * "Grasa corporal (%)" y "Masa grasa" eran la misma medida con distinta unidad
 * (decisión del 9/09/2026). Queda solo `fat_mass` en kg: cada fila `body_fat` se
 * convierte con el peso del mismo origen a ±3 días y se borra; si no hay peso
 * comparable se queda (invisible) hasta que lo haya. Se ejecuta al abrir la
 * base y tras cada importación, porque las copias antiguas aún traen body_fat.
 */
export async function convertBodyFatRows(db: SQLite.SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<{ id: string; value: number; date: number; source: string }>("SELECT id, value, date, source FROM measurements WHERE key = 'body_fat'")
  if (!rows.length) return
  const weights = await db.getAllAsync<{ value: number; date: number; source: string }>("SELECT value, date, source FROM measurements WHERE key = 'weight'")
  const TOL = 3 * 86_400_000
  for (const r of rows) {
    let best: { value: number; gap: number } | null = null
    for (const w of weights) {
      if (w.source !== r.source) continue
      const gap = Math.abs(w.date - r.date)
      if (gap <= TOL && (!best || gap < best.gap)) best = { value: w.value, gap }
    }
    if (!best) continue
    const dup = await db.getFirstAsync<{ id: string }>("SELECT id FROM measurements WHERE key = 'fat_mass' AND source = ? AND abs(date - ?) < 43200000", r.source, r.date)
    if (!dup) {
      const kg = Math.round((r.value / 100) * best.value * 10) / 10
      await db.runAsync('INSERT OR REPLACE INTO measurements (id, key, value, date, source) VALUES (?, ?, ?, ?, ?)', `${r.id}_kg`, 'fat_mass', kg, r.date, r.source)
    }
    await db.runAsync('DELETE FROM measurements WHERE id = ?', r.id)
  }
}

// ---------- settings ----------
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb()
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)
  return row?.value ?? null
}
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb()
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value)
}

// ---------- ejercicios custom ----------
export async function listCustomExercises(): Promise<Exercise[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<{ json: string }>('SELECT json FROM custom_exercises ORDER BY created_at')
  return rows.map((r) => ({ ...(JSON.parse(r.json) as Exercise), isCustom: true }))
}
export async function saveCustomExercise(ex: Exercise): Promise<void> {
  const db = await getDb()
  await db.runAsync('INSERT OR REPLACE INTO custom_exercises (id, json, created_at) VALUES (?, ?, ?)', ex.id, JSON.stringify({ ...ex, isCustom: true }), Date.now())
}
export async function deleteCustomExercise(id: string): Promise<void> {
  const db = await getDb()
  await db.runAsync('DELETE FROM custom_exercises WHERE id = ?', id)
}

// ---------- carpetas ----------
export async function listFolders(): Promise<Folder[]> {
  const db = await getDb()
  return db.getAllAsync<Folder>('SELECT id, name, position FROM folders ORDER BY position, name')
}
export async function saveFolder(f: Folder): Promise<void> {
  const db = await getDb()
  await db.runAsync('INSERT OR REPLACE INTO folders (id, name, position) VALUES (?, ?, ?)', f.id, f.name, f.position)
}
export async function deleteFolder(id: string, deleteRoutines: boolean): Promise<void> {
  const db = await getDb()
  if (deleteRoutines) await db.runAsync('DELETE FROM routines WHERE folder_id = ?', id)
  else await db.runAsync('UPDATE routines SET folder_id = NULL WHERE folder_id = ?', id)
  await db.runAsync('DELETE FROM folders WHERE id = ?', id)
}

// ---------- rutinas ----------
interface EntryRow { id: string; parent_id: string; exercise_id: string; position: number; notes: string; rest_seconds: number | null; superset_id: string | null; rep_min?: number | null; rep_max?: number | null }
interface SetRow { id: string; parent_id: string; position: number; type: SetData['type']; weight_kg: number | null; reps: number | null; distance_m: number | null; duration_s: number | null; rpe?: number | null; completed?: number; is_pr?: number }

async function loadEntries(table: 'routine' | 'workout', parentIds: string[]): Promise<Map<string, ExerciseEntry[]>> {
  const map = new Map<string, ExerciseEntry[]>()
  if (!parentIds.length) return map
  const db = await getDb()
  const ph = parentIds.map(() => '?').join(',')
  const parentCol = table === 'routine' ? 'routine_id' : 'workout_id'
  const entries = await db.getAllAsync<EntryRow>(
    `SELECT id, ${parentCol} as parent_id, exercise_id, position, notes, rest_seconds, superset_id${table === 'routine' ? ', rep_min, rep_max' : ''} FROM ${table}_exercises WHERE ${parentCol} IN (${ph}) ORDER BY position`,
    ...parentIds,
  )
  const entryIds = entries.map((e) => e.id)
  const sets: SetRow[] = []
  // troceamos para no superar el límite de variables de SQLite
  for (let i = 0; i < entryIds.length; i += 400) {
    const chunk = entryIds.slice(i, i + 400)
    const ph2 = chunk.map(() => '?').join(',')
    const cols = table === 'routine' ? 'weight_kg, reps, distance_m, duration_s' : 'weight_kg, reps, distance_m, duration_s, rpe, completed, is_pr'
    sets.push(...(await db.getAllAsync<SetRow>(`SELECT id, ${table}_exercise_id as parent_id, position, type, ${cols} FROM ${table}_sets WHERE ${table}_exercise_id IN (${ph2}) ORDER BY position`, ...chunk)))
  }
  const setsByEntry = new Map<string, SetData[]>()
  for (const s of sets) {
    const arr = setsByEntry.get(s.parent_id) ?? []
    arr.push({
      id: s.id, type: s.type ?? 'normal', weightKg: s.weight_kg, reps: s.reps, distanceM: s.distance_m, durationS: s.duration_s,
      rpe: s.rpe ?? null, completed: table === 'routine' ? false : (s.completed ?? 1) === 1, isPr: (s.is_pr ?? 0) === 1,
    })
    setsByEntry.set(s.parent_id, arr)
  }
  for (const e of entries) {
    const arr = map.get(e.parent_id) ?? []
    arr.push({ id: e.id, exerciseId: e.exercise_id, notes: e.notes ?? '', restSeconds: e.rest_seconds, supersetId: e.superset_id, sets: setsByEntry.get(e.id) ?? [], ...(e.rep_min != null && e.rep_max != null ? { repRange: { min: e.rep_min, max: e.rep_max } } : {}) })
    map.set(e.parent_id, arr)
  }
  return map
}

interface RoutineRow { id: string; name: string; notes: string; folder_id: string | null; position: number; created_at: number; updated_at: number; program: string | null }

function parseProgram(json: string | null): Routine['program'] {
  if (!json) return null
  try { return JSON.parse(json) as Routine['program'] } catch { return null }
}

export async function listRoutines(): Promise<Routine[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<RoutineRow>('SELECT * FROM routines ORDER BY position, created_at')
  const entries = await loadEntries('routine', rows.map((r) => r.id))
  return rows.map((r) => ({ id: r.id, name: r.name, notes: r.notes, folderId: r.folder_id, position: r.position, createdAt: r.created_at, updatedAt: r.updated_at, exercises: entries.get(r.id) ?? [], program: parseProgram(r.program) }))
}

export async function getRoutine(id: string): Promise<Routine | null> {
  const db = await getDb()
  const r = await db.getFirstAsync<RoutineRow>('SELECT * FROM routines WHERE id = ?', id)
  if (!r) return null
  const entries = await loadEntries('routine', [id])
  return { id: r.id, name: r.name, notes: r.notes, folderId: r.folder_id, position: r.position, createdAt: r.created_at, updatedAt: r.updated_at, exercises: entries.get(id) ?? [], program: parseProgram(r.program) }
}

export async function saveRoutine(r: Routine): Promise<void> {
  const db = await getDb()
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT OR REPLACE INTO routines (id, name, notes, folder_id, position, created_at, updated_at, program) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      r.id, r.name, r.notes ?? '', r.folderId, r.position, r.createdAt, r.updatedAt, r.program ? JSON.stringify(r.program) : null,
    )
    await db.runAsync('DELETE FROM routine_exercises WHERE routine_id = ?', r.id)
    for (let i = 0; i < r.exercises.length; i++) {
      const e = r.exercises[i]
      await db.runAsync(
        'INSERT INTO routine_exercises (id, routine_id, exercise_id, position, notes, rest_seconds, superset_id, rep_min, rep_max) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        e.id, r.id, e.exerciseId, i, e.notes ?? '', e.restSeconds, e.supersetId, e.repRange?.min ?? null, e.repRange?.max ?? null,
      )
      for (let j = 0; j < e.sets.length; j++) {
        const s = e.sets[j]
        await db.runAsync(
          'INSERT INTO routine_sets (id, routine_exercise_id, position, type, weight_kg, reps, distance_m, duration_s) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          s.id, e.id, j, s.type, s.weightKg, s.reps, s.distanceM, s.durationS,
        )
      }
    }
  })
}

export async function deleteRoutine(id: string): Promise<void> {
  const db = await getDb()
  await db.runAsync('DELETE FROM routines WHERE id = ?', id)
}

export async function updateRoutineMeta(id: string, patch: { folderId?: string | null; position?: number; name?: string }): Promise<void> {
  const db = await getDb()
  if (patch.folderId !== undefined) await db.runAsync('UPDATE routines SET folder_id = ?, updated_at = ? WHERE id = ?', patch.folderId, Date.now(), id)
  if (patch.position !== undefined) await db.runAsync('UPDATE routines SET position = ? WHERE id = ?', patch.position, id)
  if (patch.name !== undefined) await db.runAsync('UPDATE routines SET name = ?, updated_at = ? WHERE id = ?', patch.name, Date.now(), id)
}

// ---------- entrenos ----------
interface WorkoutRow { id: string; title: string; notes: string; started_at: number; ended_at: number; duration_s: number; routine_id: string | null }

export async function listWorkouts(): Promise<Workout[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<WorkoutRow>('SELECT * FROM workouts ORDER BY started_at DESC')
  const entries = await loadEntries('workout', rows.map((r) => r.id))
  return rows.map((r) => ({ id: r.id, title: r.title, notes: r.notes, startedAt: r.started_at, endedAt: r.ended_at, durationS: r.duration_s, routineId: r.routine_id, exercises: entries.get(r.id) ?? [] }))
}

export async function saveWorkout(w: Workout): Promise<void> {
  const db = await getDb()
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT OR REPLACE INTO workouts (id, title, notes, started_at, ended_at, duration_s, routine_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      w.id, w.title, w.notes ?? '', w.startedAt, w.endedAt, w.durationS, w.routineId,
    )
    await db.runAsync('DELETE FROM workout_exercises WHERE workout_id = ?', w.id)
    for (let i = 0; i < w.exercises.length; i++) {
      const e = w.exercises[i]
      await db.runAsync(
        'INSERT INTO workout_exercises (id, workout_id, exercise_id, position, notes, rest_seconds, superset_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        e.id, w.id, e.exerciseId, i, e.notes ?? '', e.restSeconds, e.supersetId,
      )
      for (let j = 0; j < e.sets.length; j++) {
        const s = e.sets[j]
        await db.runAsync(
          'INSERT INTO workout_sets (id, workout_exercise_id, position, type, weight_kg, reps, distance_m, duration_s, rpe, completed, is_pr) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          s.id, e.id, j, s.type, s.weightKg, s.reps, s.distanceM, s.durationS, s.rpe, s.completed ? 1 : 0, s.isPr ? 1 : 0,
        )
      }
    }
  })
}

export async function deleteWorkout(id: string): Promise<void> {
  const db = await getDb()
  await db.runAsync('DELETE FROM workouts WHERE id = ?', id)
}

// ---------- medidas ----------
export async function listMeasurements(): Promise<Measurement[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<Measurement>('SELECT id, key, value, date, source FROM measurements ORDER BY date DESC')
  return rows.map((m) => ({ ...m, source: m.source ?? 'home' }))
}
export async function saveMeasurement(m: Measurement): Promise<void> {
  const db = await getDb()
  await db.runAsync('INSERT OR REPLACE INTO measurements (id, key, value, date, source) VALUES (?, ?, ?, ?, ?)', m.id, m.key, m.value, m.date, m.source ?? 'home')
}
export async function deleteMeasurement(id: string): Promise<void> {
  const db = await getDb()
  await db.runAsync('DELETE FROM measurements WHERE id = ?', id)
}

// ---------- backup ----------
export interface BackupData {
  version: 1
  exportedAt: number
  folders: Folder[]
  routines: Routine[]
  workouts: Workout[]
  customExercises: Exercise[]
  measurements: Measurement[]
  settings: Record<string, string>
}

export async function exportAll(): Promise<BackupData> {
  const db = await getDb()
  const settingsRows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings')
  return {
    version: 1,
    exportedAt: Date.now(),
    folders: await listFolders(),
    routines: await listRoutines(),
    workouts: await listWorkouts(),
    customExercises: await listCustomExercises(),
    measurements: await listMeasurements(),
    settings: Object.fromEntries(settingsRows.map((r) => [r.key, r.value])),
  }
}

export interface ImportResult {
  /** Rutinas del archivo que NO se han importado porque el móvil tenía una versión más reciente */
  keptNewer: string[]
}

export async function importAll(data: BackupData, mode: 'merge' | 'replace'): Promise<ImportResult> {
  const db = await getDb()
  if (mode === 'replace') {
    await db.execAsync('DELETE FROM workouts; DELETE FROM routines; DELETE FROM folders; DELETE FROM custom_exercises; DELETE FROM measurements;')
  }
  const keptNewer: string[] = []
  for (const f of data.folders ?? []) await saveFolder(f)
  for (const e of data.customExercises ?? []) await saveCustomExercise(e)
  for (const r of data.routines ?? []) {
    let routine = r
    if (mode === 'merge') {
      const prev = await getRoutine(r.id)
      // Fusionar no pisa lo que se ha cambiado en el móvil después de generar el
      // archivo (p. ej. "Actualizar rutina" o una subida al acabar un entreno):
      // si la rutina local es más reciente que la del archivo, se conserva.
      if (prev && prev.updatedAt > (r.updatedAt ?? 0)) { keptNewer.push(prev.name); continue }
      // ...ni deshace el arranque del programa: un backup de plan (p. ej. el del
      // repo) trae startedAt null y, sin esto, la rutina quedaba "sin empezar".
      if (r.program && r.program.startedAt == null && prev?.program?.startedAt != null) {
        routine = { ...r, program: { ...r.program, startedAt: prev.program.startedAt } }
      }
    }
    await saveRoutine(routine)
  }
  for (const w of data.workouts ?? []) await saveWorkout(w)
  for (const m of data.measurements ?? []) await saveMeasurement(m)
  for (const [k, v] of Object.entries(data.settings ?? {})) await setSetting(k, v)
  await convertBodyFatRows(db)
  return { keptNewer }
}

export async function wipeAll(): Promise<void> {
  const db = await getDb()
  await db.execAsync('DELETE FROM workouts; DELETE FROM routines; DELETE FROM folders; DELETE FROM custom_exercises; DELETE FROM measurements; DELETE FROM settings;')
}

export { uid }
