import { ComingSoon } from '../components/ComingSoon.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { t } from '../i18n/index.ts'

export function PracticePage() {
  return (
    <>
      <PageHeader title={t('nav.practice')} description={t('practice.description')} />
      <ComingSoon />
    </>
  )
}
