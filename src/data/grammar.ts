import type { GrammarPoint } from '../features/grammar/types.ts'

/**
 * Notas de gramática de las partículas más comunes de HSK 1-4.
 *
 * CURADO A MANO, como topics.ts. Criterios (docs/DATA_SOURCES.md, «Notas de
 * gramática»):
 *
 * - Los usos y su nivel siguen la Chinese Grammar Wiki de AllSet Learning,
 *   pero las explicaciones son propias: la wiki es CC BY-NC-SA 3.0 (no
 *   comercial), así que no se copia su texto ni sus frases. Cada punto
 *   enlaza a su página.
 * - Los ejemplos son frases de Tatoeba (CC BY 2.0 FR) que ya están en
 *   public/examples/, copiadas tal cual con su id y su autor. Un test
 *   comprueba que existen y que contienen la partícula.
 * - Si no hay frases de Tatoeba para un uso, ese uso no entra (por eso no
 *   está el 呢 de acción en curso).
 *
 * Añadir un punto = añadir un objeto a esta lista.
 */
const WIKI = 'https://resources.allsetlearning.com/chinese/grammar/'

export const grammarPoints: readonly GrammarPoint[] = [
  {
    id: 'de-possession',
    particle: '的',
    pinyin: 'de',
    title: 'Possession with 的',
    pattern: 'Noun / Pronoun + 的 + Noun',
    explanation:
      'Put 的 between an owner and what they own, like English "\'s" or "of". If it is clear what you mean, the second noun can be left out: 谁的 means "whose (one)". With close people and groups, like family, 的 is often dropped: 我妈妈.',
    examples: [
      { tatoebaId: 2346872, zh: '这是我的电脑。', en: 'This is my computer.', author: 'everylanguage' },
      { tatoebaId: 330581, zh: '这是我的妈妈。', en: 'This is my mother.', author: 'vermouthmjl' },
      { tatoebaId: 360560, zh: '这把伞是谁的？', en: 'Whose umbrella is this?', author: 'sysko' },
    ],
    reference: { title: 'Expressing possession with "de"', url: `${WIKI}ASGUHQD2` },
  },
  {
    id: 'de-modifier',
    particle: '的',
    pinyin: 'de',
    title: 'Describing nouns with 的',
    pattern: 'Adjective / Phrase + 的 + Noun',
    explanation:
      'In Chinese, everything that describes a noun comes before it, joined with 的: an adjective, a phrase or even a whole clause. Short one-syllable adjectives often skip it (好人), but longer descriptions need it. As with possession, the noun can be left out: 新的 is "the new one".',
    examples: [
      { tatoebaId: 2779412, zh: '这些是很旧的书。', en: 'These are very old books.', author: 'GlossaMatik' },
      { tatoebaId: 782250, zh: '这是一本关于星星的书。', en: 'This is a book about stars.', author: 'fucongcong' },
      { tatoebaId: 822110, zh: '这是新的。', en: 'This is new.', author: 'U2FS' },
    ],
    reference: { title: 'Modifying nouns with adjective + "de"', url: `${WIKI}ASGVUFKX` },
  },
  {
    id: 'le-completion',
    particle: '了',
    pinyin: 'le',
    title: 'Completed actions with 了',
    pattern: 'Verb + 了 + (Quantity) + Object',
    explanation:
      '了 right after a verb says the action is done. It marks completion, not past tense, so it is not used for every past event. When the object has a number or a length of time, 了 goes right after the verb. To say something did not happen, use 没 before the verb and drop 了.',
    examples: [
      { tatoebaId: 817296, zh: '我买了两条裤子。', en: 'I bought two pairs of trousers.', author: 'fucongcong' },
      { tatoebaId: 784523, zh: '他学了两个小时。', en: 'He has been studying for two hours.', author: 'fucongcong' },
      { tatoebaId: 9007523, zh: '她睡了几小时。', en: 'She slept for a few hours.', author: 'jacintoo' },
    ],
    reference: { title: 'Expressing completion with "le"', url: `${WIKI}ASGAGDCQ` },
  },
  {
    id: 'le-change',
    particle: '了',
    pinyin: 'le',
    title: 'Change of state with 了',
    pattern: 'Statement + 了',
    explanation:
      'At the end of a sentence, 了 says that a situation is new: something is true now that was not true before. 下雨了 is "it has started raining", not just "it rains". It works with adjectives, ages and times too.',
    examples: [
      { tatoebaId: 346836, zh: '下雨了。', en: 'It is raining.', author: 'fucongcong' },
      { tatoebaId: 841845, zh: '天气冷了。', en: 'The weather is cold now.', author: 'eastasiastudent' },
      { tatoebaId: 2292923, zh: '我二十五岁了。', en: "I'm 25 years old.", author: 'Vortarulo' },
    ],
    reference: { title: 'Change of state with "le"', url: `${WIKI}ASGT185D` },
  },
  {
    id: 'ma-questions',
    particle: '吗',
    pinyin: 'ma',
    title: 'Yes-no questions with 吗',
    pattern: 'Statement + 吗？',
    explanation:
      'Add 吗 to the end of a statement to turn it into a yes-no question. The word order stays the same. Chinese has no single word for "yes" or "no": you answer by repeating the verb, with or without 不 (是 / 不是, 有 / 没有).',
    examples: [
      { tatoebaId: 352933, zh: '你是学生吗？', en: 'Are you a student?', author: 'zhouj1955' },
      { tatoebaId: 745160, zh: '您有手机吗？', en: 'Do you have a cellphone?', author: 'Vortarulo' },
      { tatoebaId: 480305, zh: '你想一起去吗？', en: 'Do you want to come along?', author: 'minshirui' },
    ],
    reference: { title: 'Yes-no questions with "ma"', url: `${WIKI}ASGQ2AZA` },
  },
  {
    id: 'ne-questions',
    particle: '呢',
    pinyin: 'ne',
    title: '"What about...?" with 呢',
    pattern: 'Noun / Pronoun + 呢？',
    explanation:
      'After a noun or pronoun, 呢 turns the question just asked back on it: 你呢？ is "and you?". Asked out of the blue about a person or a thing, it means "where is...?".',
    examples: [
      { tatoebaId: 691992, zh: '你呢？', en: 'How about you?', author: 'sysko' },
      { tatoebaId: 2680906, zh: '那我呢?', en: 'What about me?', author: 'issiao1024' },
      { tatoebaId: 10966817, zh: '你妈妈呢？', en: "Where's your mom?", author: 'xjjAstrus' },
    ],
    reference: { title: 'Questions with "ne"', url: `${WIKI}ASGMJHZO` },
  },
  {
    id: 'ba-suggestions',
    particle: '吧',
    pinyin: 'ba',
    title: 'Suggestions with 吧',
    pattern: 'Verb phrase + 吧',
    explanation:
      '吧 at the end of a command turns it into a suggestion or a friendly offer: "let\'s...", "why don\'t you...". With 我们 it is "let\'s"; with 我 it offers to do something.',
    examples: [
      { tatoebaId: 334277, zh: '走吧。', en: "Let's go!", author: 'fucongcong' },
      { tatoebaId: 7767999, zh: '我们开始吧。', en: "Let's start.", author: 'jiangche' },
      { tatoebaId: 526394, zh: '我送你回家吧。', en: 'Let me take you home.', author: 'nickyeow' },
    ],
    reference: { title: 'Suggestions with "ba"', url: `${WIKI}ASGMPZ6D` },
  },
  {
    id: 'ba-softening',
    particle: '吧',
    pinyin: 'ba',
    title: 'Softening statements with 吧',
    pattern: 'Statement + 吧',
    explanation:
      '吧 also makes a statement sound less certain or less blunt. As a question, it shows you already think the answer is yes and want the other person to agree, like "..., right?". In answers it sounds easygoing: 好吧 is "OK, then".',
    examples: [
      { tatoebaId: 3534648, zh: '你喜欢昨晚的演出吧？', en: 'Did you enjoy the performance last night?', author: 'trieuho' },
      { tatoebaId: 5933582, zh: '好吧。', en: 'Okay.', author: 'Sethlang' },
      { tatoebaId: 710745, zh: '也许下一次吧。', en: 'Maybe some other time.', author: 'Yashanti' },
    ],
    reference: { title: 'Softening speech with "ba"', url: `${WIKI}ASGDHC1H` },
  },
  {
    id: 'guo-experience',
    particle: '过',
    pinyin: 'guo',
    title: 'Past experiences with 过',
    pattern: 'Verb + 过 + Object',
    explanation:
      '过 after a verb says someone has done something at least once, at some point in the past: "have ever...". It talks about the experience, not about when it happened. To say you have never done it, use 没 before the verb and keep 过.',
    examples: [
      { tatoebaId: 5558523, zh: '他去过很多地方。', en: 'He has been to many places.', author: 'verdastelo9604' },
      { tatoebaId: 1428132, zh: '你去过哪些国家？', en: 'Which countries have you visited?', author: 'sadhen' },
      { tatoebaId: 411728, zh: '我从来没去过美国。', en: 'I have never gone to America.', author: 'GlossaMatik' },
    ],
    reference: { title: 'Expressing experiences with "guo"', url: `${WIKI}ASGQGV3P` },
  },
  {
    id: 'zhe-continuous',
    particle: '着',
    pinyin: 'zhe',
    title: 'Ongoing states with 着',
    pattern: 'Verb + 着',
    explanation:
      '着 after a verb says that an action, or the state it leaves behind, keeps going: 穿着 is "wearing", 亮着 is "is on". It describes how things are at a moment rather than reporting an event. In words like 着急 and 睡着 the same character is read zháo and is not this particle.',
    examples: [
      { tatoebaId: 466164, zh: '猫看着鱼。', en: 'The cat is watching the fish.', author: 'fucongcong' },
      { tatoebaId: 349263, zh: '她穿着红裙子。', en: 'She was wearing a red skirt.', author: 'zhouj1955' },
      { tatoebaId: 1411641, zh: '灯亮着。', en: 'The light is on.', author: 'asosan' },
    ],
    reference: { title: 'Aspect particle "zhe"', url: `${WIKI}ASGOIDEO` },
  },
  {
    id: 'de-degree',
    particle: '得',
    pinyin: 'de',
    title: 'How well: verb + 得',
    pattern: 'Verb + 得 + Description',
    explanation:
      '得 after a verb introduces a comment on how the action is done: well, fast, fluently... If the verb has an object, say the verb twice (说法语说得...) or put the object first. To negate, put 不 after 得, not before the verb.',
    examples: [
      { tatoebaId: 796906, zh: '他弹得很好。', en: 'He plays very well.', author: 'fucongcong' },
      { tatoebaId: 1753036, zh: '他说法语说得很流利。', en: 'He is fluent in French.', author: 'sadhen' },
      { tatoebaId: 3700364, zh: '她法语说得不流利。', en: 'Her French is not fluent.', author: 'katshi94' },
    ],
    reference: { title: 'Degree complement', url: `${WIKI}ASG79STE` },
  },
  {
    id: 'de-adverb',
    particle: '地',
    pinyin: 'de',
    title: 'Manner of an action with 地',
    pattern: 'Adjective + 地 + Verb',
    explanation:
      '地 turns a description into an adverb placed before the verb, like English "-ly". 的, 得 and 地 all sound the same (de): 的 comes before nouns, 得 after verbs and 地 before verbs.',
    examples: [
      { tatoebaId: 512111, zh: '他慢慢地走。', en: 'He walks slowly.', author: 'fucongcong' },
      { tatoebaId: 1178232, zh: '她小心地做。', en: 'She did it carefully.', author: 'treskro3' },
      { tatoebaId: 429463, zh: '请详细地解释。', en: 'Please explain in detail.', author: 'aliene' },
    ],
    reference: { title: 'Turning adjectives into adverbs', url: `${WIKI}ASGMAFSX` },
  },
  {
    id: 'a-interjection',
    particle: '啊',
    pinyin: 'a',
    title: 'Adding feeling with 啊',
    pattern: 'Sentence + 啊',
    explanation:
      '啊 at the end of a sentence adds emotion without changing the meaning: excitement in exclamations (多...啊！ is "how...!"), urgency in commands, or insistence and surprise in questions.',
    examples: [
      { tatoebaId: 5092632, zh: '多可爱啊！', en: 'How cute!', author: 'mirrorvan' },
      { tatoebaId: 7767996, zh: '说啊！', en: 'Speak!', author: 'jiangche' },
      { tatoebaId: 839261, zh: '他是什么样子的男人啊？', en: 'What kind of man was he?', author: 'U2FS' },
    ],
    reference: { title: 'Sentence-final interjection "a"', url: `${WIKI}ASGW66JM` },
  },
]
