import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getEntryPath } from '../../../pages/entryPaths.ts'
import { renderWithProviders } from '../../../test/renderWithProviders.tsx'
import { createDictionary } from '../dictionary.ts'
import { ningCharacter, ningmengWord, testCharacters, testExampleSet, testWords } from '../testData.ts'
import { EntryDetails } from './EntryDetails.tsx'

const dictionary = createDictionary([...testCharacters, ningCharacter], [...testWords, ningmengWord])

function renderCharacter(entry = ningCharacter) {
  return renderWithProviders(
    <EntryDetails item={{ kind: 'character', entry }} dictionary={dictionary} getHref={getEntryPath} />,
  )
}

/** Simula el servidor: responde con `files[ruta]` o con un 404. */
function stubFetch(files: Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string) =>
    url in files ? new Response(JSON.stringify(files[url])) : new Response('', { status: 404 }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Valor de una fila "etiqueta → valor" de la ficha. */
function fact(label: string): HTMLElement {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling as HTMLElement
}

describe('EntryDetails de un carácter', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

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

  it('muestra el orden de trazos cuando hay datos', async () => {
    const strokes = { strokes: ['M 0 0 L 10 10'], medians: [[[0, 0], [10, 10]]] }
    const fetchMock = stubFetch({ '/strokes/67e0.json': strokes })
    renderCharacter()

    expect(await screen.findByRole('heading', { name: 'Stroke order' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/strokes/67e0.json')
  })

  it('no muestra el orden de trazos si no se pueden cargar', async () => {
    const fetchMock = stubFetch({})
    renderCharacter()

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(screen.queryByRole('heading', { name: 'Stroke order' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Example sentences' })).not.toBeInTheDocument()
  })

  it('muestra las frases de ejemplo de Tatoeba con su atribución', async () => {
    stubFetch({ '/examples/hsk1.json': testExampleSet })
    renderCharacter()

    expect(await screen.findByRole('heading', { name: 'Example sentences' })).toBeInTheDocument()
    expect(screen.getByText('柠檬很酸。')).toBeInTheDocument()
    expect(screen.getByText('Lemon is sour.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tatoeba #8934441 by iiujik' })).toHaveAttribute(
      'href',
      'https://tatoeba.org/en/sentences/show/8934441',
    )
    expect(screen.getByText(/licensed CC BY 2.0 FR/)).toBeInTheDocument()
  })
})

describe('EntryDetails de una palabra', () => {
  it('muestra la forma tradicional', () => {
    renderWithProviders(
      <EntryDetails item={{ kind: 'word', entry: ningmengWord }} dictionary={dictionary} getHref={getEntryPath} />,
    )
    expect(screen.getByText('Traditional').parentElement).toHaveTextContent('Traditional 檸檬')
  })
})
