/**
 * Dynamic N5 account tiers, evaluated from the user's learning progress.
 *
 * The evaluated tier is compared against the `account_tier` stored on
 * `public.profiles`; a promotion (higher rank than stored) triggers a
 * celebration and persists the new tier.
 */

/** Ordered tiers from base to top; the index is the rank. */
export const ACCOUNT_TIERS = [
  'N5 NOVICE',
  'KANA SCHOLAR',
  'N5 APPRENTICE',
  'N5 JOURNEYMAN',
  'N5 MASTER',
  'N5 SENSEI',
] as const;

export type AccountTier = (typeof ACCOUNT_TIERS)[number];

export const BASE_TIER: AccountTier = 'N5 NOVICE';

/** Kana characters mastered (correct_streak >= 3) required for KANA SCHOLAR. */
export const KANA_MASTERY_MILESTONE = 46;
/** N5 APPRENTICE: 46 kana plus 2 Kanji groups OR 5 Vocab stages. */
export const APPRENTICE_KANJI_GROUPS = 2;
export const APPRENTICE_VOCAB_STAGES = 5;
/** N5 JOURNEYMAN: 5 Kanji groups and 14 Vocab stages. */
export const JOURNEYMAN_KANJI_GROUPS = 5;
export const JOURNEYMAN_VOCAB_STAGES = 14;
/** N5 MASTER: 8 Kanji groups and 28 Vocab stages. */
export const MASTER_KANJI_GROUPS = 8;
export const MASTER_VOCAB_STAGES = 28;
/** N5 SENSEI: all N5 content mastered plus 10 PvP wins. */
export const SENSEI_PVP_WINS = 10;

/** Snapshot of a user's learning progress used to evaluate their tier. */
export type TierProgress = {
  kanaMastered: number;
  kanaTotal: number;
  kanjiGroupsMastered: number;
  kanjiGroupsTotal: number;
  vocabStagesMastered: number;
  vocabStagesTotal: number;
  pvpWins: number;
};

/** Rank of a tier (higher is better); unknown stored values rank as base. */
export function getTierRank(tier: string): number {
  const index = ACCOUNT_TIERS.indexOf(tier as AccountTier);
  return index === -1 ? 0 : index;
}

/** True when `nextTier` outranks the tier currently stored on the profile. */
export function isTierPromotion(previousTier: string, nextTier: AccountTier): boolean {
  return getTierRank(nextTier) > getTierRank(previousTier);
}

/** True when every N5 module (kana, Kanji groups, Vocab stages) is mastered. */
export function isAllN5Mastered(progress: TierProgress): boolean {
  return (
    progress.kanaTotal > 0 &&
    progress.kanaMastered >= progress.kanaTotal &&
    progress.kanjiGroupsTotal > 0 &&
    progress.kanjiGroupsMastered >= progress.kanjiGroupsTotal &&
    progress.vocabStagesTotal > 0 &&
    progress.vocabStagesMastered >= progress.vocabStagesTotal
  );
}

/**
 * Highest tier whose milestones are all satisfied. Requirements stack: every
 * tier also implies the milestones of the tiers below it.
 */
export function evaluateAccountTier(progress: TierProgress): AccountTier {
  if (isAllN5Mastered(progress) && progress.pvpWins >= SENSEI_PVP_WINS) {
    return 'N5 SENSEI';
  }

  if (
    progress.kanjiGroupsMastered >= MASTER_KANJI_GROUPS &&
    progress.vocabStagesMastered >= MASTER_VOCAB_STAGES
  ) {
    return 'N5 MASTER';
  }

  if (
    progress.kanjiGroupsMastered >= JOURNEYMAN_KANJI_GROUPS &&
    progress.vocabStagesMastered >= JOURNEYMAN_VOCAB_STAGES
  ) {
    return 'N5 JOURNEYMAN';
  }

  if (
    progress.kanaMastered >= KANA_MASTERY_MILESTONE &&
    (progress.kanjiGroupsMastered >= APPRENTICE_KANJI_GROUPS ||
      progress.vocabStagesMastered >= APPRENTICE_VOCAB_STAGES)
  ) {
    return 'N5 APPRENTICE';
  }

  if (progress.kanaMastered >= KANA_MASTERY_MILESTONE) {
    return 'KANA SCHOLAR';
  }

  return BASE_TIER;
}
