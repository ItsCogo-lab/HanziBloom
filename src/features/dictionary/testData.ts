import type { Character, ExampleSet, Word } from './types.ts'

/*
 * Small data for tests ONLY. The real HSK 1 dataset will arrive in
 * phase 5 with its sources documented.
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
 * 柠 and 柠檬, the reference for the Tofu-style entry page. They aren't in HSK 1, so
 * they don't appear in the app's dataset. These objects are exactly what the
 * pipeline generates from real lines of CC-CEDICT, Unihan and Make Me
 * a Hanzi: scripts/dataset/fusion.test.ts checks that they match.
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

/** An examples file with the real Tatoeba sentence 8934441 (CC BY 2.0 FR). */
export const testExampleSet: ExampleSet = {
  source: 'Tatoeba',
  license: 'CC BY 2.0 FR',
  exportDate: '2026-09-26',
  sentences: [
    {
      tatoebaId: 8934441,
      zh: '柠檬很酸。',
      author: 'iiujik',
      en: 'Lemon is sour.',
      translationTatoebaId: 29487,
      words: ['柠檬'],
    },
  ],
}
