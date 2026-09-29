import { describe, expect, it } from 'vitest'
import { annotateSentence } from './pinyinEngine.ts'
import { getDatasetReadings, processSentence } from './sentenceProcessing.ts'
import { chooseReading } from './sentences.ts'
import type { SentenceToken } from './types.ts'

const annotate = (chinese: string) => annotateSentence(chinese, getDatasetReadings)

/** "我:wǒ3" por carácter, "?" si es dudoso; la puntuación tal cual. */
function describeTokens(tokens: readonly SentenceToken[]): string[] {
  return tokens.map((token) =>
    token.uncertain ? `${token.text}?` : token.pinyin ? `${token.text}:${token.pinyin}${token.tone}` : token.text,
  )
}

describe('pinyin automático de las frases', () => {
  it('genera pinyin con tono para cada carácter de una frase completa', () => {
    expect(describeTokens(annotate('我每天学习中文。'))).toEqual([
      '我:wǒ3', '每:měi3', '天:tiān1', '学:xué2', '习:xí2', '中:zhōng1', '文:wén2', '。',
    ])
  })

  it('aplica el cambio de tono de 一 y 不, que es como se pronuncia', () => {
    expect(describeTokens(annotate('我每天吃一个苹果。'))).toContain('一:yí2')
    expect(describeTokens(annotate('我觉得不对。'))).toContain('不:bú2')
  })

  it('usa el tono neutro del dataset donde el motor pone tono pleno', () => {
    expect(describeTokens(annotate('他没有朋友。'))).toEqual(['他:tā1', '没:méi2', '有:yǒu3', '朋:péng2', '友:you5', '。'])
    // Sin la misma sílaba en tono neutro en el dataset, manda el motor
    expect(describeTokens(annotate('我有朋友。'))).toContain('有:yǒu3')
  })

  it('lee los caracteres polifónicos según la palabra', () => {
    expect(describeTokens(annotate('银行行长走了。'))).toEqual([
      '银:yín2', '行:háng2', '行:háng2', '长:zhǎng3', '走:zǒu3', '了:le5', '。',
    ])
    expect(describeTokens(annotate('他长大了。'))).toContain('长:zhǎng3')
  })

  it('marca como dudoso lo que no puede decidir, sin tono y con las lecturas posibles', () => {
    const tokens = annotate('他长得很高。')

    expect(tokens[1]).toEqual({ text: '长', pinyin: 'cháng', uncertain: true, candidates: ['cháng', 'zhǎng'] })
    expect(tokens[2]).toMatchObject({ text: '得', uncertain: true })
    expect(tokens[2]?.tone).toBeUndefined()
    expect(describeTokens(tokens)).toContain('很:hěn3')
  })

  it('mantiene la puntuación, los espacios y el texto que no es chino, sin pinyin', () => {
    const tokens = annotate('你好, world! 再见。')

    expect(tokens.map((token) => token.text).join('')).toBe('你好, world! 再见。')
    expect(tokens.filter((token) => token.pinyin === undefined).map((token) => token.text)).toEqual([', world! ', '。'])
  })

  it('es determinista: la misma frase da siempre lo mismo', async () => {
    expect(await processSentence('我在机场等你。')).toEqual(annotate('我在机场等你。'))
  })

  it('el usuario elige la lectura de un carácter dudoso entre las posibles, y solo entre ellas', () => {
    const tokens = annotate('他长得很高。')

    expect(chooseReading(tokens, 1, 'zhǎng')[1]).toEqual({ text: '长', pinyin: 'zhǎng', tone: 3 })
    expect(chooseReading(tokens, 1, 'zhàng')).toEqual(tokens)
  })
})

describe('lecturas del dataset', () => {
  it('toma la palabra más larga del dataset y deja fuera los homógrafos', () => {
    expect(getDatasetReadings('学习中文')).toEqual(['xué', 'xí', 'zhōng', 'wén'])
    // 长 tiene dos lecturas como palabra (cháng, zhǎng): el dataset no decide
    expect(getDatasetReadings('长')).toEqual([undefined])
  })
})
