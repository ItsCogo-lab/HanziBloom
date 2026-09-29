import { describe, expect, it } from 'vitest'
import { memoryStorage } from '../../test/memoryStorage.ts'
import { dismissInstallPrompt, getInstallMode, isInstallPromptDismissed, isIos } from './install.ts'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15'
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36'

describe('isIos', () => {
  it('reconoce el iPhone y el iPad, que se presenta como un Mac táctil', () => {
    expect(isIos({ userAgent: IPHONE, maxTouchPoints: 5 })).toBe(true)
    expect(isIos({ userAgent: IPAD, maxTouchPoints: 5 })).toBe(true)
  })

  it('no confunde un Mac ni un Android con iOS', () => {
    expect(isIos({ userAgent: IPAD, maxTouchPoints: 0 })).toBe(false)
    expect(isIos({ userAgent: ANDROID, maxTouchPoints: 5 })).toBe(false)
  })
})

describe('getInstallMode', () => {
  it('usa el diálogo del navegador cuando lo hay', () => {
    expect(getInstallMode({ standalone: false, ios: false, hasNativePrompt: true })).toBe('native')
  })

  it('explica los pasos de Safari en iOS', () => {
    expect(getInstallMode({ standalone: false, ios: true, hasNativePrompt: false })).toBe('ios')
  })

  it('no ofrece nada si ya está instalada o el navegador no sabe instalar', () => {
    expect(getInstallMode({ standalone: true, ios: true, hasNativePrompt: true })).toBeUndefined()
    expect(getInstallMode({ standalone: false, ios: false, hasNativePrompt: false })).toBeUndefined()
  })
})

describe('aviso cerrado', () => {
  it('se recuerda una vez cerrado', () => {
    const storage = memoryStorage()
    expect(isInstallPromptDismissed(storage)).toBe(false)
    dismissInstallPrompt(storage)
    expect(isInstallPromptDismissed(storage)).toBe(true)
  })
})
