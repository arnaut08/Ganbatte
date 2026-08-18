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
    'If the correctAnswer is in Japanese, please provide correctAnswerRomaji which contains the romaji representation of the correctAnswer.',
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
    // const resolvedModel = resolveGeminiModel(GEMINI_MODEL);
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
    //         responseMimeType: 'application/json',
    //       },
    //     }),
    //   },
    // );

    // if (!response.ok) {
    //   throw new Error(`Gemini API returned ${response.status}`);
    // }

    // const payload = await response.json();
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Simulate network delay
    const tempPayload = {
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": `{\n  \"questions\": [\n    {\n      \"id\": 1,\n      \"lesson\": 1,\n      \"type\": \"multiple-choice\",\n      \"prompt\": \"Which particle is used to indicate possession (e.g., 'Mary's bag')?\",\n      \"choices\": [\"は\", \"の\", \"も\", \"です\"],\n      \"correctAnswer\": \"の\",\n      \"explanation\": \"The particle 'no' is used to connect two nouns and show possession or association.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 2,\n      \"lesson\": 1,\n      \"type\": \"multiple-choice\",\n      \"prompt\": \"What is the correct way to say 'It is 7:00'?\",\n      \"choices\": [\"しちじです\", \"ななじです\", \"じゅうじです\", \"くじです\"],\n      \"correctAnswer\": \"しちじです\",\n      \"explanation\": \"In Japanese, 7 o'clock is specifically read as 'shichiji'.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 3,\n      \"lesson\": 1,\n      \"type\": \"multiple-choice\",\n      \"prompt\": \"Which expression is appropriate for asking someone's major?\",\n      \"choices\": [\"お名前は何ですか\", \"専攻は何ですか\", \"何年生ですか\", \"おいくつですか\"],\n      \"correctAnswer\": \"専攻は何ですか\",\n      \"explanation\": \"'Senkou' means major. 'Senkou wa nan desu ka' translates to 'What is your major?'\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 4,\n      \"lesson\": 1,\n      \"type\": \"multiple-choice\",\n      \"prompt\": \"Choose the correct age for 'twenty years old'.\",\n      \"choices\": [\"にじゅうさい\", \"はたち\", \"にじゅさい\", \"にじゅう\"],\n      \"correctAnswer\": \"はたち\",\n      \"explanation\": \"20 years old is an irregular reading in Japanese, pronounced 'hatachi'.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 5,\n      \"lesson\": 1,\n      \"type\": \"multiple-choice\",\n      \"prompt\": \"What is the polite way to say 'I am a student'?\",\n      \"choices\": [\"学生です\", \"学生のです\", \"学生だ\", \"学生\"],\n      \"correctAnswer\": \"学生です\",\n      \"explanation\": \"The copula 'desu' is used to end sentences politely.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 6,\n      \"lesson\": 2,\n      \"type\": \"fill-in-the-blank\",\n      \"prompt\": \"Translate 'This is a book' into Japanese using the demonstrative pronoun: ____ です。\",\n      \"correctAnswer\": \"これ\",\n      \"acceptedAnswers\": [\"これは\"],\n      \"explanation\": \"'Kore' is used for an object close to the speaker.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 7,\n      \"lesson\": 2,\n      \"type\": \"fill-in-the-blank\",\n      \"prompt\": \"Fill in the blank for 'Is that book over there yours?': あれは ____ の本ですか。\",\n      \"correctAnswer\": \"あなた\",\n      \"acceptedAnswers\": [\"あなた\"],\n      \"explanation\": \"To make 'you' possessive, add 'no' after 'anata'.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 8,\n      \"lesson\": 2,\n      \"type\": \"fill-in-the-blank\",\n      \"prompt\": \"Translate 'That is not a dictionary': それは ____ です。\",\n      \"correctAnswer\": \"辞書じゃありません\",\n      \"acceptedAnswers\": [\"辞書ではありません\", \"辞書じゃないです\"],\n      \"explanation\": \"The negative form of 'desu' is 'ja arimasen' or 'dewa arimasen'.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 9,\n      \"lesson\": 2,\n      \"type\": \"fill-in-the-blank\",\n      \"prompt\": \"How do you say 'Which one is your umbrella?' in Japanese? ____ があなたのかさですか。\",\n      \"correctAnswer\": \"どれ\",\n      \"acceptedAnswers\": [\"どれ\"],\n      \"explanation\": \"'Dore' is the interrogative for selecting one from three or more items.\",\n      \"difficulty\": \"hard\"\n    },\n    {\n      \"id\": 10,\n      \"lesson\": 2,\n      \"type\": \"fill-in-the-blank\",\n      \"prompt\": \"Fill in the location particle: トイレは ____ です。\",\n      \"correctAnswer\": \"あそこ\",\n      \"acceptedAnswers\": [\"そこ\", \"ここ\"],\n      \"explanation\": \"Demonstratives for place: 'koko' (here), 'soko' (there), 'asoko' (over there).\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 11,\n      \"lesson\": 1,\n      \"type\": \"matching\",\n      \"prompt\": \"Match the English phrases to their Japanese equivalents.\",\n      \"leftItems\": [\"1:00\", \"3:00\", \"6:00\", \"8:00\"],\n      \"rightItems\": [\"ろくじ\", \"いちじ\", \"はちじ\", \"さんじ\"],\n      \"correctPairs\": {\n        \"1:00\": \"いちじ\",\n        \"3:00\": \"さんじ\",\n        \"6:00\": \"ろくじ\",\n        \"8:00\": \"はちじ\"\n      },\n      \"explanation\": \"Practice of hour counting in Japanese.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 12,\n      \"lesson\": 1,\n      \"type\": \"matching\",\n      \"prompt\": \"Match the school year with its Japanese term.\",\n      \"leftItems\": [\"1st year\", \"2nd year\", \"3rd year\", \"4th year\"],\n      \"rightItems\": [\"いちねんせい\", \"にねんせい\", \"さんねんせい\", \"よねんせい\"],\n      \"correctPairs\": {\n        \"1st year\": \"いちねんせい\",\n        \"2nd year\": \"にねんせい\",\n        \"3rd year\": \"さんねんせい\",\n        \"4th year\": \"よねんせい\"\n      },\n      \"explanation\": \"Years in school are expressed by adding 'nensei' to numbers.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 13,\n      \"lesson\": 2,\n      \"type\": \"matching\",\n      \"prompt\": \"Match the word to its meaning.\",\n      \"leftItems\": [\"かさ\", \"かばん\", \"ざっし\", \"とけい\"],\n      \"rightItems\": [\"Watch\", \"Magazine\", \"Bag\", \"Umbrella\"],\n      \"correctPairs\": {\n        \"かさ\": \"Umbrella\",\n        \"かばん\": \"Bag\",\n        \"ざっし\": \"Magazine\",\n        \"とけい\": \"Watch\"\n      },\n      \"explanation\": \"Vocabulary from Lesson 2 regarding items.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 14,\n      \"lesson\": 2,\n      \"type\": \"matching\",\n      \"prompt\": \"Match the price/amount to the question.\",\n      \"leftItems\": [\"いくらですか\", \"だれの\", \"どれ\", \"なんさい\"],\n      \"rightItems\": [\"How much\", \"Whose\", \"Which one\", \"How old\"],\n      \"correctPairs\": {\n        \"いくらですか\": \"How much\",\n        \"だれの\": \"Whose\",\n        \"どれ\": \"Which one\",\n        \"なんさい\": \"How old\"\n      },\n      \"explanation\": \"Common interrogatives in Genki Lesson 2.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 15,\n      \"lesson\": 2,\n      \"type\": \"matching\",\n      \"prompt\": \"Match the demonstrative to its distance.\",\n      \"leftItems\": [\"これ\", \"それ\", \"あれ\", \"どれ\"],\n      \"rightItems\": [\"That (far away)\", \"This\", \"Which one\", \"That (near you)\"],\n      \"correctPairs\": {\n        \"これ\": \"This\",\n        \"それ\": \"That (near you)\",\n        \"あれ\": \"That (far away)\",\n        \"どれ\": \"Which one\"\n      },\n      \"explanation\": \"Understanding distance-based demonstratives.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 16,\n      \"lesson\": 1,\n      \"type\": \"translation\",\n      \"englishText\": \"Who is that person?\",\n      \"correctAnswer\": \"あの人はだれですか\",\n      \"acceptedAnswers\": [\"あの方はだれですか\"],\n      \"explanation\": \"Use 'dare' for 'who' and 'no' for the modifier.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 17,\n      \"lesson\": 1,\n      \"type\": \"translation\",\n      \"englishText\": \"I am a Japanese student.\",\n      \"correctAnswer\": \"私は日本人の学生です\",\n      \"acceptedAnswers\": [\"私は日本人の学生です。\"],\n      \"explanation\": \"Connect nationality and occupation using 'no'.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 18,\n      \"lesson\": 2,\n      \"type\": \"translation\",\n      \"englishText\": \"What is this?\",\n      \"correctAnswer\": \"これは何ですか\",\n      \"acceptedAnswers\": [\"これは何ですか。\"],\n      \"explanation\": \"Basic 'kore' structure.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 19,\n      \"lesson\": 2,\n      \"type\": \"translation\",\n      \"englishText\": \"That is not a watch.\",\n      \"correctAnswer\": \"それはとけいじゃありません\",\n      \"acceptedAnswers\": [\"それはとけいではありません\"],\n      \"explanation\": \"Negative form of 'desu'.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 20,\n      \"lesson\": 2,\n      \"type\": \"translation\",\n      \"englishText\": \"This is my bag.\",\n      \"correctAnswer\": \"これは私のかばんです\",\n      \"acceptedAnswers\": [\"これは私のかばんです。\"],\n      \"explanation\": \"Use 'no' to show possession.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 21,\n      \"lesson\": 1,\n      \"type\": \"comprehension\",\n      \"prompt\": \"If Takeshi says 'Mary, nice to meet you', how does he finish the sentence?\",\n      \"choices\": [\"はじめまして\", \"おやすみなさい\", \"こんにちは\", \"ありがとう\"],\n      \"correctAnswer\": \"はじめまして\",\n      \"explanation\": \"Hajimemashite is used when meeting someone for the first time.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 22,\n      \"lesson\": 1,\n      \"type\": \"comprehension\",\n      \"prompt\": \"If someone asks 'おいくつですか', what are they asking?\",\n      \"choices\": [\"Their name\", \"Their major\", \"Their age\", \"Their phone number\"],\n      \"correctAnswer\": \"Their age\",\n      \"explanation\": \"Oikutsu desu ka is a polite way to ask someone's age.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 23,\n      \"lesson\": 2,\n      \"type\": \"comprehension\",\n      \"prompt\": \"When asking for the price of an item, what word is used?\",\n      \"choices\": [\"だれ\", \"どれ\", \"いくら\", \"なんじ\"],\n      \"correctAnswer\": \"いくら\",\n      \"explanation\": \"Ikura is used to ask for the price.\",\n      \"difficulty\": \"medium\"\n    },\n    {\n      \"id\": 24,\n      \"lesson\": 2,\n      \"type\": \"comprehension\",\n      \"prompt\": \"If an item is physically far from both the speaker and the listener, which pronoun is used?\",\n      \"choices\": [\"これ\", \"それ\", \"あれ\", \"どれ\"],\n      \"correctAnswer\": \"あれ\",\n      \"explanation\": \"Are is for objects away from both people.\",\n      \"difficulty\": \"easy\"\n    },\n    {\n      \"id\": 25,\n      \"lesson\": 2,\n      \"type\": \"comprehension\",\n      \"prompt\": \"What does the particle 'mo' indicate when replacing 'wa'?\",\n      \"choices\": [\"Also/Too\", \"Possession\", \"Question marker\", \"Topic marker\"],\n      \"correctAnswer\": \"Also/Too\",\n      \"explanation\": \"The particle 'mo' indicates inclusion, 'also' or 'too'.\",\n      \"difficulty\": \"hard\"\n    }\n  ]\n}`,
            "thoughtSignature": "El4KXAERTTIPJJGsjBv/uce89JiGJWokZS6FK/8IwMUfNPYbSANGcyBwdHIOHthkbX8OSa49HY7wTBlNUzmUpvgAMqjRABU1xhUIIde7ZxBJTtQy4s6YALWd74mMn43o"
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 191,
    "candidatesTokenCount": 787,
    "totalTokenCount": 978,
    "promptTokensDetails": [
      {
        "modality": "TEXT",
        "tokenCount": 191
      }
    ],
    "serviceTier": "standard"
  },
  "modelVersion": "gemini-3.5-flash-lite",
  "responseId": "UJ-Eap2yJ5-vg8UPkoKasAk"
}
    const text = tempPayload?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '';
    const questions = parseGeminiAssessment(text);

    if (questions.length === 0) {
      return buildGrammarAssessment({ maxLesson: safeMaxLesson, count: safeCount });
    }

    return questions.slice(7, 11);
    // return questions;
  } catch (error) {
    console.error('Gemini generation failed; falling back to local template assessment:', error);
    return buildGrammarAssessment({ maxLesson: safeMaxLesson, count: safeCount });
  }
}
