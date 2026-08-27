import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import type { KanjiCard } from '../services/card-service.js';

export interface KanjiDeck { groups: Array<{ id: string; name: string; cards: KanjiCard[] }>; cards: KanjiCard[] }

export async function getPersistedKanjiDeck(): Promise<KanjiDeck | null> {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabaseClient();
  const [{ data: groups, error: groupsError }, { data: characters, error: charactersError }] = await Promise.all([
    client.from('kanji_groups').select('id, name, sort_order').eq('difficulty', 'n5').eq('status', 'published').order('sort_order'),
    client.from('kanji_characters').select('id, group_id, character, readings, romaji, meaning, example_japanese, example_english, sort_order').eq('difficulty', 'n5').eq('status', 'published').order('sort_order'),
  ]);
  if (groupsError) throw groupsError;
  if (charactersError) throw charactersError;
  if (!groups?.length || !characters?.length) return null;

  const groupMap = new Map((groups as Array<{ id: string; name: string }>).map((group) => [group.id, { id: group.id, name: group.name, cards: [] as KanjiCard[] }]));
  (characters as Array<{ id: string; group_id: string; character: string; readings: string[]; romaji: string; meaning: string; example_japanese: string; example_english: string }>).forEach((item) => {
    const group = groupMap.get(item.group_id);
    if (!group) return;
    group.cards.push({
      id: item.id,
      kanji: item.character,
      reading: item.readings.join(' / '),
      romaji: item.romaji,
      meaning: item.meaning,
      groupId: item.group_id,
      groupName: group.name,
      example: [item.example_japanese, item.example_english],
    });
  });
  const orderedGroups = (groups as Array<{ id: string }>).map((group) => groupMap.get(group.id)).filter((group): group is { id: string; name: string; cards: KanjiCard[] } => Boolean(group?.cards.length));
  return { groups: orderedGroups, cards: orderedGroups.flatMap((group) => group.cards) };
}

export async function replaceKanjiDeck({ deck, model }: { deck: { groups: Array<{ id: string; name: string; characters: Array<{ character: string; readings: string[]; romaji: string; meaning: string; example: { japanese: string; english: string } }> }> }; model: string }): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured');
  const client = getSupabaseClient();
  const { error: deleteError } = await client.from('kanji_groups').delete().eq('difficulty', 'n5');
  if (deleteError) throw deleteError;
  const groups = deck.groups.map((group, index) => ({ id: group.id, name: group.name, sort_order: index, difficulty: 'n5', status: 'published', model }));
  const { error: groupError } = await client.from('kanji_groups').insert(groups);
  if (groupError) throw groupError;
  const characters = deck.groups.flatMap((group) => group.characters.map((item, index) => ({
    group_id: group.id,
    character: item.character,
    readings: item.readings,
    romaji: item.romaji,
    meaning: item.meaning,
    example_japanese: item.example.japanese,
    example_english: item.example.english,
    sort_order: index,
    difficulty: 'n5',
    status: 'published',
  })));
  const { error: characterError } = await client.from('kanji_characters').insert(characters);
  if (characterError) throw characterError;
}
