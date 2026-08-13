import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { CLIENT_ORIGINS, PORT } from './config/env.js';
import {
  answerSchema,
  cardCountSchema,
  cardsSchema,
  roomCodeSchema,
  usernameSchema,
} from './utils/validation.js';
import { generateRandomCards } from './services/card-service.js';

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store rooms in memory
const rooms = new Map();

// Generate random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new room
  socket.on('create-room', (hostNameOrCallback, maybeCallback) => {
    const callback = typeof hostNameOrCallback === 'function' ? hostNameOrCallback : maybeCallback;
    const parsedHostName = usernameSchema.safeParse(hostNameOrCallback);
    const hostName = parsedHostName.success ? parsedHostName.data : 'Player 1';
    const roomCode = generateRoomCode();
    // generate a fresh kana-sentence card set for this room
    const cards = generateRandomCards(KANA_SENTENCES, 10);
    rooms.set(roomCode, {
      code: roomCode,
      players: [{ id: socket.id, name: hostName, answers: [] }],
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
  socket.on('join-room', (roomCode, username, callback) => {
    const parsedRoomCode = roomCodeSchema.safeParse(roomCode);
    const parsedUsername = usernameSchema.safeParse(username);
    if (!parsedRoomCode.success || !parsedUsername.success) {
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

    room.players.push({ id: socket.id, name: parsedUsername.data, answers: [] });
    socket.join(parsedRoomCode.data);

    // Notify all players in the room
    // Emit the full room object so all clients receive consistent
    // room structure (client expects `data.room`).
    io.to(parsedRoomCode.data).emit('player-joined', { room });

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
        const kanaCards = room.cards || getKanaCards();
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
      const kanaCards = room.cards || getKanaCards();

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
    const kanaCards = room.cards || getKanaCards();
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
    const kanaCards = room.cards || getKanaCards();
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
    // Remove player from rooms
    for (const [roomCode, room] of rooms) {
      room.players = room.players.filter((p) => p.id !== socket.id);
      if (room.players.length === 0) {
        rooms.delete(roomCode);
      } else {
        io.to(roomCode).emit('player-left', { players: room.players });
      }
    }
  });
});

// Kana cards data
function getKanaCards() {
  return [
    { kana: 'あ', romaji: 'a', hiragana: true },
    { kana: 'い', romaji: 'i', hiragana: true },
    { kana: 'う', romaji: 'u', hiragana: true },
    { kana: 'え', romaji: 'e', hiragana: true },
    { kana: 'お', romaji: 'o', hiragana: true },
    { kana: 'か', romaji: 'ka', hiragana: true },
    { kana: 'き', romaji: 'ki', hiragana: true },
  ];
}

// A small pool of kana-only sentences (hiragana/katakana only, no kanji)
const KANA_SENTENCES = [
  { kana: 'わたしはがくせいで、きょうはレポートをかきます。', romaji: 'watashi wa gakusei de kyou wa repooto o kakimasu', english: 'I am a student, and today I will write a report.' },
  { kana: 'きのうスーパーでチーズケーキをかって、うちでたべました。', romaji: 'kinou suupaa de chiizukeeki o katte uchi de tabemashita', english: 'Yesterday I bought cheesecake at the supermarket and ate it at home.' },
  { kana: 'スマートフォンでしゃしんをとって、アルバムにいれます。', romaji: 'sumaato fon de shashin o totte arubamu ni iremasu', english: 'I take photos with my smartphone and put them in an album.' },
  { kana: 'あしたのばんごはんはパスタとサラダをつくります。', romaji: 'ashita no bangohan wa pasuta to sarada o tsukurimasu', english: 'For tomorrow dinner, I will make pasta and salad.' },
  { kana: 'ともだちとカフェでコーヒーをのみながらはなしました。', romaji: 'tomodachi to kafe de koohii o nominagara hanashimashita', english: 'I talked with a friend while drinking coffee at a cafe.' },
  { kana: 'にほんごのクラスでながいぶんしょうをよみます。', romaji: 'nihongo no kurasu de nagai bunshou o yomimasu', english: 'In Japanese class, I read long passages.' },
  { kana: 'えいがをみてから、いっしょにさんぽにいきました。', romaji: 'eiga o mite kara issho ni sanpo ni ikimashita', english: 'After watching a movie, we went for a walk together.' },
  { kana: 'コンサートでおんがくをきいて、たのしいじかんをすごしました。', romaji: 'konsaato de ongaku o kiite tanoshii jikan o sugoshimashita', english: 'I listened to music at the concert and had a great time.' },
  { kana: 'パソコンでしゅくだいをして、そのあとテレビをみました。', romaji: 'pasokon de shukudai o shite sono ato terebi o mimashita', english: 'I did homework on the computer, and then watched TV.' },
  { kana: 'にわでやさいをそだてて、あかるいうちにせいさんします。', romaji: 'niwa de yasai o sodate te akarui uchi ni seisan shimasu', english: 'I grow vegetables in the garden and harvest them while it is still bright.' },
  { kana: 'まいにちジョギングをして、からだをげんきにします。', romaji: 'mainichi jogingu o shite karada o genki ni shimasu', english: 'I jog every day to keep my body healthy.' },
  { kana: 'きょうはデパートでくだものやおみやげをかいました。', romaji: 'kyou wa depaato de kudamono ya omiyage o kaimashita', english: 'Today I bought fruit and souvenirs at the department store.' },
  { kana: 'にほんのえいがをみて、ことばをべんきょうしました。', romaji: 'nihon no eiga o mite kotoba o benkyou shimashita', english: 'I watched a Japanese movie and studied vocabulary.' },
  { kana: 'せんせいといっしょにプロジェクトについてそうだんしました。', romaji: 'sensei to issho ni purojekuto ni tsuite soudan shimashita', english: 'I discussed the project with my teacher.' },
  { kana: 'あさごはんにトーストとたまごとジュースをのみました。', romaji: 'asagohan ni toosuto to tamago to juusu o nomimashita', english: 'For breakfast, I had toast, eggs, and juice.' },
  { kana: 'フルーツやヨーグルトをたべて、からだにいいえいようをとります。', romaji: 'furuutsu ya yooguruto o tabete karada ni ii eiyou o torimasu', english: 'I eat fruit and yogurt to get good nutrition.' },
  { kana: 'きのうのよる、えいがかんでドラマティックなえいがをみました。', romaji: 'kinou no yoru eigakan de doramachikku na eiga o mimashita', english: 'Last night, I watched a dramatic movie at the cinema.' },
  { kana: 'でんしゃのまどからけしきがきれいにみえました。', romaji: 'densha no mado kara keshiki ga kirei ni miemashita', english: 'The scenery looked beautiful from the train window.' },
  { kana: 'せんたくをしてからへやをそうじしました。', romaji: 'sentaku o shite kara heya o souji shimashita', english: 'After doing laundry, I cleaned my room.' },
  { kana: 'コンピューターのプログラムをかいてテストをしました。', romaji: 'konpyuutaa no puroguramu o kaite tesuto o shimashita', english: 'I wrote a computer program and ran tests.' },
  { kana: 'あたらしいほんをよんで、いろいろなアイデアをまなびました。', romaji: 'atarashii hon o yonde iroiro na aidea o manabimashita', english: 'I read a new book and learned many ideas.' },
  { kana: 'パーティーでみんなとわらってたのしいじかんをすごしました。', romaji: 'paatii de minna to waratte tanoshii jikan o sugoshimashita', english: 'I laughed with everyone at the party and had fun.' },
  { kana: 'カメラでしゃしんをとって、あとでアルバムをつくります。', romaji: 'kamera de shashin o totte ato de arubamu o tsukurimasu', english: 'I take pictures with a camera and make an album later.' },
  { kana: 'にわのはながきれいにさいていていいにおいがしました。', romaji: 'niwa no hana ga kirei ni saite ite ii nioi ga shimashita', english: 'The flowers in the garden were blooming beautifully and smelled nice.' },
  { kana: 'サッカーのしあいをみて、えんじょうしました。', romaji: 'sakkaa no shiai o mite enjoushimashita', english: 'I watched a soccer match and got excited.' },
];

// API endpoint to get kana cards
app.get('/api/kana-cards', (req, res) => {
  res.json(getKanaCards());
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
