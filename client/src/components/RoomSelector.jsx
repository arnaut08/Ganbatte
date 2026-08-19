import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronDownIcon } from '@radix-ui/react-icons';
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

            <Card className="border-border max-w-2xl">
              <CardHeader>
                <CardTitle>Genki Grammar</CardTitle>
                <CardDescription>
                  Generate Genki Volume 1 grammar questions up to a selected lesson level.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button onClick={() => onOpenGrammarPractice(3, 5)}>Practice grammar</Button>
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
                {/* <FriendsPanel
                  friends={friends}
                  searchResults={friendSearchResults}
                  onSearchUsers={onSearchUsers}
                  isSearching={isFriendSearchLoading}
                /> */}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex h-full flex-col justify-between rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Create a Room</h3>
                      <p className="text-sm text-muted-foreground">
                        Start a new assessment session and invite a friend.
                      </p>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Deck
                        </span>
                        <div className="flex flex-1 gap-2">
                          <Button
                            type="button"
                            variant={deckType === 'kana' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setDeckType('kana')}
                          >
                            Kana
                          </Button>
                          <Button
                            type="button"
                            variant={deckType === 'kanji' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setDeckType('kanji')}
                          >
                            Kanji
                          </Button>
                          <Button
                            type="button"
                            variant={deckType === 'grammar' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setDeckType('grammar')}
                          >
                            Grammar
                          </Button>
                        </div>
                      </div>

                      {deckType === 'grammar' && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Lesson level
                          </label>
                          <select
                            value={grammarLevel}
                            onChange={(event) => setGrammarLevel(Number(event.target.value) || 1)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map((level) => (
                              <option key={level} value={level}>Lesson {level}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {deckType === 'kanji' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                            Groups
                          </span>
                          <DropdownMenu open={isGroupMenuOpen} onOpenChange={setIsGroupMenuOpen}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="flex-1 justify-between">
                                <span className="truncate">
                                  {selectedGroups.length === 0
                                    ? 'All groups'
                                    : `${selectedGroups.length} selected`}
                                </span>
                                <ChevronDownIcon className="h-4 w-4 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[280px] border-border bg-popover" align="start">
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.preventDefault();
                                  setSelectedGroups([]);
                                  setIsGroupMenuOpen(false);
                                }}
                                className={selectedGroups.length === 0 ? 'bg-accent/50' : ''}
                              >
                                <span className="mr-2">{selectedGroups.length === 0 ? '✓' : ''}</span>
                                All groups
                              </DropdownMenuItem>
                              {KANJI_GROUPS.map((group) => (
                                <DropdownMenuItem
                                  key={group.id}
                                  onSelect={(event) => {
                                    event.preventDefault();
                                    handleGroupToggle(group.id);
                                  }}
                                  className={selectedGroups.includes(group.id) ? 'bg-accent/50' : ''}
                                >
                                  <span className="mr-2">{selectedGroups.includes(group.id) ? '✓' : ''}</span>
                                  {group.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}

                      {selectedGroups.length > 0 && deckType === 'kanji' && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedGroups.map((groupId) => (
                            <Badge key={groupId} variant="secondary" className="text-[10px]">
                              {KANJI_GROUPS.find((group) => group.id === groupId)?.name || groupId}
                            </Badge>
                          ))}
                        </div>
                      )}
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
