import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import { isStudying } from '../../myStudies/myStudies.ts'
import { useMyStudies } from '../../myStudies/myStudiesContext.ts'
import type { StudySet } from '../types.ts'

/** Añade el set a My Studies o lo quita. El progreso de sus elementos no se pierde al quitarlo. */
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
