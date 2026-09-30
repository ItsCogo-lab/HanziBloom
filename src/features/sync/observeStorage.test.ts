import { describe, expect, it, vi } from 'vitest'
import { memoryStorage } from '../../test/memoryStorage.ts'
import { observeStorage } from './observeStorage.ts'

describe('observeStorage', () => {
  it('avisa solo cuando el valor guardado cambia', () => {
    const onChange = vi.fn()
    const storage = observeStorage(memoryStorage({ a: '1' }), onChange)

    storage.setItem('a', '1')
    expect(onChange).not.toHaveBeenCalled()

    storage.setItem('a', '2')
    storage.removeItem('a')
    storage.removeItem('a')
    expect(onChange.mock.calls).toEqual([['a'], ['a']])
    expect(storage.getItem('a')).toBeNull()
  })
})
