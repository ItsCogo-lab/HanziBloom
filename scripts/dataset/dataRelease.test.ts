import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CHUNK_COUNT } from '../../src/features/dictionary/fullDictionary.ts'
import { SOURCE_VERSIONS, writeDataRelease } from './dataRelease.ts'

function chunksDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'chunks-'))
  for (let index = 0; index < CHUNK_COUNT; index++) {
    writeFileSync(join(dir, `${index}.json`), `{"characters":[],"words":[]}\n`)
  }
  return dir
}

describe('writeDataRelease', () => {
  it('writes the chunks, the manifest and the README', () => {
    const target = mkdtempSync(join(tmpdir(), 'data-'))
    writeDataRelease({
      sourceDir: chunksDir(),
      targetDir: target,
      version: '1.0.0',
      generatedAt: '2026-09-29T00:00:00Z',
    })
    const manifest = JSON.parse(readFileSync(join(target, 'v1/manifest.json'), 'utf8'))
    expect(manifest).toMatchObject({ format: 1, version: '1.0.0', chunkCount: CHUNK_COUNT, sources: SOURCE_VERSIONS })
    expect(readFileSync(join(target, 'v1/1.0.0/dictionary/31.json'), 'utf8')).toContain('"words"')
    expect(readFileSync(join(target, 'README.md'), 'utf8')).toContain('CC BY-SA 4.0')
  })

  it('keeps the two previous versions and deletes the rest', () => {
    const target = mkdtempSync(join(tmpdir(), 'data-'))
    const source = chunksDir()
    for (const version of ['1.0.0', '1.1.0', '1.2.0', '1.10.0']) {
      writeDataRelease({ sourceDir: source, targetDir: target, version, generatedAt: 'x' })
    }
    expect(readdirSync(join(target, 'v1')).sort()).toEqual(['1.1.0', '1.10.0', '1.2.0', 'manifest.json'])
  })

  it('does not publish a version that is not greater than the current one, nor without all the chunks', () => {
    const target = mkdtempSync(join(tmpdir(), 'data-'))
    const source = chunksDir()
    writeDataRelease({ sourceDir: source, targetDir: target, version: '1.2.0', generatedAt: 'x' })
    expect(() =>
      writeDataRelease({ sourceDir: source, targetDir: target, version: '1.1.9', generatedAt: 'x' }),
    ).toThrow()
    expect(() =>
      writeDataRelease({ sourceDir: source, targetDir: target, version: '2.0.0', generatedAt: 'x' }),
    ).toThrow()
    const empty = mkdtempSync(join(tmpdir(), 'empty-'))
    mkdirSync(join(empty, 'x'))
    expect(() =>
      writeDataRelease({ sourceDir: empty, targetDir: target, version: '1.3.0', generatedAt: 'x' }),
    ).toThrow()
  })

  it('records the same source versions that fetch-sources.sh downloads', () => {
    const script = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fetch-sources.sh'), 'utf8')
    expect(script).toContain('cedict-json@1.3.20251213')
    expect(script).toContain('UNICODE_VERSION=18.0.0')
    expect(script).toContain('MAKEMEAHANZI_COMMIT=bddc96d41bef78427ed0e034e9f7e31d71fd1b92')
    const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8'))
    expect(pkg.devDependencies['hanzi-writer-data']).toBe('2.0.1')
  })
})
