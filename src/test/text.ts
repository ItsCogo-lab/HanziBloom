import type { MatcherFunction } from '@testing-library/react'

/** A paragraph with exactly this text, even if it's split into spans (pinyin colored by tone). */
export const paragraphWithText =
  (text: string): MatcherFunction =>
  (_, element) =>
    element?.tagName === 'P' && element.textContent === text
