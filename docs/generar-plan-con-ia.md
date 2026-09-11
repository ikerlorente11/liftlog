<!-- GENERADO por scripts/build-exercise-catalog.js a partir de scripts/data/plan-ia-spec.md
     y src/data/exercises.json. No editar a mano: edita la especificación y ejecuta npm run catalog. -->
# 🤖 Generar tu plan de entrenamiento con una IA e importarlo en LiftLog

LiftLog importa planes completos desde un fichero JSON (Ajustes → **Importar copia de
seguridad**). Este documento es **todo lo que una IA necesita** para escribir ese fichero: las
instrucciones de trabajo, la especificación del formato y, al final, el **catálogo completo de
ejercicios** que la app ya trae con su `id`. Es un único fichero: adjúntalo tal cual.

## Cómo usarlo (para personas)

1. **Planifica primero tu entrenamiento con la IA**, como harías con un entrenador: cuéntale tu
   objetivo, nivel, días y tiempo por sesión, material, lesiones o molestias, y qué te gusta y qué
   no. Discute con ella los ejercicios, series, repeticiones, pesos de partida y la progresión por
   semanas (bloques, descargas, tests) hasta que el plan te convenza. Si ya tienes un plan (PDF,
   foto, texto), también vale: se lo das y te saltas este paso.
2. **Cuando el plan esté cerrado, adjunta este fichero** al mismo chat y pídele:

   > Ahora genera este plan en el formato de LiftLog siguiendo las instrucciones del archivo
   > adjunto y usando solo los ejercicios de su catálogo. Crea ejercicios personalizados
   > únicamente si no existe nada equivalente y dime cuáles has creado y por qué. Al final,
   > dame la tabla de correspondencia ejercicio → id.

   Si la IA no admite adjuntos, pega el contenido del fichero en el chat.
3. Guarda la respuesta como `mi-plan.json` (solo el JSON, sin texto alrededor).
4. Opcional pero recomendado: si tienes el repo, valida el fichero:

   ```bash
   node scripts/validate-backup.js mi-plan.json
   ```

   Comprueba la estructura, que todos los `exerciseId` existen y avisa si un ejercicio
   personalizado duplica uno del catálogo. Si da errores, pégaselos a la IA para que corrija.
5. Pasa el fichero al móvil (Descargas, Drive, correo…) y en LiftLog:
   **Ajustes → Importar copia de seguridad → elige el fichero → Fusionar**.
   - **Fusionar** añade o actualiza sin borrar nada. Es lo normal.
   - **Reemplazar todo** borra rutinas, entrenos y medidas antes de importar. Solo para
     empezar de cero.
6. Comprueba en la pestaña **Entreno** que están las carpetas y rutinas, y abre una para ver la
   semana del plan y los objetivos.

### Ajustar el plan más adelante

Pide a la IA que **reutilice los mismos `id`** de carpetas, rutinas, ejercicios y series y que
ponga `updatedAt` a la fecha actual. Al fusionar, las rutinas con el mismo id se actualizan en
su sitio en vez de duplicarse. Dos matices:

- Si en el móvil has tocado una rutina **después** de la fecha `updatedAt` del fichero (por
  ejemplo subiendo pesos al terminar un entreno), Fusionar **conserva la del móvil** y te avisa.
  Para imponer la del fichero, su `updatedAt` debe ser más reciente.
- Si la rutina ya había arrancado su programa por semanas, Fusionar conserva la fecha de inicio
  aunque el fichero traiga `startedAt: null`.


## Instrucciones para la IA

Eres un generador de ficheros de copia de seguridad de LiftLog. Tu salida final es **un único
JSON válido** con la estructura de la sección "Modelo de datos", precedido de una breve tabla de
correspondencia (ver "Entrega"). Trabaja en este orden:

1. **Aclara lo que falte** antes de inventar: días por semana, material disponible, nivel,
   objetivo, duración del plan y si quiere progresión por semanas. Si el usuario ya lo ha dado
   todo, no preguntes.
2. **Mapea cada ejercicio del plan a un `id` del catálogo** (sección "Catálogo de ejercicios", al final de este documento).
   Esta es la parte donde más se falla: lee la regla 1 de abajo.
3. Construye el JSON.
4. Pasa la **checklist final** tú mismo antes de entregar.

### Regla 1 · El catálogo va primero; los personalizados son la excepción

La app trae ~890 ejercicios con foto e instrucciones en español. Un `exerciseId` que no exista
en el catálogo ni en `customExercises` sale **sin nombre ni imagen**, y un personalizado que
duplica uno del catálogo pierde la foto, las instrucciones y el historial compartido con otras
rutinas. Por eso:

- **Busca siempre en el catálogo antes de crear nada.** Busca por el nombre en español, por el
  nombre en inglés y por variantes de material: barra / mancuerna / máquina / polea / banda,
  unilateral, inclinado / declinado, sentado / de pie, agarre ancho / cerrado / neutro.
- Elige la variante cuyo **tipo de registro** encaje con cómo se va a apuntar (kg×reps, reps,
  tiempo…). Ejemplo: para puente de glúteo con carga usa `Barbell_Hip_Thrust` (kg×reps) y no
  `Barbell_Glute_Bridge`, que en el catálogo está como ejercicio de tiempo.
- Crea un ejercicio en `customExercises` **solo** si tras buscar no hay nada equivalente
  (movimientos poco comunes: curl nórdico, burpees, sentadilla búlgara con mancuernas de pie
  en banco, ejercicios de rehabilitación, natación por estilos…). Ponle un `id` en minúsculas
  con guiones bajos que no coincida con ninguno del catálogo.
- En la entrega, **lista cada personalizado creado y por qué** no valía ninguno del catálogo.
  Si la lista pasa de 3 o 4 en un plan de gimnasio normal, casi seguro que has buscado mal.

Ids de los movimientos más habituales (todos existen; úsalos tal cual):

| Grupo | Ids del catálogo |
|---|---|
| Pecho | `Barbell_Bench_Press_-_Medium_Grip`, `Barbell_Incline_Bench_Press_-_Medium_Grip`, `Dumbbell_Bench_Press`, `Incline_Dumbbell_Press`, `Dumbbell_Flyes`, `Incline_Dumbbell_Flyes`, `Cable_Crossover`, `Low_Cable_Crossover`, `Incline_Cable_Flye`, `Pushups`, `Dips_-_Chest_Version`, `paused_bench_press` |
| Espalda | `Pullups`, `Chin-Up`, `Wide-Grip_Lat_Pulldown`, `Close-Grip_Front_Lat_Pulldown`, `Bent_Over_Barbell_Row`, `One-Arm_Dumbbell_Row`, `Seated_Cable_Rows`, `T-Bar_Row_with_Handle`, `Inverted_Row`, `Face_Pull`, `Straight-Arm_Pulldown`, `Rack_Pulls`, `Hyperextensions_Back_Extensions`, `Barbell_Shrug`, `Dumbbell_Shrug` |
| Hombros | `Barbell_Shoulder_Press`, `Standing_Military_Press`, `Dumbbell_Shoulder_Press`, `Arnold_Dumbbell_Press`, `Side_Lateral_Raise`, `cable_lateral_raise`, `Front_Dumbbell_Raise`, `Reverse_Flyes`, `Upright_Barbell_Row`, `pike_pushup`, `handstand_wall` |
| Bíceps | `Barbell_Curl`, `Dumbbell_Bicep_Curl`, `Hammer_Curls`, `Incline_Dumbbell_Curl`, `Preacher_Curl`, `Concentration_Curls`, `Standing_Biceps_Cable_Curl`, `Spider_Curl`, `Zottman_Curl` |
| Tríceps | `Triceps_Pushdown`, `Triceps_Pushdown_-_Rope_Attachment`, `Close-Grip_Barbell_Bench_Press`, `Dips_-_Triceps_Version`, `dips_weighted`, `Bench_Dips`, `EZ-Bar_Skullcrusher`, `Lying_Triceps_Press`, `Cable_Rope_Overhead_Triceps_Extension`, `Dumbbell_One-Arm_Triceps_Extension`, `Tricep_Dumbbell_Kickback`, `katana_triceps_extension` |
| Cuádriceps | `Barbell_Squat`, `Front_Barbell_Squat`, `Goblet_Squat`, `Bodyweight_Squat`, `Box_Squat`, `Hack_Squat`, `Leg_Press`, `Leg_Extensions`, `Dumbbell_Lunges`, `Barbell_Lunge`, `Split_Squat_with_Dumbbells`, `bulgarian_split_squat_smith`, `Smith_Single-Leg_Split_Squat`, `Step-up_with_Knee_Raise`, `step_down`, `wall_sit`, `Kettlebell_Pistol_Squat` |
| Isquios y glúteo | `Barbell_Deadlift`, `Romanian_Deadlift`, `Stiff-Legged_Barbell_Deadlift`, `Sumo_Deadlift`, `Trap_Bar_Deadlift`, `Good_Morning`, `Lying_Leg_Curls`, `Seated_Leg_Curl`, `Barbell_Hip_Thrust`, `Glute_Kickback`, `One-Legged_Cable_Kickback`, `Thigh_Abductor`, `Thigh_Adductor` |
| Gemelos | `Standing_Calf_Raises`, `Seated_Calf_Raise`, `Calf_Press_On_The_Leg_Press_Machine`, `Standing_Dumbbell_Calf_Raise`, `Donkey_Calf_Raises` |
| Core | `Plank`, `side_plank`, `hollow_body_hold`, `hollow_rocks`, `Hanging_Leg_Raise`, `Flat_Bench_Lying_Leg_Raise`, `Crunches`, `Cable_Crunch`, `Reverse_Crunch`, `Ab_Roller`, `Russian_Twist`, `Dead_Bug`, `Mountain_Climbers`, `Superman`, `l_sit` |
| Calistenia | `Pullups`, `Chin-Up`, `explosive_pullup`, `front_lever_tuck`, `Pushups`, `pseudo_planche_pushup`, `pike_pushup`, `handstand_wall`, `Dips_-_Triceps_Version`, `Inverted_Row`, `Bodyweight_Squat`, `l_sit` |
| Cardio y otros | `Running_Treadmill`, `Walking_Treadmill`, `Bicycling_Stationary`, `Bicycling`, `Rowing_Stationary`, `Elliptical_Trainer`, `Stairmaster`, `Rope_Jumping`, `swimming_freestyle`, `knee_rehab_pool`, `Farmers_Walk`, `One-Arm_Kettlebell_Swings`, `Sled_Push`, `mobility_routine` |

Trampas conocidas: **no existen** en el catálogo `Burpee`, `Nordic_Curl`, `Pec_Deck`, `Jump_Rope`
(es `Rope_Jumping`), `Kettlebell_Swings` a dos manos (solo `One-Arm_Kettlebell_Swings`), ni
`Bulgarian_Split_Squat` a secas (usa `Split_Squat_with_Dumbbells` o `bulgarian_split_squat_smith`).
Los ids del catálogo distinguen mayúsculas y llevan guiones y guiones bajos exactamente como se
muestran: cópialos, no los reconstruyas de memoria.

### Regla 2 · Unidades, ids y valores nulos

- Unidades internas SIEMPRE métricas: **kg**, **metros**, **segundos**. La app convierte a
  lb / millas en pantalla.
- Todos los `id` son cadenas únicas dentro del fichero. Vale cualquier texto estable y legible:
  `"f-gym"`, `"r-lunes-torso"`, `"r-lunes-torso-e1"`, `"r-lunes-torso-e1-s3"`. Los ids de
  entradas y series de las fases de un programa también deben ser únicos.
- Campos numéricos que no apliquen → `null`. **No los omitas** en las series.
- Timestamps en milisegundos desde epoch (`Date.now()`).

### Regla 3 · Las notas deben ser autocontenidas

El usuario entrena solo con la app, sin este documento ni el plan original. Lo que no esté en
`notes` de la rutina, del ejercicio o de la fase, no existe:

- Explica la progresión en la nota de la rutina ("Doble progresión 8-12: cuando hagas 12 en
  todas las series, sube 2,5 kg y vuelve a 8").
- En cada ejercicio, técnica clave y objetivo del día en una o dos frases.
- Nada de "el ejercicio de la semana" sin decir cuál, ni referencias a tablas externas.
- Si una fase cambia el formato (más volumen, semana de test, descarga), dilo en su `note`.

### Modelo de datos

#### Raíz

```jsonc
{
  "version": 1,
  "exportedAt": 1757500000000,      // timestamp ms; cualquier valor razonable
  "folders": [ /* Folder */ ],
  "routines": [ /* Routine */ ],
  "workouts": [],                    // deja siempre []
  "customExercises": [ /* Exercise; normalmente [] o muy pocos */ ],
  "measurements": [],                // normalmente []; ver "Medidas" si importas histórico
  "settings": {}                     // normalmente {}; ver "Medidas"
}
```

#### Folder (carpeta de rutinas)

```jsonc
{ "id": "f-gym", "name": "Mi plan · Gimnasio", "position": 0 }
```

Agrupa por contexto (Gimnasio, Casa, Piscina, Vacaciones…), no por semana.

#### Routine (rutina)

```jsonc
{
  "id": "r-lunes-torso",
  "name": "Lunes · Torso A",
  "notes": "Resumen del día y regla de progresión. Se muestra arriba del todo.",
  "folderId": "f-gym",              // id de carpeta o null
  "position": 0,                     // orden dentro de la carpeta
  "createdAt": 1757500000000,
  "updatedAt": 1757500000000,        // al REGENERAR un plan, pon la fecha actual (ver arriba)
  "exercises": [ /* ExerciseEntry: los objetivos base */ ],
  "program": null                    // o RoutineProgram (recomendado si hay progresión por semanas)
}
```

Una rutina = una sesión. Si el plan tiene "Día 1 / Día 2 / Día 3", son tres rutinas. Pon el día
de la semana en el nombre si el plan lo fija.

#### ExerciseEntry (ejercicio dentro de una rutina)

```jsonc
{
  "id": "r-lunes-torso-e1",
  "exerciseId": "Barbell_Bench_Press_-_Medium_Grip",  // del catálogo o de customExercises
  "notes": "Pausa de 1 s en el pecho. Objetivo: 4×6 a RPE 8.",
  "restSeconds": 150,               // descanso tras cada serie; null = el de los ajustes de la app
  "supersetId": null,               // mismo valor no nulo en 2+ ejercicios = superserie
  "repRange": { "min": 6, "max": 8 }, // opcional: doble progresión automática (ver abajo)
  "sets": [ /* SetData */ ]
}
```

**`repRange` (doble progresión).** Si lo pones, al terminar un entreno la app propone la subida
sola: si todas las series llegaron a `max`, sube el peso y vuelve a `min`; si no, sube las
repeticiones. Úsalo en ejercicios de kg×reps con rango (8-12, 6-8…). Las series deben empezar en
`min` reps. Déjalo fuera (o `null`) en ejercicios de tiempo, distancia o series fijas.

#### SetData (una serie)

```jsonc
{
  "id": "r-lunes-torso-e1-s1",
  "type": "normal",                 // "normal" | "warmup" | "dropset" | "failure"
  "weightKg": 60,                   // null si no aplica
  "reps": 8,                        // null si no aplica
  "distanceM": null,                // metros (natación, carrera, remo)
  "durationS": null,                // segundos (planchas, isométricos, natación)
  "rpe": null,                      // deja null
  "completed": false                // siempre false en rutinas
}
```

Qué campos rellenar según el **tipo del ejercicio** (columna "cómo se registra" del catálogo):

| Tipo | Campos de la serie | Ejemplos |
|---|---|---|
| `weight_reps` | `weightKg` + `reps` | press banca, sentadilla, curl |
| `bodyweight_reps`, `reps_only` | `reps` | flexiones, crunch |
| `weighted_bodyweight` | `weightKg` (lastre, 0 si sin lastre) + `reps` | dominadas, fondos |
| `assisted_bodyweight` | `weightKg` (asistencia) + `reps` | dominadas asistidas |
| `duration` | `durationS` | plancha, wall sit |
| `distance_duration` | `distanceM` + `durationS` (objetivo de tiempo, o null) | natación, carrera |
| `weight_duration` | `weightKg` + `durationS` | paseo del granjero |

- Las series `"warmup"` no cuentan para volumen ni récords: úsalas para aproximaciones.
- Si el usuario no da peso de partida, pon `null` en `weightKg` (la app lo pedirá) o un valor
  conservador explicándolo en la nota; no inventes pesos "típicos" sin decirlo.

#### Exercise (ejercicio personalizado, en `customExercises`)

Solo cuando la regla 1 lo justifique.

```jsonc
{
  "id": "nordic_curl",                // minúsculas y guiones bajos; que no exista en el catálogo
  "name": "Nordic Curl",             // nombre en inglés (para el botón de vídeo)
  "nameEs": "Curl nórdico",          // nombre mostrado
  "muscle": "hamstrings",            // músculo principal, ver lista
  "secondary": ["glutes"],
  "equipment": "none",               // ver lista
  "type": "bodyweight_reps",         // ver tabla de tipos
  "category": "strength",
  "level": "intermediate",
  "instructions": ["Paso 1…", "Paso 2…", "Error típico: …"],  // en español, 3-5 pasos
  "images": [],                      // ver abajo
  "isCustom": true
}
```

- `muscle` / `secondary`: `abdominals`, `abductors`, `adductors`, `biceps`, `calves`, `cardio`,
  `chest`, `forearms`, `full_body`, `glutes`, `hamstrings`, `lats`, `lower_back`, `neck`,
  `quadriceps`, `shoulders`, `traps`, `triceps`, `upper_back`, `other`
- `equipment`: `none`, `barbell`, `dumbbell`, `kettlebell`, `machine`, `plate`, `band`,
  `suspension`, `other`
- `type`: `weight_reps`, `bodyweight_reps`, `weighted_bodyweight`, `assisted_bodyweight`,
  `reps_only`, `duration`, `distance_duration`, `weight_duration`
- `images`: `[]` muestra un icono genérico. También admite rutas relativas de free-exercise-db
  para **reutilizar las fotos de un ejercicio casi idéntico** del catálogo, p. ej.
  `["Bodyweight_Squat/0.jpg", "Bodyweight_Squat/1.jpg"]` (el `id` del donante + `/0.jpg` y
  `/1.jpg`). Hazlo solo si el donante muestra de verdad el mismo movimiento; si dudas, `[]`.
  URLs `https://` y `data:image/...;base64,` también valen.

#### RoutineProgram (plan por semanas; recomendado si hay progresión)

Si el plan progresa a lo largo de semanas, añade `program` a la rutina. La app calcula la
semana actual, la muestra ("Semana 3/12 · Bloque 1"), permite cambiarla a mano y al empezar el
entreno carga los objetivos de la fase que toca.

```jsonc
{
  "totalWeeks": 12,
  "startedAt": null,                 // null = arranca la primera vez que se abre la rutina (semana 1)
  "phases": [
    {
      "weeks": [1, 2, 3, 4, 5],      // semanas (1-based) en las que aplica
      "label": "Bloque 1",           // corto: se ve en la tarjeta
      "note": "Qué hacer estas semanas (se muestra en el detalle)."
      // sin "exercises": usa los objetivos base de la rutina
    },
    {
      "weeks": [6],
      "label": "Descarga",
      "deload": true,                // mitad de series automática, mismos pesos
      "note": "Mitad de series, mismo peso. Llega fresco al bloque 2."
    },
    {
      "weeks": [7, 8, 9, 10, 11, 12],
      "label": "Bloque 2",
      "exercises": [ /* ExerciseEntry[]: objetivos PROPIOS de estas semanas */ ]
    }
  ]
}
```

Reglas del programa:

1. **Cobertura total**: cada semana de 1 a `totalWeeks` está en exactamente **una** fase (sin
   huecos ni solapes).
2. `startedAt`: `null` salvo que el usuario diga que el plan empieza una semana concreta;
   entonces el timestamp del **lunes** de esa semana (a las 00:00 hora local).
3. Dos formas de definir los objetivos de una fase:
   - **Sin `exercises`** → usa los ejercicios base de la rutina. Ideal para fuerza con
     progresión por rendimiento (con `repRange` o con "Actualizar rutina" al terminar).
     Combínalo con `"deload": true` en las semanas de descarga.
   - **Con `exercises`** → la fase tiene sus propias series (ideal para natación o cardio, donde
     el formato cambia cada bloque: 8×50 m → 6×100 m…). En estas fases la app no ofrece
     "Actualizar rutina" al terminar ni aplica `deload`.
4. Si varias rutinas siguen el mismo calendario, todas llevan el mismo `totalWeeks` y las mismas
   semanas de descarga.

#### Medidas (solo si el usuario pide importar su histórico corporal)

Para un plan generado deja `measurements: []` y `settings: {}`.

```jsonc
{
  "id": "m-2026-01-10-weight",
  "key": "weight",        // ver claves
  "value": 81.5,          // kg para weight y las masas; kcal para bmr; índice para visceral_fat; cm para perímetros
  "date": 1757500000000,  // timestamp ms
  "source": "home"        // id del origen: "home" (báscula de casa) u "official" (nutricionista / profesional)
}
```

- Claves de serie: composición `weight`, `fat_mass`, `muscle_mass`, `protein`, `body_water`,
  `bone_mineral`, `visceral_fat`, `bmr`; perímetros `neck`, `shoulders`, `chest`, `left_bicep`,
  `right_bicep`, `left_forearm`, `right_forearm`, `waist`, `abdomen`, `hips`, `glutes`,
  `left_thigh`, `right_thigh`, `left_calf`, `right_calf`.
- La grasa se guarda en **kg** (`fat_mass`); la app enseña el % calculándolo con el peso del mismo
  origen y del mismo día (±3 días). Si solo tienes el %, importa también el peso de ese día y
  pásalo a kg (`% × peso / 100`). La clave antigua `body_fat` (en %) se acepta y se convierte.
- Los orígenes y los campos son **configurables** en la app (Medidas → Configurar medidas). Si
  el usuario tiene más orígenes (p. ej. "Gimnasio") o campos propios, puedes declararlos en
  `settings.measurement_config` como **cadena JSON** con esta forma; si no, no toques `settings`:

  ```jsonc
  "settings": {
    "measurement_config": "{\"fields\":[{\"key\":\"weight\",\"label\":\"Peso corporal\",\"group\":\"composition\",\"unit\":\"kg\"}, …],\"sources\":[{\"id\":\"home\",\"label\":\"Báscula de casa\",\"color\":\"#3d8bff\"},{\"id\":\"official\",\"label\":\"Nutricionista\",\"color\":\"#f5a623\"},{\"id\":\"src_gimnasio\",\"label\":\"Gimnasio\",\"color\":\"#2ecc71\"}]}"
  }
  ```

  Campos: `key`, `label`, `group` (`composition` | `perimeter`), `unit` (`kg` = masa que se
  convierte a lb; `cm`, `%`, `kcal`, `nivel`), `hidden` opcional. Orígenes: `id`, `label`,
  `color` (hex), `hidden` opcional. El campo `weight` debe existir siempre. Ojo: este ajuste
  **sustituye** la configuración del usuario al importar, así que incluye la lista completa.

### Entrega

Devuelve, en este orden:

1. Una tabla corta **ejercicio del plan → `exerciseId` usado** (y si es personalizado, por qué).
2. El JSON completo en un único bloque de código, sin comentarios dentro.

Si el usuario te pasa errores del validador, corrige solo lo señalado y devuelve el JSON entero.

### Checklist final antes de entregar el JSON

- [ ] JSON válido, un solo objeto raíz, sin comentarios ni comas finales.
- [ ] **Cada `exerciseId` está copiado literalmente del catálogo** o definido en
      `customExercises`; los personalizados son pocos y están justificados.
- [ ] Ningún personalizado duplica un ejercicio del catálogo (mismo movimiento con otro nombre).
- [ ] Todos los ids únicos; `completed: false` y `rpe: null` en todas las series.
- [ ] Campos no aplicables a `null`, no omitidos; los campos rellenos coinciden con el tipo del
      ejercicio.
- [ ] `repRange` solo en ejercicios de kg×reps con rango, y las series empiezan en `min`.
- [ ] `workouts: []`, `settings: {}` y `measurements: []` salvo importación de histórico.
- [ ] Cada `folderId` existe en `folders`.
- [ ] Si hay `program`: semanas 1..`totalWeeks` cubiertas sin solapes; `startedAt` null o un
      lunes; `deload` solo en fases sin `exercises`.
- [ ] Notas autocontenidas: progresión explicada, sin referencias externas.
- [ ] Pesos en kg, distancias en metros, tiempos en segundos.

---

## Ejemplo mínimo completo

```json
{
  "version": 1,
  "exportedAt": 1757500000000,
  "folders": [{ "id": "f1", "name": "Mi plan", "position": 0 }],
  "routines": [
    {
      "id": "r1",
      "name": "Día 1 · Full body",
      "notes": "Doble progresión 5-8 en los básicos: cuando completes 8 reps en todas las series, sube 2,5 kg y vuelve a 5.",
      "folderId": "f1",
      "position": 0,
      "createdAt": 1757500000000,
      "updatedAt": 1757500000000,
      "exercises": [
        {
          "id": "r1e1",
          "exerciseId": "Barbell_Squat",
          "notes": "Profundidad hasta paralela. Primera serie de aproximación.",
          "restSeconds": 150,
          "supersetId": null,
          "repRange": { "min": 5, "max": 8 },
          "sets": [
            { "id": "r1e1s1", "type": "warmup", "weightKg": 40, "reps": 8, "distanceM": null, "durationS": null, "rpe": null, "completed": false },
            { "id": "r1e1s2", "type": "normal", "weightKg": 70, "reps": 5, "distanceM": null, "durationS": null, "rpe": null, "completed": false },
            { "id": "r1e1s3", "type": "normal", "weightKg": 70, "reps": 5, "distanceM": null, "durationS": null, "rpe": null, "completed": false },
            { "id": "r1e1s4", "type": "normal", "weightKg": 70, "reps": 5, "distanceM": null, "durationS": null, "rpe": null, "completed": false }
          ]
        },
        {
          "id": "r1e2",
          "exerciseId": "Pullups",
          "notes": "Sin lastre (0 kg) hasta hacer 3×10; luego añade 2,5 kg.",
          "restSeconds": 120,
          "supersetId": null,
          "repRange": { "min": 6, "max": 10 },
          "sets": [
            { "id": "r1e2s1", "type": "normal", "weightKg": 0, "reps": 6, "distanceM": null, "durationS": null, "rpe": null, "completed": false },
            { "id": "r1e2s2", "type": "normal", "weightKg": 0, "reps": 6, "distanceM": null, "durationS": null, "rpe": null, "completed": false },
            { "id": "r1e2s3", "type": "normal", "weightKg": 0, "reps": 6, "distanceM": null, "durationS": null, "rpe": null, "completed": false }
          ]
        },
        {
          "id": "r1e3",
          "exerciseId": "Plank",
          "notes": "Glúteo apretado, sin arquear la lumbar.",
          "restSeconds": 60,
          "supersetId": null,
          "sets": [
            { "id": "r1e3s1", "type": "normal", "weightKg": null, "reps": null, "distanceM": null, "durationS": 45, "rpe": null, "completed": false },
            { "id": "r1e3s2", "type": "normal", "weightKg": null, "reps": null, "distanceM": null, "durationS": 45, "rpe": null, "completed": false }
          ]
        }
      ],
      "program": {
        "totalWeeks": 8,
        "startedAt": null,
        "phases": [
          { "weeks": [1, 2, 3], "label": "Bloque 1", "note": "Añade peso cuando completes todas las series en el tope del rango." },
          { "weeks": [4], "label": "Descarga", "deload": true, "note": "Mitad de series, mismo peso." },
          { "weeks": [5, 6, 7, 8], "label": "Bloque 2", "note": "Igual que el bloque 1 con los pesos nuevos." }
        ]
      }
    }
  ],
  "workouts": [],
  "customExercises": [],
  "measurements": [],
  "settings": {}
}
```

Un ejemplo completo y validado (3 rutinas de cuerpo entero, 8 semanas con descargas, rangos de
repeticiones, calentamientos y una superserie) está en `scripts/data/plan-ejemplo-backup.json`.

---

## Catálogo de ejercicios (ids válidos para `exerciseId`)

> 892 ejercicios, los que la app ya trae con foto e instrucciones.
>
> **Para la IA:** todo `exerciseId` de un plan debe salir de esta lista. Crea un ejercicio en
> `customExercises` solo si aquí no existe nada equivalente (busca por nombre en español y en
> inglés, y por variantes: barra/mancuerna/máquina/polea, unilateral, inclinado, etc.).
>
> Formato: `id` — nombre en español (nombre en inglés) · cómo se registra · material.

### Índice

- [Pecho](#pecho) · 87
- [Hombros](#hombros) · 130
- [Tríceps](#triceps) · 72
- [Bíceps](#biceps) · 53
- [Antebrazos](#antebrazos) · 25
- [Dorsales](#dorsales) · 40
- [Espalda alta](#espalda-alta) · 34
- [Trapecios](#trapecios) · 15
- [Lumbares](#lumbares) · 27
- [Abdominales](#abdominales) · 97
- [Cuádriceps](#cuadriceps) · 152
- [Isquiotibiales](#isquiotibiales) · 79
- [Glúteos](#gluteos) · 22
- [Gemelos](#gemelos) · 28
- [Abductores](#abductores) · 8
- [Aductores](#aductores) · 13
- [Cuello](#cuello) · 8
- [Cuerpo entero](#cuerpo-entero) · 1
- [Cardio](#cardio) · 1

### Pecho

- `One-Arm_Flat_Bench_Dumbbell_Flye` — Apertura a un brazo en banco plano con mancuerna (One-Arm Flat Bench Dumbbell Flye) · kg×reps · dumbbell
- `Dumbbell_Flyes` — Aperturas con mancuernas (Dumbbell Flyes) · kg×reps · dumbbell
- `Bodyweight_Flyes` — Aperturas con peso corporal (Bodyweight Flyes) · kg×reps · barbell
- `Decline_Dumbbell_Flyes` — Aperturas declinadas con mancuernas (Decline Dumbbell Flyes) · kg×reps · dumbbell
- `Flat_Bench_Cable_Flyes` — Aperturas en polea en banco plano (Flat Bench Cable Flyes) · kg×reps · machine
- `Incline_Dumbbell_Flyes` — Aperturas inclinadas con mancuernas (Incline Dumbbell Flyes) · kg×reps · dumbbell
- `Incline_Dumbbell_Flyes_-_With_A_Twist` — Aperturas inclinadas con mancuernas (con giro) (Incline Dumbbell Flyes - With A Twist) · kg×reps · dumbbell
- `Incline_Cable_Flye` — Aperturas inclinadas en polea (Incline Cable Flye) · kg×reps · machine
- `Forward_Drag_with_Press` — Arrastre hacia adelante con press (Forward Drag with Press) · kg×reps · other
- `Elbows_Back` — Codos atrás (Elbows Back) · tiempo · other
- `Isometric_Chest_Squeezes` — Contracción isométrica de pecho (Isometric Chest Squeezes) · tiempo · none
- `Cable_Crossover` — Cruce de poleas (Cable Crossover) · kg×reps · machine
- `Single-Arm_Cable_Crossover` — Cruce de poleas a un brazo (Single-Arm Cable Crossover) · kg×reps · machine
- `Low_Cable_Crossover` — Cruce de poleas bajo (Low Cable Crossover) · kg×reps · machine
- `Cross_Over_-_With_Bands` — Cruce de poleas con bandas (Cross Over - With Bands) · kg×reps · band
- `Cable_Iron_Cross` — Cruz de hierro en polea (Cable Iron Cross) · kg×reps · machine
- `Front_Raise_And_Pullover` — Elevación frontal y pull-over (Front Raise And Pullover) · kg×reps · barbell
- `Chest_Push_multiple_response` — Empuje de pecho (respuesta múltiple) (Chest Push (multiple response)) · kg×reps · other
- `Chest_Push_single_response` — Empuje de pecho (respuesta única) (Chest Push (single response)) · kg×reps · other
- `Chest_Push_with_Run_Release` — Empuje de pecho con salida en carrera (Chest Push with Run Release) · kg×reps · other
- `Chest_Push_from_3_point_stance` — Empuje de pecho desde posición de tres apoyos (Chest Push from 3 point stance) · kg×reps · other
- `Heavy_Bag_Thrust` — Empuje de saco pesado (Heavy Bag Thrust) · kg×reps · other
- `Behind_Head_Chest_Stretch` — Estiramiento de pecho por detrás de la cabeza (Behind Head Chest Stretch) · tiempo · other
- `Chest_Stretch_on_Stability_Ball` — Estiramiento de pecho sobre fitball (Chest Stretch on Stability Ball) · tiempo · other
- `Chest_And_Front_Of_Shoulder_Stretch` — Estiramiento de pecho y parte anterior del hombro (Chest And Front Of Shoulder Stretch) · tiempo · other
- `Dynamic_Chest_Stretch` — Estiramiento dinámico de pecho (Dynamic Chest Stretch) · tiempo · other
- `Push_Up_to_Side_Plank` — Flexión a plancha lateral (Push Up to Side Plank) · tiempo · none
- `Single-Arm_Push-Up` — Flexión a un brazo (Single-Arm Push-Up) · reps (peso corporal) · none
- `Push-Up_Wide` — Flexión con agarre ancho (Push-Up Wide) · reps (peso corporal) · none
- `Drop_Push` — Flexión con caída (drop push) (Drop Push) · kg×reps · other
- `Decline_Push-Up` — Flexión declinada (Decline Push-Up) · reps (peso corporal) · other
- `Suspended_Push-Up` — Flexión en suspensión (Suspended Push-Up) · kg×reps · other
- `Incline_Push-Up` — Flexión inclinada (Incline Push-Up) · reps (peso corporal) · none
- `Incline_Push-Up_Wide` — Flexión inclinada (agarre ancho) (Incline Push-Up Wide) · reps (peso corporal) · none
- `Incline_Push-Up_Reverse_Grip` — Flexión inclinada (agarre inverso) (Incline Push-Up Reverse Grip) · reps (peso corporal) · none
- `Incline_Push-Up_Medium` — Flexión inclinada (agarre medio) (Incline Push-Up Medium) · reps (peso corporal) · none
- `Incline_Push-Up_Depth_Jump` — Flexión inclinada con salto en profundidad (Incline Push-Up Depth Jump) · kg×reps · other
- `Plyo_Push-up` — Flexión pliométrica (Plyo Push-up) · reps (peso corporal) · none
- `pseudo_planche_pushup` — Flexión pseudo-planche (Pseudo Planche Push-Up) · reps (peso corporal) · none
- `Clock_Push-Up` — Flexión reloj (Clock Push-Up) · reps (peso corporal) · none
- `Pushups` — Flexiones (Pushups) · reps (peso corporal) · none
- `Pushups_Close_and_Wide_Hand_Positions` — Flexiones (posiciones cerrada y ancha de manos) (Pushups (Close and Wide Hand Positions)) · reps (peso corporal) · none
- `Push-Ups_With_Feet_Elevated` — Flexiones con pies elevados (Push-Ups With Feet Elevated) · reps (peso corporal) · none
- `Push-Ups_With_Feet_On_An_Exercise_Ball` — Flexiones con pies sobre fitball (Push-Ups With Feet On An Exercise Ball) · kg×reps · other
- `Plyo_Kettlebell_Pushups` — Flexiones pliométricas con kettlebells (Plyo Kettlebell Pushups) · kg×reps · kettlebell
- `Dips_-_Chest_Version` — Fondos (versión pecho) (Dips - Chest Version) · +kg×reps · other
- `dips_weighted` — Fondos en paralelas (lastrados) (Weighted Dips) · +kg×reps · other
- `Isometric_Wipers` — Limpiaparabrisas isométrico (Isometric Wipers) · tiempo · none
- `Butterfly` — Mariposa (estiramiento) (Butterfly) · kg×reps · machine
- `Medicine_Ball_Chest_Pass` — Pase de pecho con balón medicinal (Medicine Ball Chest Pass) · kg×reps · other
- `Neck_Press` — Press al cuello (Neck Press) · kg×reps · barbell
- `paused_bench_press` — Press banca pausado (Paused Barbell Bench Press) · kg×reps · barbell
- `Chain_Press` — Press con cadenas (Chain Press) · kg×reps · other
- `One_Arm_Dumbbell_Bench_Press` — Press de banca a un brazo con mancuerna (One Arm Dumbbell Bench Press) · kg×reps · dumbbell
- `Bench_Press_-_With_Bands` — Press de banca con bandas (Bench Press - With Bands) · kg×reps · band
- `Wide-Grip_Barbell_Bench_Press` — Press de banca con barra (agarre ancho) (Wide-Grip Barbell Bench Press) · kg×reps · barbell
- `Barbell_Bench_Press_-_Medium_Grip` — Press de banca con barra (agarre medio) (Barbell Bench Press - Medium Grip) · kg×reps · barbell
- `Dumbbell_Bench_Press` — Press de banca con mancuernas (Dumbbell Bench Press) · kg×reps · dumbbell
- `Dumbbell_Bench_Press_with_Neutral_Grip` — Press de banca con mancuernas (agarre neutro) (Dumbbell Bench Press with Neutral Grip) · kg×reps · dumbbell
- `Decline_Barbell_Bench_Press` — Press de banca declinado con barra (Decline Barbell Bench Press) · kg×reps · barbell
- `Wide-Grip_Decline_Barbell_Bench_Press` — Press de banca declinado con barra (agarre ancho) (Wide-Grip Decline Barbell Bench Press) · kg×reps · barbell
- `Decline_Dumbbell_Bench_Press` — Press de banca declinado con mancuernas (Decline Dumbbell Bench Press) · kg×reps · dumbbell
- `Machine_Bench_Press` — Press de banca en máquina (Machine Bench Press) · kg×reps · machine
- `Smith_Machine_Bench_Press` — Press de banca en máquina Smith (Smith Machine Bench Press) · kg×reps · machine
- `Barbell_Guillotine_Bench_Press` — Press de banca guillotina con barra (Barbell Guillotine Bench Press) · kg×reps · barbell
- `Barbell_Incline_Bench_Press_-_Medium_Grip` — Press de banca inclinado con barra (agarre medio) (Barbell Incline Bench Press - Medium Grip) · kg×reps · barbell
- `Smith_Machine_Incline_Bench_Press` — Press de banca inclinado en máquina Smith (Smith Machine Incline Bench Press) · kg×reps · machine
- `Standing_Cable_Chest_Press` — Press de pecho de pie en polea (Standing Cable Chest Press) · kg×reps · machine
- `Leverage_Decline_Chest_Press` — Press de pecho declinado en máquina de palanca (Leverage Decline Chest Press) · tiempo · machine
- `Leverage_Chest_Press` — Press de pecho en máquina de palanca (Leverage Chest Press) · tiempo · machine
- `Cable_Chest_Press` — Press de pecho en polea (Cable Chest Press) · kg×reps · machine
- `Leverage_Incline_Chest_Press` — Press de pecho inclinado en máquina de palanca (Leverage Incline Chest Press) · tiempo · machine
- `Incline_Cable_Chest_Press` — Press de pecho inclinado en polea (Incline Cable Chest Press) · kg×reps · machine
- `One-Arm_Kettlebell_Floor_Press` — Press de suelo a un brazo con kettlebell (One-Arm Kettlebell Floor Press) · kg×reps · kettlebell
- `Extended_Range_One-Arm_Kettlebell_Floor_Press` — Press de suelo a un brazo con kettlebell (rango extendido) (Extended Range One-Arm Kettlebell Floor Press) · kg×reps · kettlebell
- `Alternating_Floor_Press` — Press de suelo alterno (Alternating Floor Press) · kg×reps · kettlebell
- `Leg-Over_Floor_Press` — Press de suelo con pierna cruzada (Leg-Over Floor Press) · kg×reps · kettlebell
- `Decline_Smith_Press` — Press declinado en máquina Smith (Decline Smith Press) · kg×reps · machine
- `Smith_Machine_Decline_Press` — Press declinado en máquina Smith (Smith Machine Decline Press) · kg×reps · machine
- `Incline_Dumbbell_Press` — Press inclinado con mancuernas (Incline Dumbbell Press) · kg×reps · dumbbell
- `Hammer_Grip_Incline_DB_Bench_Press` — Press inclinado con mancuernas (agarre martillo) (Hammer Grip Incline DB Bench Press) · kg×reps · dumbbell
- `Incline_Dumbbell_Bench_With_Palms_Facing_In` — Press inclinado con mancuernas (palmas hacia dentro) (Incline Dumbbell Bench With Palms Facing In) · kg×reps · dumbbell
- `Svend_Press` — Press Svend (Svend Press) · kg×reps · other
- `Bent-Arm_Dumbbell_Pullover` — Pull-over con mancuerna (brazos flexionados) (Bent-Arm Dumbbell Pullover) · kg×reps · dumbbell
- `Straight-Arm_Dumbbell_Pullover` — Pull-over de brazos rectos con mancuerna (Straight-Arm Dumbbell Pullover) · kg×reps · dumbbell
- `Wide-Grip_Decline_Barbell_Pullover` — Pull-over declinado con barra (agarre ancho) (Wide-Grip Decline Barbell Pullover) · kg×reps · barbell
- `Around_The_Worlds` — Vueltas al mundo con mancuerna (Around The Worlds) · kg×reps · dumbbell

### Hombros

- `Band_Pull_Apart` — Apertura de banda (band pull apart) (Band Pull Apart) · kg×reps · band
- `Sled_Reverse_Flye` — Apertura inversa con trineo (Sled Reverse Flye) · kg×reps · other
- `Cable_Rear_Delt_Fly` — Apertura posterior en polea (Cable Rear Delt Fly) · kg×reps · machine
- `Back_Flyes_-_With_Bands` — Aperturas de espalda con bandas (Back Flyes - With Bands) · kg×reps · band
- `Reverse_Flyes` — Aperturas inversas (Reverse Flyes) · kg×reps · dumbbell
- `Reverse_Flyes_With_External_Rotation` — Aperturas inversas con rotación externa (Reverse Flyes With External Rotation) · kg×reps · dumbbell
- `Reverse_Machine_Flyes` — Aperturas inversas en máquina (Reverse Machine Flyes) · kg×reps · machine
- `One-Arm_Kettlebell_Snatch` — Arrancada a un brazo con kettlebell (One-Arm Kettlebell Snatch) · kg×reps · kettlebell
- `Double_Kettlebell_Snatch` — Arrancada con dos kettlebells (Double Kettlebell Snatch) · kg×reps · kettlebell
- `One-Arm_Kettlebell_Split_Snatch` — Arrancada dividida a un brazo con kettlebell (One-Arm Kettlebell Split Snatch) · kg×reps · kettlebell
- `Jerk_Balance` — Balance de envión (Jerk Balance) · kg×reps · barbell
- `Kettlebell_Pirate_Ships` — Barcos pirata con kettlebell (Kettlebell Pirate Ships) · kg×reps · kettlebell
- `Sled_Overhead_Backward_Walk` — Caminata atrás con trineo en alto (Sled Overhead Backward Walk) · tiempo · other
- `Circus_Bell` — Campana de circo (Circus Bell) · kg×reps · other
- `Car_Drivers` — Car drivers (Car Drivers) · kg×reps · barbell
- `Two-Arm_Kettlebell_Clean` — Cargada a dos brazos con kettlebell (Two-Arm Kettlebell Clean) · kg×reps · kettlebell
- `Clean_and_Jerk` — Cargada y envión (Clean and Jerk) · kg×reps · barbell
- `One-Arm_Kettlebell_Clean_and_Jerk` — Cargada y envión a un brazo con kettlebell (One-Arm Kettlebell Clean and Jerk) · kg×reps · kettlebell
- `Clean_and_Press` — Cargada y press (Clean and Press) · kg×reps · barbell
- `Arm_Circles` — Círculos de brazos (Arm Circles) · tiempo · other
- `Elbow_Circles` — Círculos de codo (Elbow Circles) · tiempo · other
- `Shoulder_Circles` — Círculos de hombro (Shoulder Circles) · tiempo · other
- `Crucifix` — Crucifijo (estiramiento) (Crucifix) · kg×reps · other
- `Iron_Cross` — Cruz de hierro (Iron Cross) · kg×reps · dumbbell
- `Battling_Ropes` — Cuerdas de batalla (Battling Ropes) · kg×reps · other
- `Kneeling_Arm_Drill` — Ejercicio de brazos de rodillas (Kneeling Arm Drill) · reps (peso corporal) · other
- `Dumbbell_Raise` — Elevación con mancuerna (Dumbbell Raise) · kg×reps · dumbbell
- `Single_Dumbbell_Raise` — Elevación con una mancuerna (Single Dumbbell Raise) · kg×reps · dumbbell
- `Alternating_Deltoid_Raise` — Elevación de deltoides alterna (Alternating Deltoid Raise) · kg×reps · dumbbell
- `Standing_Low-Pulley_Deltoid_Raise` — Elevación de deltoides de pie en polea baja (Standing Low-Pulley Deltoid Raise) · kg×reps · machine
- `Shoulder_Raise` — Elevación de hombro (Shoulder Raise) · tiempo · other
- `Barbell_Incline_Shoulder_Raise` — Elevación de hombro inclinada con barra (Barbell Incline Shoulder Raise) · kg×reps · barbell
- `Dumbbell_Incline_Shoulder_Raise` — Elevación de hombro inclinada con mancuernas (Dumbbell Incline Shoulder Raise) · kg×reps · dumbbell
- `Smith_Incline_Shoulder_Raise` — Elevación de hombro inclinada en máquina Smith (Smith Incline Shoulder Raise) · kg×reps · barbell
- `Dumbbell_Scaption` — Elevación en el plano escapular con mancuernas (Dumbbell Scaption) · kg×reps · dumbbell
- `Standing_Front_Barbell_Raise_Over_Head` — Elevación frontal con barra por encima de la cabeza de pie (Standing Front Barbell Raise Over Head) · kg×reps · barbell
- `Front_Plate_Raise` — Elevación frontal con disco (Front Plate Raise) · kg×reps · other
- `Front_Two-Dumbbell_Raise` — Elevación frontal con dos mancuernas (Front Two-Dumbbell Raise) · kg×reps · dumbbell
- `Front_Dumbbell_Raise` — Elevación frontal con mancuernas (Front Dumbbell Raise) · kg×reps · dumbbell
- `Standing_Dumbbell_Straight-Arm_Front_Delt_Raise_Above_Head` — Elevación frontal de brazos rectos por encima de la cabeza con mancuernas (Standing Dumbbell Straight-Arm Front Delt Raise Above Head) · kg×reps · dumbbell
- `Front_Cable_Raise` — Elevación frontal en polea (Front Cable Raise) · kg×reps · machine
- `Front_Incline_Dumbbell_Raise` — Elevación frontal inclinada con mancuernas (Front Incline Dumbbell Raise) · kg×reps · dumbbell
- `Side_Lateral_Raise` — Elevación lateral (Side Lateral Raise) · kg×reps · dumbbell
- `Side_Laterals_to_Front_Raise` — Elevación lateral a elevación frontal (Side Laterals to Front Raise) · kg×reps · dumbbell
- `One-Arm_Side_Laterals` — Elevación lateral a un brazo (One-Arm Side Laterals) · kg×reps · dumbbell
- `Lateral_Raise_-_With_Bands` — Elevación lateral con bandas (Lateral Raise - With Bands) · kg×reps · band
- `One-Arm_Incline_Lateral_Raise` — Elevación lateral inclinada a un brazo (One-Arm Incline Lateral Raise) · kg×reps · dumbbell
- `Bent_Over_Low-Pulley_Side_Lateral` — Elevación lateral inclinado en polea baja (Bent Over Low-Pulley Side Lateral) · kg×reps · machine
- `Seated_Side_Lateral_Raise` — Elevación lateral sentado (Seated Side Lateral Raise) · kg×reps · dumbbell
- `Cable_Seated_Lateral_Raise` — Elevación lateral sentado en polea (Cable Seated Lateral Raise) · kg×reps · machine
- `Lying_One-Arm_Lateral_Raise` — Elevación lateral tumbado a un brazo (Lying One-Arm Lateral Raise) · kg×reps · dumbbell
- `Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench` — Elevación posterior con mancuernas apoyando la cabeza en banco (Bent Over Dumbbell Rear Delt Raise With Head On Bench) · kg×reps · dumbbell
- `Seated_Bent-Over_Rear_Delt_Raise` — Elevación posterior sentado inclinado (Seated Bent-Over Rear Delt Raise) · kg×reps · dumbbell
- `Lying_Rear_Delt_Raise` — Elevación posterior tumbado (Lying Rear Delt Raise) · kg×reps · dumbbell
- `Dumbbell_Lying_One-Arm_Rear_Lateral_Raise` — Elevación posterior tumbado a un brazo con mancuerna (Dumbbell Lying One-Arm Rear Lateral Raise) · kg×reps · dumbbell
- `Dumbbell_Lying_Rear_Lateral_Raise` — Elevación posterior tumbado con mancuernas (Dumbbell Lying Rear Lateral Raise) · kg×reps · dumbbell
- `cable_lateral_raise` — Elevaciones laterales en polea (Cable Lateral Raise) · kg×reps · machine
- `Straight_Raises_on_Incline_Bench` — Elevaciones rectas en banco inclinado (Straight Raises on Incline Bench) · kg×reps · barbell
- `Return_Push_from_Stance` — Empuje de retorno desde posición (Return Push from Stance) · kg×reps · other
- `Rack_Delivery` — Entrega desde rack (Rack Delivery) · kg×reps · barbell
- `Two-Arm_Kettlebell_Jerk` — Envión a dos brazos con kettlebell (Two-Arm Kettlebell Jerk) · kg×reps · kettlebell
- `One-Arm_Kettlebell_Jerk` — Envión a un brazo con kettlebell (One-Arm Kettlebell Jerk) · kg×reps · kettlebell
- `Double_Kettlebell_Jerk` — Envión con dos kettlebells (Double Kettlebell Jerk) · kg×reps · kettlebell
- `One-Arm_Kettlebell_Split_Jerk` — Envión dividido a un brazo con kettlebell (One-Arm Kettlebell Split Jerk) · kg×reps · kettlebell
- `Seated_Front_Deltoid` — Estiramiento de deltoide frontal sentado (Seated Front Deltoid) · tiempo · none
- `Shoulder_Stretch` — Estiramiento de hombro (Shoulder Stretch) · tiempo · other
- `Round_The_World_Shoulder_Stretch` — Estiramiento de hombro vuelta al mundo (Round The World Shoulder Stretch) · tiempo · other
- `Chair_Upper_Body_Stretch` — Estiramiento de tren superior en silla (Chair Upper Body Stretch) · tiempo · other
- `Upward_Stretch` — Estiramiento hacia arriba (Upward Stretch) · tiempo · other
- `Face_Pull` — Face pull (Face Pull) · kg×reps · machine
- `Handstand_Push-Ups` — Flexiones en pino (Handstand Push-Ups) · tiempo · none
- `Landmine_Linear_Jammer` — Landmine jammer lineal (Landmine Linear Jammer) · kg×reps · barbell
- `Single-Arm_Linear_Jammer` — Landmine jammer lineal a un brazo (Single-Arm Linear Jammer) · kg×reps · barbell
- `Standing_Two-Arm_Overhead_Throw` — Lanzamiento a dos brazos por encima de la cabeza de pie (Standing Two-Arm Overhead Throw) · kg×reps · other
- `Backward_Medicine_Ball_Throw` — Lanzamiento de balón medicinal hacia atrás (Backward Medicine Ball Throw) · kg×reps · other
- `Medicine_Ball_Scoop_Throw` — Lanzamiento en cuchara con balón medicinal (Medicine Ball Scoop Throw) · kg×reps · other
- `Log_Lift` — Levantamiento de tronco (log lift) (Log Lift) · kg×reps · other
- `One-Arm_Kettlebell_Para_Press` — Para press a un brazo con kettlebell (One-Arm Kettlebell Para Press) · kg×reps · kettlebell
- `Power_Partials` — Parciales de potencia (Power Partials) · kg×reps · dumbbell
- `pike_pushup` — Pike push-up (Pike Push-Up) · reps (peso corporal) · none
- `handstand_wall` — Pino (pared o barra) (Handstand Hold (Wall or Bar)) · tiempo · none
- `Standing_Palm-In_One-Arm_Dumbbell_Press` — Press a un brazo de pie con mancuerna (palma hacia dentro) (Standing Palm-In One-Arm Dumbbell Press) · kg×reps · dumbbell
- `Alternating_Kettlebell_Press` — Press alterno con kettlebell (Alternating Kettlebell Press) · kg×reps · kettlebell
- `Standing_Alternating_Dumbbell_Press` — Press alterno de pie con mancuernas (Standing Alternating Dumbbell Press) · kg×reps · dumbbell
- `Anti-Gravity_Press` — Press antigravedad (Anti-Gravity Press) · kg×reps · barbell
- `Kettlebell_Arnold_Press` — Press Arnold con kettlebell (Kettlebell Arnold Press) · kg×reps · kettlebell
- `Arnold_Dumbbell_Press` — Press Arnold con mancuernas (Arnold Dumbbell Press) · kg×reps · dumbbell
- `See-Saw_Press_Alternating_Side_Press` — Press balancín alterno (See-Saw Press (Alternating Side Press)) · kg×reps · dumbbell
- `Kettlebell_Seesaw_Press` — Press balancín con kettlebell (Kettlebell Seesaw Press) · kg×reps · kettlebell
- `Standing_Bradford_Press` — Press Bradford de pie (Standing Bradford Press) · kg×reps · barbell
- `Bradford_Rocky_Presses` — Press Bradford/Rocky (Bradford/Rocky Presses) · kg×reps · barbell
- `Standing_Barbell_Press_Behind_Neck` — Press con barra tras nuca de pie (Standing Barbell Press Behind Neck) · kg×reps · barbell
- `Cuban_Press` — Press cubano (Cuban Press) · kg×reps · dumbbell
- `Dumbbell_One-Arm_Shoulder_Press` — Press de hombro a un brazo con mancuerna (Dumbbell One-Arm Shoulder Press) · kg×reps · dumbbell
- `Alternating_Cable_Shoulder_Press` — Press de hombro alterno en polea (Alternating Cable Shoulder Press) · kg×reps · machine
- `Shoulder_Press_-_With_Bands` — Press de hombro con bandas (Shoulder Press - With Bands) · kg×reps · band
- `Barbell_Shoulder_Press` — Press de hombro con barra (Barbell Shoulder Press) · kg×reps · barbell
- `Dumbbell_Shoulder_Press` — Press de hombro con mancuernas (Dumbbell Shoulder Press) · kg×reps · dumbbell
- `Smith_Machine_Overhead_Shoulder_Press` — Press de hombro en alto en máquina Smith (Smith Machine Overhead Shoulder Press) · kg×reps · machine
- `Leverage_Shoulder_Press` — Press de hombro en máquina de palanca (Leverage Shoulder Press) · tiempo · machine
- `Cable_Shoulder_Press` — Press de hombro en polea (Cable Shoulder Press) · kg×reps · machine
- `Seated_Cable_Shoulder_Press` — Press de hombro sentado en polea (Seated Cable Shoulder Press) · kg×reps · machine
- `Standing_Dumbbell_Press` — Press de pie con mancuernas (Standing Dumbbell Press) · kg×reps · dumbbell
- `Standing_Palms-In_Dumbbell_Press` — Press de pie con mancuernas (palmas hacia dentro) (Standing Palms-In Dumbbell Press) · kg×reps · dumbbell
- `Two-Arm_Kettlebell_Military_Press` — Press militar a dos brazos con kettlebell (Two-Arm Kettlebell Military Press) · kg×reps · kettlebell
- `Machine_Shoulder_Military_Press` — Press militar de hombro en máquina (Machine Shoulder (Military) Press) · kg×reps · machine
- `Standing_Military_Press` — Press militar de pie (Standing Military Press) · kg×reps · barbell
- `One-Arm_Kettlebell_Military_Press_To_The_Side` — Press militar lateral a un brazo con kettlebell (One-Arm Kettlebell Military Press To The Side) · kg×reps · kettlebell
- `Seated_Barbell_Military_Press` — Press militar sentado con barra (Seated Barbell Military Press) · kg×reps · barbell
- `Kettlebell_Seated_Press` — Press sentado con kettlebell (Kettlebell Seated Press) · kg×reps · kettlebell
- `Seated_Dumbbell_Press` — Press sentado con mancuernas (Seated Dumbbell Press) · kg×reps · dumbbell
- `Push_Press` — Push press (Push Press) · kg×reps · barbell
- `One-Arm_Kettlebell_Push_Press` — Push press a un brazo con kettlebell (One-Arm Kettlebell Push Press) · kg×reps · kettlebell
- `Double_Kettlebell_Push_Press` — Push press con dos kettlebells (Double Kettlebell Push Press) · kg×reps · kettlebell
- `Push_Press_-_Behind_the_Neck` — Push press tras nuca (Push Press - Behind the Neck) · kg×reps · barbell
- `Low_Pulley_Row_To_Neck` — Remo al cuello en polea baja (Low Pulley Row To Neck) · kg×reps · machine
- `Dumbbell_One-Arm_Upright_Row` — Remo al mentón a un brazo con mancuerna (Dumbbell One-Arm Upright Row) · kg×reps · dumbbell
- `Smith_Machine_One-Arm_Upright_Row` — Remo al mentón a un brazo en máquina Smith (Smith Machine One-Arm Upright Row) · kg×reps · machine
- `Upright_Barbell_Row` — Remo al mentón con barra (Upright Barbell Row) · kg×reps · barbell
- `Barbell_Rear_Delt_Row` — Remo para deltoide posterior con barra (Barbell Rear Delt Row) · kg×reps · barbell
- `Cable_Rope_Rear-Delt_Rows` — Remo para deltoide posterior con cuerda en polea (Cable Rope Rear-Delt Rows) · kg×reps · machine
- `External_Rotation` — Rotación externa de hombro (External Rotation) · kg×reps · dumbbell
- `External_Rotation_with_Band` — Rotación externa de hombro con banda (External Rotation with Band) · kg×reps · band
- `External_Rotation_with_Cable` — Rotación externa de hombro en polea (External Rotation with Cable) · kg×reps · machine
- `Internal_Rotation_with_Band` — Rotación interna de hombro con banda (Internal Rotation with Band) · kg×reps · band
- `Cable_Internal_Rotation` — Rotación interna de hombro en polea (Cable Internal Rotation) · kg×reps · machine
- `Kettlebell_Thruster` — Thruster con kettlebell (Kettlebell Thruster) · kg×reps · kettlebell
- `Side_Wrist_Pull` — Tirón de muñeca lateral (Side Wrist Pull) · tiempo · other
- `Kettlebell_Turkish_Get-Up_Squat_style` — Turkish get-up con kettlebell (estilo sentadilla) (Kettlebell Turkish Get-Up (Squat style)) · kg×reps · kettlebell
- `Kettlebell_Turkish_Get-Up_Lunge_style` — Turkish get-up con kettlebell (estilo zancada) (Kettlebell Turkish Get-Up (Lunge style)) · kg×reps · kettlebell

### Tríceps

- `Body-Up` — Body-up (Body-Up) · reps (peso corporal) · none
- `Triceps_Stretch` — Estiramiento de tríceps (Triceps Stretch) · tiempo · other
- `Overhead_Triceps` — Estiramiento de tríceps por encima de la cabeza (Overhead Triceps) · tiempo · none
- `Tricep_Side_Stretch` — Estiramiento lateral de tríceps (Tricep Side Stretch) · tiempo · other
- `Chain_Handle_Extension` — Extensión con asa de cadena (Chain Handle Extension) · kg×reps · other
- `Dumbbell_One-Arm_Triceps_Extension` — Extensión de tríceps a un brazo con mancuerna (Dumbbell One-Arm Triceps Extension) · kg×reps · dumbbell
- `One_Arm_Pronated_Dumbbell_Triceps_Extension` — Extensión de tríceps a un brazo con mancuerna (pronado) (One Arm Pronated Dumbbell Triceps Extension) · kg×reps · dumbbell
- `One_Arm_Supinated_Dumbbell_Triceps_Extension` — Extensión de tríceps a un brazo con mancuerna (supinado) (One Arm Supinated Dumbbell Triceps Extension) · kg×reps · dumbbell
- `Standing_One-Arm_Dumbbell_Triceps_Extension` — Extensión de tríceps a un brazo de pie con mancuerna (Standing One-Arm Dumbbell Triceps Extension) · kg×reps · dumbbell
- `Standing_Low-Pulley_One-Arm_Triceps_Extension` — Extensión de tríceps a un brazo de pie en polea baja (Standing Low-Pulley One-Arm Triceps Extension) · kg×reps · machine
- `Cable_One_Arm_Tricep_Extension` — Extensión de tríceps a un brazo en polea (Cable One Arm Tricep Extension) · kg×reps · machine
- `Standing_Overhead_Barbell_Triceps_Extension` — Extensión de tríceps con barra por encima de la cabeza de pie (Standing Overhead Barbell Triceps Extension) · kg×reps · barbell
- `Dumbbell_Tricep_Extension_-Pronated_Grip` — Extensión de tríceps con mancuerna (agarre pronado) (Dumbbell Tricep Extension -Pronated Grip) · kg×reps · dumbbell
- `Standing_Towel_Triceps_Extension` — Extensión de tríceps con toalla de pie (Standing Towel Triceps Extension) · reps (peso corporal) · none
- `Sled_Overhead_Triceps_Extension` — Extensión de tríceps con trineo en alto (Sled Overhead Triceps Extension) · kg×reps · other
- `Standing_Dumbbell_Triceps_Extension` — Extensión de tríceps de pie con mancuerna (Standing Dumbbell Triceps Extension) · kg×reps · dumbbell
- `Standing_Bent-Over_Two-Arm_Dumbbell_Triceps_Extension` — Extensión de tríceps de pie inclinado a dos brazos con mancuernas (Standing Bent-Over Two-Arm Dumbbell Triceps Extension) · kg×reps · dumbbell
- `Standing_Bent-Over_One-Arm_Dumbbell_Triceps_Extension` — Extensión de tríceps de pie inclinado a un brazo con mancuerna (Standing Bent-Over One-Arm Dumbbell Triceps Extension) · kg×reps · dumbbell
- `Decline_EZ_Bar_Triceps_Extension` — Extensión de tríceps declinado con barra Z (Decline EZ Bar Triceps Extension) · kg×reps · barbell
- `Decline_Dumbbell_Triceps_Extension` — Extensión de tríceps declinado con mancuerna (Decline Dumbbell Triceps Extension) · kg×reps · dumbbell
- `Machine_Triceps_Extension` — Extensión de tríceps en máquina (Machine Triceps Extension) · kg×reps · machine
- `Triceps_Pushdown` — Extensión de tríceps en polea (Triceps Pushdown) · kg×reps · machine
- `Reverse_Grip_Triceps_Pushdown` — Extensión de tríceps en polea (agarre inverso) (Reverse Grip Triceps Pushdown) · kg×reps · machine
- `Cable_Incline_Triceps_Extension` — Extensión de tríceps en polea (inclinado) (Cable Incline Triceps Extension) · kg×reps · machine
- `Low_Cable_Triceps_Extension` — Extensión de tríceps en polea baja (Low Cable Triceps Extension) · kg×reps · machine
- `Triceps_Pushdown_-_V-Bar_Attachment` — Extensión de tríceps en polea con barra V (Triceps Pushdown - V-Bar Attachment) · kg×reps · machine
- `Triceps_Pushdown_-_Rope_Attachment` — Extensión de tríceps en polea con cuerda (Triceps Pushdown - Rope Attachment) · kg×reps · machine
- `Kneeling_Cable_Triceps_Extension` — Extensión de tríceps en polea de rodillas (Kneeling Cable Triceps Extension) · kg×reps · machine
- `Cable_Lying_Triceps_Extension` — Extensión de tríceps en polea tumbado (Cable Lying Triceps Extension) · kg×reps · machine
- `Incline_Barbell_Triceps_Extension` — Extensión de tríceps inclinado con barra (Incline Barbell Triceps Extension) · kg×reps · barbell
- `Triceps_Overhead_Extension_with_Rope` — Extensión de tríceps por encima de la cabeza con cuerda (Triceps Overhead Extension with Rope) · kg×reps · machine
- `Cable_Rope_Overhead_Triceps_Extension` — Extensión de tríceps por encima de la cabeza con cuerda en polea (Cable Rope Overhead Triceps Extension) · kg×reps · machine
- `Seated_Bent-Over_Two-Arm_Dumbbell_Triceps_Extension` — Extensión de tríceps sentado inclinado a dos brazos con mancuernas (Seated Bent-Over Two-Arm Dumbbell Triceps Extension) · kg×reps · dumbbell
- `Seated_Bent-Over_One-Arm_Dumbbell_Triceps_Extension` — Extensión de tríceps sentado inclinado a un brazo con mancuerna (Seated Bent-Over One-Arm Dumbbell Triceps Extension) · kg×reps · dumbbell
- `Lying_Dumbbell_Tricep_Extension` — Extensión de tríceps tumbado con mancuerna (Lying Dumbbell Tricep Extension) · kg×reps · dumbbell
- `Lying_Close-Grip_Barbell_Triceps_Extension_Behind_The_Head` — Extensión de tríceps tumbado tras la nuca (agarre cerrado) (Lying Close-Grip Barbell Triceps Extension Behind The Head) · kg×reps · barbell
- `katana_triceps_extension` — Extensión katana en polea (Katana Cable Triceps Extension) · kg×reps · machine
- `Close-Grip_Push-Up_off_of_a_Dumbbell` — Flexión con agarre cerrado sobre mancuerna (Close-Grip Push-Up off of a Dumbbell) · reps (peso corporal) · none
- `Incline_Push-Up_Close-Grip` — Flexión inclinada (agarre cerrado) (Incline Push-Up Close-Grip) · reps (peso corporal) · none
- `Push-Ups_-_Close_Triceps_Position` — Flexiones en posición cerrada para tríceps (Push-Ups - Close Triceps Position) · reps (peso corporal) · none
- `Dips_-_Triceps_Version` — Fondos (versión tríceps) (Dips - Triceps Version) · +kg×reps · none
- `Ring_Dips` — Fondos en anillas (Ring Dips) · +kg×reps · other
- `Bench_Dips` — Fondos en banco (Bench Dips) · +kg×reps · none
- `Weighted_Bench_Dip` — Fondos en banco con peso (Weighted Bench Dip) · +kg×reps · other
- `Dip_Machine` — Fondos en máquina (Dip Machine) · kg×reps · machine
- `Parallel_Bar_Dip` — Fondos en paralelas (Parallel Bar Dip) · +kg×reps · other
- `Supine_Chest_Throw` — Lanzamiento de pecho tumbado boca arriba (Supine Chest Throw) · kg×reps · other
- `Tricep_Dumbbell_Kickback` — Patada de tríceps con mancuerna (Tricep Dumbbell Kickback) · kg×reps · dumbbell
- `Close-Grip_EZ-Bar_Press` — Press con barra Z (agarre cerrado) (Close-Grip EZ-Bar Press) · kg×reps · barbell
- `Close-Grip_Dumbbell_Press` — Press con mancuernas (agarre cerrado) (Close-Grip Dumbbell Press) · kg×reps · dumbbell
- `Board_Press` — Press con tablas (Board Press) · kg×reps · barbell
- `Bench_Press_-_Powerlifting` — Press de banca (powerlifting) (Bench Press - Powerlifting) · kg×reps · barbell
- `Reverse_Band_Bench_Press` — Press de banca con banda inversa (Reverse Band Bench Press) · kg×reps · barbell
- `Close-Grip_Barbell_Bench_Press` — Press de banca con barra (agarre cerrado) (Close-Grip Barbell Bench Press) · kg×reps · barbell
- `Bench_Press_with_Chains` — Press de banca con cadenas (Bench Press with Chains) · kg×reps · barbell
- `Smith_Machine_Close-Grip_Bench_Press` — Press de banca en máquina Smith (agarre cerrado) (Smith Machine Close-Grip Bench Press) · kg×reps · machine
- `Reverse_Triceps_Bench_Press` — Press de banca inverso para tríceps (Reverse Triceps Bench Press) · kg×reps · barbell
- `Floor_Press` — Press de suelo (Floor Press) · kg×reps · barbell
- `One_Arm_Floor_Press` — Press de suelo a un brazo (One Arm Floor Press) · kg×reps · barbell
- `Floor_Press_with_Chains` — Press de suelo con cadenas (Floor Press with Chains) · kg×reps · barbell
- `Dumbbell_Floor_Press` — Press de suelo con mancuernas (Dumbbell Floor Press) · kg×reps · dumbbell
- `Body_Tricep_Press` — Press de tríceps con el cuerpo (Body Tricep Press) · reps (peso corporal) · none
- `Seated_Triceps_Press` — Press de tríceps sentado (Seated Triceps Press) · kg×reps · dumbbell
- `Lying_Triceps_Press` — Press de tríceps tumbado (Lying Triceps Press) · kg×reps · barbell
- `Lying_Close-Grip_Barbell_Triceps_Press_To_Chin` — Press de tríceps tumbado al mentón (agarre cerrado) (Lying Close-Grip Barbell Triceps Press To Chin) · +kg×reps · barbell
- `Decline_Close-Grip_Bench_To_Skull_Crusher` — Press declinado agarre cerrado a press francés (Decline Close-Grip Bench To Skull Crusher) · kg×reps · barbell
- `Pin_Presses` — Press desde pines (Pin Presses) · kg×reps · barbell
- `Band_Skull_Crusher` — Press francés con banda (Band Skull Crusher) · kg×reps · band
- `EZ-Bar_Skullcrusher` — Press francés con barra Z (EZ-Bar Skullcrusher) · kg×reps · barbell
- `JM_Press` — Press JM (JM Press) · kg×reps · barbell
- `Tate_Press` — Press Tate (Tate Press) · kg×reps · dumbbell
- `Speed_Band_Overhead_Triceps` — Tríceps en alto con banda de velocidad (Speed Band Overhead Triceps) · kg×reps · band

### Bíceps

- `Standing_One-Arm_Dumbbell_Curl_Over_Incline_Bench` — Curl a un brazo de pie con mancuerna sobre banco inclinado (Standing One-Arm Dumbbell Curl Over Incline Bench) · kg×reps · dumbbell
- `Spider_Curl` — Curl araña (Spider Curl) · kg×reps · barbell
- `Barbell_Curl` — Curl con barra (Barbell Curl) · kg×reps · barbell
- `Wide-Grip_Standing_Barbell_Curl` — Curl con barra de pie (agarre ancho) (Wide-Grip Standing Barbell Curl) · kg×reps · barbell
- `Close-Grip_Standing_Barbell_Curl` — Curl con barra de pie (agarre cerrado) (Close-Grip Standing Barbell Curl) · kg×reps · barbell
- `Lying_High_Bench_Barbell_Curl` — Curl con barra tumbado en banco alto (Lying High Bench Barbell Curl) · kg×reps · barbell
- `Barbell_Curls_Lying_Against_An_Incline` — Curl con barra tumbado en banco inclinado (Barbell Curls Lying Against An Incline) · kg×reps · barbell
- `EZ-Bar_Curl` — Curl con barra Z (EZ-Bar Curl) · kg×reps · barbell
- `Close-Grip_EZ_Bar_Curl` — Curl con barra Z (agarre cerrado) (Close-Grip EZ Bar Curl) · kg×reps · barbell
- `Close-Grip_EZ-Bar_Curl_with_Band` — Curl con barra Z (agarre cerrado) y banda (Close-Grip EZ-Bar Curl with Band) · kg×reps · barbell
- `Seated_Dumbbell_Curl` — Curl con mancuernas sentado (Seated Dumbbell Curl) · kg×reps · dumbbell
- `Lying_Supine_Dumbbell_Curl` — Curl con mancuernas tumbado supino (Lying Supine Dumbbell Curl) · kg×reps · dumbbell
- `Drag_Curl` — Curl de arrastre (drag curl) (Drag Curl) · kg×reps · barbell
- `Standing_One-Arm_Cable_Curl` — Curl de bíceps a un brazo de pie en polea (Standing One-Arm Cable Curl) · kg×reps · machine
- `Dumbbell_Alternate_Bicep_Curl` — Curl de bíceps alterno con mancuernas (Dumbbell Alternate Bicep Curl) · kg×reps · dumbbell
- `Dumbbell_Bicep_Curl` — Curl de bíceps con mancuernas (Dumbbell Bicep Curl) · kg×reps · dumbbell
- `Standing_Biceps_Cable_Curl` — Curl de bíceps de pie en polea (Standing Biceps Cable Curl) · kg×reps · machine
- `Machine_Bicep_Curl` — Curl de bíceps en máquina (Machine Bicep Curl) · kg×reps · machine
- `High_Cable_Curls` — Curl de bíceps en polea alta (High Cable Curls) · kg×reps · machine
- `Standing_Inner-Biceps_Curl` — Curl de bíceps interno de pie (Standing Inner-Biceps Curl) · kg×reps · dumbbell
- `Incline_Inner_Biceps_Curl` — Curl de bíceps interno inclinado (Incline Inner Biceps Curl) · kg×reps · dumbbell
- `Seated_Dumbbell_Inner_Biceps_Curl` — Curl de bíceps interno sentado con mancuerna (Seated Dumbbell Inner Biceps Curl) · kg×reps · dumbbell
- `Overhead_Cable_Curl` — Curl de bíceps por encima de la cabeza en polea (Overhead Cable Curl) · kg×reps · machine
- `Lying_Cable_Curl` — Curl de bíceps tumbado en polea (Lying Cable Curl) · kg×reps · machine
- `Concentration_Curls` — Curl de concentración (Concentration Curls) · kg×reps · dumbbell
- `Standing_Concentration_Curl` — Curl de concentración de pie (Standing Concentration Curl) · kg×reps · dumbbell
- `Seated_Close-Grip_Concentration_Barbell_Curl` — Curl de concentración sentado con barra (agarre cerrado) (Seated Close-Grip Concentration Barbell Curl) · kg×reps · barbell
- `Flexor_Incline_Dumbbell_Curls` — Curl flexor inclinado con mancuernas (Flexor Incline Dumbbell Curls) · kg×reps · dumbbell
- `Alternate_Incline_Dumbbell_Curl` — Curl inclinado alterno con mancuernas (Alternate Incline Dumbbell Curl) · kg×reps · dumbbell
- `Incline_Dumbbell_Curl` — Curl inclinado con mancuernas (Incline Dumbbell Curl) · kg×reps · dumbbell
- `Dumbbell_Prone_Incline_Curl` — Curl inclinado en banco prono con mancuernas (Dumbbell Prone Incline Curl) · kg×reps · dumbbell
- `Reverse_Barbell_Curl` — Curl inverso con barra (Reverse Barbell Curl) · kg×reps · barbell
- `Reverse_Plate_Curls` — Curl inverso con disco (Reverse Plate Curls) · kg×reps · other
- `Standing_Dumbbell_Reverse_Curl` — Curl inverso de pie con mancuernas (Standing Dumbbell Reverse Curl) · kg×reps · dumbbell
- `Reverse_Cable_Curl` — Curl inverso en polea (Reverse Cable Curl) · kg×reps · machine
- `Hammer_Curls` — Curl martillo (Hammer Curls) · kg×reps · dumbbell
- `Alternate_Hammer_Curl` — Curl martillo alterno (Alternate Hammer Curl) · kg×reps · dumbbell
- `Cross_Body_Hammer_Curl` — Curl martillo cruzado (Cross Body Hammer Curl) · kg×reps · dumbbell
- `Cable_Hammer_Curls_-_Rope_Attachment` — Curl martillo en polea con cuerda (Cable Hammer Curls - Rope Attachment) · kg×reps · machine
- `Incline_Hammer_Curls` — Curl martillo inclinado (Incline Hammer Curls) · kg×reps · dumbbell
- `Preacher_Hammer_Dumbbell_Curl` — Curl martillo predicador con mancuerna (Preacher Hammer Dumbbell Curl) · kg×reps · dumbbell
- `Preacher_Curl` — Curl predicador (Preacher Curl) · kg×reps · barbell
- `Two-Arm_Dumbbell_Preacher_Curl` — Curl predicador a dos brazos con mancuernas (Two-Arm Dumbbell Preacher Curl) · kg×reps · dumbbell
- `One_Arm_Dumbbell_Preacher_Curl` — Curl predicador a un brazo con mancuerna (One Arm Dumbbell Preacher Curl) · kg×reps · dumbbell
- `Machine_Preacher_Curls` — Curl predicador en máquina (Machine Preacher Curls) · kg×reps · machine
- `Cable_Preacher_Curl` — Curl predicador en polea (Cable Preacher Curl) · kg×reps · machine
- `Reverse_Barbell_Preacher_Curls` — Curl predicador inverso con barra (Reverse Barbell Preacher Curls) · kg×reps · barbell
- `Zottman_Preacher_Curl` — Curl predicador Zottman (Zottman Preacher Curl) · kg×reps · dumbbell
- `Lying_Close-Grip_Bar_Curl_On_High_Pulley` — Curl tumbado con barra en polea alta (agarre cerrado) (Lying Close-Grip Bar Curl On High Pulley) · kg×reps · machine
- `Zottman_Curl` — Curl Zottman (Zottman Curl) · kg×reps · dumbbell
- `Standing_Biceps_Stretch` — Estiramiento de bíceps de pie (Standing Biceps Stretch) · tiempo · other
- `Seated_Biceps` — Estiramiento de bíceps sentado (Seated Biceps) · tiempo · none
- `Brachialis-SMR` — Liberación miofascial del braquial (Brachialis-SMR) · tiempo · other

### Antebrazos

- `Standing_Olympic_Plate_Hand_Squeeze` — Apretón de disco olímpico de pie (Standing Olympic Plate Hand Squeeze) · kg×reps · other
- `Bottoms-Up_Clean_From_The_Hang_Position` — Cargada bottoms-up desde posición colgada (Bottoms-Up Clean From The Hang Position) · tiempo · kettlebell
- `Rickshaw_Carry` — Carry con rickshaw (Rickshaw Carry) · tiempo · other
- `Wrist_Circles` — Círculos de muñeca (Wrist Circles) · tiempo · none
- `Finger_Curls` — Curl de dedos (Finger Curls) · kg×reps · barbell
- `Cable_Wrist_Curl` — Curl de muñeca en polea (Cable Wrist Curl) · kg×reps · machine
- `Palms-Down_Dumbbell_Wrist_Curl_Over_A_Bench` — Curl de muñeca prono con mancuerna sobre banco (Palms-Down Dumbbell Wrist Curl Over A Bench) · kg×reps · dumbbell
- `Palms-Down_Wrist_Curl_Over_A_Bench` — Curl de muñeca prono sobre banco (Palms-Down Wrist Curl Over A Bench) · kg×reps · barbell
- `Seated_Two-Arm_Palms-Up_Low-Pulley_Wrist_Curl` — Curl de muñeca sentado a dos brazos en polea baja (supino) (Seated Two-Arm Palms-Up Low-Pulley Wrist Curl) · kg×reps · machine
- `Seated_One-Arm_Dumbbell_Palms-Down_Wrist_Curl` — Curl de muñeca sentado a un brazo con mancuerna (prono) (Seated One-Arm Dumbbell Palms-Down Wrist Curl) · kg×reps · dumbbell
- `Seated_One-Arm_Dumbbell_Palms-Up_Wrist_Curl` — Curl de muñeca sentado a un brazo con mancuerna (supino) (Seated One-Arm Dumbbell Palms-Up Wrist Curl) · kg×reps · dumbbell
- `Seated_Palms-Down_Barbell_Wrist_Curl` — Curl de muñeca sentado con barra (prono) (Seated Palms-Down Barbell Wrist Curl) · kg×reps · barbell
- `Seated_Palm-Up_Barbell_Wrist_Curl` — Curl de muñeca sentado con barra (supino) (Seated Palm-Up Barbell Wrist Curl) · kg×reps · barbell
- `Seated_Dumbbell_Palms-Down_Wrist_Curl` — Curl de muñeca sentado con mancuerna (prono) (Seated Dumbbell Palms-Down Wrist Curl) · kg×reps · dumbbell
- `Seated_Dumbbell_Palms-Up_Wrist_Curl` — Curl de muñeca sentado con mancuerna (supino) (Seated Dumbbell Palms-Up Wrist Curl) · kg×reps · dumbbell
- `Palms-Up_Barbell_Wrist_Curl_Over_A_Bench` — Curl de muñeca supino con barra sobre banco (Palms-Up Barbell Wrist Curl Over A Bench) · kg×reps · barbell
- `Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench` — Curl de muñeca supino con mancuerna sobre banco (Palms-Up Dumbbell Wrist Curl Over A Bench) · kg×reps · dumbbell
- `Standing_Palms-Up_Barbell_Behind_The_Back_Wrist_Curl` — Curl de muñeca tras la espalda de pie con barra (supino) (Standing Palms-Up Barbell Behind The Back Wrist Curl) · kg×reps · barbell
- `Kneeling_Forearm_Stretch` — Estiramiento de antebrazo de rodillas (Kneeling Forearm Stretch) · tiempo · other
- `Farmers_Walk` — Paseo del granjero (Farmer's Walk) · tiempo · other
- `Plate_Pinch` — Pinza de discos (Plate Pinch) · kg×reps · other
- `Dumbbell_Lying_Pronation` — Pronación tumbado con mancuerna (Dumbbell Lying Pronation) · kg×reps · dumbbell
- `Wrist_Roller` — Rodillo de muñeca (Wrist Roller) · kg×reps · other
- `Wrist_Rotations_with_Straight_Bar` — Rotaciones de muñeca con barra recta (Wrist Rotations with Straight Bar) · kg×reps · barbell
- `Dumbbell_Lying_Supination` — Supinación tumbado con mancuerna (Dumbbell Lying Supination) · kg×reps · dumbbell

### Dorsales

- `One_Handed_Hang` — Colgado a una mano (One Handed Hang) · tiempo · other
- `V-Bar_Pullup` — Dominada con barra V (V-Bar Pullup) · +kg×reps · none
- `explosive_pullup` — Dominada explosiva al pecho (Explosive Pull-Up (Chest to Bar)) · +kg×reps · none
- `Wide-Grip_Rear_Pull-Up` — Dominada tras nuca (agarre ancho) (Wide-Grip Rear Pull-Up) · +kg×reps · none
- `Pullups` — Dominadas (Pullups) · +kg×reps · none
- `Gironda_Sternum_Chins` — Dominadas al esternón Gironda (Gironda Sternum Chins) · +kg×reps · other
- `Band_Assisted_Pull-Up` — Dominadas asistidas con banda (Band Assisted Pull-Up) · −kg×reps · other
- `Weighted_Pull_Ups` — Dominadas con peso (Weighted Pull Ups) · +kg×reps · other
- `Side_To_Side_Chins` — Dominadas de lado a lado (Side To Side Chins) · +kg×reps · other
- `Chin-Up` — Dominadas supinas (Chin-Up) · +kg×reps · none
- `Rocky_Pull-Ups_Pulldowns` — Dominadas/jalones Rocky (Rocky Pull-Ups/Pulldowns) · +kg×reps · other
- `Overhead_Lat` — Estiramiento de dorsal por encima de la cabeza (Overhead Lat) · tiempo · other
- `Side-Lying_Floor_Stretch` — Estiramiento de lado en el suelo (Side-Lying Floor Stretch) · tiempo · other
- `Dynamic_Back_Stretch` — Estiramiento dinámico de espalda (Dynamic Back Stretch) · tiempo · other
- `Chair_Lower_Back_Stretch` — Estiramiento lumbar en silla (Chair Lower Back Stretch) · tiempo · other
- `Cable_Incline_Pushdown` — Extensión de tríceps en polea inclinado (Cable Incline Pushdown) · kg×reps · machine
- `front_lever_tuck` — Front lever tuck (Tuck Front Lever) · tiempo · none
- `Overhead_Slam` — Golpe al suelo por encima de la cabeza (Overhead Slam) · kg×reps · other
- `Wide-Grip_Lat_Pulldown` — Jalón al pecho (agarre ancho) (Wide-Grip Lat Pulldown) · kg×reps · machine
- `Close-Grip_Front_Lat_Pulldown` — Jalón al pecho (agarre cerrado) (Close-Grip Front Lat Pulldown) · kg×reps · machine
- `One_Arm_Lat_Pulldown` — Jalón al pecho a un brazo (One Arm Lat Pulldown) · kg×reps · machine
- `V-Bar_Pulldown` — Jalón al pecho con barra V (V-Bar Pulldown) · kg×reps · machine
- `Full_Range-Of-Motion_Lat_Pulldown` — Jalón al pecho con rango completo (Full Range-Of-Motion Lat Pulldown) · kg×reps · machine
- `Straight-Arm_Pulldown` — Jalón de brazos rectos (Straight-Arm Pulldown) · kg×reps · machine
- `Rope_Straight-Arm_Pulldown` — Jalón de brazos rectos con cuerda (Rope Straight-Arm Pulldown) · kg×reps · machine
- `Underhand_Cable_Pulldowns` — Jalón en polea agarre supino (Underhand Cable Pulldowns) · kg×reps · machine
- `Wide-Grip_Pulldown_Behind_The_Neck` — Jalón tras nuca (agarre ancho) (Wide-Grip Pulldown Behind The Neck) · kg×reps · machine
- `Latissimus_Dorsi-SMR` — Liberación miofascial del dorsal ancho (Latissimus Dorsi-SMR) · tiempo · other
- `London_Bridges` — London bridges (London Bridges) · tiempo · other
- `Muscle_Up` — Muscle up (Muscle Up) · +kg×reps · other
- `Kipping_Muscle_Up` — Muscle up con kipping (Kipping Muscle Up) · +kg×reps · other
- `Bent-Arm_Barbell_Pullover` — Pull-over con barra (brazos flexionados) (Bent-Arm Barbell Pullover) · kg×reps · barbell
- `Catch_and_Overhead_Throw` — Recepción y lanzamiento por encima de la cabeza (Catch and Overhead Throw) · kg×reps · other
- `Kneeling_Single-Arm_High_Pulley_Row` — Remo a un brazo en polea alta de rodillas (Kneeling Single-Arm High Pulley Row) · kg×reps · machine
- `Kneeling_High_Pulley_Row` — Remo en polea alta de rodillas (Kneeling High Pulley Row) · kg×reps · machine
- `Elevated_Cable_Rows` — Remo en polea elevado (Elevated Cable Rows) · kg×reps · machine
- `Leverage_Iso_Row` — Remo isolateral en máquina de palanca (Leverage Iso Row) · tiempo · machine
- `Shotgun_Row` — Remo shotgun (Shotgun Row) · kg×reps · machine
- `Rope_Climb` — Trepa de cuerda (Rope Climb) · kg×reps · other
- `One_Arm_Against_Wall` — Un brazo contra la pared (estiramiento) (One Arm Against Wall) · tiempo · other

### Espalda alta

- `Mixed_Grip_Chin` — Dominada con agarre mixto (Mixed Grip Chin) · +kg×reps · other
- `One_Arm_Chin-Up` — Dominada supina a un brazo (One Arm Chin-Up) · +kg×reps · other
- `Middle_Back_Shrug` — Encogimiento de espalda media (Middle Back Shrug) · kg×reps · dumbbell
- `Upper_Back_Stretch` — Estiramiento de espalda alta (Upper Back Stretch) · tiempo · other
- `Middle_Back_Stretch` — Estiramiento de espalda media (Middle Back Stretch) · tiempo · other
- `Spinal_Stretch` — Estiramiento espinal (Spinal Stretch) · tiempo · other
- `Rhomboids-SMR` — Liberación miofascial de romboides (Rhomboids-SMR) · tiempo · other
- `Two-Arm_Kettlebell_Row` — Remo a dos brazos con kettlebell (Two-Arm Kettlebell Row) · kg×reps · kettlebell
- `Bent_Over_Two-Arm_Long_Bar_Row` — Remo a dos manos con barra larga inclinado (Bent Over Two-Arm Long Bar Row) · kg×reps · barbell
- `One-Arm_Long_Bar_Row` — Remo a un brazo con barra larga (One-Arm Long Bar Row) · kg×reps · barbell
- `One-Arm_Kettlebell_Row` — Remo a un brazo con kettlebell (One-Arm Kettlebell Row) · kg×reps · kettlebell
- `One-Arm_Dumbbell_Row` — Remo a un brazo con mancuerna (One-Arm Dumbbell Row) · kg×reps · dumbbell
- `Seated_One-arm_Cable_Pulley_Rows` — Remo a un brazo sentado en polea (Seated One-arm Cable Pulley Rows) · kg×reps · machine
- `Bent_Over_One-Arm_Long_Bar_Row` — Remo a una mano con barra larga inclinado (Bent Over One-Arm Long Bar Row) · kg×reps · barbell
- `Alternating_Kettlebell_Row` — Remo alterno con kettlebell (Alternating Kettlebell Row) · kg×reps · kettlebell
- `Leverage_High_Row` — Remo alto en máquina de palanca (Leverage High Row) · tiempo · machine
- `Bent_Over_Barbell_Row` — Remo con barra inclinado (Bent Over Barbell Row) · kg×reps · barbell
- `Sled_Row` — Remo con trineo (Sled Row) · kg×reps · other
- `Incline_Bench_Pull` — Remo en banco inclinado (Incline Bench Pull) · kg×reps · barbell
- `Suspended_Row` — Remo en suspensión (Suspended Row) · kg×reps · other
- `T-Bar_Row_with_Handle` — Remo en T con asa (T-Bar Row with Handle) · kg×reps · barbell
- `Lying_T-Bar_Row` — Remo en T tumbado (Lying T-Bar Row) · kg×reps · machine
- `Reverse_Grip_Bent-Over_Rows` — Remo inclinado con agarre inverso (Reverse Grip Bent-Over Rows) · kg×reps · barbell
- `Bent_Over_Two-Dumbbell_Row` — Remo inclinado con dos mancuernas (Bent Over Two-Dumbbell Row) · kg×reps · dumbbell
- `Bent_Over_Two-Dumbbell_Row_With_Palms_In` — Remo inclinado con dos mancuernas (palmas hacia dentro) (Bent Over Two-Dumbbell Row With Palms In) · kg×reps · dumbbell
- `Dumbbell_Incline_Row` — Remo inclinado con mancuernas (Dumbbell Incline Row) · kg×reps · dumbbell
- `Smith_Machine_Bent_Over_Row` — Remo inclinado en máquina Smith (Smith Machine Bent Over Row) · kg×reps · machine
- `Inverted_Row` — Remo invertido (Inverted Row) · reps (peso corporal) · other
- `Inverted_Row_with_Straps` — Remo invertido con correas (Inverted Row with Straps) · kg×reps · other
- `Bodyweight_Mid_Row` — Remo medio con peso corporal (Bodyweight Mid Row) · kg×reps · other
- `Straight_Bar_Bench_Mid_Rows` — Remo medio en banco con barra recta (Straight Bar Bench Mid Rows) · kg×reps · barbell
- `Alternating_Renegade_Row` — Remo renegado alterno (Alternating Renegade Row) · kg×reps · kettlebell
- `Seated_Cable_Rows` — Remo sentado en polea (Seated Cable Rows) · kg×reps · machine
- `Lying_Cambered_Barbell_Row` — Remo tumbado con barra curva (Lying Cambered Barbell Row) · kg×reps · barbell

### Trapecios

- `Scapular_Pull-Up` — Dominada escapular (Scapular Pull-Up) · +kg×reps · other
- `Snatch_Shrug` — Encogimiento de arrancada (Snatch Shrug) · kg×reps · barbell
- `Clean_Shrug` — Encogimiento de cargada (Clean Shrug) · kg×reps · barbell
- `Barbell_Shrug` — Encogimiento de hombros con barra (Barbell Shrug) · kg×reps · barbell
- `Barbell_Shrug_Behind_The_Back` — Encogimiento de hombros con barra por detrás (Barbell Shrug Behind The Back) · kg×reps · barbell
- `Dumbbell_Shrug` — Encogimiento de hombros con mancuernas (Dumbbell Shrug) · kg×reps · dumbbell
- `Calf-Machine_Shoulder_Shrug` — Encogimiento de hombros en máquina de gemelo (Calf-Machine Shoulder Shrug) · kg×reps · machine
- `Leverage_Shrug` — Encogimiento de hombros en máquina de palanca (Leverage Shrug) · tiempo · machine
- `Cable_Shrugs` — Encogimiento de hombros en polea (Cable Shrugs) · kg×reps · machine
- `Smith_Machine_Behind_the_Back_Shrug` — Encogimiento de hombros tras la espalda en máquina Smith (Smith Machine Behind the Back Shrug) · kg×reps · machine
- `Upright_Row_-_With_Bands` — Remo al mentón con bandas (Upright Row - With Bands) · kg×reps · band
- `Standing_Dumbbell_Upright_Row` — Remo al mentón de pie con mancuernas (Standing Dumbbell Upright Row) · kg×reps · dumbbell
- `Smith_Machine_Upright_Row` — Remo al mentón en máquina Smith (Smith Machine Upright Row) · kg×reps · machine
- `Upright_Cable_Row` — Remo al mentón en polea (Upright Cable Row) · kg×reps · machine
- `Kettlebell_Sumo_High_Pull` — Tirón alto sumo con kettlebell (Kettlebell Sumo High Pull) · kg×reps · kettlebell

### Lumbares

- `Hug_A_Ball` — Abrazar un balón (estiramiento) (Hug A Ball) · tiempo · other
- `Pelvic_Tilt_Into_Bridge` — Báscula pélvica a puente (Pelvic Tilt Into Bridge) · tiempo · other
- `Standing_Pelvic_Tilt` — Báscula pélvica de pie (Standing Pelvic Tilt) · tiempo · other
- `Stiff_Leg_Barbell_Good_Morning` — Buenos días piernas rígidas con barra (Stiff Leg Barbell Good Morning) · kg×reps · barbell
- `Seated_Good_Mornings` — Buenos días sentado (Seated Good Mornings) · kg×reps · barbell
- `Keg_Load` — Carga de barril (Keg Load) · kg×reps · other
- `Atlas_Stone_Trainer` — Entrenador de piedra Atlas (Atlas Stone Trainer) · kg×reps · other
- `Dancers_Stretch` — Estiramiento del bailarín (Dancer's Stretch) · tiempo · other
- `Cat_Stretch` — Estiramiento del gato (Cat Stretch) · tiempo · other
- `Weighted_Ball_Hyperextension` — Hiperextensión lumbar con balón lastrado (Weighted Ball Hyperextension) · kg×reps · other
- `Hyperextensions_Back_Extensions` — Hiperextensiones lumbares (Hyperextensions (Back Extensions)) · kg×reps · other
- `Hyperextensions_With_No_Hyperextension_Bench` — Hiperextensiones sin banco (Hyperextensions With No Hyperextension Bench) · reps (peso corporal) · none
- `Lower_Back-SMR` — Liberación miofascial lumbar (Lower Back-SMR) · tiempo · other
- `Reverse_Band_Deadlift` — Peso muerto con banda inversa (Reverse Band Deadlift) · kg×reps · barbell
- `Deadlift_with_Bands` — Peso muerto con bandas (Deadlift with Bands) · kg×reps · barbell
- `Barbell_Deadlift` — Peso muerto con barra (Barbell Deadlift) · kg×reps · barbell
- `Axle_Deadlift` — Peso muerto con barra eje (Axle Deadlift) · kg×reps · other
- `Deadlift_with_Chains` — Peso muerto con cadenas (Deadlift with Chains) · kg×reps · barbell
- `Deficit_Deadlift` — Peso muerto con déficit (Deficit Deadlift) · kg×reps · barbell
- `Atlas_Stones` — Piedras Atlas (Atlas Stones) · kg×reps · other
- `Pyramid` — Pirámide (estiramiento) (Pyramid) · tiempo · other
- `Childs_Pose` — Postura del niño (Child's Pose) · tiempo · other
- `Rack_Pull_with_Bands` — Rack pull con bandas (Rack Pull with Bands) · kg×reps · barbell
- `Rack_Pulls` — Rack pulls (Rack Pulls) · kg×reps · barbell
- `Hug_Knees_To_Chest` — Rodillas al pecho (Hug Knees To Chest) · tiempo · other
- `Superman` — Superman · tiempo · none
- `Crossover_Reverse_Lunge` — Zancada inversa cruzada (Crossover Reverse Lunge) · tiempo · other

### Abdominales

- `Sit-Up` — Abdominal (sit-up) (Sit-Up) · reps (peso corporal) · none
- `Press_Sit-Up` — Abdominal con press (Press Sit-Up) · kg×reps · barbell
- `Janda_Sit-Up` — Abdominal Janda (Janda Sit-Up) · reps (peso corporal) · none
- `Jackknife_Sit-Up` — Abdominal navaja (Jackknife Sit-Up) · reps (peso corporal) · none
- `Weighted_Sit-Ups_-_With_Bands` — Abdominales con peso y bandas (Weighted Sit-Ups - With Bands) · kg×reps · other
- `Frog_Sit-Ups` — Abdominales rana (Frog Sit-Ups) · reps (peso corporal) · none
- `Spider_Crawl` — Arrastre de araña (Spider Crawl) · reps (peso corporal) · none
- `Air_Bike` — Bicicleta abdominal (air bike) (Air Bike) · reps (peso corporal) · none
- `Bottoms_Up` — Bottoms up con kettlebell (Bottoms Up) · reps (peso corporal) · none
- `Butt-Ups` — Butt-ups (Butt-Ups) · reps (peso corporal) · none
- `Cocoons` — Cocoons (abdominal en V) (Cocoons) · reps (peso corporal) · none
- `Elbow_to_Knee` — Codo a rodilla (Elbow to Knee) · reps (peso corporal) · none
- `Crunches` — Crunch abdominal (Crunches) · reps (peso corporal) · none
- `Ab_Crunch_Machine` — Crunch abdominal en máquina (Ab Crunch Machine) · kg×reps · machine
- `Crunch_-_Hands_Overhead` — Crunch con brazos por encima de la cabeza (Crunch - Hands Overhead) · reps (peso corporal) · none
- `Rope_Crunch` — Crunch con cuerda (Rope Crunch) · kg×reps · machine
- `Standing_Rope_Crunch` — Crunch con cuerda de pie (Standing Rope Crunch) · kg×reps · machine
- `Weighted_Crunches` — Crunch con peso (Weighted Crunches) · kg×reps · other
- `Crunch_-_Legs_On_Exercise_Ball` — Crunch con piernas sobre fitball (Crunch - Legs On Exercise Ball) · reps (peso corporal) · none
- `Cross-Body_Crunch` — Crunch cruzado (Cross-Body Crunch) · reps (peso corporal) · none
- `Decline_Crunch` — Crunch declinado (Decline Crunch) · reps (peso corporal) · none
- `Cable_Crunch` — Crunch en polea (Cable Crunch) · kg×reps · machine
- `Kneeling_Cable_Crunch_With_Alternating_Oblique_Twists` — Crunch en polea de rodillas con giro oblicuo alterno (Kneeling Cable Crunch With Alternating Oblique Twists) · kg×reps · machine
- `Bosu_Ball_Cable_Crunch_With_Side_Bends` — Crunch en polea sobre bosu con flexión lateral (Bosu Ball Cable Crunch With Side Bends) · kg×reps · machine
- `Tuck_Crunch` — Crunch encogido (Tuck Crunch) · reps (peso corporal) · none
- `Reverse_Crunch` — Crunch inverso (Reverse Crunch) · reps (peso corporal) · none
- `Decline_Reverse_Crunch` — Crunch inverso declinado (Decline Reverse Crunch) · reps (peso corporal) · none
- `Cable_Reverse_Crunch` — Crunch inverso en polea (Cable Reverse Crunch) · kg×reps · machine
- `Suspended_Reverse_Crunch` — Crunch inverso en suspensión (Suspended Reverse Crunch) · kg×reps · other
- `Oblique_Crunches` — Crunch oblicuo (Oblique Crunches) · reps (peso corporal) · none
- `Decline_Oblique_Crunch` — Crunch oblicuo declinado (Decline Oblique Crunch) · reps (peso corporal) · none
- `Oblique_Crunches_-_On_The_Floor` — Crunch oblicuo en el suelo (Oblique Crunches - On The Floor) · reps (peso corporal) · none
- `Cable_Seated_Crunch` — Crunch sentado en polea (Cable Seated Crunch) · kg×reps · machine
- `Exercise_Ball_Crunch` — Crunch sobre fitball (Exercise Ball Crunch) · kg×reps · other
- `Dead_Bug` — Dead bug (Dead Bug) · reps (peso corporal) · none
- `Gorilla_Chin_Crunch` — Dominada/crunch gorila (Gorilla Chin/Crunch) · +kg×reps · none
- `Bent-Knee_Hip_Raise` — Elevación de cadera con rodillas flexionadas (Bent-Knee Hip Raise) · reps (peso corporal) · none
- `Smith_Machine_Hip_Raise` — Elevación de cadera en máquina Smith (Smith Machine Hip Raise) · kg×reps · machine
- `Hanging_Leg_Raise` — Elevación de piernas colgado (Hanging Leg Raise) · reps (peso corporal) · none
- `Flat_Bench_Lying_Leg_Raise` — Elevación de piernas tumbado en banco plano (Flat Bench Lying Leg Raise) · reps (peso corporal) · none
- `Knee_Hip_Raise_On_Parallel_Bars` — Elevación de rodillas/cadera en paralelas (Knee/Hip Raise On Parallel Bars) · kg×reps · other
- `Standing_Cable_Lift` — Elevación en polea de pie (Standing Cable Lift) · kg×reps · machine
- `3_4_Sit-Up` — Encogimiento abdominal 3/4 (3/4 Sit-Up) · reps (peso corporal) · none
- `Leg_Pull-In` — Encogimiento de piernas (Leg Pull-In) · reps (peso corporal) · none
- `Flat_Bench_Leg_Pull-In` — Encogimiento de piernas en banco plano (Flat Bench Leg Pull-In) · reps (peso corporal) · none
- `Seated_Leg_Tucks` — Encogimiento de piernas sentado (Seated Leg Tucks) · reps (peso corporal) · none
- `Seated_Flat_Bench_Leg_Pull-In` — Encogimiento de piernas sentado en banco plano (Seated Flat Bench Leg Pull-In) · reps (peso corporal) · none
- `Standing_Lateral_Stretch` — Estiramiento lateral de pie (Standing Lateral Stretch) · tiempo · other
- `Overhead_Stretch` — Estiramiento por encima de la cabeza (Overhead Stretch) · tiempo · other
- `Seated_Overhead_Stretch` — Estiramiento por encima de la cabeza sentado (Seated Overhead Stretch) · tiempo · other
- `Suspended_Fallout` — Fallout en suspensión (Suspended Fallout) · kg×reps · other
- `Kettlebell_Figure_8` — Figura en 8 con kettlebell (Kettlebell Figure 8) · kg×reps · kettlebell
- `Exercise_Ball_Pull-In` — Flexión de rodillas sobre fitball (Exercise Ball Pull-In) · kg×reps · other
- `One-Arm_High-Pulley_Cable_Side_Bends` — Flexión lateral a un brazo en polea alta (One-Arm High-Pulley Cable Side Bends) · kg×reps · machine
- `Weighted_Ball_Side_Bend` — Flexión lateral con balón lastrado (Weighted Ball Side Bend) · kg×reps · other
- `Barbell_Side_Bend` — Flexión lateral de tronco con barra (Barbell Side Bend) · kg×reps · barbell
- `Dumbbell_Side_Bend` — Flexión lateral de tronco con mancuerna (Dumbbell Side Bend) · kg×reps · dumbbell
- `Lower_Back_Curl` — Flexión lumbar (Lower Back Curl) · tiempo · none
- `Medicine_Ball_Full_Twist` — Giro completo con balón medicinal (Medicine Ball Full Twist) · kg×reps · other
- `Plate_Twist` — Giro de tronco con disco (Plate Twist) · kg×reps · other
- `Seated_Barbell_Twist` — Giro de tronco sentado con barra (Seated Barbell Twist) · kg×reps · barbell
- `Russian_Twist` — Giro ruso (Russian Twist) · reps (peso corporal) · none
- `Cable_Russian_Twists` — Giro ruso en polea (Cable Russian Twists) · kg×reps · machine
- `One-Arm_Medicine_Ball_Slam` — Golpe al suelo a un brazo con balón medicinal (One-Arm Medicine Ball Slam) · kg×reps · other
- `Sledgehammer_Swings` — Golpes con almádena (Sledgehammer Swings) · kg×reps · other
- `hollow_body_hold` — Hollow body (Hollow Body Hold) · tiempo · none
- `hollow_rocks` — Hollow rocks (Hollow Rocks) · reps (peso corporal) · none
- `l_sit` — L-sit en paralelas (L-Sit) · tiempo · other
- `Landmine_180s` — Landmine 180 (Landmine 180's) · kg×reps · barbell
- `Supine_Two-Arm_Overhead_Throw` — Lanzamiento a dos brazos por encima de la cabeza tumbado boca arriba (Supine Two-Arm Overhead Throw) · kg×reps · other
- `Supine_One-Arm_Overhead_Throw` — Lanzamiento a un brazo por encima de la cabeza tumbado boca arriba (Supine One-Arm Overhead Throw) · kg×reps · other
- `Standing_Cable_Wood_Chop` — Leñador en polea de pie (Standing Cable Wood Chop) · kg×reps · machine
- `Advanced_Kettlebell_Windmill` — Molinillo avanzado con kettlebell (Advanced Kettlebell Windmill) · kg×reps · kettlebell
- `Double_Kettlebell_Windmill` — Molinillo con dos kettlebells (Double Kettlebell Windmill) · kg×reps · kettlebell
- `Kettlebell_Windmill` — Molinillo con kettlebell (Kettlebell Windmill) · kg×reps · kettlebell
- `Side_Jackknife` — Navaja lateral (Side Jackknife) · reps (peso corporal) · none
- `Otis-Up` — Otis-up (Otis-Up) · kg×reps · other
- `Pallof_Press` — Pallof press (Pallof Press) · kg×reps · machine
- `Pallof_Press_With_Rotation` — Pallof press con rotación (Pallof Press With Rotation) · kg×reps · machine
- `Kettlebell_Pass_Between_The_Legs` — Paso de kettlebell entre las piernas (Kettlebell Pass Between The Legs) · kg×reps · kettlebell
- `Scissor_Kick` — Patada de tijera (Scissor Kick) · tiempo · none
- `Hanging_Pike` — Pike colgado (Hanging Pike) · reps (peso corporal) · none
- `Plank` — Plancha (Plank) · tiempo · none
- `Side_Bridge` — Plancha lateral (Side Bridge) · tiempo · none
- `side_plank` — Plancha lateral (Side Plank) · tiempo · none
- `Bent_Press` — Press inclinado lateral (bent press) (Bent Press) · kg×reps · kettlebell
- `Barbell_Rollout_from_Bench` — Rollout con barra desde banco (Barbell Rollout from Bench) · kg×reps · barbell
- `Torso_Rotation` — Rotación de tronco (Torso Rotation) · tiempo · other
- `Ab_Roller` — Rueda abdominal (Ab Roller) · kg×reps · other
- `Barbell_Ab_Rollout` — Rueda abdominal con barra (Barbell Ab Rollout) · kg×reps · barbell
- `Barbell_Ab_Rollout_-_On_Knees` — Rueda abdominal con barra de rodillas (Barbell Ab Rollout - On Knees) · kg×reps · barbell
- `Spell_Caster` — Spell caster (Spell Caster) · kg×reps · dumbbell
- `Wind_Sprints` — Sprints (Wind Sprints) · reps (peso corporal) · none
- `Toe_Touchers` — Toques de punta de pie (abdominal) (Toe Touchers) · tiempo · none
- `Alternate_Heel_Touchers` — Toques de talón alternos (Alternate Heel Touchers) · reps (peso corporal) · none
- `Stomach_Vacuum` — Vacío abdominal (Stomach Vacuum) · tiempo · none
- `Cable_Judo_Flip` — Voltereta de judo en polea (Cable Judo Flip) · kg×reps · machine

### Cuádriceps

- `Cable_Hip_Adduction` — Aducción de cadera en polea (Cable Hip Adduction) · kg×reps · machine
- `Snatch` — Arrancada (Snatch) · kg×reps · barbell
- `Power_Snatch_from_Blocks` — Arrancada de potencia desde bloques (Power Snatch from Blocks) · kg×reps · barbell
- `Snatch_from_Blocks` — Arrancada desde bloques (Snatch from Blocks) · kg×reps · barbell
- `Sled_Drag_-_Harness` — Arrastre de trineo con arnés (Sled Drag - Harness) · kg×reps · other
- `Bear_Crawl_Sled_Drags` — Arrastre de trineo en marcha del oso (Bear Crawl Sled Drags) · kg×reps · other
- `Backward_Drag` — Arrastre hacia atrás (Backward Drag) · kg×reps · other
- `Heaving_Snatch_Balance` — Balance de arrancada (Heaving Snatch Balance) · kg×reps · barbell
- `Snatch_Balance` — Balance de arrancada (Snatch Balance) · kg×reps · barbell
- `Bicycling_Stationary` — Bicicleta estática (Bicycling, Stationary) · distancia+tiempo · machine
- `Recumbent_Bike` — Bicicleta reclinada (Recumbent Bike) · distancia+tiempo · machine
- `Walking_Treadmill` — Caminar en cinta (Walking, Treadmill) · distancia+tiempo · machine
- `Sandbag_Load` — Carga de saco de arena (Sandbag Load) · kg×reps · other
- `Hang_Clean` — Cargada colgada (Hang Clean) · tiempo · barbell
- `Hang_Clean_-_Below_the_Knees` — Cargada colgada por debajo de las rodillas (Hang Clean - Below the Knees) · tiempo · barbell
- `Clean_from_Blocks` — Cargada desde bloques (Clean from Blocks) · kg×reps · barbell
- `Split_Clean` — Cargada dividida (Split Clean) · kg×reps · barbell
- `Bicycling` — Ciclismo (Bicycling) · distancia+tiempo · other
- `Fast_Skipping` — Comba rápida (Fast Skipping) · reps (peso corporal) · none
- `Running_Treadmill` — Correr en cinta (Running, Treadmill) · distancia+tiempo · machine
- `Iron_Crosses_stretch` — Cruz de hierro (estiramiento) (Iron Crosses (stretch)) · tiempo · other
- `Rear_Leg_Raises` — Elevación de pierna atrás (Rear Leg Raises) · tiempo · none
- `Elliptical_Trainer` — Elíptica (Elliptical Trainer) · distancia+tiempo · machine
- `Sled_Push` — Empuje de trineo (Sled Push) · kg×reps · other
- `Squat_Jerk` — Envión con sentadilla (Squat Jerk) · kg×reps · barbell
- `Power_Jerk` — Envión de potencia (Power Jerk) · kg×reps · barbell
- `Split_Jerk` — Envión dividido (Split Jerk) · kg×reps · barbell
- `Stairmaster` — Escaladora (stairmaster) (Stairmaster) · distancia+tiempo · machine
- `Step_Mill` — Escaladora de escalones (Step Mill) · tiempo · machine
- `Mountain_Climbers` — Escaladores (mountain climbers) (Mountain Climbers) · reps (peso corporal) · other
- `Quad_Stretch` — Estiramiento de cuádriceps (Quad Stretch) · tiempo · other
- `All_Fours_Quad_Stretch` — Estiramiento de cuádriceps a cuatro patas (All Fours Quad Stretch) · tiempo · none
- `Lying_Prone_Quadriceps` — Estiramiento de cuádriceps boca abajo (Lying Prone Quadriceps) · tiempo · none
- `On_Your_Side_Quad_Stretch` — Estiramiento de cuádriceps de lado (On Your Side Quad Stretch) · tiempo · other
- `Standing_Elevated_Quad_Stretch` — Estiramiento de cuádriceps elevado de pie (Standing Elevated Quad Stretch) · tiempo · other
- `On-Your-Back_Quad_Stretch` — Estiramiento de cuádriceps tumbado boca arriba (On-Your-Back Quad Stretch) · tiempo · other
- `Kneeling_Hip_Flexor` — Estiramiento de flexor de cadera de rodillas (Kneeling Hip Flexor) · tiempo · other
- `Intermediate_Hip_Flexor_and_Quad_Stretch` — Estiramiento de flexor de cadera y cuádriceps intermedio (Intermediate Hip Flexor and Quad Stretch) · tiempo · other
- `Standing_Hip_Flexors` — Estiramiento de flexores de cadera de pie (Standing Hip Flexors) · tiempo · other
- `Single-Leg_Leg_Extension` — Extensión de pierna a una pierna (Single-Leg Leg Extension) · kg×reps · machine
- `Leg_Extensions` — Extensión de piernas (Leg Extensions) · kg×reps · machine
- `Hip_Flexion_with_Band` — Flexión de cadera con banda (Hip Flexion with Band) · kg×reps · band
- `Single_Leg_Push-off` — Impulso a una pierna (Single Leg Push-off) · kg×reps · other
- `Quadriceps-SMR` — Liberación miofascial de cuádriceps (Quadriceps-SMR) · tiempo · other
- `One_Half_Locust` — Media langosta (yoga) (One Half Locust) · tiempo · other
- `Looking_At_Ceiling` — Mirar al techo (estiramiento de cuello) (Looking At Ceiling) · tiempo · other
- `Side_to_Side_Box_Shuffle` — Movimiento lateral en cajón (Side to Side Box Shuffle) · kg×reps · other
- `Yoke_Walk` — Paseo con yugo (Yoke Walk) · tiempo · other
- `Skating` — Patinaje (Skating) · tiempo · other
- `Trap_Bar_Deadlift` — Peso muerto con barra hexagonal (Trap Bar Deadlift) · kg×reps · other
- `Rickshaw_Deadlift` — Peso muerto con rickshaw (Rickshaw Deadlift) · kg×reps · other
- `Car_Deadlift` — Peso muerto de coche (Car Deadlift) · kg×reps · other
- `Leverage_Deadlift` — Peso muerto en máquina de palanca (Leverage Deadlift) · tiempo · machine
- `Cable_Deadlifts` — Peso muerto en polea (Cable Deadlifts) · kg×reps · machine
- `One-Arm_Side_Deadlift` — Peso muerto lateral a un brazo (One-Arm Side Deadlift) · kg×reps · barbell
- `Leg_Press` — Prensa de piernas (Leg Press) · kg×reps · machine
- `Narrow_Stance_Leg_Press` — Prensa de piernas con pies juntos (Narrow Stance Leg Press) · kg×reps · machine
- `Smith_Machine_Leg_Press` — Prensa de piernas en máquina Smith (Smith Machine Leg Press) · kg×reps · machine
- `Single-Leg_Hop_Progression` — Progresión de saltos a una pierna (Single-Leg Hop Progression) · kg×reps · other
- `knee_rehab_pool` — Rehabilitación de rodilla en el agua (Knee Rehab (Pool)) · tiempo · none
- `Rowing_Stationary` — Remo estático (Rowing, Stationary) · distancia+tiempo · machine
- `Conans_Wheel` — Rueda de Conan (Conan's Wheel) · kg×reps · other
- `Rope_Jumping` — Saltar a la comba (Rope Jumping) · tiempo · other
- `Bench_Jump` — Salto al banco (Bench Jump) · reps (peso corporal) · none
- `Dumbbell_Seated_Box_Jump` — Salto al cajón sentado con mancuernas (Dumbbell Seated Box Jump) · kg×reps · dumbbell
- `Rocket_Jump` — Salto cohete (Rocket Jump) · reps (peso corporal) · none
- `Standing_Long_Jump` — Salto de longitud de pie (Standing Long Jump) · reps (peso corporal) · none
- `Side_Standing_Long_Jump` — Salto de longitud lateral de pie (Side Standing Long Jump) · reps (peso corporal) · other
- `Scissors_Jump` — Salto de tijera (Scissors Jump) · reps (peso corporal) · none
- `Single-Leg_Stride_Jump` — Salto de zancada a una pierna (Single-Leg Stride Jump) · kg×reps · other
- `Stride_Jump_Crossover` — Salto de zancada cruzado (Stride Jump Crossover) · kg×reps · other
- `Alternate_Leg_Diagonal_Bound` — Salto diagonal alterno de piernas (Alternate Leg Diagonal Bound) · reps (peso corporal) · other
- `Split_Jump` — Salto dividido (Split Jump) · reps (peso corporal) · none
- `Depth_Jump_Leap` — Salto en profundidad (Depth Jump Leap) · kg×reps · other
- `Linear_Depth_Jump` — Salto en profundidad lineal (Linear Depth Jump) · kg×reps · other
- `Star_Jump` — Salto estrella (Star Jump) · reps (peso corporal) · none
- `Single-Leg_Lateral_Hop` — Salto lateral a una pierna (Single-Leg Lateral Hop) · kg×reps · other
- `Side_Hop-Sprint` — Salto lateral y sprint (Side Hop-Sprint) · kg×reps · other
- `Quick_Leap` — Salto rápido (Quick Leap) · kg×reps · other
- `Frog_Hops` — Saltos de rana (Frog Hops) · tiempo · other
- `Front_Cone_Hops_or_hurdle_hops` — Saltos frontales sobre conos (o vallas) (Front Cone Hops (or hurdle hops)) · kg×reps · other
- `Sit_Squats` — Sentadilla a silla (Sit Squats) · tiempo · other
- `One_Leg_Barbell_Squat` — Sentadilla a una pierna con barra (One Leg Barbell Squat) · kg×reps · barbell
- `Box_Squat` — Sentadilla al cajón (Box Squat) · kg×reps · barbell
- `Single-Leg_High_Box_Squat` — Sentadilla al cajón alto a una pierna (Single-Leg High Box Squat) · kg×reps · other
- `Reverse_Band_Box_Squat` — Sentadilla al cajón con banda inversa (Reverse Band Box Squat) · kg×reps · barbell
- `Box_Squat_with_Bands` — Sentadilla al cajón con bandas (Box Squat with Bands) · kg×reps · barbell
- `Box_Squat_with_Chains` — Sentadilla al cajón con cadenas (Box Squat with Chains) · kg×reps · barbell
- `Speed_Box_Squat` — Sentadilla al cajón de velocidad (Speed Box Squat) · kg×reps · barbell
- `bulgarian_split_squat_smith` — Sentadilla búlgara (multipower) (Bulgarian Split Squat (Smith Machine)) · kg×reps · machine
- `Smith_Single-Leg_Split_Squat` — Sentadilla búlgara en máquina Smith (Smith Single-Leg Split Squat) · kg×reps · machine
- `Suspended_Split_Squat` — Sentadilla búlgara en suspensión (Suspended Split Squat) · kg×reps · other
- `Barbell_Full_Squat` — Sentadilla completa con barra (Barbell Full Squat) · kg×reps · barbell
- `Squat_with_Bands` — Sentadilla con bandas (Squat with Bands) · kg×reps · barbell
- `Barbell_Squat` — Sentadilla con barra (Barbell Squat) · kg×reps · barbell
- `Wide_Stance_Barbell_Squat` — Sentadilla con barra (pies separados) (Wide Stance Barbell Squat) · kg×reps · barbell
- `Barbell_Squat_To_A_Bench` — Sentadilla con barra a banco (Barbell Squat To A Bench) · kg×reps · barbell
- `Squat_with_Chains` — Sentadilla con cadenas (Squat with Chains) · kg×reps · barbell
- `Squat_with_Plate_Movers` — Sentadilla con deslizadores de disco (Squat with Plate Movers) · kg×reps · barbell
- `One-Arm_Overhead_Kettlebell_Squats` — Sentadilla con kettlebell en alto a un brazo (One-Arm Overhead Kettlebell Squats) · kg×reps · kettlebell
- `Dumbbell_Squat` — Sentadilla con mancuernas (Dumbbell Squat) · kg×reps · dumbbell
- `Dumbbell_Squat_To_A_Bench` — Sentadilla con mancuernas a banco (Dumbbell Squat To A Bench) · kg×reps · dumbbell
- `Weighted_Squat` — Sentadilla con peso (Weighted Squat) · kg×reps · other
- `Bodyweight_Squat` — Sentadilla con peso corporal (Bodyweight Squat) · reps (peso corporal) · none
- `Narrow_Stance_Squats` — Sentadilla con pies juntos (Narrow Stance Squats) · kg×reps · barbell
- `Freehand_Jump_Squat` — Sentadilla con salto sin peso (Freehand Jump Squat) · reps (peso corporal) · none
- `Weighted_Jump_Squat` — Sentadilla con salto y peso (Weighted Jump Squat) · kg×reps · barbell
- `Jerk_Dip_Squat` — Sentadilla de envión (Jerk Dip Squat) · +kg×reps · barbell
- `Reverse_Band_Power_Squat` — Sentadilla de potencia con banda inversa (Reverse Band Power Squat) · kg×reps · barbell
- `Split_Squat_with_Dumbbells` — Sentadilla dividida con mancuernas (Split Squat with Dumbbells) · kg×reps · dumbbell
- `Barbell_Side_Split_Squat` — Sentadilla dividida lateral con barra (Barbell Side Split Squat) · kg×reps · barbell
- `Smith_Machine_Squat` — Sentadilla en máquina Smith (Smith Machine Squat) · kg×reps · machine
- `Chair_Squat` — Sentadilla en silla (Chair Squat) · kg×reps · machine
- `Frankenstein_Squat` — Sentadilla Frankenstein (Frankenstein Squat) · kg×reps · barbell
- `Front_Squat_Clean_Grip` — Sentadilla frontal (agarre de cargada) (Front Squat (Clean Grip)) · kg×reps · barbell
- `Front_Barbell_Squat` — Sentadilla frontal con barra (Front Barbell Squat) · kg×reps · barbell
- `Front_Barbell_Squat_To_A_Bench` — Sentadilla frontal con barra a banco (Front Barbell Squat To A Bench) · kg×reps · barbell
- `Front_Squats_With_Two_Kettlebells` — Sentadilla frontal con dos kettlebells (Front Squats With Two Kettlebells) · kg×reps · kettlebell
- `Goblet_Squat` — Sentadilla goblet (Goblet Squat) · kg×reps · kettlebell
- `Hack_Squat` — Sentadilla hack (Hack Squat) · kg×reps · machine
- `Barbell_Hack_Squat` — Sentadilla hack con barra (Barbell Hack Squat) · kg×reps · barbell
- `Narrow_Stance_Hack_Squats` — Sentadilla hack con pies juntos (Narrow Stance Hack Squats) · kg×reps · machine
- `wall_sit` — Sentadilla isométrica en pared (Wall Sit) · kg+tiempo · none
- `Jefferson_Squats` — Sentadilla Jefferson (Jefferson Squats) · kg×reps · barbell
- `Olympic_Squat` — Sentadilla olímpica (Olympic Squat) · kg×reps · barbell
- `Overhead_Squat` — Sentadilla overhead (Overhead Squat) · kg×reps · barbell
- `Kettlebell_Pistol_Squat` — Sentadilla pistol con kettlebell (Kettlebell Pistol Squat) · kg×reps · kettlebell
- `Smith_Machine_Pistol_Squat` — Sentadilla pistol en máquina Smith (Smith Machine Pistol Squat) · kg×reps · machine
- `Plie_Dumbbell_Squat` — Sentadilla plié con mancuerna (Plie Dumbbell Squat) · kg×reps · dumbbell
- `Weighted_Sissy_Squat` — Sentadilla sissy con peso (Weighted Sissy Squat) · kg×reps · barbell
- `Lying_Machine_Squat` — Sentadilla tumbada en máquina (Lying Machine Squat) · kg×reps · machine
- `Zercher_Squats` — Sentadilla Zercher (Zercher Squats) · kg×reps · barbell
- `Squats_-_With_Bands` — Sentadillas con bandas (Squats - With Bands) · kg×reps · band
- `Speed_Squats` — Sentadillas de velocidad (Speed Squats) · kg×reps · barbell
- `Single-Cone_Sprint_Drill` — Sprint con un cono (Single-Cone Sprint Drill) · kg×reps · other
- `Lunge_Sprint` — Sprint con zancada (Lunge Sprint) · kg×reps · machine
- `Bench_Sprint` — Sprint en banco (Bench Sprint) · kg×reps · other
- `step_down` — Step-down controlado (Step-Down) · +kg×reps · none
- `Barbell_Step_Ups` — Subida al cajón con barra (Barbell Step Ups) · kg×reps · barbell
- `Dumbbell_Step_Ups` — Subida al cajón con mancuernas (Dumbbell Step Ups) · kg×reps · dumbbell
- `Single_Leg_Butt_Kick` — Talón al glúteo a una pierna (Single Leg Butt Kick) · reps (peso corporal) · none
- `Double_Leg_Butt_Kick` — Talones al glúteo a dos piernas (Double Leg Butt Kick) · reps (peso corporal) · none
- `Clean_Pull` — Tirón de cargada (Clean Pull) · kg×reps · barbell
- `Trail_Running_Walking` — Trail running/caminata (Trail Running/Walking) · distancia+tiempo · other
- `Jogging_Treadmill` — Trote en cinta (Jogging, Treadmill) · distancia+tiempo · machine
- `Tire_Flip` — Volteo de neumático (Tire Flip) · kg×reps · other
- `Dumbbell_Rear_Lunge` — Zancada atrás con mancuernas (Dumbbell Rear Lunge) · kg×reps · dumbbell
- `Elevated_Back_Lunge` — Zancada atrás elevada (Elevated Back Lunge) · kg×reps · barbell
- `Barbell_Walking_Lunge` — Zancada caminando con barra (Barbell Walking Lunge) · tiempo · barbell
- `Bodyweight_Walking_Lunge` — Zancada caminando con peso corporal (Bodyweight Walking Lunge) · tiempo · other
- `Barbell_Lunge` — Zancada con barra (Barbell Lunge) · kg×reps · barbell
- `Dumbbell_Lunges` — Zancadas con mancuernas (Dumbbell Lunges) · kg×reps · dumbbell

### Isquiotibiales

- `Upper_Back-Leg_Grab` — Agarre de pierna espalda alta (estiramiento) (Upper Back-Leg Grab) · tiempo · other
- `The_Straddle` — Apertura de piernas (straddle) (The Straddle) · tiempo · other
- `Hang_Snatch` — Arrancada colgada (Hang Snatch) · tiempo · barbell
- `Hang_Snatch_-_Below_Knees` — Arrancada colgada por debajo de las rodillas (Hang Snatch - Below Knees) · tiempo · barbell
- `Power_Snatch` — Arrancada de potencia (Power Snatch) · kg×reps · barbell
- `Split_Snatch` — Arrancada dividida (Split Snatch) · kg×reps · barbell
- `Muscle_Snatch` — Arrancada muscular (Muscle Snatch) · kg×reps · barbell
- `Good_Morning` — Buenos días (Good Morning) · kg×reps · barbell
- `Band_Good_Morning` — Buenos días con banda (Band Good Morning) · kg×reps · band
- `Band_Good_Morning_Pull_Through` — Buenos días con banda (pull through) (Band Good Morning (Pull Through)) · kg×reps · band
- `Good_Morning_off_Pins` — Buenos días desde pines (Good Morning off Pins) · kg×reps · barbell
- `Hanging_Bar_Good_Morning` — Buenos días en barra colgada (Hanging Bar Good Morning) · kg×reps · barbell
- `Clean` — Cargada (Clean) · kg×reps · barbell
- `One-Arm_Kettlebell_Clean` — Cargada a un brazo con kettlebell (One-Arm Kettlebell Clean) · kg×reps · kettlebell
- `One-Arm_Open_Palm_Kettlebell_Clean` — Cargada a un brazo con palma abierta (kettlebell) (One-Arm Open Palm Kettlebell Clean) · kg×reps · kettlebell
- `Alternating_Hang_Clean` — Cargada colgada alterna (Alternating Hang Clean) · tiempo · kettlebell
- `Double_Kettlebell_Alternating_Hang_Clean` — Cargada colgada alterna con dos kettlebells (Double Kettlebell Alternating Hang Clean) · tiempo · kettlebell
- `Kettlebell_Hang_Clean` — Cargada colgada con kettlebell (Kettlebell Hang Clean) · tiempo · kettlebell
- `Dumbbell_Clean` — Cargada con mancuernas (Dumbbell Clean) · kg×reps · dumbbell
- `Open_Palm_Kettlebell_Clean` — Cargada con palma abierta (kettlebell) (Open Palm Kettlebell Clean) · kg×reps · kettlebell
- `Power_Clean` — Cargada de potencia (Power Clean) · kg×reps · barbell
- `Smith_Machine_Hang_Power_Clean` — Cargada de potencia colgada en máquina Smith (Smith Machine Hang Power Clean) · tiempo · machine
- `Power_Clean_from_Blocks` — Cargada de potencia desde bloques (Power Clean from Blocks) · kg×reps · barbell
- `Kettlebell_Dead_Clean` — Cargada muerta con kettlebell (Kettlebell Dead Clean) · kg×reps · kettlebell
- `Ball_Leg_Curl` — Curl femoral con fitball (Ball Leg Curl) · kg×reps · other
- `Standing_Leg_Curl` — Curl femoral de pie (Standing Leg Curl) · kg×reps · machine
- `Seated_Leg_Curl` — Curl femoral sentado (Seated Leg Curl) · kg×reps · machine
- `Seated_Band_Hamstring_Curl` — Curl femoral sentado con banda (Seated Band Hamstring Curl) · kg×reps · other
- `Lying_Leg_Curls` — Curl femoral tumbado (Lying Leg Curls) · kg×reps · machine
- `Platform_Hamstring_Slides` — Deslizamiento de isquiotibiales en plataforma (Platform Hamstring Slides) · kg×reps · other
- `Linear_Acceleration_Wall_Drill` — Ejercicio de aceleración lineal en pared (Linear Acceleration Wall Drill) · reps (peso corporal) · other
- `Worlds_Greatest_Stretch` — El mejor estiramiento del mundo (World's Greatest Stretch) · tiempo · other
- `Front_Leg_Raises` — Elevación de pierna frontal (Front Leg Raises) · tiempo · none
- `Glute_Ham_Raise` — Elevación glúteo-femoral (Glute Ham Raise) · kg×reps · machine
- `Floor_Glute-Ham_Raise` — Elevación glúteo-femoral en suelo (Floor Glute-Ham Raise) · reps (peso corporal) · other
- `Natural_Glute_Ham_Raise` — Elevación glúteo-femoral natural (Natural Glute Ham Raise) · reps (peso corporal) · none
- `Power_Stairs` — Escaleras de potencia (Power Stairs) · kg×reps · other
- `Intermediate_Groin_Stretch` — Estiramiento de ingle intermedio (Intermediate Groin Stretch) · tiempo · other
- `Hamstring_Stretch` — Estiramiento de isquiotibiales (Hamstring Stretch) · tiempo · other
- `Leg-Up_Hamstring_Stretch` — Estiramiento de isquiotibiales con pierna elevada (Leg-Up Hamstring Stretch) · tiempo · other
- `Seated_Hamstring` — Estiramiento de isquiotibiales sentado (Seated Hamstring) · tiempo · other
- `Seated_Floor_Hamstring_Stretch` — Estiramiento de isquiotibiales sentado en el suelo (Seated Floor Hamstring Stretch) · tiempo · other
- `Lying_Hamstring` — Estiramiento de isquiotibiales tumbado (Lying Hamstring) · tiempo · other
- `Standing_Hamstring_and_Calf_Stretch` — Estiramiento de isquiotibiales y gemelo de pie (Standing Hamstring and Calf Stretch) · tiempo · other
- `Seated_Hamstring_and_Calf_Stretch` — Estiramiento de isquiotibiales y gemelo sentado (Seated Hamstring and Calf Stretch) · tiempo · other
- `Chair_Leg_Extended_Stretch` — Estiramiento de pierna extendida en silla (Chair Leg Extended Stretch) · tiempo · other
- `Runners_Stretch` — Estiramiento del corredor (Runner's Stretch) · tiempo · other
- `Reverse_Hyperextension` — Hiperextensión inversa (Reverse Hyperextension) · kg×reps · machine
- `Inchworm` — Inchworm (oruga) (Inchworm) · tiempo · none
- `90_90_Hamstring` — Isquiotibiales 90/90 (90/90 Hamstring) · tiempo · none
- `Prone_Manual_Hamstring` — Isquiotibiales manual boca abajo (Prone Manual Hamstring) · reps (peso corporal) · other
- `Hamstring-SMR` — Liberación miofascial de isquiotibiales (Hamstring-SMR) · tiempo · other
- `Kettlebell_One-Legged_Deadlift` — Peso muerto a una pierna con kettlebell (Kettlebell One-Legged Deadlift) · kg×reps · kettlebell
- `Snatch_Deadlift` — Peso muerto de arrancada (Snatch Deadlift) · kg×reps · barbell
- `Clean_Deadlift` — Peso muerto de cargada (Clean Deadlift) · kg×reps · barbell
- `Wide_Stance_Stiff_Legs` — Peso muerto piernas rígidas (pies separados) (Wide Stance Stiff Legs) · kg×reps · barbell
- `Stiff-Legged_Barbell_Deadlift` — Peso muerto piernas rígidas con barra (Stiff-Legged Barbell Deadlift) · kg×reps · barbell
- `Stiff-Legged_Dumbbell_Deadlift` — Peso muerto piernas rígidas con mancuernas (Stiff-Legged Dumbbell Deadlift) · kg×reps · dumbbell
- `Smith_Machine_Stiff-Legged_Deadlift` — Peso muerto piernas rígidas en máquina Smith (Smith Machine Stiff-Legged Deadlift) · kg×reps · machine
- `Romanian_Deadlift` — Peso muerto rumano (Romanian Deadlift) · kg×reps · barbell
- `Romanian_Deadlift_from_Deficit` — Peso muerto rumano con déficit (Romanian Deadlift from Deficit) · kg×reps · barbell
- `Sumo_Deadlift` — Peso muerto sumo (Sumo Deadlift) · kg×reps · barbell
- `Reverse_Band_Sumo_Deadlift` — Peso muerto sumo con banda inversa (Reverse Band Sumo Deadlift) · kg×reps · barbell
- `Sumo_Deadlift_with_Bands` — Peso muerto sumo con bandas (Sumo Deadlift with Bands) · kg×reps · barbell
- `Sumo_Deadlift_with_Chains` — Peso muerto sumo con cadenas (Sumo Deadlift with Chains) · kg×reps · barbell
- `Box_Jump_Multiple_Response` — Salto al cajón (respuesta múltiple) (Box Jump (Multiple Response)) · kg×reps · other
- `Box_Skip` — Salto al cajón (skip) (Box Skip) · kg×reps · other
- `Front_Box_Jump` — Salto al cajón frontal (Front Box Jump) · kg×reps · other
- `Knee_Tuck_Jump` — Salto con rodillas al pecho (Knee Tuck Jump) · reps (peso corporal) · none
- `Hurdle_Hops` — Saltos de vallas (Hurdle Hops) · kg×reps · other
- `Split_Squats` — Sentadillas divididas (Split Squats) · tiempo · other
- `Moving_Claw_Series` — Serie de garra en movimiento (Moving Claw Series) · reps (peso corporal) · other
- `Prowler_Sprint` — Sprint con prowler (Prowler Sprint) · distancia+tiempo · other
- `One-Arm_Kettlebell_Swings` — Swing a un brazo con kettlebell (One-Arm Kettlebell Swings) · kg×reps · kettlebell
- `Vertical_Swing` — Swing vertical (Vertical Swing) · kg×reps · dumbbell
- `Linear_3-Part_Start_Technique` — Técnica de salida lineal en 3 partes (Linear 3-Part Start Technique) · reps (peso corporal) · other
- `Snatch_Pull` — Tirón de arrancada (Snatch Pull) · kg×reps · barbell
- `Standing_Toe_Touches` — Toques de punta de pie (Standing Toe Touches) · tiempo · other
- `Lunge_Pass_Through` — Zancada con paso a través (Lunge Pass Through) · kg×reps · kettlebell

### Glúteos

- `Hip_Lift_with_Band` — Elevación de cadera con banda (Hip Lift with Band) · kg×reps · band
- `Leg_Lift` — Elevación de piernas (Leg Lift) · reps (peso corporal) · none
- `Downward_Facing_Balance` — Equilibrio boca abajo (Downward Facing Balance) · kg×reps · other
- `Seated_Glute` — Estiramiento de glúteo sentado (Seated Glute) · tiempo · none
- `Lying_Glute` — Estiramiento de glúteo tumbado (Lying Glute) · tiempo · none
- `Hip_Extension_with_Bands` — Extensión de cadera con bandas (Hip Extension with Bands) · kg×reps · band
- `Barbell_Hip_Thrust` — Hip thrust con barra (Barbell Hip Thrust) · kg×reps · barbell
- `Piriformis-SMR` — Liberación miofascial del piriforme (Piriformis-SMR) · tiempo · other
- `Glute_Kickback` — Patada de glúteo (Glute Kickback) · reps (peso corporal) · none
- `One-Legged_Cable_Kickback` — Patada de glúteo a una pierna en polea (One-Legged Cable Kickback) · kg×reps · machine
- `Flutter_Kicks` — Patada de tijera (Flutter Kicks) · reps (peso corporal) · none
- `Physioball_Hip_Bridge` — Puente de cadera sobre fitball (Physioball Hip Bridge) · tiempo · other
- `Butt_Lift_Bridge` — Puente de glúteo (Butt Lift (Bridge)) · tiempo · none
- `Single_Leg_Glute_Bridge` — Puente de glúteo a una pierna (Single Leg Glute Bridge) · tiempo · none
- `Barbell_Glute_Bridge` — Puente de glúteo con barra (Barbell Glute Bridge) · tiempo · barbell
- `Pull_Through` — Pull through (Pull Through) · kg×reps · machine
- `Knee_Across_The_Body` — Rodilla cruzada al cuerpo (Knee Across The Body) · tiempo · other
- `Kneeling_Jump_Squat` — Sentadilla con salto desde rodillas (Kneeling Jump Squat) · kg×reps · barbell
- `Kneeling_Squat` — Sentadilla desde rodillas (Kneeling Squat) · kg×reps · barbell
- `Step-up_with_Knee_Raise` — Subida al cajón con elevación de rodilla (Step-up with Knee Raise) · reps (peso corporal) · none
- `Ankle_On_The_Knee` — Tobillo sobre la rodilla (estiramiento) (Ankle On The Knee) · tiempo · other
- `One_Knee_To_Chest` — Una rodilla al pecho (One Knee To Chest) · tiempo · other

### Gemelos

- `Knee_Circles` — Círculos de rodilla (Knee Circles) · tiempo · none
- `Ankle_Circles` — Círculos de tobillo (Ankle Circles) · tiempo · other
- `Donkey_Calf_Raises` — Elevación de gemelo burro (Donkey Calf Raises) · kg×reps · other
- `Calf_Raises_-_With_Bands` — Elevación de gemelo con bandas (Calf Raises - With Bands) · kg×reps · band
- `Standing_Calf_Raises` — Elevación de gemelo de pie (Standing Calf Raises) · kg×reps · machine
- `Rocking_Standing_Calf_Raise` — Elevación de gemelo de pie con balanceo (Rocking Standing Calf Raise) · kg×reps · barbell
- `Standing_Barbell_Calf_Raise` — Elevación de gemelo de pie con barra (Standing Barbell Calf Raise) · kg×reps · barbell
- `Standing_Dumbbell_Calf_Raise` — Elevación de gemelo de pie con mancuerna (Standing Dumbbell Calf Raise) · kg×reps · dumbbell
- `Smith_Machine_Calf_Raise` — Elevación de gemelo en máquina Smith (Smith Machine Calf Raise) · kg×reps · machine
- `Smith_Machine_Reverse_Calf_Raises` — Elevación de gemelo inversa en máquina Smith (Smith Machine Reverse Calf Raises) · kg×reps · machine
- `Seated_Calf_Raise` — Elevación de gemelo sentado (Seated Calf Raise) · kg×reps · machine
- `Dumbbell_Seated_One-Leg_Calf_Raise` — Elevación de gemelo sentado a una pierna con mancuerna (Dumbbell Seated One-Leg Calf Raise) · kg×reps · dumbbell
- `Barbell_Seated_Calf_Raise` — Elevación de gemelo sentado con barra (Barbell Seated Calf Raise) · kg×reps · barbell
- `Calf_Raise_On_A_Dumbbell` — Elevación de gemelo sobre mancuerna (Calf Raise On A Dumbbell) · kg×reps · dumbbell
- `Calf_Stretch_Elbows_Against_Wall` — Estiramiento de gemelo con codos en la pared (Calf Stretch Elbows Against Wall) · tiempo · other
- `Calf_Stretch_Hands_Against_Wall` — Estiramiento de gemelo con manos en la pared (Calf Stretch Hands Against Wall) · tiempo · other
- `Standing_Gastrocnemius_Calf_Stretch` — Estiramiento de gemelo de pie (Standing Gastrocnemius Calf Stretch) · tiempo · other
- `Seated_Calf_Stretch` — Estiramiento de gemelo sentado (Seated Calf Stretch) · tiempo · other
- `Peroneals_Stretch` — Estiramiento de peroneos (Peroneals Stretch) · tiempo · other
- `Standing_Soleus_And_Achilles_Stretch` — Estiramiento de sóleo y Aquiles de pie (Standing Soleus And Achilles Stretch) · tiempo · other
- `Posterior_Tibialis_Stretch` — Estiramiento del tibial posterior (Posterior Tibialis Stretch) · tiempo · other
- `Calves-SMR` — Liberación miofascial de gemelos (Calves-SMR) · tiempo · other
- `Peroneals-SMR` — Liberación miofascial de peroneos (Peroneals-SMR) · tiempo · other
- `Foot-SMR` — Liberación miofascial del pie (Foot-SMR) · tiempo · other
- `Anterior_Tibialis-SMR` — Liberación miofascial del tibial anterior (Anterior Tibialis-SMR) · tiempo · other
- `Calf_Press` — Press de gemelo (Calf Press) · kg×reps · machine
- `Calf_Press_On_The_Leg_Press_Machine` — Press de gemelo en prensa de piernas (Calf Press On The Leg Press Machine) · kg×reps · machine
- `Balance_Board` — Tabla de equilibrio (Balance Board) · kg×reps · other

### Abductores

- `Thigh_Abductor` — Abductores en máquina (Thigh Abductor) · kg×reps · machine
- `Hip_Circles_prone` — Círculos de cadera (boca abajo) (Hip Circles (prone)) · tiempo · none
- `Standing_Hip_Circles` — Círculos de cadera de pie (Standing Hip Circles) · tiempo · none
- `Lying_Crossover` — Cruce tumbado (Lying Crossover) · tiempo · none
- `IT_Band_and_Glute_Stretch` — Estiramiento de banda iliotibial y glúteo (IT Band and Glute Stretch) · tiempo · other
- `Iliotibial_Tract-SMR` — Liberación miofascial de la banda iliotibial (Iliotibial Tract-SMR) · tiempo · other
- `Windmills` — Molinillos (Windmills) · tiempo · other
- `Monster_Walk` — Monster walk (paseo con banda) (Monster Walk) · tiempo · band

### Aductores

- `Band_Hip_Adductions` — Aducción de cadera con banda (Band Hip Adductions) · kg×reps · band
- `Adductor` — Aductores en máquina (Adductor) · tiempo · other
- `Thigh_Adductor` — Aductores en máquina (Thigh Adductor) · kg×reps · machine
- `Side_Leg_Raises` — Elevación de pierna lateral (Side Leg Raises) · tiempo · none
- `Adductor_Groin` — Estiramiento de aductores/ingle (Adductor/Groin) · tiempo · other
- `Side_Lying_Groin_Stretch` — Estiramiento de ingle de lado (Side Lying Groin Stretch) · tiempo · other
- `Lying_Bent_Leg_Groin` — Estiramiento de ingle tumbado con pierna flexionada (Lying Bent Leg Groin) · tiempo · other
- `Groin_and_Back_Stretch` — Estiramiento de ingle y espalda (Groin and Back Stretch) · tiempo · other
- `Groiners` — Groiners (escalador con apertura) (Groiners) · tiempo · none
- `Carioca_Quick_Step` — Paso rápido carioca (Carioca Quick Step) · reps (peso corporal) · other
- `Lateral_Bound` — Salto lateral (Lateral Bound) · reps (peso corporal) · none
- `Lateral_Box_Jump` — Salto lateral al cajón (Lateral Box Jump) · kg×reps · other
- `Lateral_Cone_Hops` — Saltos laterales sobre conos (Lateral Cone Hops) · kg×reps · other

### Cuello

- `Isometric_Neck_Exercise_-_Front_And_Back` — Ejercicio isométrico de cuello (delante y detrás) (Isometric Neck Exercise - Front And Back) · tiempo · none
- `Isometric_Neck_Exercise_-_Sides` — Ejercicio isométrico de cuello (laterales) (Isometric Neck Exercise - Sides) · tiempo · none
- `Chin_To_Chest_Stretch` — Estiramiento de barbilla al pecho (Chin To Chest Stretch) · tiempo · other
- `Side_Neck_Stretch` — Estiramiento lateral de cuello (Side Neck Stretch) · tiempo · other
- `Neck-SMR` — Liberación miofascial de cuello (Neck-SMR) · tiempo · other
- `Seated_Head_Harness_Neck_Resistance` — Resistencia de cuello con arnés sentado (Seated Head Harness Neck Resistance) · kg×reps · other
- `Lying_Face_Down_Plate_Neck_Resistance` — Resistencia de cuello con disco boca abajo (Lying Face Down Plate Neck Resistance) · kg×reps · other
- `Lying_Face_Up_Plate_Neck_Resistance` — Resistencia de cuello con disco boca arriba (Lying Face Up Plate Neck Resistance) · kg×reps · other

### Cuerpo entero

- `mobility_routine` — Movilidad global (muñecas, hombros, cadera) (Mobility Routine) · tiempo · none

### Cardio

- `swimming_freestyle` — Natación (crol) (Swimming (Freestyle)) · distancia+tiempo · none
