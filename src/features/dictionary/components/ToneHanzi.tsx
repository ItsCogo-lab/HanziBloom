import { HanziText } from '../../../components/ui/HanziText.tsx'
import { useSettings } from '../../settings/settingsContext.ts'
import { TONE_TEXT_CLASSES } from '../toneClasses.ts'
import { getCharacterTones } from '../tones.ts'
import type { Character, Word } from '../types.ts'

type ToneHanziProps = {
  entry: Character | Word
  className?: string
  /**
   * `false` to skip coloring even if the setting is on: in an exercise
   * that asks for the pronunciation, the color would give away the answer.
   */
  showTones?: boolean
}

/**
 * An entry's hanzi with each character colored by its tone
 * (getCharacterTones). Characters without a certain tone keep the normal
 * color. Color is a visual aid: the pinyin with marks is always alongside.
 */
export function ToneHanzi({ entry, className = '', showTones = true }: ToneHanziProps) {
  const { toneColors } = useSettings().settings
  if (!showTones || !toneColors) return <HanziText className={className}>{entry.hanzi}</HanziText>

  const tones = getCharacterTones(entry)
  return (
    <HanziText className={className} data-tones={tones.map((tone) => tone ?? '-').join('')}>
      {Array.from(entry.hanzi).map((character, index) => {
        const tone = tones[index]
        return tone === undefined ? (
          character
        ) : (
          <span key={index} className={TONE_TEXT_CLASSES[tone]}>
            {character}
          </span>
        )
      })}
    </HanziText>
  )
}
