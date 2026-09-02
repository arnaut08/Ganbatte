import { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import type { AssessmentHistoryRecord } from '../../types';
import AssessmentHistorySkeleton from './AssessmentHistorySkeleton';

const PAGE_SIZE = 10;

type AssessmentHistoryProps = {
  onBack: () => void;
};

function getDomainMeta(type: string) {
  const normalized = (type || '').toLowerCase();
  if (normalized.includes('grammar')) {
    return { accent: '#C084FC', label: 'GRAMMAR' };
  }
  if (normalized.includes('kanji')) {
    return { accent: '#70CFF8', label: 'KANJI' };
  }
  if (normalized.includes('vocab')) {
    return { accent: '#A3E636', label: 'VOCAB' };
  }
  return { accent: '#FFDE59', label: 'KANA' };
}

export default function AssessmentHistory({ onBack }: AssessmentHistoryProps) {
  const [results, setResults] = useState<AssessmentHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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
          setResults((data || []) as AssessmentHistoryRecord[]);
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
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]"
            title="Back to previous screen"
            aria-label="Back"
          >
            <span className="font-mono text-base font-black sm:text-lg">&lt;</span>
          </button>

          <div className="flex flex-col justify-center text-left">
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#FFDE59] sm:text-xs">
              // ARCHIVE: LOGS
            </span>
            <h1 className="text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-3xl">
              Assessment History
            </h1>
          </div>
        </div>

        <div className="border-2 border-black bg-[#70CFF8] px-2.5 py-1 font-mono text-[10px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:px-3 sm:text-xs sm:shadow-[2px_2px_0px_0px_#000]">
          {totalCount} RECORD{totalCount === 1 ? '' : 'S'}
        </div>
      </div>

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
            const domain = getDomainMeta(result.assessment_type);
            const isPerfect = result.score_percentage === 100;
            const isGood = result.score_percentage >= 70;
            const scoreBg = isPerfect ? 'bg-[#A3E636]' : isGood ? 'bg-[#FFDE59]' : 'bg-[#FF6B6B]';

            const totalHints = Array.isArray(result.details?.hints_used)
              ? result.details.hints_used.reduce((sum, v) => sum + Number(v || 0), 0)
              : 0;

            return (
              <div
                key={result.id}
                style={{ borderLeftColor: domain.accent }}
                className="flex flex-col justify-between gap-3 border-2 border-black border-l-8 bg-[#1f2637] p-3.5 text-white shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] sm:flex-row sm:items-center sm:p-4 sm:shadow-[4px_4px_0px_0px_#000]"
              >
                {/* Left: Assessment Metadata */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Domain Pill */}
                    <span
                      style={{ backgroundColor: domain.accent }}
                      className="border-2 border-black px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000] sm:text-[10px]"
                    >
                      {result.assessment_type.replaceAll('-', ' ')}
                    </span>

                    {/* Solo vs Multiplayer Tag */}
                    {result.companion_user_id ? (
                      <span className="border border-black bg-[#70CFF8] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase text-black sm:text-[10px]">
                        VS {result.profile?.display_name || 'OPPONENT'}
                      </span>
                    ) : (
                      <span className="border border-white/20 bg-[#151922] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-neutral-300 sm:text-[10px]">
                        SOLO
                      </span>
                    )}

                    {/* Group Pills */}
                    {Array.isArray(result.details?.groups) &&
                      result.details.groups.map((group) => (
                        <span
                          key={group}
                          className="border border-white/10 bg-[#151922] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-neutral-400 sm:text-[10px]"
                        >
                          {group}
                        </span>
                      ))}
                  </div>

                  {/* Timestamp & Hints */}
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-neutral-400 sm:text-[11px]">
                    <span>{new Date(result.created_at).toLocaleString()}</span>
                    {totalHints > 0 && (
                      <>
                        <span className="text-neutral-600">·</span>
                        <span className="text-[#70CFF8] font-bold">
                          HINTS USED: {totalHints}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Accuracy Breakdown & Score Card */}
                <div className="flex items-center justify-between border-t-2 border-white/10 pt-2 sm:border-t-0 sm:pt-0 sm:justify-end sm:gap-4">
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
                </div>
              </div>
            );
          })}

          {/* 6. Pagination Bar */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1.5 pt-3 sm:mt-8 sm:gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex h-9 items-center gap-1 border-2 border-black bg-white px-2.5 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:bg-[#151922] disabled:text-neutral-500 disabled:shadow-none sm:h-10 sm:px-3 sm:text-xs sm:shadow-[3px_3px_0px_0px_#000]"
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
                      className={`flex h-9 w-9 items-center justify-center border-2 border-black font-mono text-[10px] font-black transition-all sm:h-10 sm:w-10 sm:text-xs ${isActive
                          ? 'bg-[#FFDE59] text-black shadow-none ring-2 ring-black'
                          : 'bg-[#151922] text-white shadow-[2px_2px_0px_0px_#000] hover:bg-[#1f2637] sm:shadow-[3px_3px_0px_0px_#000]'
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
                className="flex h-9 items-center gap-1 border-2 border-black bg-white px-2.5 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:bg-[#151922] disabled:text-neutral-500 disabled:shadow-none sm:h-10 sm:px-3 sm:text-xs sm:shadow-[3px_3px_0px_0px_#000]"
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