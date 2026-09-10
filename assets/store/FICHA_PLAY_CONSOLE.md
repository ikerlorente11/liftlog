# Ficha de Play Console — LiftLog

Todo lo necesario para rellenar la ficha. Los ficheros gráficos están en esta misma carpeta.

## Identificación
- **Nombre de la app**: LiftLog
- **Paquete**: `com.ikerlorente11.liftlog`
- **Idioma predeterminado**: Español (España) — es-ES
- **Tipo**: Aplicación · **Gratis**
- **Categoría**: Salud y bienestar (alternativa: Deportes)
- **Correo de contacto**: ikerlorentecalvo@gmail.com
- **Política de privacidad**: https://ikerlorente11.github.io/privacy_policies/liftlog/privacy-policy.html
- **Distribución recomendada**: pista *Pruebas → Prueba interna* (hasta 100 testers por Gmail, sin revisión ni beta pública). `eas submit -p android --profile production` sube a `internal`.

## Gráficos (en esta carpeta)
| Fichero | Uso | Tamaño |
|---|---|---|
| `icon_playstore.png` | Icono de la app en la ficha | 512×512 PNG |
| `feature_graphic.png` | Gráfico de funciones | 1024×500 PNG |
| `inicio.jpg`, `rutinas.jpg`, `registrar_entreno.jpg`, `entreno_guardado.jpg`, `ejercicios.jpg`, `ejercicio_detalle.jpg`, `graficas.jpg`, `records.jpg`, `perfil.jpg` | Capturas de teléfono (mín. 2, máx. 8 por idioma) | 1080×2400 JPG |

Orden sugerido de capturas: rutinas → registrar_entreno → entreno_guardado → inicio → ejercicios → ejercicio_detalle → graficas → perfil.

Regenerar: `SHARP_DIR=<carpeta con sharp> node scripts/make-store-assets.js <carpeta con PNG de capturas>`.

## Descripción breve (máx. 80 caracteres)
```
Registra tus entrenos: rutinas ilimitadas, descansos, récords y gráficas.
```
(72 caracteres)

## Descripción completa (máx. 4000 caracteres)
```
LiftLog es un registro de entrenamientos de fuerza rápido, sin cuentas y sin límites: crea todas las rutinas que quieras, apunta cada serie con peso × repeticiones, controla los descansos y sigue tu progreso con récords personales y gráficas. Todo se guarda en tu teléfono.

RUTINAS SIN LÍMITE
• Crea rutinas ilimitadas y organízalas en carpetas (por ejemplo: gimnasio, calistenia, piscina).
• Series objetivo con peso, repeticiones, tiempo o distancia; series de calentamiento, drop sets y al fallo.
• Superseries, notas por ejercicio y temporizador de descanso configurable en cada ejercicio.
• Duplica, mueve entre carpetas, comparte y edita cualquier rutina en segundos.

ENTRENO EN CURSO
• Cronómetro, volumen y series completadas en tiempo real.
• Tabla de series con los valores de tu última sesión ("anterior") para saber qué superar.
• Marca cada serie con un toque y arranca el descanso automáticamente: barra con cuenta atrás, −15/+15 s, vibración y notificación aunque la app esté en segundo plano.
• Añade, reemplaza o reordena ejercicios sobre la marcha, minimiza el entreno y sigue usando la app.
• Al terminar: resumen, récords personales detectados automáticamente y opción de actualizar la rutina con los pesos que has hecho.

BIBLIOTECA DE EJERCICIOS
• Casi 900 ejercicios en español con imágenes de ejecución, músculos trabajados, equipamiento e instrucciones paso a paso.
• Búsqueda instantánea y filtros por grupo muscular y equipamiento.
• Crea tus propios ejercicios personalizados.
• Historial completo, gráficas de progreso (1RM estimado, peso máximo, volumen, repeticiones) y récords por número de repeticiones para cada ejercicio.

PROGRESO
• Inicio con el historial de entrenos: duración, volumen, récords y mejor serie de cada ejercicio.
• Perfil con gráfica de entrenos, volumen y tiempo de las últimas semanas, estadísticas globales, calendario y medidas corporales (peso, % grasa, perímetros).

TUS DATOS, EN TU MÓVIL
• Sin registro, sin cuenta, sin anuncios y sin seguimiento. Funciona sin conexión.
• Copia de seguridad en un fichero JSON para exportar e importar cuando quieras.
• Unidades en kg o lb, km o millas; tema oscuro y claro.

Las imágenes e instrucciones de los ejercicios proceden de la base de datos de dominio público free-exercise-db.
```

## Clasificación de contenido (cuestionario IARC)
- Categoría: **Utilidad, productividad, comunicación u otros**.
- Violencia, sexo, lenguaje, drogas, apuestas: **No** a todo.
- Interacción entre usuarios / compartir ubicación / compras: **No**.
- Resultado esperado: PEGI 3 / Para todos.

## Seguridad de los datos (Data safety)
- ¿Recopila o comparte datos de usuario? **No**.
- ¿Los datos se cifran en tránsito? N/A (no se transmiten datos).
- ¿Permite solicitar la eliminación de datos? N/A (todo es local; el usuario puede borrar los datos desde Ajustes → Borrar todos los datos, o desinstalando).
- Nota: la app descarga imágenes de ejercicios desde GitHub (raw.githubusercontent.com); no envía información del usuario.

## Público objetivo y contenido
- Público objetivo: **18 y más** (o 13+; no está dirigida a niños).
- ¿Anuncios? **No**.
- Noticias: **No**. App de salud: contenido general de fitness, sin datos de salud enviados a terceros.
- Declaración de la app de fitness: los datos de entrenamiento se almacenan solo en el dispositivo.

## Permisos declarados (para el formulario de permisos, si lo pide)
- `POST_NOTIFICATIONS`: aviso al terminar el temporizador de descanso.
- `VIBRATE`: vibración al terminar el descanso.
- Sin acceso a ubicación, contactos, cámara ni micrófono.

## Notas de la versión 1.1.0 (formato multi-idioma de Play Console)
```
<es-ES>
Novedades:
• Programas por semanas: una rutina puede llevar un plan de varias semanas con bloques, descargas y tests; la app calcula la semana actual y carga los objetivos que tocan al empezar el entreno.
• Semana visible en cada rutina ("Semana 3/24 · Bloque 1") y selector para cambiarla.
• Semanas de descarga automáticas: mitad de series con tus pesos actuales.
• La copia de seguridad JSON incluye los programas.
</es-ES>
<en-US>
What's new:
• Weekly programs: a routine can carry a multi-week plan with blocks, deloads and test weeks; the app tracks the current week and loads that week's targets when you start a workout.
• Week shown on each routine ("Week 3/24 · Block 1") with a week picker.
• Automatic deload weeks: half the sets at your current weights.
• JSON backups now include programs.
</en-US>
```

## Notas de la versión 1.0.0 (formato multi-idioma de Play Console)
```
<es-ES>
Primera versión de LiftLog:
• Rutinas ilimitadas organizadas en carpetas, con superseries y descansos por ejercicio.
• Entreno en curso con cronómetro, valores de la sesión anterior y temporizador de descanso con aviso.
• Biblioteca de casi 900 ejercicios en español con imágenes e instrucciones; ejercicios personalizados.
• Récords personales automáticos, historial, gráficas de progreso, medidas y calendario.
• 100 % offline, sin cuenta ni anuncios; copia de seguridad en JSON.
</es-ES>
<en-US>
First release of LiftLog:
• Unlimited routines organized in folders, with supersets and per-exercise rest timers.
• Live workout logging with stopwatch, previous-session values and rest timer alerts.
• Library of nearly 900 exercises with images and step-by-step instructions; custom exercises.
• Automatic personal records, history, progress charts, body measurements and calendar.
• 100% offline, no account, no ads; JSON backup and restore.
</en-US>
```

## Publicación
1. `eas build -p android --profile production` (AAB firmado con la keystore de `credentials/`).
2. Crear la app en Play Console y rellenar la ficha con este documento.
3. Pruebas → Prueba interna → crear versión → subir el AAB → añadir la lista de correos (tú y tus usuarios) → copiar el enlace de invitación.
4. Siguientes versiones: subir `versionCode` en `app.json`, `eas build` y `eas submit -p android --profile production` (pista `internal`).
