import { Server } from 'socket.io';
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
} from '../utils/validation.js';
import { generateRandomCards, generateRandomKanjiCards } from '../services/card-service.js';
import { generateGrammarAssessment } from '../services/genki-grammar-service.js';
import { KANA_SENTENCES } from '../data/kana-sentences.js';
import { isCorrectRomajiAnswer } from '../utils/romaji.js';
import {
  advanceRoomIfReady,
  buildAssessmentResults,
  generateRoomCode,
  roomSocketData,
  roomState,
} from '../utils/socket-room-utils.js';

export async function configureSocketServer(server, app) {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        callback(null, isAllowedOrigin(origin));
      },
      methods: ['GET', 'POST'],
      credentials: true,
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

    const previousSocketId = await claimUserConnection(data.user.id, socket.id);
    if (previousSocketId && previousSocketId !== socket.id) {
      io.in(previousSocketId).disconnectSockets(true);
    }

    socket.data.connectionRefresh = setInterval(() => {
      refreshUserConnection(data.user.id, socket.id).catch((refreshError) => {
        console.error('Redis user connection refresh error:', refreshError);
      });
    }, 30 * 1000);
    next();
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    const restorePlayerPresenceFromReconnect = () => {
      const userId = socket.data.user?.id;
      if (!userId) return;

      for (const [roomCode, room] of roomState.rooms) {
        const player = room.players.find((candidate) => candidate.userId === userId);
        if (!player) continue;

        const wasDisconnected = player.connected === false || player.status === 'disconnected';
        if (!wasDisconnected && player.status === 'in_lobby' && player.presence === 'online') continue;

        player.connected = true;
        player.status = player.status === 'ready' ? 'ready' : 'in_lobby';
        player.presence = 'online';
        delete player.disconnectedAt;
        io.to(roomCode).emit('player-presence-updated', { room });
      }
    };

    restorePlayerPresenceFromReconnect();

    socket.on('create-room', (hostName, sessionKey, maybeUserId, maybeDeckConfig, maybeCallback) => {
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
      const deckType = deckConfig?.type === 'grammar' ? 'grammar' : deckConfig?.type === 'kanji' ? 'kanji' : 'kana';
      const cards = deckType === 'grammar'
        ? []
        : deckType === 'kanji'
          ? generateRandomKanjiCards(Array.isArray(deckConfig?.groups) ? deckConfig.groups : [], 10)
          : generateRandomCards(KANA_SENTENCES, 10);

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

    socket.on('join-room', (roomCode, username, sessionKey, maybeUserId, maybeCallback) => {
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

    socket.on('rejoin-room', (roomCode, username, sessionKey, maybeUserId, maybeCallback) => {
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

    socket.on('get-room', (roomCode, callback) => {
      const room = roomState.rooms.get(roomCode);
      if (room && callback) {
        callback(room);
      }
    });

    socket.on('set-cards', (roomCode, cards, callback) => {
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

    const startAssessment = async (roomCode, refreshDeck = false) => {
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

      if (room.deckType === 'grammar') {
        room.status = 'preparing';
        room.currentCardIndex = 0;
        room.players.forEach((player) => {
          player.answers = [];
          player.hintsUsed = [];
          player.ready = false;
        });
        io.to(roomCode).emit('assessment-preparing', { room });

        try {
          const questions = await generateGrammarAssessment({
            maxLesson: room.grammarSettings?.maxLesson || 3,
            count: room.grammarSettings?.count || 5,
          });
          room.cards = questions;
          room.questions = questions;
        } catch (error) {
          console.error('Failed to generate grammar assessment deck:', error);
          room.cards = [];
          room.questions = [];
        }
      } else if (refreshDeck) {
        room.cards = room.deckType === 'kanji'
          ? generateRandomKanjiCards(room.selectedGroups || [], 10)
          : generateRandomCards(KANA_SENTENCES, 10);
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

    socket.on('replay-assessment', (roomCode) => {
      const room = roomState.rooms.get(roomCode);
      if (!room) return;
      if (room.players[0]?.id !== socket.id) {
        socket.emit('assessment-action-denied', { message: 'Waiting for the host to replay this assessment.' });
        return;
      }

      startAssessment(roomCode, true);
    });

    socket.on('return-to-lobby', (roomCode) => {
      const room = roomState.rooms.get(roomCode);
      if (!room) return;
      if (room.players[0]?.id !== socket.id) {
        socket.emit('assessment-action-denied', { message: 'Waiting for the host to return the room to the lobby.' });
        return;
      }

      room.status = 'waiting';
      room.currentCardIndex = 0;
      room.players.forEach((player) => {
        player.answers = [];
        player.hintsUsed = [];
        player.ready = false;
        player.status = 'in_lobby';
        player.presence = 'online';
      });
      io.to(roomCode).emit('room-returned-to-lobby', { room });
    });

    socket.on('exit-lobby', (roomCode, callback) => {
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

    socket.on('request-assessment-action', (roomCode, action) => {
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

    socket.on('submit-answer', (roomCode, answer) => {
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
            player.ready = Boolean(currentCard && isCorrectRomajiAnswer(parsedAnswer.data, currentCard.romaji));
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
            const kanaCards = room.cards || generateRandomCards(KANA_SENTENCES, 10);
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

    socket.on('next-card', (roomCode) => {
      const room = roomState.rooms.get(roomCode);
      if (!room) return;

      room.currentCardIndex++;
      room.players.forEach((player) => {
        player.ready = false;
      });

      const kanaCards = room.cards || generateRandomCards(KANA_SENTENCES, 10);
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

    socket.on('player-ready', (roomCode) => {
      const room = roomState.rooms.get(roomCode);
      if (!room) return;

      const player = room.players.find((entry) => entry.id === socket.id);
      if (!player) return;

      player.ready = true;
      io.to(roomCode).emit('player-ready-updated', { room });
      console.log(`player-ready-updated: room=${roomCode} player=${player.id}`);
      advanceRoomIfReady(io, roomCode);
    });

    socket.on('set-player-presence', (roomCode, presence, callback) => {
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

    socket.on('use-hint', (roomCode, cardIndex) => {
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

    socket.on('leave-room', (roomCode, callback) => {
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

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      if (socket.data.connectionRefresh) {
        clearInterval(socket.data.connectionRefresh);
      }
      if (socket.data.user?.id) {
        releaseUserConnection(socket.data.user.id, socket.id).catch((releaseError) => {
          console.error('Redis user connection release error:', releaseError);
        });
      }

      if (socket.data.intentionalLeave === true) {
        delete socket.data.intentionalLeave;
        delete socket.data.intentionalLeaveRoomCode;
        return;
      }

      for (const [roomCode, room] of roomState.rooms) {
        const player = room.players.find((candidate) => candidate.id === socket.id);
        if (!player) continue;

        player.connected = false;
        player.status = 'disconnected';
        player.presence = 'offline';
        player.disconnectedAt = Date.now();
        io.to(roomCode).emit('player-left', { room, players: room.players });

        if (!room.players.some((candidate) => candidate.connected)) {
          const cleanupTimer = setTimeout(() => {
            roomState.rooms.delete(roomCode);
            roomState.roomCleanupTimers.delete(roomCode);
          }, roomState.DISCONNECT_GRACE_PERIOD_MS);
          roomState.roomCleanupTimers.set(roomCode, cleanupTimer);
        }
      }
    });
  });

  await configureRedisAdapter(io);
  return io;
}

export { getUserSocketId, getUsersPresenceStatus };
export { roomSocketData };
export { roomState };
