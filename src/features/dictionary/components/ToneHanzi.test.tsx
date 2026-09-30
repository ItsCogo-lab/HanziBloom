import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { hanzi } from '../../../test/hanzi.ts'
import { memoryStorage } from '../../../test/memoryStorage.ts'
import { renderWithProviders } from '../../../test/renderWithProviders.tsx'
import { DEFAULT_SETTINGS, saveSettings } from '../../settings/settings.ts'
import type { Character, Word } from '../types.ts'
import { PinyinText } from './PinyinText.tsx'
import { ToneHanzi } from './ToneHanzi.tsx'
import { ToneLegend } from './ToneLegend.tsx'

const nihao: Word = { id: '你好', hanzi: '你好', pinyin: 'nǐ hǎo', meanings: { en: ['hello'] }, hskLevel: 1 }
const xiexie: Word = { id: '谢谢', hanzi: '谢谢', pinyin: 'xiè xie', meanings: { en: ['thanks'] }, hskLevel: 1 }
const le: Character = { id: '了', hanzi: '了', pinyin: ['le', 'liǎo'], meanings: { en: ['x'] }, hskLevel: 1 }

function storageWith(changes: Partial<typeof DEFAULT_SETTINGS>) {
  const storage = memoryStorage()
  saveSettings({ ...DEFAULT_SETTINGS, ...changes }, storage)
  return storage
}

/** Color classes of each character in a rendered hanzi. */
function toneClassesOf(text: string): (string | null)[] {
  const element = screen.getByText(hanzi(text))
  return [...element.childNodes].map((node) => (node instanceof HTMLElement ? node.className : null))
}

describe('ToneHanzi', () => {
  it('colors each character with its tone\'s color', () => {
    renderWithProviders(<ToneHanzi entry={nihao} />)
    expect(toneClassesOf('你好')).toEqual(['text-tone-3', 'text-tone-3'])
  })

  it('uses the neutral tone gray', () => {
    renderWithProviders(<ToneHanzi entry={xiexie} />)
    expect(toneClassesOf('谢谢')).toEqual(['text-tone-4', 'text-tone-5'])
  })

  it('without a certain tone keeps the normal color (了: le, liǎo)', () => {
    renderWithProviders(<ToneHanzi entry={le} />)
    expect(toneClassesOf('了')).toEqual([null])
  })

  it('does not color if the setting is off', () => {
    renderWithProviders(<ToneHanzi entry={nihao} />, { storage: storageWith({ toneColors: false }) })
    expect(screen.getByText('你好')).toHaveAttribute('lang', 'zh-Hans')
    expect(toneClassesOf('你好')).toEqual([null])
  })

  it('does not color if the exercise asks so (showTones={false})', () => {
    renderWithProviders(<ToneHanzi entry={nihao} showTones={false} />)
    expect(toneClassesOf('你好')).toEqual([null])
  })
})

describe('PinyinText', () => {
  it('always shows the tone marks', () => {
    renderWithProviders(<PinyinText pinyin="nǐ hǎo" />)
    expect(screen.getByText('nǐ hǎo')).toBeInTheDocument()
    expect(screen.queryByText(/ni3/)).not.toBeInTheDocument()
  })

  it('adds tone numbers if the user asks for them', () => {
    renderWithProviders(<PinyinText pinyin="xiè xie" />, { storage: storageWith({ toneNumbers: true }) })
    expect(screen.getByText('(xie4 xie5)')).toBeInTheDocument()
  })
})

describe('ToneLegend', () => {
  it('names each tone with text and an example with its mark, not just color', () => {
    renderWithProviders(<ToneLegend />)
    expect(screen.getByRole('heading', { name: 'Tone colors' })).toBeInTheDocument()
    for (const [label, example] of [
      ['Tone 1', 'mā'],
      ['Tone 2', 'má'],
      ['Tone 3', 'mǎ'],
      ['Tone 4', 'mà'],
      ['Neutral', 'ma'],
    ] as const) {
      expect(screen.getByText(label)).toBeInTheDocument()
      expect(screen.getByText(example)).toBeInTheDocument()
    }
  })
})
