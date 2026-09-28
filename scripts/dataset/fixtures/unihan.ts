/*
 * Datos reales de Unicode para los tests, en el formato de los archivos de
 * Unihan.zip y de CJKRadicals.txt (Unicode License v3). Los valores de 柠
 * (U+67E0) se comprobaron en la consulta oficial de Unihan de unicode.org, y
 * las líneas de radicales, en CJKRadicals.txt de Unicode 18.0.
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
