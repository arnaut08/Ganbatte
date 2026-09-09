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
};

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

export async function generateMinefieldBoard(
    supabaseClient: SupabaseClient,
    groupId?: string,
    selectedGroups?: string[],
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

    const words = (data ?? [])
        .filter(isVocabWordRow)
        .filter((word) => word.english.length > 0 && word.english[0].trim().length > 0)
        .map((word) => ({
            ...word,
            english_meaning: word.english[0].trim(),
        }));

    if (words.length < 16) {
        throw new Error('At least 16 N5 vocabulary words are required to create a minefield board.');
    }

    const selectedWords = shuffle([...words]).slice(0, 16);
    const targetIndex = Math.floor(Math.random() * selectedWords.length);
    const targetWord = selectedWords[targetIndex];
    const tiles = selectedWords.map((word, index) => ({
        id: word.id,
        text: word.kanji === word.kana ? word.kana : `${word.kanji} / ${word.kana}`,
        isMine: index !== targetIndex,
        status: 'idle' as const,
        claimedBy: null,
    }));

    return {
        tiles: shuffle(tiles),
        currentPrompt: targetWord.english_meaning,
        hostScore: 0,
        guestScore: 0,
    };
}