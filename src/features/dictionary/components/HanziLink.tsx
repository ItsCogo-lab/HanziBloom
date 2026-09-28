import { Link } from 'react-router'
import { HanziText } from '../../../components/ui/HanziText.tsx'
import { formatPinyin, getCharacter, type Dictionary } from '../dictionary.ts'
import type { StudyItem } from '../studyItem.ts'

type HanziLinkProps = {
  hanzi: string
  dictionary: Dictionary
  getHref: (item: StudyItem) => string
}

/**
 * Un carácter que se menciona en otra ficha (radical, componente...). Si está
 * en el diccionario, enlaza a su ficha y muestra su pinyin; si no, solo el hanzi.
 */
export function HanziLink({ hanzi, dictionary, getHref }: HanziLinkProps) {
  const character = getCharacter(dictionary, hanzi)
  if (!character) return <HanziText className="text-xl">{hanzi}</HanziText>
  return (
    <Link
      to={getHref({ kind: 'character', entry: character })}
      className="inline-flex items-baseline gap-1.5 hover:text-accent-strong">
      <HanziText className="text-xl">{hanzi}</HanziText>
      <span className="text-sm text-accent-strong">{formatPinyin(character)}</span>
    </Link>
  )
}
