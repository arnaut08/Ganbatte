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
    'You are an expert Japanese teacher creating assessments strictly following Genki Volume 1',
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
    // const response = await fetch(
    //   `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${GEMINI_API_KEY}`,
    //   {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       contents: [{
    //         role: 'user',
    //         parts: [{ text: prompt }],
    //       }],
    //       generationConfig: {
    //         temperature: 0.1,
    //         responseMimeType: 'application/json',
    //       },
    //     }),
    //   },
    // );

    // if (!response.ok) {
    //   throw new Error(`Gemini API returned ${response.status}`);
    // }

    // const payload = await response.json();
    const payload = {
      "candidates": [
        {
          "content": {
            "parts": [
              {
                "text": "{\n  \"questions\": [\n    {\n      \"id\": 1,\n      \"lesson\": 1,\n      \"type\": \"multiple-choice\",\n      \"prompt\": \"Choose the correct particle to complete the sentence: 'わたし [ ] たなかです。' (I am Tanaka.)\",\n      \"choices\": [\n        \"は\",\n        \"が\",\n        \"を\",\n        \"に\"\n      ],\n      \"correctAnswer\": \"は\",\n      \"correctAnswerRomaji\": \"wa\",\n      \"explanation\": \"In Japanese, the topic marker particle 'は' (pronounced 'wa') is used to mark the topic of the sentence.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 2,\n      \"lesson\": 1,\n      \"type\": \"multiple-choice\",\n      \"prompt\": \"Choose the correct particle to turn this sentence into a question: 'りゅうがくせいですか [ ]' (Are you an international student?)\",\n      \"choices\": [\n        \"ね\",\n        \"よ\",\n        \"か\",\n        \"は\"\n      ],\n      \"correctAnswer\": \"か\",\n      \"correctAnswerRomaji\": \"ka\",\n      \"explanation\": \"The particle 'か' is placed at the end of a sentence to turn it into a question.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 3,\n      \"lesson\": 2,\n      \"type\": \"multiple-choice\",\n      \"prompt\": \"Which word means 'this one' (item close to the speaker)?\",\n      \"choices\": [\n        \"それ\",\n        \"あれ\",\n        \"これ\",\n        \"どれ\"\n      ],\n      \"correctAnswer\": \"これ\",\n      \"correctAnswerRomaji\": \"kore\",\n      \"explanation\": \"'これ' refers to an object close to the speaker.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 4,\n      \"lesson\": 2,\n      \"type\": \"multiple-choice\",\n      \"prompt\": \"Choose the correct words to say 'that watch (near you)'.\",\n      \"choices\": [\n        \"このとけい\",\n        \"そのとけい\",\n        \"あのとけい\",\n        \"どのとけい\"\n      ],\n      \"correctAnswer\": \"そのとけい\",\n      \"correctAnswerRomaji\": \"sono tokei\",\n      \"explanation\": \"'その' is used for nouns close to the listener. 'とけい' means watch.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 5,\n      \"lesson\": 1,\n      \"type\": \"multiple-choice\",\n      \"prompt\": \"How do you say '19 years old' in Japanese?\",\n      \"choices\": [\n        \"じゅうきゅうさい\",\n        \"じゅうきゅうさん\",\n        \"じゅうさい\",\n        \"きゅうじゅうさい\"\n      ],\n      \"correctAnswer\": \"じゅうきゅうさい\",\n      \"correctAnswerRomaji\": \"juukyuusai\",\n      \"explanation\": \"'じゅうきゅう' is 19, and 'さい' is the counter for years of age.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 6,\n      \"lesson\": 1,\n      \"type\": \"fill-in-the-blank\",\n      \"prompt\": \"Fill in the missing particle: 'たなかさん [ ] でんわばんごう' (Tanaka-san's phone number)\",\n      \"correctAnswer\": \"の\",\n      \"acceptedAnswers\": [\n        \"の\"\n      ],\n      \"correctAnswerRomaji\": \"no\",\n      \"explanation\": \"The particle 'の' connects two nouns, showing possession or association.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 7,\n      \"lesson\": 2,\n      \"type\": \"fill-in-the-blank\",\n      \"prompt\": \"Fill in the particle to mean 'also': 'たなかさんはにほんじんです。わたし [ ] にほんじんです。'\",\n      \"correctAnswer\": \"も\",\n      \"acceptedAnswers\": [\n        \"も\"\n      ],\n      \"correctAnswerRomaji\": \"mo\",\n      \"explanation\": \"The particle 'も' replaces 'は' to mean 'also' or 'too'.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 8,\n      \"lesson\": 2,\n      \"type\": \"fill-in-the-blank\",\n      \"prompt\": \"Fill in the blank with the word for 'whose': 'これは [ ] のかさですか。'\",\n      \"correctAnswer\": \"だれ\",\n      \"acceptedAnswers\": [\n        \"だれ\"\n      ],\n      \"correctAnswerRomaji\": \"dare\",\n      \"explanation\": \"'だれの' means 'whose'. 'だれ' means 'who'.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 9,\n      \"lesson\": 2,\n      \"type\": \"fill-in-the-blank\",\n      \"prompt\": \"Fill in the blank to complete the negative statement: 'わたしはがくせい [ ]。' (I am not a student.)\",\n      \"correctAnswer\": \"じゃないです\",\n      \"acceptedAnswers\": [\n        \"じゃないです\",\n        \"じゃありません\"\n      ],\n      \"correctAnswerRomaji\": \"janai desu\",\n      \"explanation\": \"In Genki Lesson 2, 'じゃないです' or 'じゃありません' is used to negate a noun predicate.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 10,\n      \"lesson\": 1,\n      \"type\": \"fill-in-the-blank\",\n      \"prompt\": \"Complete the time 'half past two (2:30)': 'にじ [ ]'\",\n      \"correctAnswer\": \"はん\",\n      \"acceptedAnswers\": [\n        \"はん\"\n      ],\n      \"correctAnswerRomaji\": \"han\",\n      \"explanation\": \"'はん' means half, used after the hour counter 'じ' to indicate half-past.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 11,\n      \"lesson\": 2,\n      \"type\": \"matching\",\n      \"prompt\": \"Match the Japanese written numbers with their Arabic numeral equivalents.\",\n      \"leftItems\": [\n        \"さんびゃく\",\n        \"ごせん\",\n        \"にまん\",\n        \"ななひゃく\"\n      ],\n      \"rightItems\": [\n        \"300\",\n        \"5,000\",\n        \"20,000\",\n        \"700\"\n      ],\n      \"correctPairs\": {\n        \"さんびゃく\": \"300\",\n        \"ごせん\": \"5,000\",\n        \"にまん\": \"20,000\",\n        \"ななひゃく\": \"700\"\n      },\n      \"explanation\": \"さんびゃく = 300, ごせん = 5000, にまん = 20000, ななひゃく = 700.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 12,\n      \"lesson\": 1,\n      \"type\": \"matching\",\n      \"prompt\": \"Match the Japanese vocabulary words with their English translations.\",\n      \"leftItems\": [\n        \"せんせい\",\n        \"がくせい\",\n        \"ともだち\",\n        \"しゅくだい\"\n      ],\n      \"rightItems\": [\n        \"teacher\",\n        \"student\",\n        \"friend\",\n        \"homework\"\n      ],\n      \"correctPairs\": {\n        \"せんせい\": \"teacher\",\n        \"がくせい\": \"student\",\n        \"ともだち\": \"friend\",\n        \"しゅくだい\": \"homework\"\n      },\n      \"explanation\": \"These are core vocabulary words from Lesson 1.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 13,\n      \"lesson\": 2,\n      \"type\": \"matching\",\n      \"prompt\": \"Match the demonstrative pronouns with their meanings.\",\n      \"leftItems\": [\n        \"これ\",\n        \"それ\",\n        \"あれ\",\n        \"どれ\"\n      ],\n      \"rightItems\": [\n        \"this one\",\n        \"that one\",\n        \"that one over there\",\n        \"which one\"\n      ],\n      \"correctPairs\": {\n        \"これ\": \"this one\",\n        \"それ\": \"that one\",\n        \"あれ\": \"that one over there\",\n        \"どれ\": \"which one\"\n      },\n      \"explanation\": \"This represents the ko-so-a-do system introduced in Lesson 2.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 14,\n      \"lesson\": 1,\n      \"type\": \"matching\",\n      \"prompt\": \"Match the hours with their correct Japanese pronunciation.\",\n      \"leftItems\": [\n        \"よじ\",\n        \"くじ\",\n        \"しちじ\",\n        \"いちじ\"\n      ],\n      \"rightItems\": [\n        \"4:00\",\n        \"9:00\",\n        \"7:00\",\n        \"1:00\"\n      ],\n      \"correctPairs\": {\n        \"よじ\": \"4:00\",\n        \"くじ\": \"9:00\",\n        \"しちじ\": \"7:00\",\n        \"いちじ\": \"1:00\"\n      },\n      \"explanation\": \"Note the irregular readings for 4:00 (よじ), 7:00 (しちじ), and 9:00 (くじ).\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 15,\n      \"lesson\": 1,\n      \"type\": \"matching\",\n      \"prompt\": \"Match the country with its nationality word.\",\n      \"leftItems\": [\n        \"あめりか\",\n        \"にほん\",\n        \"ちゅうごく\",\n        \"かんこく\"\n      ],\n      \"rightItems\": [\n        \"あめりかじん\",\n        \"にほんじん\",\n        \"ちゅうごくじん\",\n        \"かんこくじん\"\n      ],\n      \"correctPairs\": {\n        \"あめりか\": \"あめりかじん\",\n        \"にほん\": \"にほんじん\",\n        \"ちゅうごく\": \"ちゅうごくじん\",\n        \"かんこく\": \"かんこくじん\"\n      },\n      \"explanation\": \"Adding -じん to a country name represents a person of that nationality.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 16,\n      \"lesson\": 1,\n      \"type\": \"translation\",\n      \"prompt\": \"Translate this sentence into Japanese: 'I am a college student.'\",\n      \"englishText\": \"I am a college student.\",\n      \"correctAnswer\": \"わたしはだいがくせいです。\",\n      \"acceptedAnswers\": [\n        \"わたしはだいがくせいです\",\n        \"わたしはだいがくせいです。\"\n      ],\n      \"correctAnswerRomaji\": \"watashi wa daigakusei desu.\",\n      \"explanation\": \"'わたし' is I, 'だいがくせい' is college student, and 'です' is the copula 'to be'.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 17,\n      \"lesson\": 2,\n      \"type\": \"translation\",\n      \"prompt\": \"Translate this sentence into Japanese: 'How much is this?'\",\n      \"englishText\": \"How much is this?\",\n      \"correctAnswer\": \"これはいくらですか。\",\n      \"acceptedAnswers\": [\n        \"これはいくらですか\",\n        \"これはいくらですか。\"\n      ],\n      \"correctAnswerRomaji\": \"kore wa ikura desu ka.\",\n      \"explanation\": \"'これ' is this, 'いくら' is how much, and 'か' is the question particle.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 18,\n      \"lesson\": 2,\n      \"type\": \"translation\",\n      \"prompt\": \"Translate this sentence into Japanese: 'This is my umbrella.'\",\n      \"englishText\": \"This is my umbrella.\",\n      \"correctAnswer\": \"これはわたしのかさです。\",\n      \"acceptedAnswers\": [\n        \"これはわたしのかさです\",\n        \"これはわたしのかさです。\"\n      ],\n      \"correctAnswerRomaji\": \"kore wa watashi no kasa desu.\",\n      \"explanation\": \"'かさ' means umbrella, 'わたしの' means my, and 'これ' is this.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 19,\n      \"lesson\": 1,\n      \"type\": \"translation\",\n      \"prompt\": \"Translate this sentence into Japanese: 'Mary is an American.'\",\n      \"englishText\": \"Mary is an American.\",\n      \"correctAnswer\": \"めありーさんはあめりかじんです。\",\n      \"acceptedAnswers\": [\n        \"めありーさんはあめりかじんです\",\n        \"めありーさんはあめりかじんです。\"\n      ],\n      \"correctAnswerRomaji\": \"mearii san wa amerika jin desu.\",\n      \"explanation\": \"'めありーさん' is Mary (written in Katakana typically, but here in hiragana for simplicity), 'あめりかじん' is American.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 20,\n      \"lesson\": 2,\n      \"type\": \"translation\",\n      \"prompt\": \"Translate this sentence into Japanese: 'Whose book is that (over there)?'\",\n      \"englishText\": \"Whose book is that (over there)?\",\n      \"correctAnswer\": \"あれはだれのほんですか。\",\n      \"acceptedAnswers\": [\n        \"あれはだれのほんですか\",\n        \"あれはだれのほんですか。\"\n      ],\n      \"correctAnswerRomaji\": \"are wa dare no hon desu ka.\",\n      \"explanation\": \"'あれ' is 'that over there', 'だれの' is 'whose', and 'ほん' is 'book'.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 21,\n      \"lesson\": 1,\n      \"type\": \"comprehension\",\n      \"prompt\": \"Read the dialog and answer the question:\\nたなか: めありーさんのせんもんはなんですか。\\nめありー: わたしはにほんごのせんせいです。せんもんはれきしです。\\n\\nQuestion: What is Mary's major?\",\n      \"choices\": [\n        \"Japanese\",\n        \"History\",\n        \"English\",\n        \"Economics\"\n      ],\n      \"correctAnswer\": \"History\",\n      \"explanation\": \"Mary says 'せんもんはれきしです' which means 'My major is history' (れきし).\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 22,\n      \"lesson\": 2,\n      \"type\": \"comprehension\",\n      \"prompt\": \"Read the dialog and answer the question:\\nたなか: このとけいはいくらですか。\\nみせのひと: そのとけいはさんぜんごひゃくえんです。\\n\\nQuestion: How much is the watch?\",\n      \"choices\": [\n        \"300 yen\",\n        \"3,500 yen\",\n        \"35,000 yen\",\n        \"30,500 yen\"\n      ],\n      \"correctAnswer\": \"3,500 yen\",\n      \"explanation\": \"The shop assistant (みせのひと) says 'さんぜんごひゃくえん' which is 3,500 yen (さんぜん = 3000, ごひゃく = 500).\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 23,\n      \"lesson\": 2,\n      \"type\": \"comprehension\",\n      \"prompt\": \"Read the dialog and answer the question:\\nけん: あれはだれのぼうしですか。\\nゆい: あれはたなかさんのぼうしです。\\n\\nQuestion: Whose hat is that over there?\",\n      \"choices\": [\n        \"Ken's\",\n        \"Yui's\",\n        \"Tanaka's\",\n        \"The teacher's\"\n      ],\n      \"correctAnswer\": \"Tanaka's\",\n      \"explanation\": \"Yui replies 'あれはたなかさんのぼうしです' which means 'That over there is Tanaka-san's hat'.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 24,\n      \"lesson\": 1,\n      \"type\": \"comprehension\",\n      \"prompt\": \"Read the dialog and answer the question:\\nすー: じょんさんはあめりかじんですか。\\nじょん: いいえ、わたしはあめりかじんじゃないです。いぎりすじんです。\\n\\nQuestion: What is John's nationality?\",\n      \"choices\": [\n        \"American\",\n        \"British\",\n        \"Japanese\",\n        \"Korean\"\n      ],\n      \"correctAnswer\": \"British\",\n      \"explanation\": \"John says 'いいえ、わたしはあめりかじんじゃないです。いぎりすじんです。' (No, I'm not American. I'm British/English [いぎりすじん]).\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 25,\n      \"lesson\": 1,\n      \"type\": \"comprehension\",\n      \"prompt\": \"Read the dialog and answer the question:\\nりー: いまなんじですか。\\nたなか: よじはんですよ。\\n\\nQuestion: What time is it?\",\n      \"choices\": [\n        \"4:30\",\n        \"4:00\",\n        \"3:30\",\n        \"9:30\"\n      ],\n      \"correctAnswer\": \"4:30\",\n      \"explanation\": \"Tanaka says 'よじはん' which means 4 (よじ) + half-past (はん) = 4:30.\",\n      \"difficulty\": \"medium\"\n    }\n  ]\n}",
                "thoughtSignature": "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"
              }
            ],
            "role": "model"
          },
          "finishReason": "STOP",
          "index": 0
        }
      ],
      "usageMetadata": {
        "promptTokenCount": 234,
        "candidatesTokenCount": 4297,
        "totalTokenCount": 10965,
        "promptTokensDetails": [
          {
            "modality": "TEXT",
            "tokenCount": 234
          }
        ],
        "thoughtsTokenCount": 6434,
        "serviceTier": "standard"
      },
      "modelVersion": "gemini-3.5-flash",
      "responseId": "MnyFau_iOdflg8UP1t-_oQo"
    };
    const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '';
    const questions = parseGeminiAssessment(text);

    if (questions.length === 0) {
      return buildGrammarAssessment({ maxLesson: safeMaxLesson, count: safeCount });
    }

    return questions.slice(4, 7);
  } catch (error) {
    console.error('Gemini generation failed; falling back to local template assessment:', error);
    return buildGrammarAssessment({ maxLesson: safeMaxLesson, count: safeCount });
  }
}
