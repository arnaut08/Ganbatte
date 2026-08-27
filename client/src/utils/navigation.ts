const DEFAULT_STATUS = 'selector';
type ScreenStatus = string;

export function pushScreenHistory(history: ScreenStatus[] = [], currentStatus?: ScreenStatus, nextStatus?: ScreenStatus): ScreenStatus[] {
  const safeHistory = Array.isArray(history) && history.length > 0 ? [...history] : [DEFAULT_STATUS];
  const current = currentStatus || safeHistory[safeHistory.length - 1] || DEFAULT_STATUS;

  if (!nextStatus || nextStatus === current) {
    return safeHistory;
  }

  const lastStatus = safeHistory[safeHistory.length - 1] || DEFAULT_STATUS;

  if (lastStatus === nextStatus) {
    return safeHistory;
  }

  if (lastStatus !== current) {
    safeHistory.push(current);
  }

  if (safeHistory[safeHistory.length - 1] === nextStatus) {
    return safeHistory;
  }

  return [...safeHistory, nextStatus];
}

export function getPreviousStatus(history: ScreenStatus[] = []): ScreenStatus {
  if (!Array.isArray(history) || history.length < 2) {
    return DEFAULT_STATUS;
  }

  return history[history.length - 2] || DEFAULT_STATUS;
}

export function getBackStatus(history: ScreenStatus[] = []): ScreenStatus {
  if (!Array.isArray(history) || history.length === 0) {
    return DEFAULT_STATUS;
  }

  const current = history[history.length - 1] || DEFAULT_STATUS;
  const previous = getPreviousStatus(history);

  if (current === DEFAULT_STATUS || previous === current) {
    return DEFAULT_STATUS;
  }

  return previous;
}

// Completed rooms should take users who are still in the room flow to results.
// Other screens (home, friends, history, etc.) are intentionally unaffected.
export function shouldRedirectToCompletedRoomResults(currentStatus: ScreenStatus, roomStatus: string): boolean {
  return roomStatus === 'completed'
    && (currentStatus === 'assessment' || currentStatus === 'lobby');
}
