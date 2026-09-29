/**
 * `npm run data:release -- <versión> <copia del repositorio de datos> [carpeta de trozos]`
 *
 * Prepara una versión nueva del diccionario completo en una copia local de
 * ItsCogo-lab/HanziVocab-data. Después hay que hacer commit, crear la etiqueta
 * con la misma versión y subir las dos cosas (lo hace el workflow «Publish data»).
 */
import { DATA_RELEASE_DIR, writeDataRelease } from './dataRelease.ts'

const [version, targetDir, sourceDir = `${DATA_RELEASE_DIR}/dictionary`] = process.argv.slice(2)
if (!version || !targetDir) {
  console.error('Uso: npm run data:release -- <versión> <copia del repositorio de datos> [carpeta de trozos]')
  process.exit(1)
}
const manifest = writeDataRelease({ sourceDir, targetDir, version, generatedAt: new Date().toISOString() })
console.log(
  `Versión ${manifest.version} preparada en ${targetDir}. Falta commit, etiqueta "${manifest.version}" y push.`,
)
