import { useState, type ComponentType, type Dispatch, type FormEvent, type ReactNode, type RefObject, type SetStateAction } from 'react';
import type { ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronDownIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import type { Deck, KanjiGroup, RoomSelectionId, VocabStage, MatchMode } from '../../types';
import RoomSetupCard from './RoomSetupCard';

type LegacyProps = { children?: ReactNode;[key: string]: unknown };

const LegacyInput = Input as unknown as ComponentType<LegacyProps>;

type CreateRoomCardProps = {
  mode: MatchMode;
  onModeChange: (mode: MatchMode) => void;
  deckType: Deck;
  onDeckTypeChange: (deckType: Deck) => void;
  grammarLevel: number;
  onGrammarLevelChange: (level: number) => void;
  selectedGroups: RoomSelectionId[];
  onGroupToggle: (groupId: RoomSelectionId) => void;
  onClearSelectedGroups: () => void;
  isGroupMenuOpen: boolean;
  onGroupMenuOpenChange: (isOpen: boolean) => void;
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
  onModeChange,
  deckType,
  onDeckTypeChange,
  grammarLevel,
  onGrammarLevelChange,
  selectedGroups,
  onGroupToggle,
  onClearSelectedGroups,
  isGroupMenuOpen,
  onGroupMenuOpenChange,
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
    <RoomSetupCard
      variant="host"
      menuOpen={isAnyMenuOpen}
      badgeLabel="HOST"
      metaLabel="[NEW SESSION]"
      title="Create a Room"
      description="Configure a duel format, pick a curriculum, and challenge a study partner."
      watermark="創"
      submitTone={isGauntlet ? 'gauntlet' : 'host'}
      submitLabel={
        isSocketReady
          ? isGauntlet
            ? 'Launch Gauntlet Lobby →'
            : 'Create Room →'
          : 'Connecting...'
      }
      onSubmit={onCreateRoom}
      submitDisabled={!isSocketReady}
    >
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
                onClick={() => onModeChange('standard')}
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
                  onModeChange('gauntlet');
                  if (deckType === 'vocab' || deckType === 'grammar') {
                    onDeckTypeChange('kana');
                    onClearSelectedGroups(); // Prevent carry-over when forcing Kana
                  }
                  onGroupMenuOpenChange(false);
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
                    onDeckTypeChange(type as Deck);
                    onGroupMenuOpenChange(false);
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
                          onGrammarLevelChange(lvl);
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
                onClick={() => onGroupMenuOpenChange(!isGroupMenuOpen)}
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
                    onClick={() => onGroupMenuOpenChange(false)}
                  />
                  <div className="absolute top-full left-0 z-50 mt-1 max-h-56 w-full overflow-y-auto border-2 border-black bg-[#151922] p-1 shadow-[5px_5px_0px_0px_#000] [scrollbar-width:thin] [scrollbar-color:#323b4e_#151922]">
                    <button
                      type="button"
                      onClick={() => {
                        onClearSelectedGroups();
                          onGroupMenuOpenChange(false);
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
                          onClick={() => onGroupToggle(item.id)}
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
    </RoomSetupCard>
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
    <RoomSetupCard
      variant="client"
      badgeLabel="CLIENT"
      metaLabel="[ENTER CODE]"
      title="Join a Room"
      description="Enter the 6-character room code shared by your friend to join."
      watermark="入"
      submitTone="client"
      submitLabel="Join Room →"
      onSubmit={onJoinRoom}
      submitDisabled={!isSocketReady || !joinCode.trim()}
    >
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
    </RoomSetupCard>
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
  onModeChange,
  deckType,
  onDeckTypeChange,
  grammarLevel,
  onGrammarLevelChange,
  selectedGroups,
  onGroupToggle,
  onClearSelectedGroups,
  isGroupMenuOpen,
  onGroupMenuOpenChange,
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
          onModeChange={onModeChange}
          deckType={deckType}
          onDeckTypeChange={onDeckTypeChange}
          grammarLevel={grammarLevel}
          onGrammarLevelChange={onGrammarLevelChange}
          selectedGroups={selectedGroups}
          onGroupToggle={onGroupToggle}
          onClearSelectedGroups={onClearSelectedGroups}
          isGroupMenuOpen={isGroupMenuOpen}
          onGroupMenuOpenChange={onGroupMenuOpenChange}
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