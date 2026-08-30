import { useCallback, useEffect, useMemo, useState } from 'react';
import { MagnifyingGlassIcon, TimerIcon, Cross2Icon } from '@radix-ui/react-icons';
import { getKanjiOverview } from '../../services/api';
import type { KanjiGroupOverview } from '../../types';
import KanjiGroupMap from './KanjiGroupMap';
import KanjiGroupQuiz from './KanjiGroupQuiz';
import KanjiStudySession from './KanjiStudySession';
import GroupMapSkeleton from './GroupMapSkeleton';

type Props = { onBack: () => void };

export default function KanjiStudy({ onBack }: Props) {
  const [groups, setGroups] = useState<KanjiGroupOverview[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [quizGroup, setQuizGroup] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOverview = useCallback(() => {
    setLoading(true);
    setError('');
    getKanjiOverview()
      .then((data) => setGroups(data.groups || []))
      .catch(() => setError('Kanji groups are not available yet.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const selectedGroupName = useMemo(
    () => groups.find((group) => group.group_id === (selectedGroup || quizGroup))?.theme || 'Kanji Group',
    [groups, selectedGroup, quizGroup]
  );

  const totalDueCount = useMemo(
    () => groups.reduce((acc, curr) => acc + (curr.due_characters || 0), 0),
    [groups]
  );

  const visibleGroups = useMemo(() => {
    return groups.filter((group) => {
      const matchesSearch =
        search.trim().length === 0 ||
        group.theme.toLowerCase().includes(search.toLowerCase());
      const matchesDue = !showDueOnly || group.due_characters > 0;
      return matchesSearch && matchesDue;
    });
  }, [groups, search, showDueOnly]);

  const startQuiz = (groupId: string) => {
    setQuizGroup(groupId);
  };

  const returnToMap = () => {
    setSelectedGroup(null);
    setQuizGroup(null);
    loadOverview();
  };

  if (selectedGroup) {
    return (
      <KanjiStudySession
        groupId={selectedGroup}
        groupName={selectedGroupName}
        onBack={returnToMap}
        onQuiz={() => {
          setQuizGroup(selectedGroup);
          setSelectedGroup(null);
        }}
      />
    );
  }

  if (quizGroup) {
    return (
      <KanjiGroupQuiz
        groupId={quizGroup}
        groupName={selectedGroupName}
        onBack={returnToMap}
        onComplete={returnToMap}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-8">
      {/* HEADER */}
      <header className="flex items-center gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]"
          aria-label="Return to learning modules"
        >
          <span className="font-mono text-base font-black sm:text-lg">&lt;</span>
        </button>
        <div className="flex flex-col justify-center text-left">
          <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#A3E636] sm:text-xs">
            05 // KANJI
          </span>
          <h1 className="text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
            N5 KANJI
          </h1>
        </div>
      </header>

      {/* SUB-HEADER INFO */}
      <div className="flex flex-col gap-1 border-t-2 border-white/20 pt-3 sm:flex-row sm:items-end sm:justify-between sm:pt-4">
        <p className="font-mono text-[10px] font-black uppercase text-neutral-400 sm:text-xs">
          Choose a group to begin active recall.
        </p>
        <span className="font-mono text-[9px] font-black uppercase tracking-widest text-neutral-400 sm:text-[10px]">
          Group map // mastery
        </span>
      </div>

      {/* NEO-BRUTALIST KANJI FILTER CONTROLS */}
      {!loading && !error && (
        <section className="border-2 border-black bg-[#151922] p-2.5 shadow-[3px_3px_0px_0px_#000] sm:p-3 sm:shadow-[4px_4px_0px_0px_#000]">
          <div className="flex items-center gap-2">
            {/* SEARCH INPUT */}
            <div className="relative min-w-0 flex-1">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black sm:left-3.5 sm:h-4 sm:w-4"
                aria-hidden="true"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search group..."
                aria-label="Search Kanji groups"
                className="h-9 w-1/2 border-2 border-black bg-white pl-8 pr-7 font-mono text-[11px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] placeholder:text-neutral-400 placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-[#70CFF8] sm:h-10 sm:pl-10 sm:pr-8 sm:text-xs"
              />
              {search.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-black hover:bg-neutral-200"
                  aria-label="Clear search"
                >
                  <Cross2Icon className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* DUE BUTTON WITH BADGE */}
            <button
              type="button"
              onClick={() => setShowDueOnly((val) => !val)}
              className={`flex h-9 shrink-0 items-center justify-center gap-1.5 border-2 border-black px-2.5 font-mono text-[10px] font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000] transition-all sm:h-10 sm:gap-2 sm:px-3.5 sm:text-[11px] ${
                showDueOnly
                  ? 'translate-x-[1px] translate-y-[1px] bg-[#FF6B6B] shadow-none ring-1 ring-black'
                  : 'bg-[#A3E636] hover:bg-[#8fe01a]'
              } active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
            >
              <TimerIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
              <span className="hidden xs:inline sm:inline">
                {showDueOnly ? 'Due' : 'Review'}
              </span>
              <span className="flex min-w-[18px] items-center justify-center border-2 border-black bg-black px-1 py-0.5 font-mono text-[9px] font-black text-[#A3E636] sm:min-w-[20px] sm:text-[10px]">
                {totalDueCount}
              </span>
            </button>
          </div>
        </section>
      )}

      {/* CONTENT GRID */}
      {loading && <GroupMapSkeleton count={6} />}

      {error && !loading && (
        <div className="border-2 border-black bg-[#FF6B6B] p-4 text-center font-mono text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">
          {error}
        </div>
      )}

      {!loading && !error && (
        <KanjiGroupMap
          groups={visibleGroups}
          onSelect={setSelectedGroup}
          onQuiz={startQuiz}
        />
      )}
    </main>
  );
}