# Arquitectura de HanziVocab

Este documento recoge el análisis inicial (Fase 1), la arquitectura propuesta y el
plan técnico del MVP. Es un documento vivo: cuando una decisión cambie, se
actualiza aquí.

## 1. Estado inicial del repositorio

- Un único commit (`Initial commit`) con el `.gitignore` de Node que genera GitHub.
- Sin código, sin `package.json`, sin configuración, sin issues ni PRs.
- Conclusión: el proyecto parte de cero, no hay convenciones previas que respetar.

## 2. Principios

1. **Sencillo primero.** Solo añadimos una abstracción cuando resuelve un problema real.
2. **Lógica separada de la UI.** Las reglas (ejercicios, progreso, repetición
   espaciada) son funciones TypeScript puras, testeables sin React.
3. **Datos fuera de los componentes.** Los datasets viven en `src/data/` y se
   consultan mediante funciones.
4. **Funciona sin conexión.** Nada básico depende de una API externa.
5. **Preparado para crecer, sin construir aún lo que no hace falta.**

## 3. Stack y dependencias

| Pieza | Elección | Por qué |
| --- | --- | --- |
| UI | React 19 | Pedido explícitamente. |
| Lenguaje | TypeScript en modo estricto | Pedido. Además `noUncheckedIndexedAccess`: buscar un carácter por id puede fallar y el compilador nos obliga a tenerlo en cuenta. |
| Bundler / dev server | Vite | Pedido. Arranque instantáneo, configuración mínima. |
| Estilos | Tailwind CSS v4 (`@tailwindcss/vite`) | Pedido. La v4 se configura desde CSS (`@theme`), sin `tailwind.config.js` ni PostCSS. |
| Lint | oxlint | Es el linter que trae hoy la plantilla oficial de Vite. Una sola dependencia, muy rápido. |
| Tests | Vitest + Testing Library + jsdom | Vitest reutiliza la configuración de Vite; Testing Library prueba componentes como los usa una persona. |

Dependencias previstas para fases siguientes (se añadirán cuando se necesiten, no antes):

| Fase | Dependencia | Motivo |
| --- | --- | --- |
| 3 | `react-router` | Rutas reales (`/characters/好`), botón atrás del navegador y enlaces compartibles. Escribirlo a mano sería reinventar algo estándar. |
| Integración de datos | `hanzi-writer` (MIT) | Animación del orden de trazos en la ficha del carácter. Se carga con `import()` solo al abrir una ficha. Más adelante servirá para la práctica de escritura. |
| Integración de datos | `hanzi-writer-data` (Arphic PL, solo desarrollo) | Datos de trazos que el build copia a `public/strokes/`. |

Descartado a propósito: Redux/Zustand (React Context + hooks basta), i18next
(un diccionario tipado propio basta para 3 idiomas), librerías de componentes
(queremos identidad propia), backend, Docker.

## 4. Estructura de carpetas

Organizada por funcionalidad. Solo existen las carpetas que ya tienen contenido;
el resto se crea en su fase.

```
src/
  app/              Arranque de la app: App, rutas, layout y navegación (Fase 3)
  pages/            Una página por sección; componen features, sin lógica propia
    DashboardPage, DictionaryPage, EntryDetailPage, PracticePage,
    ProfilePage, ProgressPage, SettingsPage; study/ (pestañas y sets)
  features/
    dictionary/     Tipos de dominio (Character, Word), búsqueda, tonos y el panel de diccionario
    studySets/      Modelo StudySet (HSK, temas, propios) y su progreso derivado
    myStudies/      Sets que sigue el usuario y cuándo los estudió (localStorage)
    practice/       Tipos de ejercicio, generación de sesiones, componentes de ejercicio
    progress/       Registro de progreso, estadísticas, racha, persistencia
    srs/            Repetición espaciada (algoritmo sencillo, sustituible)
    settings/       Ajustes del usuario (sesión, colores y números de tono)
    audio/          (Futuro) servicio de pronunciación + botón reutilizable
    writing/        (Futuro) canvas, trazos, evaluación
  components/ui/    Componentes visuales genéricos: Button, Card, ProgressBar...
  data/             Datasets generados (hsk1/ a hsk4/) y temas curados a mano (topics.ts)
  i18n/             Textos de la interfaz (en activo, es preparado, ca más adelante)
  lib/              Utilidades sin dominio: almacenamiento, fechas, aleatoriedad
  test/             Configuración compartida de los tests
```

Regla práctica: `pages` → `features` → `lib`/`data`. Una feature no importa de
`pages`, y `lib` no importa de nadie del proyecto.

## 5. Secciones de la aplicación

Cuatro secciones en la navegación principal; Progreso y Ajustes cuelgan del perfil.

| Sección | Ruta | Contenido |
| --- | --- | --- |
| Home | `/` | Progreso general, racha, repasos pendientes, sets que se estudian. |
| Study | `/study`, `/study/hsk`, `/study/topics` | Pestañas My Studies, HSK y Topics con tarjetas de set. |
| Set | `/study/sets/:setId` | Progreso del set (aprendidos, aprendiendo, sin empezar), vocabulario y botón de estudiar. |
| Sesión | `/study/practice?set=:setId` | Sesión con elementos del set (sin `set`, de todo el vocabulario). Botón Dictionary. |
| Dictionary | `/dictionary`, `/vocabulary/:id`, `/characters/:hanzi` | Búsqueda global y fichas. `q` y `kind` van en la URL. |
| Profile | `/profile` | Resumen local: aprendidos, repasos, racha, sets y recientes. |
| Progreso / Ajustes | `/progress`, `/settings` | Estadísticas detalladas; sesión, tonos, borrar progreso, créditos. |

Las rutas antiguas (`/practice`, `/vocabulary`, `/characters`) redirigen a las nuevas.
Navegación: barra lateral en escritorio, barra inferior en móvil.

### Study sets

`StudySet` (`features/studySets/types.ts`) es un id, un tipo (`hsk`, `topic`,
`custom`), nombre, descripción, nivel e icono opcionales y una lista de
`StudyItemId`. Un set no guarda progreso: su progreso se calcula al vuelo con
`summarizeItemIds` sobre el progreso por elemento, así que un elemento que está
en varios sets cuenta en todos sin duplicar datos. Dominado = nivel SRS ≥ 4.

- Sets HSK: salen de `hskN/words.ts` y `hskN/characters.ts` (palabras del nivel
  y caracteres que se estrenan en él). No hay listas escritas a mano.
- Sets por temas: `src/data/topics.ts`, curado a mano (criterios en
  DATA_SOURCES.md, «Sets por temas»). Añadir un tema es añadir un objeto.
- `validateStudySets` comprueba ids repetidos, sets vacíos y elementos que no
  existen; un test lo pasa sobre los sets de la app.
- Sets propios (`custom`): el modelo y la validación ya los admiten; falta la
  interfaz para crearlos.

My Studies (`features/myStudies`) guarda solo qué sets sigue el usuario y la
última vez que estudió cada uno (`hanzivocab.studies`). Quitar un set no borra
el progreso de sus elementos.

### Diccionario dentro de la sesión

`DictionaryPanel` se abre encima de la sesión (panel lateral en escritorio,
hoja inferior en móvil) sin cambiar de ruta: el ejercicio sigue montado debajo
con su estado, y al cerrar (botón, Escape) el foco vuelve al botón Dictionary.
Las fichas reciben un `EntryOpener`: en la página enlazan a otra ruta; en el
panel abren la ficha dentro del panel, con historial para volver. Consultar el
elemento de la pregunta solo se ofrece después de responder, para no dar la
respuesta.

### Colores de tono

`getCharacterTones` (`features/dictionary/tones.ts`) saca el tono de cada
carácter del pinyin con marcas de la entrada. En palabras, sílaba a sílaba (así
un polifónico toma la lectura de la palabra); en caracteres sueltos, solo si
todas sus lecturas tienen el mismo tono. Si algo no cuadra, el carácter queda
sin color: no se adivina. Colores en `index.css` (`--color-tone-1..5`), todos
con contraste ≥ 4.5:1. El color nunca es la única pista: el pinyin con marcas
va al lado, y se oculta en los ejercicios que preguntan la pronunciación hasta
responder. Ajustes: activar colores y añadir números de tono.

## 6. Entidades principales

El modelo está en `src/features/dictionary/types.ts`. Resumen:

```ts
type HskLevel = 1 | 2 | 3 | 4
type Translations = { en: string[]; es?: string[]; ca?: string[] } // en viene de CC-CEDICT

interface Character {
  id: string              // el propio hanzi, p. ej. "好"
  hanzi: string
  pinyin: string[]        // puede tener varias lecturas (了: le, liǎo)
  meanings: Translations
  hskLevel: HskLevel
  strokeCount?: number    // hanzi-writer-data
  radical?: string        // Unihan: 木, o su forma simplificada 讠
  radicalNumber?: number  // Unihan: 1-214 (木 → 75)
  frequencyRank?: number  // sin fuente todavía
  traditional?: string[]  // Unihan: 柠 → ["檸"]
  decomposition?: string  // Make Me a Hanzi: "⿰木宁"
  etymology?: Etymology   // Make Me a Hanzi: tipo, semántico, fonético
}

interface Word {
  id: string              // p. ej. "你好"
  hanzi: string
  pinyin: string          // "nǐ hǎo"
  meanings: Translations
  hskLevel: HskLevel
  traditional?: string    // CC-CEDICT: "檸檬"
  frequencyRank?: number
}

// Frase de ejemplo de Tatoeba, en public/examples/hsk1.json
interface ExampleSentence {
  tatoebaId: number
  zh: string
  author: string
  en: string
  translationTatoebaId: number
  translationAuthor?: string
  words: string[]
}

// Un carácter o una palabra; los ejercicios y el progreso trabajan con esto
type StudyItem = { kind: 'character'; entry: Character } | { kind: 'word'; entry: Word }
type StudyItemId = `char:${string}` | `word:${string}`   // "char:好", "word:好"

// Progreso de un elemento estudiado (src/features/progress/types.ts)
interface ItemProgress {
  itemId: StudyItemId
  timesSeen: number
  timesCorrect: number
  timesWrong: number
  masteryLevel: number    // 0-5
  lastReviewedAt: string  // ISO 8601
  nextReviewAt: string
}

// Todo el progreso: los elementos que no están en `items` son nuevos
interface ProgressData {
  items: Partial<Record<StudyItemId, ItemProgress>>
  activity: Record<string, { answers: number; correct: number }> // por día "2026-09-28"
}
```

Los campos opcionales son opcionales precisamente para no inventar datos: si
la fuente dueña de un campo no lo tiene, se queda vacío y la ficha no muestra
esa sección. Qué fuente manda en cada campo y cómo se genera el dataset
(adaptadores por fuente, fusión y validación en `scripts/dataset/`) está en
`docs/DATA_SOURCES.md`.

**Datos grandes, fuera del bundle.** Los trazos (`public/strokes/`) y las
frases de ejemplo (`public/examples/`) se piden con `fetch` al abrir una ficha.
La librería Hanzi Writer también se carga en ese momento.

**Datos derivados, no guardados.** Los caracteres que forman una palabra y las
palabras relacionadas con un carácter no se guardan en el dataset: se calculan
a partir de `hanzi` (`getCharactersOfWord`, `getWordsWithCharacter`). Si se
guardaran, podrían quedar desincronizados al editar los datos.

**Consultas.** `src/features/dictionary/dictionary.ts` construye un
`Dictionary` (dos `Map` indexados por id) y ofrece funciones puras para buscar
y listar. `validation.ts` comprueba la coherencia de los datos (ids únicos,
pinyin y significados presentes, caracteres de cada palabra existentes); los
tests del dataset la usarán para que un error en los datos haga fallar la CI.

### Ejercicios extensibles

Está en `src/features/practice/`. Cada tipo de ejercicio tiene:

1. Su interfaz en `types.ts`, dentro de la unión `Exercise` (discriminada por `type`).
2. Su definición en `exerciseDefinitions.ts`:

   ```ts
   interface ExerciseDefinition<E extends Exercise> {
     type: E['type']
     canBuild(item, pool): boolean   // ¿hay datos suficientes para este ejercicio?
     build(item, pool, random): E    // genera pregunta y opciones
   }
   ```

3. Su componente, elegido en `components/ExerciseView.tsx` con un `switch` que
   TypeScript obliga a completar.

Añadir un ejercicio nuevo (p. ej. escritura) consiste en esos tres pasos, sin
tocar los demás. El `random` se inyecta para que los tests sean deterministas.

**Tipos actuales.** `flashcard` (el usuario dice si lo sabía) y tres de opción
múltiple con cuatro opciones, en `choiceExercises.ts`:

| Tipo | Se muestra | Se elige |
| --- | --- | --- |
| `meaning-choice` | hanzi | significado |
| `pinyin-choice` | hanzi | pinyin |
| `hanzi-choice` | significado | hanzi |

Reglas de los distractores (cubiertas por tests):

- Son del mismo tipo que la respuesta (carácter o palabra) y, si se puede, con
  el mismo número de caracteres, para que no se adivine por la forma.
- No pueden ser también una respuesta válida: se descartan los que comparten
  un significado (sinónimos), una lectura de pinyin o el mismo hanzi, y
  tampoco pueden coincidir entre sí.
- Los significados que citan el propio hanzi ("used in 漂亮") se ocultan; si a
  un elemento no le queda ninguno (子, 漂, 么), no se pregunta por su
  significado, solo por su pinyin.
- En los caracteres con varias lecturas se muestra la primera, para que la
  opción correcta no se distinga por ser una lista.

**Sesión.** `session.ts` crea los ejercicios (elementos al azar y un tipo
construible para cada uno) y gestiona el avance con un reducer puro
(`sessionReducer`), que `PracticeSession` usa con `useReducer`. Cada respuesta
produce un `ExerciseResult { itemId, exerciseType, correct }`, que es lo que
consumirá el sistema de progreso en la Fase 8.

### Repetición espaciada

`src/features/srs/srs.ts` expone dos funciones:

```ts
scheduleNextReview(masteryLevel: number, wasCorrect: boolean, now: Date): { masteryLevel, nextReviewAt }
isReviewDue(nextReviewAt: string, now: Date): boolean
```

Para el MVP: sistema de cajas tipo Leitner. Acierto → sube un nivel; fallo →
vuelve a 0. Intervalos por nivel: 0, 1, 3, 7, 14, 30 días, contados por días
del calendario local (el repaso "de mañana" está disponible desde las 00:00).
El resto de la app solo conoce estas funciones, así que cambiar a SM-2 o FSRS
más adelante no afecta a nada más.

**Progreso** (`src/features/progress/`):

- `progress.ts`: `recordAnswer` actualiza los contadores del elemento, le
  pide al SRS su siguiente repaso y suma la respuesta a la actividad del día.
  Estado de cada elemento: nuevo (nunca visto), en aprendizaje o dominado
  (nivel 4 o más: siguiente repaso a 14 días o más).
- `streak.ts`: racha actual y más larga, por días locales. Si hoy aún no has
  estudiado, la racha de ayer sigue contando.
- `ProgressProvider` + `useProgress()`: el progreso vive en un Context de
  React y se guarda en cada cambio. Cada respuesta se guarda al momento, así
  que salir a mitad de una sesión no pierde nada.

**Qué entra en una sesión** (`selectSessionItems`): primero los repasos
pendientes (los más atrasados antes), luego elementos nuevos y, si aún faltan,
los estudiados cuyo repaso está más cerca. Después se barajan.

### Persistencia

`localStorage` detrás de un pequeño módulo (`loadProgress` / `saveProgress`
en `progress/storage.ts`, sobre `lib/storage.ts`). El objeto guardado lleva un
campo `version` para poder migrar datos cuando el formato cambie. Si lo
guardado está corrupto o localStorage no está disponible (modo privado), la
app funciona igual, sin guardar. Si algún día hay backend, se sustituye este
módulo.

### Audio (futuro, fuera del MVP)

Idea prevista: interfaz `speak(text)` implementada con la Web Speech API del navegador
(`speechSynthesis`, voz `zh-CN`): gratis y sin servidor. Limitación: depende de
las voces instaladas en el sistema. Como toda la app usa la interfaz, más
adelante se puede cambiar por audios grabados sin tocar los componentes.

### Internacionalización

- Textos de la interfaz: `src/i18n/en.ts` es la fuente y el idioma activo;
  `es.ts` (y más adelante `ca.ts`) deben tener las mismas claves (lo comprueba
  TypeScript). Función `t('clave')`.
- Contenido: `meanings` es un objeto por idioma con el inglés obligatorio
  (viene de CC-CEDICT), así que añadir español o catalán no cambia el modelo.

## 7. Problemas identificados

1. **Versión de HSK.** Existen dos estándares: HSK 2.0 (nivel 1 = 150 palabras)
   y el nuevo estándar de 2021, "HSK 3.0" (nivel 1 = 500 palabras y 300
   caracteres, y los niveles no equivalen a los antiguos).
   **Decidido: HSK 2.0 para el MVP**, porque es más pequeño y es el que usan
   la mayoría de materiales. El campo `hskLevel` se puede acompañar de un
   campo de estándar si más adelante incluimos ambos.
2. **Idioma y fuente de los significados.** Las fuentes abiertas fiables
   (CC-CEDICT, licencia CC BY-SA 4.0) dan los significados en **inglés** y no
   hay un diccionario chino-español abierto equivalente.
   **Decidido: de momento la interfaz y los significados están en inglés**,
   usando CC-CEDICT. El español queda preparado (`i18n/es.ts` y
   `meanings.es`). Detalles y licencia del dataset en `docs/DATA_SOURCES.md`.
3. **Carácter y palabra a la vez.** 好 es un carácter y también una palabra
   HSK 1. Por eso el progreso usa ids con prefijo (`char:好`, `word:好`) y los
   dos se estudian por separado.
4. **Varias lecturas de pinyin.** Algunos caracteres tienen más de una
   pronunciación; en el ejercicio de pinyin se muestra una y los
   distractores no pueden coincidir con ninguna. **Resuelto en la fase 7.**
5. **Distractores.** Las opciones incorrectas no deben ser sinónimos de la
   correcta ni repetirse. **Resuelto en la fase 7** (ver «Tipos actuales»).
6. **Fechas y racha.** La racha se calcula por día local, no por UTC; si no,
   estudiar a medianoche daría resultados raros.
7. **Fuentes chinas.** Se usan fuentes del sistema (PingFang SC, Noto Sans SC,
   Microsoft YaHei) para no descargar varios MB ni depender de internet.

## 8. Plan técnico del MVP

| Fase | Entregable | Tests |
| --- | --- | --- |
| 1 | Este documento | — |
| 2 | Proyecto Vite + React + TS estricto + Tailwind + oxlint + Vitest, ejecutable | Test de humo del componente raíz |
| 3 | Layout, navegación (react-router), páginas vacías, componentes UI base, i18n | Navegación entre secciones |
| 4 | Tipos de dominio y funciones de consulta | Funciones de datos |
| 5 | Dataset HSK 1 con fuentes documentadas | Validación del dataset (ids únicos, referencias válidas) |
| 6 | Flashcards | Componente de flashcard |
| 7 | Ejercicios de reconocimiento (significado, pinyin, inverso) | Generación de opciones y distractores |
| 8 | Progreso + SRS + persistencia | Cálculo de progreso, planificación, racha |
| 9 | Dashboard | — |
| 10 | Estadísticas básicas | Cálculo de estadísticas |
| 11 | Completar tests de lo crítico | — |
| 12 | Revisión, refactor, accesibilidad | — |

**Estado: MVP completo (fases 1-12).** Además del plan, se hicieron las listas y
fichas de Vocabulario y Caracteres y la página de Ajustes, que estaban en la
tabla de secciones. Revisión final: sin errores de axe-core (accesibilidad) en
ninguna página, navegable con teclado y probado a 390 px y 1280 px.

**Pendiente para después del MVP:** audio (Web Speech API), práctica de
escritura, significados en español, frecuencia, niveles HSK 2-4.

**Integración de datos (después del MVP):** fichas de caracteres con datos de
CC-CEDICT, Unihan, Make Me a Hanzi, hanzi-writer-data y Tatoeba, generados con
el pipeline descrito en `docs/DATA_SOURCES.md`.
