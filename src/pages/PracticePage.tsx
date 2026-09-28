import { useState } from 'react'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { hskDictionary, hskStudyItems } from '../features/dictionary/hskDictionary.ts'
import { PracticeSession } from '../features/practice/components/PracticeSession.tsx'
import { createSessionExercises } from '../features/practice/session.ts'
import { useProgress } from '../features/progress/progressContext.ts'
import type { ProgressData } from '../features/progress/types.ts'
import { useSettings } from '../features/settings/settingsContext.ts'
import { t } from '../i18n/index.ts'

let nextSessionId = 0

function createSession(progress: ProgressData, size: number) {
  nextSessionId += 1
  return { id: nextSessionId, exercises: createSessionExercises(hskStudyItems, { progress, size }) }
}

export function PracticePage() {
  const { progress, recordAnswer } = useProgress()
  const { sessionSize } = useSettings().settings
  // useState con función: la sesión se crea una vez al entrar, no en cada render.
  // Usa el progreso de ese momento; las respuestas no cambian la sesión en curso.
  const [session, setSession] = useState(() => createSession(progress, sessionSize))

  return (
    <>
      <PageHeader title={t('nav.practice')} description={t('practice.description')} />
      {/* key: una sesión nueva monta un PracticeSession nuevo, con su estado desde cero */}
      <PracticeSession
        key={session.id}
        exercises={session.exercises}
        dictionary={hskDictionary}
        onResult={(result) => recordAnswer(result.itemId, result.correct)}
        onRestart={() => setSession(createSession(progress, sessionSize))}
      />
    </>
  )
}
