import type { ExampleSentence } from '../types.ts'
import { createRateLimiter, fetchJson, SourceError, type FetchOptions } from './http.ts'

/*
 * Adaptador de frases: API v1 de Tatoeba (https://api.tatoeba.org), pública y
 * sin clave. Devuelve CORS `*` y admite `sort=words` (las frases más cortas
 * primero) con 50 resultados como máximo por página (comprobado en GitHub
 * Actions). No publica límites de uso; sus condiciones prohíben saturarla,
 * así que cada navegador hace como mucho 20 peticiones por minuto y todo se
 * guarda en caché.
 */

export const TATOEBA_SOURCE = 'Tatoeba API v1'
export const TATOEBA_LICENSE = 'CC BY 2.0 FR'
const ENDPOINT = 'https://api.tatoeba.org/v1/sentences'
/** Máximo que devuelve la API por página. */
const PAGE_SIZE = 50

/** Las mismas reglas que las frases de HSK (scripts/dataset/sources/tatoeba.ts). */
export const MAX_SENTENCE_LENGTH = 16
const HAN = /\p{Script=Han}/u
const LATIN_OR_DIGIT = /[A-Za-z0-9Ａ-Ｚａ-ｚ０-９]/

const limiter = createRateLimiter(20)

interface ApiTranslation {
  id: number
  text: string
  owner: string | null
  license: string
  isDirect: boolean
  isUnapproved: boolean
}

interface ApiSentence extends Omit<ApiTranslation, 'isDirect'> {
  translations: ApiTranslation[]
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

function parseTranslation(value: unknown): ApiTranslation | undefined {
  if (!isObject(value)) return undefined
  const { id, text, owner, license, is_direct, is_unapproved, lang } = value
  if (lang !== undefined && lang !== 'eng') return undefined
  if (!Number.isInteger(id) || typeof text !== 'string' || typeof license !== 'string') return undefined
  return {
    id: id as number,
    text,
    owner: typeof owner === 'string' && owner !== '' ? owner : null,
    license,
    isDirect: is_direct === true,
    isUnapproved: is_unapproved !== false,
  }
}

/**
 * Comprueba el formato de /v1/sentences. Una respuesta sin `data` es un
 * error; una frase suelta mal formada solo se descarta.
 */
export function parseSentencesResponse(json: unknown): ApiSentence[] {
  if (!isObject(json) || !Array.isArray(json.data)) throw new SourceError('invalid', 'Tatoeba response without data')
  return json.data.flatMap((value): ApiSentence[] => {
    if (!isObject(value) || value.lang !== 'cmn') return []
    const sentence = parseTranslation({ ...value, lang: undefined })
    if (!sentence) return []
    // showtrans devuelve una lista plana de traducciones
    const translations = (Array.isArray(value.translations) ? value.translations.flat() : [])
      .map(parseTranslation)
      .filter((translation) => translation !== undefined)
    return [{ ...sentence, translations }]
  })
}

/**
 * Pasa las frases de la API al modelo de la app. Solo quedan las que se pueden
 * atribuir y mostrar bien: con autor, aprobadas, con licencia CC BY 2.0 FR,
 * cortas, sin letras latinas ni cifras, que contienen el término tal cual
 * (Tatoeba también devuelve frases en tradicional) y con traducción inglesa.
 * Como traducción, la directa de id más bajo (la misma regla que en HSK).
 */
export function toExampleSentences(term: string, sentences: readonly ApiSentence[]): ExampleSentence[] {
  const usable = (sentence: Omit<ApiTranslation, 'isDirect'>) =>
    !sentence.isUnapproved && sentence.license === TATOEBA_LICENSE
  return sentences.flatMap((sentence): ExampleSentence[] => {
    const { text } = sentence
    if (!usable(sentence) || sentence.owner === null || !text.includes(term)) return []
    if (Array.from(text).length > MAX_SENTENCE_LENGTH || LATIN_OR_DIGIT.test(text)) return []
    const [translation] = sentence.translations
      .filter(usable)
      .sort((a, b) => Number(b.isDirect) - Number(a.isDirect) || a.id - b.id)
    if (!translation) return []
    return [
      {
        tatoebaId: sentence.id,
        zh: text,
        author: sentence.owner,
        en: translation.text,
        translationTatoebaId: translation.id,
        ...(translation.owner !== null && {
          translationAuthor: translation.owner,
        }),
        words: [term],
      },
    ]
  })
}

/** URL de búsqueda: el término va entre comillas para buscarlo como frase exacta. */
export function tatoebaSearchUrl(term: string): string {
  const params = new URLSearchParams({
    lang: 'cmn',
    q: `"${term.replace(/["\\]/g, '')}"`,
    sort: 'words',
    'showtrans:lang': 'eng',
    'trans:lang': 'eng',
    limit: String(PAGE_SIZE),
  })
  return `${ENDPOINT}?${params}`
}

/** Frases candidatas para un hanzi o una palabra, de más corta a más larga. */
export async function fetchTatoebaExamples(term: string, options: FetchOptions = {}) {
  // Solo términos chinos cortos: nunca texto libre del usuario sin límite
  if (!HAN.test(term) || Array.from(term).length > 12) throw new SourceError('invalid', 'Not a Chinese term')
  const json = await limiter.schedule(() => fetchJson(tatoebaSearchUrl(term), options))
  return {
    data: toExampleSentences(term, parseSentencesResponse(json)),
    source: TATOEBA_SOURCE,
  }
}
