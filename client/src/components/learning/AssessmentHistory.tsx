import { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import type { AssessmentHistoryRecord } from '../../types';

const PAGE_SIZE = 10;

type AssessmentHistoryProps = {
  onBack: () => void;
};

function AssessmentHistory({ onBack }: AssessmentHistoryProps) {
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
          // Fallback to data length if count is undefined
          setTotalCount(count ?? (data ? data.length : 0));
        }
      } catch (err) {
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
    <main className="container mx-auto max-w-4xl space-y-3.5 sm:space-y-6 px-3 py-3 sm:px-4 sm:py-6 pb-20 sm:pb-28">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
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
            <span className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
          // ARCHIVE: LOGS
            </span>
            <h1 className="text-base sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
              Assessment History
            </h1>
          </div>
        </div>

        <div className="border-2 border-black bg-[#70CFF8] px-2 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
          {totalCount} RECORD{totalCount === 1 ? '' : 'S'}
        </div>
      </div>

      {/* 2. Loading Skeleton */}
      {isLoading && (
        <div className="space-y-2.5 sm:space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-2 border-black bg-[#1a1f2c] p-3.5 sm:p-5 shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000]"
            >
              <div className="space-y-1.5 sm:space-y-2">
                <div className="h-4 sm:h-5 w-32 sm:w-40 bg-[#252c3d] animate-pulse" />
                <div className="h-3 sm:h-4 w-24 sm:w-28 bg-[#252c3d] animate-pulse" />
              </div>
              <div className="h-10 sm:h-12 w-14 sm:w-16 bg-[#252c3d] animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* 3. Error Banner */}
      {error && !isLoading && (
        <div className="border-2 border-black bg-[#FF6B6B] p-3 sm:p-4 text-center font-mono text-xs sm:text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000]">
          {error}
        </div>
      )}

      {/* 4. Empty State */}
      {!isLoading && !error && results.length === 0 && (
        <div className="flex flex-col items-center justify-center border-2 border-black bg-[#1a1f2c] py-12 sm:py-16 px-3 sm:px-4 text-center shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000]">
          <span className="font-mono text-3xl sm:text-4xl font-black text-neutral-600 mb-1.5 sm:mb-2">[Ø]</span>
          <p className="text-base sm:text-lg font-black uppercase text-white">No Assessment Records</p>
          <p className="mt-0.5 sm:mt-1 font-mono text-[10px] sm:text-xs font-bold text-neutral-400">
            Complete a solo study or 1v1 multiplayer session to view logs here.
          </p>
        </div>
      )}

      {/* 5. Results List */}
      {!isLoading && !error && results.length > 0 && (
        <div className="space-y-2.5 sm:space-y-3.5">
          {results.map((result) => {
            const isPerfect = result.score_percentage === 100;
            const isGood = result.score_percentage >= 70;
            const scoreBg = isPerfect ? 'bg-[#A3E636]' : isGood ? 'bg-[#FFDE59]' : 'bg-[#FF6B6B]';

            return (
              <div
                key={result.id}
                className="flex flex-col justify-between gap-2.5 border-2 border-black bg-[#1a1f2c] p-3 sm:p-5 shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] sm:flex-row sm:items-center"
              >
                {/* Left: Metadata */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="border-2 border-black bg-white px-1.5 py-0.2 sm:px-2 sm:py-0.5 font-mono text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000000] sm:shadow-[1.5px_1.5px_0px_0px_#000000]">
                      {result.assessment_type.replaceAll('-', ' ')}
                    </span>

                    {result.companion_user_id ? (
                      <span className="border border-black bg-[#70CFF8] px-1.5 py-0.2 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black">
                        VS {result.profile?.display_name || 'OPPONENT'}
                      </span>
                    ) : (
                      <span className="border border-black bg-neutral-800 px-1.5 py-0.2 font-mono text-[9px] sm:text-[10px] font-bold uppercase text-neutral-300">
                        SOLO
                      </span>
                    )}
                  </div>

                  {/* Kanji Group Tags */}
                  {result.assessment_type === 'kanji-reading' &&
                    Array.isArray(result.details?.groups) &&
                    result.details.groups.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {result.details.groups.map((group) => (
                          <span
                            key={group}
                            className="border border-black/60 bg-[#252c3d] px-1.5 py-0.2 font-mono text-[9px] sm:text-[10px] font-bold uppercase text-neutral-300"
                          >
                            {group}
                          </span>
                        ))}
                      </div>
                    )}

                  {/* Timestamp & Hints */}
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] sm:text-xs font-bold text-neutral-400">
                    <span>{new Date(result.created_at).toLocaleString()}</span>
                    {result.assessment_type === 'kanji-reading' &&
                      Array.isArray(result.details?.hints_used) &&
                      result.details.hints_used.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-[#FFDE59]">
                            HINTS:{' '}
                            {result.details.hints_used.reduce(
                              (total, value) => total + Number(value || 0),
                              0
                            )}
                          </span>
                        </>
                      )}
                  </div>
                </div>

                {/* Right: Accuracy & Score */}
                <div className="flex items-center justify-between border-t-2 border-black/40 pt-2 sm:border-t-0 sm:pt-0 sm:justify-end sm:gap-4">
                  <div className="text-left sm:text-right">
                    <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase text-neutral-400">
                      ACCURACY
                    </span>
                    <p className="font-mono text-[11px] sm:text-xs font-black text-white">
                      {result.correct_questions}/{result.total_questions} CORRECT
                    </p>
                  </div>

                  <div
                    className={`flex h-10 min-w-[58px] sm:h-14 sm:min-w-[76px] items-center justify-center border-2 border-black ${scoreBg} px-2 sm:px-3 font-mono text-lg sm:text-2xl font-black text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000]`}
                  >
                    {result.score_percentage}%
                  </div>
                </div>
              </div>
            );
          })}

          {/* 6. Pagination Bar */}
          {totalPages > 1 && (
            <div className="mt-5 sm:mt-8 flex items-center justify-center gap-1.5 sm:gap-2 pt-2 sm:pt-4">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex h-8 sm:h-10 items-center gap-1 border-2 border-black bg-white px-2.5 sm:px-3 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
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
                      className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center border-2 border-black font-mono text-[10px] sm:text-xs font-black transition-all ${isActive
                          ? 'translate-x-[1px] translate-y-[1px] bg-[#FFDE59] text-black shadow-none ring-2 ring-black'
                          : 'bg-[#1a1f2c] text-white shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] hover:bg-neutral-800'
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
                className="flex h-8 sm:h-10 items-center gap-1 border-2 border-black bg-white px-2.5 sm:px-3 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default AssessmentHistory;