import { ComingSoon } from '../components/ComingSoon.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { t } from '../i18n/index.ts'

export function VocabularyPage() {
  return (
    <>
      <PageHeader title={t('nav.vocabulary')} description={t('vocabulary.description')} />
      <ComingSoon />
    </>
  )
}
