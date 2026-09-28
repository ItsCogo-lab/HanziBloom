/**
 * Textos de la interfaz en inglés.
 *
 * Es el idioma de referencia: las claves que existen aquí son las únicas
 * válidas. Los demás idiomas (es.ts) deben tener exactamente las mismas
 * claves, y TypeScript lo comprueba.
 */
export const en = {
  'app.name': 'HanziVocab',
  'app.tagline': 'Learn and practice Chinese characters and vocabulary.',
  'app.skipToContent': 'Skip to content',
  'app.mainNavigation': 'Main navigation',

  'nav.dashboard': 'Home',
  'nav.practice': 'Practice',
  'nav.vocabulary': 'Vocabulary',
  'nav.characters': 'Characters',
  'nav.progress': 'Progress',
  'nav.settings': 'Settings',

  'dashboard.description': 'Your study overview for today.',
  'dashboard.startSession': 'Start session',
  'dashboard.today': 'Today',
  'dashboard.message.welcome': 'Welcome! Start your first session to learn HSK 1 characters and words.',
  'dashboard.message.due': 'Some items are ready for review. Your next session starts with them.',
  'dashboard.message.learnNew': 'No reviews due right now. Your next session will teach you new items.',
  'dashboard.message.allDone': "You're all caught up. Come back tomorrow for your next reviews.",
  'dashboard.overview': 'Overview',
  'dashboard.hskProgress': 'HSK 1 progress',
  'dashboard.characters': 'Characters',
  'dashboard.words': 'Words',
  'dashboard.kindProgress': '{studied} of {total} studied · {mastered} mastered',
  'stats.due': 'Due for review',
  'stats.streak': 'Day streak',
  'stats.studied': 'Studied',
  'stats.studiedOf': 'of {total}',
  'stats.mastered': 'Mastered',

  'practice.description': 'Study sessions with varied exercises.',

  'practice.kind.character': 'Character',
  'practice.kind.word': 'Word',
  'practice.showAnswer': 'Show answer',
  'practice.answer': 'Answer',
  'practice.knewIt': 'I knew it',
  'practice.didNotKnow': "I didn't know",
  'practice.progress': 'Card {current} of {total}',
  'practice.charactersInWord': 'Characters',
  'practice.wordsWithCharacter': 'Appears in',
  'practice.summary.title': 'Session complete',
  'practice.summary.score': 'You knew {correct} of {total}.',
  'practice.summary.toReview': 'To review',
  'practice.summary.allKnown': 'You knew all of them. Great job!',
  'practice.again': 'Practice again',
  'practice.continue': 'Continue',
  'practice.choice.meaningQuestion': 'What does it mean?',
  'practice.choice.pinyinQuestion': 'How is it pronounced?',
  'practice.choice.hanziQuestion': 'Which one has this meaning?',
  'practice.choice.options': 'Options',
  'practice.choice.correct': 'Correct!',
  'practice.choice.incorrect': 'Not quite',
  'practice.choice.correctOption': 'correct answer',
  'practice.choice.yourOption': 'your answer',
  'vocabulary.description': 'All the words you can study.',
  'characters.description': 'Look up any character: pinyin, meaning and strokes.',
  'progress.description': 'Statistics about your studying.',
  'settings.description': 'Study preferences and saved data.',

  'common.comingSoon': 'This section will be built in an upcoming phase of the MVP.',

  'notFound.title': 'Page not found',
  'notFound.description': 'The address you opened does not exist.',
  'notFound.backHome': 'Back to home',
} as const

export type MessageKey = keyof typeof en
