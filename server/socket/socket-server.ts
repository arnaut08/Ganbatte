import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import type { Express } from 'express';
import type { RoomCallback } from '../types/socket-events.js';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket-events.js';
import {
  claimUserConnection,
  configureRedisAdapter,
  getUserSocketId,
  getUsersPresenceStatus,
  refreshUserConnection,
  releaseUserConnection,
} from '../config/redis.js';
import { isAllowedOrigin } from '../config/env.js';
import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import {
  answerSchema,
  cardsSchema,
  roomCodeSchema,
  sessionKeySchema,
  usernameSchema,
  type Answer,
  type Cards,
  type RoomCode,
  type SessionKey,
  type Username,
} from '../utils/validation.js';
import { generateRandomKanjiCards, generateRandomVocabCards, type KanjiCard, type PracticeCard, type VocabCard } from '../services/card-service.js';
import { getPersistedKanjiDeck } from '../repositories/kanji-repository.js';
import { getPersistedVocabDeck } from '../repositories/vocab-repository.js';
import { generateGrammarAssessment } from '../services/genki-grammar-service.js';
import { generateKanaDeck } from '../services/gemini-kana-service.js';
import { isCorrectRomajiAnswer } from '../utils/romaji.js';
import {
  advanceRoomIfReady,
  buildAssessmentResults,
  generateRoomCode,
  roomSocketData,
  roomState, type Room, type RoomCard,
} from '../utils/socket-room-utils.js';

type RoomDeckConfig = {
  type?: 'kana' | 'kanji' | 'vocab' | 'grammar';
  mode?: 'standard' | 'gauntlet';
  groups?: string[];
  maxLesson?: number;
  count?: number;
};

function isPracticeAnswerCorrect(answer: Answer, card: PracticeCard): boolean {
  if (card.answerType === 'text' && card.correctAnswer) {
    return String(answer).trim().toLowerCase() === card.correctAnswer.trim().toLowerCase();
  }
  return isCorrectRomajiAnswer(answer, card.romaji);
}

export async function configureSocketServer(server: HttpServer, app: Express): Promise<Server> {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: (origin, callback) => {
        callback(null, isAllowedOrigin(origin));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // Retain session for 2 minutes
      skipMiddlewares: false,                   // Must be false to re-populate socket.data.user
    },
  });

  app.set('io', io);

  io.use(async (socket, next) => {
    if (!isSupabaseConfigured()) {
      next();
      return;
    }

    const accessToken = socket.handshake.auth?.accessToken;
    if (!accessToken) {
      socket.data.user = null;
      next();
      return;
    }

    const { data, error } = await getSupabaseClient().auth.getUser(accessToken);
    if (error || !data.user) {
      next(new Error('Invalid authentication token'));
      return;
    }

    socket.data.user = data.user;

    await claimUserConnection(data.user.id, socket.id);

    socket.data.connectionRefresh = setInterval(() => {
      refreshUserConnection(data.user.id, socket.id).catch((refreshError) => {
        console.error('Redis user connection refresh error:', refreshError);
      });
    }, 30 * 1000);

    next();
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id} (Recovered: ${socket.recovered}). Total connected users: ${io.engine.clientsCount}`);

    const userRoom = socket.data.user?.id ? `user:${socket.data.user.id}` : null;
    if (userRoom) socket.join(userRoom);

    // Allow dynamic runtime authentication sync when verified post-login/signup
    socket.on('authenticate-socket', async (accessToken: string) => {
      if (!isSupabaseConfigured() || !accessToken) return;
      const { data, error } = await getSupabaseClient().auth.getUser(accessToken);
      if (!error && data.user) {
        socket.data.user = data.user;
        const newUserRoom = `user:${data.user.id}`;
        socket.join(newUserRoom);
        await claimUserConnection(data.user.id, socket.id);
        console.log(`Socket dynamically authenticated: ${socket.id} for user ${data.user.id}`);
      }
    });

    const notifyFriendsThatUserIsOnline = async (): Promise<void> => {
      const userId = socket.data.user?.id;
      if (!userId || !isSupabaseConfigured() || socket.recovered) return;

      const { data: friendshipRows, error } = await getSupabaseClient()
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (error) {
        console.error('Failed to load friendships for presence notification:', error);
        return;
      }

      const displayName = socket.data.user.user_metadata?.full_name
        || socket.data.user.email?.split('@')[0]
        || 'Your friend';
      const friendIds = (friendshipRows || [])
        .map((row) => (row.user_id === userId ? row.friend_id : row.user_id))
        .filter(Boolean);

      await Promise.all(friendIds.map(async (friendId) => {
        if (!(await getUserSocketId(String(friendId)))) return;

        io.to(`user:${friendId}`).emit('friend-online', {
          userId,
          displayName,
        });
      }));
    };

    notifyFriendsThatUserIsOnline().catch((error) => {
      console.error('Failed to notify friends about online presence:', error);
    });

    const restorePlayerPresenceFromReconnect = (): void => {
      const userId = socket.data.user?.id;
      if (!userId) return;

      for (const [roomCode, room] of roomState.rooms) {
        const player = room.players.find((candidate) => candidate.userId === userId || candidate.id === socket.id);
        if (!player) continue;

        player.id = socket.id;
        player.connected = true;
        player.status = player.status === 'ready' ? 'ready' : 'in_lobby';
        player.presence = 'online';
        delete player.disconnectedAt;

        socket.join(roomCode);
        io.to(roomCode).emit('player-presence-updated', { room });
      }
    };

    restorePlayerPresenceFromReconnect();

    // -------------------------------------------------------------
    // ROOM EVENT HANDLERS
    // -------------------------------------------------------------
    socket.on('create-room', async (hostName: Username, sessionKey: SessionKey, maybeUserId: string | RoomCallback | undefined, maybeDeckConfig: RoomDeckConfig | RoomCallback | undefined, maybeCallback?: RoomCallback) => {
      const parsedSessionKey = sessionKeySchema.safeParse(sessionKey);
      const parsedHostName = usernameSchema.safeParse(hostName);
      const callback = typeof maybeDeckConfig === 'function' ? maybeDeckConfig : maybeCallback;
      const deckConfig = typeof maybeDeckConfig === 'object' && maybeDeckConfig !== null ? maybeDeckConfig : {};
      const resolvedUserId = typeof maybeUserId === 'function'
        ? socket.data.user?.id
        : (maybeUserId ?? socket.data.user?.id);

      if (!parsedSessionKey.success) {
        if (callback) callback({ success: false, message: 'Invalid session' });
        return;
      }

      const playerName = parsedHostName.success ? parsedHostName.data : 'Player 1';
      const roomCode = generateRoomCode();
      const deckType = deckConfig?.type === 'grammar' ? 'grammar' : deckConfig?.type === 'kanji' ? 'kanji' : deckConfig?.type === 'vocab' ? 'vocab' : 'kana';
      const deckMode = deckConfig?.mode === 'gauntlet' ? 'gauntlet' : 'standard';
      let cards: PracticeCard[] = [];
      if (deckMode !== 'gauntlet' && deckType === 'kanji') {
        let deck;
        try {
          deck = await getPersistedKanjiDeck();
        } catch (error) {
          console.error('Kanji room deck lookup failed:', error);
          if (callback) callback({ success: false, message: 'Kanji lessons are not available.' });
          return;
        }
        if (!deck) {
          if (callback) callback({ success: false, message: 'Kanji lessons are not available.' });
          return;
        }
        cards = generateRandomKanjiCards(deck.cards as unknown as KanjiCard[], Array.isArray(deckConfig?.groups) ? deckConfig.groups : [], 10);
      } else if (deckMode !== 'gauntlet' && deckType === 'vocab') {
        let deck;
        try {
          deck = await getPersistedVocabDeck();
        } catch (error) {
          console.error('Vocab room deck lookup failed:', error);
          if (callback) callback({ success: false, message: 'Vocabulary lessons are not available.' });
          return;
        }
        if (!deck) {
          if (callback) callback({ success: false, message: 'Vocabulary lessons are not available.' });
          return;
        }
        cards = generateRandomVocabCards(deck as VocabCard[], 10, Array.isArray(deckConfig?.groups) ? deckConfig.groups : []);
      }
      const initialSeed = roomCode.split('').reduce(
        (value, character) => ((value * 31) + character.charCodeAt(0)) % 2147483647,
        7,
      );
      roomState.rooms.set(roomCode, {
        code: roomCode,
        players: [{
          id: socket.id,
          userId: resolvedUserId,
          sessionKey: parsedSessionKey.data,
          name: playerName,
          answers: [],
          hintsUsed: [],
          connected: true,
          presence: 'online',
          status: 'in_lobby',
        }],
        leftPlayers: [],
        cards,
        deckType,
        mode: deckMode,
        seed: initialSeed,
        selectedGroups: Array.isArray(deckConfig?.groups) ? deckConfig.groups : [],
        grammarSettings: deckType === 'grammar' ? {
          maxLesson: Number(deckConfig?.maxLesson) || 3,
          count: Number(deckConfig?.count) || 5,
        } : null,
        currentCardIndex: 0,
        status: 'waiting',
      });

      socket.join(roomCode);
      socket.emit('room-created', roomCode);
      console.log(`Room created: ${roomCode} (${deckType} deck)`);
      if (callback) callback(roomCode);
    });

    socket.on('join-room', (roomCode: RoomCode, username: Username, sessionKey: SessionKey, maybeUserId: string | RoomCallback | undefined, maybeCallback?: RoomCallback) => {
      const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
      const parsedUsername = usernameSchema.safeParse(username);
      const parsedSessionKey = sessionKeySchema.safeParse(sessionKey);
      const callback = typeof maybeUserId === 'function' ? maybeUserId : maybeCallback;
      const resolvedUserId = typeof maybeUserId === 'function' ? socket.data.user?.id : (maybeUserId ?? socket.data.user?.id);

      if (!parsedRoomCode.success || !parsedUsername.success || !parsedSessionKey.success) {
        if (callback) callback({ success: false, message: 'Invalid room code or username' });
        return;
      }

      const room = roomState.rooms.get(parsedRoomCode.data);
      if (!room) {
        if (callback) callback({ success: false, message: 'Room not found' });
        return;
      }

      const existingPlayer = room.players.find((player) =>
        player.sessionKey === parsedSessionKey.data
        || (resolvedUserId && player.userId === resolvedUserId),
      );

      if (existingPlayer) {
        existingPlayer.id = socket.id;
        existingPlayer.userId = resolvedUserId ?? existingPlayer.userId;
        existingPlayer.name = parsedUsername.data;
        existingPlayer.connected = true;
        existingPlayer.status = 'in_lobby';
        existingPlayer.presence = 'online';
        delete existingPlayer.disconnectedAt;
        socket.join(parsedRoomCode.data);
        io.to(parsedRoomCode.data).emit('player-rejoined', { room });
        if (callback) callback({ success: true, room });
        return;
      }

      if (room.players.length >= 2) {
        if (callback) callback({ success: false, message: 'Room is full' });
        return;
      }

      room.players.push({
        id: socket.id,
        userId: resolvedUserId,
        sessionKey: parsedSessionKey.data,
        name: parsedUsername.data,
        answers: [],
        hintsUsed: [],
        connected: true,
        presence: 'online',
        status: 'in_lobby',
      });
      socket.join(parsedRoomCode.data);
      io.to(parsedRoomCode.data).emit('player-joined', { room });

      if (callback) callback({ success: true, room });
    });

    socket.on('rejoin-room', (roomCode: RoomCode, username: Username, sessionKey: SessionKey, maybeUserId: string | RoomCallback | undefined, maybeCallback?: RoomCallback) => {
      const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
      const parsedUsername = usernameSchema.safeParse(username);
      const parsedSessionKey = sessionKeySchema.safeParse(sessionKey);
      const callback = typeof maybeUserId === 'function' ? maybeUserId : maybeCallback;
      const resolvedUserId = typeof maybeUserId === 'function' ? socket.data.user?.id : (maybeUserId ?? socket.data.user?.id);

      if (!parsedRoomCode.success || !parsedUsername.success || !parsedSessionKey.success) {
        if (callback) callback({ success: false, message: 'Invalid reconnection details' });
        return;
      }

      const room = roomState.rooms.get(parsedRoomCode.data);
      let player = room?.players.find(
        (candidate) => candidate.sessionKey === parsedSessionKey.data && candidate.name === parsedUsername.data,
      );

      if (!room) {
        if (callback) callback({ success: false, message: 'Room session expired' });
        return;
      }

      if (!player) {
        const leftPlayer = room.leftPlayers?.find(
          (candidate) => candidate.sessionKey === parsedSessionKey.data && candidate.name === parsedUsername.data,
        );

        if (!leftPlayer) {
          if (callback) callback({ success: false, message: 'Room session expired' });
          return;
        }

        player = {
          id: socket.id,
          userId: resolvedUserId ?? leftPlayer.userId ?? socket.data.user?.id ?? null,
          sessionKey: leftPlayer.sessionKey,
          name: leftPlayer.name,
          answers: Array.isArray(leftPlayer.answers) ? leftPlayer.answers : [],
          hintsUsed: Array.isArray(leftPlayer.hintsUsed) ? leftPlayer.hintsUsed : [],
          connected: true,
          presence: 'online',
          status: 'in_lobby',
        };
        room.players.push(player);
        room.leftPlayers = room.leftPlayers.filter(
          (candidate) => !(candidate.sessionKey === parsedSessionKey.data && candidate.name === parsedUsername.data),
        );
      }

      player.id = socket.id;
      player.userId = resolvedUserId ?? player.userId ?? socket.data.user?.id ?? null;
      player.connected = true;
      player.status = 'in_lobby';
      player.presence = 'online';
      delete player.disconnectedAt;

      const cleanupTimer = roomState.roomCleanupTimers.get(parsedRoomCode.data);
      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
        roomState.roomCleanupTimers.delete(parsedRoomCode.data);
      }

      socket.join(parsedRoomCode.data);
      io.to(parsedRoomCode.data).emit('player-rejoined', { room });
      if (callback) callback({ success: true, room });
    });

    socket.on('get-room', (roomCode: RoomCode, callback: RoomCallback) => {
      const room = roomState.rooms.get(roomCode);
      if (room && callback) {
        callback(room);
      }
    });

    socket.on('set-cards', (roomCode: RoomCode, cards: Cards, callback: RoomCallback) => {
      const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
      const parsedCards = cardsSchema.safeParse(cards);
      if (!parsedRoomCode.success || !parsedCards.success) {
        if (callback) callback({ success: false, message: 'Invalid room code or card deck' });
        return;
      }

      const room = roomState.rooms.get(parsedRoomCode.data);
      if (!room) {
        if (callback) callback({ success: false, message: 'Room not found' });
        return;
      }

      room.cards = parsedCards.data;
      io.to(parsedRoomCode.data).emit('cards-updated', { room });
      if (callback) callback({ success: true, room });
    });

    const startAssessment = async (roomCode: RoomCode, refreshDeck: boolean = false): Promise<void> => {
      const room = roomState.rooms.get(roomCode);
      if (!room) return;
      if (room.players[0]?.id !== socket.id) {
        socket.emit('assessment-action-denied', { message: 'Waiting for the host to start the assessment.' });
        return;
      }
      if (!room.players.every((player) => {
        if (room.status === 'completed') return player.connected !== false;

        const status = player.status ?? player.presence ?? 'in_lobby';
        return player.connected !== false && status !== 'away' && status !== 'disconnected' && status !== 'offline';
      })) return;

      if (room.deckType === 'grammar' || room.deckType === 'kana' || room.deckType === 'vocab') {
        room.status = 'preparing';
        room.currentCardIndex = 0;
        room.players.forEach((player) => {
          player.answers = [];
          player.hintsUsed = [];
          player.ready = false;
        });
        io.to(roomCode).emit('assessment-preparing', { room });

        try {
          if (room.deckType === 'grammar') {
            const questions = await generateGrammarAssessment({
              maxLesson: room.grammarSettings?.maxLesson || 3,
              count: room.grammarSettings?.count || 5,
              mode: 'assessment',
            });
            room.cards = questions as unknown as RoomCard[];
            room.questions = questions;
          } else {
            if (room.deckType === 'vocab') {
              const deck = await getPersistedVocabDeck();
              if (!deck) throw new Error('Vocabulary deck is unavailable');
              room.cards = generateRandomVocabCards(deck, 10, room.selectedGroups || []);
              if (room.cards.length === 0) throw new Error('Selected vocabulary stages contain no items');
            } else {
              room.cards = await generateKanaDeck();
            }
          }
        } catch (error) {
          console.error(`Failed to generate ${room.deckType} assessment deck:`, error);
          room.cards = [];
          room.questions = [];
          room.status = 'waiting';
          io.to(roomCode).emit('assessment-generation-failed', {
            room,
            message: `${room.deckType === 'kana' ? 'Kana' : room.deckType === 'vocab' ? 'Vocabulary' : 'Grammar'} assessment deck could not be generated. Please try again.`,
          });
          return;
        }
      } else if (refreshDeck) {
        if (room.deckType === 'kanji') {
          const deck = await getPersistedKanjiDeck();
          room.cards = deck
            ? generateRandomKanjiCards(deck.cards as unknown as KanjiCard[], room.selectedGroups || [], 10)
            : [];
        } else if (room.deckType === 'vocab') {
          try {
            const deck = await getPersistedVocabDeck();
            if (!deck) throw new Error('Vocabulary deck is unavailable');
            room.cards = generateRandomVocabCards(deck, 10, room.selectedGroups || []);
            if (room.cards.length === 0) throw new Error('Selected vocabulary stages contain no items');
          } catch (error) {
            console.error('Vocab assessment deck generation failed:', error);
            room.status = 'waiting';
            socket.emit('assessment-action-denied', { message: 'Vocabulary assessments are not available.' });
            return;
          }
        } else {
          try {
            room.cards = await generateKanaDeck();
          } catch (error) {
            console.error('Kana assessment deck generation failed:', error);
            room.status = 'waiting';
            socket.emit('assessment-action-denied', { message: 'Kana assessments are not available.' });
            return;
          }
        }
      }

      room.status = 'active';
      room.currentCardIndex = 0;
      room.players.forEach((player) => {
        player.answers = [];
        player.hintsUsed = [];
        player.ready = false;
      });
      io.to(roomCode).emit('assessment-started', { room });
    };

    socket.on('start-assessment', startAssessment);

    socket.on('start-gauntlet', (roomCode: RoomCode) => {
      const room = roomState.rooms.get(roomCode);
      const player = room?.players.find((candidate) => candidate.id === socket.id);
      if (!room || !player || room.players.length < 2 || room.status !== 'waiting') return;

      const seed = roomCode.split('').reduce(
        (value, character) => ((value * 31) + character.charCodeAt(0)) % 2147483647,
        7,
      );

      // 1. Mutate room state
      room.status = 'active';
      room.mode = 'gauntlet';
      room.seed = seed;

      // 2. Broadcast to both players
      io.to(roomCode).emit('gauntlet-started', { room, seed });
    });

    socket.on('forfeit-match', (roomCode: RoomCode) => {
      const room = roomState.rooms.get(roomCode);
      const forfeitingPlayer = room?.players.find((player) => player.id === socket.id);
      const winner = room?.players.find((player) => player.id !== socket.id && player.connected !== false);
      if (!room || !forfeitingPlayer || !winner || room.players.length < 2) return;
      if (room.status !== 'active' && room.status !== 'preparing') return;

      room.status = 'completed';
      room.winnerUserId = winner.userId ?? null;
      room.forfeitedByUserId = forfeitingPlayer.userId ?? null;
      if (winner.id) {
        io.to(winner.id).emit('match-forfeited', {
          forfeitingPlayerName: forfeitingPlayer.name,
          winnerUserId: room.winnerUserId,
          winnerPlayerName: winner.name,
        });
      }
      const completionEvent = room.mode === 'gauntlet' ? 'gauntlet-match-completed' : 'assessment-completed';
      io.to(roomCode).emit(completionEvent, {
        room,
        results: buildAssessmentResults(room),
        winnerUserId: room.winnerUserId,
        forfeitedByUserId: room.forfeitedByUserId,
        winnerSocketId: winner.id,
        loserSocketId: forfeitingPlayer.id,
      });
    });

    socket.on('replay-assessment', (roomCode: RoomCode) => {
      const room = roomState.rooms.get(roomCode);
      if (!room) return;
      if (room.players[0]?.id !== socket.id) {
        socket.emit('assessment-action-denied', { message: 'Waiting for the host to replay this assessment.' });
        return;
      }

      startAssessment(roomCode, true);
    });

    socket.on('return-to-lobby', (roomCode: RoomCode) => {
      const room = roomState.rooms.get(roomCode);
      if (!room) return;
      if (room.mode !== 'gauntlet' && room.players[0]?.id !== socket.id) {
        socket.emit('assessment-action-denied', { message: 'Waiting for the host to return the room to the lobby.' });
        return;
      }

      room.status = 'waiting';
      room.winnerUserId = null;
      room.forfeitedByUserId = null;
      delete room.winnerSocketId;
      room.currentCardIndex = 0;
      room.players.forEach((player) => {
        player.answers = [];
        player.hintsUsed = [];
        player.ready = false;
        player.status = 'in_lobby';
        player.presence = 'online';
      });
      io.to(roomCode).emit('room-returned-to-lobby', {
        room,
        returnedBySocketId: socket.id,
        returnedByPlayerName: room.players.find((player) => player.id === socket.id)?.name,
      });
    });

    socket.on('exit-lobby', (roomCode: RoomCode, callback: RoomCallback) => {
      const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
      if (!parsedRoomCode.success) {
        if (callback) callback({ success: false, message: 'Invalid room code' });
        return;
      }

      const normalizedRoomCode = parsedRoomCode.data;
      const room = roomState.rooms.get(normalizedRoomCode);
      if (!room) {
        if (callback) callback({ success: false, message: 'Room not found' });
        return;
      }

      const leavingPlayer = room.players.find((player) => player.id === socket.id);
      if (!leavingPlayer) {
        if (callback) callback({ success: false, message: 'Player not found in room' });
        return;
      }

      socket.data.intentionalLeaveRoomCode = normalizedRoomCode;
      socket.data.intentionalLeave = true;
      const exitedPlayerWasHost = room.players[0]?.id === socket.id;

      room.leftPlayers = room.leftPlayers.filter(
        (player) => !(player.sessionKey === leavingPlayer.sessionKey && player.name === leavingPlayer.name),
      );
      room.leftPlayers.push({
        sessionKey: leavingPlayer.sessionKey,
        name: leavingPlayer.name,
        userId: leavingPlayer.userId,
        answers: leavingPlayer.answers,
        hintsUsed: leavingPlayer.hintsUsed,
      });
      room.players = room.players.filter((player) => player.id !== socket.id);
      room.status = 'waiting';
      room.currentCardIndex = 0;
      room.players.forEach((player) => {
        player.answers = [];
        player.hintsUsed = [];
        player.ready = false;
        player.status = 'in_lobby';
        player.presence = 'online';
      });
      socket.leave(normalizedRoomCode);

      if (room.players.length > 0) {
        io.to(normalizedRoomCode).emit('player-exited-lobby', {
          room,
          exitedPlayerWasHost,
        });
      } else {
        roomState.rooms.delete(normalizedRoomCode);
      }

      if (callback) callback({ success: true });
    });

    socket.on('request-assessment-action', (roomCode: RoomCode, action: string) => {
      const room = roomState.rooms.get(roomCode);
      const player = room?.players.find((entry) => entry.id === socket.id);
      const host = room?.players[0];
      if (!room || !player || !host || player.id === host.id) return;
      if (action !== 'replay' && action !== 'new-session') return;

      io.to(roomCode).emit('assessment-action-requested', {
        action,
        guestName: player.name,
        hostSocketId: host.id,
      });
    });

    socket.on('submit-answer', (roomCode: RoomCode, answer: Answer) => {
      const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
      const parsedAnswer = answerSchema.safeParse(answer);
      if (!parsedRoomCode.success || !parsedAnswer.success) return;

      const room = roomState.rooms.get(parsedRoomCode.data);
      if (room) {
        const player = room.players.find((entry) => entry.id === socket.id);
        if (player) {
          const idx = room.currentCardIndex;
          player.answers[idx] = parsedAnswer.data;
          const currentCard = room.cards?.[idx];

          if (room.deckType === 'grammar') {
            player.ready = false;
          } else {
            player.ready = Boolean(currentCard && isPracticeAnswerCorrect(parsedAnswer.data, currentCard));
          }

          io.to(roomCode).emit('answer-submitted', {
            room,
            playerId: socket.id,
            cardIndex: idx,
          });
          io.to(roomCode).emit('player-ready-updated', { room });

          const allSubmitted = room.players.length > 0 && room.players.every((entry) => entry.answers[idx] !== undefined);
          if (allSubmitted) {
            console.log(`both-submitted: room=${roomCode} cardIndex=${idx}`);
            const kanaCards = room.cards;
            const isFinalCard = idx >= kanaCards.length - 1;
            const allAnswersCorrect = room.players.every((entry) => entry.ready === true);

            if (isFinalCard && allAnswersCorrect) {
              room.status = 'completed';
              io.to(roomCode).emit('assessment-completed', {
                room,
                results: buildAssessmentResults(room),
              });
            } else {
              io.to(roomCode).emit('both-submitted', { room, cardIndex: idx });
              advanceRoomIfReady(io, roomCode);
            }
          }
        }
      }
    });

    socket.on('next-card', (roomCode: RoomCode) => {
      const room = roomState.rooms.get(roomCode);
      if (!room) return;

      room.currentCardIndex++;
      room.players.forEach((player) => {
        player.ready = false;
      });

      const kanaCards = room.cards;
      if (room.currentCardIndex >= kanaCards.length) {
        room.status = 'completed';
        console.log(`assessment-completed (next-card): room=${roomCode}`);
        io.to(roomCode).emit('assessment-completed', {
          room,
          results: buildAssessmentResults(room),
        });
      } else {
        console.log(`card-updated (next-card): room=${roomCode} index=${room.currentCardIndex}`);
        io.to(roomCode).emit('card-updated', {
          currentCardIndex: room.currentCardIndex,
        });
      }
    });

    socket.on('player-ready', (roomCode: RoomCode) => {
      const room = roomState.rooms.get(roomCode);
      if (!room) return;

      const player = room.players.find((entry) => entry.id === socket.id);
      if (!player) return;

      player.ready = true;
      io.to(roomCode).emit('player-ready-updated', { room });
      console.log(`player-ready-updated: room=${roomCode} player=${player.id}`);
      advanceRoomIfReady(io, roomCode);
    });

    socket.on('set-player-presence', (roomCode: RoomCode, presence: string, callback: RoomCallback) => {
      const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
      const normalizedPresence = presence === 'away' ? 'away' : presence === 'ready' ? 'ready' : presence === 'disconnected' || presence === 'offline' ? 'disconnected' : presence === 'in_lobby' || presence === 'online' ? 'in_lobby' : 'in_lobby';
      if (!parsedRoomCode.success) {
        if (callback) callback({ success: false, message: 'Invalid room code' });
        return;
      }

      const room = roomState.rooms.get(parsedRoomCode.data);
      if (!room) {
        if (callback) callback({ success: false, message: 'Room not found' });
        return;
      }

      const player = room.players.find((entry) => entry.id === socket.id);
      if (!player) {
        if (callback) callback({ success: false, message: 'Player not found in room' });
        return;
      }

      if ((player.status ?? player.presence) === normalizedPresence && player.connected !== false) {
        if (callback) callback({ success: true, room });
        return;
      }

      player.status = normalizedPresence;
      player.presence = normalizedPresence === 'disconnected' ? 'offline' : normalizedPresence === 'away' ? 'away' : 'online';
      player.connected = normalizedPresence !== 'disconnected';
      io.to(parsedRoomCode.data).emit('player-presence-updated', { room });
      if (callback) callback({ success: true, room });
    });

    socket.on('invite-friend-to-room', async (roomCode: RoomCode, targetUserId: string, callback: RoomCallback) => {
      const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
      const senderUserId = socket.data.user?.id;
      const normalizedTargetUserId = String(targetUserId || '').trim();
      const room = parsedRoomCode.success ? roomState.rooms.get(parsedRoomCode.data) : null;

      if (!parsedRoomCode.success || !senderUserId || !normalizedTargetUserId || !room) {
        if (callback) callback({ success: false, message: 'Unable to send room invite.' });
        return;
      }

      const isHost = room.players[0]?.id === socket.id
        || (senderUserId && room.players[0]?.userId === senderUserId);
      if (!isHost || room.players.length >= 2) {
        if (callback) callback({ success: false, message: 'Only the host can invite an available friend.' });
        return;
      }

      const { data: friendship, error } = await getSupabaseClient()
        .from('friendships')
        .select('user_id')
        .or(`and(user_id.eq.${senderUserId},friend_id.eq.${normalizedTargetUserId}),and(user_id.eq.${normalizedTargetUserId},friend_id.eq.${senderUserId})`)
        .maybeSingle();

      if (error || !friendship) {
        if (callback) callback({ success: false, message: 'You can only invite friends.' });
        return;
      }

      if (!(await getUserSocketId(normalizedTargetUserId))) {
        if (callback) callback({ success: false, message: 'That friend is no longer online.' });
        return;
      }

      const inviterName = socket.data.user.user_metadata?.full_name
        || socket.data.user.email?.split('@')[0]
        || room.players[0].name
        || 'Your friend';
      io.to(`user:${normalizedTargetUserId}`).emit('room-invite-received', {
        roomCode: parsedRoomCode.data,
        deckType: room.deckType,
        inviterName,
        inviterUserId: senderUserId,
        inviterSocketId: socket.id,
      });

      if (callback) callback({ success: true });
    });

    socket.on('room-invite-response', (data: Record<string, unknown> = {}) => {
      const inviterSocketId = String(data.inviterSocketId || '');
      const inviterUserId = String(data.inviterUserId || '').trim();
      if ((!inviterSocketId && !inviterUserId) || inviterSocketId === socket.id) return;

      const response = {
        roomCode: data.roomCode,
        inviteeName: socket.data.user?.user_metadata?.full_name
          || socket.data.user?.email?.split('@')[0]
          || 'Your friend',
        accepted: data.accepted === true,
      };
      if (inviterUserId) io.to(`user:${inviterUserId}`).emit('room-invite-responded', response);
      else io.to(inviterSocketId).emit('room-invite-responded', response);
    });

    socket.on('use-hint', (roomCode: RoomCode, cardIndex: number) => {
      const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
      if (!parsedRoomCode.success) return;

      const room = roomState.rooms.get(parsedRoomCode.data);
      if (!room) return;

      const player = room.players.find((entry) => entry.id === socket.id);
      if (!player) return;

      const targetIndex = Number.isInteger(cardIndex) ? cardIndex : room.currentCardIndex;
      const totalHintsUsed = Array.isArray(player.hintsUsed)
        ? player.hintsUsed.reduce((sum, value) => sum + Number(value || 0), 0)
        : 0;
      const currentCardHints = Number(player.hintsUsed?.[targetIndex] ?? 0);

      if (totalHintsUsed >= 2) {
        io.to(roomCode).emit('hint-used', {
          room,
          playerId: socket.id,
          cardIndex: targetIndex,
          hintsUsed: totalHintsUsed,
        });
        return;
      }

      player.hintsUsed[targetIndex] = currentCardHints + 1;
      const nextTotal = Array.isArray(player.hintsUsed)
        ? player.hintsUsed.reduce((sum, value) => sum + Number(value || 0), 0)
        : 0;

      io.to(roomCode).emit('hint-used', {
        room,
        playerId: socket.id,
        cardIndex: targetIndex,
        hintsUsed: nextTotal,
      });
    });

    socket.on('leave-room', (roomCode: RoomCode, callback: RoomCallback) => {
      const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
      if (!parsedRoomCode.success) {
        if (callback) callback({ success: false, message: 'Invalid room code' });
        return;
      }

      const normalizedRoomCode = parsedRoomCode.data;
      const room = roomState.rooms.get(normalizedRoomCode);
      if (!room) {
        if (callback) callback({ success: false, message: 'Room not found' });
        return;
      }

      socket.data.intentionalLeaveRoomCode = normalizedRoomCode;
      socket.data.intentionalLeave = true;

      const leavingPlayer = room.players.find((player) => player.id === socket.id);
      if (leavingPlayer) {
        room.leftPlayers = room.leftPlayers.filter(
          (player) => !(player.sessionKey === leavingPlayer.sessionKey && player.name === leavingPlayer.name),
        );
        room.leftPlayers.push({
          sessionKey: leavingPlayer.sessionKey,
          name: leavingPlayer.name,
          userId: leavingPlayer.userId,
          answers: leavingPlayer.answers,
          hintsUsed: leavingPlayer.hintsUsed,
        });
      }

      room.players = room.players.filter((player) => player.id !== socket.id);
      socket.leave(normalizedRoomCode);

      const cleanupTimer = roomState.roomCleanupTimers.get(normalizedRoomCode);
      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
        roomState.roomCleanupTimers.delete(normalizedRoomCode);
      }

      if (room.players.length === 0 && room.leftPlayers.length === 0) {
        roomState.rooms.delete(normalizedRoomCode);
      } else {
        io.to(normalizedRoomCode).emit('player-left', { room, players: room.players });
      }

      if (callback) callback({ success: true });
    });

    // -------------------------------------------------------------
    // GRACEFUL DISCONNECT HANDLER
    // -------------------------------------------------------------
    socket.on('disconnect', async (reason, details) => {
      console.log('Socket disconnected:', {
        socketId: socket.id,
        reason,
        details,
        userId: socket.data.user?.id,
        totalConnectedUsers: io.engine.clientsCount,
      });

      if (socket.data.connectionRefresh) {
        clearInterval(socket.data.connectionRefresh);
      }

      if (socket.data.intentionalLeave === true) {
        delete socket.data.intentionalLeave;
        delete socket.data.intentionalLeaveRoomCode;
        if (socket.data.user?.id) {
          releaseUserConnection(socket.data.user.id, socket.id).catch(console.error);
        }
        return;
      }

      const socketId = socket.id;
      const userId = socket.data.user?.id;
      const activeSocketId = userId ? await getUserSocketId(userId) : null;
      if (activeSocketId && activeSocketId !== socketId) return;

      if (userId) await releaseUserConnection(userId, socketId).catch(console.error);
      for (const [roomCode, room] of roomState.rooms) {
        const player = room.players.find((candidate) => candidate.id === socketId);
        if (!player) continue;
        player.connected = false;
        player.status = 'disconnected';
        player.presence = 'offline';
        player.disconnectedAt = Date.now();
        io.to(roomCode).emit('player-left', { room, players: room.players });
      }
    });
  });

  await configureRedisAdapter(io);
  return io;
}

export { getUserSocketId, getUsersPresenceStatus };
export { roomSocketData };
export { roomState };