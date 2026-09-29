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
await page.route(EXTERNAL, (route) => route.abort('internetdisconnected'))
await detail(`/characters/${encodeURIComponent('柠')}`)
await page.getByRole('heading', { name: 'Stroke order' }).waitFor()
results['offline.ningFromCache'] = (await sectionText('Example sentences')) !== null
await detail(`/characters/${encodeURIComponent('桔')}`)
await page.getByText('Stroke order unavailable offline.').waitFor({ timeout: 15000 })
results['offline.juUnavailable'] = await sectionText('Example sentences')
await detail(`/characters/${encodeURIComponent('你')}`)
await page.getByRole('heading', { name: 'Stroke order' }).waitFor({ timeout: 15000 })
results['offline.niLocalExamples'] = await sectionText('Example sentences')
await page.unroute(EXTERNAL)

// 4. Búsqueda: la primera descarga el diccionario completo; la segunda ya lo tiene
await page.goto(BASE + '/dictionary')
const box = page.getByRole('searchbox', { name: 'Search' })
await timed('search.firstMs', async () => {
  await box.fill('lemon')
  await page.getByText(/^Showing \d+ of \d+$/).waitFor()
  await page.getByRole('status').filter({ hasText: 'full dictionary' }).waitFor({ state: 'detached', timeout: 30000 }).catch(() => {})
})
results['search.firstTop'] = await page.getByRole('list', { name: 'Results' }).getByRole('link').first().innerText()
await timed('search.secondMs', async () => {
  await box.fill('penguin')
  await page.getByRole('link', { name: /企鹅/ }).first().waitFor()
})
await timed('search.repeatedMs', async () => {
  await box.fill('lemon')
  await page.getByRole('link', { name: /柠檬/ }).first().waitFor()
})

console.log(JSON.stringify(results, null, 2))
await browser.close()
