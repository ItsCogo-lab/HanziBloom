import { describe, expect, it } from 'vitest'
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

describe('enrichCharacter', () => {
  const { characters } = buildBaseEntries([{ hanzi: '柠檬', pinyin: 'níng méng' }], cedict, 1)
  const ning = characters[0]!
  const unihan = loadUnihan([unihanIrgSourcesFixture, unihanVariantsFixture], cjkRadicalsFixture, new Set(['柠']))
  const makeMeAHanzi = parseMakeMeAHanzi(makeMeAHanziFixture, new Set(['柠']))

  it('combina CC-CEDICT, Unihan y Make Me a Hanzi en la ficha de 柠', () => {
    expect(enrichCharacter(ning, { unihan: unihan.get('柠'), makeMeAHanzi: makeMeAHanzi.get('柠') })).toEqual({
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
    })
  })

  it('añade los campos de Unihan a 柠', () => {
    expect(enrichCharacter(ning, { unihan: unihan.get('柠') })).toEqual({
      ...ning,
      strokeCount: 9,
      radical: '木',
      radicalNumber: 75,
      traditional: ['檸'],
    })
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

  it('avisa de los desacuerdos sin corregirlos', () => {
    const conflicts = crossCheckCharacter('X', { unihan, makeMeAHanzi: { radical: '口' }, hanziWriterStrokeCount: 8 })
    expect(conflicts).toEqual([
      'X: Unihan dice 9 trazos y hanzi-writer-data tiene 8. Se usa el de Unihan.',
      'X: el radical es 木 en Unihan y 口 en Make Me a Hanzi. Se usa el de Unihan.',
    ])
  })
})
