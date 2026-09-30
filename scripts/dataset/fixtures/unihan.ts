/*
 * Real Unicode data for the tests, in the format of the Unihan.zip and
 * CJKRadicals.txt files (Unicode License v3). The values for 柠
 * (U+67E0) were checked in the official Unihan lookup on unicode.org, and
 * the radical lines in Unicode 18.0's CJKRadicals.txt.
 */
export const unihanIrgSourcesFixture = ['U+67E0\tkRSUnicode\t75.5', 'U+67E0\tkTotalStrokes\t9'].join('\n')

export const unihanVariantsFixture = 'U+67E0\tkTraditionalVariant\tU+6AB8'

export const cjkRadicalsFixture = [
  '# CJKRadicals.txt',
  "# Field 0: radical number (with ' for simplified forms)",
  '1; 2F00; 4E00',
  '75; 2F4A; 6728',
  "120'; 2EB0; 7E9F",
  "149'; 2EC8; 8BA0",
].join('\n')
