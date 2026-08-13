export function generateRandomCards(sentencePool, count = 10) {
  const pool = [...sentencePool];
  const cards = [];

  while (cards.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    const sentence = pool.splice(index, 1)[0];
    cards.push({
      kana: sentence.kana,
      romaji: sentence.romaji,
      english: sentence.english,
    });
  }

  return cards;
}
