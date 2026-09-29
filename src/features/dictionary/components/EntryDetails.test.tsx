import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getEntryPath } from '../entryPaths.ts'
import { renderWithProviders } from '../../../test/renderWithProviders.tsx'
import { createDictionary } from '../dictionary.ts'
import { ningCharacter, ningmengWord, testCharacters, testExampleSet, testWords } from '../testData.ts'
import { createFakeFetch, jsonResponse } from '../../../test/fakeFetch.ts'
import { ningResponse } from '../../../test/tatoebaResponses.ts'
import { EntryDetails } from './EntryDetails.tsx'

const dictionary = createDictionary([...testCharacters, ningCharacter], [...testWords, ningmengWord])

const JSDELIVR_NING = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent('柠')}.json`
const strokes = {
  strokes: ['M 0 0 L 10 10'],
  medians: [
    [
      [0, 0],
      [10, 10],
    ],
  ],
}

function renderCharacter(entry = ningCharacter, fetchFn?: typeof fetch) {
  return renderWithProviders(
    <EntryDetails item={{ kind: 'character', entry }} dictionary={dictionary} opener={{ getHref: getEntryPath }} />,
    { fetchFn },
  )
}

/** Valor de una fila "etiqueta → valor" de la ficha. */
function fact(label: string): HTMLElement {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling as HTMLElement
}

describe('EntryDetails de un carácter', () => {
  it('muestra los datos integrados de 柠', () => {
    renderCharacter()

    expect(screen.getByText('níng')).toBeInTheDocument()
    expect(screen.getByText('used in 柠檬')).toBeInTheDocument()
    expect(fact('Traditional')).toHaveTextContent('檸')
    expect(fact('Radical')).toHaveTextContent('木')
    expect(fact('Radical')).toHaveTextContent('Kangxi radical 75')
    expect(fact('Strokes')).toHaveTextContent('9')
    expect(fact('Components')).toHaveTextContent('木+宁')
    expect(fact('HSK level')).toHaveTextContent('HSK 1')
  })

  it('muestra la etimología pictofonética', () => {
    renderCharacter()

    const etymology = screen.getByRole('heading', { name: 'Etymology' }).parentElement!
    expect(within(etymology).getByText('Pictophonetic')).toBeInTheDocument()
    expect(fact('Meaning from')).toHaveTextContent('木tree')
    expect(fact('Sound from')).toHaveTextContent('宁')
  })

  it('lista las palabras relacionadas con tradicional, pinyin, significado y nivel', () => {
    renderCharacter()

    const link = screen.getByRole('link', { name: /柠檬/ })
    expect(link).toHaveTextContent('柠檬檸檬níng ménglemonHSK 1')
    expect(link).toHaveAttribute('href', '/vocabulary/%E6%9F%A0%E6%AA%AC')
  })

  it('enlaza los componentes que están en el diccionario', () => {
    const withComponent = { ...ningCharacter, decomposition: '⿰好你' }
    renderCharacter(withComponent)

    expect(within(fact('Components')).getByRole('link', { name: /好/ })).toHaveAttribute(
      'href',
      '/characters/%E5%A5%BD',
    )
  })

  it('oculta las secciones sin datos', () => {
    renderCharacter(testCharacters[1]!)

    for (const label of ['Traditional', 'Radical', 'Strokes', 'Components']) {
      expect(screen.queryByText(label, { selector: 'dt' })).not.toBeInTheDocument()
    }
    expect(screen.queryByRole('heading', { name: 'Etymology' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Stroke order' })).not.toBeInTheDocument()
  })

  it('carga los trazos de jsDelivr, también fuera de HSK', async () => {
    const fake = createFakeFetch([[JSDELIVR_NING, jsonResponse(strokes)]])
    const { hskLevel: _level, ...outsideHsk } = ningCharacter
    renderCharacter(outsideHsk, fake.fetch)

    expect(await screen.findByRole('heading', { name: 'Stroke order' })).toBeInTheDocument()
    expect(fake.requested).toContain(JSDELIVR_NING)
    expect(fake.requested).not.toContain('/strokes/67e0.json')
  })

  it('sin conexión con jsDelivr usa la copia local de HSK', async () => {
    const fake = createFakeFetch([['/strokes/67e0.json', jsonResponse(strokes)]])
    renderCharacter(ningCharacter, fake.fetch)

    expect(await screen.findByRole('heading', { name: 'Stroke order' })).toBeInTheDocument()
    expect(fake.requested).toEqual(expect.arrayContaining([JSDELIVR_NING, '/strokes/67e0.json']))
  })

  it('sin conexión y sin copia local dice que los trazos no están disponibles', async () => {
    const { hskLevel: _level, ...outsideHsk } = ningCharacter
    renderCharacter(outsideHsk)

    expect(await screen.findByText('Stroke order unavailable offline.')).toBeInTheDocument()
    expect(await screen.findByText('Example sentences unavailable offline.')).toBeInTheDocument()
  })

  it('no muestra el orden de trazos ni frases si las fuentes no los tienen', async () => {
    const fake = createFakeFetch([[/./, new Response('', { status: 404 })]])
    renderCharacter(ningCharacter, fake.fetch)

    await vi.waitFor(() => expect(fake.requested).toHaveLength(4))
    expect(screen.queryByRole('heading', { name: 'Stroke order' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Example sentences' })).not.toBeInTheDocument()
  })

  it('muestra frases de Tatoeba en tiempo de ejecución con su atribución', async () => {
    const fake = createFakeFetch([['https://api.tatoeba.org/v1/sentences?', jsonResponse(ningResponse)]])
    renderCharacter(ningCharacter, fake.fetch)

    expect(await screen.findByRole('heading', { name: 'Example sentences' })).toBeInTheDocument()
    expect(screen.getByText('柠檬很酸。')).toBeInTheDocument()
    // La traducción directa de id más bajo
    expect(screen.getByText('Lemon is sour.')).toBeInTheDocument()
    // Las frases en tradicional no contienen 柠 tal cual
    expect(screen.queryByText('檸檬是酸的。')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem').filter((li) => li.textContent?.includes('Tatoeba #'))).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Tatoeba #8934441 by iiujik' })).toHaveAttribute(
      'href',
      'https://tatoeba.org/en/sentences/show/8934441',
    )
    expect(screen.getByText(/licensed CC BY 2.0 FR/)).toBeInTheDocument()
    expect(fake.requested).not.toContain('/examples/hsk1.json')
  })

  it('sin conexión con Tatoeba usa las frases locales de HSK', async () => {
    const fake = createFakeFetch([['/examples/hsk1.json', jsonResponse(testExampleSet)]])
    renderCharacter(ningCharacter, fake.fetch)

    expect(await screen.findByRole('heading', { name: 'Example sentences' })).toBeInTheDocument()
    expect(screen.getByText('柠檬很酸。')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tatoeba #8934441 by iiujik' })).toBeInTheDocument()
  })
})

describe('EntryDetails de una palabra', () => {
  it('muestra la forma tradicional', () => {
    renderWithProviders(
      <EntryDetails
        item={{ kind: 'word', entry: ningmengWord }}
        dictionary={dictionary}
        opener={{ getHref: getEntryPath }}
      />,
    )
    expect(screen.getByText('Traditional').parentElement).toHaveTextContent('Traditional 檸檬')
  })
})
