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
| Futuro (escritura) | `hanzi-writer` (MIT) | Orden y animación de trazos, evaluación de escritura. Se evaluará cuando lleguemos. |

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
    DashboardPage.tsx, PracticePage.tsx, VocabularyPage.tsx,
    CharactersPage.tsx, ProgressPage.tsx, SettingsPage.tsx
  features/
    dictionary/     Tipos de dominio (Character, Word) y consultas sobre los datos
    practice/       Tipos de ejercicio, generación de sesiones, componentes de ejercicio
    progress/       Registro de progreso, estadísticas, racha, persistencia
    srs/            Repetición espaciada (algoritmo sencillo, sustituible)
    audio/          Servicio de pronunciación + botón reutilizable
    writing/        (Futuro) canvas, trazos, evaluación
  components/ui/    Componentes visuales genéricos: Button, Card, ProgressBar...
  data/             Datasets generados (hsk1/characters.ts, hsk1/words.ts)
  i18n/             Textos de la interfaz (en activo, es preparado, ca más adelante)
  lib/              Utilidades sin dominio: almacenamiento, fechas, aleatoriedad
  test/             Configuración compartida de los tests
```

Regla práctica: `pages` → `features` → `lib`/`data`. Una feature no importa de
`pages`, y `lib` no importa de nadie del proyecto.

## 5. Secciones de la aplicación

Mantengo las seis que propusiste; tienen sentido técnico porque cada una
corresponde a una ruta y una responsabilidad:

| Sección | Ruta | Contenido MVP |
| --- | --- | --- |
| Inicio (Dashboard) | `/` | Progreso general, caracteres y palabras aprendidos, racha, pendientes de repaso, botón «Empezar sesión». |
| Práctica | `/practice` | Sesión de estudio con ejercicios mezclados. |
| Vocabulario | `/vocabulary` | Lista y ficha de palabras. |
| Caracteres | `/characters`, `/characters/:hanzi` | Lista y ficha de cada carácter. |
| Progreso | `/progress` | Estadísticas básicas. |
| Ajustes | `/settings` | Tamaño de sesión, reinicio de progreso, (futuro) idioma. |

Navegación: barra lateral en escritorio, barra inferior en móvil.

## 6. Entidades principales

El modelo está en `src/features/dictionary/types.ts`. Resumen:

```ts
type HskLevel = 1 | 2 | 3 | 4
type Translations = { es: string[]; en?: string[]; ca?: string[] }

interface Character {
  id: string              // el propio hanzi, p. ej. "好"
  hanzi: string
  pinyin: string[]        // puede tener varias lecturas (了: le, liǎo)
  meanings: Translations
  hskLevel: HskLevel
  strokeCount?: number
  radical?: string
  frequencyRank?: number
}

interface Word {
  id: string              // p. ej. "你好"
  hanzi: string
  pinyin: string          // "nǐ hǎo"
  meanings: Translations
  hskLevel: HskLevel
}

// Un carácter o una palabra; los ejercicios y el progreso trabajan con esto
type StudyItem = { kind: 'character'; entry: Character } | { kind: 'word'; entry: Word }
type StudyItemId = `char:${string}` | `word:${string}`   // "char:好", "word:好"

// Progreso de un elemento de estudio (se implementa en la Fase 8)
interface ItemProgress {
  itemId: StudyItemId
  timesSeen: number
  timesCorrect: number
  timesWrong: number
  lastReviewedAt?: string // ISO 8601
  nextReviewAt?: string
  masteryLevel: number    // 0-5
}
```

Los campos opcionales (`strokeCount`, `radical`, `frequencyRank`) son opcionales
precisamente para no inventar datos: si no tenemos fuente fiable, se quedan vacíos.

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

El módulo `srs` expone una sola función:

```ts
scheduleNextReview(progress: ItemProgress, wasCorrect: boolean, now: Date): ItemProgress
```

Para el MVP: sistema de cajas tipo Leitner. Acierto → sube un nivel; fallo →
vuelve a 0. Intervalos por nivel: 0, 1, 3, 7, 14, 30 días. El resto de la app
solo conoce esta función, así que cambiar a SM-2 o FSRS más adelante no afecta
a nada más.

### Persistencia

`localStorage` detrás de un pequeño módulo (`loadProgress` / `saveProgress`).
El objeto guardado lleva un campo `version` para poder migrar datos cuando el
formato cambie. Si algún día hay backend, se sustituye este módulo.

### Audio

Interfaz `speak(text)` implementada con la Web Speech API del navegador
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
