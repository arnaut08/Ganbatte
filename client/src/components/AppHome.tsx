import { useEffect, useMemo, useRef, useState, type ComponentType, type FormEvent, type ReactNode } from 'react';
import {
  RocketIcon,
  TimerIcon,
  CheckCircledIcon,
  LightningBoltIcon,
  BookmarkIcon,
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FlameIcon } from '@/components/ui/flameIcon';
import LearningScreen from './learning/LearningScreen';
import PracticeScreen from './practice/PracticeScreen';
import useProfileStreak from '../hooks/useProfileStreak';
import {
  getKanjiCards,
  getKanjiOverview,
  getCharacterAttempts,
  getVocabOverview,
  getGrammarOverview,
} from '../services/api';
import type { Deck, DeckOptions, SelectorScreen, KanjiGroup, KanjiGroupOverview, VocabStage, MatchMode } from '../types';

type LegacyProps = {
  children?: ReactNode;
  [key: string]: unknown;
};

const LegacyButton = Button as unknown as ComponentType<LegacyProps>;

type AppHomeProps = {
  onCreateRoom: (settings?: DeckOptions) => void;
  onJoinRoom: (roomCode: string) => void;
  onOpenKanaStudy: () => void;
  onOpenKanjiStudy: () => void;
  onOpenVocabStudy: () => void;
  onOpenGrammarStudy: () => void;
  onScreenChange?: (screen: SelectorScreen) => void;
  screen?: SelectorScreen;
  prefillRoomCode?: string;
  isSocketReady?: boolean;
  roomCode?: string;
};

export default function AppHome({
  onCreateRoom,
  onJoinRoom,
  onOpenKanaStudy,
  onOpenKanjiStudy,
  onOpenVocabStudy,
  onOpenGrammarStudy,
  onScreenChange,
  screen: controlledScreen,
  prefillRoomCode = '',
  isSocketReady = false,
  roomCode = '',
}: AppHomeProps) {
  const [internalScreen, setInternalScreen] = useState<SelectorScreen>(controlledScreen || 'home');
  const profileStreak = useProfileStreak();

  const DEFAULT_VOCAB_TOTAL_STAGES = 28;
  const DEFAULT_VOCAB_STAGE_STATS = {
    clearedStages: 0,
    masteredStages: 0,
    totalStages: DEFAULT_VOCAB_TOTAL_STAGES,
  };
  const [vocabStageStats, setVocabStageStats] = useState(DEFAULT_VOCAB_STAGE_STATS);
  const [vocabDueCount, setVocabDueCount] = useState(0);

  // Grammar Stats State
  const DEFAULT_GRAMMAR_TOTAL_LESSONS = 12;
  const DEFAULT_GRAMMAR_STATS = {
    clearedLessons: 0,
    masteredLessons: 0,
    totalLessons: DEFAULT_GRAMMAR_TOTAL_LESSONS,
  };
  const [grammarStats, setGrammarStats] = useState(DEFAULT_GRAMMAR_STATS);

  useEffect(() => {
    getVocabOverview('N5')
      .then((overview) => {
        const stages = overview.stages || [];
        setVocabStages(stages);
        const nextStats = {
          clearedStages: stages.filter((stage) => stage.is_cleared).length,
          masteredStages: stages.filter((stage) => stage.is_mastered).length,
          totalStages: stages.length || DEFAULT_VOCAB_TOTAL_STAGES,
        };
        setVocabStageStats(nextStats);
        setVocabDueCount(stages.reduce((total: number, stage) => total + stage.due_words, 0));
        try {
          localStorage.setItem('ganbatte_vocab_stage_stats', JSON.stringify(nextStats));
        } catch (storageError) {
          console.error('Failed to cache vocab stage stats to localStorage:', storageError);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch vocab overview:', error);
        try {
          const cachedStats = localStorage.getItem('ganbatte_vocab_stage_stats');
          if (cachedStats) {
            setVocabStageStats({ ...DEFAULT_VOCAB_STAGE_STATS, ...JSON.parse(cachedStats) });
          }
        } catch (cacheError) {
          console.error('Failed to load cached vocab stats from localStorage:', cacheError);
        }
      });

    getGrammarOverview()
      .then((overview) => {
        const lessons = overview?.lessons || [];
        setGrammarStats({
          clearedLessons: lessons.filter((lesson) => lesson.is_cleared).length,
          masteredLessons: lessons.filter((lesson) => lesson.is_mastered).length,
          totalLessons: overview?.total_lessons || DEFAULT_GRAMMAR_TOTAL_LESSONS,
        });
      })
      .catch((error) => {
        console.error('Failed to fetch grammar overview:', error);
      });
  }, []);

  const screen = controlledScreen ?? internalScreen;

  const setScreen = (nextScreen: SelectorScreen) => {
    if (onScreenChange) {
      onScreenChange(nextScreen);
      return;
    }
    setInternalScreen(nextScreen);
  };

  const [joinCode, setJoinCode] = useState(roomCode || '');
  const [mode, setMode] = useState<MatchMode>('standard');
  const [deckType, setDeckType] = useState<Deck>('kana');
  const [grammarLevel, setGrammarLevel] = useState(1);
  const [selectedGroups, setSelectedGroups] = useState<Array<string | number>>([]);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [kanjiGroups, setKanjiGroups] = useState<KanjiGroup[]>([]);
  const [vocabStages, setVocabStages] = useState<VocabStage[]>([]);

  // Player Passport Data States
  const [kanjiOverview, setKanjiOverview] = useState<KanjiGroupOverview[]>([]);
  const [kanaMasteredCount, setKanaMasteredCount] = useState({ hiragana: 0, katakana: 0 });
  const joinCodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (controlledScreen && controlledScreen !== screen) {
      setInternalScreen(controlledScreen);
    }
  }, [controlledScreen, screen]);

  useEffect(() => {
    if (prefillRoomCode) {
      setJoinCode(prefillRoomCode);
      joinCodeInputRef.current?.focus();
      return;
    }

    if (roomCode) {
      setJoinCode(roomCode);
    }
  }, [prefillRoomCode, roomCode]);

  useEffect(() => {
    getKanjiCards()
      .then((data) => setKanjiGroups((data.groups || []) as KanjiGroup[]))
      .catch((error) => {
        console.error('Failed to fetch kanji cards:', error);
      });
    getKanjiOverview()
      .then((data) => setKanjiOverview(data.groups || []))
      .catch((error) => {
        console.error('Failed to fetch kanji overview:', error);
      });

    getCharacterAttempts('kana')
      .then((res) => {
        let hCount = 0;
        let kCount = 0;
        ((res?.attempts as unknown[]) || []).forEach((item) => {
          const attempt = item as { character?: string; correct_streak?: number; script?: string };
          if (Number(attempt.correct_streak ?? 0) >= 3) {
            if (attempt.script === 'katakana') kCount += 1;
            else hCount += 1;
          }
        });
        setKanaMasteredCount({ hiragana: hCount, katakana: kCount });
      })
      .catch((error) => {
        console.error('Failed to fetch kana character attempts:', error);
      });
  }, []);

  // Aggregate Stats
  const totalKanjiDue = useMemo(
    () => kanjiOverview.reduce((acc, curr) => acc + (curr.due_characters || 0), 0),
    [kanjiOverview]
  );
  const masteredKanjiGroups = useMemo(
    () => kanjiOverview.filter((g) => g.is_mastered).length,
    [kanjiOverview]
  );

  // Combined due reviews across Kanji + Vocab
  const totalDueReviews = useMemo(
    () => totalKanjiDue + (vocabDueCount || 0),
    [totalKanjiDue, vocabDueCount]
  );

  const handleGroupToggle = (groupId: string | number) => {
    setSelectedGroups((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId]
    );
  };

  const handleClearSelectedGroups = () => {
    setSelectedGroups([]);
    setIsGroupMenuOpen(false);
  };

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSocketReady) return;

    const normalizedGroups = deckType === 'kanji' || deckType === 'vocab' ? selectedGroups : [];
    const normalizedSettings: DeckOptions =
      deckType === 'grammar'
        ? { type: 'grammar', mode, groups: [], maxLesson: grammarLevel, count: 5 }
        : { type: deckType, mode, groups: normalizedGroups };

    onCreateRoom(normalizedSettings);
  };

  const handleJoin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const targetCode = joinCode.trim();
    if (isSocketReady && targetCode) {
      onJoinRoom(targetCode.toUpperCase());
      setJoinCode('');
    }
  };

  return (
    <div className="app-home-content flex items-center justify-center p-3 pb-20 sm:p-4 sm:pb-24">
      <div className="w-full max-w-5xl">
        {screen === 'home' ? (
          <div className="space-y-3 sm:space-y-6">
            {/* --- PLAYER PASSPORT & STATS HUD --- */}
            <section className="mx-auto w-full max-w-4xl border-2 border-black bg-[#151922] p-2.5 sm:p-4 text-white shadow-[3px_3px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] space-y-2 sm:space-y-3">
              {/* Header Bar */}
              <div className="flex min-w-0 flex-row items-center justify-between gap-2 border-b-2 border-white/20 pb-2">
                <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                  <span className="shrink-0 border border-black bg-[#A3E636] px-1.5 py-0.5 font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000]">
                    PASSPORT
                  </span>
                  <span className="truncate font-mono text-[10px] sm:text-xs font-black uppercase tracking-tight text-white">
                    // PROGRESSION
                  </span>
                </div>

                <div className="flex shrink-0 flex-row items-center justify-end gap-1.5 sm:gap-2">
                  {/* Daily Streak Badge */}
                  <div
                    className={`flex items-center gap-1 sm:gap-1.5 border-2 border-black px-1.5 py-0.5 sm:px-2.5 font-mono text-[9px] sm:text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] ${(profileStreak?.currentStreak ?? 0) > 0
                        ? 'bg-[#FFDE59] text-black'
                        : 'bg-[#252c3d] text-neutral-400'
                      }`}
                    title={profileStreak?.longestStreak ? `Longest streak: ${profileStreak.longestStreak} days` : undefined}
                  >
                    <FlameIcon
                      className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${(profileStreak?.currentStreak ?? 0) > 0 ? 'text-black' : 'text-neutral-500'}`}
                    />
                    <span className="hidden xs:inline">STREAK:</span>
                    <span className={(profileStreak?.currentStreak ?? 0) > 0 ? 'text-black' : 'text-white'}>
                      {profileStreak?.currentStreak ?? 0}
                    </span>
                  </div>

                  {/* Combined Reviews Badge */}
                  <div
                    className={`flex items-center gap-1 sm:gap-1.5 border-2 border-black px-1.5 py-0.5 sm:px-2.5 font-mono text-[9px] sm:text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] ${totalDueReviews > 0 ? 'bg-[#FF6B6B] text-black' : 'bg-[#252c3d] text-neutral-400'
                      }`}
                  >
                    <TimerIcon
                      className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${totalDueReviews > 0 ? 'text-black' : 'text-neutral-400'}`}
                    />
                    <span className="hidden xs:inline">DUE:</span>
                    <span className={totalDueReviews > 0 ? 'text-black' : 'text-white'}>
                      {totalDueReviews}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Pillar HUD Cards: 2x2 Grid on Mobile, 4-Col on Desktop */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5 lg:grid-cols-4">
                {/* 01 // KANA */}
                <div
                  onClick={onOpenKanaStudy}
                  className="group/card cursor-pointer border-2 border-black bg-[#1f2637] border-l-4 border-l-[#FFDE59] p-2 sm:p-3 transition-all hover:bg-[#283248] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#FFDE59]">
                      01 // KANA
                    </span>
                    <RocketIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#FFDE59]" />
                  </div>

                  <div className="mt-0.5 flex items-baseline justify-between font-mono">
                    <span className="text-[8px] sm:text-[10px] font-black uppercase text-neutral-400">Mastered</span>
                    <span className="font-mono text-[9px] sm:text-xs font-black text-[#FFDE59]">
                      {kanaMasteredCount.hiragana + kanaMasteredCount.katakana}/92
                    </span>
                  </div>

                  <div className="mt-1 h-1.5 sm:h-2 w-full overflow-hidden border border-black bg-[#151922]">
                    <div
                      className="h-full bg-[#FFDE59] transition-all"
                      style={{
                        width: `${Math.min(100, Math.round(((kanaMasteredCount.hiragana + kanaMasteredCount.katakana) / 92) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 02 // KANJI */}
                <div
                  onClick={onOpenKanjiStudy}
                  className="group/card cursor-pointer border-2 border-black bg-[#1f2637] border-l-4 border-l-[#70CFF8] p-2 sm:p-3 transition-all hover:bg-[#283248] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#70CFF8]">
                      02 // KANJI
                    </span>
                    <CheckCircledIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#70CFF8]" />
                  </div>

                  <div className="mt-0.5 flex items-baseline justify-between font-mono">
                    <span className="text-[8px] sm:text-[10px] font-black uppercase text-neutral-400">Groups</span>
                    <span className="font-mono text-[9px] sm:text-xs font-black text-[#70CFF8]">
                      {masteredKanjiGroups}/{kanjiOverview.length || 8}
                    </span>
                  </div>

                  <div className="mt-1 h-1.5 sm:h-2 w-full overflow-hidden border border-black bg-[#151922]">
                    <div
                      className="h-full bg-[#70CFF8] transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((masteredKanjiGroups / (kanjiOverview.length || 8)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 03 // VOCAB SRS */}
                <div
                  onClick={onOpenVocabStudy}
                  className="group/card cursor-pointer border-2 border-black bg-[#1f2637] border-l-4 border-l-[#A3E636] p-2 sm:p-3 transition-all hover:bg-[#283248] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#A3E636]">
                      03 // VOCAB
                    </span>
                    <LightningBoltIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#A3E636]" />
                  </div>

                  <div className="mt-0.5 flex items-baseline justify-between font-mono">
                    <span className="text-[8px] sm:text-[10px] font-black uppercase text-neutral-400">Stages</span>
                    <span className="font-mono text-[9px] sm:text-xs font-black text-[#A3E636]">
                      {vocabStageStats.clearedStages}/28
                    </span>
                  </div>

                  <div className="mt-1 flex h-1.5 sm:h-2 w-full overflow-hidden border border-black bg-[#151922]">
                    <div
                      className="h-full bg-[#A3E636] transition-all"
                      style={{
                        width: `${Math.min(100, (vocabStageStats.masteredStages / 28) * 100)}%`,
                      }}
                    />
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min(
                          100 - (vocabStageStats.masteredStages / 28) * 100,
                          ((vocabStageStats.clearedStages - vocabStageStats.masteredStages) / 28) * 100
                        )}%`,
                        backgroundImage:
                          'repeating-linear-gradient(45deg, #A3E636, #A3E636 2px, #151922 2px, #151922 4px)',
                      }}
                    />
                  </div>
                </div>

                {/* 04 // GRAMMAR */}
                <div
                  onClick={onOpenGrammarStudy}
                  className="group/card cursor-pointer border-2 border-black bg-[#1f2637] border-l-4 border-l-[#C084FC] p-2 sm:p-3 transition-all hover:bg-[#283248] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#C084FC]">
                      04 // GRAMMAR
                    </span>
                    <BookmarkIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#C084FC]" />
                  </div>

                  <div className="mt-0.5 flex items-baseline justify-between font-mono">
                    <span className="text-[8px] sm:text-[10px] font-black uppercase text-neutral-400">Lessons</span>
                    <span className="font-mono text-[9px] sm:text-xs font-black text-[#C084FC]">
                      {grammarStats.clearedLessons}/{grammarStats.totalLessons}
                    </span>
                  </div>

                  <div className="mt-1 flex h-1.5 sm:h-2 w-full overflow-hidden border border-black bg-[#151922]">
                    <div
                      className="h-full bg-[#C084FC] transition-all"
                      style={{
                        width: `${Math.min(100, (grammarStats.masteredLessons / grammarStats.totalLessons) * 100)}%`,
                      }}
                    />
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min(
                          100 - (grammarStats.masteredLessons / grammarStats.totalLessons) * 100,
                          ((grammarStats.clearedLessons - grammarStats.masteredLessons) / grammarStats.totalLessons) * 100
                        )}%`,
                        backgroundImage:
                          'repeating-linear-gradient(45deg, #C084FC, #C084FC 2px, #151922 2px, #151922 4px)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* --- CORE ACTION CARDS --- */}
            <div className="grid min-w-0 max-w-4xl gap-3 sm:gap-6 md:grid-cols-2 mx-auto">
              {/* Card 1: Study & Recall */}
              <Card className="group relative min-w-0 overflow-hidden bg-[#1f2637] border-2 border-black border-l-8 border-l-[#FFDE59] shadow-[4px_4px_0px_0px_#000] sm:shadow-[7px_7px_0px_0px_#000] p-3.5 sm:p-6 flex flex-col justify-between transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000]">
                <span
                  className="absolute -right-3 -bottom-4 sm:-right-4 sm:-bottom-6 text-[100px] sm:text-[155px] font-black pointer-events-none select-none leading-none font-mono text-transparent transition-all duration-300 group-hover:scale-105"
                  style={{
                    WebkitTextStroke: '2px rgba(255, 222, 89, 0.18)',
                  }}
                >
                  学
                </span>

                <CardHeader className="p-0 pb-2.5 sm:pb-5 relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="border-2 border-black bg-[#FFDE59] px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000]">
                      01 // SOLO DRILL
                    </span>
                    <span className="font-mono text-[9px] sm:text-xs font-bold text-neutral-400 tracking-wider">
                      [SELF PACED]
                    </span>
                  </div>

                  <CardTitle className="text-lg sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
                    Study &amp; Recall
                  </CardTitle>

                  <CardDescription className="hidden sm:block text-xs sm:text-sm font-medium text-neutral-300 mt-1.5 leading-snug sm:leading-relaxed">
                    Practice Kana, Kanji, Vocab SRS, and Genki Grammar points through active recall flashcards.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0 pt-2 sm:pt-4 relative z-10">
                  <LegacyButton
                    variant="neutral"
                    onClick={() => setScreen('learning')}
                    className="w-full cursor-pointer py-2.5 sm:py-5 text-xs sm:text-base font-black uppercase tracking-wider border-2 border-black bg-white text-black shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFDE59] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-colors"
                  >
                    Start Study Deck →
                  </LegacyButton>
                </CardContent>
              </Card>

              {/* Card 2: Live Co-Op Room */}
              <Card className="group relative min-w-0 overflow-hidden bg-[#1f2637] border-2 border-black border-l-8 border-l-[#70CFF8] shadow-[4px_4px_0px_0px_#000] sm:shadow-[7px_7px_0px_0px_#000] p-3.5 sm:p-6 flex flex-col justify-between transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000]">
                <span
                  className="absolute -right-3 -bottom-4 sm:-right-4 sm:-bottom-6 text-[100px] sm:text-[155px] font-black pointer-events-none select-none leading-none font-mono text-transparent transition-all duration-300 group-hover:scale-105"
                  style={{
                    WebkitTextStroke: '2px rgba(112, 207, 248, 0.18)',
                  }}
                >
                  試
                </span>

                <CardHeader className="p-0 pb-2.5 sm:pb-5 relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="border-2 border-black bg-[#70CFF8] px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000]">
                      02 // MULTIPLAYER
                    </span>
                    <span className="font-mono text-[9px] sm:text-xs font-bold text-neutral-400 tracking-wider">
                      [1v1 BATTLE]
                    </span>
                  </div>

                  <CardTitle className="text-lg sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
                    Live Co-Op Room
                  </CardTitle>

                  <CardDescription className="hidden sm:block text-xs sm:text-sm font-medium text-neutral-300 mt-1.5 leading-snug sm:leading-relaxed">
                    Create a live room, challenge friends with custom decks, and test accuracy and speed head-to-head.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0 pt-2 sm:pt-4 relative z-10">
                  <LegacyButton
                    variant="neutral"
                    onClick={() => setScreen('practice')}
                    className="w-full cursor-pointer py-2.5 sm:py-5 text-xs sm:text-base font-black uppercase tracking-wider border-2 border-black bg-white text-black shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] hover:bg-[#70CFF8] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-colors"
                  >
                    Enter Match Lobby →
                  </LegacyButton>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : screen === 'learning' ? (
          <LearningScreen
            onBackToHome={() => setScreen('home')}
            onOpenKanaStudy={onOpenKanaStudy}
            onOpenKanjiStudy={onOpenKanjiStudy}
            onOpenVocabStudy={onOpenVocabStudy}
            onOpenGrammarStudy={onOpenGrammarStudy}
          />
        ) : (
          <PracticeScreen
            onBackToHome={() => setScreen('home')}
            onCreateRoom={handleCreate}
            onJoinRoom={handleJoin}
            isSocketReady={isSocketReady}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            joinCodeInputRef={joinCodeInputRef}
            mode={mode}
            onModeChange={setMode}
            deckType={deckType}
            onDeckTypeChange={setDeckType}
            grammarLevel={grammarLevel}
            onGrammarLevelChange={setGrammarLevel}
            selectedGroups={selectedGroups}
            onGroupToggle={handleGroupToggle}
            onClearSelectedGroups={handleClearSelectedGroups}
            isGroupMenuOpen={isGroupMenuOpen}
            onGroupMenuOpenChange={setIsGroupMenuOpen}
            kanjiGroups={kanjiGroups}
            vocabStages={vocabStages}
          />
        )}
      </div>
    </div>
  );
}