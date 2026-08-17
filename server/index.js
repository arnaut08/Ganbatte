import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { isAllowedOrigin, PORT } from './config/env.js';
import { getSupabaseClient, isSupabaseConfigured } from './config/supabase.js';
import {
  claimUserConnection,
  configureRedisAdapter,
  getUsersPresenceStatus,
  getUserSocketId,
  refreshUserConnection,
  releaseUserConnection,
} from './config/redis.js';
import {
  answerSchema,
  cardCountSchema,
  cardsSchema,
  roomCodeSchema,
  sessionKeySchema,
  usernameSchema,
} from './utils/validation.js';
import { generateRandomCards, generateRandomKanjiCards } from './services/card-service.js';
import { KANA_SENTENCES } from './data/kana-sentences.js';
import { KANJI_CARDS, KANJI_GROUPS } from './data/kanji.js';
import { isCorrectRomajiAnswer } from './utils/romaji.js';
import { mergeFriendPresence } from './services/friend-service.js';

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

// Store rooms in memory
const rooms = new Map();
const roomCleanupTimers = new Map();
const DISCONNECT_GRACE_PERIOD_MS = 5 * 60 * 1000;

app.use(async (req, res, next) => {
  if (!isSupabaseConfigured()) {
    req.user = null;
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const { data, error } = await getSupabaseClient().auth.getUser(token);
    req.user = error || !data?.user ? null : data.user;
    return next();
  } catch (error) {
    console.error('Auth lookup failed for request:', error);
    req.user = null;
    return next();
  }
});

function buildAssessmentResults(room) {
  return room.players.map((player) => ({
    name: player.name,
    userId: player.userId ?? player.user_id ?? null,
    answers: Array.isArray(player.answers) ? player.answers : [],
    hintsUsed: Array.isArray(player.hintsUsed) ? player.hintsUsed : [],
  }));
}

// Generate random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new room
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
    const deckType = deckConfig?.type === 'kanji' ? 'kanji' : 'kana';
    const cards = deckType === 'kanji'
      ? generateRandomKanjiCards(Array.isArray(deckConfig?.groups) ? deckConfig.groups : [], 10)
      : generateRandomCards(KANA_SENTENCES, 10);
    rooms.set(roomCode, {
      code: roomCode,
      players: [{
        id: socket.id,
        userId: resolvedUserId,
        sessionKey: parsedSessionKey.data,
        name: playerName,
        answers: [],
        hintsUsed: [],
        connected: true,
      }],
      leftPlayers: [],
      cards,
      deckType,
      selectedGroups: Array.isArray(deckConfig?.groups) ? deckConfig.groups : [],
      currentCardIndex: 0,
      status: 'waiting',
    });
    socket.join(roomCode);
    socket.emit('room-created', roomCode);
    console.log(`Room created: ${roomCode} (${deckType} deck)`);
    if (callback) callback(roomCode);
  });

  // Join an existing room
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
      userId: resolvedUserId,
      sessionKey: parsedSessionKey.data,
      name: parsedUsername.data,
      answers: [],
      hintsUsed: [],
      connected: true,
    });
    socket.join(parsedRoomCode.data);

    // Notify all players in the room
    // Emit the full room object so all clients receive consistent
    // room structure (client expects `data.room`).
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

    const room = rooms.get(parsedRoomCode.data);
    let player = room?.players.find(
      (candidate) => candidate.sessionKey === parsedSessionKey.data
        && candidate.name === parsedUsername.data,
    );

    if (!room) {
      if (callback) callback({ success: false, message: 'Room session expired' });
      return;
    }

    if (!player) {
      const leftPlayer = room.leftPlayers?.find(
        (candidate) => candidate.sessionKey === parsedSessionKey.data
          && candidate.name === parsedUsername.data,
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
      };
      room.players.push(player);
      room.leftPlayers = room.leftPlayers.filter(
        (candidate) => !(candidate.sessionKey === parsedSessionKey.data && candidate.name === parsedUsername.data),
      );
    }

    player.id = socket.id;
    player.userId = resolvedUserId ?? player.userId ?? socket.data.user?.id ?? null;
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
        p.hintsUsed = [];
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
        // captured index and emit that index back to clients.
        const idx = room.currentCardIndex;
        player.answers[idx] = parsedAnswer.data;
        const currentCard = room.cards?.[idx];
        player.ready = Boolean(currentCard && isCorrectRomajiAnswer(parsedAnswer.data, currentCard.romaji));

        // Emit the updated answer and keep both players in review mode
        io.to(roomCode).emit('answer-submitted', {
          room,
          playerId: socket.id,
          cardIndex: idx,
        });
        io.to(roomCode).emit('player-ready-updated', { room });

        // Both submissions reveal the review state. Advancement happens
        // only after every player explicitly presses the ready button.
        const allSubmitted = room.players.length > 0 && room.players.every((p) => p.answers[idx] !== undefined);
        if (allSubmitted) {
          console.log(`both-submitted: room=${roomCode} cardIndex=${idx}`);
          const kanaCards = room.cards || generateRandomCards(KANA_SENTENCES, 10);
          const isFinalCard = idx >= kanaCards.length - 1;
          const allAnswersCorrect = room.players.every((player) => player.ready === true);
          if (isFinalCard && allAnswersCorrect) {
            room.status = 'completed';
            io.to(roomCode).emit('assessment-completed', {
              room,
              results: buildAssessmentResults(room),
            });
          } else {
            io.to(roomCode).emit('both-submitted', { room, cardIndex: idx });
            advanceRoomIfReady(roomCode);
          }
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
          results: buildAssessmentResults(room),
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
    advanceRoomIfReady(roomCode);
  });

  socket.on('use-hint', (roomCode, cardIndex) => {
    const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
    if (!parsedRoomCode.success) return;

    const room = rooms.get(parsedRoomCode.data);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
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

  function advanceRoomIfReady(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

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
        console.log(`assessment-completed (ready): room=${roomCode}`);
        io.to(roomCode).emit('assessment-completed', {
          room,
          results: buildAssessmentResults(room),
        });
      } else {
        room.status = 'active';
        console.log(`card-updated (ready): room=${roomCode} index=${room.currentCardIndex}`);
        io.to(roomCode).emit('card-updated', {
          currentCardIndex: room.currentCardIndex,
          room,
        });
      }
    }
  }

  socket.on('leave-room', (roomCode, callback) => {
    const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
    if (!parsedRoomCode.success) {
      if (callback) callback({ success: false, message: 'Invalid room code' });
      return;
    }

    const normalizedRoomCode = parsedRoomCode.data;
    const room = rooms.get(normalizedRoomCode);
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

    const cleanupTimer = roomCleanupTimers.get(normalizedRoomCode);
    if (cleanupTimer) {
      clearTimeout(cleanupTimer);
      roomCleanupTimers.delete(normalizedRoomCode);
    }

    if (room.players.length === 0 && room.leftPlayers.length === 0) {
      rooms.delete(normalizedRoomCode);
    } else {
      io.to(normalizedRoomCode).emit('player-left', { room, players: room.players });
    }

    if (callback) callback({ success: true });
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
        results: buildAssessmentResults(room),
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

    for (const [roomCode, room] of rooms) {
      const player = room.players.find((candidate) => candidate.id === socket.id);
      if (!player) continue;

      player.connected = false;
      player.disconnectedAt = Date.now();
      io.to(roomCode).emit('player-left', { room, players: room.players });

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

async function requireAuth(req, res) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }

  return req.user;
}

app.get('/api/friends', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabaseClient();
  const { data: friendshipRows, error: friendshipsError } = await supabase
    .from('friendships')
    .select('friend_id, profiles!friendships_friend_id_fkey(id, display_name)')
    .eq('user_id', user.id);

  if (friendshipsError) {
    console.error('Failed to load friendships:', friendshipsError);
    res.status(500).json({ error: 'Unable to load friends.' });
    return;
  }

  const friendRows = (friendshipRows || [])
    .map((row) => ({
      id: row.friend_id,
      user_id: row.friend_id,
      ...row.profiles,
      profile: row.profiles,
    }))
    .filter((friend) => friend?.id || friend?.user_id);

  const friendIds = friendRows.map((friend) => friend.id).filter(Boolean);
  if (friendIds.length === 0) {
    res.json([]);
    return;
  }

  const onlineIds = await getUsersPresenceStatus(friendIds);
  const friends = mergeFriendPresence(friendRows, onlineIds);
  res.json(friends);
});

app.get('/api/users/search', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const searchTerm = String(req.query.q || '').trim();
  if (!searchTerm) {
    res.json([]);
    return;
  }

  const supabase = getSupabaseClient();
  const { data: visibleProfiles, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .ilike('display_name', `%${searchTerm}%`)
    .neq('id', user.id)
    .limit(12);

  if (error) {
    console.error('Failed to search users:', error);
    res.status(500).json({ error: 'Unable to search users.' });
    return;
  }

  const onlineIds = await getUsersPresenceStatus((visibleProfiles || []).map((person) => person.id));
  const results = mergeFriendPresence((visibleProfiles || []).map((person) => ({
    ...person,
    id: person.id,
    user_id: person.id,
    profile: person,
  })), onlineIds);
  res.json(results);
});

app.get('/api/friend-requests', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabaseClient();
  const { data: requests, error } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id, status, created_at, profiles!friend_requests_sender_id_fkey(id, display_name)')
    .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load friend requests:', error);
    res.status(500).json({ error: 'Unable to load friend requests.' });
    return;
  }

  const onlineIds = await getUsersPresenceStatus((requests || []).map((request) => request.sender_id));
  const results = (requests || []).map((request) => ({
    id: request.id,
    sender_id: request.sender_id,
    receiver_id: request.receiver_id,
    status: request.status,
    created_at: request.created_at,
    direction: request.sender_id === user.id ? 'outgoing' : 'incoming',
    sender: {
      id: request.profiles?.id,
      user_id: request.profiles?.id,
      display_name: request.profiles?.display_name,
      online: onlineIds.includes(request.sender_id),
    },
  }));

  res.json(results);
});

app.post('/api/friend-requests/:userId', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const targetUserId = String(req.params.userId || '').trim();
  if (!targetUserId || targetUserId === user.id) {
    res.status(400).json({ error: 'Friend must be a different user.' });
    return;
  }

  const supabase = getSupabaseClient();
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', targetUserId)
    .maybeSingle();

  if (profileError || !profileData) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  // Check if they are already friends
  const { data: existingFriendship, error: friendshipError } = await supabase
    .from('friendships')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('friend_id', targetUserId)
    .maybeSingle();

  if (friendshipError) {
    console.error('Failed to check friendship:', friendshipError);
    res.status(500).json({ error: 'Unable to send friend request.' });
    return;
  }

  if (existingFriendship) {
    res.status(409).json({ error: 'You are already friends with this user.' });
    return;
  }

  // Check for an existing pending request in either direction
  const { data: existingRequest, error: requestError } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id, status')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
    .maybeSingle();

  if (requestError) {
    console.error('Failed to check friend request:', requestError);
    res.status(500).json({ error: 'Unable to send friend request.' });
    return;
  }

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      res.status(409).json({ error: 'A friend request already exists.' });
      return;
    }

    // Re-send a previously rejected request
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', existingRequest.id);

    if (updateError) {
      console.error('Failed to update friend request:', updateError);
      res.status(500).json({ error: 'Unable to send friend request.' });
      return;
    }

    // Notify the receiver via socket
    const receiverSocketId = await getUserSocketId(targetUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('friend-request-received', {
        requestId: existingRequest.id,
        sender: {
          id: user.id,
          user_id: user.id,
          display_name: profileData.display_name,
        },
      });
    }

    res.json({ success: true, requestId: existingRequest.id });
    return;
  }

  // Create a new friend request
  const { data: newRequest, error: insertError } = await supabase
    .from('friend_requests')
    .insert({ sender_id: user.id, receiver_id: targetUserId, status: 'pending' })
    .select('id')
    .single();

  if (insertError) {
    console.error('Failed to create friend request:', insertError);
    res.status(500).json({ error: 'Unable to send friend request.' });
    return;
  }

  // Notify the receiver via socket
  const receiverSocketId = await getUserSocketId(targetUserId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit('friend-request-received', {
      requestId: newRequest.id,
      sender: {
        id: user.id,
        user_id: user.id,
        display_name: profileData.display_name,
      },
    });
  }

  res.json({ success: true, requestId: newRequest.id });
});

app.post('/api/friend-requests/:requestId/accept', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const requestId = String(req.params.requestId || '').trim();
  if (!requestId) {
    res.status(400).json({ error: 'Invalid request.' });
    return;
  }

  const supabase = getSupabaseClient();
  const { data: request, error: requestError } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id, status')
    .eq('id', requestId)
    .eq('receiver_id', user.id)
    .maybeSingle();

  if (requestError) {
    console.error('Failed to load friend request:', requestError);
    res.status(500).json({ error: 'Unable to accept friend request.' });
    return;
  }

  if (!request) {
    res.status(404).json({ error: 'Friend request not found.' });
    return;
  }

  if (request.status !== 'pending') {
    res.status(409).json({ error: 'This friend request is no longer pending.' });
    return;
  }

  // Create the friendship (both directions)
  const rows = [
    { user_id: request.sender_id, friend_id: request.receiver_id },
    { user_id: request.receiver_id, friend_id: request.sender_id },
  ];

  const { error: friendshipError } = await supabase
    .from('friendships')
    .upsert(rows, { onConflict: 'user_id,friend_id', ignoreDuplicates: true });

  if (friendshipError) {
    console.error('Failed to create friendship:', friendshipError);
    res.status(500).json({ error: 'Unable to accept friend request.' });
    return;
  }

  // Mark the request as accepted
  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (updateError) {
    console.error('Failed to update friend request:', updateError);
    res.status(500).json({ error: 'Unable to accept friend request.' });
    return;
  }

  // Get the sender's profile for the response
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', request.sender_id)
    .maybeSingle();

  const onlineIds = await getUsersPresenceStatus([request.sender_id]);

  // Notify the sender that their request was accepted
  const senderSocketId = await getUserSocketId(request.sender_id);
  if (senderSocketId) {
    io.to(senderSocketId).emit('friend-request-accepted', {
      requestId,
      friend: {
        id: user.id,
        user_id: user.id,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      },
    });
  }

  res.json({
    success: true,
    friend: {
      ...(senderProfile || {}),
      user_id: request.sender_id,
      id: request.sender_id,
      online: onlineIds.includes(request.sender_id),
    },
  });
});

app.post('/api/friend-requests/:requestId/reject', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const requestId = String(req.params.requestId || '').trim();
  if (!requestId) {
    res.status(400).json({ error: 'Invalid request.' });
    return;
  }

  const supabase = getSupabaseClient();
  const { data: request, error: requestError } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id, status')
    .eq('id', requestId)
    .eq('receiver_id', user.id)
    .maybeSingle();

  if (requestError) {
    console.error('Failed to load friend request:', requestError);
    res.status(500).json({ error: 'Unable to reject friend request.' });
    return;
  }

  if (!request) {
    res.status(404).json({ error: 'Friend request not found.' });
    return;
  }

  if (request.status !== 'pending') {
    res.status(409).json({ error: 'This friend request is no longer pending.' });
    return;
  }

  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (updateError) {
    console.error('Failed to reject friend request:', updateError);
    res.status(500).json({ error: 'Unable to reject friend request.' });
    return;
  }

  // Notify the sender that their request was rejected
  if (request?.sender_id) {
    const senderSocketId = await getUserSocketId(request.sender_id);
    if (senderSocketId) {
      io.to(senderSocketId).emit('friend-request-rejected', {
        requestId,
        senderId: request.sender_id,
        receiver: {
          id: user.id,
          user_id: user.id,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        },
      });
    }
  }

  res.json({ success: true });
});

app.delete('/api/friends/:userId', async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const targetUserId = String(req.params.userId || '').trim();
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`);

  if (error) {
    console.error('Failed to remove friendship:', error);
    res.status(500).json({ error: 'Unable to remove friend.' });
    return;
  }

  res.json({ success: true });
});

// API endpoint to get kana cards
app.get('/api/kana-cards', (req, res) => {
  res.json(generateRandomCards(KANA_SENTENCES, 10));
});

app.get('/api/kanji-cards', (req, res) => {
  res.json({ groups: KANJI_GROUPS, cards: KANJI_CARDS });
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

  const rawType = String(req.query.type || 'kana').toLowerCase();
  const deckType = rawType === 'kanji' ? 'kanji' : 'kana';
  const rawGroups = Array.isArray(req.query.groups)
    ? req.query.groups
    : typeof req.query.groups === 'string'
      ? [req.query.groups]
      : [];

  const cards = deckType === 'kanji'
    ? generateRandomKanjiCards(rawGroups, parsedCount.data)
    : generateRandomCards(KANA_SENTENCES, parsedCount.data);

  res.json({ type: deckType, groups: rawGroups, cards });
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

await configureRedisAdapter(io);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
