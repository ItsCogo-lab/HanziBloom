import { describe, expect, it } from 'vitest'
import { ningCharacter, ningmengWord } from '../../src/features/dictionary/testData.ts'
import { cedictFixture } from './fixtures/cedict.ts'
import { makeMeAHanziFixture } from './fixtures/makemeahanzi.ts'
import { cjkRadicalsFixture, unihanIrgSourcesFixture, unihanVariantsFixture } from './fixtures/unihan.ts'
import { buildBaseEntries, buildFullEntries, crossCheckCharacter, enrichCharacter } from './fusion.ts'
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

describe('buildFullEntries', () => {
  // Líneas reales de CC-CEDICT (edición 2025-12-13)
  const fullCedict = createCedictIndex(
    JSON.stringify([
      { traditional: 'T恤', simplified: 'T恤', pinyin: 'T xu4', english: ['T-shirt'] },
      { traditional: '々', simplified: '々', pinyin: 'xx5', english: ['iteration mark (used to represent a duplicated character)'] },
      { traditional: '宏碁', simplified: '宏碁', pinyin: 'Hong2 ji1', english: ['Acer, Taiwanese computer hardware company'] },
      { traditional: '果', simplified: '果', pinyin: 'guo3', english: ['fruit', 'result', 'resolute', 'indeed', 'if really'] },
      { traditional: '苹', simplified: '苹', pinyin: 'ping2', english: ['(artemisia)', 'duckweed'] },
      { traditional: '蘋', simplified: '苹', pinyin: 'ping2', english: ['used in 蘋果|苹果[ping2 guo3]'] },
      { traditional: '蘋果', simplified: '苹果', pinyin: 'Ping2 guo3', english: ['Apple (American tech company)'] },
      { traditional: '蘋果', simplified: '苹果', pinyin: 'ping2 guo3', english: ['apple', 'CL:個|个[ge4],顆|颗[ke1]'] },
      { traditional: '檸', simplified: '柠', pinyin: 'ning2', english: ['used in 檸檬|柠檬[ning2 meng2]'] },
    ]),
  )
  const hsk = buildBaseEntries([{ level: 1, words: [{ hanzi: '苹果', pinyin: 'píng guǒ' }] }], fullCedict)
  const full = buildFullEntries(fullCedict, hsk)

  it('no repite lo que ya está en HSK y separa las otras lecturas con su pinyin en el id', () => {
    expect(full.words).toEqual([
      {
        id: '苹果[Píng guǒ]',
        hanzi: '苹果',
        pinyin: 'Píng guǒ',
        meanings: { en: ['Apple (American tech company)'] },
        traditional: '蘋果',
      },
    ])
  })

  it('añade los caracteres que no están en HSK, sin nivel', () => {
    expect(full.characters).toEqual([{ id: '柠', hanzi: '柠', pinyin: ['níng'], meanings: { en: ['used in 柠檬'] } }])
  })

  it('deja fuera lo que no puede enseñar, y dice por qué', () => {
    expect(full.leftOut).toEqual(['々: CC-CEDICT no conoce su lectura', '宏碁 [Hóng jī]: sin entrada para 宏, 碁'])
    expect(full.words.map((word) => word.hanzi)).not.toContain('T恤')
  })
})
