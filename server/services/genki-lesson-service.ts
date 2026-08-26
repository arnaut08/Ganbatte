import { z } from 'zod';
import { FALLBACK_GEMINI_MODEL, GEMINI_API_KEY, GEMINI_MODEL } from '../config/env.js';
import { GENKI_GRAMMAR_LESSONS, resolveGeminiModel } from './genki-grammar-service.js';

export const GENKI_LESSON_CONTENT_VERSION = 3;

const exampleSchema = z.object({
  japanese: z.string().trim().min(1).max(160),
  furigana: z.string().trim().max(160).optional(),
  romaji: z.string().trim().min(1).max(240),
  english: z.string().trim().min(1).max(240),
});

const practiceItemSchema = z.object({
  prompt: z.string().trim().min(1).max(320),
  answer: z.string().trim().min(1).max(320),
  explanation: z.string().trim().min(1).max(400),
});

const grammarPointSchema = z.object({
  pattern: z.string().trim().min(1).max(80),
  meaning: z.string().trim().min(1).max(240),
  formation: z.string().trim().min(1).max(1200),
  usageNotes: z.array(z.string().trim().min(1).max(320)).min(2).max(5),
  examples: z.array(exampleSchema).min(1).max(6),
});

export const genkiLessonSchema = z.object({
  lessonNumber: z.number().int().min(1).max(GENKI_GRAMMAR_LESSONS.length),
  title: z.string().trim().min(1).max(120),
  overview: z.string().trim().min(1).max(1400),
  objectives: z.array(z.string().trim().min(1).max(240)).min(2).max(8),
  grammarPoints: z.array(grammarPointSchema).min(1).max(8),
  commonMistakes: z.array(z.string().trim().min(1).max(420)).min(1).max(8),
  reviewChecklist: z.array(z.string().trim().min(1).max(240)).min(2).max(8),
  guidedPractice: z.array(practiceItemSchema).min(3).max(6),
});

type GenkiLessonMeta = typeof GENKI_GRAMMAR_LESSONS[number];
type JsonRecord = Record<string, unknown>;

function lessonMeta(lessonNumber: number): GenkiLessonMeta | null {
  return GENKI_GRAMMAR_LESSONS.find((lesson) => lesson.number === lessonNumber) || null;
}

function normalizeTextList(value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((item: unknown) => {
    if (typeof item === 'string') return item;
    if (!item || typeof item !== 'object') return item;

    const record = item as JsonRecord;
    const text = record.text || record.description || record.objective || record.item || record.mistake;
    const correction = record.correction || record.correct || record.fix || record.explanation;
    if (text && correction) return `${text} ${correction}`;
    return text || correction || record.value;
  });
}

function normalizeFormation(value: unknown): unknown {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const steps = (normalizeTextList(value) as unknown[]).filter((step: unknown) => typeof step === 'string' && step.trim());
    return steps.join(' -> ');
  }
  if (value && typeof value === 'object') {
    return normalizeFormation(
      (value as JsonRecord).steps ?? (value as JsonRecord).forms ?? (value as JsonRecord).instructions ?? (value as JsonRecord).description ?? (value as JsonRecord).text,
    );
  }
  return value;
}

function normalizeExamples(value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((example: unknown) => {
    if (!example || typeof example !== 'object') return example;

    return {
      ...(example as JsonRecord),
      japanese: (example as JsonRecord).japanese ?? (example as JsonRecord).japaneseSentence ?? (example as JsonRecord).jp,
      furigana: (example as JsonRecord).furigana ?? (example as JsonRecord).reading ?? (example as JsonRecord).japaneseReading,
      romaji: (example as JsonRecord).romaji ?? (example as JsonRecord).romanization ?? (example as JsonRecord).transliteration,
      english: (example as JsonRecord).english ?? (example as JsonRecord).translation ?? (example as JsonRecord).englishTranslation ?? (example as JsonRecord).gloss,
    };
  });
}

function normalizeGrammarPoints(value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((point: unknown) => {
    if (!point || typeof point !== 'object') return point;

    return {
      ...(point as JsonRecord),
      pattern: (point as JsonRecord).pattern ?? (point as JsonRecord).grammarPattern ?? (point as JsonRecord).grammar,
      meaning: (point as JsonRecord).meaning ?? (point as JsonRecord).explanation ?? (point as JsonRecord).use,
      formation: normalizeFormation((point as JsonRecord).formation ?? (point as JsonRecord).form ?? (point as JsonRecord).howToForm),
      usageNotes: normalizeTextList((point as JsonRecord).usageNotes ?? (point as JsonRecord).usage ?? (point as JsonRecord).notes),
      examples: normalizeExamples((point as JsonRecord).examples ?? (point as JsonRecord).exampleSentences),
    };
  });
}

export function createGenkiLessonPrompt(lessonNumber: number): string {
  const lesson = lessonMeta(lessonNumber);
  if (!lesson) throw new Error(`Unsupported Genki lesson: ${lessonNumber}`);

  return [
    'You are an expert Japanese teacher creating original study notes for Genki Volume 1.',
    `Create notes for lesson ${lesson.number}: ${lesson.title}.`,
    `The lesson scope is limited to these grammar cues: ${lesson.grammar.join(', ')}.`,
    'Use your general knowledge of Genki Volume 1, but do not reproduce textbook passages, dialogues, exercises, or answer keys.',
    'Write thorough, self-contained study notes for a beginner. The learner should be able to understand and use most of the lesson without opening the textbook. Do not introduce grammar normally taught in later Genki Volume 1 lessons.',
    'Cover every listed grammar cue and explain what it means, when it is used, how to form it, important restrictions or contrasts, and natural sentence position. Point out differences that beginners commonly confuse.',
    'Use only beginner vocabulary and kanji normally expected at JLPT N5 / early Genki Volume 1 level. Prefer hiragana and katakana when a word is not clearly N5. Do not introduce obscure kanji, advanced vocabulary, or later-lesson grammar just to make examples sound sophisticated.',
    'For each grammar point, provide 2-5 short usage notes and 3-6 original example sentences showing varied subjects, affirmative/negative forms, questions, or time contexts where appropriate. Every example must include Japanese, romaji, and an English gloss. If the Japanese contains any kanji, also include a furigana field containing the complete sentence in hiragana; if it contains no kanji, use an empty string for furigana.',
    'Write explanations in clear beginner English. When Japanese words or kanji appear inside an explanation, give their reading in parentheses or use kana instead. Do not assume the learner can read an unannotated kanji character.',
    'Include 3-6 guided practice items. Each item must have a prompt, a complete answer, and a short explanation of the grammar choice. Include a mixture of recognition, sentence building, and translation when appropriate.',
    'Make the overview a useful lesson summary rather than a one-sentence description. Include practical distinctions, register notes, and exceptions only when they are accurate and relevant to this lesson.',
    'Return valid JSON only, with no markdown fences or commentary.',
    'Return exactly this shape: lessonNumber, title, overview, objectives, grammarPoints, commonMistakes, reviewChecklist, guidedPractice.',
    'Each grammarPoints item must contain pattern, meaning, formation, usageNotes, and examples. Each example must contain japanese, furigana, romaji, and english. Each guidedPractice item must contain prompt, answer, and explanation, using N5-safe vocabulary and furigana for any kanji.',
    `The lessonNumber must be ${lesson.number} and the title must describe ${lesson.title}.`,
  ].join('\n');
}

function extractJsonObject(source: string): string | null {
  const start = source.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (character === '\\') {
        isEscaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  return null;
}

export function parseJsonResponse(rawText: string): unknown {
  const cleaned = String(rawText || '').trim();
  if (!cleaned) throw new Error('Gemini returned an empty lesson response');

  const source = extractJsonObject(cleaned);
  if (!source) throw new Error('Gemini returned incomplete lesson JSON');

  try {
    return JSON.parse(source);
  } catch {
    throw new Error('Gemini returned invalid lesson JSON');
  }
}

export function normalizeGenkiLesson(rawLesson: unknown, lessonNumber: number): z.infer<typeof genkiLessonSchema> {
  const source: Record<string, unknown> = rawLesson && typeof rawLesson === 'object' ? rawLesson as Record<string, unknown> : {};
  const parsed = genkiLessonSchema.safeParse({
    ...source,
    lessonNumber: Number(source.lessonNumber ?? lessonNumber),
    objectives: normalizeTextList(source.objectives ?? source.learningObjectives),
    grammarPoints: normalizeGrammarPoints(source.grammarPoints ?? source.grammar_points),
    commonMistakes: normalizeTextList(source.commonMistakes ?? source.common_mistakes),
    reviewChecklist: normalizeTextList(source.reviewChecklist ?? source.review_checklist),
    guidedPractice: source.guidedPractice ?? source.guided_practice ?? source.practice,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.length ? ` at ${issue.path.join('.')}` : '';
    throw new Error(`Invalid Genki lesson ${lessonNumber}${path}: ${issue?.message || 'schema validation failed'}`);
  }

  if (parsed.data.lessonNumber !== lessonNumber) {
    throw new Error(`Gemini lesson number mismatch: expected ${lessonNumber}`);
  }

  const meta = lessonMeta(lessonNumber);
  if (!meta || parsed.data.title.length === 0) {
    throw new Error(`Missing Genki metadata for lesson ${lessonNumber}`);
  }

  return parsed.data;
}

export function buildFallbackGenkiLesson(lessonNumber: number): z.infer<typeof genkiLessonSchema> {
  const lesson = lessonMeta(lessonNumber);
  if (!lesson) throw new Error(`Unsupported Genki lesson: ${lessonNumber}`);

  return normalizeGenkiLesson({
    lessonNumber,
    title: lesson.title,
    overview: `Review the core Japanese patterns introduced in ${lesson.title.toLowerCase()}.`,
    objectives: [
      `Recognize the role of ${lesson.grammar[0]} in a beginner sentence.`,
      'Build a short sentence using the lesson patterns.',
      'Choose the appropriate pattern in a simple conversation.',
    ],
    grammarPoints: lesson.grammar.map((pattern) => ({
      pattern,
      meaning: 'Core lesson grammar pattern',
      formation: `Use ${pattern} in the sentence pattern introduced in this lesson.`,
      usageNotes: [
        `Use ${pattern} for the sentence role introduced in this lesson.`,
        `Check the words immediately before and after ${pattern} when choosing this form.`,
      ],
      examples: [1, 2, 3].map((index) => ({
        japanese: `これは ${pattern} の れんしゅう${index === 1 ? 'です' : index === 2 ? 'ではありません' : 'ですか'}。`,
        romaji: `Kore wa ${pattern} no renshuu${index === 1 ? ' desu' : index === 2 ? ' dewa arimasen' : ' desu ka'}.`,
        english: `This ${index === 2 ? 'is not' : index === 3 ? 'is' : 'is'} practice for ${pattern}${index === 3 ? '?' : '.'}`,
      })),
    })),
    commonMistakes: [
      'Check the particle or ending against the role it plays in the sentence.',
      'Do not choose a pattern only because its English translation looks similar.',
      'Read the complete sentence before deciding which form is needed.',
    ],
    reviewChecklist: [
      'I can explain the main pattern.',
      'I can form the pattern correctly.',
      'I can make one original sentence.',
      'I can recognize a common incorrect use.',
    ],
    guidedPractice: [
      {
        prompt: `Make a sentence using ${lesson.grammar[0]}.`,
        answer: `これは ${lesson.grammar[0]} の れんしゅうです。`,
        explanation: `The sentence uses ${lesson.grammar[0]} in the lesson's core pattern.`,
      },
      {
        prompt: `Explain the role of ${lesson.grammar[0]} in a sentence.`,
        answer: `It marks the role taught for ${lesson.grammar[0]} in this lesson.`,
        explanation: 'Identifying the sentence role helps you choose the correct pattern.',
      },
      {
        prompt: `Change a sentence using ${lesson.grammar[0]} into a question.`,
        answer: `これは ${lesson.grammar[0]} の れんしゅうですか。`,
        explanation: 'This checks whether you can apply the pattern in a question.',
      },
    ],
  }, lessonNumber);
}

export async function generateGenkiLesson(lessonNumber: number, { fetchImpl = fetch }: { fetchImpl?: typeof fetch } = {}): Promise<{ content: z.infer<typeof genkiLessonSchema>; model: string }> {
  const safeLessonNumber = Number(lessonNumber);
  if (!lessonMeta(safeLessonNumber)) throw new Error(`Unsupported Genki lesson: ${lessonNumber}`);

  if (!GEMINI_API_KEY) return { content: buildFallbackGenkiLesson(safeLessonNumber), model: 'fallback' };

  const model = resolveGeminiModel(GEMINI_MODEL) || FALLBACK_GEMINI_MODEL;
  const response = await fetchImpl(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: createGenkiLessonPrompt(safeLessonNumber) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
          maxOutputTokens: 12000,
        },
      }),
    },
  );

  if (!response.ok) throw new Error(`Gemini API returned ${response.status}`);
  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '';
  return {
    content: normalizeGenkiLesson(parseJsonResponse(text), safeLessonNumber),
    model,
  };
}
