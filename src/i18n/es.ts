/**
 * Textos de la interfaz en español.
 *
 * Es el idioma de referencia: las claves que existen aquí son las únicas
 * válidas. Cuando añadamos inglés o catalán, sus archivos tendrán que tener
 * exactamente las mismas claves (TypeScript lo comprobará).
 */
export const es = {
  'app.name': 'HanziVocab',
  'app.tagline': 'Aprende y practica caracteres y vocabulario chino.',
  'app.skipToContent': 'Saltar al contenido',
  'app.mainNavigation': 'Navegación principal',

  'nav.dashboard': 'Inicio',
  'nav.practice': 'Práctica',
  'nav.vocabulary': 'Vocabulario',
  'nav.characters': 'Caracteres',
  'nav.progress': 'Progreso',
  'nav.settings': 'Ajustes',

  'dashboard.description': 'Tu resumen de estudio de hoy.',
  'dashboard.startSession': 'Empezar sesión',

  'practice.description': 'Sesiones de estudio con ejercicios variados.',
  'vocabulary.description': 'Todas las palabras que puedes estudiar.',
  'characters.description': 'Consulta cualquier carácter: pinyin, significado y trazos.',
  'progress.description': 'Estadísticas de tu estudio.',
  'settings.description': 'Preferencias de estudio y datos guardados.',

  'common.comingSoon': 'Esta sección se construirá en una próxima fase del MVP.',

  'notFound.title': 'Página no encontrada',
  'notFound.description': 'La dirección que has abierto no existe.',
  'notFound.backHome': 'Volver al inicio',
} as const

export type MessageKey = keyof typeof es
