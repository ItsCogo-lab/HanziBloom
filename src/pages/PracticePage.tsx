import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '../components/ui/Button.tsx'
import { ButtonLink } from '../components/ui/ButtonLink.tsx'
import { Card } from '../components/ui/Card.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { hskDictionary, hskStudyItems } from '../features/dictionary/hskDictionary.ts'
import { getStudyItemId, type StudyItem } from '../features/dictionary/studyItem.ts'
import { useMyStudies } from '../features/myStudies/myStudiesContext.ts'
import { LearnSession } from '../features/practice/components/LearnSession.tsx'
import { PracticeSession } from '../features/practice/components/PracticeSession.tsx'
import { createSessionExercises } from '../features/practice/session.ts'
import { useProgress } from '../features/progress/progressContext.ts'
import type { ProgressData } from '../features/progress/types.ts'
import { useSettings } from '../features/settings/settingsContext.ts'
import { useStudySets } from '../features/studySets/useStudySets.ts'
import { SessionTypeLabel } from '../features/studySets/components/SessionTypeLabel.tsx'
import { getLearnableItems, getReviewItems } from '../features/studySets/sessionItems.ts'
import { getSetPath, getSetSessionPath } from '../features/studySets/setPaths.ts'
import { getStudySet } from '../features/studySets/studySets.ts'
import type { StudySet } from '../features/studySets/types.ts'
import { t } from '../i18n/index.ts'
import { NotFoundPage } from './NotFoundPage.tsx'

let nextSessionId = 0

function createPracticeSession(pool: readonly StudyItem[], progress: ProgressData, size: number) {
  nextSessionId += 1
  // Las respuestas incorrectas salen de todo el diccionario, aunque el set sea pequeño
  const exercises = createSessionExercises(pool, { progress, size, distractorPool: hskStudyItems })
  return { id: nextSessionId, exercises }
}

/**
 * Sesiones de estudio. Con un set, la URL fija el contexto de la sesión:
 * /study/practice?set=hsk-1&mode=learn (vocabulario nuevo) o &mode=study
 * (repaso de lo aprendido; &scope=all incluye lo que aún no toca). Sin set,
 * la sesión mezclada de todo el vocabulario. La `key` hace que cambiar de
 * set o de tipo cree una sesión nueva.
 */
export function PracticePage() {
  const [searchParams] = useSearchParams()
  const studySets = useStudySets()
  const setId = searchParams.get('set')
  if (setId === null) return <Practice />

  const set = getStudySet(studySets, setId)
  const mode = searchParams.get('mode') ?? 'study'
  if (!set || (mode !== 'learn' && mode !== 'study')) return <NotFoundPage />
  const reviewAll = searchParams.get('scope') === 'all'
  return (
    <>
      <PageHeader title={set.name} />
      <div className="mb-6">
        <SessionTypeLabel type={mode} />
      </div>
      {mode === 'learn' ? (
        <LearnPractice key={`${set.id}:learn`} set={set} />
      ) : (
        <StudyPractice key={`${set.id}:study:${reviewAll}`} set={set} reviewAll={reviewAll} />
      )}
    </>
  )
}

/** Sesión mezclada de todo el vocabulario (repasos pendientes y nuevos). */
function Practice() {
  const { progress, recordAnswer } = useProgress()
  const { sessionSize } = useSettings().settings
  // useState con función: la sesión se crea una vez al entrar, no en cada render.
  // Usa el progreso de ese momento; las respuestas no cambian la sesión en curso.
  const [session, setSession] = useState(() => createPracticeSession(hskStudyItems, progress, sessionSize))

  return (
    <>
      <PageHeader title={t('practice.title')} description={t('practice.description')} />
      {/* key: una sesión nueva monta un PracticeSession nuevo, con su estado desde cero */}
      <PracticeSession
        key={session.id}
        exercises={session.exercises}
        dictionary={hskDictionary}
        dictionaryItems={hskStudyItems}
        onResult={(result) => recordAnswer(result.itemId, result.correct)}
        onRestart={() => setSession(createPracticeSession(hskStudyItems, progress, sessionSize))}
      />
    </>
  )
}

/** Marca el set como estudiado hoy con la primera acción de cada sesión. */
function useMarkSetStudied(set: StudySet) {
  const { markSetStudied } = useMyStudies()
  const [markedSession, setMarkedSession] = useState<number>()
  return (sessionId: number) => {
    if (markedSession === sessionId) return
    markSetStudied(set.id)
    setMarkedSession(sessionId)
  }
}

/**
 * Study: repaso. Solo entran elementos ya aprendidos del set, primero los que
 * toca repasar. Si no toca ninguno, se ofrece repasar igualmente (scope=all),
 * pero nunca se cuela un elemento sin aprender.
 */
function StudyPractice({ set, reviewAll }: { set: StudySet; reviewAll: boolean }) {
  const { progress, recordAnswer } = useProgress()
  const { sessionSize } = useSettings().settings
  const markStudied = useMarkSetStudied(set)

  const createSession = (current: ProgressData) => {
    const { due, upToDate } = getReviewItems(set, hskDictionary, current, new Date())
    const pool = reviewAll ? [...due, ...upToDate] : due
    return { ...createPracticeSession(pool, current, sessionSize), learnedCount: due.length + upToDate.length }
  }
  const [session, setSession] = useState(() => createSession(progress))

  if (session.exercises.length === 0) {
    return session.learnedCount === 0 ? (
      <EmptySession set={set} message={t('session.studyEmpty')}>
        <ButtonLink to={getSetSessionPath(set, 'learn')}>{t('session.startLearning')}</ButtonLink>
      </EmptySession>
    ) : (
      <EmptySession set={set} message={t('session.studyUpToDate')}>
        <ButtonLink to={getSetSessionPath(set, 'study', { reviewAll: true })}>{t('session.reviewAnyway')}</ButtonLink>
      </EmptySession>
    )
  }

  return (
    <>
      {reviewAll && <p className="mb-4 text-sm text-ink-muted">{t('session.reviewingAll')}</p>}
      <PracticeSession
        key={session.id}
        exercises={session.exercises}
        dictionary={hskDictionary}
        dictionaryItems={hskStudyItems}
        onResult={(result) => {
          recordAnswer(result.itemId, result.correct)
          markStudied(session.id)
        }}
        onRestart={() => setSession(createSession(progress))}
      />
    </>
  )
}

/** Learn: presenta elementos del set que aún no se han aprendido. */
function LearnPractice({ set }: { set: StudySet }) {
  const { progress, introduceItem } = useProgress()
  const { sessionSize } = useSettings().settings
  const markStudied = useMarkSetStudied(set)

  const createSession = (current: ProgressData) => {
    nextSessionId += 1
    return { id: nextSessionId, items: getLearnableItems(set, hskDictionary, current).slice(0, sessionSize) }
  }
  const [session, setSession] = useState(() => createSession(progress))

  if (session.items.length === 0) {
    return (
      <EmptySession set={set} message={t('session.learnEmpty')}>
        <ButtonLink to={getSetSessionPath(set, 'study')}>{t('session.study')}</ButtonLink>
      </EmptySession>
    )
  }

  return (
    <LearnSession
      key={session.id}
      items={session.items}
      dictionary={hskDictionary}
      dictionaryItems={hskStudyItems}
      onLearned={(item) => {
        introduceItem(getStudyItemId(item))
        markStudied(session.id)
      }}
      summaryActions={
        <>
          <ButtonLink to={getSetSessionPath(set, 'study')} variant="secondary">
            {t('learn.reviewNow')}
          </ButtonLink>
          <Button onClick={() => setSession(createSession(progress))}>{t('learn.more')}</Button>
        </>
      }
    />
  )
}

/** Sesión sin elementos: explica por qué y ofrece la acción que tiene sentido. Nunca cambia de tipo sola. */
function EmptySession({ set, message, children }: { set: StudySet; message: string; children: ReactNode }) {
  return (
    <Card className="mx-auto flex max-w-xl flex-col items-start gap-4">
      <p className="text-lg">{message}</p>
      <div className="flex flex-wrap gap-2">
        {children}
        <ButtonLink to={getSetPath(set)} variant="secondary">
          {t('session.backToSet', { name: set.name })}
        </ButtonLink>
      </div>
    </Card>
  )
}
