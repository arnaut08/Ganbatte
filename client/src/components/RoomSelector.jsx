import { useEffect, useRef, useState } from 'react';
import { getRoom } from '../services/api';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from '@radix-ui/react-icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

function RoomSelector({ onCreateRoom, onJoinRoom, onOpenKanjiStudy, prefillRoomCode = '', isSocketReady = false }) {
  const [joinCode, setJoinCode] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [screen, setScreen] = useState(prefillRoomCode ? 'assessment' : 'home');
  const joinCodeInputRef = useRef(null);
  const hasInviteCode = Boolean(prefillRoomCode);

  useEffect(() => {
    if (prefillRoomCode) {
      setJoinCode(prefillRoomCode);
      joinCodeInputRef.current?.focus();
    }
  }, [prefillRoomCode]);

  useEffect(() => {
    if (!hasInviteCode) {
      setOwnerName('');
      return;
    }

    let cancelled = false;
    getRoom(prefillRoomCode)
      .then((room) => {
        if (cancelled) return;
        const owner = room?.players?.[0]?.name?.trim?.();
        setOwnerName(owner || '');
      })
      .catch(() => {
        if (!cancelled) setOwnerName('');
      });

    return () => {
      cancelled = true;
    };
  }, [hasInviteCode, prefillRoomCode]);

  useEffect(() => {
    if (prefillRoomCode) setScreen('assessment');
  }, [prefillRoomCode]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (isSocketReady) {
      onCreateRoom();
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const targetCode = (hasInviteCode ? prefillRoomCode : joinCode).trim();
    if (isSocketReady && targetCode) {
      onJoinRoom(targetCode.toUpperCase());
      if (!hasInviteCode) setJoinCode('');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {hasInviteCode ? (
          <Card className="border-border max-w-md">
            <CardHeader>
              <CardTitle>Join a Room</CardTitle>
              <CardDescription>
                {ownerName
                  ? `Invited to ${ownerName}'s room. Enter your name to join directly.`
                  : 'Invited to a room. Enter your name to join directly.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isSocketReady && (
                <p className="text-sm text-muted-foreground">
                  Connecting to the game server...
                </p>
              )}
              <form onSubmit={handleJoin} className="space-y-4">
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  disabled={!isSocketReady}
                >
                  Join Room
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : screen === 'home' ? (
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

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle>Create a Room</CardTitle>
                  <CardDescription>Start a new assessment session</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!isSocketReady}
                    >
                      Create Room
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="relative">

                <Card className="border-border h-full">
                  <CardHeader>
                    <CardTitle>Join a Room</CardTitle>
                    <CardDescription>
                      Enter the room code your friend shared
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!isSocketReady && (
                      <p className="text-sm text-muted-foreground">
                        Connecting to the game server...
                      </p>
                    )}
                    <form onSubmit={handleJoin} className="space-y-4">
                      <Input
                        ref={joinCodeInputRef}
                        type="text"
                        placeholder="Room Code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                      />
                      <Button
                        type="submit"
                        variant="secondary"
                        className="w-full"
                        disabled={!isSocketReady || !joinCode.trim()}
                      >
                        Join Room
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomSelector;
