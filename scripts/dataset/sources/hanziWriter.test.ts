import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { strokeFileName } from '../../../src/features/dictionary/strokes.ts'
import { countStrokes, readStrokeData } from './hanziWriter.ts'

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '../../../node_modules/hanzi-writer-data')

describe('hanzi-writer-data adapter', () => {
  it('reads the strokes of 柠 from the installed package', () => {
    expect(readStrokeData(packageDir, '柠')?.strokeCount).toBe(9)
  })

  it('returns undefined if there is no data for the character', () => {
    expect(readStrokeData(packageDir, 'A')).toBeUndefined()
  })

  it('counts the strokes or fails if the format is not the expected one', () => {
    expect(countStrokes(JSON.stringify({ strokes: ['M 0 0', 'M 1 1'], medians: [] }))).toBe(2)
    expect(() => countStrokes('{}')).toThrow(/strokes/)
  })

  it('names the files by code point', () => {
    expect(strokeFileName('柠')).toBe('67e0.json')
  })
})
