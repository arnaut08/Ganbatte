export const ROOM_VIEW_STATUSES = ['lobby', 'assessment', 'results', 'assessment-preparing'];

export function canTransitionToStatus(current: string, nextStatus?: string, screenPriority: Record<string, number> = {}): boolean {
  if (!nextStatus) return false;

  const currentPriority = screenPriority[current] ?? 0;
  const nextPriority = screenPriority[nextStatus] ?? 0;

  if (nextPriority < currentPriority) return false;

  const isRoomScreen = ROOM_VIEW_STATUSES.includes(current);
  const isRoomTransition = ROOM_VIEW_STATUSES.includes(nextStatus);

  if (!isRoomScreen && current !== 'selector' && isRoomTransition) {
    return false;
  }

  return true;
}
