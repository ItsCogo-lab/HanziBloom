import type { KeyValueStorage } from '../../lib/storage.ts'

/**
 * Envuelve el almacenamiento para enterarse de cada cambio que hacen los
 * Providers. Solo avisa si el valor es distinto del que había: al arrancar,
 * cada Provider vuelve a guardar lo que acaba de cargar y eso no es un cambio.
 */
export function observeStorage(storage: KeyValueStorage, onChange: (key: string) => void): KeyValueStorage {
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => {
      const previous = storage.getItem(key)
      storage.setItem(key, value)
      if (previous !== value) onChange(key)
    },
    removeItem: (key) => {
      const previous = storage.getItem(key)
      storage.removeItem(key)
      if (previous !== null) onChange(key)
    },
  }
}
