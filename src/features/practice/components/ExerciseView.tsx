import type { Dictionary } from '../../dictionary/dictionary.ts'
import type { StudyItem } from '../../dictionary/studyItem.ts'
import type { Exercise } from '../types.ts'
import { ChoiceQuestion } from './ChoiceQuestion.tsx'
import { Flashcard } from './Flashcard.tsx'

type ExerciseViewProps = {
  exercise: Exercise
  dictionary: Dictionary
  onAnswer: (correct: boolean) => void
  /** Abre un elemento en el diccionario sin salir de la sesión. */
  onLookUp: (item: StudyItem) => void
}

/**
 * Elige el componente que pinta cada tipo de ejercicio. Al añadir un tipo
 * nuevo, TypeScript obliga a añadir aquí su caso (el `switch` debe cubrir
 * todos los valores de `exercise.type`).
 */
export function ExerciseView({ exercise, dictionary, onAnswer, onLookUp }: ExerciseViewProps) {
  switch (exercise.type) {
    case 'flashcard':
      return <Flashcard exercise={exercise} dictionary={dictionary} onAnswer={onAnswer} onLookUp={onLookUp} />
    case 'meaning-choice':
    case 'pinyin-choice':
    case 'hanzi-choice':
      return <ChoiceQuestion exercise={exercise} dictionary={dictionary} onAnswer={onAnswer} onLookUp={onLookUp} />
    default: {
      // Si falta un caso, `exercise` no sería `never` y TypeScript daría error aquí
      const missingCase: never = exercise
      throw new Error(`Tipo de ejercicio sin componente: ${JSON.stringify(missingCase)}`)
    }
  }
}
