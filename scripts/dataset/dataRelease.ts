/**
 * Publicación del diccionario completo en el repositorio de datos
 * (ItsCogo-lab/HanziVocab-Data), del que la app lo lee en tiempo de ejecución
 * a través de jsDelivr. Ver docs/DATA_SOURCES.md, «Repositorio de datos».
 *
 * Contenido del repositorio:
 * - v1/manifest.json: formato, versión actual, fecha y versiones de las fuentes.
 * - v1/<versión>/dictionary/0.json ... 31.json: los trozos, tal cual los genera data:build.
 * - README.md: qué es, licencias y atribución.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHUNK_COUNT, chunkFileName } from '../../src/features/dictionary/fullDictionary.ts'
import {
  DATA_FORMAT,
  parseManifest,
  type DataManifest,
} from '../../src/features/dictionary/runtime/dictionarySource.ts'

/** Donde data:build deja el diccionario completo (no se sube al repositorio de la app). */
export const DATA_RELEASE_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../data-release')

/**
 * Versiones de las fuentes del diccionario completo. Tienen que coincidir con
 * las que descarga fetch-sources.sh (lo comprueba dataRelease.test.ts).
 */
export const SOURCE_VERSIONS = {
  'cc-cedict': 'cedict-json@1.3.20251213 (CC-CEDICT 2025-12-13)',
  unihan: 'Unicode 18.0.0',
  makemeahanzi: 'skishore/makemeahanzi@bddc96d41bef78427ed0e034e9f7e31d71fd1b92',
  'hanzi-writer-data': 'hanzi-writer-data@2.0.1',
} as const

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/

function compareVersions(a: string, b: string): number {
  const [, ...partsA] = SEMVER.exec(a)!
  const [, ...partsB] = SEMVER.exec(b)!
  for (let i = 0; i < 3; i++) {
    const difference = Number(partsA[i]) - Number(partsB[i])
    if (difference !== 0) return difference
  }
  return 0
}

export function createManifest(version: string, generatedAt: string): DataManifest {
  return parseManifest({
    format: DATA_FORMAT,
    version,
    generatedAt,
    chunkCount: CHUNK_COUNT,
    sources: SOURCE_VERSIONS,
  })
}

/** Versiones anteriores que se conservan, para quien aún tenga en caché un manifiesto antiguo. */
const KEPT_PREVIOUS_VERSIONS = 2

const README = (manifest: DataManifest) => `# HanziVocab-Data

Datos del diccionario completo de [HanziVocab](https://github.com/ItsCogo-lab/HanziVocab),
que la app lee en tiempo de ejecución a través de jsDelivr. **No se edita a
mano**: se genera con \`npm run data:build\` en el repositorio de la app y se
publica con \`npm run data:release\` (o el workflow «Publish data»).

Versión actual: **${manifest.version}** (generada el ${manifest.generatedAt}).

## Contenido

- \`v${manifest.format}/manifest.json\`: formato, versión actual, fecha y versiones de las fuentes.
- \`v${manifest.format}/<versión>/dictionary/0.json\` a \`${CHUNK_COUNT - 1}.json\`: todo CC-CEDICT salvo
  HSK 1-4 (que va dentro de la app). Cada entrada está en el archivo del punto
  de código de su primer carácter módulo ${CHUNK_COUNT}.

La app pide \`https://cdn.jsdelivr.net/gh/ItsCogo-lab/HanziVocab-Data@main/v${manifest.format}/manifest.json\`
y después los trozos de la carpeta de esa versión. Una carpeta de versión no se
modifica nunca: una versión nueva es una carpeta nueva y un manifiesto nuevo.
Se conservan las ${KEPT_PREVIOUS_VERSIONS} versiones anteriores. Un cambio de formato incompatible
va en \`v${manifest.format + 1}/\`, sin romper las versiones de la app que leen \`v${manifest.format}/\`.

## Fuentes, licencias y atribución

${Object.entries(manifest.sources)
  .map(([source, version]) => `- **${source}**: ${version}`)
  .join('\n')}

- Significados, pinyin y formas tradicionales: [CC-CEDICT](https://cc-cedict.org/wiki/),
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Estos datos,
  al derivar de CC-CEDICT, se distribuyen con la misma licencia.
- Radical, número de trazos y variantes: [Unicode Unihan](https://www.unicode.org/charts/unihan.html),
  [Unicode License v3](https://www.unicode.org/license.txt). Copyright © Unicode, Inc.
- Descomposición y etimología: [Make Me a Hanzi](https://github.com/skishore/makemeahanzi),
  LGPL 3.0 o posterior.
- Número de trazos: [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data),
  Arphic Public License.
`

/**
 * Prepara una versión en \`targetDir\` (una copia del repositorio de datos):
 * copia los trozos de \`sourceDir\` a su carpeta de versión, escribe el
 * manifiesto y el README y borra las versiones más antiguas. Se niega a
 * publicar una versión que no sea mayor que la que ya hay.
 */
export function writeDataRelease(options: {
  sourceDir: string
  targetDir: string
  version: string
  generatedAt: string
}): DataManifest {
  const { sourceDir, targetDir, version, generatedAt } = options
  const manifest = createManifest(version, generatedAt)
  const formatDir = join(targetDir, `v${manifest.format}`)
  const manifestPath = join(formatDir, 'manifest.json')
  if (existsSync(manifestPath)) {
    const current = parseManifest(JSON.parse(readFileSync(manifestPath, 'utf8')))
    if (compareVersions(version, current.version) <= 0) {
      throw new Error(`La versión ${version} no es mayor que la publicada (${current.version}).`)
    }
  }
  for (let index = 0; index < CHUNK_COUNT; index++) {
    if (!existsSync(join(sourceDir, chunkFileName(index))))
      throw new Error(`Falta ${chunkFileName(index)} en ${sourceDir}`)
  }
  const dictionaryDir = join(formatDir, version, 'dictionary')
  mkdirSync(dictionaryDir, { recursive: true })
  for (let index = 0; index < CHUNK_COUNT; index++) {
    cpSync(join(sourceDir, chunkFileName(index)), join(dictionaryDir, chunkFileName(index)))
  }
  const versions = readdirSync(formatDir)
    .filter((name) => SEMVER.test(name))
    .sort(compareVersions)
  for (const old of versions.slice(0, -(KEPT_PREVIOUS_VERSIONS + 1))) {
    rmSync(join(formatDir, old), { recursive: true, force: true })
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  writeFileSync(join(targetDir, 'README.md'), README(manifest))
  return manifest
}
