import { getWordId } from './dictionary.ts'
import { getChunkIndex, type DictionaryChunk } from './fullDictionary.ts'
import { isValidIds } from './ids.ts'
import type { Character, Etymology, ExampleSet, Translations, Word } from './types.ts'

const HSK_LEVELS: readonly number[] = [1, 2, 3, 4]
const ETYMOLOGY_TYPES: readonly Etymology['type'][] = ['pictographic', 'ideographic', 'pictophonetic']
/** Los radicales Kangxi van del 1 al 214. */
const MAX_RADICAL_NUMBER = 214
const HAN = /^\p{Script=Han}$/u

/**
 * Revisa que los datos de caracteres y palabras sean coherentes y devuelve
 * una lista de problemas legibles (vacía si todo está bien).
 *
 * Se usa en los tests del dataset: si alguien añade una entrada incorrecta,
 * el test falla diciendo exactamente cuál y por qué.
 */
export function validateDictionaryData(characters: readonly Character[], words: readonly Word[]): string[] {
  const problems: string[] = []
  const characterIds = new Set<string>()
  const wordIds = new Set<string>()

  for (const character of characters) {
    const label = `Carácter "${character.id}"`

    if (characterIds.has(character.id)) problems.push(`${label}: id duplicado`)
    characterIds.add(character.id)

    if (character.id !== character.hanzi) problems.push(`${label}: el id debe ser igual al hanzi`)
    if (Array.from(character.hanzi).length !== 1) problems.push(`${label}: debe ser un solo carácter`)
    else if (!isHan(character.hanzi)) problems.push(`${label}: no es un carácter chino`)
    if (character.hskLevel !== undefined && !HSK_LEVELS.includes(character.hskLevel)) {
      problems.push(`${label}: nivel HSK no válido`)
    }
    problems.push(...findEmptyValues(label, character))
    if (character.pinyin.length === 0 || character.pinyin.some(isBlank)) {
      problems.push(`${label}: falta el pinyin`)
    }
    if (character.strokeCount !== undefined && !isPositiveInteger(character.strokeCount)) {
      problems.push(`${label}: número de trazos no válido`)
    }
    if (character.frequencyRank !== undefined && !isPositiveInteger(character.frequencyRank)) {
      problems.push(`${label}: posición de frecuencia no válida`)
    }
    if (character.radical !== undefined && !isSingleSymbol(character.radical)) {
      problems.push(`${label}: radical no válido`)
    }
    if (
      character.radicalNumber !== undefined &&
      !(isPositiveInteger(character.radicalNumber) && character.radicalNumber <= MAX_RADICAL_NUMBER)
    ) {
      problems.push(`${label}: número de radical no válido`)
    }
    if (character.traditional !== undefined && (character.traditional.length === 0 || !character.traditional.every(isHan))) {
      problems.push(`${label}: forma tradicional no válida`)
    }
    if (typeof character.decomposition === 'string' && !isValidIds(character.decomposition)) {
      problems.push(`${label}: descomposición no válida`)
    }
    if (character.etymology !== undefined) problems.push(...validateEtymology(label, character.etymology))
    problems.push(...validateMeanings(label, character.meanings))
  }

  for (const word of words) {
    const label = `Palabra "${word.id}"`

    if (wordIds.has(word.id)) problems.push(`${label}: id duplicado`)
    wordIds.add(word.id)

    if (word.id !== word.hanzi && word.id !== getWordId(word.hanzi, word.pinyin, true)) {
      problems.push(`${label}: el id debe ser el hanzi, o el hanzi con su pinyin si es un homógrafo`)
    }
    if (isBlank(word.pinyin)) problems.push(`${label}: falta el pinyin`)
    if (word.hskLevel !== undefined && !HSK_LEVELS.includes(word.hskLevel)) problems.push(`${label}: nivel HSK no válido`)
    if (
      word.traditional !== undefined &&
      (Array.from(word.traditional).length !== Array.from(word.hanzi).length || !Array.from(word.traditional).every(isHan))
    ) {
      problems.push(`${label}: forma tradicional no válida`)
    }
    if (word.frequencyRank !== undefined && !isPositiveInteger(word.frequencyRank)) {
      problems.push(`${label}: posición de frecuencia no válida`)
    }
    problems.push(...findEmptyValues(label, word))
    problems.push(...validateMeanings(label, word.meanings))

    for (const hanzi of Array.from(word.hanzi)) {
      if (!characterIds.has(hanzi)) problems.push(`${label}: el carácter "${hanzi}" no está en el dataset`)
    }
  }

  return problems
}

/**
 * Revisa los trozos del diccionario completo: cada entrada en el trozo de su
 * primer carácter (si no, la app no la encontraría) y ninguna con nivel HSK
 * (las de HSK 1-4 van en src/data). La coherencia de las entradas se revisa
 * con validateDictionaryData, junto con las de HSK.
 */
export function validateFullDictionary(chunks: readonly DictionaryChunk[]): string[] {
  const problems: string[] = []
  chunks.forEach((chunk, index) => {
    for (const entry of [...chunk.characters, ...chunk.words]) {
      if (getChunkIndex(entry.hanzi) !== index) problems.push(`"${entry.id}": está en el trozo ${index}, no en el suyo`)
      if (entry.hskLevel !== undefined) problems.push(`"${entry.id}": el diccionario completo no lleva nivel HSK`)
    }
  })
  return problems
}

/**
 * Revisa un archivo de frases de ejemplo: ids de Tatoeba válidos y sin
 * repetir, textos presentes y palabras que existen y aparecen en la frase.
 */
export function validateExampleSet(set: ExampleSet, words: readonly Word[]): string[] {
  const problems: string[] = []
  // Las frases se asocian al hanzi de la palabra (un homógrafo comparte frases)
  const wordHanzi = new Set(words.map((word) => word.hanzi))
  const seen = new Set<number>()

  if (set.source !== 'Tatoeba' || set.license !== 'CC BY 2.0 FR') problems.push('Ejemplos: fuente o licencia no válida')
  if (isBlank(set.exportDate)) problems.push('Ejemplos: falta la fecha de la exportación de Tatoeba')

  for (const sentence of set.sentences) {
    const label = `Frase ${sentence.tatoebaId}`
    if (!isPositiveInteger(sentence.tatoebaId) || !isPositiveInteger(sentence.translationTatoebaId)) {
      problems.push(`${label}: id de Tatoeba no válido`)
    }
    if (seen.has(sentence.tatoebaId)) problems.push(`${label}: repetida`)
    seen.add(sentence.tatoebaId)
    if (isBlank(sentence.zh) || isBlank(sentence.en)) problems.push(`${label}: falta el texto`)
    if (isBlank(sentence.author)) problems.push(`${label}: falta el autor`)
    if (sentence.words.length === 0) problems.push(`${label}: no está asociada a ninguna palabra`)
    for (const word of sentence.words) {
      if (!wordHanzi.has(word)) problems.push(`${label}: la palabra "${word}" no está en el dataset`)
      else if (!sentence.zh.includes(word)) problems.push(`${label}: no contiene la palabra "${word}"`)
    }
    problems.push(...findEmptyValues(label, sentence))
  }
  return problems
}

function validateEtymology(label: string, etymology: Etymology): string[] {
  const problems: string[] = []
  if (!ETYMOLOGY_TYPES.includes(etymology.type)) problems.push(`${label}: tipo de etimología no válido`)
  for (const component of [etymology.semantic, etymology.phonetic]) {
    if (component !== undefined && !isSingleSymbol(component)) {
      problems.push(`${label}: componente de la etimología no válido`)
    }
  }
  return problems
}

/**
 * Campos con null, undefined o texto vacío. En el dataset, un dato que no
 * existe se omite: si aparece vacío, algo ha fallado al generarlo.
 */
function findEmptyValues(label: string, entry: object): string[] {
  const empty = Object.entries(entry)
    .filter(([, value]) => value === null || value === undefined || (typeof value === 'string' && isBlank(value)))
    .map(([key]) => key)
  return empty.length > 0 ? [`${label}: campos vacíos (${empty.join(', ')})`] : []
}

function isHan(text: string): boolean {
  return HAN.test(text)
}

/** Un solo símbolo: un carácter o un componente como 亻 o ⺮. */
function isSingleSymbol(text: string): boolean {
  return Array.from(text).length === 1
}

function validateMeanings(label: string, meanings: Translations): string[] {
  if (meanings.en.length === 0 || meanings.en.some(isBlank)) {
    return [`${label}: falta el significado en inglés`]
  }
  return []
}

function isBlank(text: string): boolean {
  return text.trim() === ''
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0
}
