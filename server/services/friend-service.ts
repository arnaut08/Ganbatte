export type FriendRecord = Record<string, unknown> & {
  id?: string | null;
  user_id?: string | null;
  friend_id?: string | null;
  display_name?: string | null;
  name?: string | null;
  profile?: { id?: string | null; display_name?: string | null } | null;
};

export interface FriendPresence extends FriendRecord {
  id: string | null;
  user_id: string | null;
  display_name: string;
  name: string;
  online: boolean;
}

export function normalizeFriendshipPair(userId: string | null | undefined, friendId: string | null | undefined): [string, string] {
  const left = String(userId || '');
  const right = String(friendId || '');

  if (!left || !right) {
    return [left, right];
  }

  return left < right ? [left, right] : [right, left];
}

export function mergeFriendPresence(friends: readonly FriendRecord[] = [], onlineUserIds: readonly (string | null | undefined)[] = []): FriendPresence[] {
  const onlineSet = new Set((onlineUserIds ?? []).map((userId) => String(userId)));

  return [...(friends ?? [])]
    .map((friend): FriendPresence => {
      const profile = friend?.profile ?? friend ?? {};
      const userId = friend?.user_id ?? friend?.friend_id ?? friend?.id ?? profile?.id ?? null;
      const displayName = profile?.display_name ?? friend?.display_name ?? friend?.name ?? 'Friend';

      return {
        ...friend,
        ...profile,
        id: friend?.id ?? userId ?? profile?.id ?? null,
        user_id: friend?.user_id ?? userId ?? profile?.id ?? null,
        display_name: displayName,
        name: displayName,
        online: onlineSet.has(String(userId)),
      };
    })
    .sort((left, right) => {
      if (left.online !== right.online) {
        return Number(right.online) - Number(left.online);
      }

      return String(left.display_name || '').localeCompare(String(right.display_name || ''));
    });
}
