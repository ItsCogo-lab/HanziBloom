# HanziVocab

Aplicación web para aprender y practicar caracteres (hanzi) y vocabulario chino:
reconocimiento, pinyin, significado, repetición espaciada y, más adelante, escritura
y pronunciación.

Estado: **Fase 2 de 12** del MVP (estructura base). La arquitectura y el plan están
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
  app/           Componente raíz (más adelante: rutas, layout y navegación)
  test/          Configuración compartida de los tests
  index.css      Tailwind y design tokens (colores, fuentes, foco)
  main.tsx       Punto de entrada
```

La estructura completa prevista (features, datos, i18n...) está descrita en
`docs/ARCHITECTURE.md`; cada carpeta se crea en la fase que la necesita.
