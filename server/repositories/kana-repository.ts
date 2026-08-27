import { getCachedJson, setCachedJson } from '../config/redis.js';
import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { KANA_CARDS, KANA_GROUPS, KANA_MATRICES } from '../data/kana.js';
import type { PracticeCard } from '../services/card-service.js';

interface KanaGroup { id: string; name: string; script: string; cards: string[][] }
interface KanaMatrix { id: string; name: string; script: string; type: string; columns: string[]; rows: Array<{ id: string; label: string; cells: string[] }>; extras: Array<{ id: string; label: string; cells: string[] }> }
export interface KanaDeck { groups: KanaGroup[]; cards: PracticeCard[]; matrices: unknown[] }

const KANA_CACHE_KEY = 'ganbatte:kana-deck:v1';
const KANA_CACHE_TTL_SECONDS = 24 * 60 * 60;
let memoryDeck: KanaDeck | null = null;

function buildMatrices(cards: readonly PracticeCard[]): KanaMatrix[] {
  const idsByCharacter = new Map(cards.map((card) => [card.kana, card.id]));
  return (KANA_MATRICES as KanaMatrix[]).map((matrix) => ({
    ...matrix,
    rows: matrix.rows.map((row) => ({
      ...row,
      cellIds: row.cells.map((cell) => cell ? idsByCharacter.get(cell) || null : null),
    })),
    extras: matrix.extras.map((extra) => ({
      ...extra,
      cellIds: extra.cells.map((cell) => cell ? idsByCharacter.get(cell) || null : null),
    })),
  }));
}

function buildFallbackDeck(): KanaDeck {
  const cards = KANA_CARDS.map(({ meaning: _meaning, ...card }, index) => ({ ...card, id: `static-kana-${index + 1}` }));
  return {
    groups: KANA_GROUPS,
    cards,
    matrices: buildMatrices(cards),
  };
}

function buildDeck(groups: Array<{ id: string; name: string; script: string }>, characters: Array<{ id: string; group_id: string; character: string; romaji: string; example_japanese: string; example_romaji: string; example_english: string }>): KanaDeck {
  const groupMap = new Map<string, KanaGroup>(groups.map((group): [string, KanaGroup] => [group.id, {
    id: group.id,
    name: group.name,
    script: group.script,
    cards: [] as string[][],
  }]));
  const cards: PracticeCard[] = characters.flatMap((item) => {
    const group = groupMap.get(item.group_id);
    if (!group) return [];
    const card = {
      id: item.id,
      kana: item.character,
      romaji: item.romaji,
      groupId: item.group_id,
      groupName: group.name,
      script: group.script,
      example: [item.example_japanese, item.example_romaji, item.example_english],
    };
    group.cards.push([card.kana, card.romaji]);
    return [card];
  });
  const orderedGroups = groups.map((group) => groupMap.get(group.id)).filter((group): group is KanaGroup => Boolean(group?.cards.length));
  return { groups: orderedGroups, cards, matrices: buildMatrices(cards) };
}

export async function getPersistedKanaDeck(): Promise<KanaDeck | null> {
  if (memoryDeck) return memoryDeck;
  const cachedDeck = await getCachedJson(KANA_CACHE_KEY).catch(() => null) as KanaDeck | null;
  if (cachedDeck?.cards?.length) {
    memoryDeck = cachedDeck;
    return memoryDeck;
  }
  if (!isSupabaseConfigured()) {
    memoryDeck = buildFallbackDeck();
    return memoryDeck;
  }

  const client = getSupabaseClient();
  const [{ data: groups, error: groupsError }, { data: characters, error: charactersError }] = await Promise.all([
    client.from('kana_groups').select('id, name, script, sort_order').eq('status', 'published').order('sort_order'),
    client.from('kana_characters').select('id, group_id, character, romaji, example_japanese, example_romaji, example_english, sort_order').eq('status', 'published').order('sort_order'),
  ]);
  if (groupsError) throw groupsError;
  if (charactersError) throw charactersError;
  if (!groups?.length || !characters?.length) return null;

  memoryDeck = buildDeck(groups as Array<{ id: string; name: string; script: string }>, characters as Array<{ id: string; group_id: string; character: string; romaji: string; example_japanese: string; example_romaji: string; example_english: string }>);
  await setCachedJson(KANA_CACHE_KEY, memoryDeck, KANA_CACHE_TTL_SECONDS).catch(() => {});
  return memoryDeck;
}

export async function warmKanaDeckCache(): Promise<void> {
  try {
    const deck = await getPersistedKanaDeck();
    console.log(deck ? `Kana deck ready (${deck.cards.length} characters)` : 'Kana deck is not seeded yet.');
  } catch (error) {
    console.error('Kana deck cache warmup failed:', error);
  }
}
