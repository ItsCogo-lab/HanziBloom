import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import { isStudying } from '../../myStudies/myStudies.ts'
import { useMyStudies } from '../../myStudies/myStudiesContext.ts'
import type { StudySet } from '../types.ts'

/** Adds the set to My Studies or removes it. Its items' progress is not lost on removal. */
export function StudyToggleButton({ set, className = '' }: { set: StudySet; className?: string }) {
  const { myStudies, addSet, removeSet } = useMyStudies()
  const studying = isStudying(myStudies, set.id)
  return (
    <Button
      variant="secondary"
      className={className}
      aria-label={t(studying ? 'sets.removeNamed' : 'sets.addNamed', { name: set.name })}
      onClick={() => (studying ? removeSet(set.id) : addSet(set.id))}
    >
      {t(studying ? 'sets.remove' : 'sets.add')}
    </Button>
  )
}
