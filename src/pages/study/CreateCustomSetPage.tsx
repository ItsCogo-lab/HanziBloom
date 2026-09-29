import { useNavigate } from 'react-router'
import { Card } from '../../components/ui/Card.tsx'
import { PageHeader } from '../../components/ui/PageHeader.tsx'
import { CustomSetDetailsForm } from '../../features/customSets/components/CustomSetDetailsForm.tsx'
import { useCustomSets } from '../../features/customSets/customSetsContext.ts'
import { t } from '../../i18n/index.ts'

/** Crear un set: nombre y descripción; después se va a su página para añadir vocabulario. */
export function CreateCustomSetPage() {
  const { createSet } = useCustomSets()
  const navigate = useNavigate()
  return (
    <>
      <PageHeader title={t('custom.createTitle')} description={t('custom.createIntro')} />
      <Card className="max-w-xl">
        <CustomSetDetailsForm
          submitLabel={t('custom.createButton')}
          onSubmit={(details) => navigate(`/study/sets/${encodeURIComponent(createSet(details))}`)}
          onCancel={() => navigate('/study/custom')}
        />
      </Card>
    </>
  )
}
