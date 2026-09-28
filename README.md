# HanziVocab

Aplicación web para aprender y practicar caracteres (hanzi) y vocabulario chino:
reconocimiento, pinyin, significado, repetición espaciada y, más adelante, escritura
y pronunciación.

Estado: **Fase 3 de 12** del MVP (layout y navegación). La arquitectura y el plan están
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

## Estructura

```
docs/            Arquitectura y decisiones
public/          Archivos estáticos (favicon)
src/
  app/           App, rutas (AppRoutes), secciones del menú (navigation.ts)
    layout/      Estructura común: navegación principal y área de contenido
  pages/         Una página por sección de la app
  components/    Componentes compartidos
    ui/          Piezas visuales genéricas: Button, ButtonLink, Card, PageHeader
  i18n/          Textos de la interfaz (es.ts) y función t()
  test/          Configuración compartida de los tests
  index.css      Tailwind y design tokens (colores, fuentes, foco)
  main.tsx       Punto de entrada
```

La estructura completa prevista (features, datos...) está descrita en
`docs/ARCHITECTURE.md`; cada carpeta se crea en la fase que la necesita.
