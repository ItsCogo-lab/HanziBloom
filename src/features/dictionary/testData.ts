import type { Character, Word } from './types.ts'

/*
 * Datos pequeños SOLO para tests. El dataset real de HSK 1 llegará en la
 * fase 5 con sus fuentes documentadas.
 */

export const testCharacters: Character[] = [
  { id: '你', hanzi: '你', pinyin: ['nǐ'], meanings: { es: ['tú'] }, hskLevel: 1, strokeCount: 7 },
  { id: '好', hanzi: '好', pinyin: ['hǎo'], meanings: { es: ['bueno', 'bien'] }, hskLevel: 1 },
  { id: '谢', hanzi: '谢', pinyin: ['xiè'], meanings: { es: ['agradecer'] }, hskLevel: 1 },
  { id: '了', hanzi: '了', pinyin: ['le', 'liǎo'], meanings: { es: ['partícula de acción completada'] }, hskLevel: 1 },
]

export const testWords: Word[] = [
  { id: '你好', hanzi: '你好', pinyin: 'nǐ hǎo', meanings: { es: ['hola'] }, hskLevel: 1 },
  { id: '好', hanzi: '好', pinyin: 'hǎo', meanings: { es: ['bueno', 'bien'] }, hskLevel: 1 },
  { id: '谢谢', hanzi: '谢谢', pinyin: 'xièxie', meanings: { es: ['gracias'], en: ['thanks'] }, hskLevel: 1 },
]
