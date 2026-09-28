import type { CustomSentence } from '../types.ts'

/** Una frase del usuario con su pinyin debajo, si lo tiene. */
export function SentenceView({ sentence }: { sentence: CustomSentence }) {
  const pinyin = sentence.tokens.flatMap((token) => (token.pinyin ? [token.pinyin] : [])).join(' ')
  return (
    <div>
      <p lang="zh-Hans" className="font-hanzi text-xl">
        {sentence.chinese}
      </p>
      {pinyin && <p className="text-accent-strong">{pinyin}</p>}
    </div>
  )
}
