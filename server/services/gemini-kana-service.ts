import { z } from 'zod';
import { FALLBACK_GEMINI_MODEL, GEMINI_API_KEY, GEMINI_MODEL } from '../config/env.js';
import { resolveGeminiModel } from './genki-grammar-service.js';
import type { PracticeCard } from './card-service.js';

const KANA_DECK_SIZE = 10;
const kanaCategorySchema = z.enum(['hiragana', 'katakana', 'dakuten', 'handakuten']);
const kanaSentenceSchema = z.object({
    kana: z.string().trim().min(1).max(80),
    romaji: z.string().trim().min(1).max(160),
    english: z.string().trim().min(1).max(200),
    category: kanaCategorySchema,
});

const responseSchema = {
    type: 'ARRAY',
    minItems: KANA_DECK_SIZE,
    maxItems: KANA_DECK_SIZE,
    items: {
        type: 'OBJECT',
        properties: {
            kana: { type: 'STRING' },
            romaji: { type: 'STRING' },
            english: { type: 'STRING' },
            category: { type: 'STRING', enum: kanaCategorySchema.options },
        },
        required: ['kana', 'romaji', 'english', 'category'],
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

export function createKanaDeckPrompt(): string {
    const seedThemes = [
        'ordering food and iced drinks at a modern bakery cafe',
        'traveling on the bullet train with passports and luggage',
        'shopping for electronics, games, and stationery in Akihabara',
        'explaining plans for a weekend picnic and barbecue in the park',
        'checking into a hotel and asking the receptionist about wifi and breakfast',
        'attending a campus music concert with pizza and friends'
    ];

    const randomTheme = seedThemes[Math.floor(Math.random() * seedThemes.length)];
    const randomSeed = Math.random().toString(36).substring(2, 8);

    return [
        'You are an expert Japanese instructor creating a 10-item speed-reading assessment for JLPT N5 students.',
        `Theme: "${randomTheme}" | Entropy Seed: ${randomSeed}`,
        '',
        'MANDATORY PER-QUESTION CONSTRAINTS (Apply to ALL 10 questions without exception):',
        '1. LENGTH FLOOR: Every sentence MUST be 6 to 10 words long (20 to 35 kana characters total). Short sentences, 2-word pairs, and fragments are STRICTLY PROHIBITED.',
        '2. ALL FOUR ELEMENTS REQUIRED IN EVERY ITEM:',
        '   Every single sentence MUST contain ALL of the following at the same time:',
        '   - Standard Hiragana (grammar particles like は, を, に, で, と, and basic verbs/adjectives)',
        '   - Katakana loanwords (at least one real loanword such as コーヒー, パン, ケーキ, ホテル, バス, テレビ, パスポート, ピザ, etc.)',
        '   - Dakuten (voiced sounds: characters from が, ざ, だ, ば rows or ガ, ザ, ダ, バ)',
        '   - Handakuten (semi-voiced sounds: characters from ぱ, ぴ, ぷ, ぺ, ぽ rows or パ, ピ, プ, ペ, ポ)',
        '3. SCRIPT RESTRICTIONS:',
        '   - ABSOLUTELY ZERO KANJI. Write every word exclusively in Kana (Hiragana and Katakana only).',
        '   - Zero English or Latin characters inside the "kana" field.',
        '   - Separate grammatical words/particles with a single space in both "kana" and "romaji".',
        '   - Romaji must follow standard Modified Hepburn without punctuation marks.',
        '',
        'FEW-SHOT EXAMPLES OF THE REQUIRED DEPTH AND COMPLEXITY:',
        'Example 1:',
        'kana: "わたし は あさ カフェ で パン と バナナ を たべました"',
        'romaji: "watashi wa asa kafe de pan to banana o tabemashita"',
        'english: "I ate bread and a banana at a cafe in the morning"',
        '(Components: Hiragana: わたし, は, あさ, で... | Katakana: カフェ, バナナ | Dakuten: で, バ | Handakuten: パン)',
        '',
        'Example 2:',
        'kana: "ともだち と いっしょ に デパート で プレゼント を かいました"',
        'romaji: "tomodachi to issho ni depaato de purezento o kaimashita"',
        'english: "I bought a present at the department store together with my friend"',
        '(Components: Hiragana: ともだち, と, いっしょ... | Katakana: デパート, プレゼント | Dakuten: だ, デ, で, ゼ | Handakuten: パ, プ)',
        '',
        'Example 3:',
        'kana: "えき の まえ で バス を まちながら ピザ を たべます"',
        'romaji: "eki no mae de basu o machinagara piza o tabemasu"',
        'english: "I eat pizza while waiting for the bus in front of the station"',
        '(Components: Hiragana: えき, の, まえ... | Katakana: バス, ピザ | Dakuten: で, ザ | Handakuten: ピ)',
        '',
        'OUTPUT SPECIFICATION:',
        'Return ONLY a valid JSON array of 10 objects matching this exact structure (no markdown fences, no commentary):',
        '[',
        '  {',
        '    "kana": "わたし は あさ カフェ で パン と バナナ を たべました",',
        '    "romaji": "watashi wa asa kafe de pan to banana o tabemashita",',
        '    "english": "I ate bread and a banana at a cafe in the morning"',
        '  }',
        ']'
    ].join('\n');
}

export function normalizeKanaDeck(rawText: string): PracticeCard[] {
    const source = extractJsonArray(rawText);
    if (!source) throw new Error('Gemini returned incomplete Kana JSON');

    let parsed: unknown;
    try {
        parsed = JSON.parse(source);
    } catch {
        throw new Error('Gemini returned invalid Kana JSON');
    }

    const result = z.array(kanaSentenceSchema).length(KANA_DECK_SIZE).safeParse(parsed);
    if (!result.success) throw new Error('Gemini returned an invalid Kana deck');

    // Validate quality instead of rigid category buckets:
    // 1. Minimum character length (prevents lazy 2-word items like "あさ と ひる")
    // 2. Reject accidental Kanji leakage
    for (const item of result.data) {
        if (item.kana.trim().length < 15) {
            throw new Error(`Kana sentence too short: "${item.kana}"`);
        }
        if (/[\u4e00-\u9faf]/.test(item.kana)) {
            throw new Error(`Kanji detected in kana card: "${item.kana}"`);
        }
    }

    return result.data.map(({ kana, romaji, english }) => ({ kana, romaji, english }));
}

export async function generateKanaDeck(
    { fetchImpl = fetch, model }: { fetchImpl?: typeof fetch; model?: string } = {},
): Promise<PracticeCard[]> {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required to generate Kana assessments');

    const resolvedModel = resolveGeminiModel(model ?? GEMINI_MODEL) || FALLBACK_GEMINI_MODEL;
    const response = await fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: createKanaDeckPrompt() }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema,
                    temperature: 1,
                    thinkingConfig: {
                        thinkingBudget: 0, // CRITICAL: stops thoughts from exhausting output tokens
                    },
                    maxOutputTokens: 4096,
                },
            }),
        },
    );

    if (!response.ok) throw new Error(`Gemini API returned ${response.status}`);
    const payload = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    return normalizeKanaDeck(text);
}
