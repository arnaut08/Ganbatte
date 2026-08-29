import { useEffect, useMemo, useState } from 'react';
import { getVocabStage, reviewVocab } from '../../services/api';
import type { VocabStudyItem } from '../../types';
import VocabCard from './VocabCard';

type VocabStudySessionProps = {
  level?: string;
  stageNumber: number;
  onBackToStageMap: () => void;
  onTakeQuiz: () => void;
};

export default function VocabStudySession({
  level = 'N5',
  stageNumber,
  onBackToStageMap,
  onTakeQuiz,
}: VocabStudySessionProps) {
  const [queue, setQueue] = useState<VocabStudyItem[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [completedCards, setCompletedCards] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isRating, setIsRating] = useState(false);
  const [cardTurn, setCardTurn] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError('');
    setQueue([]);
    setCompletedCards(0);
    setCardTurn(0);
    getVocabStage(stageNumber, level)
      .then((data) => {
        if (!isCurrent) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setQueue(items);
        setTotalCards(items.length);
      })
      .catch(() => {
        if (isCurrent) setError('Unable to load this vocabulary stage.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => { isCurrent = false; };
  }, [level, stageNumber]);

  const activeCard = queue[0];
  const remainingCards = queue.length;
  const progressPercent = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;
  const sessionComplete = !isLoading && !error && totalCards > 0 && queue.length === 0;
  const reviewedLabel = useMemo(() => `${completedCards} of ${totalCards} cards reviewed`, [completedCards, totalCards]);

  const handleRate = async (rating: 1 | 2 | 3 | 4) => {
    if (!activeCard || isRating) return;
    setIsRating(true);
    setReviewError('');
    const card = activeCard;

    setQueue((current) => {
      const remaining = current.slice(1);
      return rating === 1 ? [...remaining, card] : remaining;
    });
    setCardTurn((current) => current + 1);
    if (rating !== 1) setCompletedCards((current) => current + 1);

    try {
      await reviewVocab(card.id, rating);
    } catch {
      setReviewError('Review saved locally, but could not sync with the server.');
    } finally {
      setIsRating(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:gap-7 sm:py-8">
      <header className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBackToStageMap} className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000000]" aria-label="Return to vocabulary stage map" title="Back to vocabulary stage map">
          <span className="font-mono text-base font-black sm:text-lg">&lt;</span>
        </button>
        <div className="min-w-0 text-right">
          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#FFDE59]">JLPT {level} // STAGE {stageNumber}</span>
          <h1 className="truncate text-xl font-black uppercase tracking-tight text-white sm:text-3xl">Vocabulary Recall</h1>
        </div>
      </header>

      {isLoading && (
        <div className="border-2 border-black bg-[#1a1f2c] p-12 text-center font-mono text-xs font-black uppercase text-neutral-400 shadow-[6px_6px_0px_0px_#000]">Loading study session...</div>
      )}
      {error && !isLoading && (
        <div className="border-2 border-black bg-[#FF6B6B] p-5 text-center font-mono text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">{error}</div>
      )}

      {!isLoading && !error && totalCards === 0 && (
        <div className="border-2 border-black bg-[#1a1f2c] p-10 text-center shadow-[6px_6px_0px_0px_#000]">
          <p className="font-mono text-xs font-black uppercase text-neutral-400">This stage has no vocabulary yet.</p>
          <button type="button" onClick={onBackToStageMap} className="mt-6 border-2 border-black bg-[#A3E636] px-4 py-3 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">Back to Stage Map</button>
        </div>
      )}

      {!isLoading && !error && totalCards > 0 && !sessionComplete && (
        <>
          <section className="border-2 border-black bg-[#1a1f2c] p-3 shadow-[4px_4px_0px_0px_#000]">
            <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[10px] font-black uppercase text-white">
              <span>{reviewedLabel}</span>
              <span>{remainingCards} remaining</span>
            </div>
            <div className="h-5 border-2 border-black bg-white" aria-label={`${progressPercent}% complete`}>
              <div className="h-full border-r-2 border-black bg-[#A3E636] transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </section>
          {reviewError && <div className="border-2 border-black bg-[#FFDE59] p-3 text-center font-mono text-[10px] font-black uppercase text-black shadow-[3px_3px_0px_0px_#000]">{reviewError}</div>}
          {activeCard && <VocabCard key={`${activeCard.id}-${cardTurn}`} vocab={activeCard} onRate={handleRate} />}
          {isRating && <p className="text-center font-mono text-[10px] font-black uppercase text-neutral-400">Saving review...</p>}
        </>
      )}

      {sessionComplete && (
        <section className="border-2 border-black bg-[#A3E636] p-6 text-black shadow-[6px_6px_0px_0px_#000] sm:p-10">
          <span className="font-mono text-xs font-black uppercase tracking-wider">Stage {stageNumber} // Complete</span>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-5xl">Session Complete</h2>
          <p className="mt-3 font-mono text-sm font-bold uppercase">{completedCards} cards reviewed and saved.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={onBackToStageMap} className="border-2 border-black bg-white px-4 py-3 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">Return to Stage Map</button>
            <button type="button" onClick={onTakeQuiz} className="border-2 border-black bg-[#70CFF8] px-4 py-3 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] hover:bg-[#8bd9fa] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">Take a Quiz</button>
          </div>
        </section>
      )}
    </main>
  );
}