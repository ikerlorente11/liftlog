// Catálogo de ejercicios: bundle (free-exercise-db, dominio público) + custom.
import bundled from '../data/exercises.json'
import privateImages from '../data/private-images.json'
import type { Exercise, ExerciseType } from '../types'

export const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

// Fotos que no pueden ir en el repo público (licencias de uso privado, ver
// docs/creditos-imagenes.md): en el repo este JSON está vacío; cada desarrollador
// puede rellenarlo en local (id → images[]) y git lo ignora con skip-worktree.
const PRIVATE_IMAGES = privateImages as Record<string, string[]>
export const BUNDLED_EXERCISES: Exercise[] = (bundled as Exercise[]).map((e) => ({
  ...e,
  images: PRIVATE_IMAGES[e.id]?.length ? PRIVATE_IMAGES[e.id] : e.images,
  isCustom: false,
}))

export function imageUri(ex: Exercise | undefined, index = 0): string | null {
  if (!ex || !ex.images?.length) return null
  const img = ex.images[Math.min(index, ex.images.length - 1)]
  if (/^(https?:|file:|content:|data:)/.test(img)) return img
  return IMAGE_BASE + img
}

/** Enlace de vídeo demostrativo (búsqueda en YouTube). Sin vídeos propios: se abre una búsqueda en YouTube. */
export function videoSearchUrl(ex: Exercise): string {
  const q = encodeURIComponent(`${ex.name} exercise form`)
  return `https://www.youtube.com/results?search_query=${q}`
}

export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// Claves precalculadas: normalizar (NFD) o usar Intl en cada render es muy lento en Hermes.
const keyCache = new Map<string, { name: string; search: string; sort: string }>()
export function keysOf(ex: Exercise): { search: string; sort: string } {
  let k = keyCache.get(ex.id)
  if (!k || k.name !== ex.nameEs) {
    k = { name: ex.nameEs, search: normalize(`${ex.nameEs} ${ex.name}`), sort: normalize(ex.nameEs) }
    keyCache.set(ex.id, k)
  }
  return k
}

/** Orden alfabético barato (sin Intl) por la clave normalizada. */
export function compareByName(a: Exercise, b: Exercise): number {
  const ka = keysOf(a).sort, kb = keysOf(b).sort
  return ka < kb ? -1 : ka > kb ? 1 : 0
}

export function matchesQuery(ex: Exercise, q: string): boolean {
  if (!q) return true
  const words = normalize(q).split(/\s+/).filter(Boolean)
  const hay = keysOf(ex).search
  return words.every((w) => hay.includes(w))
}

export function displayName(ex: Exercise | undefined, fallbackId?: string): string {
  if (!ex) return fallbackId ?? 'Ejercicio'
  return ex.nameEs || ex.name
}

export function typeOfExercise(map: Map<string, Exercise>, id: string): ExerciseType {
  return map.get(id)?.type ?? 'weight_reps'
}
