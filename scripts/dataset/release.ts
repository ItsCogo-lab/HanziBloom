/**
 * `npm run data:release -- <version> <copy of the data repository> [chunks folder]`
 *
 * Prepares a new version of the full dictionary in a local copy of
 * ItsCogo-lab/HanziDict. Afterwards you have to commit, create the tag
 * with the same version and push both (the "Publish data" workflow does this).
 */
import { DATA_RELEASE_DIR, writeDataRelease } from './dataRelease.ts'

const [version, targetDir, sourceDir = `${DATA_RELEASE_DIR}/dictionary`] = process.argv.slice(2)
if (!version || !targetDir) {
  console.error('Usage: npm run data:release -- <version> <copy of the data repository> [chunks folder]')
  process.exit(1)
}
const manifest = writeDataRelease({ sourceDir, targetDir, version, generatedAt: new Date().toISOString() })
console.log(
  `Version ${manifest.version} prepared in ${targetDir}. Still to do: commit, tag "${manifest.version}" and push.`,
)
