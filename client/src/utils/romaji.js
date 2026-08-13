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

function getRawTokenRange(mapped, token) {
  const rawStart = token.start >= mapped.spans.length
    ? mapped.raw.length
    : mapped.spans[token.start][0];
  const rawEnd = token.end > mapped.spans.length
    ? mapped.raw.length
    : mapped.spans[token.end - 1][1];

  return { rawStart, rawEnd };
}

function findMatchingTokenIndexes(tokens, otherTokens) {
  const lengths = Array.from({ length: tokens.length + 1 }, () => (
    Array(otherTokens.length + 1).fill(0)
  ));

  for (let row = 1; row <= tokens.length; row++) {
    for (let column = 1; column <= otherTokens.length; column++) {
      lengths[row][column] = tokens[row - 1].value === otherTokens[column - 1].value
        ? lengths[row - 1][column - 1] + 1
        : Math.max(lengths[row - 1][column], lengths[row][column - 1]);
    }
  }

  const matches = new Set();
  let row = tokens.length;
  let column = otherTokens.length;
  while (row > 0 && column > 0) {
    if (tokens[row - 1].value === otherTokens[column - 1].value) {
      matches.add(row - 1);
      row--;
      column--;
    } else if (lengths[row - 1][column] >= lengths[row][column - 1]) {
      row--;
    } else {
      column--;
    }
  }

  return matches;
}

function buildDiffSegments(mapped, tokens, matchedIndexes) {
  const segments = [];
  let rawCursor = 0;

  tokens.forEach((token, index) => {

    const { rawStart, rawEnd } = getRawTokenRange(mapped, token);
    const leadingText = mapped.raw.slice(rawCursor, rawStart);
    if (leadingText) {
      segments.push({ type: 'plain', text: leadingText });
    }

    segments.push({
      type: matchedIndexes.has(index) ? 'plain' : 'diff',
      text: mapped.raw.slice(rawStart, rawEnd),
    });
    rawCursor = rawEnd;
  });

  const trailingText = mapped.raw.slice(rawCursor);
  if (trailingText) {
    segments.push({ type: 'plain', text: trailingText });
  }

  return segments;
}

export function buildRomajiDiff(givenRaw, expectedRaw) {
  const givenMapped = buildNormalizedMap(givenRaw);
  const expectedMapped = buildNormalizedMap(expectedRaw);
  const given = tokenizeNormalizedRomaji(givenMapped.normalized);
  const expected = tokenizeNormalizedRomaji(expectedMapped.normalized);
  const givenMatches = findMatchingTokenIndexes(given, expected);
  const expectedMatches = findMatchingTokenIndexes(expected, given);

  return {
    given: buildDiffSegments(givenMapped, given, givenMatches),
    expected: buildDiffSegments(expectedMapped, expected, expectedMatches),
  };
}
