import { describe, expect, it } from 'vitest'
import { getComponents, isValidIds } from './ids.ts'

describe('secuencias IDS', () => {
  it.each(['⿰木宁', '⿰亻⿱夂彡', '⿲彳⿱山一攵', '木'])('acepta %s', (ids) => {
    expect(isValidIds(ids)).toBe(true)
  })

  it.each(['', '⿰木', '⿰木宁子', '⿱⿰木'])('rechaza "%s"', (ids) => {
    expect(isValidIds(ids)).toBe(false)
  })

  it('saca los componentes en orden, sin operadores ni desconocidos', () => {
    expect(getComponents('⿰木宁')).toEqual(['木', '宁'])
    expect(getComponents('⿰亻⿱夂彡')).toEqual(['亻', '夂', '彡'])
    expect(getComponents('⿱逢？')).toEqual(['逢'])
  })
})
