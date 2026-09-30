/**
 * Tatoeba API v1 responses for tests, copied from a real query
 * (q=柠, sort=words) made from GitHub Actions on 2026-09-29 and trimmed
 * to the fields the adapter uses.
 */

const translation = (id: number, text: string, owner: string | null, isDirect = true) => ({
  id,
  text,
  lang: 'eng',
  script: null,
  license: 'CC BY 2.0 FR',
  owner,
  is_unapproved: false,
  is_direct: isDirect,
})

const sentence = (id: number, text: string, owner: string | null, translations: unknown[], script = 'Hans') => ({
  id,
  text,
  lang: 'cmn',
  script,
  license: 'CC BY 2.0 FR',
  owner,
  is_unapproved: false,
  translations,
})

export const ningResponse = {
  paging: { total: 5, has_next: false },
  data: [
    sentence(8934441, '柠檬很酸。', 'iiujik', [
      translation(435751, 'Lemons are sour.', 'CK'),
      translation(29487, 'Lemon is sour.', 'al_ex_an_der'),
    ]),
    sentence(826253, '檸檬是酸的。', 'Martha', [translation(435751, 'Lemons are sour.', 'CK')], 'Hant'),
    sentence(8934444, '柠檬是黄色的。', 'iiujik', [translation(2730909, 'The lemon is yellow.', 'Hybrid')]),
    sentence(13754993, '我会吃我的柠檬。', '_LoLa_', [translation(12702553, "I'll eat my lemon.", 'jacoblaguerre')]),
    sentence(12169719, '我吃了你的柠檬。', 'megamanenm', [translation(9131574, 'I ate your lemon.', 'megamanenm')]),
  ],
}

export { sentence as tatoebaSentence, translation as tatoebaTranslation }
