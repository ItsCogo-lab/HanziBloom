import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { hskDictionary, hskStudyItems } from '../features/dictionary/hskDictionary.ts'
import type { StudyItem } from '../features/dictionary/studyItem.ts'
import { useMyStudies } from '../features/myStudies/myStudiesContext.ts'
import { PracticeSession } from '../features/practice/components/PracticeSession.tsx'
import { createSessionExercises } from '../features/practice/session.ts'
import { useProgress } from '../features/progress/progressContext.ts'
import type { ProgressData } from '../features/progress/types.ts'
import { useSettings } from '../features/settings/settingsContext.ts'
import { appStudySets } from '../features/studySets/appStudySets.ts'
import { getSetItems, getStudySet } from '../features/studySets/studySets.ts'
import type { StudySet } from '../features/studySets/types.ts'
import { t } from '../i18n/index.ts'
import { NotFoundPage } from './NotFoundPage.tsx'

let nextSessionId = 0

function createSession(pool: readonly StudyItem[], progress: ProgressData, size: number) {
  nextSessionId += 1
  // Los elementos salen del set; las respuestas incorrectas, de todo el diccionario
  const exercises = createSessionExercises(pool, { progress, size, distractorPool: hskStudyItems })
  return { id: nextSessionId, exercises }
}

/**
 * Sesión de estudio: de un set (/study/practice?set=hsk-1) o, sin set, de
 * todo el vocabulario. La `key` hace que cambiar de set cree una sesión nueva.
 */
export function PracticePage() {
  const [searchParams] = useSearchParams()
  const setId = searchParams.get('set')
  const set = setId === null ? undefined : getStudySet(appStudySets, setId)
  if (setId !== null && !set) return <NotFoundPage />
  return <Practice key={setId ?? ''} set={set} />
}

function Practice({ set }: { set: StudySet | undefined }) {
  const { progress, recordAnswer } = useProgress()
  const { markSetStudied } = useMyStudies()
  const { sessionSize } = useSettings().settings
  const pool = set ? getSetItems(set, hskDictionary) : hskStudyItems
  // useState con función: la sesión se crea una vez al entrar, no en cada render.
  // Usa el progreso de ese momento; las respuestas no cambian la sesión en curso.
  const [session, setSession] = useState(() => createSession(pool, progress, sessionSize))
  const [markedSession, setMarkedSession] = useState<number>()

  return (
    <>
      <PageHeader
        title={set ? set.name : t('practice.title')}
        description={set ? t('practice.setDescription') : t('practice.description')}
      />
      {/* key: una sesión nueva monta un PracticeSession nuevo, con su estado desde cero */}
      <PracticeSession
        key={session.id}
        exercises={session.exercises}
        dictionary={hskDictionary}
        dictionaryItems={hskStudyItems}
        onResult={(result) => {
          recordAnswer(result.itemId, result.correct)
          // La primera respuesta de cada sesión cuenta como «estudiado hoy» para el set
          if (set && markedSession !== session.id) {
            markSetStudied(set.id)
            setMarkedSession(session.id)
          }
        }}
        onRestart={() => setSession(createSession(pool, progress, sessionSize))}
      />
    </>
  )
}
