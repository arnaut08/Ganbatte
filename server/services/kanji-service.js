import { z } from 'zod';
import { FALLBACK_GEMINI_MODEL, GEMINI_API_KEY, GEMINI_MODEL } from '../config/env.js';
import { resolveGeminiModel } from './genki-grammar-service.js';

export const KANJI_CONTENT_VERSION = 1;

const kanjiCharacterSchema = z.object({
  character: z.string().trim().regex(/^\p{Script=Han}$/u),
  readings: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
  romaji: z.string().trim().min(1).max(120),
  meaning: z.string().trim().min(1).max(160),
  example: z.object({
    japanese: z.string().trim().min(1).max(160),
    english: z.string().trim().min(1).max(240),
  }),
});

const kanjiGroupSchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(100),
  characters: z.array(kanjiCharacterSchema).min(4).max(30),
});

const kanjiDeckSchema = z.object({ groups: z.array(kanjiGroupSchema).min(4).max(20) });

export function createKanjiPrompt({ correction = false } = {}) {
  return [
    'You are an expert Japanese teacher creating an original JLPT N5 Kanji study deck.',
    'Determine the complete set of important, common JLPT N5 Kanji and include every character a beginner should learn. Choose the number of characters based on the N5 scope; do not pad the deck or target an arbitrary count.',
    'Divide the characters into meaningful, non-overlapping thematic groups. Choose the number and size of groups that best organizes the complete N5 set.',
    'Only include Kanji appropriate for JLPT N5 beginners. Do not include the same character twice.',
    'For each character provide common Japanese readings in kana, one concise romaji reading for the primary reading, a concise English meaning, and one original beginner-level example sentence with an English translation.',
    'Keep examples extremely easy for an N5 learner, natural, and connected to the character meaning. Never use a meaningless template such as 「Xです。」 or an example that only says “there is/are X” without useful context.',
    'For number Kanji 一 through 十, show a real quantity with a concrete everyday noun and the correct kana counter, for example 「りんごが一つあります。」 (There is one apple), 「ねこが二ひきいます。」 (There are two cats), or 「みかんを三つたべます。」 (I eat three oranges). Use the appropriate counter and vary the objects, actions, and translations; do not generate ten near-identical “there is/are COUNT” sentences.',
    'For other Kanji, choose a short sentence that demonstrates its ordinary N5 use, such as 「木のしたでやすみます。」 (I rest under a tree) for 木 or 「駅でともだちをまちます。」 (I wait for a friend at the station) for 駅.',
    'The Japanese example must use kana for every other word and may contain the current character only. Valid example for 木: 「木のしたでやすみます。」. Invalid example for 木: 「木ようびにみます。」 because 曜 is another Kanji. Invalid example for 木: 「木曜日です。」 because 曜 and 日 are other Kanji.',
    'Return valid compact JSON only with this exact shape: {"groups":[{"id":"slug","name":"Theme","characters":[{"character":"日","readings":["ひ","にち"],"romaji":"hi","meaning":"day; sun","example":{"japanese":"日ようびはやすみです。","english":"Sunday is a day off."}}]}]}',
    'Do not include markdown fences, commentary, line-by-line explanations, romaji inside the Japanese example, or fields other than those requested. Keep every string concise so the complete deck fits in one response.',
    ...(correction ? [
      'IMPORTANT CORRECTION: The previous response was invalid or violated the content rules. Regenerate the complete deck as compact valid JSON. A previous response used another Kanji inside an example, so every example must contain its current character as its only Han character. Check JSON syntax and every example before returning.',
    ] : []),
  ].join('\n');
}

function extractJsonObject(source) {
  const start = source.indexOf('{');
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
    else if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  return null;
}

export function normalizeKanjiDeck(rawDeck) {
  const source = extractJsonObject(String(rawDeck || '').trim());
  if (!source) throw new Error('Gemini returned incomplete Kanji JSON');

  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error('Gemini returned invalid Kanji JSON');
  }

  const result = kanjiDeckSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`Invalid Kanji deck at ${issue?.path?.join('.') || 'response'}: ${issue?.message}`);
  }

  const characters = result.data.groups.flatMap((group) => group.characters.map((item) => item.character));
  const groupIds = result.data.groups.map((group) => group.id);
  if (characters.length < 50 || characters.length > 150) {
    throw new Error('Kanji deck must contain between 50 and 150 N5 characters');
  }
  if (new Set(groupIds).size !== groupIds.length) throw new Error('Kanji deck must contain unique group ids');
  if (new Set(characters).size !== characters.length) throw new Error('Kanji deck must contain distinct characters');
  result.data.groups.forEach((group) => group.characters.forEach((item) => {
    const exampleKanji = [...item.example.japanese].filter((character) => /\p{Script=Han}/u.test(character));
    if (exampleKanji.some((character) => character !== item.character)) {
      throw new Error(`Example for ${item.character} contains another Kanji character`);
    }
  }));
  return result.data;
}

export async function generateKanjiDeck({ fetchImpl = fetch } = {}) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required to generate Kanji content');
  const model = resolveGeminiModel(GEMINI_MODEL) || FALLBACK_GEMINI_MODEL;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: createKanjiPrompt({ correction: attempt > 0 }) }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 32768 },
        }),
      },
    );
    if (!response.ok) throw new Error(`Gemini API returned ${response.status}`);
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '';
    try {
      return { deck: normalizeKanjiDeck(text), model };
    } catch (error) {
      lastError = error;
      if (attempt === 1) throw error;
    }
  }
  throw lastError;
}