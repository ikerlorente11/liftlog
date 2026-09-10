// Etiquetas en español para enumeraciones (músculos, equipamiento, tipos de
// ejercicio, tipos de serie, medidas).
import type { Equipment, ExerciseType, MeasurementSource, MuscleGroup, SetType } from '../types'

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  abdominals: 'Abdominales',
  abductors: 'Abductores',
  adductors: 'Aductores',
  biceps: 'Bíceps',
  calves: 'Gemelos',
  cardio: 'Cardio',
  chest: 'Pecho',
  forearms: 'Antebrazos',
  full_body: 'Cuerpo completo',
  glutes: 'Glúteos',
  hamstrings: 'Isquiotibiales',
  lats: 'Dorsales',
  lower_back: 'Lumbar',
  neck: 'Cuello',
  quadriceps: 'Cuádriceps',
  shoulders: 'Hombros',
  traps: 'Trapecio',
  triceps: 'Tríceps',
  upper_back: 'Espalda alta',
  other: 'Otro',
}
export const MUSCLE_GROUPS = Object.keys(MUSCLE_LABEL) as MuscleGroup[]

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  none: 'Ninguno',
  barbell: 'Barra',
  dumbbell: 'Mancuerna',
  kettlebell: 'Kettlebell',
  machine: 'Máquina',
  plate: 'Disco',
  band: 'Banda de resistencia',
  suspension: 'Suspensión',
  other: 'Otro',
}
export const EQUIPMENTS = Object.keys(EQUIPMENT_LABEL) as Equipment[]

export const EXERCISE_TYPE_LABEL: Record<ExerciseType, string> = {
  weight_reps: 'Peso y repeticiones',
  bodyweight_reps: 'Peso corporal',
  weighted_bodyweight: 'Peso corporal con lastre',
  assisted_bodyweight: 'Peso corporal asistido',
  reps_only: 'Solo repeticiones',
  duration: 'Duración',
  distance_duration: 'Distancia y duración',
  weight_duration: 'Peso y duración',
}
export const EXERCISE_TYPES = Object.keys(EXERCISE_TYPE_LABEL) as ExerciseType[]

export const SET_TYPE_LABEL: Record<SetType, string> = {
  normal: 'Serie normal',
  warmup: 'Serie de calentamiento',
  dropset: 'Drop set',
  failure: 'Serie al fallo',
}
export const SET_TYPE_SHORT: Record<SetType, string> = { normal: '', warmup: 'W', dropset: 'D', failure: 'F' }

// Los nombres, grupos y unidades de las medidas son configurables por el
// usuario: viven en src/lib/measurementConfig.ts (y en el store). Aquí solo
// quedan los atributos fijos de las medidas de serie (color y dirección buena).

/** Hacia dónde es "bueno" que se mueva cada medida: pinta la diferencia en
 *  verde o rojo. Peso y perímetros son neutros (depende del objetivo). */
export const MEASUREMENT_GOOD_DIRECTION: Record<string, 'up' | 'down'> = {
  fat_mass: 'down', visceral_fat: 'down',
  muscle_mass: 'up', protein: 'up', body_water: 'up', bone_mineral: 'up', bmr: 'up',
}

/** Color fijo por medida en la pantalla de evolución (mismo código que los
 *  informes de la nutricionista: grasa rojo, músculo naranja, agua azul). */
export const MEASUREMENT_COLOR: Record<string, string> = {
  weight: '#8e8e93', fat_mass: '#ff5c5c', muscle_mass: '#f5a623', protein: '#b86bff',
  body_water: '#3d8bff', bone_mineral: '#c9c9d1', visceral_fat: '#ff8a3d', bmr: '#2ecc71',
}

/** Qué columnas muestra cada tipo de ejercicio en la tabla de series */
export function columnsFor(type: ExerciseType, weightUnit: string, distanceUnit: string): { key: 'weight' | 'reps' | 'distance' | 'duration'; label: string }[] {
  const W = weightUnit.toUpperCase()
  switch (type) {
    case 'weight_reps': return [{ key: 'weight', label: W }, { key: 'reps', label: 'REPS' }]
    case 'weighted_bodyweight': return [{ key: 'weight', label: `+${W}` }, { key: 'reps', label: 'REPS' }]
    case 'assisted_bodyweight': return [{ key: 'weight', label: `-${W}` }, { key: 'reps', label: 'REPS' }]
    case 'bodyweight_reps':
    case 'reps_only': return [{ key: 'reps', label: 'REPS' }]
    case 'duration': return [{ key: 'duration', label: 'TIEMPO' }]
    case 'distance_duration': return [{ key: 'distance', label: distanceUnit.toUpperCase() }, { key: 'duration', label: 'TIEMPO' }]
    case 'weight_duration': return [{ key: 'weight', label: W }, { key: 'duration', label: 'TIEMPO' }]
  }
}
