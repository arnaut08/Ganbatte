export function createFriendRefreshGuard(minIntervalMs = 1000) {
  const lastRefreshByKey = new Map();
  let lastNullRefreshAt = 0;

  const shouldRefresh = (userId, socketId, scope = 'combined') => {
    const now = Date.now();

    if (userId == null) {
      if (now - lastNullRefreshAt < minIntervalMs) {
        return false;
      }

      lastNullRefreshAt = now;
      lastRefreshByKey.clear();
      return true;
    }

    const key = `${userId}:${socketId ?? 'initial'}:${scope}`;
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
