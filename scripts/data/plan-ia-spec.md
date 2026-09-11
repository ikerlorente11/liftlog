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
