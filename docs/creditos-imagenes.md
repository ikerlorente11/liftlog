# 🖼️ Créditos de las imágenes de ejercicios

La gran mayoría de las imágenes vienen de
[free-exercise-db](https://github.com/yuhonas/free-exercise-db) (**dominio público**), que cubre los
873 ejercicios del catálogo base. Los 19 ejercicios extra no están en esa base y se
resuelven así:

## 1. Reutilizando fotos de free-exercise-db (dominio público)

Cuando existe un ejercicio prácticamente idéntico, se reutilizan sus dos fotos:

| Ejercicio del plan | Fotos tomadas de |
| --- | --- |
| Press banca pausado | Barbell Bench Press - Medium Grip |
| Sentadilla búlgara (multipower) | Smith Single-Leg Split Squat |
| Step-down controlado | Step-up with Knee Raise |
| Extensión katana en polea | Cable Rope Overhead Triceps Extension |
| Flexión pseudo-planche | Push-Ups - Close Triceps Position |
| Plancha lateral | Side Bridge |
| Dominada explosiva al pecho | Pullups |
| Fondos en paralelas (lastrados) | Parallel Bar Dip |
| Elevaciones laterales en polea | Cable Seated Lateral Raise |
| Pino contra pared | Handstand Push-Ups |
| Pike push-up | Handstand Push-Ups |
| Hollow body / Hollow rocks | Flutter Kicks |
| Movilidad global | Dynamic Chest Stretch |

## 2. Fotos de Wikimedia Commons enlazadas sin modificar

Se enlazan desde `upload.wikimedia.org` (definidas en `IMAGE_URLS` en `scripts/build-exercises.js`).
Las CC BY / BY-SA llevan la atribución visible en la app, bajo la imagen (`imageCredit`).

| Ejercicio | Archivo | Autoría | Licencia |
| --- | --- | --- | --- |
| L-sit en paralelas | West Point male gymnast L-sit.jpg | Tommy Gilligan / West Point Public Affairs | Dominio público (obra del Gobierno de EE. UU.) |
| Natación (crol) | U.S. Navy … Wounded Warriors swim practice … 121114-F-ZB240-0745.jpg | U.S. Navy | Dominio público (obra del Gobierno de EE. UU.) |
| Front lever tuck | [Front lever - Serhii Solodkyi 18280.jpg](https://commons.wikimedia.org/wiki/File:Front_lever_-_Serhii_Solodkyi_18280.jpg) | Fenix1000 | **CC BY-SA 4.0** (sin recortar; atribución en la app) |
| Rehabilitación de rodilla en el agua | [07-06 WtrAerob1a.jpg](https://commons.wikimedia.org/wiki/File:07-06_WtrAerob1a.jpg) (clase de ejercicio acuático) | Tim Ross | Dominio público |

La foto de crol se usa también en los ejercicios personalizados de natación del plan.

## 3. Sin foto libre: wall sit

No se ha encontrado ninguna foto con licencia libre de una **sentadilla isométrica en pared**
(buscado en Wikimedia Commons por categorías y texto en varios idiomas, 10/09/2026). En el
catálogo público el ejercicio muestra el **icono genérico**.

### Fotos privadas (fuera del repo)

Quien tenga una foto que solo pueda usar en privado (por ejemplo una CC BY-ND recortada, que no
admite obras derivadas ni redistribución) puede ponerla **en su copia local** sin que llegue al
repo:

1. Guarda la imagen como data URI en `src/data/private-images.json`, con la forma
   `{ "wall_sit": ["data:image/jpeg;base64,..."] }` (id del ejercicio → lista de imágenes).
   En el repo ese fichero está vacío (`{}`) y la app lo mezcla en arranque
   (`src/lib/exercises.ts`), así que cualquier ejercicio del catálogo puede recibir fotos propias.
2. Dile a git que ignore tus cambios locales en ese fichero:

   ```bash
   git update-index --skip-worktree src/data/private-images.json
   ```

   (para volver a rastrearlo: `--no-skip-worktree`). La carpeta `private/` del repo también está
   en `.gitignore` y sirve para guardar los originales.

Si algún día aparece una foto libre de wall sit, basta con añadirla a `IMAGE_URLS` y regenerar:

```bash
node scripts/build-exercises.js scripts/data/ex.json scripts/data/names_es.json
```
