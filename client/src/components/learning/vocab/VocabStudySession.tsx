import { useEffect, useMemo, useState } from 'react';
import { getVocabStage, reviewVocab } from '../../../services/api';
import type { VocabStudyItem } from '../../../types';
import VocabCard from './VocabCard';
import VocabStageQuiz from './VocabStageQuiz';
import StudySkeleton from '../StudySkeleton';

type VocabStudySessionProps = {
  level?: string;
  stageNumber: number;
  onBackToStageMap: () => void;
};

export default function VocabStudySession({
  level = 'N5',
  stageNumber,
  onBackToStageMap,
}: VocabStudySessionProps) {
  const [queue, setQueue] = useState<VocabStudyItem[]>([]);
  const [stageItems, setStageItems] = useState<VocabStudyItem[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [completedCards, setCompletedCards] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isRating, setIsRating] = useState(false);
  const [cardTurn, setCardTurn] = useState(0);
  const [isQuizStarted, setIsQuizStarted] = useState(false);

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
        setStageItems(items);
        setQueue(items);
        setTotalCards(items.length);
      })
      .catch(() => {
        if (isCurrent) setError('Unable to load this vocabulary stage.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
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
      const { progress } = await reviewVocab(card.id, rating);
      const updatedStage = Number(progress.srs_stage);
      setStageItems((current) =>
        current.map((item) =>
          item.id === card.id
            ? { ...item, progress: { ...item.progress, srs_stage: updatedStage } }
            : item
        )
      );
    } catch {
      setReviewError('Review saved locally, but could not sync with the server.');
    } finally {
      setIsRating(false);
    }
  };

  if (sessionComplete && isQuizStarted) {
    return (
      <VocabStageQuiz
        level={level}
        stageNumber={stageNumber}
        items={stageItems}
        onBackToStageMap={onBackToStageMap}
      />
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-4 sm:py-8">
        <StudySkeleton accentColor="#A3E636" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="border-2 border-black bg-[#FF6B6B] p-4 text-center font-mono text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">
          {error}
        </div>
      </main>
    );
  }

  if (!isLoading && !error && totalCards === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-8">
        <div className="border-2 border-black bg-[#1f2637] p-8 text-center text-white shadow-[4px_4px_0px_0px_#000] sm:p-10 sm:shadow-[6px_6px_0px_0px_#000]">
          <p className="font-mono text-xs font-black uppercase text-neutral-300 sm:text-sm">
            This stage has no vocabulary yet.
          </p>
          <button
            type="button"
            onClick={onBackToStageMap}
            className="mt-4 cursor-pointer border-2 border-black bg-[#A3E636] px-5 py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Back to Stage Map
          </button>
        </div>
      </main>
    );
  }

  if (sessionComplete) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-8">
        <section className="border-2 border-black border-l-8 border-l-[#A3E636] bg-[#1f2637] p-5 text-white shadow-[4px_4px_0px_0px_#000] sm:p-8 sm:shadow-[6px_6px_0px_0px_#000]">
          <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#A3E636] sm:text-xs">
            STAGE {stageNumber} // COMPLETE
          </span>
          <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
            Session Complete
          </h2>
          <p className="mt-2 font-mono text-xs font-bold uppercase text-neutral-300 sm:text-sm">
            {completedCards} cards reviewed and saved.
          </p>
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              onClick={onBackToStageMap}
              className="cursor-pointer border-2 border-black bg-white px-4 py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:py-3"
            >
              Return to Stage Map
            </button>
            <button
              type="button"
              onClick={() => setIsQuizStarted(true)}
              className="cursor-pointer border-2 border-black bg-[#A3E636] px-4 py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:py-3"
            >
              Take a Quiz →
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3.5 px-3 py-4 sm:gap-5 sm:px-4 sm:py-6 sm:pb-28">
      {/* Header */}
      <header className="flex items-center gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={onBackToStageMap}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]"
          aria-label="Return to vocabulary stage map"
          title="Back to vocabulary stage map"
        >
          <span className="font-mono text-base font-black sm:text-lg">&lt;</span>
        </button>

        <div className="flex flex-col justify-center text-left">
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#A3E636] sm:text-xs">
            JLPT {level} // STAGE {stageNumber}
          </span>
          <h1 className="text-lg font-black uppercase leading-tight tracking-tight text-white sm:text-2xl">
            Vocabulary Recall
          </h1>
        </div>
      </header>

      {/* Progress Track */}
      <section className="border-2 border-black bg-[#151922] p-2.5 shadow-[3px_3px_0px_0px_#000] sm:p-3">
        <div className="mb-1.5 flex items-center justify-between gap-3 font-mono text-[9px] font-black uppercase text-neutral-300 sm:text-[10px]">
          <span>{reviewedLabel}</span>
          <span className="text-[#A3E636]">{remainingCards} remaining</span>
        </div>
        <div className="h-4 overflow-hidden border-2 border-black bg-[#1f2637] shadow-[1px_1px_0px_0px_#000] sm:h-4.5" aria-label={`${progressPercent}% complete`}>
          <div
            className="h-full bg-[#A3E636] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {reviewError && (
        <div className="border-2 border-black bg-[#FFDE59] p-2.5 text-center font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
          {reviewError}
        </div>
      )}

      {activeCard && (
        <VocabCard
          key={`${activeCard.id}-${cardTurn}`}
          vocab={activeCard}
          position={completedCards + 1}
          total={totalCards}
          onRate={handleRate}
        />
      )}

      {isRating && (
        <p className="text-center font-mono text-[10px] font-black uppercase text-neutral-400">
          Saving review...
        </p>
      )}
    </main>
  );
}