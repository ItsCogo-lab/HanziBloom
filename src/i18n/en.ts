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

  'practice.description': 'Study sessions with varied exercises.',
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
