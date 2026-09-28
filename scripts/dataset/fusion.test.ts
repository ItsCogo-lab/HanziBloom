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
    const { characters, words, problems } = buildBaseEntries([{ level: 1, words: [{ hanzi: '柠檬', pinyin: 'níng méng' }] }], cedict)

    expect(problems).toEqual(['Carácter 檬 [méng] (en 柠檬): sin lectura en CC-CEDICT'])
    expect(words).toEqual([ningmengWord])
    expect(characters).toEqual([
      { id: '柠', hanzi: '柠', pinyin: ['níng'], meanings: { en: ['used in 柠檬'] }, hskLevel: 1 },
    ])
  })

  it('deja fuera las palabras que no están en CC-CEDICT en lugar de inventarlas, y lo dice', () => {
    const { problems } = buildBaseEntries([{ level: 1, words: [{ hanzi: '好', pinyin: 'hào' }] }], cedict)
    expect(problems).toEqual([])
    const missing = buildBaseEntries([{ level: 3, words: [{ hanzi: '好', pinyin: 'hā' }] }], cedict)
    expect(missing.words).toEqual([])
    expect(missing.characters).toEqual([])
    expect(missing.leftOut).toEqual(['好 [hā] (HSK 3)'])
  })
  it('junta varios niveles: cada carácter queda en el primer nivel en que aparece', () => {
    const { characters, words } = buildBaseEntries(
      [
        { level: 1, words: [{ hanzi: '好', pinyin: 'hǎo' }] },
        { level: 2, words: [{ hanzi: '柠檬', pinyin: 'níng méng' }, { hanzi: '好', pinyin: 'hào' }] },
      ],
      cedict,
    )
    expect(words.map((word) => [word.id, word.hskLevel])).toEqual([
      ['好[hǎo]', 1],
      ['柠檬', 2],
      ['好[hào]', 2],
    ])
    expect(characters.find((character) => character.hanzi === '好')).toMatchObject({
      pinyin: ['hǎo', 'hào'],
      hskLevel: 1,
    })
    expect(characters.find((character) => character.hanzi === '柠')?.hskLevel).toBe(2)
  })

  it('pone primero los significados generales si el carácter también se usa en minúscula', () => {
    const fixture = createCedictIndex(
      JSON.stringify([
        { traditional: '京', simplified: '京', pinyin: 'Jing1', english: ['Jing ethnic minority'] },
        { traditional: '京', simplified: '京', pinyin: 'jing1', english: ['capital city of a country'] },
        { traditional: '北', simplified: '北', pinyin: 'bei3', english: ['north'] },
        { traditional: '北京', simplified: '北京', pinyin: 'Bei3 jing1', english: ['Beijing'] },
        { traditional: '京劇', simplified: '京剧', pinyin: 'Jing1 ju4', english: ['Beijing opera'] },
        { traditional: '劇', simplified: '剧', pinyin: 'ju4', english: ['drama'] },
      ]),
    )
    const onlyProper = buildBaseEntries([{ level: 4, words: [{ hanzi: '京剧', pinyin: 'Jīng jù' }] }], fixture)
    expect(onlyProper.characters[0]!.meanings.en).toEqual(['Jing ethnic minority', 'capital city of a country'])

    const mixed = buildBaseEntries(
      [
        { level: 1, words: [{ hanzi: '北京', pinyin: 'Běi jīng' }] },
        { level: 4, words: [{ hanzi: '京剧', pinyin: 'Jīng jù' }] },
      ],
      fixture,
    )
    expect(mixed.characters.find((character) => character.hanzi === '京')!.meanings.en).toEqual([
      'capital city of a country',
      'Jing ethnic minority',
    ])
  })

  it('guarda una sola vez las palabras que la lista repite con el mismo pinyin', () => {
    const { words, duplicates } = buildBaseEntries(
      [{ level: 4, words: [{ hanzi: '好', pinyin: 'hǎo' }, { hanzi: '好', pinyin: 'hǎo' }] }],
      cedict,
    )
    expect(words.map((word) => word.id)).toEqual(['好'])
    expect(duplicates).toEqual(['好 [hǎo] (HSK 4)'])
  })
})

describe('enrichCharacter', () => {
  const { characters } = buildBaseEntries([{ level: 1, words: [{ hanzi: '柠檬', pinyin: 'níng méng' }] }], cedict)
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
