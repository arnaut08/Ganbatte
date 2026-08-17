export function mergeFriendPresence(friends = [], onlineUserIds = []) {
  const onlineSet = new Set((onlineUserIds ?? []).map((userId) => String(userId)));

  return [...(friends ?? [])]
    .map((friend) => {
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
