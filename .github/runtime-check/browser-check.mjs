// Temporal: prueba la app compilada en Chromium contra las fuentes reales
// (jsDelivr y Tatoeba). Se ejecuta desde runtime-sources-check.yml.
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
const EXTERNAL = /cdn\.jsdelivr\.net|api\.tatoeba\.org/
const results = {}
const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()
const requests = []
page.on('request', (request) => EXTERNAL.test(request.url()) && requests.push(request.url()))
page.on('console', (message) => message.type() === 'error' && console.log('console error:', message.text()))

async function timed(name, action) {
  const start = performance.now()
  await action()
  results[name] = Math.round(performance.now() - start)
}

async function detail(path) {
  requests.length = 0
  await page.goto(BASE + path)
  await page.getByRole('heading', { level: 1 }).first().waitFor()
}

async function sectionText(name) {
  const heading = page.getByRole('heading', { name, exact: true })
  if (!(await heading.count())) return null
  return (await heading.locator('xpath=..').innerText()).slice(0, 400)
}

// 1. Ficha de 柠 (HSK en la app real no: 柠 no está en HSK 1-4)
for (const [label, hanzi] of [['ning', '柠'], ['you', '柚'], ['hao', '好']]) {
  await timed(`${label}.detailFirstLoadMs`, async () => {
    await detail(`/characters/${encodeURIComponent(hanzi)}`)
    await page.getByRole('heading', { name: 'Stroke order' }).waitFor({ timeout: 15000 })
    await page.getByRole('heading', { name: 'Example sentences' }).waitFor({ timeout: 15000 })
  })
  results[`${label}.requests`] = [...requests]
  results[`${label}.svgPaths`] = await page.locator('[role=img] svg path').count()
  results[`${label}.examples`] = await sectionText('Example sentences')
  await page.screenshot({ path: `runtime-${label}.png`, fullPage: true })
}

// 2. Otra vez 柠: debe salir de la caché (IndexedDB), sin peticiones externas
await timed('ning.detailCachedMs', async () => {
  await detail(`/characters/${encodeURIComponent('柠')}`)
  await page.getByRole('heading', { name: 'Stroke order' }).waitFor()
  await page.getByRole('heading', { name: 'Example sentences' }).waitFor()
})
results['ning.cachedRequests'] = [...requests]

// 3. Fuentes externas caídas: 柠 sale de la caché; 桔 (sin caché, fuera de HSK) dice que no está disponible;
//    好 (HSK) usaría la copia local si no estuviera ya en caché, así que se prueba con 你
await page.route(/api\.tatoeba\.org|hanzi-writer-data/, (route) => route.abort('internetdisconnected'))
await detail(`/characters/${encodeURIComponent('柠')}`)
await page.getByRole('heading', { name: 'Stroke order' }).waitFor()
results['offline.ningFromCache'] = (await sectionText('Example sentences')) !== null
await detail(`/characters/${encodeURIComponent('桔')}`)
await page.getByText('Stroke order unavailable offline.').waitFor({ timeout: 15000 })
results['offline.juUnavailable'] = await sectionText('Example sentences')
await detail(`/characters/${encodeURIComponent('你')}`)
await page.getByRole('heading', { name: 'Stroke order' }).waitFor({ timeout: 15000 })
results['offline.niLocalExamples'] = await sectionText('Example sentences')
await page.unroute(/api\.tatoeba\.org|hanzi-writer-data/)

// 4. Búsqueda: la primera descarga el diccionario completo del repositorio de datos
await page.unroute(EXTERNAL).catch(() => {})
const DATA = /HanziVocab-Data/
async function search(query, expected) {
  const box = page.getByRole('searchbox', { name: 'Search' })
  await box.fill(query)
  await page.getByRole('list', { name: 'Results' }).getByRole('link', { name: expected }).first().waitFor({ timeout: 60000 })
}
requests.length = 0
await page.goto(BASE + '/dictionary')
await timed('search.firstFullMs', async () => {
  await search('penguin', /企鹅/)
  await page.getByText('Loading the full dictionary', { exact: false }).waitFor({ state: 'detached', timeout: 90000 }).catch(() => {})
})
results['search.firstRequestsToData'] = requests.filter((url) => DATA.test(url)).length
results['search.penguinTop'] = await page.getByRole('list', { name: 'Results' }).getByRole('link').first().innerText()
await timed('search.secondMs', async () => search('grapefruit', /柚子/))
await timed('search.repeatedMs', async () => search('penguin', /企鹅/))

// 5. Otra visita: el diccionario sale de IndexedDB, sin pedir nada
requests.length = 0
await page.goto(BASE + '/dictionary')
await timed('search.afterReloadMs', async () => search('penguin', /企鹅/))
results['search.afterReloadRequestsToData'] = requests.filter((url) => DATA.test(url)).length

// 6. Sin conexión con las fuentes externas, con caché: todo sigue
await page.route(EXTERNAL, (route) => route.abort('internetdisconnected'))
await page.goto(BASE + '/dictionary')
await timed('search.offlineCachedMs', async () => search('grapefruit', /柚子/))
await page.unroute(EXTERNAL)

// 7. Navegador nuevo (sin caché) y sin fuentes externas: HSK sigue, el resto avisa
const fresh = await browser.newContext()
const freshPage = await fresh.newPage()
await freshPage.route(EXTERNAL, (route) => route.abort('internetdisconnected'))
await freshPage.goto(BASE + '/dictionary')
await freshPage.getByRole('searchbox', { name: 'Search' }).fill('apple')
await freshPage.getByText("Couldn't load the full dictionary", { exact: false }).waitFor({ timeout: 30000 })
results['offlineFresh.appleTop'] = await freshPage.getByRole('list', { name: 'Results' }).getByRole('link').first().innerText()
await freshPage.goto(BASE + `/characters/${encodeURIComponent('柚')}`)
await freshPage.getByText("Couldn't load these entries", { exact: false }).waitFor({ timeout: 30000 })
results['offlineFresh.youPage'] = 'entries unavailable message shown'
await freshPage.goto(BASE + '/study/practice?set=hsk-1&mode=learn')
await freshPage.waitForTimeout(1500)
results['offlineFresh.learnPage'] = (await freshPage.locator('main').innerText()).slice(0, 300)
await freshPage.screenshot({ path: 'runtime-offline-learn.png', fullPage: true })

console.log(JSON.stringify(results, null, 2))
await browser.close()
