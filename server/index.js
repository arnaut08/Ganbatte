import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { isAllowedOrigin, PORT } from './config/env.js';
import {
  answerSchema,
  cardCountSchema,
  cardsSchema,
  roomCodeSchema,
  sessionKeySchema,
  usernameSchema,
} from './utils/validation.js';
import { generateRandomCards } from './services/card-service.js';
import { KANA_SENTENCES } from './data/kana-sentences.js';

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store rooms in memory
const rooms = new Map();
const roomCleanupTimers = new Map();
const DISCONNECT_GRACE_PERIOD_MS = 5 * 60 * 1000;

// Generate random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new room
  socket.on('create-room', (hostName, sessionKey, callback) => {
    const parsedSessionKey = sessionKeySchema.safeParse(sessionKey);
    const parsedHostName = usernameSchema.safeParse(hostName);
    if (!parsedSessionKey.success) {
      if (callback) callback({ success: false, message: 'Invalid session' });
      return;
    }
    const playerName = parsedHostName.success ? parsedHostName.data : 'Player 1';
    const roomCode = generateRoomCode();
    // generate a fresh kana-sentence card set for this room
    const cards = generateRandomCards(KANA_SENTENCES, 10);
    rooms.set(roomCode, {
      code: roomCode,
      players: [{ id: socket.id, sessionKey: parsedSessionKey.data, name: playerName, answers: [], connected: true }],
      cards,
      currentCardIndex: 0,
      status: 'waiting', // waiting, active, completed, review
    });
    socket.join(roomCode);
    socket.emit('room-created', roomCode);
    console.log(`Room created: ${roomCode}`);
    if (callback) callback(roomCode);
  });

  // Join an existing room
  socket.on('join-room', (roomCode, username, sessionKey, callback) => {
    const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
    const parsedUsername = usernameSchema.safeParse(username);
    const parsedSessionKey = sessionKeySchema.safeParse(sessionKey);
    if (!parsedRoomCode.success || !parsedUsername.success || !parsedSessionKey.success) {
      if (callback) callback({ success: false, message: 'Invalid room code or username' });
      return;
    }

    const room = rooms.get(parsedRoomCode.data);

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
      sessionKey: parsedSessionKey.data,
      name: parsedUsername.data,
      answers: [],
      connected: true,
    });
    socket.join(parsedRoomCode.data);

    // Notify all players in the room
    // Emit the full room object so all clients receive consistent
    // room structure (client expects `data.room`).
    io.to(parsedRoomCode.data).emit('player-joined', { room });

    if (callback) callback({ success: true, room });
  });

  socket.on('rejoin-room', (roomCode, username, sessionKey, callback) => {
    const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
    const parsedUsername = usernameSchema.safeParse(username);
    const parsedSessionKey = sessionKeySchema.safeParse(sessionKey);
    if (!parsedRoomCode.success || !parsedUsername.success || !parsedSessionKey.success) {
      if (callback) callback({ success: false, message: 'Invalid reconnection details' });
      return;
    }

    const room = rooms.get(parsedRoomCode.data);
    const player = room?.players.find(
      (candidate) => candidate.sessionKey === parsedSessionKey.data
        && candidate.name === parsedUsername.data,
    );
    if (!room || !player) {
      if (callback) callback({ success: false, message: 'Room session expired' });
      return;
    }

    player.id = socket.id;
    player.connected = true;
    delete player.disconnectedAt;
    const cleanupTimer = roomCleanupTimers.get(parsedRoomCode.data);
    if (cleanupTimer) {
      clearTimeout(cleanupTimer);
      roomCleanupTimers.delete(parsedRoomCode.data);
    }
    socket.join(parsedRoomCode.data);
    io.to(parsedRoomCode.data).emit('player-rejoined', { room });
    if (callback) callback({ success: true, room });
  });

  // Get room data
  socket.on('get-room', (roomCode, callback) => {
    const room = rooms.get(roomCode);
    if (room && callback) {
      callback(room);
    }
  });

  // Allow setting a custom card set for the room
  socket.on('set-cards', (roomCode, cards, callback) => {
    const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
    const parsedCards = cardsSchema.safeParse(cards);
    if (!parsedRoomCode.success || !parsedCards.success) {
      if (callback) callback({ success: false, message: 'Invalid room code or card deck' });
      return;
    }

    const room = rooms.get(parsedRoomCode.data);
    if (!room) {
      if (callback) callback({ success: false, message: 'Room not found' });
      return;
    }
    room.cards = parsedCards.data;
    io.to(parsedRoomCode.data).emit('cards-updated', { room });
    if (callback) callback({ success: true, room });
  });

  // Start assessment
  socket.on('start-assessment', (roomCode) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.status = 'active';
      room.currentCardIndex = 0;
      // reset answers and ready flags
      room.players.forEach((p) => {
        p.answers = [];
        p.ready = false;
      });
      io.to(roomCode).emit('assessment-started', { room });
    }
  });

  // Submit answer
  socket.on('submit-answer', (roomCode, answer) => {
    const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
    const parsedAnswer = answerSchema.safeParse(answer);
    if (!parsedRoomCode.success || !parsedAnswer.success) return;

    const room = rooms.get(parsedRoomCode.data);
    if (room) {
      const player = room.players.find((p) => p.id === socket.id);
      if (player) {
        // Capture the current card index at the moment of submission to
        // avoid races where the server advances the index between two
        // near-simultaneous submissions. Store the answer at that
        // captured index and emit that index back to clients. Also
        // auto-mark the submitting player as ready.
        const idx = room.currentCardIndex;
        player.answers[idx] = parsedAnswer.data;
        player.ready = true;

        // Emit the updated answer and ready state
        io.to(roomCode).emit('answer-submitted', {
          room,
          playerId: socket.id,
          cardIndex: idx,
        });
        io.to(roomCode).emit('player-ready-updated', { room });

        // If everyone has submitted for that captured index, either move
        // into review (for non-final cards) or complete the assessment
        // immediately if this was the last card. Use the room's card set
        // when available.
        const kanaCards = room.cards || generateRandomCards(KANA_SENTENCES, 10);
        const allSubmitted = room.players.length > 0 && room.players.every((p) => p.answers[idx] !== undefined);
        if (allSubmitted) {
          console.log(`both-submitted: room=${roomCode} cardIndex=${idx}`);
          // Notify clients they can review this card
          io.to(roomCode).emit('both-submitted', { room, cardIndex: idx });

          // Schedule automatic advance 3s after the second submission.
          // Use a per-room timeout so we don't schedule multiple advances.
          if (room._advanceTimeout) {
            clearTimeout(room._advanceTimeout);
          }
          room._advanceTimeout = setTimeout(() => {
            // Only advance if the room is still on the same index
            if (room.currentCardIndex === idx) {
              // If this was the last card, complete immediately
              if (idx >= kanaCards.length - 1) {
                room.status = 'completed';
                console.log(`assessment-completed (auto-advance final): room=${roomCode}`);
                io.to(roomCode).emit('assessment-completed', {
                  room,
                  results: room.players.map((p) => ({ name: p.name, answers: p.answers })),
                });
              } else {
                room.currentCardIndex++;
                // clear ready flags for next card
                room.players.forEach((p) => (p.ready = false));
                room.status = 'active';
                console.log(`card-updated (auto-advance): room=${roomCode} index=${room.currentCardIndex}`);
                io.to(roomCode).emit('card-updated', { currentCardIndex: room.currentCardIndex, room });
              }
            }
            room._advanceTimeout = null;
          }, 10000);
        }
      }
    }
  });

  // Move to next card
  socket.on('next-card', (roomCode) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.currentCardIndex++;
      // when advancing, clear ready flags
      room.players.forEach((p) => (p.ready = false));
      const kanaCards = room.cards || generateRandomCards(KANA_SENTENCES, 10);

      if (room.currentCardIndex >= kanaCards.length) {
        room.status = 'completed';
        console.log(`assessment-completed (next-card): room=${roomCode}`);
        io.to(roomCode).emit('assessment-completed', {
          room,
          results: room.players.map((p) => ({
            name: p.name,
            answers: p.answers,
          })),
        });
      } else {
        console.log(`card-updated (next-card): room=${roomCode} index=${room.currentCardIndex}`);
        io.to(roomCode).emit('card-updated', {
          currentCardIndex: room.currentCardIndex,
        });
      }
    }
  });

  // Player indicates they are ready to continue after reviewing
  socket.on('player-ready', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;
    player.ready = true;

    io.to(roomCode).emit('player-ready-updated', { room });
    console.log(`player-ready-updated: room=${roomCode} player=${player.id}`);

    // If all players are ready, advance the card
    const idx = room.currentCardIndex;
    const allReady = room.players.length > 0 && room.players.every((p) => p.ready === true);
    const kanaCards = room.cards || generateRandomCards(KANA_SENTENCES, 10);
    if (allReady) {
      room.currentCardIndex++;
      // clear ready flags for next card
      room.players.forEach((p) => (p.ready = false));

      if (room.currentCardIndex >= kanaCards.length) {
        room.status = 'completed';
        console.log(`assessment-completed (player-ready): room=${roomCode}`);
        io.to(roomCode).emit('assessment-completed', {
          room,
          results: room.players.map((p) => ({
            name: p.name,
            answers: p.answers,
          })),
        });
      } else {
        room.status = 'active';
        console.log(`card-updated (player-ready): room=${roomCode} index=${room.currentCardIndex}`);
        io.to(roomCode).emit('card-updated', {
          currentCardIndex: room.currentCardIndex,
          room,
        });
      }
    }
  });

  // Helper to advance the card when all players have submitted
  function tryAdvanceIfAllSubmitted(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;
    const kanaCards = room.cards || generateRandomCards(KANA_SENTENCES, 10);
    const idx = room.currentCardIndex;

    const allSubmitted = room.players.length > 0 && room.players.every((p) => p.answers[idx] !== undefined);

    if (!allSubmitted) return;

    // advance
    room.currentCardIndex++;

    if (room.currentCardIndex >= kanaCards.length) {
      room.status = 'completed';
      console.log(`assessment-completed (tryAdvanceIfAllSubmitted): room=${roomCode}`);
      io.to(roomCode).emit('assessment-completed', {
        room,
        results: room.players.map((p) => ({ name: p.name, answers: p.answers })),
      });
    } else {
      // when advancing, clear ready flags
      room.players.forEach((p) => (p.ready = false));
      console.log(`card-updated (tryAdvanceIfAllSubmitted): room=${roomCode} index=${room.currentCardIndex}`);
      io.to(roomCode).emit('card-updated', {
        currentCardIndex: room.currentCardIndex,
        room,
      });
    }
  }

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const [roomCode, room] of rooms) {
      const player = room.players.find((candidate) => candidate.id === socket.id);
      if (!player) continue;

      player.connected = false;
      player.disconnectedAt = Date.now();
      io.to(roomCode).emit('player-left', { players: room.players });

      if (!room.players.some((candidate) => candidate.connected)) {
        const cleanupTimer = setTimeout(() => {
          rooms.delete(roomCode);
          roomCleanupTimers.delete(roomCode);
        }, DISCONNECT_GRACE_PERIOD_MS);
        roomCleanupTimers.set(roomCode, cleanupTimer);
      }
    }
  });
});

// API endpoint to get kana cards
app.get('/api/kana-cards', (req, res) => {
  res.json(generateRandomCards(KANA_SENTENCES, 10));
});

// API endpoint to get room state (players, answers, status)
app.get('/api/rooms/:code', (req, res) => {
  const parsedCode = roomCodeSchema.safeParse(req.params.code);
  if (!parsedCode.success) {
    res.status(400).json({ error: 'Invalid room code' });
    return;
  }

  const code = parsedCode.data;
  const room = rooms.get(code);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json(room);
});

// API to generate a new set of kana sentence cards
app.post('/api/generate-cards', (req, res) => {
  const parsedCount = cardCountSchema.safeParse(req.query.count);
  if (!parsedCount.success) {
    res.status(400).json({ error: 'Count must be an integer between 1 and 25' });
    return;
  }

  const cards = generateRandomCards(KANA_SENTENCES, parsedCount.data);
  res.json({ cards });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);
  if (res.headersSent) {
    next(error);
    return;
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
