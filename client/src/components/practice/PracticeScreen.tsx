import { useEffect, useState, type ComponentType, type Dispatch, type FormEvent, type ReactNode, type RefObject, type SetStateAction } from 'react';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChevronDownIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import type { Deck, KanjiGroup, VocabStage, MatchMode } from '../../types';

type LegacyProps = { children?: ReactNode;[key: string]: unknown };

const LegacyButton = Button as unknown as ComponentType<LegacyProps>;
const LegacyCard = Card as unknown as ComponentType<LegacyProps>;
const LegacyInput = Input as unknown as ComponentType<LegacyProps>;

type CreateRoomCardProps = {
  mode: MatchMode;
  setMode: Dispatch<SetStateAction<MatchMode>>;
  deckType: Deck;
  setDeckType: Dispatch<SetStateAction<Deck>>;
  grammarLevel: number;
  setGrammarLevel: Dispatch<SetStateAction<number>>;
  selectedGroups: string[];
  handleGroupToggle: (groupId: string) => void;
  onClearSelectedGroups: () => void;
  isGroupMenuOpen: boolean;
  setIsGroupMenuOpen: Dispatch<SetStateAction<boolean>>;
  onCreateRoom: (event: FormEvent<HTMLFormElement>) => void;
  isSocketReady: boolean;
  kanjiGroups: KanjiGroup[];
  vocabStages: VocabStage[];
};

type JoinRoomCardProps = {
  joinCode: string;
  setJoinCode: Dispatch<SetStateAction<string>>;
  joinCodeInputRef: RefObject<HTMLInputElement>;
  onJoinRoom: (event: FormEvent<HTMLFormElement>) => void;
  isSocketReady: boolean;
};

type PracticeScreenProps = CreateRoomCardProps & JoinRoomCardProps & {
  onBackToHome: () => void;
};

function CreateRoomCard({
  mode,
  setMode,
  deckType,
  setDeckType,
  grammarLevel,
  setGrammarLevel,
  selectedGroups,
  handleGroupToggle,
  onClearSelectedGroups,
  isGroupMenuOpen,
  setIsGroupMenuOpen,
  onCreateRoom,
  isSocketReady,
  kanjiGroups,
  vocabStages,
}: CreateRoomCardProps) {
  const [isGrammarMenuOpen, setIsGrammarMenuOpen] = useState(false);
  const isAnyMenuOpen = isGroupMenuOpen || isGrammarMenuOpen;
  const isKanji = deckType === 'kanji';
  const isVocab = deckType === 'vocab';
  const isGauntlet = mode === 'gauntlet';

  const defaultOptions = [
    { type: 'kana', label: 'Kana', color: '#FFDE59' },
    { type: 'kanji', label: 'Kanji', color: '#70CFF8' },
    { type: 'vocab', label: 'Vocab', color: '#A3E636' },
    { type: 'grammar', label: 'Grammar', color: '#C084FC' },
  ];

  const subMenuOptions = isGauntlet
    ? defaultOptions.filter((option) => option.type === 'kana' || option.type === 'kanji')
    : defaultOptions;

  const selectionItems = isKanji
    ? kanjiGroups.map((group) => ({ id: group.id, label: group.name }))
    : vocabStages.map((stage) => ({ id: String(stage.stage_number), label: stage.theme }));

  return (
    <Card
      className={`group relative flex flex-col justify-between border-2 border-black border-l-8 border-l-[#FFDE59] bg-[#1f2637] p-3.5 sm:p-6 shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] transition-all duration-150 ${isAnyMenuOpen ? 'z-30 overflow-visible' : 'z-10 overflow-visible'
        }`}
    >
      {/* Clipped watermark */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <span
          className="absolute -bottom-3 -right-2 sm:-bottom-6 sm:-right-3 select-none font-mono text-[95px] sm:text-[135px] font-black leading-none text-transparent transition-all duration-300 group-hover:scale-105"
          style={{ WebkitTextStroke: '2px rgba(255, 222, 89, 0.18)' }}
          aria-hidden="true"
        >
          創
        </span>
      </div>

      <div className="relative z-20 space-y-3.5 sm:space-y-5">
        <div>
          <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
            <span className="border-2 border-black bg-[#FFDE59] px-1.5 py-0.5 sm:px-2 text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-none">
              HOST
            </span>
            <span className="font-mono text-[9px] sm:text-xs font-bold text-neutral-400">
              [NEW SESSION]
            </span>
          </div>
          <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white">
            Create a Room
          </h3>
          <p className="mt-1 text-xs sm:text-sm font-medium text-neutral-300 leading-snug">
            Configure a duel format, pick a curriculum, and challenge a study partner.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Match Format Toggle */}
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-200">
                MATCH FORMAT
              </span>
              <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#FFDE59]">
                {isGauntlet ? (
                  <span className="inline-flex items-center gap-1">
                    <LightningBoltIcon className="h-3 w-3" aria-hidden="true" /> ARCADE SURVIVAL
                  </span>
                ) : (
                  '// CLASSIC 1v1 ASSESSMENT'
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 sm:gap-1.5 border-2 border-black bg-[#151922] p-0.5 sm:p-1">
              <button
                type="button"
                onClick={() => setMode('standard')}
                className={`cursor-pointer py-1.5 sm:py-2 text-[11px] sm:text-xs font-black uppercase transition-all ${mode === 'standard'
                  ? 'border-2 border-black bg-[#FFDE59] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                  : 'border-2 border-transparent text-neutral-400 hover:text-white'
                  }`}
              >
                Standard Duel
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('gauntlet');
                  if (deckType === 'vocab' || deckType === 'grammar') {
                    setDeckType('kana');
                    onClearSelectedGroups(); // Prevent carry-over when forcing Kana
                  }
                  setIsGroupMenuOpen(false);
                  setIsGrammarMenuOpen(false);
                }}
                className={`cursor-pointer py-1.5 sm:py-2 text-[11px] sm:text-xs font-black uppercase transition-all flex items-center justify-center gap-1 ${mode === 'gauntlet'
                  ? 'border-2 border-black bg-[#FF6B6B] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                  : 'border-2 border-transparent text-neutral-400 hover:text-white'
                  }`}
              >
                <span className="flex items-center gap-1">
                  <LightningBoltIcon className="h-3 w-3" aria-hidden="true" /> Gauntlet
                </span>
              </button>
            </div>
          </div>

          {/* Select Deck Segment Control */}
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-200">
                SELECT DECK
              </span>
              {isGauntlet && (
                <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#FF6B6B]">
                  [KANA &amp; N5 KANJI ONLY]
                </span>
              )}
            </div>

            <div
              className={`grid ${isGauntlet ? 'grid-cols-2' : 'grid-cols-4'
                } gap-1 sm:gap-1.5 border-2 border-black bg-[#151922] p-0.5 sm:p-1`}
            >
              {subMenuOptions.map(({ type, label, color }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    if (deckType !== type) {
                      onClearSelectedGroups(); // Flush selections when changing decks
                    }
                    setDeckType(type as Deck);
                    setIsGroupMenuOpen(false);
                    setIsGrammarMenuOpen(false);
                  }}
                  style={{
                    backgroundColor: deckType === type ? color : 'transparent',
                  }}
                  className={`py-1.5 sm:py-2 text-[11px] sm:text-xs font-black uppercase transition-all cursor-pointer ${deckType === type
                    ? 'border-2 border-black text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                    : 'border-2 border-transparent text-neutral-400 hover:text-white'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Grammar Level Selector (Standard Mode Only) */}
          {!isGauntlet && deckType === 'grammar' && (
            <div className="relative z-30 space-y-1 sm:space-y-1.5">
              <label className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-200">
                LESSON LEVEL
              </label>

              <button
                type="button"
                onClick={() => setIsGrammarMenuOpen((prev) => !prev)}
                className="flex h-9 sm:h-10 w-full cursor-pointer items-center justify-between border-2 border-black bg-[#151922] px-3 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_0px_#000] transition-colors hover:bg-[#252c3d]"
              >
                <span>Lesson {grammarLevel}</span>
                <ChevronDownIcon className="h-4 w-4 stroke-[3] text-white" />
              </button>

              {isGrammarMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsGrammarMenuOpen(false)}
                  />
                  <div className="absolute top-full left-0 z-50 mt-1 max-h-52 w-full overflow-y-auto border-2 border-black bg-[#151922] p-1 shadow-[5px_5px_0px_0px_#000] [scrollbar-width:thin] [scrollbar-color:#323b4e_#151922]">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setGrammarLevel(lvl);
                          setIsGrammarMenuOpen(false);
                        }}
                        className={`flex w-full cursor-pointer items-center px-3 py-2 font-mono text-xs font-black uppercase transition-colors ${grammarLevel === lvl
                          ? 'bg-[#C084FC] text-black font-black'
                          : 'text-white hover:bg-[#C084FC] hover:text-black'
                          }`}
                      >
                        <span className="mr-2">{grammarLevel === lvl ? '✓' : ' '}</span>
                        Lesson {lvl}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Kanji Themes / Vocab Stages Selector */}
          {(isKanji || (!isGauntlet && isVocab)) && (
            <div className="relative z-30 space-y-1 sm:space-y-1.5">
              <span className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-200">
                {isKanji ? 'KANJI THEMES' : 'VOCAB STAGES'}
              </span>

              <button
                type="button"
                onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                className="flex h-9 sm:h-10 w-full cursor-pointer items-center justify-between border-2 border-black bg-[#151922] px-3 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_0px_#000] transition-colors hover:bg-[#252c3d]"
              >
                <span className="truncate">
                  {selectedGroups.length === 0 ? 'All Groups' : `${selectedGroups.length} Selected`}
                </span>
                <ChevronDownIcon className="h-4 w-4 stroke-[3] text-white" />
              </button>

              {isGroupMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsGroupMenuOpen(false)}
                  />
                  <div className="absolute top-full left-0 z-50 mt-1 max-h-56 w-full overflow-y-auto border-2 border-black bg-[#151922] p-1 shadow-[5px_5px_0px_0px_#000] [scrollbar-width:thin] [scrollbar-color:#323b4e_#151922]">
                    <button
                      type="button"
                      onClick={() => {
                        onClearSelectedGroups();
                        setIsGroupMenuOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center px-3 py-2 font-mono text-xs font-black uppercase transition-colors ${selectedGroups.length === 0
                        ? `${isKanji ? 'bg-[#70CFF8]' : 'bg-[#A3E636]'} text-black font-black`
                        : isKanji ? 'text-white hover:bg-[#70CFF8] hover:text-black' : 'text-white hover:bg-[#A3E636] hover:text-black'
                        }`}
                    >
                      <span className="mr-2">{selectedGroups.length === 0 ? '✓' : ' '}</span>
                      {isKanji ? 'All Groups' : 'All Stages'}
                    </button>
                    {selectionItems.map((item) => {
                      const isSelected = selectedGroups.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleGroupToggle(item.id)}
                          className={`flex w-full cursor-pointer items-center px-3 py-2 font-mono text-xs font-black uppercase transition-colors ${isSelected
                            ? `${isKanji ? 'bg-[#70CFF8]' : 'bg-[#A3E636]'} text-black font-black hover:text-black`
                            : isKanji ? 'text-white hover:bg-[#70CFF8] hover:text-black' : 'text-white hover:bg-[#A3E636] hover:text-black'
                            }`}
                        >
                          <span className="mr-2">{isSelected ? '✓' : ' '}</span>
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {selectedGroups.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-1">
                  {selectedGroups.map((groupId) => (
                    <span
                      key={groupId}
                      className={`inline-flex items-center gap-1 border-2 border-black bg-[#151922] border-l-4 ${isKanji ? 'border-l-[#70CFF8]' : 'border-l-[#A3E636]'
                        } px-1.5 py-0.5 text-[10px] sm:text-xs font-black uppercase text-white shadow-[1px_1px_0px_0px_#000]`}
                    >
                      {selectionItems.find((item) => item.id === groupId)?.label || groupId}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={onCreateRoom} className="relative z-10 mt-4 sm:mt-6">
        <LegacyButton
          type="submit"
          disabled={!isSocketReady}
          className={`w-full cursor-pointer border-2 border-black py-2.5 sm:py-5 text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] transition-colors active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed ${isGauntlet ? 'bg-[#FF6B6B] hover:bg-white' : 'bg-white hover:bg-[#FFDE59]'
            }`}
        >
          {isSocketReady
            ? isGauntlet
              ? 'Launch Gauntlet Lobby →'
              : 'Create Room →'
            : 'Connecting...'}
        </LegacyButton>
      </form>
    </Card>
  );
}

function JoinRoomCard({
  joinCode,
  setJoinCode,
  joinCodeInputRef,
  onJoinRoom,
  isSocketReady,
}: JoinRoomCardProps) {
  return (
    <Card className="group relative z-10 flex flex-col justify-between overflow-hidden border-2 border-black border-l-8 border-l-[#A3E636] bg-[#1f2637] p-3.5 sm:p-6 shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] transition-all duration-150">
      <span
        className="pointer-events-none absolute -bottom-3 -right-2 sm:-bottom-6 sm:-right-3 select-none font-mono text-[95px] sm:text-[135px] font-black leading-none text-transparent transition-all duration-300 group-hover:scale-105"
        style={{ WebkitTextStroke: '2px rgba(163, 230, 54, 0.18)' }}
        aria-hidden="true"
      >
        入
      </span>

      <div className="relative z-10 space-y-3.5 sm:space-y-5">
        <div>
          <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
            <span className="border-2 border-black bg-[#A3E636] px-1.5 py-0.5 sm:px-2 text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-none">
              CLIENT
            </span>
            <span className="font-mono text-[9px] sm:text-xs font-bold text-neutral-400">
              [ENTER CODE]
            </span>
          </div>
          <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white">
            Join a Room
          </h3>
          <p className="mt-1 text-xs sm:text-sm font-medium text-neutral-300 leading-snug">
            Enter the 6-character room code shared by your friend to join.
          </p>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          <div className="space-y-1 sm:space-y-1.5">
            <label className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-200">
              ROOM ACCESS CODE
            </label>
            <LegacyInput
              ref={joinCodeInputRef}
              type="text"
              placeholder="e.g. S3OPPP"
              value={joinCode}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setJoinCode(e.target.value)}
              className="h-10 sm:h-12 border-2 border-black bg-[#151922] px-3 sm:px-4 font-mono text-base sm:text-lg font-black uppercase tracking-widest text-white shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] placeholder:text-neutral-500 placeholder:normal-case placeholder:font-sans placeholder:text-xs sm:placeholder:text-sm focus:border-[#A3E636] focus:ring-0"
            />
          </div>
        </div>
      </div>

      <form onSubmit={onJoinRoom} className="relative z-10 mt-4 sm:mt-6">
        <LegacyButton
          type="submit"
          disabled={!isSocketReady || !joinCode.trim()}
          className="w-full cursor-pointer border-2 border-black bg-white py-2.5 sm:py-5 text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] transition-colors hover:bg-[#A3E636] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Join Room →
        </LegacyButton>
      </form>
    </Card>
  );
}

export default function PracticeScreen({
  onBackToHome,
  onCreateRoom,
  onJoinRoom,
  isSocketReady,
  joinCode,
  setJoinCode,
  joinCodeInputRef,
  mode,
  setMode,
  deckType,
  setDeckType,
  grammarLevel,
  setGrammarLevel,
  selectedGroups,
  handleGroupToggle,
  onClearSelectedGroups,
  isGroupMenuOpen,
  setIsGroupMenuOpen,
  kanjiGroups = [],
  vocabStages = [],
}: PracticeScreenProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6 pb-20 sm:pb-24">
      {/* Header */}
      <div className="flex items-start gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={onBackToHome}
          className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          title="Back to home"
          aria-label="Return to home"
        >
          <span className="font-mono text-sm sm:text-lg font-black">&lt;</span>
        </button>

        <div className="flex flex-col -mt-1 sm:-mt-1.5">
          <span className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#FFDE59] leading-tight">
            // MULTIPLAYER: 1V1 ARENA
          </span>
          <h2 className="mt-0.5 text-lg sm:text-2xl font-black uppercase tracking-tight text-white leading-none">
            Practice With a Friend
          </h2>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-3.5 sm:gap-6 md:grid-cols-2 items-start">
        <CreateRoomCard
          mode={mode}
          setMode={setMode}
          deckType={deckType}
          setDeckType={setDeckType}
          grammarLevel={grammarLevel}
          setGrammarLevel={setGrammarLevel}
          selectedGroups={selectedGroups}
          handleGroupToggle={handleGroupToggle}
          onClearSelectedGroups={onClearSelectedGroups}
          isGroupMenuOpen={isGroupMenuOpen}
          setIsGroupMenuOpen={setIsGroupMenuOpen}
          onCreateRoom={onCreateRoom}
          isSocketReady={isSocketReady}
          kanjiGroups={kanjiGroups}
          vocabStages={vocabStages}
        />

        <JoinRoomCard
          joinCode={joinCode}
          setJoinCode={setJoinCode}
          joinCodeInputRef={joinCodeInputRef}
          onJoinRoom={onJoinRoom}
          isSocketReady={isSocketReady}
        />
      </div>
    </div>
  );
}