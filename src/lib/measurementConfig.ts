// Configuración de la pantalla de Medidas, editable por el usuario:
//
//  - Campos: composición corporal (báscula / bioimpedancia) y perímetros
//    (cinta métrica). Se pueden añadir, renombrar, ordenar y quitar.
//  - Orígenes: quién tomó la medida (por defecto "Báscula de casa" y
//    "Nutricionista"), cada uno con su nombre y color. También editables.
//
// Se guarda en la tabla `settings` de SQLite (clave `measurement_config`) para
// que viaje con la copia de seguridad. Quitar un campo u origen que ya tiene
// medidas NO borra nada: queda `hidden` y se puede recuperar; solo desaparece
// del todo si no tiene ninguna medida.
import type { Measurement } from '../types'

export const CONFIG_SETTING_KEY = 'measurement_config'

export type FieldGroup = 'composition' | 'perimeter'
/** 'kg' = masa: se guarda en kg y se muestra en la unidad de peso elegida. */
export type FieldUnit = 'kg' | 'cm' | '%' | 'kcal' | 'nivel' | (string & {})

export interface MeasurementField {
  key: string
  label: string
  group: FieldGroup
  unit: FieldUnit
  hidden?: boolean
}

export interface MeasurementSourceDef {
  id: string
  label: string
  color: string
  hidden?: boolean
}

export interface MeasurementConfig {
  fields: MeasurementField[]
  sources: MeasurementSourceDef[]
}

/** El peso es la base para calcular los % de composición: no se puede quitar. */
export const LOCKED_FIELD_KEYS = new Set(['weight'])

export const DEFAULT_FIELDS: MeasurementField[] = [
  { key: 'weight', label: 'Peso corporal', group: 'composition', unit: 'kg' },
  { key: 'fat_mass', label: 'Grasa corporal', group: 'composition', unit: 'kg' },
  { key: 'muscle_mass', label: 'Masa muscular', group: 'composition', unit: 'kg' },
  { key: 'protein', label: 'Proteínas', group: 'composition', unit: 'kg' },
  { key: 'body_water', label: 'Agua corporal', group: 'composition', unit: 'kg' },
  { key: 'bone_mineral', label: 'Mineral óseo', group: 'composition', unit: 'kg' },
  { key: 'visceral_fat', label: 'Grasa visceral (índice)', group: 'composition', unit: 'nivel' },
  { key: 'bmr', label: 'Metabolismo basal', group: 'composition', unit: 'kcal' },
  { key: 'neck', label: 'Cuello', group: 'perimeter', unit: 'cm' },
  { key: 'shoulders', label: 'Hombros', group: 'perimeter', unit: 'cm' },
  { key: 'chest', label: 'Pecho', group: 'perimeter', unit: 'cm' },
  { key: 'left_bicep', label: 'Bíceps izquierdo', group: 'perimeter', unit: 'cm' },
  { key: 'right_bicep', label: 'Bíceps derecho', group: 'perimeter', unit: 'cm' },
  { key: 'left_forearm', label: 'Antebrazo izquierdo', group: 'perimeter', unit: 'cm' },
  { key: 'right_forearm', label: 'Antebrazo derecho', group: 'perimeter', unit: 'cm' },
  { key: 'waist', label: 'Cintura', group: 'perimeter', unit: 'cm' },
  { key: 'abdomen', label: 'Abdomen', group: 'perimeter', unit: 'cm' },
  { key: 'hips', label: 'Cadera', group: 'perimeter', unit: 'cm' },
  { key: 'glutes', label: 'Glúteo', group: 'perimeter', unit: 'cm' },
  { key: 'left_thigh', label: 'Muslo izquierdo', group: 'perimeter', unit: 'cm' },
  { key: 'right_thigh', label: 'Muslo derecho', group: 'perimeter', unit: 'cm' },
  { key: 'left_calf', label: 'Gemelo izquierdo', group: 'perimeter', unit: 'cm' },
  { key: 'right_calf', label: 'Gemelo derecho', group: 'perimeter', unit: 'cm' },
]

/** Colores que se ofrecen para los orígenes (y por defecto para los dos de serie). */
export const SOURCE_PALETTE = ['#3d8bff', '#f5a623', '#2ecc71', '#ff5c5c', '#b86bff', '#22c1c3', '#ff7ab6', '#c9c9d1', '#a3d900', '#ff8a3d']

export const DEFAULT_SOURCES: MeasurementSourceDef[] = [
  { id: 'home', label: 'Báscula de casa', color: '#3d8bff' },
  { id: 'official', label: 'Nutricionista', color: '#f5a623' },
]

export const DEFAULT_CONFIG: MeasurementConfig = { fields: DEFAULT_FIELDS, sources: DEFAULT_SOURCES }

export const GROUP_INFO: Record<FieldGroup, { label: string; hint: string }> = {
  composition: { label: 'Composición corporal', hint: 'Báscula y bioimpedancia' },
  perimeter: { label: 'Perímetros', hint: 'Cinta métrica, en cm' },
}

/** Unidades que se ofrecen al crear un campo nuevo. */
export const UNIT_OPTIONS: { value: FieldUnit; label: string; sub: string }[] = [
  { value: 'kg', label: 'Masa (kg / lb)', sub: 'En composición se muestra también como % del peso' },
  { value: 'cm', label: 'cm', sub: 'Perímetros con cinta métrica' },
  { value: '%', label: '%', sub: 'Porcentaje tal cual' },
  { value: 'kcal', label: 'kcal', sub: 'Energía' },
  { value: 'nivel', label: 'Nivel / índice', sub: 'Número sin unidad' },
]

const normalize = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const slug = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

// ---------- lectura / escritura ----------

export function parseConfig(raw: string | null | undefined): MeasurementConfig {
  if (!raw) return DEFAULT_CONFIG
  try {
    const obj = JSON.parse(raw)
    const fields: MeasurementField[] = []
    for (const f of Array.isArray(obj?.fields) ? obj.fields : []) {
      if (!f || typeof f.key !== 'string' || !f.key || typeof f.label !== 'string' || !f.label.trim()) continue
      if (fields.some((o) => o.key === f.key)) continue
      const group: FieldGroup = f.group === 'perimeter' ? 'perimeter' : 'composition'
      const unit: FieldUnit = typeof f.unit === 'string' && f.unit ? f.unit : group === 'perimeter' ? 'cm' : 'kg'
      fields.push({ key: f.key, label: f.label.trim(), group, unit, ...(f.hidden ? { hidden: true } : {}) })
    }
    const sources: MeasurementSourceDef[] = []
    for (const s of Array.isArray(obj?.sources) ? obj.sources : []) {
      if (!s || typeof s.id !== 'string' || !s.id || typeof s.label !== 'string' || !s.label.trim()) continue
      if (sources.some((o) => o.id === s.id)) continue
      const color = typeof s.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(s.color) ? s.color : SOURCE_PALETTE[sources.length % SOURCE_PALETTE.length]
      sources.push({ id: s.id, label: s.label.trim(), color, ...(s.hidden ? { hidden: true } : {}) })
    }
    // El peso siempre existe: si alguien lo quitó del JSON a mano, vuelve.
    if (!fields.some((f) => f.key === 'weight')) fields.unshift(DEFAULT_FIELDS[0])
    return {
      fields: fields.length > 1 ? fields : DEFAULT_FIELDS,
      sources: sources.length ? sources : DEFAULT_SOURCES,
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

export const serializeConfig = (cfg: MeasurementConfig) => JSON.stringify(cfg)

// ---------- consultas ----------

export const fieldOf = (cfg: MeasurementConfig, key: string): MeasurementField | undefined => cfg.fields.find((f) => f.key === key)
export const fieldLabel = (cfg: MeasurementConfig, key: string): string => fieldOf(cfg, key)?.label ?? key
export const visibleFields = (cfg: MeasurementConfig, group?: FieldGroup) => cfg.fields.filter((f) => !f.hidden && (!group || f.group === group))
export const hiddenFields = (cfg: MeasurementConfig) => cfg.fields.filter((f) => f.hidden)

export const sourceOf = (cfg: MeasurementConfig, id: string): MeasurementSourceDef | undefined => cfg.sources.find((s) => s.id === id)
export const sourceLabel = (cfg: MeasurementConfig, id: string): string => sourceOf(cfg, id)?.label ?? id
export const sourceColor = (cfg: MeasurementConfig, id: string): string => sourceOf(cfg, id)?.color ?? '#8e8e93'
export const visibleSources = (cfg: MeasurementConfig) => cfg.sources.filter((s) => !s.hidden)
export const hiddenSources = (cfg: MeasurementConfig) => cfg.sources.filter((s) => s.hidden)

/** Es una masa (se guarda en kg, se enseña en kg o lb). */
export const isMassField = (cfg: MeasurementConfig, key: string) => fieldOf(cfg, key)?.unit === 'kg'
/** Se muestra como "% (kg)": masas de composición distintas del propio peso. */
export const isPercentOfWeightField = (cfg: MeasurementConfig, key: string) => {
  const f = fieldOf(cfg, key)
  return !!f && f.group === 'composition' && f.unit === 'kg' && key !== 'weight'
}
export const fieldUnit = (cfg: MeasurementConfig, key: string, weightUnit: 'kg' | 'lb'): string => {
  const u = fieldOf(cfg, key)?.unit ?? 'cm'
  return u === 'kg' ? weightUnit : u
}

export const countForField = (measurements: Measurement[], key: string) => measurements.reduce((n, m) => (m.key === key ? n + 1 : n), 0)
export const countForSource = (measurements: Measurement[], id: string) => measurements.reduce((n, m) => ((m.source ?? 'home') === id ? n + 1 : n), 0)

// ---------- campos ----------

/** Clave estable a partir del nombre: reutiliza la de serie si coincide ("cuello" → neck)
 *  para que al recuperar un campo borrado enlace con sus datos antiguos. */
export function fieldKeyFor(label: string): string {
  const n = normalize(label)
  const builtin = DEFAULT_FIELDS.find((f) => normalize(f.label) === n)
  if (builtin) return builtin.key
  const s = slug(label)
  return s ? `custom_${s}` : ''
}

export function addField(cfg: MeasurementConfig, input: { label: string; group: FieldGroup; unit: FieldUnit }): { cfg: MeasurementConfig; key: string; error?: string } {
  const label = input.label.trim()
  if (!label) return { cfg, key: '', error: 'Escribe un nombre.' }
  const key = fieldKeyFor(label)
  if (!key) return { cfg, key: '', error: 'Nombre no válido.' }
  const existing = fieldOf(cfg, key)
  if (existing && !existing.hidden) return { cfg, key, error: `«${existing.label}» ya está en la lista.` }
  if (existing) {
    // Estaba oculto: se recupera con su clave, unidad y grupo originales.
    return { cfg: { ...cfg, fields: cfg.fields.map((f) => (f.key === key ? { key, label: existing.label, group: existing.group, unit: existing.unit } : f)) }, key }
  }
  const builtin = DEFAULT_FIELDS.find((f) => f.key === key)
  const field: MeasurementField = builtin ? { ...builtin } : { key, label, group: input.group, unit: input.unit || (input.group === 'perimeter' ? 'cm' : 'kg') }
  return { cfg: { ...cfg, fields: [...cfg.fields, field] }, key }
}

/** Quita un campo: lo oculta si tiene medidas (se conservan) o lo elimina si no. */
export function removeField(cfg: MeasurementConfig, key: string, measurements: Measurement[]): { cfg: MeasurementConfig; kept: number; error?: string } {
  if (LOCKED_FIELD_KEYS.has(key)) return { cfg, kept: 0, error: 'El peso no se puede quitar: es la base de los porcentajes.' }
  const kept = countForField(measurements, key)
  if (kept > 0) return { cfg: { ...cfg, fields: cfg.fields.map((f) => (f.key === key ? { ...f, hidden: true } : f)) }, kept }
  return { cfg: { ...cfg, fields: cfg.fields.filter((f) => f.key !== key) }, kept: 0 }
}

export const restoreField = (cfg: MeasurementConfig, key: string): MeasurementConfig => ({
  ...cfg, fields: cfg.fields.map((f) => (f.key === key ? { key: f.key, label: f.label, group: f.group, unit: f.unit } : f)),
})

export function renameField(cfg: MeasurementConfig, key: string, label: string): MeasurementConfig {
  const clean = label.trim()
  if (!clean) return cfg
  return { ...cfg, fields: cfg.fields.map((f) => (f.key === key ? { ...f, label: clean } : f)) }
}

/** Mueve un campo dentro de su grupo (solo entre visibles); los ocultos quedan al final. */
export function moveField(cfg: MeasurementConfig, key: string, dir: -1 | 1): MeasurementConfig {
  const f = fieldOf(cfg, key)
  if (!f || f.hidden) return cfg
  const group = visibleFields(cfg, f.group)
  const i = group.findIndex((x) => x.key === key)
  const j = i + dir
  if (i < 0 || j < 0 || j >= group.length) return cfg
  const order = [...group]
  ;[order[i], order[j]] = [order[j], order[i]]
  const others = (g: FieldGroup) => visibleFields(cfg, g)
  const composition = f.group === 'composition' ? order : others('composition')
  const perimeter = f.group === 'perimeter' ? order : others('perimeter')
  return { ...cfg, fields: [...composition, ...perimeter, ...hiddenFields(cfg)] }
}

// ---------- orígenes ----------

export function sourceIdFor(label: string): string {
  const n = normalize(label)
  const builtin = DEFAULT_SOURCES.find((s) => normalize(s.label) === n)
  if (builtin) return builtin.id
  const s = slug(label)
  return s ? `src_${s}` : ''
}

/** Primer color de la paleta que no usa ningún origen (o el siguiente en orden). */
export function nextSourceColor(cfg: MeasurementConfig): string {
  const used = new Set(cfg.sources.map((s) => s.color.toLowerCase()))
  return SOURCE_PALETTE.find((c) => !used.has(c.toLowerCase())) ?? SOURCE_PALETTE[cfg.sources.length % SOURCE_PALETTE.length]
}

export function addSource(cfg: MeasurementConfig, input: { label: string; color?: string }): { cfg: MeasurementConfig; id: string; error?: string } {
  const label = input.label.trim()
  if (!label) return { cfg, id: '', error: 'Escribe un nombre.' }
  const id = sourceIdFor(label)
  if (!id) return { cfg, id: '', error: 'Nombre no válido.' }
  const existing = sourceOf(cfg, id)
  if (existing && !existing.hidden) return { cfg, id, error: `«${existing.label}» ya existe.` }
  if (existing) return { cfg: { ...cfg, sources: cfg.sources.map((s) => (s.id === id ? { id, label: existing.label, color: input.color ?? existing.color } : s)) }, id }
  return { cfg: { ...cfg, sources: [...cfg.sources, { id, label, color: input.color ?? nextSourceColor(cfg) }] }, id }
}

/** Quita un origen: lo oculta si tiene medidas o lo elimina si no. Siempre debe quedar al menos uno visible. */
export function removeSource(cfg: MeasurementConfig, id: string, measurements: Measurement[]): { cfg: MeasurementConfig; kept: number; error?: string } {
  if (visibleSources(cfg).length <= 1) return { cfg, kept: 0, error: 'Tiene que quedar al menos un origen.' }
  const kept = countForSource(measurements, id)
  if (kept > 0) return { cfg: { ...cfg, sources: cfg.sources.map((s) => (s.id === id ? { ...s, hidden: true } : s)) }, kept }
  return { cfg: { ...cfg, sources: cfg.sources.filter((s) => s.id !== id) }, kept: 0 }
}

export const restoreSource = (cfg: MeasurementConfig, id: string): MeasurementConfig => ({
  ...cfg, sources: cfg.sources.map((s) => (s.id === id ? { id: s.id, label: s.label, color: s.color } : s)),
})

export function updateSource(cfg: MeasurementConfig, id: string, patch: { label?: string; color?: string }): MeasurementConfig {
  const label = patch.label?.trim()
  return { ...cfg, sources: cfg.sources.map((s) => (s.id === id ? { ...s, ...(label ? { label } : {}), ...(patch.color ? { color: patch.color } : {}) } : s)) }
}

export function moveSource(cfg: MeasurementConfig, id: string, dir: -1 | 1): MeasurementConfig {
  const vis = visibleSources(cfg)
  const i = vis.findIndex((s) => s.id === id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= vis.length) return cfg
  const order = [...vis]
  ;[order[i], order[j]] = [order[j], order[i]]
  return { ...cfg, sources: [...order, ...hiddenSources(cfg)] }
}
