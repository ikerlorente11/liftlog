# 🏋️ LiftLog — registro de entrenamientos (Expo / React Native)

App **Android nativa, 100 % offline y sin límites** para registrar entrenamientos, inspirada en
apps como Hevy o Strong: rutinas ilimitadas en carpetas, entreno en curso con
temporizador de descanso, biblioteca de ~890 ejercicios con imágenes de ejecución, historial,
gráficas de progreso, récords personales, medidas corporales y calendario.

Nace para poder seguir un **plan de entrenamiento de 24 semanas** sin los límites de rutinas de
las apps gratuitas. La app empieza vacía: el plan **no va dentro**. Como ejemplo hay un plan
genérico en `scripts/data/plan-ejemplo-backup.json` (3 días de cuerpo entero, 8 semanas con
descargas, rangos de repeticiones y una superserie), importable desde
Ajustes → Importar copia de seguridad.

**¿Quieres tu propio plan?** Cualquier IA te lo genera en el formato de la app: ver
[Generar tu plan con una IA](#-generar-tu-plan-con-una-ia).

## 🤖 Generar tu plan con una IA

La app no incluye planes: los importas desde un JSON. Para no escribirlo a mano, dale a una IA
(Claude, ChatGPT, Gemini…) **dos ficheros de este repo** y tu plan:

| Fichero | Qué es |
|---|---|
| [`docs/generar-plan-con-ia.md`](docs/generar-plan-con-ia.md) | Especificación del formato e instrucciones de trabajo para la IA: rutinas, series, superseries, rangos de repeticiones, programas por semanas, medidas. |
| [`docs/catalogo-ejercicios.md`](docs/catalogo-ejercicios.md) | Los ~890 ejercicios que la app ya trae, con su `id`, agrupados por músculo. **Imprescindible**: sin él la IA se inventa ejercicios personalizados para todo y salen sin foto ni instrucciones. |

Pasos:

1. Adjunta los dos ficheros al chat y describe tu plan (días, material, ejercicios, series,
   pesos de partida, progresión por semanas si la hay). Un PDF o una foto del plan también vale.
2. Pídele: *"Genera el JSON de copia de seguridad de LiftLog según la especificación, usando
   solo `exerciseId` del catálogo; dime qué personalizados has creado y por qué"*.
3. Guarda la respuesta como `mi-plan.json` y valídala (opcional, necesita el repo):

   ```bash
   npm run validate -- mi-plan.json
   ```

   El validador comprueba la estructura, que cada `exerciseId` exista y **avisa si un ejercicio
   personalizado duplica uno del catálogo**. Si da errores, pégaselos a la IA.
4. En el móvil: **Ajustes → Importar copia de seguridad → Fusionar**. Fusionar añade o actualiza
   por id sin borrar nada; si más adelante regeneras el plan con los mismos ids, las rutinas se
   actualizan en su sitio (salvo las que hayas cambiado en el móvil después, que se conservan).

El catálogo se regenera con `npm run catalog` (lo hace también `build-exercises.js`), así siempre
refleja `src/data/exercises.json`.

## ✨ Funcionalidades

| Pantalla | Qué hace |
|---|---|
| **Inicio** | Feed de entrenos (tarjeta con duración, volumen, récords y "mejor serie" por ejercicio), resumen semanal, menú (editar / guardar como rutina / eliminar). |
| **Entreno** | Inicio rápido (entreno vacío), rutinas por **carpetas** plegables (crear, renombrar, mover, duplicar, compartir, eliminar), tarjeta con "Empezar rutina" y semana del plan. |
| **Programas por semanas** | Una rutina puede llevar un plan de N semanas con fases (bloques, descargas, tests): la app calcula la semana actual, muestra "Semana X/N · Bloque" y carga los objetivos de la fase al entrenar; descargas = mitad de series automática; selector "Cambiar semana". |
| **Registrar entreno** | Cronómetro, volumen y series en vivo; por ejercicio: notas, temporizador de descanso, tabla `SERIE · ANTERIOR · KG · REPS · ✓`; tipos de serie (calentamiento W, drop set D, al fallo F), swipe para borrar, "Añadir serie" copia la anterior, marcar una serie vacía rellena con la anterior; superseries; reemplazar/reordenar/eliminar ejercicios; minimizar (barra "Reanudar" sobre las pestañas); descartar. Sobrevive a cierres de la app (AsyncStorage). |
| **Descanso** | Barra inferior con cuenta atrás, −15/+15, saltar; vibración y **notificación local** si la app está en segundo plano. |
| **Terminar** | Título/notas, resumen, detección automática de **PRs** (peso máx., 1RM estimado, volumen de serie; reps/tiempo/distancia según tipo), opción de **actualizar la rutina** con los pesos realizados, compartir texto. |
| **Ejercicios** | Búsqueda con acentos, filtros por equipamiento y músculo, secciones "Personalizados"/"Recientes"/A-Z, ejercicios personalizados (crear/editar/borrar). |
| **Detalle de ejercicio** | Imagen animada (2 fotogramas), enlace a vídeo demostrativo (YouTube), músculos, instrucciones; **Historial**, **Gráficas** (1RM estimado, peso máx., volumen, reps…), **Récords** (incl. tabla de récords por repeticiones). |
| **Perfil** | Gráfica de barras de 8 semanas (entrenos / volumen / duración), totales, panel: Estadísticas, Ejercicios, Medidas, Calendario. |
| **Medidas** | Composición corporal (peso, grasa como % y kg, masa muscular, proteínas, agua, mineral óseo, grasa visceral, metabolismo basal) y perímetros, con gráfica por origen e historial; pantalla **Evolución** con diferencias entre mediciones al estilo del informe de un nutricionista. **Configurar medidas**: añade, renombra, ordena u oculta campos y orígenes (báscula de casa, nutricionista, los que quieras, cada uno con su color); quitar algo con datos solo lo oculta. |
| **Ajustes** | Nombre, kg/lb, km/mi, tema (sistema/oscuro/claro), descanso por defecto, vibración, **exportar/importar copia JSON** (fusionar o reemplazar), borrar todo. |

Tipos de ejercicio soportados: peso × reps, peso corporal (+lastre / −asistencia), solo reps,
duración, distancia + duración, peso + duración.

## 📚 Datos de ejercicios y vídeos

Otras apps usan vídeos propios con copyright. Aquí se usa
[free-exercise-db](https://github.com/yuhonas/free-exercise-db) (dominio público, 873 ejercicios
con 2 fotos de ejecución + instrucciones), más 19 ejercicios extra que no existían (sentadilla
isométrica, step-down, pseudo-planche, front lever tuck, L-sit, natación, etc.). Los nombres están
traducidos al español (`scripts/data/names_es.json`) y las instrucciones también
(`scripts/data/instructions_es.json`: los 873 ejercicios de la base; el build las fusiona y deja en
inglés cualquiera que falte); las de los ejercicios del plan ya estaban en español (del anexo del PDF). Los extras sin
foto propia reutilizan las fotos de un ejercicio casi idéntico de la base, y L-sit/natación usan
fotos de dominio público del Gobierno de EE. UU. (Wikimedia Commons). Cada ejercicio tiene un botón
**"Ver vídeo demostrativo"** que abre la búsqueda en YouTube.

Las imágenes se cargan de GitHub y Wikimedia Commons bajo demanda y se cachean en disco
(`expo-image`); no se empaquetan en el APK. Todas son de dominio público o CC BY / BY-SA con la
atribución visible en la app; el wall sit no tiene foto libre y muestra el icono genérico. Detalle,
autores y cómo añadir fotos privadas en tu copia local sin subirlas al repo:
`docs/creditos-imagenes.md`.

Regenerar `src/data/exercises.json`:

```bash
node scripts/build-exercises.js scripts/data/ex.json scripts/data/names_es.json
# (las instrucciones ES se toman de scripts/data/instructions_es.json; al acabar regenera
#  docs/catalogo-ejercicios.md, el listado de ids para generar planes con IA)
```

## 🧪 Build de desarrollo (LiftLog Dev)

Para ver los cambios al momento en el móvil sin publicar nada, hay una **build de desarrollo**
que se instala **junto a la app real** (no la sustituye ni toca sus datos):

- La variante `debug` usa `applicationIdSuffix '.dev'` → se instala como
  `com.ikerlorente11.liftlog.dev`.
- El nombre visible es **LiftLog Dev** (`android/app/src/debug/res/values/strings.xml`).
- Ambas configuraciones viven en `android/`, que está en `.gitignore`: un `expo prebuild`
  las borraría, junto con la firma release del keystore de subida. Si alguna vez hay que
  regenerar `android/`, vuelve a aplicar las tres cosas.

Compilar e instalar (JDK 17, no vale el 8):

```bash
export JAVA_HOME="/c/Program Files/Microsoft/jdk-17.0.18.8-hotspot"
./android/gradlew -p android installDebug
```

Arrancar el servidor de desarrollo y abrir la app en el móvil:

```bash
npx expo start --dev-client
```

Con el móvil conectado por USB (`adb reverse` lo hace Expo solo) los cambios de JS se recargan
al guardar (Fast Refresh). Solo hace falta recompilar el APK si cambian dependencias nativas
o la configuración de `android/`.

> Al añadir una dependencia nativa (p. ej. `@react-native-community/datetimepicker`), el
> autolinking la detecta al recompilar con Gradle: **no hace falta `expo prebuild`**, así que la
> firma release y la configuración de la dev build en `android/` se conservan. Eso sí, esos
> cambios ya no se pueden entregar por OTA: la app real necesita una build nueva.

## 🔄 Publicar actualizaciones

Dos vías según lo que cambie:

| Cambio | Comando | Llega al usuario |
|---|---|---|
| Solo JS/assets (pantallas, lógica, datos) | `eas update --branch production -m "mensaje"` | Solo, al reabrir la app dos veces |
| Nativo (módulos, permisos, SDK, iconos) | subir `versionCode` en `app.json` → `eas build -p android --profile production` → subir el AAB a Play (prueba interna) | Actualizando desde Play Store |

La *runtime version* sigue la versión de la app (`appVersion`): tras un build nuevo con otra
versión, los binarios antiguos dejan de recibir OTAs (protección de compatibilidad).

## 🏗️ Arquitectura

- **UI:** React Native + Expo SDK 54 + Expo Router (pestañas Inicio / Entreno / Perfil + stack
  modal para entreno en curso, editor de rutina, ejercicios, ajustes). TypeScript estricto.
- **Datos:** `expo-sqlite` (`src/db/database.ts`): carpetas, rutinas + ejercicios + series,
  entrenos + ejercicios + series, ejercicios custom, medidas, ajustes clave/valor. Los ~890
  ejercicios base viven en memoria (`src/data/exercises.json`).
- **Estado:** zustand — `dataStore` (caché de BD + acciones), `workoutStore` (entreno en curso +
  temporizador, persistido en AsyncStorage), `settingsStore` (AsyncStorage).
- **Lógica pura:** `src/lib/stats.ts` (1RM Epley, volumen, récords, PRs, series de gráficas),
  `src/lib/format.ts` (unidades, fechas ES), `src/lib/labels.ts` (etiquetas ES),
  `src/lib/measurements.ts` (composición como % del peso), `src/lib/measurementConfig.ts`
  (campos y orígenes de medidas configurables; se guardan en la tabla `settings` y viajan con el backup).
- **Tema:** `src/theme.ts` (paleta oscura/clara, azul `#3d8bff`).

```
app/            rutas (expo-router)
  (tabs)/       index (Inicio) · workout (Entreno) · profile (Perfil)
  workout/      active · finish · [id]
  routine/      edit · [id]
  exercises/    index · [id] · new
  settings/     index · measurements · evolution · measurement-config · calendar · stats
src/
  components/   EntryEditor · ExercisePicker · ExerciseList · WorkoutCard · RoutineCard · RestTimerBar · Charts
  ui/           primitives · sheets · ExerciseImage
  store/ db/ lib/ data/ theme.ts types.ts
scripts/        build-exercises.js · build-exercise-catalog.js · make-icons.js · make-store-assets.js · validate-backup.js · data/ (fuentes + plan-ejemplo-backup.json)
private/        (ignorada por git) datos personales, planes propios y fotos de uso privado
docs/           generar-plan-con-ia.md · catalogo-ejercicios.md · creditos-imagenes.md
```

## ✅ Tests

```bash
npm test          # vitest: 1RM, volumen, PRs, récords, formato de series/tiempos, semanas, composición, configuración de medidas
npm run typecheck # tsc --noEmit
npm run validate -- fichero.json   # valida una copia de seguridad / plan antes de importarlo
npm run catalog                    # regenera docs/catalogo-ejercicios.md
```

## 🚀 Desarrollo y build

```bash
npm install --legacy-peer-deps
npx expo start                 # con un dev client instalado
npx expo run:android           # compila e instala en el dispositivo conectado
cd android && ./gradlew assembleRelease   # APK release firmado con debug keystore
npm run build:android          # EAS build (perfil preview → APK)
```

`JAVA_HOME` debe apuntar a un JDK 17 (p. ej. `C:\Program Files\Microsoft\jdk-17…`).

## 🏪 Publicación en Play Console

Historial de versiones en [`CHANGELOG.md`](CHANGELOG.md). Versión actual: **1.3.0 (versionCode 5)**.
Antes de cada build de producción sube `expo.android.versionCode` (y `expo.version` si cambia) en `app.json` y anota el cambio en el changelog.


- Textos y gráficos de la ficha: [`assets/store/FICHA_PLAY_CONSOLE.md`](assets/store/FICHA_PLAY_CONSOLE.md)
  (icono 512, feature graphic 1024×500, capturas 1080×2400, descripciones, clasificación, data safety).
- Política de privacidad: https://ikerlorente11.github.io/privacy_policies/liftlog/privacy-policy.html
  (repo `privacy_policies`).
- Firma: keystore de subida en `credentials/liftlog-upload.jks` + `credentials.json` (ambos **fuera de git**,
  `credentialsSource: local` en `eas.json`). Haz copia de esa carpeta: sin ella no se pueden publicar
  actualizaciones con la misma firma.
- Distribución privada: pista **Prueba interna** (lista de correos). `eas submit -p android --profile production`
  sube a `internal`.

```bash
eas build -p android --profile production   # AAB para Play
eas submit -p android --profile production  # requiere la app creada en Play Console + service account
```

## Licencia

Puedes usar, modificar y compartir este proyecto libremente para fines **no comerciales**.
No está permitido venderlo ni ganar dinero con él. Ver [LICENSE](LICENSE) (PolyForm Noncommercial 1.0.0).
