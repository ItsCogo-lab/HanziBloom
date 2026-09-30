import { describe, expect, it } from 'vitest'
import { memoryStorage } from '../../test/memoryStorage.ts'
import { addItem, createCustomSet, removeItem } from './customSets.ts'
import {
  addSentence,
  createSentence,
  deleteSentence,
  getItemSentences,
  splitSentence,
  updateSentence,
  validateSentence,
} from './sentences.ts'
import { loadCustomSets, saveCustomSets } from './storage.ts'

const now = new Date(2026, 8, 28, 12)
const travel = addItem(createCustomSet({ name: 'Travel', description: '' }, 'custom-a', now), 'word:机场')

function sentence(chinese: string, id = 'sentence-1') {
  return createSentence({ chinese, tokens: splitSentence(chinese), itemId: 'word:机场' }, id, now)
}

describe('custom sentences', () => {
  it('validates that there is Chinese text', () => {
    expect(validateSentence('  我在机场等你。 ')).toEqual({ chinese: '我在机场等你。' })
    expect(validateSentence('   ')).toEqual({ problem: 'emptySentence' })
    expect(validateSentence('hello!')).toEqual({ problem: 'noChinese' })
    expect(validateSentence('好'.repeat(121))).toEqual({ problem: 'sentenceTooLong' })
  })

  it('splits the sentence into Chinese characters and chunks of other text, without losing anything', () => {
    const tokens = splitSentence('你好, world! 我们。')

    expect(tokens.map((token) => token.text)).toEqual(['你', '好', ', world! ', '我', '们', '。'])
    expect(tokens.map((token) => token.text).join('')).toBe('你好, world! 我们。')
  })

  it('are added, edited and deleted within the set', () => {
    let set = addSentence(travel, sentence('我在机场等你。'))
    expect(getItemSentences(set, 'word:机场').map((s) => s.chinese)).toEqual(['我在机场等你。'])

    set = updateSentence(set, 'sentence-1', now, { chinese: '机场很大。', tokens: splitSentence('机场很大。') })
    expect(set.sentences[0]?.chinese).toBe('机场很大。')

    expect(deleteSentence(set, 'sentence-1').sentences).toEqual([])
  })

  it('does not allow two sentences with the same id or sentences for items not in the set', () => {
    const set = addSentence(travel, sentence('我在机场等你。'))
    expect(addSentence(set, sentence('机场很大。'))).toBe(set)

    const other = createSentence({ chinese: '我学习。', tokens: splitSentence('我学习。'), itemId: 'word:学习' }, 'sentence-2', now)
    expect(addSentence(set, other)).toBe(set)
  })

  it('removing the item from the set deletes its sentences', () => {
    const set = addSentence(travel, sentence('我在机场等你。'))
    expect(removeItem(set, 'word:机场').sentences).toEqual([])
  })

  it('are saved and loaded; a sentence with broken data is discarded', () => {
    const storage = memoryStorage()
    const set = addSentence(travel, sentence('我在机场等你。'))
    saveCustomSets([set], storage)
    expect(loadCustomSets(storage)).toEqual([set])

    const broken = { ...set, sentences: [{ ...set.sentences[0]!, tokens: [{ text: '别的' }] }] }
    saveCustomSets([broken], storage)
    expect(loadCustomSets(storage)[0]?.sentences).toEqual([])
  })
})
