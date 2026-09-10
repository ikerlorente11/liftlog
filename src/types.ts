// Modelo de dominio de LiftLog. Todo en unidades métricas
// internamente (kg, metros, segundos); la conversión a lb/millas se hace en la UI.

export type ExerciseType =
  | 'weight_reps' // kg × reps
  | 'bodyweight_reps' // solo reps (peso corporal)
  | 'weighted_bodyweight' // +kg × reps (dominadas lastradas)
  | 'assisted_bodyweight' // -kg × reps (asistidas)
  | 'reps_only'
  | 'duration' // segundos
  | 'distance_duration' // metros + segundos
  | 'weight_duration' // kg + segundos (farmer walk)

export type MuscleGroup =
  | 'abdominals' | 'abductors' | 'adductors' | 'biceps' | 'calves' | 'cardio' | 'chest' | 'forearms'
  | 'full_body' | 'glutes' | 'hamstrings' | 'lats' | 'lower_back' | 'neck' | 'quadriceps' | 'shoulders'
  | 'traps' | 'triceps' | 'upper_back' | 'other'

export type Equipment = 'none' | 'barbell' | 'dumbbell' | 'kettlebell' | 'machine' | 'plate' | 'band' | 'suspension' | 'other'

export interface Exercise {
  id: string
  name: string
  nameEs: string
  muscle: MuscleGroup
  secondary: MuscleGroup[]
  equipment: Equipment
  type: ExerciseType
  category?: string
  level?: string
  instructions: string[]
  images: string[] // rutas relativas en free-exercise-db o URIs absolutas para custom
  /** Atribución de la foto cuando la licencia la exige (CC BY / BY-SA); se muestra bajo la imagen. */
  imageCredit?: string
  isCustom?: boolean
}

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure'

export interface SetData {
  id: string
  type: SetType
  weightKg: number | null
  reps: number | null
  distanceM: number | null
  durationS: number | null
  rpe: number | null
  completed: boolean
  isPr?: boolean
}

export interface ExerciseEntry {
  id: string
  exerciseId: string
  notes: string
  restSeconds: number | null // null = usar por defecto
  supersetId: string | null
  sets: SetData[]
  /** Rango de repeticiones (doble progresión): se sube en reps hasta `max` y
   * entonces se sube el peso volviendo a `min`. Solo tiene sentido en rutinas. */
  repRange?: { min: number; max: number } | null
}

export interface Folder {
  id: string
  name: string
  position: number
}

/** Fase de un programa por semanas: bloque, descarga o semana de test. */
export interface ProgramPhase {
  /** Semanas (empezando en 1) en las que aplica la fase */
  weeks: number[]
  /** "Bloque 2", "Descarga", "Semana de test"… */
  label: string
  /** Texto mostrado en el detalle de la rutina durante estas semanas */
  note?: string
  /** Descarga: mitad de series (calentamientos intactos) sobre los objetivos actuales */
  deload?: boolean
  /** Objetivos propios de la fase; si falta se usan los ejercicios de la rutina */
  exercises?: ExerciseEntry[]
}

/** Programa de N semanas asociado a una rutina (p. ej. plan de 24 semanas). */
export interface RoutineProgram {
  totalWeeks: number
  /** Inicio de la semana 1 (timestamp); null = el plan aún no ha empezado */
  startedAt: number | null
  phases: ProgramPhase[]
}

export interface Routine {
  id: string
  name: string
  notes: string
  folderId: string | null
  position: number
  createdAt: number
  updatedAt: number
  exercises: ExerciseEntry[]
  /** Programa por semanas opcional: la semana actual decide los objetivos */
  program?: RoutineProgram | null
}

export interface Workout {
  id: string
  title: string
  notes: string
  startedAt: number
  endedAt: number
  durationS: number
  routineId: string | null
  exercises: ExerciseEntry[]
}

/** Origen de una medida: id de un origen configurable (de serie 'home' =
 * báscula de casa y 'official' = nutricionista; ver src/lib/measurementConfig.ts). */
export type MeasurementSource = string

export interface Measurement {
  id: string
  key: string // weight, fat_mass, muscle_mass, protein, body_water, bone_mineral, visceral_fat, bmr, neck, chest, waist, ...
  value: number
  date: number
  source: MeasurementSource
}

export interface Settings {
  weightUnit: 'kg' | 'lb'
  distanceUnit: 'km' | 'mi'
  theme: 'system' | 'dark' | 'light'
  defaultRestSeconds: number
  restTimerSound: boolean
  restTimerVibrate: boolean
  keepAwake: boolean
  userName: string
  showPreviousValues: boolean
  weekStartsMonday: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  weightUnit: 'kg',
  distanceUnit: 'km',
  theme: 'dark',
  defaultRestSeconds: 90,
  restTimerSound: true,
  restTimerVibrate: true,
  keepAwake: true,
  userName: '',
  showPreviousValues: true,
  weekStartsMonday: true,
}
