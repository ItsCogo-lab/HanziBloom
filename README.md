# HanziVocab

Aplicación web para aprender y practicar caracteres (hanzi) y vocabulario chino:
reconocimiento, pinyin, significado, repetición espaciada y, más adelante, escritura
y pronunciación.

Estado: **Fase 7 de 12** del MVP (ejercicios de reconocimiento). De momento la interfaz y los
significados están en inglés. La arquitectura y el plan están
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
| `npm run data:fetch` | Descarga las fuentes del dataset (CC-CEDICT y lista HSK) |
| `npm run data:build` | Regenera el dataset en `src/data/` (ver `docs/DATA_SOURCES.md`) |

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
    dictionary/  Tipos de caracteres y palabras, consultas y validación de datos
    practice/    Sesiones de estudio: lógica (session.ts), tipos de ejercicio y componentes
  data/          Dataset generado (HSK 1: 150 palabras, 178 caracteres)
  lib/           Utilidades sin dominio (pinyin, aleatoriedad)
  components/    Componentes compartidos
    ui/          Piezas visuales genéricas: Button, ButtonLink, Card, PageHeader, ProgressBar
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
