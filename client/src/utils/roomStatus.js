export const PLAYER_STATUS_VALUES = ['in_lobby', 'away', 'disconnected', 'ready'];
export const ROOM_STATUS_VALUES = ['waiting_for_guest', 'guest_joined', 'ready_to_start', 'in_assessment'];

export function getPlayerPresenceStatus(player = null) {
  if (!player) return 'disconnected';

  if (player.status === 'ready') return 'ready';
  if (player.status === 'away' || player.presence === 'away') return 'away';
  if (player.status === 'disconnected' || player.presence === 'disconnected' || player.status === 'offline' || player.presence === 'offline') return 'disconnected';
  if (player.connected === false) return 'disconnected';
  if (player.status === 'in_lobby' || player.presence === 'in_lobby') return 'in_lobby';
  if (player.status === 'online' || player.presence === 'online') return 'in_lobby';
  return 'in_lobby';
}

export function isPlayerInLobby(player = null) {
  const status = getPlayerPresenceStatus(player);
  return status === 'in_lobby' || status === 'ready';
}

export function getRoomLobbyState(players = []) {
  const normalizedPlayers = Array.isArray(players) ? players : [];

  if (normalizedPlayers.length === 0) return 'waiting_for_guest';
  if (normalizedPlayers.length === 1) return 'waiting_for_guest';
  if (normalizedPlayers.length === 2 && normalizedPlayers.every(isPlayerInLobby)) return 'ready_to_start';
  if (normalizedPlayers.length === 2) return 'guest_joined';
  return 'guest_joined';
}

export function canStartAssessment(players = []) {
  return Array.isArray(players)
    && players.length === 2
    && players.every((player) => {
      const status = getPlayerPresenceStatus(player);
      return player && player.connected !== false && (status === 'in_lobby' || status === 'ready');
    });
}
