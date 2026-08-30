import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACCOUNT_TIERS,
  evaluateAccountTier,
  getTierRank,
  isAllN5Mastered,
  isTierPromotion,
  type TierProgress,
} from './accountTier';

const baseProgress: TierProgress = {
  kanaMastered: 0,
  kanaTotal: 46,
  kanjiGroupsMastered: 0,
  kanjiGroupsTotal: 8,
  vocabStagesMastered: 0,
  vocabStagesTotal: 28,
  pvpWins: 0,
};

function progressWith(overrides: Partial<TierProgress>): TierProgress {
  return { ...baseProgress, ...overrides };
}

test('evaluateAccountTier starts every user at N5 NOVICE', () => {
  assert.equal(evaluateAccountTier(baseProgress), 'N5 NOVICE');
});

test('evaluateAccountTier promotes to KANA SCHOLAR at 46 mastered kana', () => {
  assert.equal(evaluateAccountTier(progressWith({ kanaMastered: 45 })), 'N5 NOVICE');
  assert.equal(evaluateAccountTier(progressWith({ kanaMastered: 46 })), 'KANA SCHOLAR');
});

test('evaluateAccountTier promotes to N5 APPRENTICE with 2 Kanji groups or 5 Vocab stages', () => {
  const kana = { kanaMastered: 46 };
  assert.equal(
    evaluateAccountTier(progressWith({ ...kana, kanjiGroupsMastered: 1, vocabStagesMastered: 5 })),
    'N5 APPRENTICE',
  );
  assert.equal(
    evaluateAccountTier(progressWith({ ...kana, kanjiGroupsMastered: 2, vocabStagesMastered: 0 })),
    'N5 APPRENTICE',
  );
  // 2 Kanji groups without the kana milestone stays below APPRENTICE.
  assert.equal(evaluateAccountTier(progressWith({ kanjiGroupsMastered: 2 })), 'N5 NOVICE');
});

test('evaluateAccountTier promotes to N5 JOURNEYMAN at 5 groups and 14 stages', () => {
  const below = progressWith({
    kanaMastered: 46,
    kanjiGroupsMastered: 5,
    vocabStagesMastered: 13,
  });
  assert.equal(evaluateAccountTier(below), 'N5 APPRENTICE');

  const reached = progressWith({
    kanaMastered: 46,
    kanjiGroupsMastered: 5,
    vocabStagesMastered: 14,
  });
  assert.equal(evaluateAccountTier(reached), 'N5 JOURNEYMAN');
});

test('evaluateAccountTier promotes to N5 MASTER at 8 groups and 28 stages', () => {
  const reached = progressWith({
    kanaMastered: 46,
    kanjiGroupsMastered: 8,
    vocabStagesMastered: 28,
  });
  assert.equal(evaluateAccountTier(reached), 'N5 MASTER');
});

test('evaluateAccountTier promotes to N5 SENSEI only with all N5 mastered and 10 PvP wins', () => {
  const allMastered = progressWith({
    kanaMastered: 46,
    kanjiGroupsMastered: 8,
    vocabStagesMastered: 28,
  });
  assert.equal(evaluateAccountTier(progressWith({ ...allMastered, pvpWins: 9 })), 'N5 MASTER');
  assert.equal(evaluateAccountTier(progressWith({ ...allMastered, pvpWins: 10 })), 'N5 SENSEI');

  // Full progress but incomplete content mastery cannot reach SENSEI.
  assert.equal(
    evaluateAccountTier(progressWith({
      kanaMastered: 46,
      kanaTotal: 46,
      kanjiGroupsMastered: 8,
      kanjiGroupsTotal: 8,
      vocabStagesMastered: 28,
      vocabStagesTotal: 28,
      pvpWins: 10,
    })),
    'N5 SENSEI',
  );
  assert.equal(
    evaluateAccountTier(progressWith({
      kanaMastered: 45,
      kanaTotal: 46,
      kanjiGroupsMastered: 8,
      kanjiGroupsTotal: 8,
      vocabStagesMastered: 28,
      vocabStagesTotal: 28,
      pvpWins: 10,
    })),
    'N5 MASTER',
  );
});

test('isAllN5Mastered requires positive totals so empty decks never promote', () => {
  assert.equal(isAllN5Mastered(progressWith({
    kanaMastered: 0,
    kanjiGroupsMastered: 0,
    vocabStagesMastered: 0,
  })), false);
  assert.equal(isAllN5Mastered(progressWith({
    kanaMastered: 46,
    kanjiGroupsMastered: 8,
    vocabStagesMastered: 28,
  })), true);
});

test('getTierRank and isTierPromotion order tiers from base to top', () => {
  assert.deepEqual(ACCOUNT_TIERS, [
    'N5 NOVICE',
    'KANA SCHOLAR',
    'N5 APPRENTICE',
    'N5 JOURNEYMAN',
    'N5 MASTER',
    'N5 SENSEI',
  ]);
  assert.ok(getTierRank('N5 SENSEI') > getTierRank('N5 MASTER'));
  assert.equal(isTierPromotion('N5 NOVICE', 'KANA SCHOLAR'), true);
  assert.equal(isTierPromotion('KANA SCHOLAR', 'N5 NOVICE'), false);
  assert.equal(isTierPromotion('N5 MASTER', 'N5 MASTER'), false);
  // Unknown stored tiers rank as base so any evaluated tier promotes.
  assert.equal(isTierPromotion('SOME_UNKNOWN_TIER', 'KANA SCHOLAR'), true);
});
