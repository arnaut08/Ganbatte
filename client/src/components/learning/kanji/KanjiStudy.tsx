import { useCallback, useEffect, useMemo, useState } from 'react';
import { getKanjiOverview } from '../../../services/api';
import type { KanjiGroupOverview } from '../../../types';
import KanjiGroupMap from './KanjiGroupMap';
import KanjiGroupQuiz from './KanjiGroupQuiz';
import KanjiStudySession from './KanjiStudySession';
import GroupMapSkeleton from '../GroupMapSkeleton';
import DeckFilterBar from '../vocab/DeckFilterBar';
import StudyScreenHeader from '../StudyScreenHeader';

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

  const handleScreenBack = () => {
    if (selectedGroup !== null || quizGroup !== null) {
      returnToMap();
    } else {
      onBack();
    }
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
    <main className="mx-auto min-w-0 w-full max-w-5xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-8">
      <StudyScreenHeader
        onBack={handleScreenBack}
        eyebrow="02 // KANJI"
        title="N5 KANJI"
        accentClassName="text-[#70CFF8]"
      />

      {/* SUB-HEADER INFO */}
      <div className="flex flex-col gap-1 border-t-2 border-white/20 pt-3 sm:flex-row sm:items-end sm:justify-between sm:pt-4">
        <p className="font-mono text-[10px] font-black uppercase text-neutral-400 sm:text-xs">
          Choose a group to begin active recall.
        </p>
        <span className="font-mono text-[9px] font-black uppercase tracking-widest text-neutral-400 sm:text-[10px]">
          Group map // mastery
        </span>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      {!loading && !error && (
        <DeckFilterBar
          accent="kanji"
          search={search}
          dueCount={totalDueCount}
          showDueOnly={showDueOnly}
          placeholder="Search group..."
          searchAriaLabel="Search Kanji groups"
          onSearchChange={setSearch}
          onToggleDueOnly={() => setShowDueOnly((val) => !val)}
        />
      )}

      {/* CONTENT GRID */}
      {loading && <GroupMapSkeleton count={6} accentColor="#70CFF8" deck="kanji" withFilter />}

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