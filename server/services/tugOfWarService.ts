import { GEMINI_API_KEY, GEMINI_MODEL } from '../config/env.js';
import { fetchGeminiWithFallback } from './gemini-api-service.js';

export type TugOfWarQuestion = {
  sentence: string;
  english: string;
  options: string[];
  targetAnswer: string;
};

export type TugOfWarState = {
  momentum: number;
  currentSentence: string;
  options: string[];
  targetAnswer: string;
  hostLockoutUntil: number | null;
  guestLockoutUntil: number | null;
  winningThreshold: number;
};

const TUG_OF_WAR_QUESTION_COUNT = 25;
const WINNING_THRESHOLD = 5;

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createTugOfWarPrompt(maxLesson: number): string {
  return [
    'You are an expert Japanese language instructor teaching JLPT N5 and Genki Volume 1.',
    `Generate exactly ${TUG_OF_WAR_QUESTION_COUNT} multiple-choice grammar questions covering grammar points from Genki lessons 1 through ${maxLesson}.`,
    'STRICT CONSTRAINT: DO NOT USE ANY KANJI. The Japanese sentence, options, and targetAnswer must be written entirely and exclusively in Hiragana and Katakana.',
    'Strictly enforce a diverse mix: missing particles including は, が, を, に, and で; verb conjugations including ます, ません, ました, and て-form; adjective conjugations including い-adjective and な-adjective affirmative, negative, and past forms; and Japanese counter words.',
    'Do not make all questions particle questions. Include a balanced variety across these categories and do not repeat the same sentence pattern excessively.',
    'Every Japanese sentence must contain exactly one blank represented by the literal text "[ ? ]".',
    'Each question must have exactly four answer options, exactly one correct targetAnswer, and the targetAnswer must appear in options.',
    'Use beginner-appropriate Japanese and provide a clear English translation for every sentence.',
    'Return a strict JSON array only. Do not return markdown fences, commentary, headings, or any text outside the JSON array.',
    'Use exactly this object shape for every item: {"sentence":"... [ ? ] ...","english":"...","options":["...","...","...","..."],"targetAnswer":"..."}.',
    'Example objects:',
    '[',
    '  {"sentence":"きのう、ともだちとえいがをみ[ ? ]。","english":"I watched a movie with my friend yesterday.","options":["ました","ます","ません","ましょう"],"targetAnswer":"ました"},',
    '  {"sentence":"このパソコンはあまり[ ? ]。","english":"This computer is not very good.","options":["よくないです","いいです","よかったです","よくなかったです"],"targetAnswer":"よくないです"}',
    ']',
  ].join('\n');
}

const EMERGENCY_DECK: TugOfWarQuestion[] = [
  { sentence: 'わたし[ ? ]学生です。', english: 'I am a student.', options: ['は', 'を', 'に', 'で'], targetAnswer: 'は' },
  { sentence: '毎日、日本語を勉強し[ ? ]。', english: 'I study Japanese every day.', options: ['ます', 'ません', 'ました', 'ましょう'], targetAnswer: 'ます' },
  { sentence: '昨日、映画を見[ ? ]。', english: 'I watched a movie yesterday.', options: ['ました', 'ます', 'ません', 'ましょう'], targetAnswer: 'ました' },
  { sentence: 'この本はあまり[ ? ]です。', english: 'This book is not very interesting.', options: ['おもしろくない', 'おもしろい', 'おもしろかった', 'おもしろくなかった'], targetAnswer: 'おもしろくない' },
  { sentence: 'りんごを三[ ? ]食べました。', english: 'I ate three apples.', options: ['つ', '人', '本', '枚'], targetAnswer: 'つ' },
];

function parseJsonArray(rawText: string): unknown[] {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const parsed: unknown = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('Tug of War Gemini response was not an array.');
  return parsed;
}

function normalizeQuestion(value: unknown): TugOfWarQuestion | null {
  if (!value || typeof value !== 'object') return null;
  const question = value as Record<string, unknown>;
  const sentence = typeof question.sentence === 'string' ? question.sentence.trim() : '';
  const english = typeof question.english === 'string' ? question.english.trim() : '';
  const targetAnswer = typeof question.targetAnswer === 'string' ? question.targetAnswer.trim() : '';
  const options = Array.isArray(question.options)
    ? question.options.filter((option): option is string => typeof option === 'string').map((option) => option.trim())
    : [];

  if (!sentence.includes('[ ? ]') || !english || !targetAnswer || options.length !== 4 || !options.includes(targetAnswer)) return null;
  if (new Set(options).size !== 4) return null;
  return { sentence, english, options: shuffleArray(options), targetAnswer };
}

export async function generateDynamicTugOfWarDeck(maxLesson: number): Promise<TugOfWarQuestion[]> {
  const safeMaxLesson = Math.min(Math.max(Number(maxLesson) || 1, 1), 12);

  try {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured.');
    const { response } = await fetchGeminiWithFallback({
      model: GEMINI_MODEL,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: createTugOfWarPrompt(safeMaxLesson) }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.9 },
        }),
      },
    });
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const rawText = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    const questions = parseJsonArray(rawText).map(normalizeQuestion).filter((question): question is TugOfWarQuestion => question !== null);
    if (questions.length !== TUG_OF_WAR_QUESTION_COUNT) throw new Error(`Expected ${TUG_OF_WAR_QUESTION_COUNT} valid Tug of War questions, received ${questions.length}.`);
    return questions;
  } catch (error) {
    console.error('Tug of War Gemini deck generation failed; using emergency deck:', error);
    return EMERGENCY_DECK.map((question) => ({ ...question, options: shuffleArray(question.options) }));
  }
}

export function tugOfWarQuestionToState(question: TugOfWarQuestion, momentum = 0): TugOfWarState {
  return {
    momentum,
    currentSentence: question.sentence,
    options: shuffleArray(question.options),
    targetAnswer: question.targetAnswer,
    hostLockoutUntil: null,
    guestLockoutUntil: null,
    winningThreshold: WINNING_THRESHOLD,
  };
}
