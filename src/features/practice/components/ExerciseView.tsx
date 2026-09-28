import type { Dictionary } from '../../dictionary/dictionary.ts'
import type { Exercise } from '../types.ts'
import { Flashcard } from './Flashcard.tsx'

type ExerciseViewProps = {
  exercise: Exercise
  dictionary: Dictionary
  onAnswer: (correct: boolean) => void
}

/**
 * Elige el componente que pinta cada tipo de ejercicio. Al añadir un tipo
 * nuevo, TypeScript obliga a añadir aquí su caso (el `switch` debe cubrir
 * todos los valores de `exercise.type`).
 */
export function ExerciseView({ exercise, dictionary, onAnswer }: ExerciseViewProps) {
  switch (exercise.type) {
    case 'flashcard':
      return <Flashcard exercise={exercise} dictionary={dictionary} onAnswer={onAnswer} />
    default: {
      // Si falta un caso, `exercise` no sería `never` y TypeScript daría error aquí
      const missingCase: never = exercise.type
      throw new Error(`Tipo de ejercicio sin componente: ${String(missingCase)}`)
    }
  }
}
