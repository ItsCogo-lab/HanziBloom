import { ComingSoon } from '../components/ComingSoon.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { t } from '../i18n/index.ts'

export function ProgressPage() {
  return (
    <>
      <PageHeader title={t('nav.progress')} description={t('progress.description')} />
      <ComingSoon />
    </>
  )
}
