import { describe, expect, it } from 'vitest'
import { annotateSentence } from './pinyinEngine.ts'
import { getDatasetReadings, processSentence } from './sentenceProcessing.ts'
import { chooseReading } from './sentences.ts'
import type { SentenceToken } from './types.ts'

const annotate = (chinese: string) => annotateSentence(chinese, getDatasetReadings)

/** "我:wǒ3" per character, "?" if uncertain; punctuation as is. */
function describeTokens(tokens: readonly SentenceToken[]): string[] {
  return tokens.map((token) =>
    token.uncertain ? `${token.text}?` : token.pinyin ? `${token.text}:${token.pinyin}${token.tone}` : token.text,
  )
}

describe('automatic pinyin for sentences', () => {
  it('generates toned pinyin for every character of a full sentence', () => {
    expect(describeTokens(annotate('我每天学习中文。'))).toEqual([
      '我:wǒ3', '每:měi3', '天:tiān1', '学:xué2', '习:xí2', '中:zhōng1', '文:wén2', '。',
    ])
  })

  it('applies the tone sandhi of 一 and 不, which is how it is pronounced', () => {
    expect(describeTokens(annotate('我每天吃一个苹果。'))).toContain('一:yí2')
    expect(describeTokens(annotate('我觉得不对。'))).toContain('不:bú2')
  })

  it('uses the dataset neutral tone where the engine gives a full tone', () => {
    expect(describeTokens(annotate('他没有朋友。'))).toEqual(['他:tā1', '没:méi2', '有:yǒu3', '朋:péng2', '友:you5', '。'])
    // Without the same syllable in neutral tone in the dataset, the engine wins
    expect(describeTokens(annotate('我有朋友。'))).toContain('有:yǒu3')
  })

  it('reads polyphonic characters according to the word', () => {
    expect(describeTokens(annotate('银行行长走了。'))).toEqual([
      '银:yín2', '行:háng2', '行:háng2', '长:zhǎng3', '走:zǒu3', '了:le5', '。',
    ])
    expect(describeTokens(annotate('他长大了。'))).toContain('长:zhǎng3')
  })

  it('marks what it cannot decide as uncertain, without tone and with the possible readings', () => {
    const tokens = annotate('他长得很高。')

    expect(tokens[1]).toEqual({ text: '长', pinyin: 'cháng', uncertain: true, candidates: ['cháng', 'zhǎng'] })
    expect(tokens[2]).toMatchObject({ text: '得', uncertain: true })
    expect(tokens[2]?.tone).toBeUndefined()
    expect(describeTokens(tokens)).toContain('很:hěn3')
  })

  it('keeps punctuation, spaces and non-Chinese text, without pinyin', () => {
    const tokens = annotate('你好, world! 再见。')

    expect(tokens.map((token) => token.text).join('')).toBe('你好, world! 再见。')
    expect(tokens.filter((token) => token.pinyin === undefined).map((token) => token.text)).toEqual([', world! ', '。'])
  })

  it('is deterministic: the same sentence always gives the same result', async () => {
    expect(await processSentence('我在机场等你。')).toEqual(annotate('我在机场等你。'))
  })

  it('the user picks the reading of an uncertain character among the possible ones, and only among them', () => {
    const tokens = annotate('他长得很高。')

    expect(chooseReading(tokens, 1, 'zhǎng')[1]).toEqual({ text: '长', pinyin: 'zhǎng', tone: 3 })
    expect(chooseReading(tokens, 1, 'zhàng')).toEqual(tokens)
  })
})

describe('dataset readings', () => {
  it('takes the longest dataset word and leaves out homographs', () => {
    expect(getDatasetReadings('学习中文')).toEqual(['xué', 'xí', 'zhōng', 'wén'])
    // 长 has two readings as a word (cháng, zhǎng): the dataset does not decide
    expect(getDatasetReadings('长')).toEqual([undefined])
  })
})
