import { describe, expect, it } from 'vitest'
import { cedictFixture } from './fixtures/cedict.ts'
import { buildBaseEntries } from './fusion.ts'
import { createCedictIndex } from './sources/cedict.ts'

const cedict = createCedictIndex(cedictFixture)

describe('buildBaseEntries', () => {
  it('crea la palabra y sus caracteres con datos de CC-CEDICT', () => {
    const { characters, words, problems } = buildBaseEntries([{ hanzi: '柠檬', pinyin: 'níng méng' }], cedict, 1)

    expect(problems).toEqual(['Carácter 檬 [méng] (en 柠檬): sin lectura en CC-CEDICT'])
    expect(words).toEqual([{ id: '柠檬', hanzi: '柠檬', pinyin: 'níng méng', meanings: { en: ['lemon'] }, hskLevel: 1 }])
    expect(characters).toEqual([
      { id: '柠', hanzi: '柠', pinyin: ['níng'], meanings: { en: ['used in 柠檬'] }, hskLevel: 1 },
    ])
  })

  it('avisa de las palabras que no están en CC-CEDICT en lugar de inventarlas', () => {
    const { problems } = buildBaseEntries([{ hanzi: '好', pinyin: 'hào' }], cedict, 1)
    expect(problems).toEqual([])
    expect(buildBaseEntries([{ hanzi: '好', pinyin: 'hā' }], cedict, 1).problems).toContain(
      'Palabra 好 [hā]: sin entrada en CC-CEDICT',
    )
  })
})
