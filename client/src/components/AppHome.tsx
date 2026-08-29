import { useEffect, useRef, useState, type ComponentType, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LearningScreen from './learning/LearningScreen';
import PracticeScreen from './practice/PracticeScreen';
import { getKanjiCards } from '../services/api';
import type { ApiRecord, Deck, DeckOptions, SelectorScreen } from '../types';

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

function AppHome({
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
    getKanjiCards().then((data) => setKanjiGroups(data.groups || [])).catch(() => { });
  }, []);

  const handleGroupToggle = (groupId: string | number) => {
    setSelectedGroups((current) => current.includes(groupId)
      ? current.filter((id) => id !== groupId)
      : [...current, groupId]);
  };

  const handleClearSelectedGroups = () => {
    setSelectedGroups([]);
    setIsGroupMenuOpen(false);
  };

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSocketReady) return;

    const normalizedGroups = deckType === 'kanji' ? selectedGroups : [];
    const normalizedSettings: DeckOptions = deckType === 'grammar'
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
          <div className="space-y-5 sm:space-y-10">
            {/* --- HERO SECTION --- */}
            <div className="text-center space-y-2 sm:space-y-4">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 border-2 border-black bg-[#FFDE59] px-2.5 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000000]">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#A3E636] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#A3E636]" />
                </span>
                <span>CO-OP READY // KANA · KANJI · GRAMMAR</span>
              </div>

              {/* Heading */}
              <h1 className="text-2xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                Master Japanese{' '}
                <span className="border-b-[3px] sm:border-b-4 border-[#A3E636] text-[#A3E636]">
                  Together
                </span>
              </h1>

              {/* Cooperative Hero Subtext */}
              <p className="mx-auto max-w-xl font-mono text-[11px] sm:text-sm font-bold text-white/70 leading-snug sm:leading-normal">
                Build your character and grammar foundation, then team up in live co-op rooms to practice together.
              </p>
            </div>

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

export default AppHome;