/**
 * Sanity check for the MasteryPassportScreen kana classification fix.
 * Runs the same algorithm as the component against the real deck data
 * and a simulated attempt list.
 */
import { KANA_MATRICES } from '../server/data/kana';

type KanaCellCategory = 'hiraganaBasic' | 'katakanaBasic' | 'dakuten' | 'combos';

type KanaMatrixLike = {
  script?: string;
  type?: string;
  rows?: Array<{ cells?: string[] }>;
  extras?: Array<{ cells?: string[] }>;
};

function buildKanaCategoryMap(matrices: KanaMatrixLike[]): Map<string, KanaCellCategory> {
  const map = new Map<string, KanaCellCategory>();
  matrices.forEach((matrix) => {
    let category: KanaCellCategory;
    if (matrix.type === 'basic') {
      category = matrix.script === 'katakana' ? 'katakanaBasic' : 'hiraganaBasic';
    } else if (matrix.type === 'combined') {
      category = 'combos';
    } else if (matrix.type === 'dakuten' || matrix.type === 'handakuten') {
      category = 'dakuten';
    } else {
      return;
    }
    [...(matrix.rows ?? []), ...(matrix.extras ?? [])].forEach((entry) => {
      (entry.cells ?? []).filter(Boolean).forEach((cell) => map.set(cell, category));
    });
  });
  return map;
}

function countKanaByCategory(map: Map<string, KanaCellCategory>) {
  const counts: Record<KanaCellCategory, number> = { hiraganaBasic: 0, katakanaBasic: 0, dakuten: 0, combos: 0 };
  map.forEach((category) => {
    counts[category] += 1;
  });
  return { ...counts, total: map.size };
}

// 1. Deck totals
const map = buildKanaCategoryMap(KANA_MATRICES as unknown as KanaMatrixLike[]);
const totals = countKanaByCategory(map);
console.log('Deck totals:', JSON.stringify(totals, null, 2));

// 2. Simulated attempts: the API rows have NO script/group fields —
// only character + correct_streak. One mastered kana of each category,
// one unmastered kana, and one character not in the deck (must be ignored).
const attempts = [
  { character: 'あ', correct_streak: 5 }, // hiragana basic
  { character: 'ア', correct_streak: 3 }, // katakana basic
  { character: 'が', correct_streak: 4 }, // dakuten
  { character: 'ぱ', correct_streak: 3 }, // handakuten → dakuten bucket
  { character: 'きゃ', correct_streak: 7 }, // combo
  { character: 'き', correct_streak: 1 }, // not mastered → ignored
  { character: '漢', correct_streak: 9 }, // kanji leaked into kana type → ignored
];
const mastered: Record<KanaCellCategory, number> = { hiraganaBasic: 0, katakanaBasic: 0, dakuten: 0, combos: 0 };
attempts.forEach((attempt) => {
  if (Number(attempt.correct_streak ?? 0) < 3) return;
  const character = typeof attempt.character === 'string' ? attempt.character : '';
  const category = character ? map.get(character) : undefined;
  if (category) mastered[category] += 1;
});
console.log('Mastered classification:', JSON.stringify(mastered, null, 2));

// 3. Assertions
const expected = { hiraganaBasic: 46, katakanaBasic: 46, dakuten: 50, combos: 66 };
let failed = false;
(Object.keys(expected) as KanaCellCategory[]).forEach((key) => {
  if (totals[key] !== expected[key]) {
    console.error(`FAIL: deck total ${key} = ${totals[key]}, expected ${expected[key]}`);
    failed = true;
  }
});
if (totals.total !== 208) {
  console.error(`FAIL: deck total = ${totals.total}, expected 208`);
  failed = true;
}
if (mastered.hiraganaBasic !== 1 || mastered.katakanaBasic !== 1 || mastered.dakuten !== 2 || mastered.combos !== 1) {
  console.error('FAIL: attempt classification did not match expectations');
  failed = true;
}
console.log(failed ? 'RESULT: FAILED' : 'RESULT: ALL CHECKS PASSED');
process.exit(failed ? 1 : 0);