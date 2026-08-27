const ROMAJI_SYLLABLES: string[] = [
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

type RomajiToken = { value: string; start: number; end: number };
type MappedRomaji = { raw: string; normalized: string; spans: Array<[number, number]> };
export type RomajiDiffSegment = { type: 'plain' | 'diff'; text: string };

function normalizeRomaji(value: unknown = ''): string {
  return String(value || '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((part) => (part === 'wo' ? 'o' : part))
    .join('');
}

function tokenizeNormalizedRomaji(normalized: string): RomajiToken[] {
  const tokens: RomajiToken[] = [];
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

function tokenizeRomaji(value: unknown): string[] {
  return tokenizeNormalizedRomaji(normalizeRomaji(value)).map((token) => token.value);
}

export function scoreRomajiAnswer(answer: unknown, expected: unknown) {
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

export function areRomajiAnswersEqual(answer: unknown, expected: unknown): boolean {
  return normalizeRomaji(answer) === normalizeRomaji(expected);
}

function buildNormalizedMap(rawValue: unknown = ''): MappedRomaji {
  const raw = String(rawValue || '');
  const lower = raw.toLowerCase();
  const words = [...lower.matchAll(/\S+/g)];
  let normalized = '';
  const spans: Array<[number, number]> = [];

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

function getRawTokenRange(mapped: MappedRomaji, token: RomajiToken) {
  const rawStart = token.start >= mapped.spans.length
    ? mapped.raw.length
    : mapped.spans[token.start][0];
  const rawEnd = token.end > mapped.spans.length
    ? mapped.raw.length
    : mapped.spans[token.end - 1][1];

  return { rawStart, rawEnd };
}

function findMatchingTokenIndexes(tokens: RomajiToken[], otherTokens: RomajiToken[]): Set<number> {
  const scores = Array.from({ length: tokens.length + 1 }, () => (
    Array(otherTokens.length + 1).fill(0)
  ));

  for (let row = 1; row <= tokens.length; row++) {
    for (let column = 1; column <= otherTokens.length; column++) {
      const skipScore = Math.max(scores[row - 1][column], scores[row][column - 1]);
      if (tokens[row - 1].value !== otherTokens[column - 1].value) {
        scores[row][column] = skipScore;
        continue;
      }

      // Prefer matching repeated tokens at the closest relative position.
      const matchScore = scores[row - 1][column - 1]
        + 1000
        - Math.abs((row - 1) - (column - 1));
      scores[row][column] = Math.max(matchScore, skipScore);
    }
  }

  const matches = new Set<number>();
  let row = tokens.length;
  let column = otherTokens.length;
  while (row > 0 && column > 0) {
    const isMatch = tokens[row - 1].value === otherTokens[column - 1].value;
    const matchScore = isMatch
      ? scores[row - 1][column - 1] + 1000 - Math.abs((row - 1) - (column - 1))
      : -1;
    if (isMatch && scores[row][column] === matchScore) {
      matches.add(row - 1);
      row--;
      column--;
    } else if (scores[row - 1][column] >= scores[row][column - 1]) {
      row--;
    } else {
      column--;
    }
  }

  return matches;
}

function buildDiffSegments(mapped: MappedRomaji, tokens: RomajiToken[], matchedIndexes: Set<number>, otherTokens: RomajiToken[]): RomajiDiffSegment[] {
  const segments: RomajiDiffSegment[] = [];
  let rawCursor = 0;

  const addSegment = (type: RomajiDiffSegment['type'], text: string): void => {
    if (!text) return;
    const previous = segments[segments.length - 1];
    if (type === 'plain' && previous?.type === 'diff' && /^\s+$/.test(text)) {
      previous.text += text;
      return;
    }
    if (previous?.type === type) {
      previous.text += text;
    } else {
      segments.push({ type, text });
    }
  };

  if (tokens.length === 0) {
    return [{ type: 'diff', text: '∅' }];
  }

  tokens.forEach((token, index) => {

    const { rawStart, rawEnd } = getRawTokenRange(mapped, token);
    const leadingText = mapped.raw.slice(rawCursor, rawStart);
    addSegment('plain', leadingText);

    addSegment(
      matchedIndexes.has(index) ? 'plain' : 'diff',
      mapped.raw.slice(rawStart, rawEnd),
    );
    rawCursor = rawEnd;
  });

  if (otherTokens.length > tokens.length) {
    addSegment('diff', '∅');
  }

  const trailingText = mapped.raw.slice(rawCursor);
  addSegment('plain', trailingText);

  return segments;
}

export function buildRomajiDiff(givenRaw: unknown, expectedRaw: unknown) {
  const givenMapped = buildNormalizedMap(givenRaw);
  const expectedMapped = buildNormalizedMap(expectedRaw);
  const given = tokenizeNormalizedRomaji(givenMapped.normalized);
  const expected = tokenizeNormalizedRomaji(expectedMapped.normalized);
  const givenMatches = findMatchingTokenIndexes(given, expected);
  const expectedMatches = findMatchingTokenIndexes(expected, given);

  return {
    given: buildDiffSegments(givenMapped, given, givenMatches, expected),
    expected: buildDiffSegments(expectedMapped, expected, expectedMatches, given),
  };
}

export function buildDirectRomajiDiff(givenRaw: unknown, expectedRaw: unknown) {
  const type = areRomajiAnswersEqual(givenRaw, expectedRaw) ? 'plain' : 'diff';

  return {
    given: [{ type, text: String(givenRaw || '∅') }],
    expected: [{ type, text: String(expectedRaw || '∅') }],
  };
}
