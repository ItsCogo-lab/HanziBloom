import { useId, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { t } from '../../../i18n/index.ts'
import { hskStudyItems } from '../../dictionary/hskDictionary.ts'
import { getStudyItemId } from '../../dictionary/studyItem.ts'
import type { HskLevel } from '../../dictionary/types.ts'
import { useSettings } from '../../settings/settingsContext.ts'
import { HSK_LEVELS } from '../../studySets/studySets.ts'
import type { LeveledItem } from '../progress.ts'
import { useProgress } from '../progressContext.ts'

/** Todos los caracteres y palabras de HSK con su nivel. */
const leveledItems: LeveledItem[] = hskStudyItems.flatMap((item) =>
  item.entry.hskLevel === undefined ? [] : [{ itemId: getStudyItemId(item), hskLevel: item.entry.hskLevel }],
)

/**
 * El usuario indica su nivel HSK y el progreso se ajusta (ver applyHskLevel).
 * Se aplica con un botón y no al elegir: marca cientos de elementos a la vez.
 */
export function HskLevelCard() {
  const { settings, updateSettings } = useSettings()
  const { applyHskLevel } = useProgress()
  const [selected, setSelected] = useState(settings.hskLevel)
  const [saved, setSaved] = useState(false)
  const selectId = useId()

  const save = () => {
    applyHskLevel(leveledItems, selected)
    updateSettings({ hskLevel: selected })
    setSaved(true)
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('profile.hskLevel')}</h2>
      <p className="text-sm text-ink-muted">{t('profile.hskLevelDescription')}</p>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={selectId}>{t('profile.hskLevelLabel')}</label>
        <select
          id={selectId}
          value={selected ?? ''}
          onChange={(event) => {
            setSelected(parseLevel(event.target.value))
            setSaved(false)
          }}
          className="rounded-lg border border-line bg-surface px-3 py-2"
        >
          <option value="">{t('profile.hskLevelNone')}</option>
          {HSK_LEVELS.map((level) => (
            <option key={level} value={level}>
              {t('profile.hskLevelOption', { level })}
            </option>
          ))}
        </select>
        <Button onClick={save} disabled={selected === settings.hskLevel}>
          {t('profile.hskLevelApply')}
        </Button>
      </div>
      {saved && (
        <p role="status" className="text-sm text-success">
          {settings.hskLevel === null
            ? t('profile.hskLevelCleared')
            : t('profile.hskLevelSaved', { level: settings.hskLevel })}
        </p>
      )}
    </Card>
  )
}

function parseLevel(value: string): HskLevel | null {
  return HSK_LEVELS.find((level) => String(level) === value) ?? null
}
