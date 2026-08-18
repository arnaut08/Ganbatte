import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CopyIcon, CheckIcon, PersonIcon, ClockIcon } from '@radix-ui/react-icons';
import { Separator } from '@/components/ui/separator';

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
  isPreparingAssessment = false,
}) {
  const isReady = room.players.length === 2 && room.players.every((player) => player.connected !== false);
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
    <div className="flex min-h-[calc(100vh-64px-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-3xl border-border">
        <CardHeader>
          <div className="text-center">
            <CardTitle className="text-lg uppercase tracking-wider text-muted-foreground">
              Room Code
            </CardTitle>
            <div className="py-4">
              <code className="font-mono text-4xl font-bold tracking-[0.25em] text-primary">
                {roomCode}
              </code>
            </div>
          </div>
          {isHost && (
            <CardDescription className="text-center">
              Share this code with your friend
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {isHost && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Direct join link
              </p>
              <div className="flex items-center gap-2">
                <Input value={joinLink} readOnly className="font-mono text-sm" />
                <Button size="sm" variant="outline" onClick={handleCopyLink}>
                  {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Players ({room.players.length}/2)
              </h3>
              <Badge variant="secondary">
                <PersonIcon className="mr-1 h-3 w-3" />
                {room.players.length} joined
              </Badge>
            </div>
            <Separator />

            <div className="space-y-3">
              {room.players.map((player, idx) => {
                const isCurrentUser = player.userId && currentUserId && player.userId === currentUserId;
                const isAlreadyFriend = player.userId && friendIds.has(player.userId);
                const isRequestPending = player.userId && pendingRequestReceiverIds.has(String(player.userId));
                const canAddFriend = Boolean(currentUserId)
                  && Boolean(player.userId)
                  && !isCurrentUser
                  && !isAlreadyFriend
                  && !isRequestPending;

                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{player.name}
                        {isRequestPending ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label="Friend request pending"
                          title="Friend request pending"
                          disabled
                        >
                          <ClockIcon className="h-4 w-4" />
                        </Button>
                      ) : canAddFriend ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => onSendFriendRequest?.(player.userId)}
                          aria-label={`Send friend request to ${player.name}`}
                          title="Send friend request"
                        >
                          <PersonIcon className="h-4 w-4" />
                        </Button>
                      ) : null}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {idx === 0 ? 'Host' : 'Guest'}
                        {player.connected === false && ' (disconnected)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={player.connected === false ? 'destructive' : 'success'}>
                        {player.connected === false ? 'Offline' : 'Online'}
                      </Badge>
                    </div>
                  </div>
                );
              })}

              {room.players.length === 1 && (
                <div className="flex items-center gap-4 rounded-lg border border-dashed border-border p-3 opacity-60">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    ?
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Waiting...</p>
                    <p className="text-sm text-muted-foreground">
                      Waiting for opponent
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2 flex justify-around">
            <Button
              size="lg"
              onClick={onStartAssessment}
              disabled={!isReady || isPreparingAssessment || !isHost}
            >
              {isPreparingAssessment ? 'Preparing deck...' : !isHost ? 'Waiting for host' : isReady ? 'Start' : 'Waiting'}
            </Button>
            <Button size="lg" variant="secondary" onClick={onLeaveRoom}>
              Leave
            </Button>
          </div>

          <Card className="border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-sm">How it works:</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>The host shares the room code or invite link, then both players join</li>
                <li>Each round shows the same {isKanjiAssessment ? 'kanji' : room?.deckType === 'grammar' ? 'grammar question' : 'kana sentence'} to both players</li>
                <li>{isKanjiAssessment ? 'Read the kanji and type its romaji reading' : room?.deckType === 'grammar' ? 'Answer the grammar prompt, then press Ready when both you and your opponent are ready to move on' : 'Type the romaji reading for the kana sentence'} and submit (spacing is flexible for checking)</li>
                <li>For grammar rounds, each question must be answered and confirmed with Ready before the deck advances. The question only moves on once both players are ready.</li>
                <li>After both submissions, answers/translation are revealed and the next card starts automatically</li>
                <li>At the end, you get per-player accuracy stats and answer review</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

export default RoomLobby;
