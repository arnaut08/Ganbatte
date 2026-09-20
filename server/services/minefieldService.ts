import type { SupabaseClient } from '@supabase/supabase-js';

export type MinefieldTile = {
    id: string;
    text: string;
    isMine: boolean;
    status: 'idle' | 'verifying' | 'claimed-host' | 'claimed-guest' | 'exploded';
    claimedBy: string | null;
};

export type MinefieldState = {
    tiles: MinefieldTile[];
    currentPrompt: string;
    hostScore: number;
    guestScore: number;
    roundNumber: number;
    roundLimit: number;
    winningScore: number;
    usedPromptMeanings: string[];
};

export const MINEFIELD_ROUND_LIMIT = 10;
export const MINEFIELD_WINNING_SCORE = 5;

type VocabWordRow = {
    id: string;
    kanji: string;
    kana: string;
    english: string[];
};

type MinefieldWord = VocabWordRow & {
    english_meaning: string;
};

function isVocabWordRow(value: unknown): value is VocabWordRow {
    if (typeof value !== 'object' || value === null) return false;
    const row = value as Partial<VocabWordRow>;
    return (
        typeof row.id === 'string' &&
        typeof row.kanji === 'string' &&
        typeof row.kana === 'string' &&
        Array.isArray(row.english) &&
        row.english.every((meaning) => typeof meaning === 'string')
    );
}

function shuffle<T>(items: T[]): T[] {
    for (let index = items.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
    return items;
}

function normalizeWords(data: unknown): MinefieldWord[] {
    if (!Array.isArray(data)) return [];

    return data
        .filter(isVocabWordRow)
        .filter((word) => word.english.length > 0 && word.english[0].trim().length > 0)
        .map((word) => ({
            ...word,
            english_meaning: word.english[0].trim(),
        }));
}

function normalizePromptMeaning(meaning: string): string {
    return meaning.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function getUniqueWords(words: MinefieldWord[]): MinefieldWord[] {
    const seenIds = new Set<string>();
    const seenReadings = new Set<string>();
    const seenPromptMeanings = new Set<string>();

    return words.filter((word) => {
        const readingKey = `${word.kanji}-${word.kana}`;
        const promptMeaning = normalizePromptMeaning(word.english_meaning);
        if (
            seenIds.has(word.id)
            || seenReadings.has(readingKey)
            || seenPromptMeanings.has(promptMeaning)
        ) return false;
        seenIds.add(word.id);
        seenReadings.add(readingKey);
        seenPromptMeanings.add(promptMeaning);
        return true;
    });
}

export async function generateMinefieldBoard(
    supabaseClient: SupabaseClient,
    groupId?: string,
    selectedGroups?: string[],
    roundNumber = 1,
    usedPromptMeanings: string[] = [],
): Promise<MinefieldState> {
    let query = supabaseClient
        .from('vocab_items')
        .select('id, kanji, kana, english')
        .eq('jlpt_level', 'N5');

    if (selectedGroups && selectedGroups.length > 0) {
        query = query.in('stage_number', selectedGroups.map(Number));
    }

    if (groupId) {
        const stageNumber = Number(groupId);
        query = Number.isInteger(stageNumber)
            ? query.eq('stage_number', stageNumber)
            : query.eq('theme', groupId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const preferredWords = getUniqueWords(normalizeWords(data));
    const roundLimit = Math.min(MINEFIELD_ROUND_LIMIT, preferredWords.length);
    let words = preferredWords;

    if (preferredWords.length < 16) {
        const { data: fallbackData, error: fallbackError } = await supabaseClient
            .from('vocab_items')
            .select('id, kanji, kana, english')
            .eq('jlpt_level', 'N5');
        if (fallbackError) throw fallbackError;

        words = getUniqueWords([...preferredWords, ...normalizeWords(fallbackData)]);
    }

    if (words.length < 16) {
        throw new Error('At least 16 N5 vocabulary words are required to create a minefield board.');
    }

    const usedPromptKeys = new Set(usedPromptMeanings.map(normalizePromptMeaning));
    const targetPool = preferredWords
        .filter((word) => !usedPromptKeys.has(normalizePromptMeaning(word.english_meaning)));
    if (targetPool.length === 0) {
        throw new Error('No unused vocabulary questions remain in the selected Minefield groups.');
    }
    const targetWord = targetPool[Math.floor(Math.random() * targetPool.length)];
    const selectedWords = [
        targetWord,
        ...shuffle(words.filter((word) => word.id !== targetWord.id)).slice(0, 15),
    ];
    const tiles = selectedWords.map((word) => ({
        id: word.id,
        text: word.kanji === word.kana ? word.kana : `${word.kanji} / ${word.kana}`,
        isMine: word.id !== targetWord.id,
        status: 'idle' as const,
        claimedBy: null,
    }));

    return {
        tiles: shuffle(tiles),
        currentPrompt: targetWord.english_meaning,
        hostScore: 0,
        guestScore: 0,
        roundNumber,
        roundLimit,
        winningScore: MINEFIELD_WINNING_SCORE,
        usedPromptMeanings: [
            ...usedPromptMeanings,
            normalizePromptMeaning(targetWord.english_meaning),
        ],
    };
}