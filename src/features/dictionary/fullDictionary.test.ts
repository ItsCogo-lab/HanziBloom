import { describe, expect, it } from 'vitest'
import { CHUNK_COUNT, getChunkIndex, getChunksFor, getItemHanzi } from './fullDictionary.ts'

describe('full dictionary chunks', () => {
  it('splits by the code point of the first character', () => {
    expect(getChunkIndex('企')).toBe(0x4f01 % CHUNK_COUNT)
    expect(getChunkIndex('企鹅')).toBe(getChunkIndex('企'))
  })

  it('extracts the hanzi from an item id, including a homograph', () => {
    expect(getItemHanzi('char:鹅')).toBe('鹅')
    expect(getItemHanzi('word:苹果[Píng guǒ]')).toBe('苹果')
  })

  it('a word needs its chunk and those of its characters, without repeats', () => {
    expect(getChunksFor('word:企鹅')).toEqual([getChunkIndex('企'), getChunkIndex('鹅')])
    expect(getChunksFor('word:谢谢')).toEqual([getChunkIndex('谢')])
  })
})
