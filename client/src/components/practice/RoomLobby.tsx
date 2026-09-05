import { useState, type ComponentType, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CopyIcon, CheckIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import { canStartAssessment, getPlayerPresenceStatus } from '../../utils/roomStatus';
import { getDeckAccent } from '../../utils/deck-theme';
import type { Friend, Room } from '../../types';
import { getSessionKey } from '../../utils/roomSession';
import GlobalPageHeader from '@/components/common/GlobalPageHeader';

type RoomLobbyProps = {
  roomCode: string;
  room: Room;
  onStartAssessment: () => void;
  onOpenGauntlet?: () => void;
  onLeaveRoom: () => void;
  currentSocketId?: string;
  currentUserId?: string | null;
  isPreparingAssessment?: boolean;
  friends?: Friend[];
  onInviteFriend?: (userId: string) => void;
};

type LegacyProps = {
  children?: ReactNode;
  [key: string]: unknown;
};

const LegacyButton = Button as unknown as ComponentType<LegacyProps>;
const LegacyInput = Input as unknown as ComponentType<LegacyProps>;

export default function RoomLobby({
  roomCode,
  room,
  onStartAssessment,
  onOpenGauntlet,
  onLeaveRoom,
  currentSocketId,
  currentUserId,
  isPreparingAssessment = false,
  friends = [],
  onInviteFriend,
}: RoomLobbyProps) {
  const isReady = canStartAssessment(room?.players || []);
  const [copied, setCopied] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const joinLink = `${window.location.origin}?room=${encodeURIComponent(roomCode || '')}`;
  const sessionKey = getSessionKey();
  const hostPlayer = room?.players?.[0];
  const isHost =
    hostPlayer?.id === currentSocketId ||
    (currentUserId && hostPlayer?.userId === currentUserId) ||
    hostPlayer?.sessionKey === sessionKey;

  const isGauntlet = room?.mode === 'gauntlet';
  const isKanji = room?.deckType === 'kanji';
  const isVocab = room?.deckType === 'vocab';
  const isGrammar = room?.deckType === 'grammar';

  // Gauntlet highlights with high-visibility red; standard uses deck accents
  const themeAccent = isGauntlet ? '#FF6B6B' : getDeckAccent(room?.deckType);
  const themeLabel = isGauntlet
    ? <><LightningBoltIcon className="inline-block h-3 w-3" aria-hidden="true" /> ARCADE // SURVIVAL GAUNTLET</>
    : isKanji
      ? '02 // KANJI 1v1'
      : isVocab
        ? '03 // VOCAB 1v1'
        : isGrammar
          ? '04 // GRAMMAR 1v1'
          : '01 // KANA 1v1';

  const onlineFriends = friends.filter((friend) => friend.online && (friend.user_id || friend.id));
  const isRoomFull = (room?.players?.length || 0) >= 2;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op
    }
  };

  const handlePrimaryLaunch = () => {
    if (isGauntlet && onOpenGauntlet) {
      onOpenGauntlet();
    } else {
      onStartAssessment();
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <GlobalPageHeader
          onBack={onLeaveRoom}
          punchline={typeof themeLabel === 'string' ? themeLabel : 'ARCADE // SURVIVAL GAUNTLET'}
          title="Match Setup"
          accentClass={isGauntlet ? 'text-[#FF6B6B]' : isKanji ? 'text-[#70CFF8]' : isVocab ? 'text-[#A3E636]' : isGrammar ? 'text-[#C084FC]' : 'text-[#FFDE59]'}
        />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-12 lg:items-start">
        {/* LEFT COLUMN: Access Code & Invite Controls */}
        <div className="space-y-4 sm:space-y-5 lg:col-span-7">
          {/* Room Code Panel */}
          <div
            style={{ borderLeftColor: themeAccent }}
            className="flex flex-col items-center justify-center border-2 border-black border-l-8 bg-[#1f2637] p-5 text-center text-white shadow-[4px_4px_0px_0px_#000] sm:p-7 sm:shadow-[6px_6px_0px_0px_#000]"
          >
            <span
              className="font-mono text-[9px] font-black uppercase tracking-widest sm:text-xs"
              style={{ color: themeAccent }}
            >
              ROOM ACCESS CODE
            </span>
            <div className="my-2.5 border-2 border-black bg-[#151922] px-5 py-2 shadow-[3px_3px_0px_0px_#000] sm:my-3 sm:px-8 sm:py-3">
              <span className="font-mono text-3xl font-black tracking-[0.15em] text-white sm:text-5xl sm:tracking-[0.2em]">
                {roomCode}
              </span>
            </div>
            {isHost && !isRoomFull && (
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-300 sm:text-xs">
                Share this code to invite your opponent
              </p>
            )}
            {isRoomFull && (
              <p className="font-mono text-[10px] font-black uppercase tracking-wider sm:text-xs" style={{ color: themeAccent }}>
                // SQUAD ASSEMBLED - READY FOR LAUNCH
              </p>
            )}
          </div>

          {/* Conditional Invitation Controls */}
          {!isRoomFull ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Direct Link Bar */}
              <div className="border-2 border-black bg-[#1f2637] p-3.5 shadow-[3px_3px_0px_0px_#000] sm:p-4">
                <label
                  className="font-mono text-[9px] font-black uppercase tracking-wider sm:text-[10px]"
                  style={{ color: themeAccent }}
                >
                  // DIRECT INVITE LINK
                </label>
                <div className="mt-1.5 flex gap-2 sm:gap-2.5">
                  <LegacyInput
                    value={joinLink}
                    readOnly
                    className="h-9 flex-1 border-2 border-black bg-[#151922] px-3 font-mono text-[10px] font-bold text-white shadow-none focus-visible:ring-0 sm:h-10 sm:text-xs"
                  />
                  <LegacyButton
                    onClick={handleCopyLink}
                    className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 border-2 border-black bg-white px-3 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-10 sm:px-4 sm:text-xs"
                    style={{ backgroundColor: copied ? themeAccent : '#FFFFFF' }}
                  >
                    {copied ? <CheckIcon className="h-4 w-4 text-black" /> : <CopyIcon className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </LegacyButton>
                </div>
              </div>

              {/* Online Friends Picker */}
              <div className="border-2 border-black bg-[#1f2637] p-3.5 shadow-[3px_3px_0px_0px_#000] sm:p-4">
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="flex flex-col gap-0.5 sm:gap-1">
                    <span
                      className="font-mono text-[9px] font-black uppercase tracking-wider sm:text-[10px]"
                      style={{ color: themeAccent }}
                    >
                      // ONLINE FRIENDS
                    </span>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span
                        className="h-2 w-2 border border-black sm:h-2.5 sm:w-2.5"
                        style={{ backgroundColor: onlineFriends.length > 0 ? themeAccent : '#6b7280' }}
                      />
                      <span className="font-mono text-xs font-bold text-white sm:text-sm">
                        {onlineFriends.length > 0
                          ? `${onlineFriends.length} friend${onlineFriends.length > 1 ? 's' : ''} available`
                          : 'No friends online'}
                      </span>
                    </div>
                  </div>

                  <LegacyButton
                    size="sm"
                    onClick={() => setIsInviteOpen((prev) => !prev)}
                    disabled={onlineFriends.length === 0}
                    className="h-8 shrink-0 cursor-pointer border-2 border-black bg-white px-3 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:bg-[#151922] disabled:text-neutral-500 disabled:shadow-none sm:h-9 sm:px-3.5 sm:text-xs"
                  >
                    {isInviteOpen ? 'Close' : `Invite (${onlineFriends.length})`}
                  </LegacyButton>
                </div>

                {isInviteOpen && onlineFriends.length > 0 && (
                  <div className="mt-3 border-t-2 border-white/10 pt-3">
                    <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                      {onlineFriends.map((friend) => (
                        <div
                          key={friend.user_id || friend.id}
                          className="flex items-center justify-between gap-2 border-2 border-black bg-[#151922] p-2.5 shadow-[1.5px_1.5px_0px_0px_#000]"
                        >
                          <span className="truncate font-mono text-xs font-black uppercase text-white">
                            {friend.display_name || 'Friend'}
                          </span>
                          <LegacyButton
                            size="sm"
                            onClick={() => {
                              const friendId = friend.user_id ?? friend.id;
                              if (friendId) {
                                onInviteFriend?.(friendId);
                                setIsInviteOpen(false);
                              }
                            }}
                            style={{ backgroundColor: themeAccent }}
                            className="h-7 shrink-0 cursor-pointer border-2 border-black px-2.5 font-mono text-[10px] font-black uppercase text-black shadow-[1px_1px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
                          >
                            Invite
                          </LegacyButton>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border-2 border-black bg-[#1f2637] p-5 text-center shadow-[3px_3px_0px_0px_#000] sm:p-6 space-y-2">
              <span className="font-mono text-[10px] font-black uppercase tracking-widest" style={{ color: themeAccent }}>
                // SQUAD ASSEMBLED
              </span>
              <p className="font-mono text-xs text-neutral-300 leading-relaxed">
                Both combatants are ready. The host can now launch the session.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Player Roster & Primary Actions */}
        <div className="space-y-4 sm:space-y-5 lg:col-span-5">
          <div className="border-2 border-black bg-[#1f2637] p-4 text-white shadow-[4px_4px_0px_0px_#000] sm:p-6 sm:shadow-[6px_6px_0px_0px_#000]">
            <div className="mb-3 flex items-center justify-between border-b-2 border-white/10 pb-2.5 sm:mb-4 sm:pb-3">
              <h3 className="font-mono text-xs font-black uppercase tracking-wider text-white sm:text-sm">
                PLAYERS
              </h3>
              <span className="border-2 border-black bg-white px-2 py-0.5 font-mono text-[9px] font-black uppercase text-black shadow-[1px_1px_0px_0px_#000] sm:text-[10px]">
                {room?.players?.length || 0}/2 CONNECTED
              </span>
            </div>

            <div className="space-y-2.5">
              {(room?.players || []).map((player, idx) => {
                const isCurrentUser = player.userId && currentUserId && player.userId === currentUserId;
                const presence = getPlayerPresenceStatus(player as never);

                return (
                  <div
                    key={player.id || idx}
                    className="flex items-center gap-2.5 border-2 border-black bg-[#151922] p-2.5 shadow-[2px_2px_0px_0px_#000] sm:gap-3 sm:p-3"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black font-mono text-xs font-black text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:h-9 sm:w-9 ${idx === 0 ? 'bg-[#FFDE59]' : 'bg-[#70CFF8]'
                        }`}
                    >
                      P{idx + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-mono text-xs font-bold text-white sm:text-sm">{player.name}</p>
                        {isCurrentUser && (
                          <span
                            className="shrink-0 font-mono text-[9px] font-black uppercase"
                            style={{ color: themeAccent }}
                          >
                            (YOU)
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[9px] font-black uppercase text-neutral-400 sm:text-[10px]">
                        {idx === 0 ? 'HOST' : 'GUEST'}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center">
                      <span
                        className={`border-2 border-black px-1.5 py-0.5 font-mono text-[8px] font-black uppercase text-black shadow-[1px_1px_0px_0px_#000] sm:text-[9px] ${presence === 'disconnected'
                            ? 'bg-[#FF6B6B]'
                            : presence === 'away'
                              ? 'bg-[#FFDE59]'
                              : 'bg-white'
                          }`}
                      >
                        {presence === 'disconnected'
                          ? 'Offline'
                          : presence === 'away'
                            ? 'Away'
                            : presence === 'ready'
                              ? 'Ready'
                              : 'In Lobby'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {(room?.players?.length || 0) === 1 && (
                <div className="flex items-center gap-2.5 border-2 border-dashed border-white/20 bg-[#151922]/50 p-2.5 sm:gap-3 sm:p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-dashed border-white/20 font-mono text-xs font-black text-neutral-500 sm:h-9 sm:w-9">
                    ?
                  </div>
                  <div>
                    <p className="font-mono text-xs font-bold text-neutral-400">Waiting for opponent...</p>
                    <p className="font-mono text-[9px] font-black uppercase text-neutral-500">Slot Available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
              <LegacyButton
                size="lg"
                onClick={onLeaveRoom}
                className="h-10 cursor-pointer border-2 border-black bg-white font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#FF6B6B] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:text-xs"
              >
                Leave
              </LegacyButton>

              <LegacyButton
                size="lg"
                onClick={handlePrimaryLaunch}
                disabled={!isReady || isPreparingAssessment || !isHost}
                style={isReady && !isPreparingAssessment && isHost ? { backgroundColor: themeAccent } : undefined}
                className={`h-10 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none whitespace-nowrap leading-none sm:h-11 ${!isReady || isPreparingAssessment || !isHost
                    ? 'cursor-not-allowed bg-[#151922] text-neutral-500 opacity-60 shadow-none'
                    : 'cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000]'
                  }`}
              >
                {isPreparingAssessment
                  ? 'Preparing...'
                  : !isHost
                    ? 'Wait for Host'
                    : isReady
                      ? isGauntlet
                        ? <span className="flex items-center justify-center gap-1">Start Gauntlet <LightningBoltIcon className="h-3 w-3" aria-hidden="true" /></span>
                        : 'Start Match →'
                      : 'Waiting...'}
              </LegacyButton>
            </div>
          </div>

          {/* Dynamic Rulebook */}
          <div className="border-2 border-black bg-[#1f2637] p-4 text-white shadow-[3px_3px_0px_0px_#000] sm:p-5 sm:shadow-[4px_4px_0px_0px_#000]">
            <h3
              className="mb-2 font-mono text-[10px] font-black uppercase tracking-widest sm:text-xs"
              style={{ color: themeAccent }}
            >
              // {isGauntlet ? 'GAUNTLET RULES' : 'HOW TO PLAY'}
            </h3>
            <ul className="space-y-2 font-mono text-[11px] font-medium leading-snug text-neutral-300 sm:text-xs">
              {isGauntlet ? (
                <>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-[#FF6B6B]" />
                    <span>Tiles drop down identical matrix tracks on both devices simultaneously.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-[#FF6B6B]" />
                    <span>Type the correct Romaji reading before a tile hits the red danger line.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-[#FF6B6B]" />
                    <span>3 strikes ends your run. Every 5-streak triggers a speed surge on your opponent.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-[#FF6B6B]" />
                    <span>Last player surviving in the arena wins.</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0" style={{ backgroundColor: themeAccent }} />
                    <span>The host shares the room code or direct link with their opponent.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0" style={{ backgroundColor: themeAccent }} />
                    <span>
                      Each round displays the identical{' '}
                      <strong className="text-white">
                        {isKanji ? 'Kanji prompt' : isVocab ? 'Vocabulary prompt' : isGrammar ? 'Grammar question' : 'Kana sentence'}
                      </strong>{' '}
                      simultaneously.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0" style={{ backgroundColor: themeAccent }} />
                    <span>
                      {isKanji
                        ? 'Submit the accurate reading or meaning.'
                        : isGrammar
                          ? 'Select the structure, then lock in your answer.'
                          : 'Input the accurate romaji reading and submit.'}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0" style={{ backgroundColor: themeAccent }} />
                    <span>Final accuracy metrics and head-to-head standings are revealed at match end.</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}