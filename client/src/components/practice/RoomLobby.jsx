import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  CopyIcon,
  CheckIcon,
  PersonIcon,
  ClockIcon,
  Cross2Icon,
  PlusIcon,
} from '@radix-ui/react-icons';
import { Separator } from '@/components/ui/separator';
import { canStartAssessment, getPlayerPresenceStatus } from '../../utils/roomStatus';

function RoomLobby({
  roomCode,
  room,
  onStartAssessment,
  onLeaveRoom,
  currentSocketId,
  currentUserId,
  friends = [],
  friendRequests = [],
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  isPreparingAssessment = false,
}) {
  const isReady = canStartAssessment(room.players);
  const [copied, setCopied] = useState(false);
  const joinLink = `${window.location.origin}?room=${encodeURIComponent(roomCode || '')}`;
  const isHost = room.players[0]?.id === currentSocketId;
  const isKanjiAssessment = room?.deckType === 'kanji';
  const friendIds = new Set((friends || []).map((friend) => friend.user_id || friend.id));
  const pendingRequestReceiverIds = new Set(
    (friendRequests || [])
      .filter((request) => request?.direction === 'outgoing')
      .map((request) => request?.receiver_id ?? request?.receiver?.id)
      .filter(Boolean)
      .map(String),
  );
  const incomingRequestSenderIds = new Set(
    (friendRequests || [])
      .filter((request) => request?.direction === 'incoming')
      .map((request) => request?.sender_id ?? request?.sender?.id)
      .filter(Boolean)
      .map(String),
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op: clipboard API may be unavailable in some environments
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      {/* 1. Screen Header Lockup */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onLeaveRoom}
          className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          title="Leave room"
        >
          <span className="font-mono text-lg font-black">&lt;</span>
        </button>
        <div className="flex flex-col justify-center">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
        // LOBBY: MULTIPLAYER
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
            Match Setup
          </h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* LEFT COLUMN: Controls & Players */}
        <div className="space-y-6 lg:col-span-7">

          {/* Room Code Hero Panel */}
          <div className="flex flex-col items-center justify-center border-2 border-black bg-[#FFDE59] p-6 shadow-[6px_6px_0px_0px_#000000] sm:p-8">
            <p className="font-mono text-xs font-black uppercase tracking-widest text-black/70">
              ROOM ACCESS CODE
            </p>
            <div className="mt-2 bg-black px-6 py-3 shadow-[4px_4px_0px_0px_#ffffff]">
              <span className="font-mono text-4xl font-black tracking-[0.2em] text-[#FFDE59] sm:text-5xl">
                {roomCode}
              </span>
            </div>
            {isHost && (
              <p className="mt-4 text-sm font-bold text-black/80">
                Share this code to invite your opponent.
              </p>
            )}
          </div>

          {/* Direct Link Bar (Host Only) */}
          {isHost && room.players.length < 2 && (
            <div className="flex flex-col gap-2 border-2 border-black bg-[#1a1f2c] p-4 shadow-[4px_4px_0px_0px_#000000]">
              <label className="font-mono text-[10px] font-black uppercase tracking-wider text-[#70CFF8]">
            // DIRECT INVITE LINK
              </label>
              <div className="flex gap-2">
                <Input
                  value={joinLink}
                  readOnly
                  className="h-10 flex-1 border-2 border-black bg-[#252c3d] px-3 font-mono text-sm font-bold text-white shadow-none focus-visible:ring-0"
                />
                <Button
                  onClick={handleCopyLink}
                  className="flex h-10 items-center gap-2 border-2 border-black bg-white px-4 font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          {/* Players List Panel */}
          <div className="border-2 border-black bg-[#1a1f2c] p-5 shadow-[4px_4px_0px_0px_#000000] sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b-2 border-black/40 pb-3">
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                Players
              </h3>
              <span className="border-2 border-black bg-[#A3E636] px-2 py-0.5 font-mono text-xs font-black text-black">
                {room.players.length}/2 CONNECTED
              </span>
            </div>

            <div className="space-y-3">
              {room.players.map((player, idx) => {
                const isCurrentUser = player.userId && currentUserId && player.userId === currentUserId;
                // ... keep your existing boolean logic variables here ...

                return (
                  <div key={player.id} className="flex items-center gap-3 border-2 border-black bg-[#252c3d] p-3 shadow-[3px_3px_0px_0px_#000000]">
                    {/* Player Number */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black font-black text-black shadow-[2px_2px_0px_0px_#000000] ${idx === 0 ? 'bg-[#FFDE59]' : 'bg-[#70CFF8]'}`}>
                      P{idx + 1}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-bold text-white">{player.name}</p>
                        {isCurrentUser && (
                          <span className="shrink-0 font-mono text-[10px] font-bold text-[#A3E636]">(YOU)</span>
                        )}
                      </div>
                      <p className="font-mono text-[10px] font-black uppercase text-neutral-400">
                        {idx === 0 ? 'HOST' : 'GUEST'}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`border-2 border-black px-2 py-0.5 font-mono text-[10px] font-black uppercase text-black ${getPlayerPresenceStatus(player) === 'disconnected' ? 'bg-[#FF6B6B]' : getPlayerPresenceStatus(player) === 'away' ? 'bg-neutral-400' : 'bg-[#A3E636]'}`}>
                        {getPlayerPresenceStatus(player) === 'disconnected' ? 'Offline' : getPlayerPresenceStatus(player) === 'away' ? 'Away' : getPlayerPresenceStatus(player) === 'ready' ? 'Ready' : 'In Lobby'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Empty Slot */}
              {room.players.length === 1 && (
                <div className="flex items-center gap-3 border-2 border-dashed border-neutral-600 bg-transparent p-3 opacity-60">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-dashed border-neutral-600 font-mono text-lg font-black text-neutral-500">
                    ?
                  </div>
                  <div>
                    <p className="font-bold text-neutral-400">Waiting for opponent...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3 pt-2">
              <Button
                size="lg"
                variant="secondary"
                onClick={onLeaveRoom}
                className="border-2 border-black bg-[#FF6B6B] text-black hover:bg-[#ff8585] shadow-[3px_3px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase"
              >
                Leave
              </Button>
              <Button
                size="lg"
                onClick={onStartAssessment}
                disabled={!isReady || isPreparingAssessment || !isHost}
                className={`border-2 border-black font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${!isReady || isPreparingAssessment || !isHost ? 'bg-neutral-500 opacity-70 cursor-not-allowed shadow-none' : 'bg-[#A3E636] hover:bg-[#b5eb5b]'}`}
              >
                {isPreparingAssessment ? 'Preparing...' : !isHost ? 'Wait for host' : isReady ? 'Start Match' : 'Waiting...'}
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Rulebook */}
        <div className="lg:col-span-5">
          <div className="border-2 border-black bg-[#A3E636] p-6 shadow-[6px_6px_0px_0px_#000000]">
            <h3 className="mb-4 font-mono text-[11px] font-black uppercase tracking-widest text-black">
          // HOW TO PLAY
            </h3>
            <ul className="space-y-3 font-semibold text-black">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-black" />
                <span>The host shares the room code or invite link, then both players join.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-black" />
                <span>Each round shows the same {isKanjiAssessment ? 'kanji' : room?.deckType === 'grammar' ? 'grammar question' : 'kana sentence'} to both players.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-black" />
                <span>{isKanjiAssessment ? 'Read the kanji and type its romaji reading' : room?.deckType === 'grammar' ? 'Answer the grammar prompt, then press Ready' : 'Type the romaji reading for the kana sentence'} and submit. Spacing is flexible.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-black" />
                <span>After both submissions, answers are revealed and the next card starts automatically.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 bg-black" />
                <span>At the end, you get per-player accuracy stats and an answer review.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomLobby;