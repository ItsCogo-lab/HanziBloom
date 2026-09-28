import { ComingSoon } from '../components/ComingSoon.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { t } from '../i18n/index.ts'

export function CharactersPage() {
  return (
    <>
      <PageHeader title={t('nav.characters')} description={t('characters.description')} />
      <ComingSoon />
    </>
  )
}
