import type { RoomPlayer } from '../types/room';

export function getPlayerPresenceStatus(player: Partial<RoomPlayer> | null = null): string {
  if (!player) return 'disconnected';

  if (player.status === 'ready') return 'ready';
  if (player.status === 'away' || player.presence === 'away') return 'away';
  if (player.status === 'disconnected' || player.presence === 'disconnected' || player.status === 'offline' || player.presence === 'offline') return 'disconnected';
  if (player.connected === false) return 'disconnected';
  if (player.status === 'in_lobby' || player.presence === 'in_lobby') return 'in_lobby';
  if (player.status === 'online' || player.presence === 'online') return 'in_lobby';
  return 'in_lobby';
}

function isPlayerInLobby(player: Partial<RoomPlayer> | null = null): boolean {
  const status = getPlayerPresenceStatus(player);
  return status === 'in_lobby' || status === 'ready';
}

export function canStartAssessment(players: Partial<RoomPlayer>[] = []): boolean {
  return Array.isArray(players)
    && players.length === 2
    && players.every((player) => {
      const status = getPlayerPresenceStatus(player);
      return player && player.connected !== false && (status === 'in_lobby' || status === 'ready');
    });
}
