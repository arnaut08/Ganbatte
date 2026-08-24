const ROMAJI_TO_KANA = {
  'kyo': 'きょ', 'kyu': 'きゅ', 'kya': 'きゃ',
  'gyo': 'ぎょ', 'gyu': 'ぎゅ', 'gya': 'ぎゃ',
  'sho': 'しょ', 'shu': 'しゅ', 'sha': 'しゃ',
  'jyo': 'じょ', 'jyu': 'じゅ', 'jya': 'じゃ',
  'jo': 'じょ', 'ju': 'じゅ', 'ja': 'じゃ',
  'cho': 'ちょ', 'chu': 'ちゅ', 'cha': 'ちゃ',
  'nyo': 'にょ', 'nyu': 'にゅ', 'nya': 'にゃ',
  'hyo': 'ひょ', 'hyu': 'ひゅ', 'hya': 'ひゃ',
  'byo': 'びょ', 'byu': 'びゅ', 'bya': 'びゃ',
  'pyo': 'ぴょ', 'pyu': 'ぴゅ', 'pya': 'ぴゃ',
  'myo': 'みょ', 'myu': 'みゅ', 'mya': 'みゃ',
  'ryo': 'りょ', 'ryu': 'りゅ', 'rya': 'りゃ',
  'shi': 'し', 'chi': 'ち', 'tsu': 'つ', 'fu': 'ふ',
  'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
  'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
  'sa': 'さ', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
  'za': 'ざ', 'zi': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
  'ta': 'た', 'ti': 'ち', 'tu': 'つ', 'te': 'て', 'to': 'と',
  'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
  'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
  'ha': 'は', 'hi': 'ひ', 'hu': 'ふ', 'he': 'へ', 'ho': 'ほ',
  'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
  'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
  'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
  'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
  'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
  'wa': 'わ', 'wo': 'を', 'n': 'ん',
  'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
};

const ROMAJI_SYLLABLE_KEYS = Object.keys(ROMAJI_TO_KANA).sort((left, right) => right.length - left.length);

const KANJI_TO_KANA = {
  '私は': 'わたしは',
  '私の': 'わたしの',
  '私': 'わたし',
  'あなた': 'あなた',
  '彼': 'かれ',
  '彼女': 'かのじょ',
  '学生': 'がくせい',
  '先生': 'せんせい',
  '学校': 'がっこう',
  '駅': 'えき',
  '友達': 'ともだち',
  '家': 'うち',
  'これは': 'これは',
  'それは': 'それは',
  'あれは': 'あれは',
  'かばん': 'かばん',
  'です': 'です',
};

const KANA_TO_ROMAJI = {
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo', 'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho', 'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo', 'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo', 'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo', 'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo', 'ふぁ': 'fa', 'ふぃ': 'fi', 'ふぇ': 'fe', 'ふぉ': 'fo',
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o', 'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go', 'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo', 'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do', 'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho', 'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po', 'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo', 'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro', 'わ': 'wa', 'を': 'o', 'ん': 'n',
};

const KATAKANA_TO_HIRAGANA_OFFSET = 'ァ'.charCodeAt(0) - 'ぁ'.charCodeAt(0);

function normalizeKanaCharacter(character) {
  const codePoint = character.codePointAt(0);
  return codePoint >= 'ァ'.charCodeAt(0) && codePoint <= 'ヶ'.charCodeAt(0)
    ? String.fromCodePoint(codePoint - KATAKANA_TO_HIRAGANA_OFFSET)
    : character;
}

export function kanaToRomaji(value) {
  const text = String(value ?? '').trim();
  if (!text || /[^\sぁ-ゖァ-ヺー。、！？・「」『』（）()]/u.test(text) || !/[ぁ-ゖァ-ヺ]/u.test(text)) return '';

  let result = '';
  for (let index = 0; index < text.length; index += 1) {
    const pair = KANA_TO_ROMAJI[normalizeKanaCharacter(text.slice(index, index + 2))];
    const character = normalizeKanaCharacter(text[index]);
    if (pair) {
      result += pair;
      index += 1;
    } else if (character === 'っ') {
      const next = KANA_TO_ROMAJI[normalizeKanaCharacter(text[index + 1])] || '';
      result += next[0] || '';
    } else {
      result += KANA_TO_ROMAJI[character] || character;
    }
  }

  return result;
}

function looksLikeRomaji(value) {
  const text = String(value ?? '').trim();
  if (!text) return false;
  return /[a-zA-Z]/.test(text) && !/[ぁ-ゖァ-ヺー]/.test(text);
}

function convertRomajiToKana(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';

  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  return words.map((word) => {
    if (word === 'wa') return 'は';
    if (word === 'wo' || word === 'o') return 'を';

    let result = '';
    let index = 0;
    while (index < word.length) {
      const match = ROMAJI_SYLLABLE_KEYS.find((syllable) => word.startsWith(syllable, index));
      if (match) {
        result += ROMAJI_TO_KANA[match];
        index += match.length;
      } else {
        result += word[index];
        index += 1;
      }
    }

    return result;
  }).join('');
}

function normalizeJapaneseText(value) {
  const entries = Object.entries(KANJI_TO_KANA).sort((left, right) => right[0].length - left[0].length);
  let normalized = value;

  for (const [kanji, kana] of entries) {
    normalized = normalized.replaceAll(kanji, kana);
  }

  return normalized;
}

function normalizePlainText(value) {
  return String(value ?? '')
    .trim()
    .replace(/[\p{P}\p{S}]/gu, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function normalizeRomajiReference(value) {
  const normalized = normalizePlainText(value);
  if (normalized === 'wo' || normalized === 'o' || normalized === 'を') {
    return 'o';
  }

  return normalized;
}

function normalizeText(value, expectedValue = value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const reference = String(expectedValue ?? '').trim();
  const isReferenceRomaji = !!reference && looksLikeRomaji(reference);

  if (isReferenceRomaji) {
    return normalizeRomajiReference(raw);
  }

  const normalized = looksLikeRomaji(raw) ? convertRomajiToKana(raw) : raw;
  return normalizePlainText(normalizeJapaneseText(normalized));
}

function normalizePairs(value) {
  if (!value) return {};

  if (typeof value === 'object' && !Array.isArray(value) && Array.isArray(value.pairs)) {
    return normalizePairs(value.pairs);
  }

  if (Array.isArray(value)) {
    return value.reduce((accumulator, pair) => {
      if (!pair || typeof pair !== 'object') return accumulator;
      const left = String(pair.left ?? '').trim();
      const right = String(pair.right ?? '').trim();
      if (left && right) {
        accumulator[left] = right;
      }
      return accumulator;
    }, {});
  }

  if (typeof value === 'object') {
    return Object.entries(value).reduce((accumulator, [left, right]) => {
      const normalizedLeft = String(left ?? '').trim();
      const normalizedRight = String(right ?? '').trim();
      if (normalizedLeft && normalizedRight) {
        accumulator[normalizedLeft] = normalizedRight;
      }
      return accumulator;
    }, {});
  }

  return {};
}

export function getMatchingResultScore(question, answer) {
  const expected = normalizePairs(question?.correctPairs || {});
  const actual = normalizePairs(answer || []);
  const expectedEntries = Object.entries(expected);
  const total = expectedEntries.length;

  if (total === 0) {
    return { correct: 0, total: 0, isCorrect: Object.keys(actual).length === 0, scorePercent: 0 };
  }

  const correct = expectedEntries.reduce((count, [left, right]) => (
    actual[left] === right ? count + 1 : count
  ), 0);

  return {
    correct,
    total,
    isCorrect: correct === total,
    scorePercent: Math.round((correct / total) * 100),
  };
}

export function isQuestionCorrect(question, answer) {
  if (!question) return false;

  if (question.type === 'matching') {
    return getMatchingResultScore(question, answer).isCorrect;
  }

  const accepted = typeof question.acceptedAnswers !== 'undefined' && question.acceptedAnswers !== null
    ? (Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [question.acceptedAnswers])
    : typeof question.correctAnswer !== 'undefined'
      ? [question.correctAnswer]
      : [];

  if (accepted.length === 0) {
    return typeof question.correctAnswer !== 'undefined'
      && normalizeText(answer, question.correctAnswer) === normalizeText(question.correctAnswer, question.correctAnswer);
  }

  const hasRomajiReference = typeof question.correctAnswerRomaji !== 'undefined' && question.correctAnswerRomaji;
  const referenceAnswer = hasRomajiReference ? question.correctAnswerRomaji : accepted[0];

  if (hasRomajiReference) {
    const normalizedAnswer = normalizeText(answer, question.correctAnswerRomaji);
    const normalizedReference = normalizeText(question.correctAnswerRomaji, question.correctAnswerRomaji);
    const normalizedCanonical = normalizeText(question.correctAnswer, question.correctAnswerRomaji);

    if (normalizedAnswer === normalizedReference || normalizedAnswer === normalizedCanonical) {
      return true;
    }
  }

  const normalizedAnswer = normalizeText(answer, referenceAnswer);
  return accepted.some((candidate) => {
    const candidateReference = hasRomajiReference ? question.correctAnswerRomaji : candidate;
    const candidateValue = normalizeText(candidate, candidateReference);
    return candidateValue === normalizedAnswer;
  });
}

export function summarizeResults(questions = [], answers = []) {
  const totalCount = Array.isArray(questions) ? questions.length : 0;
  let correctCount = 0;
  let questionTotal = 0;

  for (let index = 0; index < totalCount; index += 1) {
    const question = questions[index];
    const answer = answers[index];

    if (question?.type === 'matching') {
      const score = getMatchingResultScore(question, answer);
      correctCount += score.correct;
      questionTotal += score.total;
      continue;
    }

    questionTotal += 1;
    if (isQuestionCorrect(question, answer)) {
      correctCount += 1;
    }
  }

  const safeTotal = questionTotal || 0;
  const scorePercent = safeTotal === 0 ? 0 : Math.round((correctCount / safeTotal) * 100);

  return {
    totalCount: safeTotal,
    correctCount,
    incorrectCount: safeTotal - correctCount,
    scorePercent,
  };
}
