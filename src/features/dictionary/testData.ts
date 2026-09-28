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
