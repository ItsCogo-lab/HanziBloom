import { useState } from 'react'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { hskDictionary } from '../features/dictionary/hskDictionary.ts'
import { listStudyItems } from '../features/dictionary/studyItem.ts'
import { PracticeSession } from '../features/practice/components/PracticeSession.tsx'
import { createSessionExercises } from '../features/practice/session.ts'
import { useProgress } from '../features/progress/progressContext.ts'
import type { ProgressData } from '../features/progress/types.ts'
import { t } from '../i18n/index.ts'

const studyItems = listStudyItems(hskDictionary)

let nextSessionId = 0

function createSession(progress: ProgressData) {
  nextSessionId += 1
  return { id: nextSessionId, exercises: createSessionExercises(studyItems, { progress }) }
}

export function PracticePage() {
  const { progress, recordAnswer } = useProgress()
  // useState con función: la sesión se crea una vez al entrar, no en cada render.
  // Usa el progreso de ese momento; las respuestas no cambian la sesión en curso.
  const [session, setSession] = useState(() => createSession(progress))

  return (
    <>
      <PageHeader title={t('nav.practice')} description={t('practice.description')} />
      {/* key: una sesión nueva monta un PracticeSession nuevo, con su estado desde cero */}
      <PracticeSession
        key={session.id}
        exercises={session.exercises}
        dictionary={hskDictionary}
        onResult={(result) => recordAnswer(result.itemId, result.correct)}
        onRestart={() => setSession(createSession(progress))}
      />
    </>
  )
}
