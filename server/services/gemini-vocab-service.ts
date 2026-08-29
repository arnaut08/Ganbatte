import { z } from 'zod';
import { FALLBACK_GEMINI_MODEL, GEMINI_API_KEY, GEMINI_MODEL } from '../config/env.js';
import { resolveGeminiModel } from './genki-grammar-service.js';

export const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export type JlptLevel = typeof JLPT_LEVELS[number];

export const VOCAB_POS = [
  'noun', 'verb', 'i_adj', 'na_adj', 'adverb', 'particle', 'counter',
  'expression', 'conjunction', 'prefix', 'suffix',
] as const;

export const N5_CURRICULUM_STAGES = [
  { stage: 1, theme: 'Greetings & Classroom', focus: 'Basic greetings, courtesy phrases, classroom objects, instructions' },
  { stage: 2, theme: 'Numbers & Time', focus: 'Numbers 1-100, hours, minutes, time words (now, today, tomorrow, yesterday)' },
  { stage: 3, theme: 'Days, Months & Calendar', focus: 'Days of the week, dates of the month, seasons, relative time words' },
  { stage: 4, theme: 'People & Family', focus: 'Family members (own vs others), people descriptions, pronouns' },
  { stage: 5, theme: 'Basic Daily Verbs', focus: 'Eating, drinking, sleeping, waking up, reading, seeing, listening' },
  { stage: 6, theme: 'Movement & Places', focus: 'Going, coming, returning, station, school, home, park, hospital' },
  { stage: 7, theme: 'Food & Dining', focus: 'Meals, common food items, beverages, restaurant terms' },
  { stage: 8, theme: 'Shopping & Basic Nouns', focus: 'Prices, store items, clothing, money, everyday objects' },
  { stage: 9, theme: 'Adjectives (I-Adjectives)', focus: 'Physical attributes, sizes, colors, temperature, basic feelings' },
  { stage: 10, theme: 'Adjectives (Na-Adjectives)', focus: 'Likes, dislikes, skills, states, convenience, cleanliness' },
  { stage: 11, theme: 'Home & Daily Objects', focus: 'Furniture, electronics, rooms, household items' },
  { stage: 12, theme: 'Transportation & Travel', focus: 'Train, bus, car, airplane, tickets, directions (left, right, north)' },
  { stage: 13, theme: 'Counters & Quantifiers', focus: 'General counters (一つ), people, thin items, books, small animals' },
  { stage: 14, theme: 'Work & School Life', focus: 'Job titles, company, homework, tests, subjects, meetings' },
  { stage: 15, theme: 'Leisure & Hobbies', focus: 'Sports, music, movies, travel, reading, photography' },
  { stage: 16, theme: 'Weather & Nature', focus: 'Rain, snow, wind, sky, sun, sea, mountain, weather conditions' },
  { stage: 17, theme: 'Body & Health', focus: 'Body parts, illness, medicine, hospital, physical sensations' },
  { stage: 18, theme: 'Giving & Receiving Verbs', focus: 'Ageru, kureru, morau, borrowing, lending, teaching, learning' },
  { stage: 19, theme: 'Transitive & Intransitive Pairs', focus: 'Open/close, turn on/off, enter/put in, start/end' },
  { stage: 20, theme: 'Adverbs & Degree Words', focus: 'Often, sometimes, rarely, very, a little, completely, together' },
  { stage: 21, theme: 'Conjunctions & Transitions', focus: 'And, but, because, therefore, then, however' },
  { stage: 22, theme: 'Position & Spatial Relations', focus: 'Inside, outside, top, bottom, next to, between, front, back' },
  { stage: 23, theme: 'Colors, Shapes & Appearance', focus: 'Color nouns/adjectives, shapes, patterns, visual traits' },
  { stage: 24, theme: 'Communication & Technology', focus: 'Phone, email, internet, letters, talking, answering' },
  { stage: 25, theme: 'Feelings & States of Mind', focus: 'Emotions, wanting to do, tiredness, worry, surprise' },
  { stage: 26, theme: 'Town & Community Facilities', focus: 'Post office, bank, library, police box, convenience store' },
  { stage: 27, theme: 'Clothing & Accessories', focus: 'Wearing verbs (kiru, haku, kaburu, tsukeru), clothes items' },
  { stage: 28, theme: 'Common Expressions & Idioms', focus: 'Thank yous, apologies, requests, conversational fillers' },
] as const;

const vocabItemSchema = z.object({
  kanji: z.string().trim().min(1),
  kana: z.string().trim().min(1),
  furigana: z.string().trim().min(1),
  english: z.array(z.string().trim().min(1)).min(1),
  theme: z.string().trim().min(1),
  stage_number: z.number().int().positive(),
  pos: z.enum(VOCAB_POS),
  metadata: z.object({
    verb_group: z.enum(['ichidan', 'godan', 'irregular']).nullable().optional(),
    transitivity: z.enum(['transitive', 'intransitive']).nullable().optional(),
    textbook_reference: z.string().nullable().optional(),
    nuance: z.string().nullable().optional(),
  }).default({}),
  examples: z.array(z.object({
    ja: z.string().trim().min(1),
    en: z.string().trim().min(1),
    furigana: z.string().trim().min(1),
  })).min(1),
});

export type VocabItem = z.infer<typeof vocabItemSchema>;

export interface GenerateVocabStageOptions {
  level: JlptLevel;
  model?: string;
  stageNumber: number;
  totalStages?: number;
  theme: string;
  focusAreas?: string;
  targetCount?: number;
}

const responseSchema = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      kanji: { type: 'STRING' },
      kana: { type: 'STRING' },
      furigana: { type: 'STRING' },
      english: { type: 'ARRAY', items: { type: 'STRING' } },
      theme: { type: 'STRING' },
      stage_number: { type: 'INTEGER' },
      pos: { type: 'STRING', enum: [...VOCAB_POS] },
      metadata: {
        type: 'OBJECT',
        properties: {
          verb_group: { type: 'STRING', enum: ['ichidan', 'godan', 'irregular'], nullable: true },
          transitivity: { type: 'STRING', enum: ['transitive', 'intransitive'], nullable: true },
          textbook_reference: { type: 'STRING', nullable: true },
          nuance: { type: 'STRING', nullable: true },
        },
      },
      examples: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            ja: { type: 'STRING' },
            en: { type: 'STRING' },
            furigana: { type: 'STRING' },
          },
          required: ['ja', 'en', 'furigana'],
        },
      },
    },
    required: ['kanji', 'kana', 'furigana', 'theme', 'stage_number', 'english', 'pos', 'examples'],
  },
} as const;

function extractJsonArray(source: string): string | null {
  const start = source.indexOf('[');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === '[') depth += 1;
    else if (character === ']') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  return null;
}

export function createStageVocabPrompt({
  level,
  stageNumber,
  totalStages = 28,
  theme,
  focusAreas,
  targetCount = 25,
}: GenerateVocabStageOptions): string {
  return [
    `You are an expert Japanese curriculum designer building the official JLPT ${level} curriculum.`,
    `Generate all essential ${level} vocabulary belonging to Stage ${stageNumber} of ${totalStages}.`,
    `Stage Theme: "${theme}". ${focusAreas ? `Focus Topics: ${focusAreas}.` : ''}`,
    `Generate approximately ${targetCount} comprehensive, non-duplicate vocabulary items for this stage.`,
    `Rules:`,
    `1. Use ${level} as a strict upper difficulty boundary.`,
    `2. Furigana Syntax: Apply bracket notation only to Kanji (e.g. 食[た]べる, 私[わたし], 学校[がっこう]). Kana-only words should have no brackets.`,
    `3. Consistency: 'kanji', 'kana', and 'furigana' must match. If a word has no common kanji, set 'kanji' equal to 'kana'.`,
    `4. Stage Metadata: Set 'stage_number' to ${stageNumber} and 'theme' to "${theme}" across all items in this batch.`,
    `5. POS must be one of: ${VOCAB_POS.join(', ')}. Populate metadata (verb_group, transitivity, textbook_reference) when applicable, otherwise use null.`,
    `6. Provide 2 natural example sentences per item with 'ja', 'en', and 'furigana'.`,
    `Return a valid JSON array matching the schema only.`,
  ].filter(Boolean).join('\n');
}

export function normalizeVocabBatch(rawText: string): VocabItem[] {
  const source = extractJsonArray(rawText);
  if (!source) throw new Error('Gemini returned incomplete vocabulary JSON');

  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error('Gemini returned invalid vocabulary JSON');
  }

  const result = z.array(vocabItemSchema).safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`Invalid vocabulary at ${issue?.path?.join('.') || 'response'}: ${issue?.message}`);
  }
  return result.data;
}

export async function generateStageVocab(
  options: GenerateVocabStageOptions,
  { fetchImpl = fetch }: { fetchImpl?: typeof fetch } = {},
): Promise<VocabItem[]> {
  if (!JLPT_LEVELS.includes(options.level)) {
    throw new Error(`Unsupported JLPT level: ${options.level}`);
  }
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required to generate vocabulary');

  const model = resolveGeminiModel(options.model ?? GEMINI_MODEL) || FALLBACK_GEMINI_MODEL;
  const prompt = createStageVocabPrompt(options);

  const response = await fetchImpl(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.2,
          maxOutputTokens: 32768,
        },
      }),
    },
  );

  if (!response.ok) throw new Error(`Gemini API returned ${response.status}`);
  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  return normalizeVocabBatch(text);
}