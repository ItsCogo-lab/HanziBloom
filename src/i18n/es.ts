import type { MessageKey } from './en.ts'

/**
 * Textos de la interfaz en español. De momento la app está en inglés;
 * se mantienen para poder activar el español más adelante.
 * El tipo obliga a tener exactamente las mismas claves que en.ts.
 */
export const es: Record<MessageKey, string> = {
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
}
