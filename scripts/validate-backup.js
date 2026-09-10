// Valida un fichero de copia de seguridad de LiftLog antes de importarlo.
// Uso: node scripts/validate-backup.js <fichero.json>
// Comprueba estructura, ids únicos, exerciseIds conocidos, tipos de serie,
// rangos de repeticiones, programas por semanas (cobertura 1..totalWeeks sin
// huecos ni solapes) y, sobre todo, que los ejercicios personalizados no
// dupliquen uno que ya está en el catálogo (el fallo típico de un plan
// generado por IA sin el catálogo delante).
const fs = require('fs')
const path = require('path')

const file = process.argv[2]
if (!file) { console.error('Uso: node scripts/validate-backup.js <fichero.json>'); process.exit(1) }

let data
try { data = JSON.parse(fs.readFileSync(file, 'utf8')) } catch (e) { console.error('❌ JSON inválido:', e.message); process.exit(1) }

const errors = []
const warnings = []
const err = (m) => errors.push(m)
const warn = (m) => warnings.push(m)

const SET_TYPES = new Set(['normal', 'warmup', 'dropset', 'failure'])
const EX_TYPES = new Set(['weight_reps', 'bodyweight_reps', 'weighted_bodyweight', 'assisted_bodyweight', 'reps_only', 'duration', 'distance_duration', 'weight_duration'])
const MUSCLES = new Set(['abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'cardio', 'chest', 'forearms', 'full_body', 'glutes', 'hamstrings', 'lats', 'lower_back', 'neck', 'quadriceps', 'shoulders', 'traps', 'triceps', 'upper_back', 'other'])
const EQUIP = new Set(['none', 'barbell', 'dumbbell', 'kettlebell', 'machine', 'plate', 'band', 'suspension', 'other'])
// body_fat (grasa en %) es heredado: la app lo convierte a fat_mass (kg) al importar.
const MEASURE_KEYS = new Set(['weight', 'body_fat', 'fat_mass', 'muscle_mass', 'protein', 'body_water', 'bone_mineral', 'visceral_fat', 'bmr', 'neck', 'shoulders', 'chest', 'left_bicep', 'right_bicep', 'left_forearm', 'right_forearm', 'waist', 'abdomen', 'hips', 'glutes', 'left_thigh', 'right_thigh', 'left_calf', 'right_calf'])
const MEASURE_SOURCES = new Set(['home', 'official'])
const FIELD_GROUPS = new Set(['composition', 'perimeter'])

// ---------- raíz ----------
for (const k of ['folders', 'routines', 'workouts', 'customExercises', 'measurements']) {
  if (!Array.isArray(data[k])) err(`Falta el array raíz "${k}"`)
}
if (typeof data.settings !== 'object' || data.settings == null) err('Falta el objeto raíz "settings"')
if (data.version !== 1) warn(`"version" debería ser 1 (es ${JSON.stringify(data.version)})`)
if (errors.length) { report(); process.exit(1) }

// ---------- configuración de medidas (opcional) ----------
// Campos y orígenes configurables (settings.measurement_config, cadena JSON).
// Si el fichero los declara, amplían las claves y orígenes válidos.
if (data.settings.measurement_config !== undefined) {
  const raw = data.settings.measurement_config
  if (typeof raw !== 'string') err('settings.measurement_config debe ser una CADENA con JSON dentro')
  else {
    try {
      const cfg = JSON.parse(raw)
      const fields = Array.isArray(cfg.fields) ? cfg.fields : []
      const sources = Array.isArray(cfg.sources) ? cfg.sources : []
      if (!fields.some((f) => f && f.key === 'weight')) err('settings.measurement_config: falta el campo "weight" (obligatorio)')
      for (const f of fields) {
        if (!f || !f.key || !f.label) { err(`settings.measurement_config: campo sin key o label: ${JSON.stringify(f)}`); continue }
        if (!FIELD_GROUPS.has(f.group)) err(`settings.measurement_config: campo "${f.key}" con group "${f.group}" (composition | perimeter)`)
        if (!f.unit) err(`settings.measurement_config: campo "${f.key}" sin unit`)
        MEASURE_KEYS.add(f.key)
      }
      if (!sources.length) err('settings.measurement_config: "sources" vacío (hace falta al menos un origen)')
      for (const s of sources) {
        if (!s || !s.id || !s.label) { err(`settings.measurement_config: origen sin id o label: ${JSON.stringify(s)}`); continue }
        if (!/^#[0-9a-fA-F]{6}$/.test(s.color ?? '')) err(`settings.measurement_config: origen "${s.id}" con color "${s.color}" (usa #rrggbb)`)
        MEASURE_SOURCES.add(s.id)
      }
      warn('El fichero trae settings.measurement_config: al importar SUSTITUYE la configuración de medidas del usuario')
    } catch (e) { err(`settings.measurement_config no es JSON válido: ${e.message}`) }
  }
}

// ---------- ejercicios conocidos ----------
const known = new Set()
const catalog = [] // { id, nameEs, names: [normalizados] }
const bundled = path.join(__dirname, '..', 'src', 'data', 'exercises.json')
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
if (fs.existsSync(bundled)) {
  for (const e of JSON.parse(fs.readFileSync(bundled, 'utf8'))) {
    known.add(e.id)
    catalog.push({ id: e.id, nameEs: e.nameEs, type: e.type, names: [norm(e.name), norm(e.nameEs), norm(e.id.replace(/[-_]+/g, ' '))].filter(Boolean) })
  }
} else {
  warn('No se encontró src/data/exercises.json: no se pueden verificar los exerciseId del catálogo')
}

/** Ejercicios del catálogo cuyo nombre coincide (exacto) o contiene / está contenido en el dado. */
function catalogMatches(name) {
  const n = norm(name)
  if (!n || n.length < 4) return { exact: [], close: [] }
  const exact = catalog.filter((c) => c.names.includes(n))
  if (exact.length) return { exact, close: [] }
  // Parecidos: uno contiene al otro, o todas las palabras de un nombre del catálogo (2+) están
  // en el nombre dado ("sentadilla trasera con barra" ⊇ "sentadilla con barra").
  const STOP = new Set(['con', 'de', 'en', 'la', 'el', 'y', 'a', 'the', 'with', 'on', 'of', 'and'])
  const words = (s) => s.split(' ').filter((w) => w && !STOP.has(w))
  const nw = new Set(words(n))
  const close = catalog.filter((c) => c.names.some((x) => {
    if (x.length >= 6 && (x.includes(n) || n.includes(x))) return true
    const xw = words(x)
    return xw.length >= 2 && xw.every((w) => nw.has(w))
  })).slice(0, 4)
  return { exact, close }
}

// ---------- customExercises ----------
const CUSTOM_LIMIT = 5
if (data.customExercises.length > CUSTOM_LIMIT) {
  warn(`${data.customExercises.length} ejercicios personalizados: para un plan normal es demasiado; casi todo debería salir del catálogo (docs/catalogo-ejercicios.md)`)
}
for (const ex of data.customExercises) {
  const where = `customExercises["${ex.id}"]`
  if (!ex.id || !ex.nameEs) err(`${where}: faltan "id" o "nameEs"`)
  if (!EX_TYPES.has(ex.type)) err(`${where}: type "${ex.type}" no válido`)
  if (ex.muscle && !MUSCLES.has(ex.muscle)) err(`${where}: muscle "${ex.muscle}" no válido`)
  if (ex.equipment && !EQUIP.has(ex.equipment)) err(`${where}: equipment "${ex.equipment}" no válido`)
  // Mismo id que uno del catálogo: la app lo pisaría con la versión personalizada.
  if (ex.id && known.has(ex.id)) err(`${where}: el id ya existe en el catálogo; usa ese exerciseId directamente y quita el personalizado`)
  // ¿Duplica un ejercicio del catálogo con otro nombre?
  for (const candidate of [ex.nameEs, ex.name]) {
    const { exact, close } = catalogMatches(candidate)
    if (exact.length) {
      const same = exact.find((c) => c.type === ex.type) ?? exact[0]
      if (same.type === ex.type) err(`${where}: "${candidate}" ya está en el catálogo como ${same.id} (${same.nameEs}). Usa ese exerciseId en vez de un personalizado`)
      else warn(`${where}: "${candidate}" existe en el catálogo como ${same.id} pero con otro tipo de registro (${same.type} frente a ${ex.type}). Si es solo por eso, vale; si no, usa el del catálogo`)
      break
    }
    if (close.length) { warn(`${where}: "${candidate}" se parece a ${close.map((c) => c.id + ' (' + c.nameEs + ')').join(', ')}. Si es el mismo movimiento, usa el del catálogo`); break }
  }
  if (Array.isArray(ex.images)) {
    for (const img of ex.images) {
      if (typeof img !== 'string') { err(`${where}: images debe contener cadenas`); continue }
      const m = img.match(/^([^/]+)\/[01]\.jpg$/)
      if (m && known.size && !known.has(m[1])) err(`${where}: la imagen "${img}" apunta a un ejercicio donante que no existe en el catálogo`)
      else if (!m && !/^(https?:|data:image\/)/.test(img)) err(`${where}: imagen "${img}" no válida (ruta "Id_Donante/0.jpg", URL https o data:image)`)
    }
  }
  known.add(ex.id)
}

// ---------- carpetas ----------
const folderIds = new Set()
for (const f of data.folders) {
  if (!f.id || !f.name) err(`Carpeta sin id o nombre: ${JSON.stringify(f)}`)
  if (folderIds.has(f.id)) err(`Carpeta con id duplicado: ${f.id}`)
  folderIds.add(f.id)
}

// ---------- rutinas ----------
const routineIds = new Set()

function checkEntries(entries, ids, where) {
  if (!Array.isArray(entries)) { err(`${where}: "exercises" no es un array`); return }
  for (const e of entries) {
    const w = `${where} → ejercicio "${e.exerciseId}"`
    if (!e.id) err(`${w}: falta "id"`)
    else if (ids.has(e.id)) err(`${w}: id de entry duplicado (${e.id})`)
    else ids.add(e.id)
    if (!e.exerciseId) err(`${w}: falta "exerciseId"`)
    else if (known.size && !known.has(e.exerciseId)) err(`${w}: exerciseId desconocido (ni catálogo ni customExercises)`)
    if (e.restSeconds !== null && typeof e.restSeconds !== 'number') err(`${w}: "restSeconds" debe ser número o null`)
    if (e.repRange != null) {
      const rr = e.repRange
      if (!Number.isInteger(rr.min) || !Number.isInteger(rr.max) || rr.min < 1 || rr.max < rr.min) err(`${w}: repRange debe ser { min, max } enteros con 1 <= min <= max`)
      else if (Array.isArray(e.sets) && e.sets.some((s) => s.type === 'normal' && s.reps != null && (s.reps < rr.min || s.reps > rr.max))) warn(`${w}: hay series con reps fuera del repRange ${rr.min}-${rr.max}`)
      if (Array.isArray(e.sets) && e.sets.length && e.sets.every((s) => s.reps == null)) warn(`${w}: repRange en un ejercicio sin repeticiones (tiempo/distancia): no tiene efecto`)
    }
    if (!Array.isArray(e.sets) || !e.sets.length) { err(`${w}: sin series`); continue }
    for (const s of e.sets) {
      if (!s.id) err(`${w}: serie sin "id"`)
      else if (ids.has(s.id)) err(`${w}: id de serie duplicado (${s.id})`)
      else ids.add(s.id)
      if (!SET_TYPES.has(s.type)) err(`${w}: tipo de serie "${s.type}" no válido`)
      if (s.completed !== false) err(`${w}: "completed" debe ser false en rutinas`)
      for (const k of ['weightKg', 'reps', 'distanceM', 'durationS', 'rpe']) {
        if (!(k in s)) err(`${w}: falta el campo "${k}" en una serie (usa null si no aplica)`)
        else if (s[k] !== null && typeof s[k] !== 'number') err(`${w}: "${k}" debe ser número o null`)
      }
    }
  }
}

for (const r of data.routines) {
  const where = `Rutina "${r.name ?? r.id}"`
  if (!r.id || !r.name) err(`${where}: faltan "id" o "name"`)
  if (routineIds.has(r.id)) err(`${where}: id de rutina duplicado (${r.id})`)
  routineIds.add(r.id)
  if (r.folderId != null && !folderIds.has(r.folderId)) err(`${where}: folderId "${r.folderId}" no existe en "folders"`)
  const ids = new Set()
  checkEntries(r.exercises, ids, where)

  // programa por semanas
  const p = r.program
  if (p == null) continue
  if (typeof p.totalWeeks !== 'number' || p.totalWeeks < 1) { err(`${where}: program.totalWeeks no válido`); continue }
  // startedAt null es lo normal en un plan generado: el programa arranca en la semana 1 la
  // primera vez que se abre la rutina. Un timestamp debe ser el lunes de la semana 1.
  if (p.startedAt == null) { /* ok */ }
  else if (typeof p.startedAt !== 'number' || new Date(p.startedAt).getDay() !== 1) err(`${where}: program.startedAt debe ser un lunes (ms desde epoch)`)
  if (!Array.isArray(p.phases) || !p.phases.length) { err(`${where}: program.phases vacío`); continue }
  const seen = new Map()
  for (const ph of p.phases) {
    const wp = `${where} → fase "${ph.label}"`
    if (!ph.label) err(`${where}: fase sin "label"`)
    if (!Array.isArray(ph.weeks) || !ph.weeks.length) { err(`${wp}: "weeks" vacío`); continue }
    for (const w of ph.weeks) {
      if (!Number.isInteger(w) || w < 1 || w > p.totalWeeks) err(`${wp}: semana ${w} fuera de rango 1..${p.totalWeeks}`)
      if (seen.has(w)) err(`${wp}: semana ${w} solapada con la fase "${seen.get(w)}"`)
      seen.set(w, ph.label)
    }
    if (ph.exercises) checkEntries(ph.exercises, ids, wp)
    if (ph.deload && ph.exercises) warn(`${wp}: "deload" se ignora cuando la fase tiene "exercises" propios`)
  }
  for (let w = 1; w <= p.totalWeeks; w++) if (!seen.has(w)) err(`${where}: la semana ${w} no está cubierta por ninguna fase`)
}

// ---------- medidas ----------
const measureIds = new Set()
for (const m of data.measurements) {
  const where = `Medida "${m.id ?? '(sin id)'}"`
  if (!m.id) err(`${where}: falta "id"`)
  else if (measureIds.has(m.id)) err(`${where}: id duplicado`)
  else measureIds.add(m.id)
  if (!MEASURE_KEYS.has(m.key)) err(`${where}: key "${m.key}" no válida (clave de serie o declarada en settings.measurement_config)`)
  if (typeof m.value !== 'number' || Number.isNaN(m.value)) err(`${where}: "value" debe ser número`)
  if (typeof m.date !== 'number') err(`${where}: "date" debe ser un timestamp en ms`)
  // "source" es opcional: las copias anteriores a la báscula/nutricionista no lo traen.
  if (m.source !== undefined && !MEASURE_SOURCES.has(m.source)) err(`${where}: source "${m.source}" no válido (home | official, o un id declarado en settings.measurement_config)`)
}

if (data.workouts.length) warn(`El fichero incluye ${data.workouts.length} entrenos: normal en una copia real, innecesario en un plan generado`)

report()
process.exit(errors.length ? 1 : 0)

function report() {
  for (const w of warnings) console.log('⚠️ ', w)
  for (const e of errors) console.log('❌ ', e)
  if (!errors.length) {
    const nProg = (data.routines ?? []).filter((r) => r.program).length
    const nMeas = data.measurements?.length ?? 0
    console.log(`✅ Válido: ${data.folders?.length ?? 0} carpetas · ${data.routines?.length ?? 0} rutinas (${nProg} con programa) · ${data.customExercises?.length ?? 0} ejercicios personalizados${nMeas ? ` · ${nMeas} medidas` : ''}`)
  } else {
    console.log(`\n${errors.length} error(es). Corrige y vuelve a validar.`)
  }
}
