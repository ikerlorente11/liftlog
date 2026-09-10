// Genera docs/catalogo-ejercicios.md a partir de src/data/exercises.json: la lista
// completa de ids de ejercicio que la app reconoce, agrupada por músculo, para
// dársela a una IA junto con docs/generar-plan-con-ia.md. Sin este listado la IA
// tiende a inventarse ejercicios personalizados para todo.
//
// Uso: node scripts/build-exercise-catalog.js
// (se ejecuta solo al final de build-exercises.js)
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'src', 'data', 'exercises.json')
const out = path.join(__dirname, '..', 'docs', 'catalogo-ejercicios.md')
const exercises = JSON.parse(fs.readFileSync(src, 'utf8'))

const MUSCLE_ES = {
  chest: 'Pecho', shoulders: 'Hombros', triceps: 'Tríceps', biceps: 'Bíceps', forearms: 'Antebrazos',
  lats: 'Dorsales', upper_back: 'Espalda alta', traps: 'Trapecios', lower_back: 'Lumbares',
  abdominals: 'Abdominales', quadriceps: 'Cuádriceps', hamstrings: 'Isquiotibiales', glutes: 'Glúteos',
  calves: 'Gemelos', abductors: 'Abductores', adductors: 'Aductores', neck: 'Cuello',
  full_body: 'Cuerpo entero', cardio: 'Cardio', other: 'Otros',
}
const ORDER = Object.keys(MUSCLE_ES)
const TYPE_SHORT = {
  weight_reps: 'kg×reps', bodyweight_reps: 'reps (peso corporal)', weighted_bodyweight: '+kg×reps',
  assisted_bodyweight: '−kg×reps', reps_only: 'reps', duration: 'tiempo', distance_duration: 'distancia+tiempo', weight_duration: 'kg+tiempo',
}

const byMuscle = new Map()
for (const e of exercises) {
  const arr = byMuscle.get(e.muscle) ?? []
  arr.push(e)
  byMuscle.set(e.muscle, arr)
}
const collator = new Intl.Collator('es')

const lines = []
lines.push('# Catálogo de ejercicios de LiftLog (ids válidos para `exerciseId`)')
lines.push('')
lines.push(`> Generado por \`scripts/build-exercise-catalog.js\` desde \`src/data/exercises.json\` (${exercises.length} ejercicios). No editar a mano.`)
lines.push('>')
lines.push('> **Para la IA:** todo `exerciseId` de un plan debe salir de esta lista. Crea un ejercicio en')
lines.push('> `customExercises` solo si aquí no existe nada equivalente (busca por nombre en español y en')
lines.push('> inglés, y por variantes: barra/mancuerna/máquina/polea, unilateral, inclinado, etc.).')
lines.push('>')
lines.push('> Formato: `id` — nombre en español (nombre en inglés) · cómo se registra · material.')
lines.push('')
lines.push('## Índice')
lines.push('')
for (const m of ORDER) {
  const n = byMuscle.get(m)?.length ?? 0
  if (n) lines.push(`- [${MUSCLE_ES[m]}](#${MUSCLE_ES[m].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')}) · ${n}`)
}
lines.push('')
for (const m of ORDER) {
  const list = byMuscle.get(m)
  if (!list?.length) continue
  lines.push(`## ${MUSCLE_ES[m]}`)
  lines.push('')
  list.sort((a, b) => collator.compare(a.nameEs, b.nameEs))
  for (const e of list) {
    const en = e.name && e.name !== e.nameEs ? ` (${e.name})` : ''
    lines.push(`- \`${e.id}\` — ${e.nameEs}${en} · ${TYPE_SHORT[e.type] ?? e.type} · ${e.equipment}`)
  }
  lines.push('')
}

fs.writeFileSync(out, lines.join('\n'), 'utf8')
console.log(`✅ ${path.relative(process.cwd(), out)}: ${exercises.length} ejercicios en ${byMuscle.size} grupos`)
