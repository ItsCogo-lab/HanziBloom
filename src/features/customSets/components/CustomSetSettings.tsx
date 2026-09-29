import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { t } from '../../../i18n/index.ts'
import { useMyStudies } from '../../myStudies/myStudiesContext.ts'
import type { StudySet } from '../../studySets/types.ts'
import { useCustomSets } from '../customSetsContext.ts'
import { CustomSetDetailsForm } from './CustomSetDetailsForm.tsx'

/** Editar el nombre y la descripción de un set propio, o borrarlo. */
export function CustomSetSettings({ set }: { set: StudySet }) {
  const { updateDetails, deleteSet } = useCustomSets()
  const { removeSet } = useMyStudies()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'idle' | 'editing' | 'confirmingDelete'>('idle')
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (mode === 'confirmingDelete') cancelRef.current?.focus()
  }, [mode])

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t('custom.settings')}</h2>
      {mode === 'editing' ? (
        <CustomSetDetailsForm
          initial={set}
          submitLabel={t('custom.save')}
          onSubmit={(details) => {
            updateDetails(set.id, details)
            setMode('idle')
          }}
          onCancel={() => setMode('idle')}
        />
      ) : mode === 'confirmingDelete' ? (
        <div className="flex flex-col gap-3 rounded-xl border border-danger/40 bg-danger/5 p-4">
          <p>{t('custom.deleteConfirm', { name: set.name })}</p>
          <div className="flex flex-wrap gap-3">
            {/* El foco va a «Cancel»: pulsar Enter sin mirar no debe borrar nada */}
            <Button ref={cancelRef} variant="secondary" onClick={() => setMode('idle')}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                // El progreso de sus elementos no se toca: es el mismo que en los demás sets
                removeSet(set.id)
                deleteSet(set.id)
                navigate('/study/custom')
              }}
            >
              {t('custom.deleteConfirmButton')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setMode('editing')}>
            {t('custom.edit')}
          </Button>
          <Button variant="secondary" onClick={() => setMode('confirmingDelete')}>
            {t('custom.delete')}
          </Button>
        </div>
      )}
    </Card>
  )
}
