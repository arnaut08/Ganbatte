const KANA_TO_ROMAJI: Record<string, string> = {
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

export interface KanaSentence { kana: string; romaji: string; english: string }
export interface KanjiCard { id?: string; kanji: string; reading: string; romaji?: string; meaning: string; groupId: string; groupName: string; example?: string[] }
export interface VocabCard { id?: string; kanji: string; kana: string; romaji?: string | null; english: string[]; stageNumber?: number; theme?: string; pos?: string }
export type VocabQuestionType = 'multiple-choice' | 'type-in';
export type VocabPromptKind = 'kanji' | 'english';
export interface PracticeCard { id?: string; kana: string; romaji: string; english?: string; groupId?: string; groupName?: string; script?: string; example?: string[]; questionType?: VocabQuestionType; promptKind?: VocabPromptKind; prompt?: string; promptReading?: string; options?: string[]; correctAnswer?: string; answerType?: 'romaji' | 'text' }

function capitalizeEnglish(value: string): string {
  return value.replace(/(^|\s)([a-z])/g, (_match, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

export function romanizeKana(value: string = ''): string {
  const normalized = String(value).trim();
  if (!normalized) return '';

  const chars = [...normalized.replace(/\s+/g, '').replace(/\//g, '')];
  const tokens: string[] = [];
  let index: number = 0;

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

export function generateRandomCards(sentencePool: readonly KanaSentence[], count: number = 10): PracticeCard[] {
  const pool: KanaSentence[] = [...sentencePool];
  const cards: PracticeCard[] = [];

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

export function generateRandomKanjiCards(kanjiCards: readonly KanjiCard[], groupIds: readonly string[] = [], count: number = 10): PracticeCard[] {
  const pool = kanjiCards
    .filter((card) => groupIds.length === 0 || groupIds.includes(card.groupId))
    .map((card) => ({
      id: card.id,
      kana: card.kanji,
      romaji: card.romaji || romanizeKana(card.reading.split('/')[0].trim()),
      english: card.meaning,
      groupId: card.groupId,
      groupName: card.groupName,
    }));

  const cards: PracticeCard[] = [];
  const workingPool: PracticeCard[] = [...pool];

  while (cards.length < count && workingPool.length > 0) {
    const index = Math.floor(Math.random() * workingPool.length);
    const card = workingPool.splice(index, 1)[0];
    cards.push({
      id: card.id,
      kana: card.kana,
      romaji: card.romaji,
      english: card.english,
      groupId: card.groupId,
      groupName: card.groupName,
    });
  }

  return cards;
}

export function generateRandomVocabCards(
  vocabCards: readonly VocabCard[],
  count: number = 10,
  stageNumbers: readonly string[] = [],
  random: () => number = Math.random,
): PracticeCard[] {
  const workingPool = vocabCards.filter((card) => stageNumbers.length === 0 || stageNumbers.includes(String(card.stageNumber)));
  const cards: PracticeCard[] = [];

  while (cards.length < count && workingPool.length > 0) {
    const index = Math.floor(random() * workingPool.length);
    const card = workingPool.splice(index, 1)[0];
    const english = capitalizeEnglish(card.english[0] || '');
    const japanese = card.kanji === card.kana ? card.kana : `${card.kanji} / ${card.kana}`;
    const romaji = card.romaji || romanizeKana(card.kana);
    const questionType: VocabQuestionType = 'multiple-choice';
    const promptKind: VocabPromptKind = cards.length % 2 === 0 ? 'kanji' : 'english';
    const correctAnswer = promptKind === 'english' ? japanese : english;
    const distractorItems = workingPool
      .filter((item) => item.stageNumber === card.stageNumber)
      .sort((left, right) => {
        const leftSamePos = left.pos === card.pos ? 1 : 0;
        const rightSamePos = right.pos === card.pos ? 1 : 0;
        if (leftSamePos !== rightSamePos) return rightSamePos - leftSamePos;

        const leftAnswer = promptKind === 'english' ? left.kanji : left.english[0] || '';
        const rightAnswer = promptKind === 'english' ? right.kanji : right.english[0] || '';
        const targetAnswer = promptKind === 'english' ? card.kanji : card.english[0] || '';
        return Math.abs(leftAnswer.length - targetAnswer.length) - Math.abs(rightAnswer.length - targetAnswer.length);
      });
    const distractorPool = distractorItems.flatMap((item) => {
      const itemEnglish = capitalizeEnglish(item.english[0] || '');
      const itemJapanese = item.kanji === item.kana ? item.kana : `${item.kanji} / ${item.kana}`;
      return promptKind === 'english' ? [itemJapanese] : [itemEnglish];
    });
    const options = [...new Set([correctAnswer, ...distractorPool.filter((option) => option !== correctAnswer)])].slice(0, 4);
    for (let optionIndex = options.length - 1; optionIndex > 0; optionIndex -= 1) {
      const swapIndex = Math.floor(random() * (optionIndex + 1));
      [options[optionIndex], options[swapIndex]] = [options[swapIndex], options[optionIndex]];
    }

    cards.push({
      id: card.id,
      kana: card.kanji || card.kana,
      romaji,
      english: card.english.join(' / '),
      questionType,
      promptKind,
      prompt: promptKind === 'kanji' ? card.kanji : capitalizeEnglish(card.english.join(' / ')),
      promptReading: promptKind === 'kanji' ? card.kana : undefined,
      options,
      correctAnswer,
      answerType: 'text',
    });
  }

  return cards;
}
