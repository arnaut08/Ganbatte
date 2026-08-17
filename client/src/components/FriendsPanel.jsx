import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PersonIcon, ClockIcon } from '@radix-ui/react-icons';

function FriendsPanel({
  friends = [],
  searchResults = [],
  friendRequests = [],
  onSearchUsers,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onRemoveFriend,
  isSearching = false,
}) {
  const [query, setQuery] = useState('');
  const onSearchUsersRef = useRef(onSearchUsers);

  // Keep the ref in sync with the latest callback without re-triggering the debounce effect.
  useEffect(() => {
    onSearchUsersRef.current = onSearchUsers;
  }, [onSearchUsers]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      onSearchUsersRef.current?.('');
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onSearchUsersRef.current?.(trimmed);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [query]);

  const friendIds = new Set(
    friends
      .map((friend) => friend?.user_id ?? friend?.id)
      .filter(Boolean)
      .map(String),
  );

  const pendingRequestSenderIds = new Set(
    friendRequests
      .filter((request) => request?.direction === 'outgoing')
      .map((request) => request?.receiver_id ?? request?.receiver?.id)
      .filter(Boolean)
      .map(String),
  );

  const visibleResults = searchResults.filter(
    (person) => !friendIds.has(String(person?.user_id ?? person?.id ?? '')),
  );

  const hasQuery = Boolean(query.trim());

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 md:flex-row md:items-start">
      <Card className="border-border md:flex-1">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-lg">Find friends</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Search by name and send a friend request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="space-y-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a friend by name"
              className="h-10"
            />
            {isSearching && (
              <p className="text-xs text-muted-foreground">Searching friends...</p>
            )}
          </div>

          {hasQuery && !isSearching && visibleResults.length === 0 && (
            <p className="text-sm text-muted-foreground">No users found.</p>
          )}

          {hasQuery && visibleResults.length > 0 && (
            <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Results
              </p>
              {visibleResults.map((person) => {
                const personId = String(person?.user_id ?? person?.id ?? '');
                const requestPending = pendingRequestSenderIds.has(personId);

                return (
                  <div key={person.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/60 p-2">
                    <div>
                      <p className="font-medium">{person.display_name}</p>
                    </div>
                    {requestPending ? (
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
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => onSendFriendRequest?.(person.id)}
                        aria-label={`Send friend request to ${person.display_name}`}
                        title="Send friend request"
                      >
                        <PersonIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {friendRequests.filter((request) => request?.direction !== 'outgoing').length > 0 && (
            <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Friend requests
              </p>
              {friendRequests
                .filter((request) => request?.direction !== 'outgoing')
                .map((request) => (
                  <div key={request.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/60 p-2">
                    <div>
                      <p className="font-medium">{request.sender?.display_name || 'Unknown'}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {request.sender?.online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => onAcceptFriendRequest?.(request.id)}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onRejectFriendRequest?.(request.id)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border md:flex-1">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-lg">Friends</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Your current friends list.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="space-y-2">
            {friends.length === 0 ? (
              <p className="text-sm text-muted-foreground">No friends yet. Search to add one.</p>
            ) : (
              friends.map((friend) => (
                <div key={friend.id || friend.user_id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {friend.display_name?.charAt(0)?.toUpperCase() || 'F'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{friend.display_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {friend.online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={friend.online ? 'success' : 'secondary'} className="text-[10px]">
                      {friend.online ? 'Online' : 'Offline'}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => onRemoveFriend?.(friend.user_id || friend.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FriendsPanel;