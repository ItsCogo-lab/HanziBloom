import type { Character, Translations, Word } from './types.ts'

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
    if (character.pinyin.length === 0 || character.pinyin.some(isBlank)) {
      problems.push(`${label}: falta el pinyin`)
    }
    if (character.strokeCount !== undefined && !isPositiveInteger(character.strokeCount)) {
      problems.push(`${label}: número de trazos no válido`)
    }
    if (character.frequencyRank !== undefined && !isPositiveInteger(character.frequencyRank)) {
      problems.push(`${label}: posición de frecuencia no válida`)
    }
    problems.push(...validateMeanings(label, character.meanings))
  }

  for (const word of words) {
    const label = `Palabra "${word.id}"`

    if (wordIds.has(word.id)) problems.push(`${label}: id duplicado`)
    wordIds.add(word.id)

    if (word.id !== word.hanzi) problems.push(`${label}: el id debe ser igual al hanzi`)
    if (isBlank(word.pinyin)) problems.push(`${label}: falta el pinyin`)
    problems.push(...validateMeanings(label, word.meanings))

    for (const hanzi of Array.from(word.hanzi)) {
      if (!characterIds.has(hanzi)) problems.push(`${label}: el carácter "${hanzi}" no está en el dataset`)
    }
  }

  return problems
}

function validateMeanings(label: string, meanings: Translations): string[] {
  if (meanings.es.length === 0 || meanings.es.some(isBlank)) {
    return [`${label}: falta el significado en español`]
  }
  return []
}

function isBlank(text: string): boolean {
  return text.trim() === ''
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0
}
