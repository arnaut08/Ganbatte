import { FALLBACK_GEMINI_MODEL, GEMINI_API_KEY, GEMINI_MODEL } from '../config/env.js';

export const QUESTION_TYPES = [
  'multiple-choice',
  'fill-in-the-blank',
  'matching',
  'translation',
  'comprehension',
];

export const GENKI_GRAMMAR_LESSONS = [
  { number: 1, title: 'Greeting and self-introduction', grammar: ['は', 'です', 'が', 'も'] },
  { number: 2, title: 'Time and daily life', grammar: ['に', 'で', 'を', 'ます'] },
  { number: 3, title: 'Describing people and things', grammar: ['な', 'の', 'か', 'も'] },
  { number: 4, title: 'Activities and time expressions', grammar: ['から', 'まで', 'と', 'たり'] },
  { number: 5, title: 'Past tense and locations', grammar: ['かった', 'た', 'に', 'で'] },
  { number: 6, title: 'Giving and receiving', grammar: ['にくれる', 'もらう', 'あげる', 'くれる'] },
  { number: 7, title: 'Invitations and plans', grammar: ['〜てください', '〜てみます', '〜たり', '〜たい'] },
  { number: 8, title: 'Seeking advice', grammar: ['〜てしまう', '〜てくる', '〜ておく', '〜ないで'] },
  { number: 9, title: 'Expressing frequency', grammar: ['〜ことがある', '〜ほど', '〜くらい', '〜か'] },
  { number: 10, title: 'Describing experiences', grammar: ['〜たことがある', '〜とき', '〜ながら', '〜か'] },
  { number: 11, title: 'Giving reasons', grammar: ['〜ので', '〜から', '〜ために', '〜し'] },
  { number: 12, title: 'Advanced expressions', grammar: ['〜ように', '〜つもり', '〜べき', '〜みたい'] },
];

const TRANSLATION_PROMPTS = [
  { english: 'I go to school by train.', japanese: '私は電車で学校に行きます。', lesson: 2 },
  { english: 'My friend is kind.', japanese: '友だちはやさしいです。', lesson: 3 },
  { english: 'I studied Japanese yesterday.', japanese: '昨日日本語を勉強しました。', lesson: 5 },
  { english: 'Please give me a drink.', japanese: '飲み物をください。', lesson: 6 },
  { english: 'I want to eat sushi.', japanese: 'すしを食べたいです。', lesson: 7 },
  { english: 'I have never been to Kyoto.', japanese: '京都に行ったことがありません。', lesson: 9 },
  { english: 'Because it is raining, I stay home.', japanese: '雨が降っているので、家にいます。', lesson: 11 },
  { english: 'I am planning to travel to Japan.', japanese: '日本へ行くつもりです。', lesson: 12 },
];

const MATCHING_PAIRS = [
  { left: 'は', right: 'topic marker', lesson: 1 },
  { left: 'を', right: 'direct object marker', lesson: 2 },
  { left: 'で', right: 'place of action', lesson: 2 },
  { left: 'に', right: 'destination / time target', lesson: 2 },
  { left: 'た', right: 'past-tense verb ending', lesson: 5 },
  { left: 'たい', right: 'want to do', lesson: 7 },
  { left: 'ので', right: 'because', lesson: 11 },
  { left: 'つもり', right: 'intention', lesson: 12 },
];

function clampCount(value) {
  return Math.min(Math.max(Number(value) || 1, 1), 25);
}

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function buildMultipleChoiceQuestion(lesson) {
  const grammar = lesson.grammar[0];
  return {
    id: `lesson-${lesson.number}-mc-${Math.random().toString(36).slice(2, 8)}`,
    lesson: lesson.number,
    type: 'multiple-choice',
    prompt: `Which particle is most appropriate in the phrase “私は日本語${grammar}勉強します”?`,
    choices: ['を', 'で', 'に', 'が'],
    correctAnswer: 'を',
    explanation: `${grammar} is a common grammar point in lesson ${lesson.number}.`,
    difficulty: 'beginner',
  };
}

function buildFillInBlankQuestion(lesson) {
  const grammar = randomFrom(lesson.grammar);
  return {
    id: `lesson-${lesson.number}-fib-${Math.random().toString(36).slice(2, 8)}`,
    lesson: lesson.number,
    type: 'fill-in-the-blank',
    prompt: `Complete the sentence: 「わたしは まいにち にほんご${grammar === 'を' ? 'を' : 'を'} べんきょうします。"`,
    choices: [],
    correctAnswer: grammar,
    acceptedAnswers: [grammar, grammar === 'を' ? 'を' : grammar],
    explanation: `Lesson ${lesson.number} focuses on ${grammar} usage in daily expressions.`,
    difficulty: 'beginner',
  };
}

function buildMatchingQuestion(lesson) {
  const pairs = MATCHING_PAIRS.filter((item) => item.lesson <= lesson.number).slice(0, 4);
  return {
    id: `lesson-${lesson.number}-match-${Math.random().toString(36).slice(2, 8)}`,
    lesson: lesson.number,
    type: 'matching',
    prompt: 'Match the grammar point to its meaning.',
    leftItems: pairs.map((item) => item.left),
    rightItems: pairs.map((item) => item.right),
    correctPairs: pairs.map((item) => ({ left: item.left, right: item.right })),
    explanation: `This matches the grammar patterns introduced in lesson ${lesson.number}.`,
    difficulty: 'intermediate',
  };
}

function buildTranslationQuestion(lesson) {
  const item = randomFrom(TRANSLATION_PROMPTS.filter((entry) => entry.lesson <= lesson.number));
  return {
    id: `lesson-${lesson.number}-translation-${Math.random().toString(36).slice(2, 8)}`,
    lesson: lesson.number,
    type: 'translation',
    prompt: `Translate this into Japanese: “${item.english}”`,
    englishText: item.english,
    correctAnswer: item.japanese,
    acceptedAnswers: [item.japanese],
    explanation: `This sentence uses the grammar patterns from lesson ${lesson.number}.`,
    difficulty: 'intermediate',
  };
}

function buildComprehensionQuestion(lesson) {
  const sentence = `わたしは ${lesson.title.toLowerCase()} を しっています。`;
  return {
    id: `lesson-${lesson.number}-comprehension-${Math.random().toString(36).slice(2, 8)}`,
    lesson: lesson.number,
    type: 'comprehension',
    prompt: `Choose the best meaning for: “${sentence}”`,
    choices: [
      `I know ${lesson.title.toLowerCase()}.`,
      `I want to learn ${lesson.title.toLowerCase()}.`,
      `I am going to ${lesson.title.toLowerCase()}.`,
    ],
    correctAnswer: `I know ${lesson.title.toLowerCase()}.`,
    explanation: `This comprehension question checks lesson ${lesson.number} content.`,
    difficulty: 'intermediate',
  };
}

export function buildGrammarAssessment({ maxLesson = 1, count = 10 } = {}) {
  const safeMaxLesson = Math.min(Math.max(Number(maxLesson) || 1, 1), GENKI_GRAMMAR_LESSONS.length);
  const safeCount = clampCount(count);
  const availableLessons = GENKI_GRAMMAR_LESSONS.filter((lesson) => lesson.number <= safeMaxLesson);

  if (availableLessons.length === 0) {
    return [];
  }

  const builders = [
    buildMultipleChoiceQuestion,
    buildFillInBlankQuestion,
    buildMatchingQuestion,
    buildTranslationQuestion,
    buildComprehensionQuestion,
  ];

  const items = [];

  for (let index = 0; index < safeCount; index += 1) {
    const lesson = availableLessons[index % availableLessons.length];
    const builder = builders[index % builders.length];
    const question = builder(lesson);
    if (question) items.push(question);
  }

  return items.slice(0, safeCount).map((item) => ({
    ...item,
    type: QUESTION_TYPES.includes(item.type) ? item.type : 'multiple-choice',
  }));
}

export function getGenkiGrammarLessonMeta(maxLesson = 12) {
  const safeMaxLesson = Math.min(Math.max(Number(maxLesson) || 12, 1), GENKI_GRAMMAR_LESSONS.length);
  return GENKI_GRAMMAR_LESSONS.filter((lesson) => lesson.number <= safeMaxLesson);
}

export function resolveGeminiModel(modelName) {
  const candidates = new Set([
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-pro',
  ]);

  const normalized = typeof modelName === 'string' ? modelName.trim() : '';
  return normalized && candidates.has(normalized) ? normalized : FALLBACK_GEMINI_MODEL;
}

export function createGeminiPrompt({ maxLesson = 12, count = 10 } = {}) {
  return [
    'You are generating a Genki Volume 1 grammar assessment for Japanese learners.',
    `Only use grammar concepts from lessons 1 through ${maxLesson}.`,
    `Generate 5 ${count} of questions for each type and 2 for matching type question in valid JSON only.`,
    'Please do not use Kanji characters in any of the questions.',
    'If the correctAnswer is in Japanese, please provide correctAnswerRomaji for each question which contains the romaji representation of the correctAnswer.',
    'Use question types from: multiple-choice, fill-in-the-blank, matching, translation, comprehension.',
    'For translation items, the user sees an English sentence and must provide a Japanese answer.',
    'Return a JSON object with a top-level "questions" array.',
    'Each question must include: id, lesson, type, prompt, explanation, difficulty.',
    'For multiple-choice: include choices and correctAnswer.',
    'For fill-in-the-blank: include correctAnswer and acceptedAnswers if useful.',
    'For matching: include leftItems, rightItems, and correctPairs.',
    'For translation: include englishText, correctAnswer, and acceptedAnswers.',
    'For comprehension: include choices and correctAnswer.',
    'Keep all content aligned to Genki Volume 1 only.',
    'Do not include markdown fences or extra commentary.',
  ].join('\n');
}

function normalizeQuestion(item, index) {
  const type = QUESTION_TYPES.includes(item?.type) ? item.type : 'multiple-choice';

  return {
    id: item?.id || `generated-${index + 1}`,
    lesson: Number(item?.lesson ?? 1),
    type,
    prompt: item?.prompt || 'Answer the question below.',
    explanation: item?.explanation || 'Review the relevant Genki grammar point.',
    difficulty: item?.difficulty || 'intermediate',
    ...(typeof item?.choices !== 'undefined' ? { choices: Array.isArray(item.choices) ? item.choices.slice(0, 6) : [] } : {}),
    ...(typeof item?.correctAnswer !== 'undefined' ? { correctAnswer: item.correctAnswer } : {}),
    ...(typeof item?.correctAnswerRomaji !== 'undefined' ? { correctAnswerRomaji: item.correctAnswerRomaji } : {}),
    ...(typeof item?.acceptedAnswers !== 'undefined' ? { acceptedAnswers: Array.isArray(item.acceptedAnswers) ? item.acceptedAnswers : [item.correctAnswer] } : {}),
    ...(typeof item?.leftItems !== 'undefined' ? { leftItems: item.leftItems } : {}),
    ...(typeof item?.rightItems !== 'undefined' ? { rightItems: item.rightItems } : {}),
    ...(typeof item?.correctPairs !== 'undefined' ? { correctPairs: item.correctPairs } : {}),
    ...(typeof item?.englishText !== 'undefined' ? { englishText: item.englishText } : {}),
  };
}

function parseGeminiAssessment(rawText) {
  if (!rawText) {
    return [];
  }

  const cleaned = rawText.trim();
  const source = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    const parsed = JSON.parse(source);
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
    console.log("questions:", questions);
    return questions.map((item, index) => normalizeQuestion(item, index));
  } catch (error) {
    console.error('Unable to parse Gemini response as JSON:', error);
    return [];
  }
}

export async function generateGrammarAssessment({ maxLesson = 1, count = 10 } = {}) {
  const safeMaxLesson = Math.min(Math.max(Number(maxLesson) || 1, 1), GENKI_GRAMMAR_LESSONS.length);
  const safeCount = clampCount(count);

  if (!GEMINI_API_KEY) {
    return buildGrammarAssessment({ maxLesson: safeMaxLesson, count: safeCount });
  }

  try {
    const prompt = createGeminiPrompt({ maxLesson: safeMaxLesson, count: safeCount });
    const resolvedModel = resolveGeminiModel(GEMINI_MODEL);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '';
    const questions = parseGeminiAssessment(text);

    if (questions.length === 0) {
      return buildGrammarAssessment({ maxLesson: safeMaxLesson, count: safeCount });
    }

    return questions;
  } catch (error) {
    console.error('Gemini generation failed; falling back to local template assessment:', error);
    return buildGrammarAssessment({ maxLesson: safeMaxLesson, count: safeCount });
  }
}
