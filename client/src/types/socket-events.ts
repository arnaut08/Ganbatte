import type { Socket } from 'socket.io-client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Room, RoomPlayer, SocketAck } from './room';

export type IdentityPayload = { display_name?: string };

export type RoomSocketPayload = {
  room?: Room;
  players?: RoomPlayer[];
  currentCardIndex?: number;
  results?: unknown[];
  message?: string;
  hostSocketId?: string;
  action?: string;
  guestName?: string;
  exitedPlayerWasHost?: boolean;
  deckType?: string;
  roomCode?: string;
  seed?: number;
  inviterName?: string;
  inviterUserId?: string;
  inviterSocketId?: string;
  accepted?: boolean;
  inviteeName?: string;
  forfeitingPlayerName?: string;
  winnerUserId?: string | null;
  winnerPlayerName?: string;
  returnedBySocketId?: string;
  returnedByPlayerName?: string;
  winnerSocketId?: string;
  loserSocketId?: string;
  friend?: IdentityPayload;
  receiver?: IdentityPayload;
  displayName?: string;
  success?: boolean;
};

type RoomEventPayload = RoomSocketPayload;

type RoomSocketEvents = {
  'player-rejoined': RoomEventPayload;
  'room-created': string;
  'assessment-preparing': RoomEventPayload;
  'player-joined': RoomEventPayload;
  'assessment-started': RoomEventPayload;
  'gauntlet-started': RoomEventPayload;
  'assessment-generation-failed': RoomEventPayload;
  'answer-submitted': RoomEventPayload;
  'hint-used': RoomEventPayload;
  'player-ready-updated': RoomEventPayload;
  'both-submitted': RoomEventPayload;
  'cards-updated': RoomEventPayload;
  'card-updated': RoomEventPayload;
  'assessment-completed': RoomEventPayload;
  'gauntlet-match-completed': RoomEventPayload;
  'match-forfeited': RoomEventPayload;
  'room-returned-to-lobby': RoomEventPayload;
  'assessment-action-denied': RoomEventPayload;
  'assessment-action-requested': RoomEventPayload;
  'player-exited-lobby': RoomEventPayload;
  'player-left': RoomEventPayload;
  'player-presence-updated': RoomEventPayload;
  'friend-request-received': RoomEventPayload;
  'friend-request-accepted': RoomEventPayload;
  'friend-request-rejected': RoomEventPayload;
  'friend-online': RoomEventPayload;
  'room-invite-received': RoomEventPayload;
  'room-invite-responded': RoomEventPayload;
};

type RoomSocketCommands = {
  'set-player-presence': (roomCode: string, status: string) => void;
  'rejoin-room': (roomCode: string, username: string, sessionKey: string, userId: string | undefined, callback: (response: SocketAck) => void) => void;
  'room-invite-response': (payload: {
    roomCode?: string;
    inviterUserId?: string;
    inviterSocketId?: string;
    accepted: boolean;
  }) => void;
};

export type RoomSocketEventName = keyof RoomSocketEvents;
export type RoomSocketEvent<TEvent extends RoomSocketEventName> = RoomSocketEvents[TEvent];
export type RoomSocket = Socket<RoomSocketEvents, RoomSocketCommands>;

export function createRejoinGate() {
  let activeRequest: { socket: object; key: string } | null = null;

  return {
    claim(socket: object, key: string, force = false) {
      if (!force && activeRequest?.socket === socket && activeRequest.key === key) return false;
      activeRequest = { socket, key };
      return true;
    },
    resolve(success: boolean) {
      if (!success) activeRequest = null;
    },
    reset() {
      activeRequest = null;
    },
  };
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizePlayer(value: unknown): RoomPlayer | null {
  if (!isRecord(value) || typeof value.name !== 'string') return null;
  return {
    ...value,
    id: asString(value.id),
    userId: asString(value.userId) ?? asString(value.user_id) ?? null,
    sessionKey: asString(value.sessionKey),
    name: value.name,
    answers: Array.isArray(value.answers) ? value.answers : [],
    hintsUsed: Array.isArray(value.hintsUsed)
      ? value.hintsUsed.filter((hint): hint is number => typeof hint === 'number' && Number.isFinite(hint))
      : [],
    ready: typeof value.ready === 'boolean' ? value.ready : undefined,
    connected: typeof value.connected === 'boolean' ? value.connected : undefined,
    presence: asString(value.presence) as RoomPlayer['presence'],
    status: asString(value.status),
  };
}

export function normalizeRoom(value: unknown): Room | undefined {
  if (!isRecord(value) || !Array.isArray(value.players)) return undefined;
  const players = value.players.map(normalizePlayer).filter((player): player is RoomPlayer => player !== null);
  if (players.length !== value.players.length) return undefined;

  return {
    ...value,
    code: asString(value.code),
    status: asString(value.status) as Room['status'],
    mode: asString(value.mode) as Room['mode'],
    seed: asNumber(value.seed),
    cards: Array.isArray(value.cards) ? value.cards.filter(isRecord) : undefined,
    players,
    currentCardIndex: asNumber(value.currentCardIndex),
    winnerUserId: asString(value.winnerUserId) ?? null,
    forfeitedByUserId: asString(value.forfeitedByUserId) ?? null,
    winnerSocketId: asString(value.winnerSocketId),
    selectedGroups: Array.isArray(value.selectedGroups)
      ? value.selectedGroups.filter((group): group is string => typeof group === 'string')
      : undefined,
  };
}

function normalizePayload(value: unknown): RoomSocketPayload | null {
  if (!isRecord(value)) return null;
  const room = value.room === undefined ? undefined : normalizeRoom(value.room);
  if (value.room !== undefined && !room) return null;

  return {
    room,
    players: Array.isArray(value.players) ? value.players.map(normalizePlayer).filter((player): player is RoomPlayer => player !== null) : undefined,
    currentCardIndex: asNumber(value.currentCardIndex),
    results: Array.isArray(value.results) ? value.results : undefined,
    message: asString(value.message),
    hostSocketId: asString(value.hostSocketId),
    action: asString(value.action),
    guestName: asString(value.guestName),
    exitedPlayerWasHost: typeof value.exitedPlayerWasHost === 'boolean' ? value.exitedPlayerWasHost : undefined,
    deckType: asString(value.deckType),
    roomCode: asString(value.roomCode),
    seed: asNumber(value.seed),
    inviterName: asString(value.inviterName),
    inviterUserId: asString(value.inviterUserId),
    inviterSocketId: asString(value.inviterSocketId),
    accepted: typeof value.accepted === 'boolean' ? value.accepted : undefined,
    inviteeName: asString(value.inviteeName),
    forfeitingPlayerName: asString(value.forfeitingPlayerName),
    winnerUserId: asString(value.winnerUserId) ?? null,
    winnerPlayerName: asString(value.winnerPlayerName),
    returnedBySocketId: asString(value.returnedBySocketId),
    returnedByPlayerName: asString(value.returnedByPlayerName),
    winnerSocketId: asString(value.winnerSocketId),
    loserSocketId: asString(value.loserSocketId),
    friend: isRecord(value.friend) ? { display_name: asString(value.friend.display_name) } : undefined,
    receiver: isRecord(value.receiver) ? { display_name: asString(value.receiver.display_name) } : undefined,
    displayName: asString(value.displayName),
    success: typeof value.success === 'boolean' ? value.success : undefined,
  };
}

export function normalizeRoomSocketEvent<TEvent extends RoomSocketEventName>(
  event: TEvent,
  value: unknown,
): RoomSocketEvent<TEvent> | null {
  if (event === 'room-created') {
    const roomCode = asString(value);
    return roomCode === undefined ? null : roomCode as RoomSocketEvent<TEvent>;
  }
  return normalizePayload(value) as RoomSocketEvent<TEvent> | null;
}

export type GauntletAttackType = 'SPEED_SURGE';

export type GauntletMatchCallbacks = {
  onOpponentSync: (data: { userId: string; hp: number; score: number }) => void;
  onReceiveAttack: (attackType: GauntletAttackType) => void;
  onOpponentKO: () => void;
};

function normalizeGauntletSyncPayload(payload: unknown): { userId: string; hp: number; score: number } | null {
  if (!isRecord(payload) || typeof payload.userId !== 'string') return null;
  if (typeof payload.hp !== 'number' || !Number.isFinite(payload.hp)) return null;
  if (typeof payload.score !== 'number' || !Number.isFinite(payload.score)) return null;
  return { userId: payload.userId, hp: payload.hp, score: payload.score };
}

function normalizeGauntletAttackPayload(payload: unknown): { userId: string; targetUserId: string; attackType: GauntletAttackType } | null {
  if (!isRecord(payload) || typeof payload.userId !== 'string' || typeof payload.targetUserId !== 'string') return null;
  if (payload.attackType !== 'SPEED_SURGE') return null;
  return { userId: payload.userId, targetUserId: payload.targetUserId, attackType: payload.attackType };
}

function normalizeGauntletKoPayload(payload: unknown): { userId: string } | null {
  return isRecord(payload) && typeof payload.userId === 'string' ? { userId: payload.userId } : null;
}

export function bindGauntletMatchChannel(
  channel: RealtimeChannel,
  userId: string,
  callbacks: GauntletMatchCallbacks,
): () => void {
  channel
    .on('broadcast', { event: 'player_sync' }, ({ payload }) => {
      const normalized = normalizeGauntletSyncPayload(payload);
      if (normalized && normalized.userId !== userId) callbacks.onOpponentSync(normalized);
    })
    .on('broadcast', { event: 'player_attack' }, ({ payload }) => {
      const normalized = normalizeGauntletAttackPayload(payload);
      if (normalized && normalized.targetUserId === userId) callbacks.onReceiveAttack(normalized.attackType);
    })
    .on('broadcast', { event: 'player_ko' }, ({ payload }) => {
      const normalized = normalizeGauntletKoPayload(payload);
      if (normalized && normalized.userId !== userId) callbacks.onOpponentKO();
    });

  return () => {
    void channel.unsubscribe();
  };
}

type RoomSocketEventSource = {
  on(event: string, listener: (value: unknown) => void): unknown;
  off(event: string, listener: (value: unknown) => void): unknown;
};

export function bindRoomSocketEvent<TEvent extends RoomSocketEventName>(
  socket: object,
  event: TEvent,
  handler: (payload: RoomSocketEvent<TEvent>) => void,
): () => void {
  const listener = (value: unknown) => {
    const payload = normalizeRoomSocketEvent(event, value);
    if (payload !== null) handler(payload);
  };
  const eventSocket = socket as RoomSocketEventSource;
  eventSocket.on(event, listener);
  return () => eventSocket.off(event, listener);
}