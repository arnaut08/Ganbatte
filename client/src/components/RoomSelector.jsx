import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import BackButton from './common/BackButton';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const KANJI_GROUPS = [
  { id: 'numbers', name: 'Numbers and Counters' },
  { id: 'people-family', name: 'People and Family' },
  { id: 'time-dates', name: 'Time and Dates' },
  { id: 'places-directions', name: 'Places and Directions' },
  { id: 'nature-weather', name: 'Nature and Weather' },
  { id: 'school-actions', name: 'School and Everyday Actions' },
];

function RoomSelector({
  onCreateRoom,
  onJoinRoom,
  onOpenKanjiStudy,
  onOpenGrammarPractice,
  onReturnToRoom,
  onDeclineRoomResume,
  prefillRoomCode = '',
  isSocketReady = false,
  canReturnToRoom = false,
  roomCode = '',
  resumeUsername = '',
  user = null,
  friends = [],
  friendSearchResults = [],
  isFriendSearchLoading = false,
  onSearchUsers,
}) {
  const [joinCode, setJoinCode] = useState(roomCode || '');
  const [screen, setScreen] = useState('home');
  const [deckType, setDeckType] = useState('kana');
  const [grammarLevel, setGrammarLevel] = useState(1);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const joinCodeInputRef = useRef(null);

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
      <div className="w-full max-w-4xl">
        {screen === 'home' ? (
          <div className="space-y-4">
            <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              {/* Learning Card */}
              <Card className="relative overflow-hidden bg-[#FFDE59] border-2 border-black shadow-[6px_6px_0px_0px_#000000] p-6 flex flex-col justify-between transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000]">
                {/* Large Background Japanese Watermark */}
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

              {/* Assessment Card */}
              <Card className="relative overflow-hidden bg-[#70CFF8] border-2 border-black shadow-[6px_6px_0px_0px_#000000] p-6 flex flex-col justify-between transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000]">
                {/* Large Background Japanese Watermark */}
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
                    onClick={() => setScreen('assessment')}
                    className="w-full py-6 text-base font-black uppercase tracking-wider border-2 border-black bg-white text-black shadow-[4px_4px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    Start Assessment →
                  </Button>
                </CardContent>
              </Card>
            </div>

          </div>
        ) : screen === 'learning' ? (
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Screen Header Bar */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setScreen('home')}
                className="flex h-11 w-11 items-center justify-center border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                title="Back to home"
              >
                <span className="font-mono text-lg font-black">&lt;</span>
              </button>

              <div className="flex flex-col justify-center">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
        // SECTION: LEARNING
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
                  Study Japanese Characters
                </h2>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* 1. Kana Card (Locked / Coming Soon) */}
              <Card className="relative flex flex-col justify-between overflow-hidden border-2 border-black bg-[#1a1f2c] p-6 opacity-85 shadow-[6px_6px_0px_0px_#000000]">
                {/* Background Watermark */}
                <span className="pointer-events-none absolute -bottom-6 -right-3 select-none font-mono text-[130px] font-black leading-none text-white/[0.04]">
                  仮
                </span>

                <CardHeader className="relative z-10 p-0 pb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="border-2 border-black bg-[#2c3345] px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-neutral-400">
                      01 // Kana
                    </span>
                    <span className="font-mono text-xs font-bold text-neutral-500">
                      [LOCKED]
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight text-white">
                    Kana
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm font-semibold text-neutral-400 leading-relaxed">
                    Learn the two Japanese syllabaries: Hiragana and Katakana.
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 p-0 pt-4">
                  <Button
                    variant="neutral"
                    disabled
                    className="w-full border-2 border-black bg-neutral-800 py-5 text-sm font-black uppercase tracking-wider text-neutral-500 shadow-none cursor-not-allowed"
                  >
                    Coming Soon...
                  </Button>
                </CardContent>
              </Card>

              {/* 2. N5 Kanji Card (ACTIVE / Highlighted) */}
              <Card className="relative flex flex-col justify-between overflow-hidden border-2 border-black bg-[#FFDE59] p-6 shadow-[6px_6px_0px_0px_#000000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000]">
                {/* Background Watermark */}
                <span className="pointer-events-none absolute -bottom-6 -right-3 select-none font-mono text-[130px] font-black leading-none text-black/[0.08]">
                  漢
                </span>

                <CardHeader className="relative z-10 p-0 pb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="border-2 border-black bg-black px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#FFDE59]">
                      02 // Kanji
                    </span>
                    <span className="border-2 border-black bg-[#A3E636] px-1.5 py-0.5 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000]">
                      AVAILABLE
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight text-black">
                    N5 Kanji
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm font-bold text-black/80 leading-relaxed">
                    Review essential N5 Kanji grouped by everyday themes with flashcards.
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 p-0 pt-4">
                  <Button
                    onClick={onOpenKanjiStudy}
                    className="w-full border-2 border-black bg-white py-5 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    Study Now →
                  </Button>
                </CardContent>
              </Card>

              {/* 3. Genki Grammar Card (Locked / Coming Soon) */}
              <Card className="relative flex flex-col justify-between overflow-hidden border-2 border-black bg-[#1a1f2c] p-6 opacity-85 shadow-[6px_6px_0px_0px_#000000]">
                {/* Background Watermark */}
                <span className="pointer-events-none absolute -bottom-6 -right-3 select-none font-mono text-[130px] font-black leading-none text-white/[0.04]">
                  文
                </span>

                <CardHeader className="relative z-10 p-0 pb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="border-2 border-black bg-[#2c3345] px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-neutral-400">
                      03 // Grammar
                    </span>
                    <span className="font-mono text-xs font-bold text-neutral-500">
                      [LOCKED]
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight text-white">
                    Genki Grammar
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm font-semibold text-neutral-400 leading-relaxed">
                    Genki Volume 1 lessons summarized in progressive learning blocks.
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 p-0 pt-4">
                  <Button
                    variant="neutral"
                    disabled
                    className="w-full border-2 border-black bg-neutral-800 py-5 text-sm font-black uppercase tracking-wider text-neutral-500 shadow-none cursor-not-allowed"
                  >
                    Coming Soon...
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-6">
            {/* 1. Cohesive Screen Header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setScreen('home')}
                className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                title="Back to home"
              >
                <span className="font-mono text-lg font-black">&lt;</span>
              </button>

              <div className="flex flex-col justify-center">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
        // MULTIPLAYER: 1V1 ARENA
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
                  Practice With a Friend
                </h2>
              </div>
            </div>

            {/* 2. Main Two-Column Action Grid */}
            <div className="grid gap-6 md:grid-cols-2 items-start">
              {/* CARD 1: CREATE A ROOM (Yellow Theme) */}
              <Card className="relative flex flex-col justify-between overflow-hidden border-2 border-black bg-[#FFDE59] p-6 shadow-[6px_6px_0px_0px_#000000]">
                {/* Background Japanese Watermark */}
                <span className="pointer-events-none absolute -bottom-6 -right-3 select-none font-mono text-[130px] font-black leading-none text-black/[0.08]">
                  創
                </span>

                <div className="relative z-10 space-y-5">
                  {/* Header Block */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="border-2 border-black bg-black px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#FFDE59]">
                        HOST
                      </span>
                      <span className="font-mono text-xs font-bold text-black/60">
                        [NEW SESSION]
                      </span>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-black">
                      Create a Room
                    </h3>
                    <p className="mt-1 text-sm font-bold text-black/80 leading-snug">
                      Start a new multiplayer assessment and invite a study partner.
                    </p>
                  </div>

                  {/* Configuration Controls */}
                  <div className="space-y-4">
                    {/* Deck Type Segmented Control */}
                    <div className="space-y-1.5">
                      <span className="font-mono text-[11px] font-black uppercase tracking-wider text-black">
                        SELECT DECK
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 border-2 border-black bg-black/10 p-1">
                        {['kana', 'kanji', 'grammar'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setDeckType(type)}
                            className={`py-2 text-xs font-black uppercase transition-all ${deckType === type
                              ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000000]'
                              : 'border-2 border-transparent text-black/70 hover:text-black'
                              }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grammar Level Selector */}
                    {deckType === 'grammar' && (
                      <div className="space-y-1.5">
                        <label className="font-mono text-[11px] font-black uppercase tracking-wider text-black">
                          LESSON LEVEL
                        </label>

                        <div className="relative">
                          <select
                            value={grammarLevel}
                            onChange={(e) => setGrammarLevel(Number(e.target.value) || 1)}
                            className="flex h-10 w-full appearance-none border-2 border-black bg-white px-3 pr-10 text-xs font-black uppercase tracking-wide text-black shadow-[3px_3px_0px_0px_#000000] focus:outline-none cursor-pointer"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((lvl) => (
                              <option key={lvl} value={lvl} className="bg-white text-black font-bold">
                                Lesson {lvl}
                              </option>
                            ))}
                          </select>

                          {/* Custom Heavy Neo-Brutalist Chevron Icon */}
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronDownIcon className="h-4 w-4 stroke-[3] text-black" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Kanji Group Selector */}
                    {deckType === 'kanji' && (
                      <div className="space-y-1.5">
                        <span className="font-mono text-[11px] font-black uppercase tracking-wider text-black">
                          KANJI THEMES
                        </span>
                        <DropdownMenu open={isGroupMenuOpen} onOpenChange={setIsGroupMenuOpen}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="neutral"
                              className="flex h-10 w-full items-center justify-between border-2 border-black bg-white px-3 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000000]"
                            >
                              <span className="truncate">
                                {selectedGroups.length === 0 ? 'All Groups' : `${selectedGroups.length} Selected`}
                              </span>
                              <ChevronDownIcon className="h-4 w-4 stroke-[3]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 border-2 border-black bg-white p-1 shadow-[4px_4px_0px_0px_#000000]" align="start">
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setSelectedGroups([]);
                                setIsGroupMenuOpen(false);
                              }}
                              className={`cursor-pointer px-3 py-2 text-xs font-black uppercase hover:bg-[#FFDE59] ${selectedGroups.length === 0 ? 'bg-[#FFDE59]' : ''
                                }`}
                            >
                              <span className="mr-2">{selectedGroups.length === 0 ? '✓' : ''}</span>
                              All Groups
                            </DropdownMenuItem>
                            {KANJI_GROUPS.map((group) => (
                              <DropdownMenuItem
                                key={group.id}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleGroupToggle(group.id);
                                }}
                                className={`cursor-pointer px-3 py-2 text-xs font-black uppercase hover:bg-[#FFDE59] ${selectedGroups.includes(group.id) ? 'bg-[#FFDE59]' : ''
                                  }`}
                              >
                                <span className="mr-2">{selectedGroups.includes(group.id) ? '✓' : ''}</span>
                                {group.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {selectedGroups.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {selectedGroups.map((groupId) => (
                              <span
                                key={groupId}
                                className="inline-flex items-center gap-1 border-2 border-black bg-black px-2 py-0.5 text-xs font-black uppercase text-[#FFDE59]"
                              >
                                {KANJI_GROUPS.find((g) => g.id === groupId)?.name || groupId}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Submit */}
                <form onSubmit={handleCreate} className="relative z-10 mt-6">
                  <Button
                    type="submit"
                    disabled={!isSocketReady}
                    className="w-full border-2 border-black bg-white py-5 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                  >
                    {isSocketReady ? 'Create Room →' : 'Connecting...'}
                  </Button>
                </form>
              </Card>

              {/* CARD 2: JOIN A ROOM (Green/Lime Theme) */}
              <Card className="relative flex flex-col justify-between overflow-hidden border-2 border-black bg-[#A3E636] p-6 shadow-[6px_6px_0px_0px_#000000]">
                {/* Background Japanese Watermark */}
                <span className="pointer-events-none absolute -bottom-6 -right-3 select-none font-mono text-[130px] font-black leading-none text-black/[0.08]">
                  入
                </span>

                <div className="relative z-10 space-y-5">
                  {/* Header Block */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="border-2 border-black bg-black px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#A3E636]">
                        CLIENT
                      </span>
                      <span className="font-mono text-xs font-bold text-black/60">
                        [ENTER CODE]
                      </span>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-black">
                      Join a Room
                    </h3>
                    <p className="mt-1 text-sm font-bold text-black/80 leading-snug">
                      Enter the 6-character room code shared by your friend to join.
                    </p>
                  </div>

                  {/* Input Field Form */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="font-mono text-[11px] font-black uppercase tracking-wider text-black">
                        ROOM ACCESS CODE
                      </label>
                      <Input
                        ref={joinCodeInputRef}
                        type="text"
                        placeholder="e.g. S3OPPP"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="h-12 border-2 border-black bg-white px-4 font-mono text-lg font-black uppercase tracking-widest text-black shadow-[3px_3px_0px_0px_#000000] placeholder:text-neutral-400 placeholder:normal-case placeholder:font-sans placeholder:text-sm"
                      />
                    </div>

                    {canReturnToRoom && !joinCode.trim() && (
                      <div className="border border-black bg-white/70 px-3 py-1.5 font-mono text-xs font-black text-black">
                        LAST ROOM: <span className="underline">{roomCode}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Submit */}
                <form onSubmit={handleJoin} className="relative z-10 mt-6">
                  <Button
                    type="submit"
                    disabled={!isSocketReady || !joinCode.trim()}
                    className="w-full border-2 border-black bg-white py-5 text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                  >
                    Join Room →
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomSelector;