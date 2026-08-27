import type { ComponentType, Dispatch, FormEvent, InputHTMLAttributes, ReactNode, RefObject, SetStateAction } from 'react';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import type { Deck, KanjiGroup } from '../../types';

type LegacyProps = { children?: ReactNode;[key: string]: unknown };

const LegacyButton = Button as unknown as ComponentType<LegacyProps>;
const LegacyCard = Card as unknown as ComponentType<LegacyProps>;
const LegacyInput = Input as unknown as ComponentType<LegacyProps>;
const LegacyDropdownMenu = DropdownMenu as unknown as ComponentType<LegacyProps>;
const LegacyDropdownContent = DropdownMenuContent as unknown as ComponentType<LegacyProps>;
const LegacyDropdownItem = DropdownMenuItem as unknown as ComponentType<LegacyProps>;
const LegacyDropdownTrigger = DropdownMenuTrigger as unknown as ComponentType<LegacyProps>;

type CreateRoomCardProps = {
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
}: CreateRoomCardProps) {
  return (
    <Card className="relative flex flex-col justify-between overflow-hidden border-2 border-black bg-[#FFDE59] p-3.5 sm:p-6 shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000]">
      {/* Watermark Kanji */}
      <span className="pointer-events-none absolute -bottom-3 -right-2 sm:-bottom-6 sm:-right-3 select-none font-mono text-[90px] sm:text-[130px] font-black leading-none text-black/[0.08]">
        創
      </span>

      <div className="relative z-10 space-y-3.5 sm:space-y-5">
        <div>
          <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
            <span className="border-2 border-black bg-black px-1.5 py-0.5 sm:px-2 text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-[#FFDE59] shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-none">
              HOST
            </span>
            <span className="font-mono text-[9px] sm:text-xs font-bold text-black/60">
              [NEW SESSION]
            </span>
          </div>
          <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-black">
            Create a Room
          </h3>
          <p className="mt-1 text-xs sm:text-sm font-bold text-black/80 leading-snug">
            Start a new multiplayer assessment and invite a study partner.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Select Deck Segment Control */}
          <div className="space-y-1 sm:space-y-1.5">
            <span className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-black">
              SELECT DECK
            </span>
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5 border-2 border-black bg-black/10 p-0.5 sm:p-1">
              {['kana', 'kanji', 'grammar'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDeckType(type as Deck)}
                  className={`py-1.5 sm:py-2 text-[11px] sm:text-xs font-black uppercase transition-all ${deckType === type
                      ? 'border-2 border-black bg-white text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]'
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
            <div className="space-y-1 sm:space-y-1.5">
              <label className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-black">
                LESSON LEVEL
              </label>

              <div className="relative">
                <select
                  value={grammarLevel}
                  onChange={(e) => setGrammarLevel(Number(e.target.value) || 1)}
                  className="flex h-9 sm:h-10 w-full appearance-none border-2 border-black bg-white px-3 pr-10 text-xs font-black uppercase tracking-wide text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] focus:outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((lvl) => (
                    <option key={lvl} value={lvl} className="bg-white text-black font-bold">
                      Lesson {lvl}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDownIcon className="h-4 w-4 stroke-[3] text-black" />
                </div>
              </div>
            </div>
          )}

          {/* Kanji Themes Selector */}
          {deckType === 'kanji' && (
            <div className="space-y-1 sm:space-y-1.5">
              <span className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-black">
                KANJI THEMES
              </span>
              <LegacyDropdownMenu open={isGroupMenuOpen} onOpenChange={setIsGroupMenuOpen}>
                <LegacyDropdownTrigger asChild>
                  <LegacyButton
                    variant="neutral"
                    className="flex h-9 sm:h-10 w-full items-center justify-between border-2 border-black bg-white px-3 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000]"
                  >
                    <span className="truncate">
                      {selectedGroups.length === 0 ? 'All Groups' : `${selectedGroups.length} Selected`}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 stroke-[3]" />
                  </LegacyButton>
                </LegacyDropdownTrigger>
                <LegacyDropdownContent className="w-56 border-2 border-black bg-white p-1 shadow-[4px_4px_0px_0px_#000000]" align="start">
                  <LegacyDropdownItem
                    onSelect={(e: { preventDefault: () => void }) => {
                      e.preventDefault();
                      onClearSelectedGroups();
                    }}
                    className={`cursor-pointer px-3 py-2 text-xs font-black uppercase hover:bg-[#FFDE59] ${selectedGroups.length === 0 ? 'bg-[#FFDE59]' : ''}`}
                  >
                    <span className="mr-2">{selectedGroups.length === 0 ? '✓' : ''}</span>
                    All Groups
                  </LegacyDropdownItem>
                  {kanjiGroups.map((group) => (
                    <LegacyDropdownItem
                      key={group.id}
                      onSelect={(e: { preventDefault: () => void }) => {
                        e.preventDefault();
                        handleGroupToggle(group.id);
                      }}
                      className={`cursor-pointer px-3 py-2 text-xs font-black uppercase hover:bg-[#FFDE59] ${selectedGroups.includes(group.id) ? 'bg-[#FFDE59]' : ''}`}
                    >
                      <span className="mr-2">{selectedGroups.includes(group.id) ? '✓' : ''}</span>
                      {group.name}
                    </LegacyDropdownItem>
                  ))}
                </LegacyDropdownContent>
              </LegacyDropdownMenu>

              {selectedGroups.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-1">
                  {selectedGroups.map((groupId) => (
                    <span
                      key={groupId}
                      className="inline-flex items-center gap-1 border-2 border-black bg-black px-1.5 py-0.5 text-[10px] sm:text-xs font-black uppercase text-[#FFDE59]"
                    >
                      {kanjiGroups.find((g) => g.id === groupId)?.name || groupId}
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
          className="w-full border-2 border-black bg-white py-2.5 sm:py-5 text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
        >
          {isSocketReady ? 'Create Room →' : 'Connecting...'}
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
    <Card className="relative flex flex-col justify-between overflow-hidden border-2 border-black bg-[#A3E636] p-3.5 sm:p-6 shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000]">
      {/* Watermark Kanji */}
      <span className="pointer-events-none absolute -bottom-3 -right-2 sm:-bottom-6 sm:-right-3 select-none font-mono text-[90px] sm:text-[130px] font-black leading-none text-black/[0.08]">
        入
      </span>

      <div className="relative z-10 space-y-3.5 sm:space-y-5">
        <div>
          <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
            <span className="border-2 border-black bg-black px-1.5 py-0.5 sm:px-2 text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-[#A3E636] shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-none">
              CLIENT
            </span>
            <span className="font-mono text-[9px] sm:text-xs font-bold text-black/60">
              [ENTER CODE]
            </span>
          </div>
          <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-black">
            Join a Room
          </h3>
          <p className="mt-1 text-xs sm:text-sm font-bold text-black/80 leading-snug">
            Enter the 6-character room code shared by your friend to join.
          </p>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          <div className="space-y-1 sm:space-y-1.5">
            <label className="font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-black">
              ROOM ACCESS CODE
            </label>
            <LegacyInput
              ref={joinCodeInputRef}
              type="text"
              placeholder="e.g. S3OPPP"
              value={joinCode}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setJoinCode(e.target.value)}
              className="h-10 sm:h-12 border-2 border-black bg-white px-3 sm:px-4 font-mono text-base sm:text-lg font-black uppercase tracking-widest text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] placeholder:text-neutral-400 placeholder:normal-case placeholder:font-sans placeholder:text-xs sm:placeholder:text-sm"
            />
          </div>
        </div>
      </div>

      <form onSubmit={onJoinRoom} className="relative z-10 mt-4 sm:mt-6">
        <LegacyButton
          type="submit"
          disabled={!isSocketReady || !joinCode.trim()}
          className="w-full border-2 border-black bg-white py-2.5 sm:py-5 text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
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
}: PracticeScreenProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <button
          onClick={onBackToHome}
          className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          title="Back to home"
        >
          <span className="font-mono text-base sm:text-lg font-black">&lt;</span>
        </button>

        <div className="flex flex-col justify-center">
          <span className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
        // MULTIPLAYER: 1V1 ARENA
          </span>
          <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
            Practice With a Friend
          </h2>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-3.5 sm:gap-6 md:grid-cols-2 items-start">
        <CreateRoomCard
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
