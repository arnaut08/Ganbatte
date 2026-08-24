import { KANA_CARDS, KANA_GROUPS } from '../data/kana.js';
import { getSupabaseClient } from '../config/supabase.js';

async function main() {
  const client = getSupabaseClient();
  const groups = KANA_GROUPS.map((group, sortOrder) => ({ id: group.id, name: group.name, script: group.script, sort_order: sortOrder, status: 'published' }));
  const characters = KANA_CARDS.map((card, sortOrder) => ({
    group_id: card.groupId, character: card.kana, romaji: card.romaji,
    example_japanese: card.example[0], example_romaji: card.example[1], example_english: card.example[2],
    sort_order: sortOrder, status: 'published',
  }));
  const { error: groupError } = await client.from('kana_groups').upsert(groups);
  if (groupError) throw groupError;
  const { error: characterError } = await client.from('kana_characters').upsert(characters, { onConflict: 'character' });
  if (characterError) throw characterError;
  console.log(`Persisted ${groups.length} Kana groups and ${characters.length} Kana characters`);
}

main().catch((error) => {
  console.error(`Kana seeding failed: ${error.message}`);
  process.exitCode = 1;
});