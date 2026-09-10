// Genera src/data/exercises.json a partir de free-exercise-db (dominio público)
// + traducciones ES (nombres e instrucciones) + ejercicios extra del plan
// (calistenia, natación, rehab).
// Uso: node scripts/build-exercises.js <ruta ex.json> <ruta names_es.json> [ruta instructions_es.json]
const fs = require('fs')
const path = require('path')
const [, , exPath, namesPath, instrArg] = process.argv
const raw = JSON.parse(fs.readFileSync(exPath, 'utf8'))
const namesEs = namesPath && fs.existsSync(namesPath) ? JSON.parse(fs.readFileSync(namesPath, 'utf8')) : {}
const instrPath = instrArg || path.join(__dirname, 'data', 'instructions_es.json')
const instrEs = fs.existsSync(instrPath) ? JSON.parse(fs.readFileSync(instrPath, 'utf8')) : {}
// Fotos incrustadas (data URI) para ejercicios sin equivalente en la base.
// Las fotos con licencia de uso privado NO se incrustan en el catálogo público: viven en
// private/extra_images.json (fuera de git) y la app las mezcla en arranque desde
// src/data/private-images.json (ver docs/creditos-imagenes.md).

const MUSCLE = {
  abdominals: 'abdominals', hamstrings: 'hamstrings', adductors: 'adductors', quadriceps: 'quadriceps',
  biceps: 'biceps', shoulders: 'shoulders', chest: 'chest', 'middle back': 'upper_back', calves: 'calves',
  glutes: 'glutes', 'lower back': 'lower_back', lats: 'lats', triceps: 'triceps', traps: 'traps',
  forearms: 'forearms', neck: 'neck', abductors: 'abductors',
}
const EQUIP = {
  'body only': 'none', machine: 'machine', other: 'other', 'foam roll': 'other', kettlebells: 'kettlebell',
  dumbbell: 'dumbbell', cable: 'machine', barbell: 'barbell', bands: 'band', 'medicine ball': 'other',
  'exercise ball': 'other', 'e-z curl bar': 'barbell',
}
const DURATION_RE = /(plank|bridge|hold|wall sit|stretch|hang\b|isometric|l-sit|handstand|lever|carry|walk|farmer)/i
const DIST_RE = /(running|jogging|walking|treadmill|bicycl|bike|rowing|elliptical|stairmaster|swim|sprint|trail)/i

function inferType(x) {
  const n = x.name
  if (x.category === 'cardio') return DIST_RE.test(n) ? 'distance_duration' : 'duration'
  if (x.category === 'stretching') return 'duration'
  if (DURATION_RE.test(n)) return 'duration'
  if (/assisted/i.test(n)) return 'assisted_bodyweight'
  if (/pull[ -]?ups?|chin[ -]?ups?|\bchins?\b|\bdips?\b|muscle[ -]?up/i.test(n) && x.equipment !== 'machine') return 'weighted_bodyweight'
  if (x.equipment === 'body only' || x.equipment == null) return 'bodyweight_reps'
  return 'weight_reps'
}

const out = raw.map((x) => ({
  id: x.id,
  name: x.name,
  nameEs: namesEs[x.id] || x.name,
  muscle: MUSCLE[x.primaryMuscles[0]] || 'other',
  secondary: (x.secondaryMuscles || []).map((m) => MUSCLE[m] || 'other'),
  equipment: EQUIP[x.equipment] || 'other',
  type: inferType(x),
  category: x.category,
  level: x.level,
  instructions: instrEs[x.id] || x.instructions,
  images: x.images,
}))

// Los ejercicios extra sin foto propia reutilizan las 2 fotos de un ejercicio
// casi idéntico de free-exercise-db (mismo estilo, dominio público).
const IMAGE_DONOR = {
  paused_bench_press: 'Barbell_Bench_Press_-_Medium_Grip',
  bulgarian_split_squat_smith: 'Smith_Single-Leg_Split_Squat',
  step_down: 'Step-up_with_Knee_Raise',
  katana_triceps_extension: 'Cable_Rope_Overhead_Triceps_Extension',
  pseudo_planche_pushup: 'Push-Ups_-_Close_Triceps_Position',
  side_plank: 'Side_Bridge',
  explosive_pullup: 'Pullups',
  dips_weighted: 'Parallel_Bar_Dip',
  cable_lateral_raise: 'Standing_Low-Pulley_Deltoid_Raise', // de pie, como en el plan (la sentada parece un pájaro)
  handstand_wall: 'Handstand_Push-Ups',
  pike_pushup: 'Handstand_Push-Ups',
  // Jackknife: tumbado boca arriba, brazos sobre la cabeza (0) y en V (1). Los
  // Flutter_Kicks de esta base son de glúteo boca abajo en banco: no valen aquí.
  hollow_body_hold: 'Jackknife_Sit-Up',
  hollow_rocks: 'Jackknife_Sit-Up',
  mobility_routine: 'Dynamic_Chest_Stretch',
}
const imagesById = new Map(raw.map((x) => [x.id, x.images]))
// Fotos de dominio público (obras del Gobierno de EE. UU., Wikimedia Commons)
// para extras sin equivalente en free-exercise-db.
// Fotos de Wikimedia Commons enlazadas tal cual (sin recortar). Las de dominio público no
// exigen atribución; las CC BY / BY-SA sí, y la app la muestra bajo la imagen (imageCredit).
// Detalle y enlaces en docs/creditos-imagenes.md.
const IMAGE_URLS = {
  l_sit: ['https://upload.wikimedia.org/wikipedia/commons/9/96/West_Point_male_gymnast_L-sit.jpg'],
  swimming_freestyle: ['https://upload.wikimedia.org/wikipedia/commons/c/ca/U.S._Navy_retired_Parachute_Rigger_3rd_Class_Michael_Johnson_works_out_with_the_freestyle_stroke_during_Wounded_Warriors_swim_practice_at_Scott_Pool_121114-F-ZB240-0745.jpg'],
  front_lever_tuck: ['https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Front_lever_-_Serhii_Solodkyi_18280.jpg/960px-Front_lever_-_Serhii_Solodkyi_18280.jpg'],
  knee_rehab_pool: ['https://upload.wikimedia.org/wikipedia/commons/d/dc/07-06_WtrAerob1a.jpg'],
}
const IMAGE_CREDITS = {
  front_lever_tuck: 'Foto: Fenix1000, Wikimedia Commons · CC BY-SA 4.0',
}
// wall_sit no tiene foto libre conocida: icono genérico (o una foto privada vía
// src/data/private-images.json, ver docs/creditos-imagenes.md).

// Ejercicios extra (sin imagen; instrucciones ES sacadas del anexo del plan)
const S = "''" // segundos
const extra = [
  ['wall_sit', 'Wall Sit', 'Sentadilla isométrica en pared', 'quadriceps', ['glutes'], 'none', 'weight_duration',
    ['Espalda plana contra la pared, rodillas a 60-70°.', 'Con carga: disco o mancuerna abrazada al pecho.', 'Respira normal, sin apoyar las manos en los muslos.', `Mantén 45${S}.`], 'Error: apoyar las manos en los muslos.'],
  ['bulgarian_split_squat_smith', 'Bulgarian Split Squat (Smith Machine)', 'Sentadilla búlgara (multipower)', 'quadriceps', ['glutes', 'hamstrings'], 'machine', 'weight_reps',
    ['Paso largo, pie trasero sobre el banco.', 'Torso levemente inclinado; la rodilla sigue la línea del pie.', 'Baja controlado y sube empujando con el talón.'], 'Error: rodilla colapsando hacia dentro.'],
  ['step_down', 'Step-Down', 'Step-down controlado', 'quadriceps', ['glutes'], 'none', 'weighted_bodyweight',
    [`Desde el cajón, baja en 3${S} con la rodilla estable.`, 'El talón contrario toca suave el suelo y vuelves.'], 'Error: dejarse caer sin control.'],
  ['paused_bench_press', 'Paused Barbell Bench Press', 'Press banca pausado', 'chest', ['triceps', 'shoulders'], 'barbell', 'weight_reps',
    ['Escápulas retraídas, pies firmes.', `Baja la barra a la parte baja del pecho y pausa 3${S}.`, 'Empuja desde parado, sin rebote.'], 'Error: rebotar la barra en el pecho.'],
  ['katana_triceps_extension', 'Katana Cable Triceps Extension', 'Extensión katana en polea', 'triceps', [], 'machine', 'weight_reps',
    ['De espaldas a la polea alta, cuerda por encima del hombro.', 'Extiende el codo hacia delante manteniendo el brazo alto.', 'Vuelve controlado.'], ''],
  ['pseudo_planche_pushup', 'Pseudo Planche Push-Up', 'Flexión pseudo-planche', 'chest', ['shoulders', 'triceps'], 'none', 'bodyweight_reps',
    ['Manos a la altura de la cintura, dedos hacia atrás o los lados.', 'Hombros por delante de las manos, cuerpo en tabla.', 'Baja y sube manteniendo la inclinación.'], 'Error: perder la línea del cuerpo.'],
  ['pike_pushup', 'Pike Push-Up', 'Pike push-up', 'shoulders', ['triceps'], 'none', 'bodyweight_reps',
    ['Cadera alta (V invertida).', 'La cabeza baja entre las manos como un press de hombro.', 'Pies elevados = progresión hacia el pino.'], 'Error: convertirla en flexión normal.'],
  ['side_plank', 'Side Plank', 'Plancha lateral', 'abdominals', [], 'none', 'duration',
    ['Apoyo en antebrazo y pie, cuerpo alineado.', 'Cadera alta, sin rotar.'], ''],
  ['hollow_body_hold', 'Hollow Body Hold', 'Hollow body', 'abdominals', [], 'none', 'duration',
    ['Zona lumbar pegada al suelo siempre.', 'Brazos y piernas se alejan según tu nivel.'], 'Error: despegar la lumbar del suelo.'],
  ['hollow_rocks', 'Hollow Rocks', 'Hollow rocks', 'abdominals', [], 'none', 'bodyweight_reps',
    ['Desde hollow body, balancea sin perder la lumbar pegada.'], ''],
  ['front_lever_tuck', 'Tuck Front Lever', 'Front lever tuck', 'lats', ['abdominals', 'upper_back'], 'none', 'duration',
    ['Brazos rectos, escápulas retraídas.', 'Cadera a la altura de los hombros, rodillas al pecho.', 'Progresión: tuck → tuck avanzado → una pierna.'], 'Error: doblar los codos.'],
  ['explosive_pullup', 'Explosive Pull-Up (Chest to Bar)', 'Dominada explosiva al pecho', 'lats', ['biceps'], 'none', 'weighted_bodyweight',
    ['Tira lo más rápido posible hasta llevar la barra al pecho.', 'Baja controlado. Camino al muscle-up.'], 'Error: perder la posición hollow al tirar.'],
  ['l_sit', 'L-Sit', 'L-sit en paralelas', 'abdominals', ['triceps', 'shoulders'], 'other', 'duration',
    ['Hombros deprimidos (lejos de las orejas), piernas al frente.', 'Regresión: rodillas dobladas → una pierna → piernas rectas.'], 'Error: encoger los hombros.'],
    ['handstand_wall', 'Handstand Hold (Wall or Bar)', 'Pino (pared o barra)', 'shoulders', ['triceps', 'abdominals'], 'none', 'duration',
    ['Con pared: pecho a la pared, brazos bloqueados, empuja el suelo.', 'Sin pared (parque): pies sobre una barra alta y camina las manos hacia atrás hasta poner el cuerpo casi vertical; o practica patadas al pino en el césped.', 'Cuerpo alineado, glúteo y core activos.'], 'Error: arco lumbar excesivo (plátano).'],
  ['mobility_routine', 'Mobility Routine', 'Movilidad global (muñecas, hombros, cadera)', 'full_body', [], 'none', 'duration',
    ["8-10' de movilidad de muñecas, hombros y cadera."], ''],
  ['swimming_freestyle', 'Swimming (Freestyle)', 'Natación (crol)', 'cardio', ['lats', 'shoulders'], 'none', 'distance_duration',
    ['Rotación desde la cadera, codo alto en el recobro.', 'Exhala dentro del agua, cabeza neutra.'], 'Error: nadar con la cabeza alta (hunde las piernas).'],
    ['knee_rehab_pool', 'Knee Rehab (Pool)', 'Rehabilitación de rodilla en el agua', 'quadriceps', [], 'none', 'duration',
    ["Circuito en el vaso pequeño (agua por la cadera). Regla: nada debe doler más de 3/10.", "1) Marcha atrás 2': zancadas amplias caminando hacia atrás, punta-talón. Es el que más trabaja el cuádriceps sin cargar el tendón.", "2) Mini-sentadillas 2×15: hasta media profundidad (~60°), 2'' bajar, 2'' subir.", "3) Sentadilla a una pierna asistida 2×8 con la mano en el borde o la corchera: solo hasta donde no moleste.", "4) Gemelos 2×15: sube a puntillas con pausa de 1'' arriba.", "5) Zancadas caminando suaves, 2 anchos de vaso.", "El agua quita ~50 % del peso: por eso vale como dosis suave y de recuperación, no sustituye al gimnasio."], ''],
  ['dips_weighted', 'Weighted Dips', 'Fondos en paralelas (lastrados)', 'chest', ['triceps', 'shoulders'], 'other', 'weighted_bodyweight',
    ['Torso ligeramente inclinado, baja a 90° de codo.', 'Hombros lejos de las orejas. En calistenia: tempo 3-0-1 estricto.'], 'Error: bajar de más con dolor de hombro.'],
  ['cable_lateral_raise', 'Cable Lateral Raise', 'Elevaciones laterales en polea', 'shoulders', [], 'machine', 'weight_reps',
    ['Polea baja, sube hasta la horizontal con el codo un poco flexionado.', 'Baja lento.'], 'Error: subir con impulso.'],
]
for (const [id, name, nameEs, muscle, secondary, equipment, type, instructions, error] of extra) {
  out.push({
    id, name, nameEs, muscle, secondary, equipment, type, category: 'strength', level: 'intermediate',
    instructions: error ? [...instructions, error] : instructions,
    images: IMAGE_URLS[id] ?? (IMAGE_DONOR[id] ? imagesById.get(IMAGE_DONOR[id]) ?? [] : []),
    ...(IMAGE_CREDITS[id] ? { imageCredit: IMAGE_CREDITS[id] } : {}),
  })
}

// Ordenados alfabéticamente (ES) en build para que la app no tenga que ordenar con Intl
const norm = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
out.sort((a, b) => (norm(a.nameEs) < norm(b.nameEs) ? -1 : norm(a.nameEs) > norm(b.nameEs) ? 1 : 0))

const dest = path.join(__dirname, '..', 'src', 'data', 'exercises.json')
fs.writeFileSync(dest, JSON.stringify(out))
console.log('exercises:', out.length, '->', dest, Math.round(fs.statSync(dest).size / 1024) + 'KB')

// El catálogo legible para la IA (docs/catalogo-ejercicios.md) se regenera con el JSON.
require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'build-exercise-catalog.js')], { stdio: 'inherit' })
