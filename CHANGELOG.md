# Changelog

Formato: versión (versionCode) — fecha.

## 1.3.0 OTA — 2026-09-10 (canal production, runtime 1.3.0)
- **El teclado ya no tapa las series del final** (feedback del 10/09: "al desplegarse el teclado este
  tapa la pantalla y no se ve lo que estás editando"). Con edge-to-edge Android no redimensiona
  la ventana al salir el teclado, así que el entreno activo y el editor de rutinas no dejaban
  ver ni tocar los inputs de abajo. Ahora la pantalla reserva el hueco del teclado en las dos
  plataformas: el input enfocado sube por encima del teclado y se puede seguir haciendo scroll
  hasta "Descartar entreno" con el teclado abierto. Probado en el dev client (Redmi Note 11).
  OTA publicada el 10/09 (grupo 50473c61, commit 939ba99).

## 1.3.0 OTA — 2026-09-09 (canal production, runtime 1.3.0)
- **Medidas de composición corporal** (feedback del 9/09: "en los datos que me pasa la nutricionista
  me viene…"). Nuevas medidas junto a peso y grasa %: **Masa grasa**, **Proteínas**, **Agua
  corporal** y **Mineral óseo** (masas: se guardan en kg y se muestran en kg/lb como el peso),
  **Grasa visceral** (índice, sin unidad) y **Metabolismo basal** (kcal). Van primero en la
  tira de chips de Medidas, antes de los perímetros, y admiten los dos orígenes (báscula de
  casa / nutricionista). El validador de copias acepta las claves nuevas.
- **Medidas en dos familias con color propio** (feedback del 9/09: "distinguir de manera más visual").
  La tira de chips se divide en **Composición corporal** (azul, icono de báscula: peso, grasa,
  músculo, agua…) y **Perímetros** (morado, icono de cinta: cuello, pecho, brazos…), y la tarjeta
  de la medida elegida lleva el color de su familia.
- **Pantalla "Evolución"** (Perfil → Medidas → icono de tendencia o botón "Ver evolución con
  diferencias"), copiando el informe "Evolutivo" de la nutricionista: por cada medida, una barra
  por medición con el valor encima y la **diferencia respecto a la anterior** debajo (+1,3 /
  -0,2), la última barra resaltada y las anteriores apagadas, más "vs anterior" y "desde la
  primera". Se elige el origen (nutricionista por defecto, o báscula de casa) porque la diferencia
  útil es entre mediciones del mismo aparato. La diferencia va en verde cuando se mueve en el
  sentido bueno de esa medida (grasa y grasa visceral bajando; músculo, proteínas, agua, hueso y
  metabolismo subiendo) y en gris para peso y perímetros, que dependen del objetivo. Si la serie
  cruza de un año a otro las fechas llevan el año. Colores fijos por medida (grasa rojo, músculo
  naranja, agua azul) como en los informes.
- **Composición como "% (kg)"** (feedback del 9/09: "que los datos se viesen en % más que en kg" y
  "que sea igual para todos"). Grasa corporal, masa grasa, masa muscular, proteínas, agua y
  mineral óseo se muestran siempre con las dos cifras en el formato **18,9 % (17,1 kg)**: en
  Medidas (valor grande e historial) y en Evolución, donde un conmutador "% del peso / kg"
  (por defecto %) decide cuál manda en las barras y la diferencia, y la otra va entre
  paréntesis. La cifra que no está guardada se deriva del peso del MISMO origen medido ese
  día (±3 días): la grasa corporal se guarda en % y saca los kg, las masas se guardan en kg
  y sacan el %. Sin peso comparable solo se ve la cifra guardada y la tarjeta lo avisa (pasa
  con los tres evolutivos de 2025). Lógica en `src/lib/measurements.ts` con tests.
- **Una sola "Grasa corporal"** (feedback del 9/09: "grasa corporal y masa grasa son lo mismo"). Se
  guarda en kg (`fat_mass`) y se ve como "18,9 % (17,1 kg)". Al añadirla se puede teclear en
  % (como la da la báscula, opción por defecto) o en kg; el % se convierte con el peso del
  mismo origen de ese día y, si no lo hay, la app pide apuntar antes el peso. Migración v1.5
  al abrir la base y tras cada importación: cada "Grasa corporal (%)" antigua (`body_fat`) se
  convierte a kg con el peso de ese día y se borra; si ya existía la masa grasa de ese día se
  descarta el duplicado; sin peso comparable se conserva oculta hasta que lo haya.

## 1.3.0 OTA — 2026-09-08 (canal production, runtime 1.3.0)
- **Fin de entreno en dos pasos** (feedback del 8/09: "creo que unos sobreescriben a otros"). Al
  guardar, primero **1 · ¿Guardar en la rutina lo de hoy?** con la lista exacta de cambios
  (p. ej. "Fondos: 8 reps ×3 → 10 reps ×3"; los ejercicios nuevos se añaden y los no hechos
  hoy se mantienen, no se borran) y las opciones "Dejar como está" / "Guardar en la rutina".
  Solo después aparece **2 · ¿Subir algo para la próxima semana?** con TODOS los ejercicios
  con objetivo (los limpios marcados en verde) y una opción por campo: "+2,5 kg" (+5 en
  máquinas/prensas), "+1 rep" y "+5 s" por separado, u "Otro…" para fijar a mano peso y
  reps a la vez (subir peso bajando reps). Cada subida se puede deshacer. Al guardar lo de hoy
  se conservan los calentamientos de la rutina si no los has apuntado (el botón antiguo los
  borraba: esta mañana Pierna A perdió los dos de aproximación de la prensa).
- **"Última vez" compara con la misma rutina** (feedback del 8/09: "me ponía que la última vez había
  hecho 3 en vez de 5"). La columna "anterior" cogía el último entreno con ese ejercicio de
  cualquier rutina: en Pierna A la prensa mostraba las 3×10 a 180 de Pierna B (viernes) en vez
  de las 5×5 a 220 del martes anterior. Ahora prioriza la última sesión de esa rutina y solo
  si nunca la ha hecho mira el resto.
- **Importar → Fusionar no pisa una rutina cambiada después en el móvil**: si la del móvil
  tiene `updatedAt` más reciente que la del archivo, se conserva y el aviso dice cuáles no se
  han tocado. Causa real de "el lunes vuelve a poner 6": el usuario hacía 10 pseudo-planche y
  guardaba la rutina, y cada importación del repo (2/09, 4/09 y 7/09) la devolvía a las 6 del
  plan inicial. Con esto el repo también debe partir del export del móvil (ver revisiones.md).
- **Rango de repeticiones por ejercicio (doble progresión automática)**. En el editor de
  rutina cada ejercicio con reps tiene "Rango de reps: 8-12" (presets o a mano). Con rango, el
  paso 2 del fin de entreno solo ofrece "+1 rep" mientras no llegues al máximo, y cuando
  completas el máximo en todas las series ofrece una sola opción: "+2,5 kg y volver a 8 reps"
  (a peso corporal avisa de que toca cambiar de variante/palanca). "Otro…" sigue disponible
  para salirse del guion. El rango se ve en la rutina y en el entreno en curso. Migración de BD
  (`rep_min`/`rep_max` en `routine_exercises`), viaja en el backup. El plan del repo lleva ya
  19 rangos sacados de las notas ("3×8-12").
- **Exportar rutinas concretas**: en "Exportar copia" → Rutinas → "Elegir rutinas concretas…"
  se marcan las que se quieran (agrupadas por carpeta). El archivo lleva solo esas rutinas, sus
  carpetas y sus ejercicios personalizados (p. ej. `liftlog-rutina-martes-piscina-1-series.json`
  para pasársela a alguien).
- **Marcar series y empezar rutina sin retraso** (feedback del 8/09: "bastante delay"). Medido en la
  build de desarrollo: marcar una serie tardaba ~490 ms desde el toque hasta pintarse, de los
  que ~280 ms eran repintar las pantallas de DEBAJO (Inicio con el historial, la lista de
  rutinas y la ficha de la rutina) porque estaban suscritas al entreno entero; ahora solo saben
  si hay entreno en curso. Además el segundero repintaba toda la pantalla cada segundo y los
  callbacks nuevos en cada render anulaban el memo de las tarjetas: ahora el reloj va aparte, los
  callbacks son estables y el store conserva las referencias de lo que no cambia, así que marcar
  una serie repinta solo esa tarjeta (~100 ms en desarrollo, menos en release). Empezar rutina
  pasaba de 1,1 s a ~0,5 s hasta la primera pintura: se montan dos tarjetas y el resto en los
  fotogramas siguientes.
- **Segunda pasada** (feedback: "sigue con delay, se va trabando, y guardar tarda"). Medido con el
  bundle en modo producción en el Redmi: lo caro es crear las vistas nativas de cada tarjeta
  (~115 ms). Se quita el gesto de deslizar por fila (un tercio del coste; borrar sigue en el
  menú del número de serie o con pulsación larga), las celdas de kg/reps/tiempo y las notas son
  texto en reposo y solo se convierten en caja de texto al tocarlas (~100 TextInput menos por
  entreno), y tras las dos primeras tarjetas se monta una por fotograma para no trabar el
  scroll. Guardar: la base de datos tardaba 79 ms pero la pantalla esperaba ~1,3 s a que se
  repintaran el historial, las estadísticas y las pestañas de debajo; ahora "Entreno guardado"
  aparece primero (~0,4 s en producción) y esos repintados van 300 ms después. Las tarjetas del
  historial van con memo para que al guardar solo se pinte la nueva.

## Sin publicar — 2026-09-07
- **Importar → Fusionar ya no deja el plan "sin empezar"**: si la rutina importada trae el
  programa sin fecha de inicio (como el backup del repo) se conserva la fecha que ya tenía en
  el móvil. Detectado el 7/09: tras las importaciones del 26/08, 1/09 y 4/09 las 11 rutinas con
  programa estaban "sin empezar" y al abrir Torso A se auto-arrancó en la semana 1 (era la 3);
  con Piscina 1 eso habría mostrado el martes la "semana de test" en vez de 8×2 largos. Además
  el backup del repo lleva ahora `startedAt` = lunes 24/08/2026 en todas las rutinas.

## 1.3.0 (5) — 2026-09-03
- **Aviso de fin de descanso con jerarquía clara** (feedback del 3/09: "a veces salta y otras no").
  1) App en primer plano: avisa la propia app (vibración larga, el mismo patrón que el canal;
  antes era un háptico corto) y la notificación del sistema se silencia; 2) app en segundo
  plano o pantalla bloqueada: notificación con sonido y vibración, visible en la pantalla de
  bloqueo; 3) al volver a la app se retiran las ya mostradas. Causa del "bloqueado no hace
  nada": faltaba `USE_EXACT_ALARM`, sin él Android 12+ programa la alarma como inexacta y la
  retrasa minutos con la pantalla apagada. **Requiere build nativa nueva** (permiso en
  app.json); el canal pasa a `timers-v2` para que se apliquen los ajustes nuevos. Además el
  permiso denegado ya no se cachea para siempre.
- **El descanso ya no desaparece al marcar una serie con el 0:00 aún en pantalla**
  (detectado el 2/09 en calistenia: marcaba la serie, arrancaba el descanso y se
  esfumaba; había que desmarcar y volver a marcar). Al llegar a 0:00 la barra se cerraba sola
  1,2 s después sin comprobar si mientras tanto se había lanzado otro descanso, y se lo
  llevaba por delante (más fácil de provocar al volver del bloqueo, porque Android pausa los
  timers en segundo plano). Ahora el auto-cierre solo borra el descanso que terminó.
- **"Actualizar rutina" ya no deshace la progresión de un toque** (detectado el
  2/09: subió banca pausada y curl +2,5 al guardar y al tocar "Actualizar rutina" volvieron
  al peso del día). Los ejercicios subidos desde la tarjeta de progresión conservan sus
  objetivos nuevos, y la tarjeta de actualizar no aparece cuando el único cambio respecto
  al entreno es la propia subida.
- **Los calentamientos no cuentan como series pendientes**: la regla "la última serie del
  entreno no arranca descanso" ahora mira solo las series efectivas (una W sin marcar ya
  no provoca que la última serie real lance el descanso), y el aviso "Hay X series sin
  marcar" al terminar tampoco cuenta calentamientos sin marcar.
- **Temporizador relanzable en series ya hechas**: en ejercicios de tiempo a una ejecución
  por lado (plancha lateral), el botón de play sigue activo tras completarse la cuenta
  atrás del primer lado: se puede volver a lanzar para el segundo sin desmarcar y
  remarcar la serie.

- **Imágenes corregidas en el catálogo** (detectado en uso: el hollow rock salía como
  alguien boca abajo en un banco). Auditadas VISUALMENTE todas las fotos "donantes" de los
  ejercicios extra: hollow body y hollow rocks pasan de Flutter_Kicks (glúteo boca abajo
  en banco, nada que ver) a **Jackknife_Sit-Up** (boca arriba en el suelo: estirado con
  brazos atrás y en V), y las elevaciones laterales en polea pasan de la variante sentada
  (parecía un pájaro) a **Standing_Low-Pulley_Deltoid_Raise** (de pie, como en el plan).
  El resto de donantes están bien. Además, el "Test rodilla: sentadilla monopodal
  declinada" no tenía imagen: se le asignan las de Single-Leg_High_Box_Squat (esto va en
  el backup, ya fusionado en el móvil; lo del catálogo llega por OTA). en la pantalla de "Entreno guardado",
  los ejercicios completados limpios (todas las series hechas llegando al objetivo de la
  rutina) aparecen en una tarjeta "Progresión para la próxima semana" con un botón para
  subirlos en su intervalo: **peso** +2,5 kg (+5 kg en máquinas y prensas de discos),
  **reps a peso corporal** +1 (también lastradas que siguen a lastre 0, como la dominada
  explosiva) y **tiempo** +5 s (plancha, L-sit, pino…) — así también funciona en calistenia.
  No se ofrece en asistidas (ahí se progresa bajando la goma), sin objetivo definido (los
  días de calibración usan "Actualizar rutina") ni en semanas gestionadas por fase
  (piscina, descargas). La lista se congela al guardar para que la fila no desaparezca al
  subir el valor.

- **Descanso corto tras el calentamiento**: al completar una serie de calentamiento (W) el
  temporizador arranca como mucho con 60 s, aunque el ejercicio tenga 3 min entre series
  efectivas — no hace falta descansar 3 min después de mover 20 kg. Si el descanso del
  ejercicio ya es menor de 60 s, se respeta.

- Plan: **calistenia de skills recalibrada con la semana 1 (28/08/2026)**, completada
  clavada al plan (explosiva 3×3, L-sit 4×10", pino 4×20", hollow 3×15, movilidad 8').
  Semana 2: explosiva 3×4 (dentro del 3-5 del camino al muscle-up), L-sit 4×12" y pino
  4×25" (+2-5 s por semana en isométricos). Hollow rocks se queda en 3×15 (prima la
  técnica). Además, **nueva "Dominada explosiva con goma (muscle-up)" 3×6 con goma de
  40 kg** como 2.º ejercicio (ejercicio personalizado asistido, `explosive_pullup_band`):
  el usuario ya la hizo por su cuenta el día 1 buscando la transición del muscle-up; se progresa
  bajando la asistencia (40→30→20 kg), no subiendo reps. Se aplica por backup fusionado,
  sin build.

- Plan reajustado con el **Pierna B y la Piscina 2 del día 1 (27-28/08/2026)**: la búlgara en
  Smith pasa a segundo ejercicio (la única Smith del gimnasio hay que pillarla a primera hora
  y así se hace en fresco), el hip thrust pasa de barra a **máquina** (ejercicio personalizado
  nuevo; el montaje con barra es incómodo — referencia con barra: 120×8, recalibrar día 1 en
  máquina), y la superserie gemelo (4)+step-down (2) queda definida: gemelo 1-2 solas y
  step-down en el descanso de las series 3 y 4. Piscina sin recalibrar (2×300 en 5:15/5:45 con
  reloj poco fiable; desde la semana 2 hay reloj propio). Se aplica por backup fusionado, sin build.

- **Sin descanso tras la última serie del entreno**: al completar la última serie pendiente de
  todo el entrenamiento (sea del último ejercicio o de uno que dejaste para el final), ya no
  arranca el temporizador de descanso — no hay nada que descansar. Aplica tanto al tick
  manual como a las series de tiempo que terminan solas.

- Plan recalibrado con el **Torso C y la Calistenia de tirón del día 1 (26-27/08/2026)**:
  inclinado mancuernas 25→30/mano (acabó 27,5×10 sobrado), cruce de poleas de 3 a 4 series
  (el peso se queda en 10: exige sin romper la técnica, confirmado en uso), y **nuevo press de banca plano con mancuernas 3×10 a 30/mano** (el pecho se quedaba
  corto de estímulo y la sesión corta: 47 min). La superserie de hombro se corrige a la baja
  (única sobreestimación de la semana 1): laterales 3×15→3×12 estrictas y face pull 25→20 kg,
  porque a 15 repeticiones con el peso tope la técnica se rompía. Dominadas de calistenia
  3×5→3×8 (salieron fáciles la misma tarde del gym). Se aplica por backup fusionado, sin build.

- **Marcar todas las series de un tirón**: el tick de la cabecera de la tabla de series (ahora
  doble check ✓✓) marca todas las series del ejercicio como hechas de golpe — pensado para
  apuntar a posteriori sesiones como la piscina sin ir una a una. Rellena las series vacías con
  los valores de ANTERIOR (igual que el tick individual), **no arranca el temporizador de
  descanso** (ni el de serie), y si ya están todas hechas las desmarca. Disponible en el entreno
  en curso y al editar un entreno guardado.

- **Temporizador integrado en las series de tiempo**: los ejercicios con columna TIEMPO
  (plancha, isométricos, farmer walk, natación...) llevan un botón ▶ en cada serie dentro del
  entreno en curso. Si la serie tiene un tiempo objetivo (el suyo o el de la vez anterior) hace
  **cuenta atrás** y al llegar a cero **vibra y lanza notificación** ("Serie terminada"), marca la
  serie como hecha y arranca el descanso; si no hay objetivo funciona como **cronómetro** y al
  pararlo guarda el tiempo hecho en la serie. Barra inferior con el tiempo, ±15 s, cancelar y
  "Hecha"; el tiempo también se ve en el banner del entreno minimizado y el temporizador
  sobrevive a cerrar la app. Ya no hace falta sacar el reloj o el temporizador del móvil.
  Descanso y serie son excluyentes: arrancar una serie corta el descanso en curso.

- **Catálogo (rehab rodilla)**: el wall sit pasa a peso + tiempo (para registrar la carga del
  isométrico), el pino se renombra a "Pino (pared o barra)" con variante de parque, y
  "Rehabilitación de rodilla en el agua" trae las instrucciones del circuito completo. Ya
  publicado por OTA en 1.2.0.

## 1.2.0 (4) — 2026-08-24
- **Medidas: una sola gráfica con los dos orígenes** (báscula de casa en azul, nutricionista en
  naranja) en vez de una gráfica por origen, porque son complementarios: la báscula da la
  tendencia y la nutricionista el valor de referencia. Nueva `MultiLineChart` con **eje X
  temporal real** (el `LineChart` repartía los puntos por índice, lo que desalinearía dos series
  medidas a distinto ritmo). El historial pasa a ser único, con un punto de color por origen.
- **Registrar medida**: el origen se elige ahora dentro del diálogo (donde se mete el valor) y
  se puede fijar la **fecha**, para meter históricos: campo dd/mm/aaaa, flechas de ±1 día y el
  **calendario del sistema** (`@react-native-community/datetimepicker`), que se abre como diálogo
  propio y por eso no cambia el tamaño del modal. No admite fechas futuras.
  ⚠️ Es una dependencia **nativa**: a partir de esta versión los cambios necesitan **build nueva**
  (no basta con `eas update`).
- **Medidas con doble origen**: cada medida/pesaje se guarda como "Báscula de casa" (seguimiento
  frecuente, la tendencia es fiable aunque el número absoluto no lo sea) o "Nutricionista"
  (medición profesional, menos frecuente). Selector en la pantalla de Medidas: cada origen tiene
  su propio historial y gráfica, para comparar solo medidas comparables entre sí. Migración de
  BD: columna `source` en `measurements` (las medidas existentes pasan a "Báscula de casa");
  el origen viaja en la copia JSON.
- **Catálogo de ejercicios en español y con imágenes**: las instrucciones de los 873 ejercicios de
  free-exercise-db están traducidas al español (`scripts/data/instructions_es.json`); el build las
  fusiona y deja en inglés cualquiera que faltase. 13 de los 19 ejercicios extra del plan ganan
  imagen: 11 reutilizan las fotos de un ejercicio casi idéntico de la base (banca pausada, búlgara
  Smith, step-down, katana, pseudo-planche, plancha lateral, dominada explosiva, fondos lastrados,
  laterales en polea, pino en pared, pike push-up) y 2 usan fotos de dominio público del Gobierno
  de EE. UU. vía Wikimedia Commons (L-sit y natación crol; la de crol también en los 5 ejercicios
  personalizados de natación). **Los 892 ejercicios del catálogo tienen ya imagen**: hollow body,
  hollow rocks y movilidad reutilizan fotos de la base, y wall sit, front lever tuck y rehab en
  piscina usan fotos con licencia Creative Commons recortadas e incrustadas como data URI en
  `scripts/data/extra_images.json`. ⚠️ Estas tres solo valen para uso privado (la de wall sit es
  CC BY-ND, que no permite recortes al distribuir); hay que revisarlas antes de publicar la app.
  Autoría y condiciones en `docs/creditos-imagenes.md`.
- **Eliminar serie más accesible**: mantener pulsada la fila de una serie abre el menú de la
  serie (tipos + eliminar), igual que tocar su número. Corregido el swipe-para-borrar, que no
  se activaba en la build release (ReanimatedSwipeable con new arch dentro de ScrollView): se
  vuelve al `Swipeable` clásico de react-native-gesture-handler.
- Plan recalibrado con el **Torso A del día 1 (24/08/2026)**: banca 72,5→80 (llegó a 82,5×5 con
  margen; objetivo 24 sem 95-100), militar 35→40, inclinado 60→65, dominadas lastradas 0→+5
  (hizo +7,5×6). Torso B: dominadas 5×5 0→+5, banca pausada 62,5→67,5. Torso C: press inclinado
  mancuernas 22,5→25/mano, press sentado 20→22,5/mano. Se aplica por backup fusionado, sin build.
- **Registro a posteriori** (piscina sin móvil): interruptor "Descanso automático" en el entreno
  en curso para marcar series sin que arranque el temporizador, y duración editable (minutos) en
  la pantalla de guardar; el entreno se guarda como terminado ahora y empezado hace esa duración.
- Corregido: al marcar varias series seguidas quedaban notificaciones de descanso huérfanas que
  seguían sonando mucho después del entreno. Ahora la programación se serializa, se cancelan
  todas las pendientes y al arrancar la app sin descanso activo se limpian.
- Backup del plan: objetivos de piscina recalculados con el **test 1 (21/08/2026)**: 400 m en
  7:30 y 200 m en 3:33 → 1:58 por 100 m (antes provisionales sobre 2:30). Calentamiento y
  vuelta a la calma pasan a una sola serie de distancia sin tiempo objetivo (solo marcar hecha).
  Se aplica por OTA/backup, sin build nueva.

## 1.1.0 (3) — 2026-08-20
- **Programas por semanas**: una rutina puede llevar un plan de N semanas dividido en fases
  (bloques, descargas, semanas de test). La app calcula la semana actual, la muestra en la
  tarjeta y el detalle ("Semana 3/24 · Bloque 1"), y al empezar el entreno carga los objetivos
  de la fase que toca. Descargas automáticas (mitad de series), selector "Cambiar semana", y el
  plan arranca solo con el primer entreno. En semanas gestionadas por el plan no se ofrece
  "Actualizar rutina" (los objetivos vienen del programa).
- Migración de BD: columna `program` en `routines`; el programa viaja en la copia JSON.
- Backup del plan regenerado: las 11 rutinas llevan su programa de 24 semanas (gimnasio y
  calistenia con bloques + descargas en semanas 7/14/21; piscina con objetivos explícitos por
  semana, descargas en 6/12/18/24 y tests en 1/7/13/19).
- Firma release local con el keystore de subida (actualizaciones por adb sin perder datos).
- **EAS Update (OTA)**: la app comprueba al arrancar si hay actualización de JS publicada
  (canal `production`) y la aplica en el siguiente arranque. Las mejoras que no tocan código
  nativo llegan sin pasar por Play Store: `eas update --branch production -m "mensaje"`.

## Sin publicar — 2026-08-20
- Plan de ejemplo (`scripts/data/plan-ejemplo-backup.json`): bloque de piscina rehecho. Los dos días
  pasan de "series sueltas + continuo" a sesiones estructuradas (calentamiento, drills de técnica,
  patada sin tabla, serie principal a ritmo CSS, bloque de fuerza con membranas, vuelta a la
  calma) con tiempos
  objetivo por repetición, más una rutina nueva de **test CSS** cada 6 semanas y 5 ejercicios
  personalizados de piscina. Progresión de 24 semanas en `scripts/data/piscina-progresion.md`.
  Solo cambia el backup: la app no necesita build nueva.

## 1.0.0 (2) — 2026-08-18
Primera versión publicada en Play Console (pista de prueba interna). Build EAS `0faa3bcf`.
- Rutinas ilimitadas en carpetas, superseries, descansos por ejercicio, tipos de serie (W/D/F).
- Entreno en curso con cronómetro, valores "anterior", temporizador de descanso con vibración y notificación, minimizar/reanudar.
- Biblioteca de ~890 ejercicios en español (free-exercise-db) con imágenes, instrucciones, filtros y ejercicios personalizados.
- Récords personales automáticos, historial, gráficas, medidas, calendario y estadísticas.
- Copia de seguridad JSON (exportar/importar), kg/lb, km/mi, tema oscuro por defecto.
- Sin siembra de rutinas: la app empieza vacía (el plan personal se importa desde `scripts/data/plan-ejemplo-backup.json`).

## 1.0.0 (1) — 2026-08-18
Build inicial (consumido en Play Console, no publicado): incluía la siembra automática del plan de 24 semanas.
