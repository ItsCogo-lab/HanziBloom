import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { strokeFileName } from '../../../src/features/dictionary/strokes.ts'
import { countStrokes, readStrokeData } from './hanziWriter.ts'

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '../../../node_modules/hanzi-writer-data')

describe('adaptador de hanzi-writer-data', () => {
  it('lee los trazos de 柠 del paquete instalado', () => {
    expect(readStrokeData(packageDir, '柠')?.strokeCount).toBe(9)
  })

  it('devuelve undefined si no hay datos del carácter', () => {
    expect(readStrokeData(packageDir, 'A')).toBeUndefined()
  })

  it('cuenta los trazos o falla si el formato no es el esperado', () => {
    expect(countStrokes(JSON.stringify({ strokes: ['M 0 0', 'M 1 1'], medians: [] }))).toBe(2)
    expect(() => countStrokes('{}')).toThrow(/strokes/)
  })

  it('nombra los archivos por punto de código', () => {
    expect(strokeFileName('柠')).toBe('67e0.json')
  })
})
