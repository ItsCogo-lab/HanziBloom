import type { Character, Word } from './types.ts'

/*
 * Datos pequeños SOLO para tests. El dataset real de HSK 1 llegará en la
 * fase 5 con sus fuentes documentadas.
 */

export const testCharacters: Character[] = [
  { id: '你', hanzi: '你', pinyin: ['nǐ'], meanings: { en: ['you'] }, hskLevel: 1, strokeCount: 7 },
  { id: '好', hanzi: '好', pinyin: ['hǎo'], meanings: { en: ['good', 'well'] }, hskLevel: 1 },
  { id: '谢', hanzi: '谢', pinyin: ['xiè'], meanings: { en: ['to thank'] }, hskLevel: 1 },
  { id: '了', hanzi: '了', pinyin: ['le', 'liǎo'], meanings: { en: ['completed action marker'] }, hskLevel: 1 },
]

export const testWords: Word[] = [
  { id: '你好', hanzi: '你好', pinyin: 'nǐ hǎo', meanings: { en: ['hello'] }, hskLevel: 1 },
  { id: '好', hanzi: '好', pinyin: 'hǎo', meanings: { en: ['good', 'well'] }, hskLevel: 1 },
  { id: '谢谢', hanzi: '谢谢', pinyin: 'xièxie', meanings: { en: ['thanks'], es: ['gracias'] }, hskLevel: 1 },
]

/*
 * 柠 y 柠檬, la referencia de la ficha estilo Tofu. No están en HSK 1, así que
 * no aparecen en el dataset de la app. Estos objetos son exactamente lo que
 * genera el pipeline a partir de líneas reales de CC-CEDICT, Unihan y Make Me
 * a Hanzi: scripts/dataset/fusion.test.ts comprueba que coinciden.
 */
export const ningCharacter: Character = {
  id: '柠',
  hanzi: '柠',
  pinyin: ['níng'],
  meanings: { en: ['used in 柠檬'] },
  hskLevel: 1,
  strokeCount: 9,
  radical: '木',
  radicalNumber: 75,
  traditional: ['檸'],
  decomposition: '⿰木宁',
  etymology: { type: 'pictophonetic', hint: 'tree', semantic: '木', phonetic: '宁' },
}

export const ningmengWord: Word = {
  id: '柠檬',
  hanzi: '柠檬',
  pinyin: 'níng méng',
  meanings: { en: ['lemon'] },
  hskLevel: 1,
  traditional: '檸檬',
}
