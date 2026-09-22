import { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import type { AssessmentHistoryRecord } from '../../types';
import AssessmentHistorySkeleton from './AssessmentHistorySkeleton';
import DataRow from '@/components/common/DataRow';
import GlobalPageHeader from '@/components/common/GlobalPageHeader';

const PAGE_SIZE = 10;

type AssessmentHistoryProps = {
  onBack: () => void;
};

interface GauntletDetails {
  mode?: string;
  score?: number;
  result?: 'WIN' | 'DEFEAT' | string;
  deck_type?: string;
  opponent_score?: number;
  selected_groups?: string[];
  hints_used?: number[];
  groups?: string[];
  round_limit?: number;
  rounds_played?: number;
  completion_reason?: string;
}

function getDomainMeta(type: string, details?: GauntletDetails) {
  const isMinefield =
    details?.mode === 'minefield' ||
    (type || '').toLowerCase().includes('minefield');

  if (isMinefield) {
    return { accent: '#A3E636', label: 'MINEFIELD // VOCAB', isGauntlet: true };
  }

  const isGauntlet =
    details?.mode === 'survival-gauntlet' ||
    (type || '').toLowerCase().includes('gauntlet');

  if (isGauntlet) {
    const deck = (details?.deck_type || '').toLowerCase();
    if (deck === 'kanji') {
      return { accent: '#70CFF8', label: 'GAUNTLET // KANJI', isGauntlet: true };
    }
    return { accent: '#FFDE59', label: 'GAUNTLET // KANA', isGauntlet: true };
  }

  const normalized = (type || '').toLowerCase();
  if (normalized.includes('grammar')) {
    return { accent: '#C084FC', label: 'GRAMMAR', isGauntlet: false };
  }
  if (normalized.includes('kanji')) {
    return { accent: '#70CFF8', label: 'KANJI', isGauntlet: false };
  }
  if (normalized.includes('vocab')) {
    return { accent: '#A3E636', label: 'VOCAB', isGauntlet: false };
  }
  return { accent: '#FFDE59', label: 'KANA', isGauntlet: false };
}

export default function AssessmentHistory({ onBack }: AssessmentHistoryProps) {
  const [results, setResults] = useState<AssessmentHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stageTitles, setStageTitles] = useState<Record<string, string>>({});

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      setIsLoading(true);
      setError('');

      if (!supabase) {
        setError('Database connection not available');
        setIsLoading(false);
        return;
      }

      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      try {
        const { data, count, error: queryError } = await supabase
          .from('assessment_results')
          .select(
            'id, assessment_type, score_percentage, correct_questions, total_questions, created_at, companion_user_id, details, profile:profiles!companion_user_id(display_name)',
            { count: 'exact' }
          )
          .order('created_at', { ascending: false })
          .range(from, to);

        if (cancelled) return;

        if (queryError) {
          setError('Failed to load assessment records');
        } else {
          const historyResults = (data || []) as AssessmentHistoryRecord[];
          const stageNumbers = Array.from(new Set(
            historyResults.flatMap((record) => {
              const details = record.details;
              const groups = Array.isArray(details?.selected_groups)
                ? details.selected_groups
                : details?.groups ?? [];
              return groups.filter((group) => /^\d+$/.test(group));
            }),
          ))

          if (stageNumbers.length > 0) {
            const { data: stages } = await supabase
              .from('vocab_items')
              .select('stage_number, theme')
              .in('stage_number', stageNumbers.map(Number));

            const titles = (stages ?? []).reduce<Record<string, string>>((map, stage) => {
              if (stage.theme) map[String(stage.stage_number)] = stage.theme;
              return map;
            }, {});
            if (!cancelled) setStageTitles(titles);
          }

          setResults(historyResults);
          setTotalCount(count ?? (data ? data.length : 0));
        }
      } catch {
        if (!cancelled) {
          setError('An unexpected error occurred');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <main className="container mx-auto max-w-4xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-8 pb-20 sm:pb-28">
      <GlobalPageHeader
        onBack={onBack}
        punchline="// ARCHIVE: LOGS"
        title="Assessment History"
        accentClass="text-[#FFDE59]"
        rightSlot={(
          <span className="border-2 border-black bg-[#70CFF8] px-2.5 py-1 font-mono text-[10px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:px-3 sm:text-xs sm:shadow-[2px_2px_0px_0px_#000]">
            {totalCount} RECORD{totalCount === 1 ? '' : 'S'}
          </span>
        )}
      />

      {/* 2. Loading Skeleton */}
      {isLoading && <AssessmentHistorySkeleton />}

      {/* 3. Error Banner */}
      {error && !isLoading && (
        <div className="border-2 border-black bg-[#FF6B6B] p-3 text-center font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000] sm:p-4 sm:text-sm sm:shadow-[4px_4px_0px_0px_#000]">
          {error}
        </div>
      )}

      {/* 4. Empty State */}
      {!isLoading && !error && results.length === 0 && (
        <div className="flex flex-col items-center justify-center border-2 border-black bg-[#1f2637] p-8 text-center shadow-[4px_4px_0px_0px_#000] sm:p-14 sm:shadow-[6px_6px_0px_0px_#000]">
          <span className="font-mono text-3xl font-black text-neutral-500 sm:text-4xl mb-2">[Ø]</span>
          <p className="text-base font-black uppercase text-white sm:text-lg">No Assessment Records</p>
          <p className="mt-1 font-mono text-[10px] font-medium text-neutral-400 sm:text-xs">
            Complete a solo study or 1v1 multiplayer drill to view logs here.
          </p>
        </div>
      )}

      {/* 5. Results List */}
      {!isLoading && !error && results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => {
            const details = (result.details || {}) as GauntletDetails;
            const isGauntlet =
              details?.mode === 'minefield' ||
              result.assessment_type?.toLowerCase().includes('minefield') ||
              details?.mode === 'survival-gauntlet' ||
              result.assessment_type?.toLowerCase().includes('gauntlet');

            const domain = getDomainMeta(result.assessment_type, details);
            const isVictory = details?.result === 'WIN';
            const gauntletScore = details?.score ?? 0;
            const opponentScore = details?.opponent_score ?? 0;
            const resultGroups = Array.isArray(details?.groups) ? details.groups : details?.selected_groups;

            // Standard metrics
            const isPerfect = result.score_percentage === 100;
            const isGood = result.score_percentage >= 70;
            const scoreBg = isPerfect ? 'bg-[#A3E636]' : isGood ? 'bg-[#FFDE59]' : 'bg-[#FF6B6B]';

            const totalHints = Array.isArray(details?.hints_used)
              ? details.hints_used.reduce((sum, v) => sum + Number(v || 0), 0)
              : 0;

            return (
              <DataRow
                key={result.id}
                accentColor={domain.accent}
                left={(
                  <>
                    {/* Left: Metadata */}
                    <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Mode / Domain Tag */}
                    <span
                      style={{ backgroundColor: domain.accent }}
                      className="border-2 border-black px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000] sm:text-[10px]"
                    >
                      {domain.label}
                    </span>

                    {/* Opponent Tag */}
                    {result.companion_user_id ? (
                      <span className="border border-black bg-[#70CFF8] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase text-black sm:text-[10px]">
                        VS {result.profile?.display_name || 'OPPONENT'}
                      </span>
                    ) : (
                      <span className="border border-white/20 bg-[#151922] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-neutral-300 sm:text-[10px]">
                        SOLO
                      </span>
                    )}

                    {/* Gauntlet Result Pill (WIN / DEFEAT) */}
                    {isGauntlet && details?.result && (
                      <span
                        className={`border-2 border-black px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000] ${isVictory ? 'bg-[#A3E636]' : 'bg-[#FF6B6B]'
                          }`}
                      >
                        {details.result}
                      </span>
                    )}

                    {/* Groups Filtered */}
                    {resultGroups?.map((group) => (
                        <span
                          key={group}
                          className="border border-white/10 bg-[#151922] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-neutral-400 sm:text-[10px]"
                        >
                          {stageTitles[group] || group}
                        </span>
                      ))}
                  </div>

                  {/* Timestamp & Hints */}
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-neutral-400 sm:text-[11px]">
                    <span>{new Date(result.created_at).toLocaleString()}</span>
                    {!isGauntlet && totalHints > 0 && (
                      <>
                        <span className="text-neutral-600">·</span>
                        <span className="text-[#70CFF8] font-bold">
                          HINTS USED: {totalHints}
                        </span>
                      </>
                    )}
                  </div>
                    </div>
                  </>
                )}

                right={(
                  /* Right: Score Display */
                  isGauntlet ? (
                  /* Gauntlet Specific Layout */
                  <>
                    <div className="text-left sm:text-right font-mono">
                      <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400 sm:text-[10px]">
                        OPPONENT SCORE
                      </span>
                      <p className="text-xs font-bold text-neutral-300 sm:text-sm">
                        {opponentScore.toLocaleString()} PTS
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center border-2 border-black bg-[#FFDE59] px-3 py-1 font-mono text-black shadow-[2px_2px_0px_0px_#000] sm:px-4 sm:shadow-[2.5px_2.5px_0px_0px_#000]">
                      <span className="text-[8px] font-black uppercase tracking-wider text-black/70 leading-none">
                        FINAL SCORE
                      </span>
                      <span className="text-base font-black leading-tight sm:text-xl">
                        {gauntletScore.toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  /* Standard Assessment Layout */
                  <>
                    <div className="text-left sm:text-right">
                      <span className="font-mono text-[9px] font-black uppercase tracking-wider text-neutral-400 sm:text-[10px]">
                        ACCURACY
                      </span>
                      <p className="font-mono text-xs font-bold text-white sm:text-sm">
                        {result.correct_questions}/{result.total_questions} CORRECT
                      </p>
                    </div>

                    <div
                      className={`flex h-10 min-w-[56px] items-center justify-center border-2 border-black ${scoreBg} px-2 font-mono text-lg font-black text-black shadow-[2px_2px_0px_0px_#000] sm:h-12 sm:min-w-[68px] sm:text-2xl sm:shadow-[2.5px_2.5px_0px_0px_#000]`}
                    >
                      {result.score_percentage}%
                    </div>
                  </>
                ))}
              />
            );
          })}

          {/* 6. Pagination Bar */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1.5 pt-3 sm:mt-8 sm:gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex h-9 cursor-pointer items-center gap-1 border-2 border-black bg-white px-2.5 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all enabled:hover:translate-x-[1px] enabled:hover:translate-y-[1px] enabled:hover:shadow-[1px_1px_0px_0px_#000] enabled:active:translate-x-[2px] enabled:active:translate-y-[2px] enabled:active:shadow-none disabled:cursor-default disabled:bg-[#151922] disabled:text-neutral-500 disabled:shadow-none sm:h-10 sm:px-3 sm:text-xs sm:shadow-[3px_3px_0px_0px_#000]"
              >
                <ChevronLeftIcon className="h-4 w-4 stroke-[2.5]" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1 sm:gap-1.5">
                {pageNumbers.map((page) => {
                  const isActive = page === currentPage;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-black font-mono text-[10px] font-black transition-all sm:h-10 sm:w-10 sm:text-xs ${isActive
                          ? 'bg-[#FFDE59] text-black shadow-none ring-2 ring-black'
                          : 'bg-[#151922] text-white shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#1f2637] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:shadow-[3px_3px_0px_0px_#000]'
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex h-9 cursor-pointer items-center gap-1 border-2 border-black bg-white px-2.5 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all enabled:hover:translate-x-[1px] enabled:hover:translate-y-[1px] enabled:hover:shadow-[1px_1px_0px_0px_#000] enabled:active:translate-x-[2px] enabled:active:translate-y-[2px] enabled:active:shadow-none disabled:cursor-not-allowed disabled:bg-[#151922] disabled:text-neutral-500 disabled:shadow-none sm:h-10 sm:px-3 sm:text-xs sm:shadow-[3px_3px_0px_0px_#000]"
              >
                <span>Next</span>
                <ChevronRightIcon className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}