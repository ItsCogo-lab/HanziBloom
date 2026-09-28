import { describe, expect, it } from 'vitest'
import { hskDictionary } from '../dictionary/hskDictionary.ts'
import { listStudyItems, type StudyItem } from '../dictionary/studyItem.ts'
import { seededRandom } from '../../test/random.ts'
import {
  CHOICE_OPTION_COUNT,
  getMeaningClues,
  getMeaningLabel,
  getPinyinLabel,
  hanziChoiceDefinition,
  isCorrectOption,
  meaningChoiceDefinition,
  pickDistractors,
  pinyinChoiceDefinition,
} from './choiceExercises.ts'

function character(hanzi: string, pinyin: string[], meanings: string[]): StudyItem {
  return { kind: 'character', entry: { id: hanzi, hanzi, pinyin, meanings: { en: meanings }, hskLevel: 1 } }
}

function word(hanzi: string, pinyin: string, meanings: string[]): StudyItem {
  return { kind: 'word', entry: { id: hanzi, hanzi, pinyin, meanings: { en: meanings }, hskLevel: 1 } }
}

const hanziOf = (items: readonly StudyItem[]) => items.map((item) => item.entry.hanzi)

describe('getMeaningClues', () => {
  it('quita los paréntesis que citan el propio hanzi', () => {
    expect(getMeaningClues(character('大', ['dà'], ['big; large', 'eldest (as in 大姐)']))).toEqual([
      'big; large',
      'eldest',
    ])
  })

  it('descarta los significados que aun así revelan el hanzi', () => {
    expect(getMeaningClues(character('漂', ['piào'], ['used in 漂亮']))).toEqual([])
  })

  it('mantiene los paréntesis y hanzi que no revelan nada', () => {
    const item = character('你', ['nǐ'], ['you (informal, as opposed to courteous 您)'])
    expect(getMeaningClues(item)).toEqual(['you (informal, as opposed to courteous 您)'])
  })
})

describe('getMeaningLabel', () => {
  it('junta significados mientras quepan', () => {
    // Con el tercero pasaría de 40 caracteres
    expect(getMeaningLabel(word('朋友', 'péng you', ['friend', 'companion', 'boyfriend or girlfriend']))).toBe(
      'friend; companion',
    )
    expect(getMeaningLabel(word('爱', 'ài', ['to love; to be fond of; to like', 'affection']))).toBe(
      'to love; to be fond of; to like',
    )
  })

  it('siempre incluye el primer significado, aunque sea largo', () => {
    const long = 'plural marker for pronouns, and nouns referring to individuals'
    expect(getMeaningLabel(character('们', ['men'], [long, 'other']))).toBe(long)
  })
})

describe('getPinyinLabel', () => {
  it('usa la primera lectura de un carácter con varias', () => {
    expect(getPinyinLabel(character('了', ['le', 'liǎo'], ['completed action marker']))).toBe('le')
  })
})

describe('pickDistractors', () => {
  const pool = [
    word('朋友', 'péng you', ['friend']),
    word('喜欢', 'xǐ huan', ['to like; to be fond of']),
    word('爱', 'ài', ['to love; to be fond of; to like']),
    word('老师', 'lǎo shī', ['teacher']),
    word('医生', 'yī shēng', ['doctor']),
    word('学生', 'xué sheng', ['student']),
    word('飞机', 'fēi jī', ['airplane']),
    character('好', ['hǎo'], ['good']),
  ]

  it('no incluye la respuesta, otro tipo de elemento ni sinónimos', () => {
    const distractors = pickDistractors('meaning-choice', pool[1]!, pool) // 喜欢

    expect(distractors).toHaveLength(CHOICE_OPTION_COUNT - 1)
    // 爱 comparte "to like" y 好 es un carácter
    expect(hanziOf(distractors)).not.toContain('喜欢')
    expect(hanziOf(distractors)).not.toContain('爱')
    expect(hanziOf(distractors)).not.toContain('好')
  })

  it('prefiere distractores con el mismo número de caracteres', () => {
    // 爱 tiene un solo carácter: pasa al final y no hace falta
    expect(hanziOf(pickDistractors('meaning-choice', pool[0]!, pool))).toEqual(['喜欢', '老师', '医生'])
  })

  it('en pinyin descarta las lecturas iguales', () => {
    const items = [
      character('是', ['shì'], ['to be']),
      character('事', ['shì'], ['matter']),
      character('了', ['le', 'liǎo'], ['completed action marker']),
      character('瞭', ['liǎo'], ['clear']),
      character('十', ['shí'], ['ten']),
      character('四', ['sì'], ['four']),
    ]
    const distractors = pickDistractors('pinyin-choice', items[0]!, items)

    // 事 se lee igual que 是; 了 y 瞭 comparten liǎo, así que solo va uno de los dos
    expect(hanziOf(distractors)).toEqual(['了', '十', '四'])
  })

  it('no repite el mismo hanzi en las opciones de hanzi', () => {
    const items = [
      character('你', ['nǐ'], ['you']),
      character('好', ['hǎo'], ['good']),
      character('好', ['hào'], ['to be fond of']),
      character('他', ['tā'], ['he']),
      character('她', ['tā'], ['she']),
    ]
    const distractors = pickDistractors('hanzi-choice', items[0]!, items)

    expect(hanziOf(distractors)).toEqual(['好', '他', '她'])
  })
})

describe('definiciones de opción múltiple', () => {
  const pool = ['一', '二', '三', '四', '五', '六'].map((hanzi, index) =>
    character(hanzi, [`p${index}`], [`number ${index + 1}`]),
  )

  it.each([meaningChoiceDefinition, pinyinChoiceDefinition, hanziChoiceDefinition])(
    '$type crea cuatro opciones distintas con la respuesta entre ellas',
    (definition) => {
      const item = pool[0]!
      expect(definition.canBuild(item, pool)).toBe(true)

      const exercise = definition.build(item, pool, seededRandom(1))

      expect(exercise.type).toBe(definition.type)
      expect(exercise.options).toHaveLength(CHOICE_OPTION_COUNT)
      expect(new Set(exercise.options).size).toBe(CHOICE_OPTION_COUNT)
      expect(exercise.options.filter((option) => isCorrectOption(exercise, option))).toHaveLength(1)
    },
  )

  it('con la misma semilla crea las mismas opciones, y con otras semillas cambian', () => {
    const build = (seed: number) => hanziOf(meaningChoiceDefinition.build(pool[0]!, pool, seededRandom(seed)).options)

    expect(build(1)).toEqual(build(1))
    expect(new Set([1, 2, 3, 4, 5].map((seed) => build(seed).join(''))).size).toBeGreaterThan(1)
  })

  it('no se puede construir sin distractores suficientes', () => {
    expect(meaningChoiceDefinition.canBuild(pool[0]!, pool.slice(0, CHOICE_OPTION_COUNT - 1))).toBe(false)
  })

  it('no pregunta por significados que revelan el hanzi', () => {
    const revealing = character('漂', ['piào'], ['used in 漂亮'])
    const withRevealing = [...pool, revealing]

    expect(meaningChoiceDefinition.canBuild(revealing, withRevealing)).toBe(false)
    expect(hanziChoiceDefinition.canBuild(revealing, withRevealing)).toBe(false)
    expect(pinyinChoiceDefinition.canBuild(revealing, withRevealing)).toBe(true)
  })
})

describe('con el dataset HSK 1', () => {
  const pool = listStudyItems(hskDictionary)

  it('todos los elementos admiten al menos un ejercicio de opción múltiple', () => {
    const definitions = [meaningChoiceDefinition, pinyinChoiceDefinition, hanziChoiceDefinition]
    const withoutChoice = pool.filter((item) => !definitions.some((definition) => definition.canBuild(item, pool)))

    expect(withoutChoice).toEqual([])
  })
})
