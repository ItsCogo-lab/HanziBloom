import type { ReactNode } from 'react'
import { HanziText } from '../../../components/ui/HanziText.tsx'
import { t } from '../../../i18n/index.ts'
import { getTraditionalForms, type Dictionary } from '../dictionary.ts'
import { getComponents } from '../ids.ts'
import type { Character } from '../types.ts'
import type { EntryOpener } from './EntryLink.tsx'
import { HanziLink } from './HanziLink.tsx'

type CharacterFactsProps = {
  character: Character
  dictionary: Dictionary
  opener: EntryOpener
}

/**
 * Datos del carácter (tradicional, radical, trazos, componentes, nivel) y su
 * etimología. Cada fila aparece solo si el dataset tiene ese dato.
 */
export function CharacterFacts({ character, dictionary, opener }: CharacterFactsProps) {
  const link = (hanzi: string) => (
    <HanziLink hanzi={hanzi} dictionary={dictionary} opener={opener} />
  )
  const traditional = getTraditionalForms(character)
  const components = character.decomposition ? getComponents(character.decomposition) : []
  const { etymology } = character

  return (
    <>
      <section>
        <h2 className="mb-2 text-lg font-semibold">{t('dictionary.characterInfo')}</h2>
        <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-2">
          {traditional.length > 0 && (
            <Fact label={t('dictionary.traditional')}>
              <HanziText lang="zh-Hant" className="text-xl">
                {traditional.join(' ')}
              </HanziText>
            </Fact>
          )}
          {character.radical && (
            <Fact label={t('dictionary.radical')}>
              <span className="inline-flex flex-wrap items-baseline gap-x-2">
                {link(character.radical)}
                {character.radicalNumber !== undefined && (
                  <span className="text-sm text-ink-muted">
                    {t('dictionary.radicalNumber', { number: character.radicalNumber })}
                  </span>
                )}
              </span>
            </Fact>
          )}
          {character.strokeCount !== undefined && (
            <Fact label={t('dictionary.strokeCount')}>
              <span className="tabular-nums">{character.strokeCount}</span>
            </Fact>
          )}
          {components.length > 0 && (
            <Fact label={t('dictionary.components')}>
              <span className="inline-flex flex-wrap items-baseline gap-x-2">
                {components.map((component, index) => (
                  <span key={component} className="inline-flex items-baseline gap-x-2">
                    {index > 0 && <span className="text-ink-muted">+</span>}
                    {link(component)}
                  </span>
                ))}
              </span>
            </Fact>
          )}
          {character.hskLevel !== undefined && (
            <Fact label={t('dictionary.hskLevel')}>{t('dictionary.hskLevelValue', { level: character.hskLevel })}</Fact>
          )}
        </dl>
      </section>

      {etymology && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">{t('dictionary.etymology')}</h2>
          <p className="font-medium">{t(`dictionary.etymology.${etymology.type}`)}</p>
          {etymology.type === 'pictophonetic' ? (
            <dl className="mt-2 grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-2">
              {etymology.semantic && (
                <Fact label={t('dictionary.semantic')}>
                  <span className="inline-flex flex-wrap items-baseline gap-x-2">
                    {link(etymology.semantic)}
                    {etymology.hint && <span className="text-ink-muted">{etymology.hint}</span>}
                  </span>
                </Fact>
              )}
              {etymology.phonetic && <Fact label={t('dictionary.phonetic')}>{link(etymology.phonetic)}</Fact>}
            </dl>
          ) : (
            etymology.hint && <p className="mt-1 text-ink-muted">{etymology.hint}</p>
          )}
        </section>
      )}
    </>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-ink-muted">{label}</dt>
      <dd>{children}</dd>
    </>
  )
}
