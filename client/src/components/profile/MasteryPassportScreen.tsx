import { useEffect, useState, useMemo } from 'react';
import { getKanjiOverview, getCharacterAttempts, getKanaCards, getVocabOverview, getPvpRecord } from '../../services/api';
import type { KanjiGroupOverview, VocabOverview, CharacterAttempt, PvpRecord } from '../../types';
import { evaluateAccountTier } from '../../utils/accountTier';
import { FlameIcon } from '@/components/ui/flameIcon';
import useProfileStreak from '../../hooks/useProfileStreak';
import { LightningBoltIcon } from '@radix-ui/react-icons';
import { MasteryPassportSkeleton } from './MasteryPassportSkeleton';

type MasteryPassportScreenProps = {
  onBack: () => void;
  onOpenKanaStudy: () => void;
  onOpenKanjiStudy: () => void;
  onOpenVocabStudy: () => void;
  onOpenGrammarStudy: () => void;
  onOpenHistory: () => void;
};

const EMPTY_PVP_RECORD: PvpRecord = { totalMatches: 0, wins: 0, losses: 0, ties: 0, winRate: 0 };

type KanaMasteryStats = {
  hiraganaBasic: number;
  katakanaBasic: number;
  dakuten: number;
  combos: number;
  total: number;
};

type KanaCellCategory = 'hiraganaBasic' | 'katakanaBasic' | 'dakuten' | 'combos';

type KanaMatrixLike = {
  script?: string;
  type?: string;
  rows?: Array<{ cells?: string[] }>;
  extras?: Array<{ cells?: string[] }>;
};

const TOTAL_GENKI_LESSONS = 12;

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

function countKanaByCategory(map: Map<string, KanaCellCategory>): KanaMasteryStats {
  const counts: Record<KanaCellCategory, number> = { hiraganaBasic: 0, katakanaBasic: 0, dakuten: 0, combos: 0 };
  map.forEach((category) => {
    counts[category] += 1;
  });
  return { ...counts, total: map.size };
}

export default function MasteryPassportScreen({
  onBack,
  onOpenKanaStudy,
  onOpenKanjiStudy,
  onOpenVocabStudy,
  onOpenGrammarStudy,
  onOpenHistory,
}: MasteryPassportScreenProps) {
  const [kanjiOverview, setKanjiOverview] = useState<KanjiGroupOverview[]>([]);
  const [vocabOverview, setVocabOverview] = useState<VocabOverview | null>(null);
  const [kanaMastery, setKanaMastery] = useState<KanaMasteryStats>({
    hiraganaBasic: 0,
    katakanaBasic: 0,
    dakuten: 0,
    combos: 0,
    total: 0,
  });
  const [kanaTotals, setKanaTotals] = useState<KanaMasteryStats>({
    hiraganaBasic: 0,
    katakanaBasic: 0,
    dakuten: 0,
    combos: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [pvpRecord, setPvpRecord] = useState<PvpRecord>(EMPTY_PVP_RECORD);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [kanjiData, vocabData, kanaDeckData, kanaData, pvpData] = await Promise.all([
          getKanjiOverview().catch(() => ({ groups: [] })),
          getVocabOverview('N5').catch(() => ({ level: 'N5', stages: [] })),
          getKanaCards().catch(() => ({ cards: [], groups: [], matrices: [] })),
          getCharacterAttempts('kana').catch(() => ({ attempts: [] })),
          getPvpRecord().catch(() => null),
        ]);

        if (cancelled) return;

        setKanjiOverview(kanjiData.groups || []);
        setVocabOverview(vocabData);
        if (pvpData?.record) {
          setPvpRecord(pvpData.record);
        }

        const categoryByCharacter = buildKanaCategoryMap(
          Array.isArray(kanaDeckData?.matrices) ? (kanaDeckData.matrices as KanaMatrixLike[]) : []
        );
        const kanaDeckTotals = countKanaByCategory(categoryByCharacter);
        setKanaTotals(kanaDeckTotals);

        const mastered: Record<KanaCellCategory, number> = { hiraganaBasic: 0, katakanaBasic: 0, dakuten: 0, combos: 0 };
        ((kanaData?.attempts as CharacterAttempt[]) || []).forEach((attempt) => {
          if (Number(attempt.correct_streak ?? 0) < 3) return;
          const character = typeof attempt.character === 'string' ? attempt.character : '';
          const category = character ? categoryByCharacter.get(character) : undefined;
          if (category) mastered[category] += 1;
        });

        setKanaMastery({
          hiraganaBasic: Math.min(mastered.hiraganaBasic, kanaDeckTotals.hiraganaBasic),
          katakanaBasic: Math.min(mastered.katakanaBasic, kanaDeckTotals.katakanaBasic),
          dakuten: Math.min(mastered.dakuten, kanaDeckTotals.dakuten),
          combos: Math.min(mastered.combos, kanaDeckTotals.combos),
          total: Math.min(
            mastered.hiraganaBasic + mastered.katakanaBasic + mastered.dakuten + mastered.combos,
            kanaDeckTotals.total
          ),
        });
      } catch (error) {
        console.error('Failed to load passport data:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const vocabStats = useMemo(() => {
    const stages = vocabOverview?.stages || [];
    const masteredStages = stages.filter((s) => s.is_mastered).length;
    const clearedStages = stages.filter((s) => s.is_cleared).length;
    const dueWords = stages.reduce((total, stage) => total + stage.due_words, 0);
    const totalStages = stages.length || 28;
    return { masteredStages, clearedStages, dueWords, totalStages };
  }, [vocabOverview]);

  const kanjiStats = useMemo(() => {
    const totalGroups = kanjiOverview.length || 8;
    const masteredGroups = kanjiOverview.filter((g) => g.is_mastered).length;
    const clearedGroups = kanjiOverview.filter((g) => g.is_cleared).length;
    const dueCharacters = kanjiOverview.reduce((acc, curr) => acc + (curr.due_characters || 0), 0);
    const totalCharacters = kanjiOverview.reduce((acc, curr) => acc + (curr.total_characters || 0), 0);
    const masteredCharacters = kanjiOverview.reduce((acc, curr) => acc + (curr.mastered_characters || 0), 0);
    return { totalGroups, masteredGroups, clearedGroups, dueCharacters, totalCharacters, masteredCharacters };
  }, [kanjiOverview]);

  const totalDueReviews = useMemo(
    () => kanjiStats.dueCharacters + vocabStats.dueWords,
    [kanjiStats.dueCharacters, vocabStats.dueWords]
  );

  const accountTier = useMemo(
    () =>
      evaluateAccountTier({
        kanaMastered: kanaMastery.total,
        kanaTotal: kanaTotals.total,
        kanjiGroupsMastered: kanjiStats.masteredGroups,
        kanjiGroupsTotal: kanjiStats.totalGroups,
        vocabStagesMastered: vocabStats.masteredStages,
        vocabStagesTotal: vocabStats.totalStages,
        pvpWins: pvpRecord.wins,
      }),
    [kanaMastery.total, kanaTotals.total, kanjiStats, vocabStats, pvpRecord.wins]
  );

  const profileStreak = useProfileStreak();

  if (isLoading) {
    return (
      <MasteryPassportSkeleton />
    );
  }

  return (
    <main className="container mx-auto max-w-5xl space-y-4 sm:space-y-6 px-3 py-3 sm:px-4 sm:py-6 pb-20 sm:pb-28">
      {/* Header Section */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          title="Back to previous screen"
        >
          <span className="font-mono text-sm sm:text-lg font-black">&lt;</span>
        </button>

        <div className="flex flex-col justify-center">
          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#A3E636] sm:text-xs">
            // PLAYER PROFILE &amp; RECORDS
          </span>
          <h1 className="font-mono text-xl font-black uppercase tracking-tight text-white sm:text-3xl">
            MASTERY PASSPORT
          </h1>
        </div>
      </div>

      {/* Top Stats Strip */}
      {/* Top Stats Strip */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
        {/* 01 // Account Tier Card */}
        <div className="flex flex-col justify-between border-2 border-black bg-[#252c3d] p-3 sm:p-4 shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#FFDE59] sm:text-[10px]">
              ACCOUNT TIER
            </span>
            <span className="border border-black bg-black px-1.5 py-0.2 font-mono text-[8px] font-black uppercase tracking-wider text-[#FFDE59]">
              RANK
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-1">
            <p className="font-mono text-base font-black uppercase text-white sm:text-xl truncate">
              {accountTier || 'N5 NOVICE'}
            </p>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-black/40 pt-1.5 font-mono text-[8px] font-bold uppercase text-neutral-400 sm:text-[9px]">
            <span>N5 PROGRESS</span>
            <span className="font-mono font-black text-[#A3E636]">
              {Math.round(
                (((kanaMastery.total / (kanaTotals.total || 1)) +
                  (kanjiStats.masteredGroups / kanjiStats.totalGroups) +
                  (vocabStats.clearedStages / vocabStats.totalStages)) / 3) * 100
              )}% COMPLETE
            </span>
          </div>
        </div>

        {/* 02 // Streak Card */}
        <div className="flex flex-col justify-between border-2 border-black bg-[#252c3d] p-3 sm:p-4 shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono text-[9px] font-black uppercase tracking-wider text-white sm:text-[10px]">
              <FlameIcon
                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                active={(profileStreak?.currentStreak ?? 0) > 0}
              />
              <span>DAILY STREAK</span>
            </div>
            <span className="border border-black bg-black px-1.5 py-0.2 font-mono text-[8px] font-black uppercase tracking-wider text-[#FF6B6B]">
              MOMENTUM
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className="font-mono text-lg font-black uppercase text-[##FF6B6B] sm:text-2xl leading-none">
              {profileStreak?.currentStreak ?? 0}
            </p>
            <span className="font-mono text-[10px] font-black uppercase text-neutral-300 sm:text-xs">
              {(profileStreak?.currentStreak ?? 0) === 1 ? 'DAY' : 'DAYS'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-black/40 pt-1.5 font-mono text-[8px] font-bold uppercase text-neutral-400 sm:text-[9px]">
            <span>LONGEST</span>
            <span className="text-white">
              {profileStreak?.longestStreak ? `${profileStreak.longestStreak} DAYS` : '—'}
            </span>
          </div>
        </div>

        {/* 03 // Due Reviews Card */}
        <div
          className={`flex flex-col justify-between border-2 border-black p-3 sm:p-4 shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] ${totalDueReviews > 0 ? 'bg-[#FF6B6B]' : 'bg-[#252c3d]'
            }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`flex items-center gap-1 font-mono text-[9px] font-black uppercase tracking-wider sm:text-[10px] ${totalDueReviews > 0 ? 'text-black' : 'text-[#A3E636]'
                }`}
            >
              <LightningBoltIcon
                className={`h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3 ${
                  totalDueReviews > 0 ? 'text-black' : 'text-[#A3E636]'
                }`}
              />
              REVIEWS DUE
            </span>
            <span
              className={`border border-black px-1.5 py-0.2 font-mono text-[8px] font-black uppercase tracking-wider ${totalDueReviews > 0 ? 'bg-black text-[#FF6B6B]' : 'bg-black text-[#A3E636]'
                }`}
            >
              QUEUE
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p
              className={`font-mono text-lg font-black uppercase sm:text-2xl leading-none ${totalDueReviews > 0 ? 'text-black' : 'text-white'
                }`}
            >
              {totalDueReviews}
            </p>
            <span
              className={`font-mono text-[10px] font-black uppercase sm:text-xs ${totalDueReviews > 0 ? 'text-black/80' : 'text-neutral-400'
                }`}
            >
              PENDING
            </span>
          </div>
          <div
            className={`mt-1 flex items-center justify-between border-t pt-1.5 font-mono text-[8px] font-bold uppercase sm:text-[9px] ${totalDueReviews > 0
              ? 'border-black/30 text-black/90'
              : 'border-black/40 text-neutral-400'
              }`}
          >
            <span>BREAKDOWN</span>
            <span className={totalDueReviews > 0 ? 'font-black text-black' : 'text-white'}>
              {kanjiStats.dueCharacters} Kanji · {vocabStats.dueWords} Vocab
            </span>
          </div>
        </div>
      </div>

      {/* Core Learning Modules Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Card 01 // Kana Mastery Matrix */}
        <div className="border-2 border-black bg-[#151922] shadow-[4px_4px_0px_0px_#000000] overflow-hidden">
          <div className="bg-[#FFDE59] p-3 sm:p-4 border-b-2 border-black">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black sm:text-xs">
                01 // KANA MASTERY
              </span>
              <span className="font-mono text-xs font-black text-black sm:text-sm">
                {kanaMastery.total}/{kanaTotals.total}
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="h-3 w-full overflow-hidden border-2 border-black bg-[#252c3d]">
              <div
                className="h-full bg-[#FFDE59] transition-all"
                style={{ width: `${Math.min(100, (kanaMastery.total / (kanaTotals.total || 1)) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="border border-black/40 bg-[#252c3d] p-2">
                <span className="font-mono text-[8px] font-black uppercase text-neutral-400">Hiragana Basic</span>
                <p className="font-mono text-xs font-black text-[#FFDE59]">{kanaMastery.hiraganaBasic}/{kanaTotals.hiraganaBasic}</p>
              </div>
              <div className="border border-black/40 bg-[#252c3d] p-2">
                <span className="font-mono text-[8px] font-black uppercase text-neutral-400">Katakana Basic</span>
                <p className="font-mono text-xs font-black text-[#FFDE59]">{kanaMastery.katakanaBasic}/{kanaTotals.katakanaBasic}</p>
              </div>
              <div className="border border-black/40 bg-[#252c3d] p-2">
                <span className="font-mono text-[8px] font-black uppercase text-neutral-400">Dakuten/Handakuten</span>
                <p className="font-mono text-xs font-black text-[#FFDE59]">{kanaMastery.dakuten}/{kanaTotals.dakuten}</p>
              </div>
              <div className="border border-black/40 bg-[#252c3d] p-2">
                <span className="font-mono text-[8px] font-black uppercase text-neutral-400">Combos (Yōon)</span>
                <p className="font-mono text-xs font-black text-[#FFDE59]">{kanaMastery.combos}/{kanaTotals.combos}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenKanaStudy}
              className="w-full border-2 border-black bg-[#FFDE59] py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Review Kana Deck →
            </button>
          </div>
        </div>

        {/* Card 02 // N5 Kanji Groups (Standardized 2x2 Grid) */}
        <div className="flex flex-col border-2 border-black bg-[#151922] shadow-[4px_4px_0px_0px_#000000] overflow-hidden">
          {/* Card Header */}
          <div className="bg-[#70CFF8] p-3 sm:p-4 border-b-2 border-black">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black sm:text-xs">
                02 // N5 KANJI GROUPS
              </span>
              <span className="font-mono text-xs font-black text-black sm:text-sm">
                {kanjiStats.masteredGroups}/{kanjiStats.totalGroups} GROUPS
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="flex flex-1 flex-col justify-between p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Segmented Progress Bar */}
            <div className="flex h-3 w-full overflow-hidden border-2 border-black bg-[#252c3d]">
              <div
                className="h-full bg-[#70CFF8] transition-all"
                style={{ width: `${Math.min(100, (kanjiStats.masteredGroups / kanjiStats.totalGroups) * 100)}%` }}
                title={`${kanjiStats.masteredGroups} Mastered Groups`}
              />
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(
                    100 - (kanjiStats.masteredGroups / kanjiStats.totalGroups) * 100,
                    ((kanjiStats.clearedGroups - kanjiStats.masteredGroups) / kanjiStats.totalGroups) * 100
                  )}%`,
                  backgroundImage: 'repeating-linear-gradient(45deg, #70CFF8, #70CFF8 2px, #151922 2px, #151922 4px)',
                }}
                title={`${kanjiStats.clearedGroups} Cleared Groups`}
              />
            </div>

            {/* 2x2 Stats Grid (Matches Kana & Grammar cards) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-black/40 bg-[#252c3d] p-2">
                <span className="font-mono text-[8px] font-black uppercase text-neutral-400">★ Mastered Groups</span>
                <p className="font-mono text-xs font-black text-[#70CFF8]">
                  {kanjiStats.masteredGroups}/{kanjiStats.totalGroups}
                </p>
              </div>
              <div className="border border-black/40 bg-[#252c3d] p-2">
                <span className="font-mono text-[8px] font-black uppercase text-neutral-400">✓ Cleared Groups</span>
                <p className="font-mono text-xs font-black text-[#70CFF8]">
                  {kanjiStats.clearedGroups}/{kanjiStats.totalGroups}
                </p>
              </div>
              <div className="border border-black/40 bg-[#252c3d] p-2">
                <span className="font-mono text-[8px] font-black uppercase text-neutral-400">Characters Mastered</span>
                <p className="font-mono text-xs font-black text-[#70CFF8]">
                  {kanjiStats.masteredCharacters}/{kanjiStats.totalCharacters || 98}
                </p>
              </div>
              <div className="border border-black/40 bg-[#252c3d] p-2">
                <span className="font-mono text-[8px] font-black uppercase text-neutral-400">⏱ Due Reviews</span>
                <p className="font-mono text-xs font-black text-[#70CFF8]">
                  {kanjiStats.dueCharacters}
                </p>
              </div>
            </div>

            {/* CTA Button pinned to bottom */}
            <button
              type="button"
              onClick={onOpenKanjiStudy}
              className="mt-auto w-full border-2 border-black bg-[#70CFF8] py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Open Kanji Groups →
            </button>
          </div>
        </div>

        {/* Card 03 // Vocab SRS Curriculum */}
        <div className="border-2 border-black bg-[#151922] shadow-[4px_4px_0px_0px_#000000] overflow-hidden">
          <div className="bg-[#A3E636] p-3 sm:p-4 border-b-2 border-black">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black sm:text-xs">
                03 // VOCAB SRS
              </span>
              <span className="font-mono text-xs font-black text-black sm:text-sm">
                {vocabStats.masteredStages}/{vocabStats.totalStages} STAGES
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="flex h-3 w-full overflow-hidden border-2 border-black bg-[#252c3d]">
              <div
                className="h-full bg-[#A3E636] transition-all"
                style={{ width: `${Math.min(100, (vocabStats.masteredStages / vocabStats.totalStages) * 100)}%` }}
                title={`${vocabStats.masteredStages} Mastered Stages`}
              />
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(
                    100 - (vocabStats.masteredStages / vocabStats.totalStages) * 100,
                    ((vocabStats.clearedStages - vocabStats.masteredStages) / vocabStats.totalStages) * 100
                  )}%`,
                  backgroundImage: 'repeating-linear-gradient(45deg, #A3E636, #A3E636 2px, #151922 2px, #151922 4px)',
                }}
                title={`${vocabStats.clearedStages} Cleared Stages`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="border border-black/40 bg-[#252c3d] p-2 text-center">
                <span className="font-mono text-[8px] font-black uppercase text-neutral-400">★ Mastered</span>
                <p className="font-mono text-sm font-black text-[#A3E636]">{vocabStats.masteredStages}</p>
              </div>
              <div className="border border-black/40 bg-[#252c3d] p-2 text-center">
                <span className="font-mono text-[8px] font-black uppercase text-neutral-400">✓ Cleared</span>
                <p className="font-mono text-sm font-black text-[#A3E636]">{vocabStats.clearedStages}</p>
              </div>
              <div className="border border-black/40 bg-[#252c3d] p-2 text-center">
                <span className="font-mono text-[8px] font-black uppercase text-neutral-400">⏱ Due</span>
                <p className="font-mono text-sm font-black text-[#A3E636]">{vocabStats.dueWords}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenVocabStudy}
              className="w-full border-2 border-black bg-[#A3E636] py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Drill Vocabulary →
            </button>
          </div>
        </div>

        {/* Card 04 // Genki 1 Grammar Progress */}
        <div className="border-2 border-black bg-[#151922] shadow-[4px_4px_0px_0px_#000000] overflow-hidden">
          <div className="bg-[#C084FC] p-3 sm:p-4 border-b-2 border-black">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black sm:text-xs">
                04 // GRAMMAR
              </span>
              <span className="font-mono text-xs font-black text-black sm:text-sm">
                N5 LESSONS
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="h-3 w-full overflow-hidden border-2 border-black bg-[#252c3d]">
              <div
                className="h-full bg-[#C084FC] transition-all"
                style={{ width: `${Math.min(100, (TOTAL_GENKI_LESSONS / TOTAL_GENKI_LESSONS) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="border border-black/40 bg-[#252c3d] p-2">
                <span className="font-mono text-[8px] font-black uppercase text-neutral-400">Total Lessons</span>
                <p className="font-mono text-xs font-black text-[#C084FC]">{TOTAL_GENKI_LESSONS}</p>
              </div>
              <div className="border border-black/40 bg-[#252c3d] p-2">
                <span className="font-mono text-[8px] font-black uppercase text-neutral-400">Level</span>
                <p className="font-mono text-xs font-black text-[#C084FC]">GENKI 1</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenGrammarStudy}
              className="w-full border-2 border-black bg-[#C084FC] py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Study Grammar →
            </button>
          </div>
        </div>
      </div>

      {/* PvP Match Snapshot */}
      <div className="border-2 border-black bg-[#151922] p-3 sm:p-4 shadow-[4px_4px_0px_0px_#000000]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#70CFF8] sm:text-xs">
              MULTIPLAYER 1v1 RECORD
            </span>
            <p className="mt-1 font-mono text-xs font-black uppercase text-white sm:text-sm">
              Win Rate: {pvpRecord.winRate}% · Total Matches: {pvpRecord.totalMatches}
            </p>
            {pvpRecord.totalMatches > 0 && (
              <p className="mt-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-neutral-400 sm:text-[11px]">
                W {pvpRecord.wins} · L {pvpRecord.losses} · T {pvpRecord.ties}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onOpenHistory}
            className="border-2 border-black bg-[#70CFF8] px-4 py-2 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:text-xs"
          >
            View Full Assessment History →
          </button>
        </div>
      </div>
    </main>
  );
}