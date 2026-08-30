import { useEffect, useMemo, useRef, useState, type ComponentType, type FormEvent, type ReactNode } from 'react';
import {
  RocketIcon,
  TimerIcon,
  CheckCircledIcon,
  LightningBoltIcon,
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LearningScreen from './learning/LearningScreen';
import PracticeScreen from './practice/PracticeScreen';
import { getKanjiCards, getKanjiOverview, getCharacterAttempts, getVocabOverview } from '../services/api';
import type { ApiRecord, Deck, DeckOptions, SelectorScreen, KanjiGroupOverview } from '../types';

type LegacyProps = {
  children?: ReactNode;
  [key: string]: unknown;
};

const LegacyButton = Button as unknown as ComponentType<LegacyProps>;
const LegacyPracticeScreen = PracticeScreen as unknown as ComponentType<LegacyProps>;

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
  // Inside AppHome component
  const DEFAULT_VOCAB_TOTAL_STAGES = 28; // Standard Genki 1 / N5 stage count
  const DEFAULT_VOCAB_STAGE_STATS = {
    clearedStages: 0,
    masteredStages: 0,
    totalStages: DEFAULT_VOCAB_TOTAL_STAGES,
  };
  const [vocabStageStats, setVocabStageStats] = useState(DEFAULT_VOCAB_STAGE_STATS);
  const [vocabDueCount, setVocabDueCount] = useState(0);

  useEffect(() => {
    // Pull live vocab stage progress from the overview endpoint. Every stage
    // carries `is_cleared` (passed the 80% quiz) and `is_mastered` (all words
    // at high recall); count the booleans straight from the API so the HUD
    // always reflects the latest server state. If the endpoint is unavailable,
    // fall back to the previously cached stats so the HUD keeps its last state.
    getVocabOverview('N5')
      .then((overview) => {
        const stages = overview.stages || [];
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
          // Storage may be unavailable; stats still display for this session.
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
          // Fallback default state
          console.error('Failed to load cached vocab stats from localStorage:', cacheError);
        }
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
  const [deckType, setDeckType] = useState<Deck>('kana');
  const [grammarLevel, setGrammarLevel] = useState(1);
  const [selectedGroups, setSelectedGroups] = useState<Array<string | number>>([]);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [kanjiGroups, setKanjiGroups] = useState<ApiRecord[]>([]);

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
    getKanjiCards().then((data) => setKanjiGroups(data.groups || [])).catch((error) => {
      console.error('Failed to fetch kanji cards:', error);
    });
    getKanjiOverview().then((data) => setKanjiOverview(data.groups || [])).catch((error) => {
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

  // Combined due reviews across Kanji + Vocab for the passport HUD badge.
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

    const normalizedGroups = deckType === 'kanji' ? selectedGroups : [];
    const normalizedSettings: DeckOptions =
      deckType === 'grammar'
        ? { type: 'grammar', groups: [], maxLesson: grammarLevel, count: 5 }
        : { type: deckType, groups: normalizedGroups };

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
    <div className="flex min-h-[calc(100vh-64px-4rem)] items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-5xl">
        {screen === 'home' ? (
          <div className="space-y-5 sm:space-y-8">
            {/* --- HERO SECTION --- */}
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 border-2 border-black bg-[#FFDE59] px-2.5 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000000]">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#A3E636] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#A3E636]" />
                </span>
                <span>CO-OP READY // KANA · KANJI · GRAMMAR</span>
              </div>

              <h1 className="text-2xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                Master Japanese{' '}
                <span className="border-b-[3px] sm:border-b-4 border-[#A3E636] text-[#A3E636]">
                  Together
                </span>
              </h1>

              <p className="mx-auto max-w-xl font-mono text-[11px] sm:text-sm font-bold text-white/70 leading-snug sm:leading-normal">
                Build your character and grammar foundation, then team up in live co-op rooms to practice together.
              </p>
            </div>

            {/* --- PLAYER PASSPORT & STATS HUD --- */}
            <section className="mx-auto w-full max-w-4xl border-2 border-black bg-[#151922] p-2.5 sm:p-4 text-white shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] space-y-2 sm:space-y-3">
              {/* Header Bar */}
              <div className="flex items-center justify-between gap-2 border-b-2 border-white/20 pb-2">
                <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                  <span className="shrink-0 border border-black bg-[#A3E636] px-1.5 py-0.5 font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000]">
                    PASSPORT
                  </span>
                  <span className="truncate font-mono text-[10px] sm:text-xs font-black uppercase tracking-tight text-white">
                  // PLAYER PROGRESSION
                  </span>
                </div>

                {/* Combined Reviews Badge */}
                <div
                  className={`shrink-0 flex items-center gap-1 sm:gap-1.5 border-2 border-black px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] ${totalDueReviews > 0
                      ? 'bg-[#FF6B6B] text-black'
                      : 'bg-[#252c3d] text-neutral-400'
                    }`}
                >
                  <TimerIcon className={`h-3 w-3 ${totalDueReviews > 0 ? 'text-black' : 'text-neutral-400'}`} />
                  <span className="hidden xs:inline">TOTAL DUE:</span>
                  <span className={totalDueReviews > 0 ? 'text-black' : 'text-white'}>
                    {totalDueReviews}
                  </span>
                </div>
              </div>

              {/* 3 Pillar Cards: Compact rows on mobile, 3-column grid on tablet/desktop */}
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:gap-3">
                {/* 01 // KANA */}
                <div
                  onClick={onOpenKanaStudy}
                  className="group/card cursor-pointer border-2 border-black bg-[#252c3d] p-2 sm:p-3 transition-all hover:bg-[#2e374d] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#FFDE59]">
                      01 // KANA
                    </span>
                    <RocketIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#FFDE59]" />
                  </div>

                  <div className="mt-0.5 sm:mt-1 flex items-baseline justify-between font-mono">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-white">Mastered</span>
                    <span className="font-mono text-[10px] sm:text-xs font-black text-[#FFDE59]">
                      {kanaMasteredCount.hiragana + kanaMasteredCount.katakana} / 92
                    </span>
                  </div>

                  <div className="mt-1 sm:mt-1.5 h-1.5 sm:h-2 w-full overflow-hidden border border-black bg-[#151922]">
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
                  className="group/card cursor-pointer border-2 border-black bg-[#252c3d] p-2 sm:p-3 transition-all hover:bg-[#2e374d] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#70CFF8]">
                      02 // KANJI
                    </span>
                    <CheckCircledIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#70CFF8]" />
                  </div>

                  <div className="mt-0.5 sm:mt-1 flex items-baseline justify-between font-mono">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-white">Groups</span>
                    <span className="font-mono text-[10px] sm:text-xs font-black text-[#70CFF8]">
                      {masteredKanjiGroups} / {kanjiOverview.length || 8}
                    </span>
                  </div>

                  <div className="mt-1 sm:mt-1.5 h-1.5 sm:h-2 w-full overflow-hidden border border-black bg-[#151922]">
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
                  className="group/card cursor-pointer border-2 border-black bg-[#252c3d] p-2 sm:p-3 transition-all hover:bg-[#2e374d] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#A3E636]">
                      03 // VOCAB SRS
                    </span>
                    <LightningBoltIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#A3E636]" />
                  </div>

                  <div className="mt-0.5 sm:mt-1 flex items-baseline justify-between font-mono">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-white">Stages</span>
                    <span className="font-mono text-[10px] sm:text-xs font-black text-[#A3E636]">
                      {vocabStageStats.clearedStages} / 28
                    </span>
                  </div>

                  <div className="mt-1 sm:mt-1.5 flex h-1.5 sm:h-2 w-full overflow-hidden border border-black bg-[#151922]">
                    {/* Mastered solid */}
                    <div
                      className="h-full bg-[#A3E636] transition-all"
                      style={{
                        width: `${Math.min(100, (vocabStageStats.masteredStages / 28) * 100)}%`,
                      }}
                    />
                    {/* Cleared striped */}
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

                  {/* Sub-label breakdown */}
                  <div className="mt-0.5 sm:mt-1 flex justify-between font-mono text-[7px] sm:text-[8px] font-black uppercase">
                    <span className="text-[#A3E636]">★ {vocabStageStats.masteredStages} M</span>
                    <span className="text-[#A3E636]/80">✓ {vocabStageStats.clearedStages} C</span>
                  </div>
                </div>
              </div>
            </section>

            {/* --- CORE ACTION CARDS --- */}
            <div className="grid gap-4 sm:gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              {/* Card 1: Study & Recall */}
              <Card className="relative overflow-hidden bg-[#FFDE59] border-2 border-black shadow-[4px_4px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000] p-4 sm:p-6 flex flex-col justify-between transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000]">
                <span className="absolute -right-3 -bottom-4 sm:-right-4 sm:-bottom-6 text-[100px] sm:text-[140px] font-black text-black/[0.07] pointer-events-none select-none leading-none font-mono">
                  学
                </span>

                <CardHeader className="p-0 pb-3 sm:pb-6 relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
                    <span className="border-2 border-black bg-black px-1.5 py-0.5 sm:px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#FFDE59]">
                      01 // SOLO DRILL
                    </span>
                    <span className="font-mono text-[10px] sm:text-xs font-bold text-black/60 tracking-wider">
                      [SELF PACED]
                    </span>
                  </div>

                  <CardTitle className="text-xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1">
                    Study &amp; Recall
                  </CardTitle>

                  <CardDescription className="text-xs sm:text-sm font-bold text-black/80 mt-1.5 sm:mt-2 leading-snug sm:leading-relaxed">
                    Practice Kana, Kanji, and Genki Grammar points through active recall and flashcards at your own pace.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0 pt-2 sm:pt-4 relative z-10">
                  <LegacyButton
                    variant="neutral"
                    onClick={() => setScreen('learning')}
                    className="w-full py-3 sm:py-6 text-xs sm:text-base font-black uppercase tracking-wider border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    Start Study Deck →
                  </LegacyButton>
                </CardContent>
              </Card>

              {/* Card 2: Live Co-Op Room */}
              <Card className="relative overflow-hidden bg-[#70CFF8] border-2 border-black shadow-[4px_4px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000] p-4 sm:p-6 flex flex-col justify-between transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000]">
                <span className="absolute -right-3 -bottom-4 sm:-right-4 sm:-bottom-6 text-[100px] sm:text-[140px] font-black text-black/[0.07] pointer-events-none select-none leading-none font-mono">
                  試
                </span>

                <CardHeader className="p-0 pb-3 sm:pb-6 relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
                    <span className="border-2 border-black bg-black px-1.5 py-0.5 sm:px-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#70CFF8]">
                      02 // MULTIPLAYER
                    </span>
                    <span className="font-mono text-[10px] sm:text-xs font-bold text-black/60 tracking-wider">
                      [1v1 BATTLE]
                    </span>
                  </div>

                  <CardTitle className="text-xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1">
                    Live Co-Op Room
                  </CardTitle>

                  <CardDescription className="text-xs sm:text-sm font-bold text-black/80 mt-1.5 sm:mt-2 leading-snug sm:leading-relaxed">
                    Create a live room, challenge friends with custom decks, and test accuracy and speed head-to-head.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0 pt-2 sm:pt-4 relative z-10">
                  <LegacyButton
                    variant="neutral"
                    onClick={() => setScreen('practice')}
                    className="w-full py-3 sm:py-6 text-xs sm:text-base font-black uppercase tracking-wider border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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
          <LegacyPracticeScreen
            onBackToHome={() => setScreen('home')}
            onCreateRoom={handleCreate}
            onJoinRoom={handleJoin}
            isSocketReady={isSocketReady}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            joinCodeInputRef={joinCodeInputRef}
            deckType={deckType}
            setDeckType={setDeckType}
            grammarLevel={grammarLevel}
            setGrammarLevel={setGrammarLevel}
            selectedGroups={selectedGroups}
            handleGroupToggle={handleGroupToggle}
            onClearSelectedGroups={handleClearSelectedGroups}
            isGroupMenuOpen={isGroupMenuOpen}
            setIsGroupMenuOpen={setIsGroupMenuOpen}
            kanjiGroups={kanjiGroups}
          />
        )}
      </div>
    </div>
  );
}