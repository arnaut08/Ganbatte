export function createFriendRefreshGuard(minIntervalMs: number = 1000) {
  const lastRefreshByKey = new Map();
  let lastNullRefreshAt = 0;

  const shouldRefresh = (userId: string | null, socketId: string | null, scope: string = 'combined'): boolean => {
    const now = Date.now();

    if (userId == null) {
      if (now - lastNullRefreshAt < minIntervalMs) {
        return false;
      }

      lastNullRefreshAt = now;
      lastRefreshByKey.clear();
      return true;
    }

    const normalizedScope =
      (typeof scope === 'string' && ['combined', 'friends', 'requests'].includes(scope))
        ? scope
        : ((typeof socketId === 'string' && ['combined', 'friends', 'requests'].includes(socketId))
          ? socketId
          : 'combined');

    const key = `${userId}:${normalizedScope}`;
    const lastRefresh = lastRefreshByKey.get(key) ?? 0;

    if (now - lastRefresh < minIntervalMs) {
      return false;
    }

    lastRefreshByKey.set(key, now);
    return true;
  };

  shouldRefresh.reset = () => {
    lastRefreshByKey.clear();
    lastNullRefreshAt = 0;
  };

  return shouldRefresh;
}
