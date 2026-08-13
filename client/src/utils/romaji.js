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

export function normalizeRomaji(value) {
  return (value || '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((part) => (part === 'wo' ? 'o' : part))
    .join('');
}

export function tokenizeNormalizedRomaji(normalized) {
  const tokens = [];
  let index = 0;

  while (index < normalized.length) {
    const matched = ROMAJI_SYLLABLES.find((syllable) => normalized.startsWith(syllable, index));
    if (matched) {
      tokens.push({ value: matched, start: index, end: index + matched.length });
      index += matched.length;
    } else {
      tokens.push({ value: normalized[index], start: index, end: index + 1 });
      index += 1;
    }
  }

  return tokens;
}

export function tokenizeRomaji(value) {
  return tokenizeNormalizedRomaji(normalizeRomaji(value)).map((token) => token.value);
}

export function scoreRomajiAnswer(answer, expected) {
  const expectedTokens = tokenizeRomaji(expected);
  const answerTokens = tokenizeRomaji(answer);
  const matched = expectedTokens.reduce(
    (count, token, index) => count + (answerTokens[index] === token ? 1 : 0),
    0,
  );

  return {
    matched,
    total: expectedTokens.length,
    percentage: expectedTokens.length === 0 ? 0 : Math.round((matched / expectedTokens.length) * 100),
  };
}

function buildNormalizedMap(rawValue) {
  const raw = rawValue || '';
  const lower = raw.toLowerCase();
  const words = [...lower.matchAll(/\S+/g)];
  let normalized = '';
  const spans = [];

  words.forEach((match) => {
    const word = match[0];
    const start = match.index;
    if (start === undefined) return;

    if (word === 'wo') {
      normalized += 'o';
      spans.push([start, start + word.length]);
      return;
    }

    for (let index = 0; index < word.length; index++) {
      normalized += word[index];
      spans.push([start + index, start + index + 1]);
    }
  });

  return { raw, normalized, spans };
}

function splitRawAroundDiff(raw, spans, diffStart, diffEnd) {
  const safeStart = Math.max(0, Math.min(diffStart, spans.length));
  const safeEnd = Math.max(safeStart, Math.min(diffEnd, spans.length));
  const rawStart = safeStart >= spans.length ? raw.length : spans[safeStart][0];
  const rawEnd = safeEnd === 0
    ? 0
    : safeEnd > spans.length
    ? raw.length
    : spans[safeEnd - 1][1];

  return {
    prefix: raw.slice(0, rawStart),
    diff: raw.slice(rawStart, rawEnd),
    suffix: raw.slice(rawEnd),
  };
}

export function buildRomajiDiff(givenRaw, expectedRaw) {
  const givenMapped = buildNormalizedMap(givenRaw);
  const expectedMapped = buildNormalizedMap(expectedRaw);
  const given = tokenizeNormalizedRomaji(givenMapped.normalized);
  const expected = tokenizeNormalizedRomaji(expectedMapped.normalized);

  let left = 0;
  while (left < given.length && left < expected.length && given[left].value === expected[left].value) {
    left++;
  }

  let rightGiven = given.length - 1;
  let rightExpected = expected.length - 1;
  while (rightGiven >= left && rightExpected >= left && given[rightGiven].value === expected[rightExpected].value) {
    rightGiven--;
    rightExpected--;
  }

  const givenDiffStart = left < given.length ? given[left].start : givenMapped.normalized.length;
  const givenDiffEnd = rightGiven >= left ? given[rightGiven].end : givenDiffStart;
  const expectedDiffStart = left < expected.length ? expected[left].start : expectedMapped.normalized.length;
  const expectedDiffEnd = rightExpected >= left ? expected[rightExpected].end : expectedDiffStart;

  return {
    given: splitRawAroundDiff(givenMapped.raw, givenMapped.spans, givenDiffStart, givenDiffEnd),
    expected: splitRawAroundDiff(expectedMapped.raw, expectedMapped.spans, expectedDiffStart, expectedDiffEnd),
  };
}
