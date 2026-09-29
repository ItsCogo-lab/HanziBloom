import { describe, expect, it } from 'vitest'
import { CHUNK_COUNT, getChunkIndex, getChunksFor, getItemHanzi } from './fullDictionary.ts'

describe('trozos del diccionario completo', () => {
  it('reparte por el punto de código del primer carácter', () => {
    expect(getChunkIndex('企')).toBe(0x4f01 % CHUNK_COUNT)
    expect(getChunkIndex('企鹅')).toBe(getChunkIndex('企'))
  })

  it('saca el hanzi del id de un elemento, también de un homógrafo', () => {
    expect(getItemHanzi('char:鹅')).toBe('鹅')
    expect(getItemHanzi('word:苹果[Píng guǒ]')).toBe('苹果')
  })

  it('una palabra necesita su trozo y los de sus caracteres, sin repetir', () => {
    expect(getChunksFor('word:企鹅')).toEqual([getChunkIndex('企'), getChunkIndex('鹅')])
    expect(getChunksFor('word:谢谢')).toEqual([getChunkIndex('谢')])
  })
})
