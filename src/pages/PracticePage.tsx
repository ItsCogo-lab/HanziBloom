import { useState } from 'react'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { hskDictionary } from '../features/dictionary/hskDictionary.ts'
import { listStudyItems } from '../features/dictionary/studyItem.ts'
import { PracticeSession } from '../features/practice/components/PracticeSession.tsx'
import { createSessionExercises } from '../features/practice/session.ts'
import { t } from '../i18n/index.ts'

const studyItems = listStudyItems(hskDictionary)

let nextSessionId = 0

function createSession() {
  nextSessionId += 1
  return { id: nextSessionId, exercises: createSessionExercises(studyItems) }
}

export function PracticePage() {
  // useState con función: la sesión se crea una vez al entrar, no en cada render
  const [session, setSession] = useState(createSession)

  return (
    <>
      <PageHeader title={t('nav.practice')} description={t('practice.description')} />
      {/* key: una sesión nueva monta un PracticeSession nuevo, con su estado desde cero */}
      <PracticeSession
        key={session.id}
        exercises={session.exercises}
        dictionary={hskDictionary}
        onRestart={() => setSession(createSession())}
      />
    </>
  )
}
