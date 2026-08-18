function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizePairs(value) {
  if (!value) return {};

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

  const correct = Array.isArray(question.acceptedAnswers)
    ? question.acceptedAnswers
    : typeof question.correctAnswer !== 'undefined'
      ? [question.correctAnswer]
      : [];

  if (correct.length === 0) {
    return typeof question.correctAnswer !== 'undefined' && normalizeText(answer) === normalizeText(question.correctAnswer);
  }

  const normalizedAnswer = normalizeText(answer);
  return correct.some((candidate) => normalizeText(candidate) === normalizedAnswer);
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
