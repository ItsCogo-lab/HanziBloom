import { t } from '../../../i18n/index.ts'
import { getCharactersOfWord, type Dictionary } from '../../dictionary/dictionary.ts'
import { getStudyItemId, type StudyItem } from '../../dictionary/studyItem.ts'
import { HanziText } from '../../../components/ui/HanziText.tsx'

type LookUpButtonsProps = {
  item: StudyItem
  dictionary: Dictionary
  onLookUp: (item: StudyItem) => void
}

/**
 * Botones para abrir en el diccionario el elemento del ejercicio y, si es una
 * palabra, cada uno de sus caracteres (苹果 → 苹果, 苹, 果). Se muestran
 * después de responder, para que consultar no dé la respuesta.
 */
export function LookUpButtons({ item, dictionary, onLookUp }: LookUpButtonsProps) {
  const characters =
    item.kind === 'word' && Array.from(item.entry.hanzi).length > 1
      ? getCharactersOfWord(dictionary, item.entry).map((entry): StudyItem => ({ kind: 'character', entry }))
      : []
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-sm text-ink-muted">{t('practice.lookUp')}</span>
      {[item, ...characters].map((target) => (
        <button
          key={getStudyItemId(target)}
          type="button"
          onClick={() => onLookUp(target)}
          aria-label={t('practice.lookUpItem', { hanzi: target.entry.hanzi })}
          className="rounded-lg border border-line bg-paper px-3 py-1 hover:border-accent"
        >
          <HanziText className="text-lg">{target.entry.hanzi}</HanziText>
        </button>
      ))}
    </div>
  )
}
