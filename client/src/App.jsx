import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import RoomSelector from './components/RoomSelector';
import RoomLobby from './components/RoomLobby';
import Assessment from './components/Assessment';
import Results from './components/Results';
import AppHeader from './components/layout/AppHeader';
import './App.css';
import { generateCards, getKanaCards, getRoom } from './services/api';
import { SERVER_URL } from './config';

const SESSION_KEY_STORAGE = 'ganbatte-session-key';
const ROOM_SESSION_STORAGE = 'ganbatte-room-session';

function getSessionKey() {
  const existingKey = sessionStorage.getItem(SESSION_KEY_STORAGE);
  if (existingKey) return existingKey;
  const sessionKey = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY_STORAGE, sessionKey);
  return sessionKey;
}

function saveRoomSession(roomCode, username) {
  sessionStorage.setItem(ROOM_SESSION_STORAGE, JSON.stringify({ roomCode, username }));
}

function App() {
  const [socket, setSocket] = useState(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [room, setRoom] = useState(null);
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('selector'); // selector, lobby, assessment, results
  const [kanaCards, setKanaCards] = useState([]);
  const [results, setResults] = useState(null);
  const [prefillRoomCode, setPrefillRoomCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = (params.get('room') || '').trim().toUpperCase();
    if (roomFromUrl) {
      setPrefillRoomCode(roomFromUrl);
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SERVER_URL);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setSocket(newSocket);
      setIsSocketReady(true);
      const savedSession = sessionStorage.getItem(ROOM_SESSION_STORAGE);
      if (savedSession) {
        try {
          const { roomCode: savedRoomCode, username: savedUsername } = JSON.parse(savedSession);
          if (savedRoomCode && savedUsername) {
            newSocket.emit('rejoin-room', savedRoomCode, savedUsername, getSessionKey(), (response) => {
              if (response?.success) {
                setRoomCode(savedRoomCode);
                setUsername(savedUsername);
                setRoom(response.room);
                setKanaCards(response.room.cards || []);
                setStatus(response.room.status === 'active' ? 'assessment' : 'lobby');
              } else {
                sessionStorage.removeItem(ROOM_SESSION_STORAGE);
              }
            });
          }
        } catch {
          sessionStorage.removeItem(ROOM_SESSION_STORAGE);
        }
      }
    });

    newSocket.on('player-rejoined', (data) => {
      if (data?.room) {
        setRoom(data.room);
        setKanaCards(data.room.cards || []);
      }
    });

    newSocket.on('disconnect', () => {
      setSocket(null);
      setIsSocketReady(false);
    });

    newSocket.on('room-created', (code) => {
      setRoomCode(code);
      setStatus('lobby');
    });

    newSocket.on('player-joined', (data) => {
      if (data && data.room) {
        setRoom(data.room);
        if (data.room.cards) setKanaCards(data.room.cards);
      }
    });

    newSocket.on('assessment-started', (data) => {
      if (data && data.room) {
        setRoom(data.room);
        if (data.room.cards) setKanaCards(data.room.cards);
      }
      setStatus('assessment');
    });

    newSocket.on('answer-submitted', (data) => {
      // Server now sends the full room object on answer submission
      if (data && data.room) setRoom(data.room);
    });

    newSocket.on('both-submitted', (data) => {
      // Enter review state where players can see feedback and mark ready
      if (data && data.room) {
        setRoom(data.room);
        if (data.room.cards) setKanaCards(data.room.cards);
      }
    });

    newSocket.on('player-ready-updated', (data) => {
      if (data && data.room) setRoom(data.room);
    });

    newSocket.on('cards-updated', (data) => {
      if (data && data.room) {
        setRoom(data.room);
        if (data.room.cards) setKanaCards(data.room.cards);
      }
    });

    newSocket.on('card-updated', (data) => {
      if (data && data.room) setRoom(data.room);
      else
        setRoom((prev) => ({
          ...prev,
          currentCardIndex: data.currentCardIndex,
        }));
    });

    newSocket.on('assessment-completed', (data) => {
      console.log('assessment-completed event:', data);
      // Accept either `results` or fallback to `room.players` if the
      // server sent only the room object. This makes the client more
      // robust to different payload shapes and will ensure the
      // Results component receives data.
      if (data && data.room) setRoom(data.room);
      const resultsArr = (data && data.results)
        ? data.results
        : data && data.room
        ? data.room.players.map((p) => ({ name: p.name, answers: p.answers }))
        : null;
      setResults(resultsArr);
      setStatus('results');
    });

    newSocket.on('player-left', (data) => {
      setRoom((prev) => ({
        ...prev,
        players: data.players,
      }));
    });

    return () => {
      setIsSocketReady(false);
      newSocket.disconnect();
    };
  }, []);

  // Fetch kana cards
  useEffect(() => {
    getKanaCards()
      .then((data) => setKanaCards(data))
      .catch((err) => console.error('Error fetching kana cards:', err));
  }, []);

  const handleGenerateCards = async (count = 10, startAfter = false) => {
    try {
      const json = await generateCards(count);
      if (json.cards) {
        setKanaCards(json.cards);
        // If in a room, set the room's card set on the server
        if (socket && roomCode) {
          socket.emit('set-cards', roomCode, json.cards, (resp) => {
            if (resp && resp.success) setRoom(resp.room);
            if (startAfter) {
              socket.emit('start-assessment', roomCode);
            }
          });
        } else if (startAfter) {
          // no room — just update local cards
          setStatus('assessment');
        }
      }
    } catch (e) {
      console.error('Failed to generate cards', e);
    }
  };

  // Expose a simple global hook the lobby can call (avoids prop drilling)
  // This is small and acceptable for this simple app; in a larger app
  // we'd pass the handler through props or a context provider.
  useEffect(() => {
    window.generateCards = (c = 10, start = false) => handleGenerateCards(c, start);
    return () => {
      try {
        delete window.generateCards;
      } catch (e) {}
    };
  }, [socket, roomCode]);

  const handleCreateRoom = async (name) => {
    if (socket) {
      const hostName = (name || '').trim();
      if (!hostName) return;
      setUsername(hostName);
      socket.emit('create-room', hostName, getSessionKey(), (code) => {
        setRoomCode(code);
        saveRoomSession(code, hostName);
        // Immediately request the full room from server so the host
        // has the same room object structure as a joined player and
        // the lobby can render correctly.
          getRoom(code)
            .then((room) => {
              setRoom(room);
              if (room.cards) setKanaCards(room.cards);
              setStatus('lobby');
              const me = room.players.find((p) => p.id === socket.id);
              if (me) setUsername(me.name);
            })
            .catch((error) => console.error('Failed to load room:', error));
      });
    }
  };

  const handleJoinRoom = (code, name) => {
    if (socket) {
      setUsername(name);
      socket.emit('join-room', code, name, getSessionKey(), (response) => {
        if (response.success) {
          setRoomCode(code);
          saveRoomSession(code, name);
          setRoom(response.room);
          setStatus('lobby');
        } else {
          alert(response.message);
        }
      });
    }
  };

  const handleStartAssessment = () => {
    if (socket && roomCode) {
      socket.emit('start-assessment', roomCode);
    }
  };

  const handleSubmitAnswer = (answer) => {
    if (socket && roomCode) {
      socket.emit('submit-answer', roomCode, answer);
    }
  };

  const handleNextCard = () => {
    if (socket && roomCode) {
      // When a player clicks "I'm ready", emit player-ready; the
      // server will advance only when all players are ready.
      socket.emit('player-ready', roomCode);
    }
  };

  return (
    <div className="app">
      <AppHeader />

      <main className="app-main">
        {status === 'selector' && (
          <RoomSelector
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            prefillRoomCode={prefillRoomCode}
            isSocketReady={isSocketReady}
          />
        )}

        {status === 'lobby' && room && (
          <RoomLobby
            roomCode={roomCode}
            room={room}
            onStartAssessment={handleStartAssessment}
            currentSocketId={socket?.id || ''}
          />
        )}

        {status === 'assessment' && room && (
          <Assessment
            room={room}
            kanaCards={kanaCards}
            onSubmitAnswer={handleSubmitAnswer}
            onNextCard={handleNextCard}
            username={username}
          />
        )}

        {status === 'results' && results && (
          <Results results={results} roomCode={roomCode} kanaCards={kanaCards} />
        )}
      </main>
    </div>
  );
}

export default App;
