import { useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAppContext } from '../contexts/AppContext';
import { useCelebrations } from '../contexts/CelebrationContext';
import {
  getCharacterAttempts,
  getKanaCards,
  getKanjiOverview,
  getPvpRecord,
  getVocabOverview,
  recordUserActivity,
} from '../services/api';
import { evaluateAccountTier, isTierPromotion, type TierProgress } from '../utils/accountTier';

/** A character is mastered after this many consecutive correct recalls. */
const KANA_MASTERY_STREAK_TARGET = 3;

type AttemptRow = {
  character?: string;
  character_id?: string;
  correct_streak?: number;
};

/** Counts distinct kana characters with a mastery-level recall streak. */
function countMasteredKana(attempts: unknown): number {
  const mastered = new Set<string>();
  const rows = (attempts as { attempts?: unknown[] } | null)?.attempts ?? [];
  rows.forEach((item) => {
    const attempt = item as AttemptRow;
    if (Number(attempt.correct_streak ?? 0) < KANA_MASTERY_STREAK_TARGET) return;
    const key = attempt.character_id || attempt.character;
    if (key) mastered.add(key);
  });
  return mastered.size;
}

/**
 * Fetches every progress source the tier evaluator needs. Each source fails
 * soft (totals 0) so one unavailable endpoint can never block celebrations.
 */
async function fetchTierProgress(): Promise<TierProgress> {
  const [kanjiData, vocabData, kanaDeckData, kanaAttempts, pvpData] = await Promise.all([
    getKanjiOverview().catch(() => null),
    getVocabOverview('N5').catch(() => null),
    getKanaCards().catch(() => null),
    getCharacterAttempts('kana').catch(() => null),
    getPvpRecord().catch(() => null),
  ]);

  const kanjiGroups = Array.isArray(kanjiData?.groups) ? kanjiData.groups : [];
  const vocabStages = Array.isArray(vocabData?.stages) ? vocabData.stages : [];
  const kanaDeckTotal = Array.isArray(kanaDeckData?.matrices)
    ? kanaDeckData.matrices.reduce(
        (total, matrix) => {
          const rows = [
            ...((matrix as { rows?: Array<{ cells?: string[] }> })?.rows ?? []),
            ...((matrix as { extras?: Array<{ cells?: string[] }> })?.extras ?? []),
          ];
          return total + rows.reduce((sum, row) => sum + (row.cells ?? []).filter(Boolean).length, 0);
        },
        0,
      )
    : 0;

  return {
    kanaMastered: countMasteredKana(kanaAttempts),
    kanaTotal: kanaDeckTotal,
    kanjiGroupsMastered: kanjiGroups.filter((group) => group?.is_mastered).length,
    kanjiGroupsTotal: kanjiGroups.length,
    vocabStagesMastered: vocabStages.filter((stage) => stage?.is_mastered).length,
    vocabStagesTotal: vocabStages.length,
    pvpWins: Number(pvpData?.record?.wins ?? 0),
  };
}

/**
 * Records key learning actions and turns the outcome into celebrations.
 *
 * Flow: `recordUserActivity()` (server RPC) → streak popup when the streak was
 * extended → evaluate the account tier from fresh progress → persist a
 * promotion to `profiles.account_tier` and pop the tier popup when the
 * evaluated tier outranks the stored one.
 */
export default function useActivityRecorder() {
  const { user } = useAppContext();
  const { queueCelebration } = useCelebrations();

  const recordActivity = useCallback(async () => {
    if (!user) return;

    try {
      const { activity } = await recordUserActivity();

      if (activity?.streak_extended) {
        queueCelebration({ kind: 'streak', count: Number(activity.current_streak) || 1 });
      }

      const progress = await fetchTierProgress();
      const newTier = evaluateAccountTier(progress);
      if (!activity || !isTierPromotion(activity.previous_tier, newTier)) return;
      if (!supabase) return;

      const { error } = await supabase
        .from('profiles')
        .update({ account_tier: newTier })
        .eq('id', user.id);

      if (error) {
        console.warn('Unable to save account tier promotion:', error);
        return;
      }

      queueCelebration({ kind: 'tier', tier: newTier });
    } catch (error) {
      console.warn('Activity recording skipped:', error);
    }
  }, [queueCelebration, user]);

  return { recordActivity };
}
