import { useEffect, useRef, useState } from 'react';
import { getRoom } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

function RoomSelector({ onCreateRoom, onJoinRoom, onOpenKanjiStudy, prefillRoomCode = '', isSocketReady = false }) {
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [screen, setScreen] = useState(prefillRoomCode ? 'assessment' : 'home');
  const joinNameInputRef = useRef(null);
  const hasInviteCode = Boolean(prefillRoomCode);

  useEffect(() => {
    if (prefillRoomCode) {
      setJoinCode(prefillRoomCode);
      joinNameInputRef.current?.focus();
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
    if (isSocketReady && createName.trim()) {
      onCreateRoom(createName.trim());
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const targetCode = (hasInviteCode ? prefillRoomCode : joinCode).trim();
    if (isSocketReady && targetCode && joinName.trim()) {
      onJoinRoom(targetCode.toUpperCase(), joinName.trim());
      if (!hasInviteCode) setJoinCode('');
      setJoinName('');
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
                <Input
                  ref={joinNameInputRef}
                  type="text"
                  placeholder="Enter your name"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  disabled={!isSocketReady || !joinName.trim()}
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
              <CardContent>
                <Button className="w-full" onClick={() => setScreen('learning')}>
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
                  Read kana sentences and challenge yourself with a friend.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full" onClick={() => setScreen('assessment')}>
                  Start an assessment
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : screen === 'learning' ? (
          <Card className="border-border max-w-2xl">
            <CardHeader>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Learning
              </p>
              <CardTitle>Study Japanese characters</CardTitle>
              <CardDescription>
                Review 100 essential N5 Kanji grouped by everyday themes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button onClick={onOpenKanjiStudy}>Study 100 N5 Kanji</Button>
              <Button variant="secondary" onClick={() => setScreen('home')}>
                Back to home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="secondary" size="sm" onClick={() => setScreen('home')}>
                Back to home
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
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!isSocketReady || !createName.trim()}
                    >
                      Create Room
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator orientation="vertical" className="h-full" />
                </div>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
                  <span className="px-2 text-xs uppercase text-muted-foreground">OR</span>
                </div>

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
                        ref={joinNameInputRef}
                        type="text"
                        placeholder="Enter your name"
                        value={joinName}
                        onChange={(e) => setJoinName(e.target.value)}
                      />
                      <Input
                        type="text"
                        placeholder="Room Code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                      />
                      <Button
                        type="submit"
                        variant="secondary"
                        className="w-full"
                        disabled={!isSocketReady || !joinCode.trim() || !joinName.trim()}
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
