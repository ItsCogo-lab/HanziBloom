/**
 * Publishing the full dictionary to the data repository
 * (ItsCogo-lab/HanziDict), which the app reads it from at runtime
 * via jsDelivr. See docs/DATA_SOURCES.md, "Data repository".
 *
 * Repository contents:
 * - v1/manifest.json: format, current version, date and source versions.
 * - v1/<version>/dictionary/0.json ... 31.json: the chunks, exactly as data:build generates them.
 * - README.md: what it is, licenses and attribution.
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

/** Where data:build leaves the full dictionary (not committed to the app repository). */
export const DATA_RELEASE_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../data-release')

/**
 * Source versions of the full dictionary. They must match the ones
 * fetch-sources.sh downloads (checked by dataRelease.test.ts).
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

/** Previous versions that are kept, for anyone who still has an old manifest cached. */
const KEPT_PREVIOUS_VERSIONS = 2

const README = (manifest: DataManifest) => `# HanziDict

Full dictionary data for [VividHanzi](https://github.com/ItsCogo-lab/VividHanzi),
which the app reads at runtime via jsDelivr. **Not edited by
hand**: it is generated with \`npm run data:build\` in the app repository and
published with \`npm run data:release\` (or the "Publish data" workflow).

Current version: **${manifest.version}** (generated on ${manifest.generatedAt}).

## Contents

- \`v${manifest.format}/manifest.json\`: format, current version, date and source versions.
- \`v${manifest.format}/<version>/dictionary/0.json\` to \`${CHUNK_COUNT - 1}.json\`: all of CC-CEDICT except
  HSK 1-4 (which ships inside the app). Each entry is in the file for the code
  point of its first character modulo ${CHUNK_COUNT}.

The app requests \`https://cdn.jsdelivr.net/gh/ItsCogo-lab/HanziDict@main/v${manifest.format}/manifest.json\`
and then the chunks in that version's folder. A version folder is never
modified: a new version is a new folder and a new manifest.
The ${KEPT_PREVIOUS_VERSIONS} previous versions are kept. An incompatible format change
goes in \`v${manifest.format + 1}/\`, without breaking the app versions that read \`v${manifest.format}/\`.

## Sources, licenses and attribution

${Object.entries(manifest.sources)
  .map(([source, version]) => `- **${source}**: ${version}`)
  .join('\n')}

- Meanings, pinyin and traditional forms: [CC-CEDICT](https://cc-cedict.org/wiki/),
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Being derived
  from CC-CEDICT, this data is distributed under the same license.
- Radical, stroke count and variants: [Unicode Unihan](https://www.unicode.org/charts/unihan.html),
  [Unicode License v3](https://www.unicode.org/license.txt). Copyright © Unicode, Inc.
- Decomposition and etymology: [Make Me a Hanzi](https://github.com/skishore/makemeahanzi),
  LGPL 3.0 or later.
- Stroke count: [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data),
  Arphic Public License.
`

/**
 * Prepares a version in \`targetDir\` (a copy of the data repository):
 * copies the chunks from \`sourceDir\` into its version folder, writes the
 * manifest and the README and deletes the oldest versions. It refuses to
 * publish a version that is not greater than the existing one.
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
      throw new Error(`Version ${version} is not greater than the published one (${current.version}).`)
    }
  }
  for (let index = 0; index < CHUNK_COUNT; index++) {
    if (!existsSync(join(sourceDir, chunkFileName(index))))
      throw new Error(`Missing ${chunkFileName(index)} in ${sourceDir}`)
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
