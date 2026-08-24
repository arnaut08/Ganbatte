import { FALLBACK_GEMINI_MODEL, GEMINI_API_KEY, GEMINI_MODEL } from '../config/env.js';

export const QUESTION_TYPES = [
  'multiple-choice',
  'fill-in-the-blank',
  'matching',
  'translation',
  'comprehension',
];

export const GENKI_GRAMMAR_LESSONS = [
  {
    number: 1,
    title: 'New Friends (Greetings & Introductions)',
    grammar: ['X は Y です', 'ですか (Questions)', 'の (Possession)', 'Time & Age']
  },
  {
    number: 2,
    title: 'Shopping (Things & Demonstratives)',
    grammar: ['これ / それ / あれ / どれ', 'この / その / あの / どの', 'ここ / そこ / あそこ / どこ', 'だれの', 'も', 'じゃないです']
  },
  {
    number: 3,
    title: 'Making a Date (Basic Verbs & Time)',
    grammar: ['る/う/Irregular Verb Conjugation', '〜ます / 〜ません', 'Particles (を, で, に, へ)', '〜ませんか (Invitations)', 'Frequency Adverbs']
  },
  {
    number: 4,
    title: 'The First Date (Existence & Past Tense)',
    grammar: ['ある / いる (Existence)', 'Location Words (まえ, うしろ, etc.)', '〜ました / 〜ませんでした', 'と (Together with / And)', 'Duration & Quantity']
  },
  {
    number: 5,
    title: 'A Trip to Okinawa (Adjectives)',
    grammar: ['い-Adjectives (Conjugations)', 'な-Adjectives (Conjugations)', 'すき / きらい', '〜ましょう / 〜ましょうか', 'Degree Adverbs (すごく, ちょっと)']
  },
  {
    number: 6,
    title: "A Day in Robert's Life (Te-form & Requests)",
    grammar: ['Verb て-form Conjugation', '〜てください (Requests)', '〜てもいいですか (Permission)', '〜てはいけません (Prohibition)', '〜から (Reasons/Clauses)']
  },
  {
    number: 7,
    title: 'Family Picture (Ongoing States & Descriptions)',
    grammar: ['〜ている (Action in progress vs. State)', 'Connecting sentences with て-form', 'Body/Appearance Descriptions (A は B が...)', 'Verb Stem + に行く']
  },
  {
    number: 8,
    title: 'Barbecue (Short Forms & Thoughts)',
    grammar: ['Short Forms (Present Affirmative & Negative)', '〜と思います (Quoting Thoughts)', '〜と言っていました (Quoting Speech)', '〜ないでください (Please don\'t)', 'Verb のが好き/上手']
  },
  {
    number: 9,
    title: 'Kabuki (Past Short Forms & Explanations)',
    grammar: ['Past Tense Short Forms', 'Qualifying Nouns with Verbs (Relative Clauses)', 'まだ〜ていません (Have not yet)', '〜から (Because - informal)']
  },
  {
    number: 10,
    title: 'Winter Vacations (Comparisons)',
    grammar: ['A のほうが B より (Comparisons)', 'A と B と どちら (Which is more)', '〜の中で一番 (Superlatives)', 'Adjective + になる (To become)', 'どこかに / なにも']
  },
  {
    number: 11,
    title: 'After Vacation (Desires & Activities)',
    grammar: ['〜たいです (Want to do)', '〜たり〜たりする (Listing activities)', '〜たことがある (Past Experience)', 'Noun や Noun (Non-exhaustive list)']
  },
  {
    number: 12,
    title: 'Feeling Sick (Advice & Obligations)',
    grammar: ['〜んです (Explanatory mode)', '〜すぎる (Too much / Excess)', '〜ほうがいいです (Giving Advice)', '〜なければいけません (Must do)', '〜でしょう / 〜だろう']
  },
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

const ASSESSMENT_QUESTION_COUNTS = {
  'multiple-choice': 4,
  'fill-in-the-blank': 4,
  matching: 2,
  translation: 4,
  comprehension: 4,
};

const ASSESSMENT_QUESTION_TOTAL = Object.values(ASSESSMENT_QUESTION_COUNTS)
  .reduce((total, questionCount) => total + questionCount, 0);

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
  const eligiblePrompts = TRANSLATION_PROMPTS.filter((entry) => entry.lesson <= lesson.number);
  const item = randomFrom(eligiblePrompts.length > 0 ? eligiblePrompts : TRANSLATION_PROMPTS);
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

export function buildGrammarAssessment({ maxLesson = 1, count = 10, mode = 'practice' } = {}) {
  const safeMaxLesson = Math.min(Math.max(Number(maxLesson) || 1, 1), GENKI_GRAMMAR_LESSONS.length);
  const safeCount = clampCount(count);
  const availableLessons = GENKI_GRAMMAR_LESSONS.filter((lesson) => lesson.number <= safeMaxLesson);

  if (availableLessons.length === 0) {
    return [];
  }

  const builders = mode === 'assessment'
    ? Object.entries(ASSESSMENT_QUESTION_COUNTS).flatMap(([type, questionCount]) => {
      const builder = {
        'multiple-choice': buildMultipleChoiceQuestion,
        'fill-in-the-blank': buildFillInBlankQuestion,
        matching: buildMatchingQuestion,
        translation: buildTranslationQuestion,
        comprehension: buildComprehensionQuestion,
      }[type];
      return Array.from({ length: questionCount }, () => builder);
    })
    : [
      buildMultipleChoiceQuestion,
      buildFillInBlankQuestion,
      buildMatchingQuestion,
      buildTranslationQuestion,
      buildComprehensionQuestion,
    ];

  const items = [];

  const questionCount = mode === 'assessment' ? ASSESSMENT_QUESTION_TOTAL : safeCount;

  for (let index = 0; index < questionCount; index += 1) {
    const lesson = availableLessons[index % availableLessons.length];
    const builder = builders[index % builders.length];
    const question = builder(lesson);
    if (question) items.push(question);
  }

  return items.slice(0, questionCount).map((item) => ({
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
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
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

export function createGeminiPrompt({ maxLesson = 12, count = 10, mode = 'assessment' } = {}) {
  const questionInstructions = mode === 'assessment'
    ? `Generate exactly ${ASSESSMENT_QUESTION_TOTAL} questions total in valid JSON only: 4 multiple-choice, 4 fill-in-the-blank, 2 matching, 4 translation, and 4 comprehension questions.`
    : `Generate exactly ${count} questions total in valid JSON only, using all five question types when the requested count allows it.`;

  return [
    'You are an expert Japanese teacher creating assessments strictly following Genki Volume 1',
    `Only use grammar concepts from lessons 1 through ${maxLesson}.`,
    `Weight the distribution of questions strictly in descending order of recency: Lesson L must have strictly more questions than Lesson L-1 across the entire range from Lesson 1 up to ${maxLesson}.`,
    questionInstructions,
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
    `Please generate fresh content and avoid reusing questions in previously generated assessments.`
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
    return questions.map((item, index) => normalizeQuestion(item, index));
  } catch (error) {
    console.error('Unable to parse Gemini response as JSON:', error);
    return [];
  }
}

function hasAssessmentQuestionDistribution(questions) {
  if (questions.length !== ASSESSMENT_QUESTION_TOTAL) return false;

  const counts = questions.reduce((result, question) => ({
    ...result,
    [question.type]: (result[question.type] || 0) + 1,
  }), {});

  return Object.entries(ASSESSMENT_QUESTION_COUNTS)
    .every(([type, questionCount]) => counts[type] === questionCount);
}

export async function generateGrammarAssessment({ maxLesson = 1, count = 10, mode = 'assessment' } = {}) {
  const safeMaxLesson = Math.min(Math.max(Number(maxLesson) || 1, 1), GENKI_GRAMMAR_LESSONS.length);
  const safeCount = clampCount(count);
  const questionCount = mode === 'assessment' ? ASSESSMENT_QUESTION_TOTAL : safeCount;

  if (!GEMINI_API_KEY) {
    return buildGrammarAssessment({ maxLesson: safeMaxLesson, count: questionCount, mode });
  }

  try {
    const prompt = createGeminiPrompt({ maxLesson: safeMaxLesson, count: questionCount, mode });
    const resolvedModel = resolveGeminiModel(GEMINI_MODEL);
    console.log("Using Gemini model:", resolvedModel);
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
            temperature: 1.1, // Range 0.0 - 2.0
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

    if (questions.length === 0 || (mode === 'assessment' && !hasAssessmentQuestionDistribution(questions))) {
      return buildGrammarAssessment({ maxLesson: safeMaxLesson, count: questionCount, mode });
    }

    return questions;
  } catch (error) {
    console.error('Gemini generation failed; falling back to local template assessment:', error);
    return buildGrammarAssessment({ maxLesson: safeMaxLesson, count: questionCount, mode });
  }
}
