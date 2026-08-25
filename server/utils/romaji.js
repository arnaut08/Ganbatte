// @ts-check

const ROMAJI_SYLLABLES = [
  'kyo', 'kyu', 'kya', 'gyo', 'gyu', 'gya', 'sho', 'shu', 'sha',
  'jyo', 'jyu', 'jya', 'jo', 'ju', 'ja', 'cho', 'chu', 'cha',
  'nyo', 'nyu', 'nya', 'hyo', 'hyu', 'hya', 'byo', 'byu', 'bya',
  'pyo', 'pyu', 'pya', 'myo', 'myu', 'mya', 'ryo', 'ryu', 'rya',
  'shi', 'chi', 'tsu', 'fu',
  'ka', 'ki', 'ku', 'ke', 'ko', 'ga', 'gi', 'gu', 'ge', 'go',
  'sa', 'si', 'su', 'se', 'so', 'za', 'zi', 'zu', 'ze', 'zo',
  'ta', 'ti', 'tu', 'te', 'to', 'da', 'di', 'du', 'de', 'do',
  'na', 'ni', 'nu', 'ne', 'no', 'ha', 'hi', 'hu', 'he', 'ho',
  'ba', 'bi', 'bu', 'be', 'bo', 'pa', 'pi', 'pu', 'pe', 'po',
  'ma', 'mi', 'mu', 'me', 'mo', 'ya', 'yu', 'yo',
  'ra', 'ri', 'ru', 're', 'ro', 'wa', 'we', 'wi',
  'a', 'i', 'u', 'e', 'o', 'n',
];

/** @typedef {{ left?: string, right?: string }} RomajiPair */
/** @typedef {{ pairs?: RomajiPair[], left?: string, right?: string }} RomajiObject */
/** @typedef {string | number | null | undefined | RomajiPair | RomajiObject | Array<string | number | RomajiPair | RomajiObject>} RomajiInput */

/** @param {RomajiInput} value @returns {string} */
function normalizeRomaji(value) {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') {
    return value
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .map((part) => (part === 'wo' ? 'o' : part))
      .join('');
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeRomaji(entry)).join('');
  }

  if (typeof value === 'object') {
    if ('pairs' in value && Array.isArray(value.pairs)) {
      return value.pairs.map((pair) => normalizeRomaji(`${pair?.left ?? ''} ${pair?.right ?? ''}`)).join('');
    }

    if (typeof value.left === 'string' || typeof value.right === 'string') {
      return normalizeRomaji(`${value.left ?? ''} ${value.right ?? ''}`);
    }

    return '';
  }

  return String(value)
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((part) => (part === 'wo' ? 'o' : part))
    .join('');
}

/** @param {RomajiInput} value */
function tokenizeRomaji(value) {
  const normalized = normalizeRomaji(value);
  const tokens = [];
  let index = 0;

  while (index < normalized.length) {
    const matched = ROMAJI_SYLLABLES.find((syllable) => normalized.startsWith(syllable, index));
    tokens.push(matched || normalized[index]);
    index += matched?.length || 1;
  }

  return tokens;
}

/** @param {RomajiInput} answer @param {RomajiInput} expected */
export function isCorrectRomajiAnswer(answer, expected) {
  const answerTokens = tokenizeRomaji(answer);
  const expectedTokens = tokenizeRomaji(expected);
  return answerTokens.length === expectedTokens.length
    && answerTokens.every((token, index) => token === expectedTokens[index]);
}
