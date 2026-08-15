import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from '@radix-ui/react-icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function RoomSelector({
  onCreateRoom,
  onJoinRoom,
  onOpenKanjiStudy,
  onReturnToRoom,
  onDeclineRoomResume,
  prefillRoomCode = '',
  isSocketReady = false,
  canReturnToRoom = false,
  roomCode = '',
  resumeUsername = '',
}) {
  const [joinCode, setJoinCode] = useState(roomCode || '');
  const [screen, setScreen] = useState('home');
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

  const handleCreate = (e) => {
    e.preventDefault();
    if (isSocketReady) {
      onCreateRoom();
    }
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
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-primary/30 bg-gradient-to-r from-blue-950/50 to-blue-900/30">
                <CardHeader>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    Build your foundation
                  </p>
                  <CardTitle>Learning</CardTitle>
                  <CardDescription>
                    Study essential Japanese characters at your own pace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button onClick={() => setScreen('learning')}>
                    Explore learning
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-secondary/30">
                <CardHeader>
                  <p className="text-xs font-bold uppercase tracking-wider text-secondary-foreground/70">
                    Put it into practice
                  </p>
                  <CardTitle>Assessment</CardTitle>
                  <CardDescription>
                    Assess yourself with a friend.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button variant="secondary" onClick={() => setScreen('assessment')}>
                    Start an assessment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : screen === 'learning' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setScreen('home')}
                className="h-9 w-9 rounded-full"
                aria-label="Back to home"
                title="Back to home"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Learning
                </p>
                <h2 className="text-xl font-bold">Study Japanese characters</h2>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border max-w-2xl">
              <CardHeader>
                <CardTitle>Kana</CardTitle>
                <CardDescription>
                  Learn the two Japanese syllabaries: Hiragana and Katakana.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button disabled>
                  Coming soon...
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border max-w-2xl">
              <CardHeader>
                <CardTitle>N5 Kanji</CardTitle>
                <CardDescription>
                  Review essential N5 Kanji grouped by everyday themes.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button onClick={onOpenKanjiStudy}>Study</Button>
              </CardContent>
            </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setScreen('home')}
                className="h-9 w-9 rounded-full"
                aria-label="Back to home"
                title="Back to home"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Assessment
                </p>
                <h2 className="text-xl font-bold">Practice with a friend</h2>
              </div>
            </div>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Assessment</CardTitle>
                <CardDescription>
                  Start a new room or join one with a code.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex h-full flex-col justify-between rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Create a Room</h3>
                      <p className="text-sm text-muted-foreground">
                        Start a new assessment session and invite a friend.
                      </p>
                    </div>
                    <form onSubmit={handleCreate} className="mt-4">
                      <Button type="submit" className="h-10" disabled={!isSocketReady}>
                        Create Room
                      </Button>
                    </form>
                  </div>

                  <div className="flex h-full flex-col justify-between rounded-lg border border-border bg-muted/20 p-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Join a Room</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter the room code your friend shared.
                      </p>
                    </div>

                    {!isSocketReady && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Connecting to the game server...
                      </p>
                    )}

                    <form onSubmit={handleJoin} className="mt-4 flex gap-3">
                      <Input
                        ref={joinCodeInputRef}
                        type="text"
                        placeholder="Room Code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="h-10 uppercase"
                      />
                      <Button
                        type="submit"
                        variant="secondary"
                        className="h-10"
                        disabled={!isSocketReady || !joinCode.trim()}
                      >
                        Join Room
                      </Button>
                    </form>

                    {canReturnToRoom && !joinCode.trim() && (
                      <div className="mt-3 text-right text-xs text-muted-foreground">
                        Last room: {roomCode || 'Not available'}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomSelector;
