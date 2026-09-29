// Temporal: comprueba que jsDelivr sirve el repositorio de datos con CORS y que
// sus trozos son idénticos a public/dictionary. Uso: node data-check.mjs <ref>
import { readFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'

const ref = process.argv[2] ?? 'main'
const base = `https://cdn.jsdelivr.net/gh/ItsCogo-lab/HanziVocab-Data@${ref}/v1`
const headers = { Origin: 'https://itscogo-lab.github.io', 'Accept-Encoding': 'br, gzip' }

const start = performance.now()
const manifestResponse = await fetch(`${base}/manifest.json`, { headers })
console.log('manifest', manifestResponse.status, {
  cors: manifestResponse.headers.get('access-control-allow-origin'),
  cacheControl: manifestResponse.headers.get('cache-control'),
})
if (!manifestResponse.ok) process.exit(0)
const manifest = await manifestResponse.json()
console.log(manifest)

let differences = 0
let transferred = 0
const chunkStart = performance.now()
await Promise.all(
  Array.from({ length: manifest.chunkCount }, async (_, index) => {
    const response = await fetch(`${base}/${manifest.version}/dictionary/${index}.json`, { headers })
    const body = await response.arrayBuffer()
    transferred += Number(response.headers.get('content-length') ?? body.byteLength)
    if (index === 0) {
      console.log('chunk 0', response.status, {
        cors: response.headers.get('access-control-allow-origin'),
        cacheControl: response.headers.get('cache-control'),
        encoding: response.headers.get('content-encoding'),
      })
    }
    const remote = JSON.parse(new TextDecoder().decode(body))
    const local = JSON.parse(readFileSync(`public/dictionary/${index}.json`, 'utf8'))
    if (!isDeepStrictEqual(remote, local)) {
      differences++
      console.log(`DIFERENTE: trozo ${index}`)
    }
  }),
)
console.log({
  ref,
  identicalChunks: manifest.chunkCount - differences,
  differences,
  allChunksMs: Math.round(performance.now() - chunkStart),
  totalMs: Math.round(performance.now() - start),
  transferredBytes: transferred,
})
