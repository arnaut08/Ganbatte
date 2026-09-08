import type { VocabStudyItem } from '../types';

export type VocabQuizQuestionType = 'japanese-to-english' | 'english-to-japanese';

export type VocabQuizQuestion = {
  id: string;
  type: VocabQuizQuestionType;
  prompt: string;
  promptReading?: string;
  correctAnswer: string;
  options: string[];
  vocab: VocabStudyItem;
};

function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function generateVocabQuiz(
  items: VocabStudyItem[],
  questionCount = 10,
  random: () => number = Math.random,
): VocabQuizQuestion[] {
  const uniqueItems = [...new Map(items.map((item) => [item.id, item])).values()];
  const selectedItems = shuffle(uniqueItems, random).slice(0, Math.min(questionCount, uniqueItems.length));
  const englishAnswers = uniqueItems.flatMap((item) => item.english).filter(Boolean);
  const japaneseAnswers = uniqueItems.map((item) => item.kanji === item.kana ? item.kana : `${item.kanji} / ${item.kana}`);

  return selectedItems.map((item, index) => {
    const type: VocabQuizQuestionType = index % 2 === 0 ? 'japanese-to-english' : 'english-to-japanese';
    const correctAnswer = type === 'japanese-to-english'
      ? item.english[0]
      : item.kanji === item.kana ? item.kana : `${item.kanji} / ${item.kana}`;
    const answerPool = type === 'japanese-to-english' ? englishAnswers : japaneseAnswers;
    const distractors = [...new Set(answerPool.filter((answer) => answer !== correctAnswer))].slice(0, 3);

    return {
      id: `${item.id}-${index}`,
      type,
      prompt: type === 'japanese-to-english' ? item.kanji : item.english.join(' / '),
      promptReading: type === 'japanese-to-english' ? item.kana : undefined,
      correctAnswer,
      options: shuffle([correctAnswer, ...distractors], random),
      vocab: item,
    };
  });
}

export function shuffleQuizQuestions(
  questions: VocabQuizQuestion[],
  random: () => number = Math.random,
): VocabQuizQuestion[] {
  return shuffle(questions, random).map((question, index) => ({
    ...question,
    id: `${question.vocab.id}-${index}`,
    type: index % 2 === 0 ? 'japanese-to-english' : 'english-to-japanese',
    prompt: index % 2 === 0 ? question.vocab.kanji : question.vocab.english.join(' / '),
    promptReading: index % 2 === 0 ? question.vocab.kana : undefined,
    correctAnswer: index % 2 === 0
      ? question.vocab.english[0]
      : question.vocab.kanji === question.vocab.kana
        ? question.vocab.kana
        : `${question.vocab.kanji} / ${question.vocab.kana}`,
    options: index % 2 === 0
      ? shuffle([question.vocab.english[0], ...question.options.filter((option) => option !== question.vocab.english[0]).slice(0, 3)], random)
      : shuffle([
        question.vocab.kanji === question.vocab.kana ? question.vocab.kana : `${question.vocab.kanji} / ${question.vocab.kana}`,
        ...question.options.filter((option) => option !== question.vocab.kanji && option !== question.vocab.kana).slice(0, 3),
      ], random),
  }));
}
