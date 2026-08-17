import { KANJI_GROUPS } from '../data/kanji.js';

const KANA_TO_ROMAJI = {
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o', っ: 'tsu',
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'o', ん: 'n',
  ゎ: 'wa',
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo',
  ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
  にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
  びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
  みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
  ゃ: 'ya', ゅ: 'yu', ょ: 'yo',
  ゛: '',
  ゜: 'o',
  ゝ: '',
  カ: 'ka', キ: 'ki', ク: 'ku', ケ: 'ke', コ: 'ko',
  ガ: 'ga', ギ: 'gi', グ: 'gu', ゲ: 'ge', ゴ: 'go',
  サ: 'sa', シ: 'shi', ス: 'su', セ: 'se', ソ: 'so',
  ザ: 'za', ジ: 'ji', ズ: 'zu', ゼ: 'ze', ゾ: 'zo',
  タ: 'ta', チ: 'chi', ツ: 'tsu', テ: 'te', ト: 'to',
  ダ: 'da', ヂ: 'ji', ヅ: 'zu', デ: 'de', ド: 'do',
  ナ: 'na', ニ: 'ni', ヌ: 'nu', ネ: 'ne', ノ: 'no',
  ハ: 'ha', ヒ: 'hi', フ: 'fu', ヘ: 'he', ホ: 'ho',
  バ: 'ba', ビ: 'bi', ブ: 'bu', ベ: 'be', ボ: 'bo',
  パ: 'pa', ピ: 'pi', プ: 'pu', ペ: 'pe', ポ: 'po',
  マ: 'ma', ミ: 'mi', ム: 'mu', メ: 'me', モ: 'mo',
  ヤ: 'ya', ユ: 'yu', ヨ: 'yo',
  ラ: 'ra', リ: 'ri', ル: 'ru', レ: 're', ロ: 'ro',
  ワ: 'wa', ヲ: 'o', ン: 'n',
  キャ: 'kya', キュ: 'kyu', キョ: 'kyo',
  ギャ: 'gya', ギュ: 'gyu', ギョ: 'gyo',
  シャ: 'sha', シュ: 'shu', ショ: 'sho',
  ジャ: 'ja', ジュ: 'ju', ジョ: 'jo',
  チャ: 'cha', チュ: 'chu', チョ: 'cho',
  ニャ: 'nya', ニュ: 'nyu', ニョ: 'nyo',
  ヒャ: 'hya', ヒュ: 'hyu', ヒョ: 'hyo',
  ビャ: 'bya', ビュ: 'byu', ビョ: 'byo',
  ピャ: 'pya', ピュ: 'pyu', ピョ: 'pyo',
  ミャ: 'mya', ミュ: 'myu', ミョ: 'myo',
  リャ: 'rya', リュ: 'ryu', リョ: 'ryo',
};

export function romanizeKana(value = '') {
  const normalized = String(value).trim();
  if (!normalized) return '';

  const chars = [...normalized.replace(/\s+/g, '').replace(/\//g, '')];
  const tokens = [];
  let index = 0;

  while (index < chars.length) {
    const char = chars[index];
    const next = chars[index + 1] ?? '';
    const pair = `${char}${next}`;
    const single = KANA_TO_ROMAJI[char] ?? '';
    const pairValue = KANA_TO_ROMAJI[pair] ?? '';

    if (pairValue) {
      tokens.push(pairValue);
      index += 2;
      continue;
    }

    if (single) {
      tokens.push(single);
      index += 1;
      continue;
    }

    tokens.push(char);
    index += 1;
  }

  return tokens.join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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

export function generateRandomKanjiCards(groupIds = [], count = 10) {
  const selectedGroups = groupIds.length === 0
    ? KANJI_GROUPS
    : KANJI_GROUPS.filter((group) => groupIds.includes(group.id));

  const pool = selectedGroups.flatMap((group) => group.cards.map(([kanji, reading, meaning]) => ({
    kana: kanji,
    romaji: romanizeKana(reading.split('/')[0].trim()),
    english: meaning,
    groupId: group.id,
    groupName: group.name,
  })));

  const cards = [];
  const workingPool = [...pool];

  while (cards.length < count && workingPool.length > 0) {
    const index = Math.floor(Math.random() * workingPool.length);
    const card = workingPool.splice(index, 1)[0];
    cards.push({
      kana: card.kana,
      romaji: card.romaji,
      english: card.english,
      groupId: card.groupId,
      groupName: card.groupName,
    });
  }

  return cards;
}
