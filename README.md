# HanziVocab

Aplicación web para aprender y practicar caracteres (hanzi) y vocabulario chino:
reconocimiento, pinyin, significado, repetición espaciada y, más adelante, escritura
y pronunciación.

Estado: **MVP completo** (fases 1 a 12). De momento la interfaz y los
significados están en inglés.

## Qué se puede hacer

- **Practicar** sesiones de 5, 10 o 20 ejercicios con los 328 caracteres y
  palabras de HSK 1 (HSK 2.0): flashcards y opción múltiple (hanzi → significado,
  hanzi → pinyin, significado → hanzi).
- **Repetición espaciada**: cada respuesta se guarda y decide cuándo vuelve a
  salir cada elemento; las sesiones empiezan por los repasos pendientes.
- **Inicio** con lo pendiente para hoy, la racha y el progreso en HSK 1.
- **Estadísticas**: respuestas, acierto, rachas, últimos 7 días y lo más fallado.
- **Vocabulario y Caracteres**: listas con buscador (hanzi, pinyin con o sin
  tonos, significado) y una ficha de cada entrada con tu progreso.
- **Ajustes**: tamaño de sesión, borrar el progreso y créditos del dataset.

El progreso se guarda en el navegador (localStorage); no hay servidor ni cuentas. La arquitectura y el plan están
en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Tecnologías

React 19 · TypeScript (estricto) · Vite · Tailwind CSS v4 · Vitest + Testing Library · oxlint

## Requisitos

Node.js 20.19 o superior (recomendado 22).

## Cómo ejecutarlo

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
```

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Comprueba tipos y genera la versión de producción en `dist/` |
| `npm run preview` | Sirve la versión de producción localmente |
| `npm run typecheck` | Solo comprobación de tipos |
| `npm run lint` | Linter (oxlint) |
| `npm test` | Ejecuta los tests una vez |
| `npm run test:watch` | Tests en modo observación |
| `npm run check` | Tipos + lint + tests (lo mismo que ejecuta la CI) |
| `npm run data:fetch` | Descarga las fuentes del dataset (lista HSK, CC-CEDICT, Unihan, Make Me a Hanzi, Tatoeba) |
| `npm run data:build` | Regenera el dataset en `src/data/`, `public/strokes/` y `public/examples/` (ver `docs/DATA_SOURCES.md`) |
| `npm run data:validate` | Valida el dataset generado sin descargar nada |

## Estructura

```
docs/            Arquitectura, decisiones y fuentes de datos
scripts/dataset/ Script que genera el dataset a partir de las fuentes
public/          Archivos estáticos (favicon)
src/
  app/           App, rutas (AppRoutes), secciones del menú (navigation.ts)
    layout/      Estructura común: navegación principal y área de contenido
  pages/         Una página por sección de la app
  features/
    dictionary/  Tipos de caracteres y palabras, consultas, búsqueda y validación de datos
    practice/    Sesiones de estudio: lógica (session.ts), tipos de ejercicio y componentes
    srs/         Repetición espaciada (cajas de Leitner)
    progress/    Progreso, rachas, estadísticas y guardado en localStorage
    settings/    Ajustes del usuario
  data/          Dataset generado (HSK 1: 150 palabras, 178 caracteres)
  lib/           Utilidades sin dominio (pinyin, aleatoriedad, fechas, almacenamiento)
  components/    Componentes compartidos
    ui/          Piezas visuales genéricas: Button, Card, DataTable, HanziText, PageHeader, ProgressBar, StatCard...
  i18n/          Textos de la interfaz (en.ts activo, es.ts preparado) y función t()
  test/          Configuración compartida de los tests
  index.css      Tailwind y design tokens (colores, fuentes, foco)
  main.tsx       Punto de entrada
```

La estructura completa prevista está descrita en
`docs/ARCHITECTURE.md`; cada carpeta se crea en la fase que la necesita.

## Datos

Los significados y lecturas vienen de [CC-CEDICT](https://cc-cedict.org/wiki/)
(CC BY-SA 4.0) y la lista de palabras HSK de
[clem109/hsk-vocabulary](https://github.com/clem109/hsk-vocabulary) (MIT).
Los archivos de `src/data/` se distribuyen bajo CC BY-SA 4.0. Más detalles en
[`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).
