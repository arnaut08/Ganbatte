import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LearningScreen from './learning/LearningScreen';
import PracticeScreen from './practice/PracticeScreen';

function AppHome({
  onCreateRoom,
  onJoinRoom,
  onOpenKanjiStudy,
  onScreenChange,
  screen: controlledScreen,
  prefillRoomCode = '',
  isSocketReady = false,
  roomCode = '',
}) {
  const [internalScreen, setInternalScreen] = useState(controlledScreen || 'home');
  const screen = controlledScreen ?? internalScreen;
  const setScreen = (nextScreen) => {
    if (onScreenChange) {
      onScreenChange(nextScreen);
      return;
    }
    setInternalScreen(nextScreen);
  };
  const [joinCode, setJoinCode] = useState(roomCode || '');
  const [deckType, setDeckType] = useState('kana');
  const [grammarLevel, setGrammarLevel] = useState(1);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const joinCodeInputRef = useRef(null);

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

  const handleGroupToggle = (groupId) => {
    setSelectedGroups((current) => current.includes(groupId)
      ? current.filter((id) => id !== groupId)
      : [...current, groupId]);
  };

  const handleClearSelectedGroups = () => {
    setSelectedGroups([]);
    setIsGroupMenuOpen(false);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!isSocketReady) return;

    const normalizedGroups = deckType === 'kanji' ? selectedGroups : [];
    const normalizedSettings = deckType === 'grammar'
      ? { type: 'grammar', groups: [], maxLesson: grammarLevel, count: 5 }
      : { type: deckType, groups: normalizedGroups };

    onCreateRoom(normalizedSettings);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const targetCode = joinCode.trim();
    if (isSocketReady && targetCode) {
      onJoinRoom(targetCode.toUpperCase());
      setJoinCode('');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {screen === 'home' ? (
          <div className="space-y-8 sm:space-y-10">
            {/* --- HERO SECTION --- */}
            <div className="text-center space-y-3 sm:space-y-4">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 border-2 border-black bg-[#FFDE59] px-3 py-1 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000000]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#A3E636] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#A3E636]" />
                </span>
                <span>CO-OP READY // KANA · KANJI · GRAMMAR</span>
              </div>

              {/* Heading */}
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                Master Japanese{' '}
                <span className="border-b-4 border-[#A3E636] text-[#A3E636]">
                  Together
                </span>
              </h1>

              {/* Cooperative Hero Subtext */}
              <p className="mx-auto max-w-xl font-mono text-xs sm:text-sm font-bold text-white/70">
                Build your character and grammar foundation, then team up in live co-op rooms to practice together.
              </p>

              {/* Note: Uncomment this once streak, progress and live rooms tracking is implemented */}
              {/* Quick Stats Strip */}
              {/* <div className="mx-auto grid max-w-2xl grid-cols-3 gap-2.5 pt-2 sm:gap-4">
                <div className="border-2 border-black bg-[#1f2637] p-2.5 text-center shadow-[3px_3px_0px_0px_#000000] sm:p-3">
                  <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-white/60 sm:text-xs">
                    Streak
                  </span>
                  <span className="font-mono text-sm font-black text-[#FF6B6B] sm:text-lg">
                    🔥 5 DAYS
                  </span>
                </div>
                <div className="border-2 border-black bg-[#1f2637] p-2.5 text-center shadow-[3px_3px_0px_0px_#000000] sm:p-3">
                  <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-white/60 sm:text-xs">
                    Mastered
                  </span>
                  <span className="font-mono text-sm font-black text-[#FFDE59] sm:text-lg">
                    46 KANA
                  </span>
                </div>
                <div className="border-2 border-black bg-[#1f2637] p-2.5 text-center shadow-[3px_3px_0px_0px_#000000] sm:p-3">
                  <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-white/60 sm:text-xs">
                    Study Rooms
                  </span>
                  <span className="font-mono text-sm font-black text-[#A3E636] sm:text-lg">
                    🤝 8 ACTIVE
                  </span>
                </div>
              </div> */}
            </div>

            {/* --- CORE ACTION CARDS --- */}
            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              {/* Card 1: Learning */}
              <Card className="relative overflow-hidden bg-[#FFDE59] border-2 border-black shadow-[6px_6px_0px_0px_#000000] p-6 flex flex-col justify-between transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000]">
                <span className="absolute -right-4 -bottom-6 text-[140px] font-black text-black/[0.07] pointer-events-none select-none leading-none font-mono">
                  学
                </span>

                <CardHeader className="p-0 pb-6 relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="border-2 border-black bg-black px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#FFDE59]">
                      01 // Foundation
                    </span>
                    <span className="font-mono text-xs font-bold text-black/60 tracking-wider">
                      [SOLO MODE]
                    </span>
                  </div>

                  <CardTitle className="text-3xl font-black uppercase tracking-tight text-black mt-1">
                    Learning
                  </CardTitle>

                  <CardDescription className="text-sm font-bold text-black/80 mt-2 leading-relaxed">
                    Study essential Japanese characters (Hiragana, Katakana, Kanji) at your own pace.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0 pt-4 relative z-10">
                  <Button
                    variant="neutral"
                    onClick={() => setScreen('learning')}
                    className="w-full py-6 text-base font-black uppercase tracking-wider border-2 border-black bg-white text-black shadow-[4px_4px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    Explore Learning →
                  </Button>
                </CardContent>
              </Card>

              {/* Card 2: Assessment */}
              <Card className="relative overflow-hidden bg-[#70CFF8] border-2 border-black shadow-[6px_6px_0px_0px_#000000] p-6 flex flex-col justify-between transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000]">
                <span className="absolute -right-4 -bottom-6 text-[140px] font-black text-black/[0.07] pointer-events-none select-none leading-none font-mono">
                  試
                </span>

                <CardHeader className="p-0 pb-6 relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="border-2 border-black bg-black px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#70CFF8]">
                      02 // Practice
                    </span>
                    <span className="font-mono text-xs font-bold text-black/60 tracking-wider">
                      [1v1 LIVE]
                    </span>
                  </div>

                  <CardTitle className="text-3xl font-black uppercase tracking-tight text-black mt-1">
                    Assessment
                  </CardTitle>

                  <CardDescription className="text-sm font-bold text-black/80 mt-2 leading-relaxed">
                    Challenge friends in real-time rooms or test your speed and accuracy against the clock.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0 pt-4 relative z-10">
                  <Button
                    variant="neutral"
                    onClick={() => setScreen('practice')}
                    className="w-full py-6 text-base font-black uppercase tracking-wider border-2 border-black bg-white text-black shadow-[4px_4px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    Start Assessment →
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : screen === 'learning' ? (
          <LearningScreen
            onBackToHome={() => setScreen('home')}
            onOpenKanjiStudy={onOpenKanjiStudy}
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
            deckType={deckType}
            setDeckType={setDeckType}
            grammarLevel={grammarLevel}
            setGrammarLevel={setGrammarLevel}
            selectedGroups={selectedGroups}
            handleGroupToggle={handleGroupToggle}
            onClearSelectedGroups={handleClearSelectedGroups}
            isGroupMenuOpen={isGroupMenuOpen}
            setIsGroupMenuOpen={setIsGroupMenuOpen}
          />
        )}
      </div>
    </div>
  );
}

export default AppHome;