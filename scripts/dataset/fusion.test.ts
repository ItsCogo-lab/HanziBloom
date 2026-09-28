import { describe, expect, it } from 'vitest'
import { ningCharacter, ningmengWord } from '../../src/features/dictionary/testData.ts'
import { cedictFixture } from './fixtures/cedict.ts'
import { makeMeAHanziFixture } from './fixtures/makemeahanzi.ts'
import { cjkRadicalsFixture, unihanIrgSourcesFixture, unihanVariantsFixture } from './fixtures/unihan.ts'
import { buildBaseEntries, crossCheckCharacter, enrichCharacter } from './fusion.ts'
import { createCedictIndex } from './sources/cedict.ts'
import { parseMakeMeAHanzi } from './sources/makemeahanzi.ts'
import { loadUnihan } from './sources/unihan.ts'

const cedict = createCedictIndex(cedictFixture)

describe('buildBaseEntries', () => {
  it('crea la palabra y sus caracteres con datos de CC-CEDICT', () => {
    const { characters, words, problems } = buildBaseEntries([{ hanzi: '柠檬', pinyin: 'níng méng' }], cedict, 1)

    expect(problems).toEqual(['Carácter 檬 [méng] (en 柠檬): sin lectura en CC-CEDICT'])
    expect(words).toEqual([ningmengWord])
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

describe('enrichCharacter', () => {
  const { characters } = buildBaseEntries([{ hanzi: '柠檬', pinyin: 'níng méng' }], cedict, 1)
  const ning = characters[0]!
  const unihan = loadUnihan([unihanIrgSourcesFixture, unihanVariantsFixture], cjkRadicalsFixture, new Set(['柠']))
  const makeMeAHanzi = parseMakeMeAHanzi(makeMeAHanziFixture, new Set(['柠']))

  it('combina CC-CEDICT, Unihan y Make Me a Hanzi en la ficha de 柠', () => {
    const enriched = enrichCharacter(ning, {
      unihan: unihan.get('柠'),
      makeMeAHanzi: makeMeAHanzi.get('柠'),
      hanziWriterStrokeCount: 9,
    })
    // Los tests de la interfaz usan este mismo objeto (testData.ts)
    expect(enriched).toEqual(ningCharacter)
    expect(enriched).toMatchObject({
      pinyin: ['níng'],
      traditional: ['檸'],
      radical: '木',
      radicalNumber: 75,
      decomposition: '⿰木宁',
      etymology: { type: 'pictophonetic', semantic: '木', phonetic: '宁' },
    })
  })

  it('añade los campos de Unihan a 柠, sin su número de trazos', () => {
    expect(enrichCharacter(ning, { unihan: unihan.get('柠') })).toEqual({
      ...ning,
      radical: '木',
      radicalNumber: 75,
      traditional: ['檸'],
    })
  })

  it('toma el número de trazos de hanzi-writer-data aunque Unihan diga otro', () => {
    const sources = { unihan: { strokeCount: 12 }, hanziWriterStrokeCount: 11 }
    expect(enrichCharacter(ning, sources).strokeCount).toBe(11)
  })

  it('no añade campos vacíos si una fuente no tiene el carácter', () => {
    const enriched = enrichCharacter(ning, {})
    expect(enriched).toEqual(ning)
    expect(Object.values(enriched)).not.toContain(undefined)
  })
})

describe('crossCheckCharacter', () => {
  const unihan = { strokeCount: 9, radical: '木', radicalNumber: 75 }

  it('no avisa cuando las fuentes coinciden', () => {
    expect(
      crossCheckCharacter('柠', { unihan, makeMeAHanzi: { radical: '木' }, hanziWriterStrokeCount: 9 }),
    ).toEqual([])
  })

  it('no avisa cuando el radical está escrito en otra forma del mismo radical Kangxi', () => {
    const person = { strokeCount: 5, radical: '人', radicalNumber: 9 }
    expect(crossCheckCharacter('X', { unihan: person, makeMeAHanzi: { radical: '亻' }, makeMeAHanziRadicalNumber: 9 })).toEqual([])
  })

  it('avisa de los desacuerdos sin corregirlos', () => {
    const conflicts = crossCheckCharacter('X', { unihan, makeMeAHanzi: { radical: '口' }, hanziWriterStrokeCount: 8 })
    expect(conflicts).toEqual([
      'X: Unihan dice 9 trazos y hanzi-writer-data tiene 8. Se usa el de hanzi-writer-data.',
      'X: el radical es 木 en Unihan y 口 en Make Me a Hanzi. Se usa el de Unihan.',
    ])
  })
})
