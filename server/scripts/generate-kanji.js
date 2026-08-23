import { generateKanjiDeck } from '../services/kanji-service.js';
import { replaceKanjiDeck } from '../repositories/kanji-repository.js';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  console.log('Generating N5 Kanji deck with Gemini');
  const result = await generateKanjiDeck();

  if (dryRun) {
    console.log(JSON.stringify(result.deck, null, 2));
    return;
  }

  await replaceKanjiDeck(result);
  const characterCount = result.deck.groups.reduce((total, group) => total + group.characters.length, 0);
  console.log(`Persisted ${result.deck.groups.length} groups and ${characterCount} Kanji characters using ${result.model}`);
}

main().catch((error) => {
  console.error(`Kanji generation failed: ${error.message}`);
  process.exitCode = 1;
});