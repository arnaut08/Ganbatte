import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { getVocabFilter, getVocabOverview } from '../../services/api';
import type { VocabStage } from '../../types';
import DeckFilterBar, { type DeckCategory } from './DeckFilterBar';
import VocabStageMap from './VocabStageMap';
import VocabStudySession from './VocabStudySession';

type VocabScreenProps = {
  onBack: () => void;
};

export default function VocabScreen({ onBack }: VocabScreenProps) {
  const [allStages, setAllStages] = useState<VocabStage[]>([]);
  const [filteredStages, setFilteredStages] = useState<VocabStage[]>([]);
  const [vocabDueCount, setVocabDueCount] = useState(0);
  const [vocabCategory, setVocabCategory] = useState<DeckCategory>('all');
  const [vocabSearch, setVocabSearch] = useState('');
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [vocabLoading, setVocabLoading] = useState(true);
  const [vocabError, setVocabError] = useState('');
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  // 1. Stable overview fetching function
  const loadOverview = useCallback(() => {
    setVocabLoading(true);
    setVocabError('');
    getVocabOverview('N5')
      .then((data) => {
        const stages = data.stages || [];
        setAllStages(stages);
        setFilteredStages(stages);
        setVocabDueCount(stages.reduce((total: number, stage: VocabStage) => total + stage.due_words, 0));
      })
      .catch(() => setVocabError('Vocabulary stages are not available yet.'))
      .finally(() => setVocabLoading(false));
  }, []);

  // 2. Initial load
  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // 3. Category Filter Effect
  useEffect(() => {
    if (vocabCategory === 'all') {
      setFilteredStages(allStages);
      return;
    }

    setVocabLoading(true);
    setVocabError('');

    let posTags: string[] = [];
    if (vocabCategory === 'verbs') posTags = ['verb'];
    else if (vocabCategory === 'adjectives') posTags = ['i_adj', 'na_adj'];
    else if (vocabCategory === 'nouns') posTags = ['noun'];
    else if (vocabCategory === 'expressions') posTags = ['expression'];

    Promise.all(posTags.map((tag) => getVocabFilter('N5', tag)))
      .then((responses) => {
        const stageMap = new Map<number, VocabStage>();
        responses.flatMap((response) => response.items || []).forEach((item) => {
          const stageNum = item.stage_number;
          const stage = stageMap.get(stageNum) || {
            stage_number: stageNum,
            theme: item.theme,
            total_words: 0,
            mastered_words: 0,
            due_words: 0,
          };
          stage.total_words += 1;
          if ((item.progress?.srs_stage || 0) > 0) stage.mastered_words += 1;
          if (item.progress?.next_review_at && new Date(item.progress.next_review_at).getTime() <= Date.now()) {
            stage.due_words += 1;
          }
          stageMap.set(stageNum, stage);
        });

        setFilteredStages([...stageMap.values()].sort((a, b) => a.stage_number - b.stage_number));
      })
      .catch(() => setVocabError('Unable to apply filter.'))
      .finally(() => setVocabLoading(false));
  }, [vocabCategory, allStages]);

  // 4. Memoized stages list (Runs unconditionally before any returns)
  const visibleVocabStages = useMemo(() => {
    const normalizedSearch = vocabSearch.trim().toLowerCase();
    return filteredStages.filter((stage) => {
      const matchesDue = !showDueOnly || stage.due_words > 0;
      const matchesSearch =
        !normalizedSearch ||
        stage.theme.toLowerCase().includes(normalizedSearch) ||
        String(stage.stage_number).includes(normalizedSearch);
      return matchesDue && matchesSearch;
    });
  }, [showDueOnly, vocabSearch, filteredStages]);

  // 5. Handlers
  const handleCategoryChange = (category: DeckCategory) => {
    setVocabCategory(category);
    setShowDueOnly(false);
  };

  const handleReturnFromSession = () => {
    setSelectedStage(null);
    loadOverview();
  };

  // 6. Conditional rendering ONLY after all hooks have executed
  if (selectedStage !== null) {
    return (
      <VocabStudySession
        level="N5"
        stageNumber={selectedStage}
        onBackToStageMap={handleReturnFromSession}
        onTakeQuiz={handleReturnFromSession}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 sm:space-y-6 sm:py-8">
      <header className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          aria-label="Return to learning modules"
        >
          <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#A3E636]">04 // Vocabulary</span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">N5 Vocabulary</h1>
        </div>
      </header>

      <section className="space-y-4 border-t-2 border-white/20 pt-5 sm:pt-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <p className="font-mono text-xs font-bold uppercase text-neutral-400">Choose a stage to begin active recall.</p>
          <span className="font-mono text-[10px] font-bold uppercase text-neutral-400">Stage map // active recall</span>
        </div>

        <DeckFilterBar
          category={vocabCategory}
          search={vocabSearch}
          dueCount={vocabDueCount}
          showDueOnly={showDueOnly}
          onCategoryChange={handleCategoryChange}
          onSearchChange={setVocabSearch}
          onToggleDueOnly={() => setShowDueOnly((prev) => !prev)}
        />

        {vocabLoading && (
          <div className="border-2 border-black bg-[#1a1f2c] p-10 text-center font-mono text-xs font-black uppercase text-neutral-400 shadow-[4px_4px_0px_0px_#000]">
            Loading vocabulary stages...
          </div>
        )}
        {vocabError && !vocabLoading && (
          <div className="border-2 border-black bg-[#FF6B6B] p-4 text-center font-mono text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">
            {vocabError}
          </div>
        )}
        {!vocabLoading && !vocabError && (
          <VocabStageMap stages={visibleVocabStages} onSelectStage={setSelectedStage} />
        )}
      </section>
    </main>
  );
}