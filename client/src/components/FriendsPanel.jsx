import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function FriendsPanel({
  friends = [],
  searchResults = [],
  onSearchUsers,
  onAddFriend,
  onRemoveFriend,
  isSearching = false,
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      onSearchUsers?.('');
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onSearchUsers?.(trimmed);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, onSearchUsers]);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Friends</CardTitle>
        <CardDescription>
          Search by name and add someone to your friend list.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {query.trim() && searchResults.length > 0 && (
          <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Results
            </p>
            {searchResults.map((person) => (
              <div key={person.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/60 p-2">
                <div>
                  <p className="font-medium">{person.display_name}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => onAddFriend?.(person.id)}>
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your friends
          </p>
          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground">No friends yet. Search above to add one.</p>
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
  );
}

export default FriendsPanel;
