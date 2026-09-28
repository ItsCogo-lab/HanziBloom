import { HanziText } from '../../../components/ui/HanziText.tsx'
import { useSettings } from '../../settings/settingsContext.ts'
import { TONE_TEXT_CLASSES } from '../toneClasses.ts'
import { getCharacterTones } from '../tones.ts'
import type { Character, Word } from '../types.ts'

type ToneHanziProps = {
  entry: Character | Word
  className?: string
  /**
   * `false` para no colorear aunque el ajuste esté activado: en un ejercicio
   * que pregunta la pronunciación, el color daría la respuesta.
   */
  showTones?: boolean
}

/**
 * El hanzi de una entrada con cada carácter coloreado según su tono
 * (getCharacterTones). Los caracteres sin tono seguro quedan del color
 * normal. El color es un apoyo visual: el pinyin con marcas va siempre al lado.
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
