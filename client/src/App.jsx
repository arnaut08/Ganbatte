import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import RoomSelector from './components/RoomSelector';
import RoomLobby from './components/RoomLobby';
import Assessment from './components/Assessment';
import Results from './components/Results';
import AuthPage from './components/AuthPage';
import KanjiStudy from './components/KanjiStudy';
import AssessmentHistory from './components/AssessmentHistory';
import AppHeader from './components/layout/AppHeader';
import './App.css';
import { generateCards, getKanaCards, getRoom } from './services/api';
import { SERVER_URL } from './config';
import { supabase } from './config/supabase';

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

function clearRoomSession() {
  sessionStorage.removeItem(ROOM_SESSION_STORAGE);
  window.history.replaceState({}, document.title, window.location.pathname);
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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const authRequired = Boolean(supabase);

  const screenPriority = {
    selector: 0,
    'kanji-study': 0,
    history: 0,
    lobby: 1,
    assessment: 2,
    results: 3,
  };

  const transitionToStatus = (nextStatus) => {
    setStatus((current) => {
      if (!nextStatus) return current;
      const currentPriority = screenPriority[current] ?? 0;
      const nextPriority = screenPriority[nextStatus] ?? 0;
      if (nextPriority < currentPriority) return current;
      return nextStatus;
    });
  };

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (room?.status !== 'completed' || !room.players?.length || results) return;

    setResults(room.players.map((player) => ({
      name: player.name,
      userId: player.userId,
      answers: player.answers,
    })));
    transitionToStatus('results');
  }, [room, results]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = (params.get('room') || '').trim().toUpperCase();
    if (roomFromUrl) {
      setPrefillRoomCode(roomFromUrl);
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      auth: async (callback) => {
        const { data } = await supabase?.auth.getSession() || { data: { session: null } };
        callback({ accessToken: data.session?.access_token || null });
      },
    });

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
                transitionToStatus(response.room.status === 'active' ? 'assessment' : 'lobby');
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

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocket(null);
      setIsSocketReady(false);
    });

    newSocket.on('disconnect', () => {
      setSocket(null);
      setIsSocketReady(false);
    });

    newSocket.on('room-created', (code) => {
      setRoomCode(code);
      transitionToStatus('lobby');
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
      transitionToStatus('assessment');
    });

    newSocket.on('answer-submitted', (data) => {
      if (data && data.room) setRoom(data.room);
    });

    newSocket.on('both-submitted', (data) => {
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
      if (data && data.room) setRoom(data.room);
      const resultsArr = (data && data.results)
        ? data.results
        : data && data.room
        ? data.room.players.map((p) => ({ name: p.name, userId: p.userId, answers: p.answers }))
        : null;
      setResults(resultsArr);
      transitionToStatus('results');
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
  }, [user]);

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
        if (socket && roomCode) {
          socket.emit('set-cards', roomCode, json.cards, (resp) => {
            if (resp && resp.success) setRoom(resp.room);
            if (startAfter) {
              socket.emit('start-assessment', roomCode);
            }
          });
        } else if (startAfter) {
          transitionToStatus('assessment');
        }
      }
    } catch (e) {
      console.error('Failed to generate cards', e);
    }
  };

  // Expose a simple global hook the lobby can call (avoids prop drilling)
  useEffect(() => {
    window.generateCards = (c = 10, start = false) => handleGenerateCards(c, start);
    return () => {
      try {
        delete window.generateCards;
      } catch (e) {}
    };
  }, [socket, roomCode]);

  const getDisplayName = () => {
    const fullName = user?.user_metadata?.full_name?.trim();
    if (fullName) return fullName;

    const emailName = user?.email?.split('@')[0]?.trim();
    if (emailName) return emailName;

    return 'Player';
  };

  const handleCreateRoom = async (name) => {
    if (socket) {
      const hostName = (name || getDisplayName()).trim();
      if (!hostName) return;
      setUsername(hostName);
      socket.emit('create-room', hostName, getSessionKey(), (code) => {
        setRoomCode(code);
        saveRoomSession(code, hostName);
        getRoom(code)
          .then((room) => {
            setRoom(room);
            if (room.cards) setKanaCards(room.cards);
            transitionToStatus('lobby');
            const me = room.players.find((p) => p.id === socket.id);
            if (me) setUsername(me.name);
          })
          .catch((error) => console.error('Failed to load room:', error));
      });
    }
  };

  const handleJoinRoom = (code, name) => {
    if (socket) {
      const playerName = (name || getDisplayName()).trim();
      if (!playerName) return;

      setUsername(playerName);
      socket.emit('join-room', code, playerName, getSessionKey(), (response) => {
        if (response.success) {
          setRoomCode(code);
          saveRoomSession(code, playerName);
          setRoom(response.room);
          transitionToStatus('lobby');
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
      socket.emit('player-ready', roomCode);
    }
  };

  const handleLeaveRoom = () => {
    if (!socket || !roomCode) return;
    socket.emit('leave-room', roomCode, (response) => {
      if (!response?.success) return;
      clearRoomSession();
      setRoomCode(null);
      setRoom(null);
      setUsername('');
      setResults(null);
      setPrefillRoomCode('');
      setStatus('selector');
    });
  };

  const handleLogout = async () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsSocketReady(false);
    }

    clearRoomSession();
    sessionStorage.removeItem(SESSION_KEY_STORAGE);
    setUser(null);
    setRoomCode(null);
    setRoom(null);
    setUsername('');
    setResults(null);
    setPrefillRoomCode('');
    setStatus('selector');

    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Logout failed:', error);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleOpenKanjiStudy = () => setStatus('kanji-study');
  const handleOpenHistory = () => setStatus('history');
  const handleBackToPractice = () => setStatus('selector');

  const mainClassName = 'container mx-auto px-4 py-6';

  return (
    <div className="app-container min-h-screen">
      <AppHeader
        onHome={handleBackToPractice}
        onLogout={handleLogout}
        onOpenHistory={handleOpenHistory}
        isAuthenticated={Boolean(user)}
      />

      <main className={mainClassName}>
        {authLoading && <div className="py-12 text-center text-muted-foreground">Loading account...</div>}
        {!authLoading && authRequired && !user && <AuthPage />}
        {!authLoading && (!authRequired || user) && (
          <>
            {status === 'selector' && (
              <RoomSelector
                onCreateRoom={() => handleCreateRoom(getDisplayName())}
                onJoinRoom={(code) => handleJoinRoom(code, getDisplayName())}
                onOpenKanjiStudy={handleOpenKanjiStudy}
                prefillRoomCode={prefillRoomCode}
                isSocketReady={isSocketReady}
              />
            )}

            {status === 'kanji-study' && <KanjiStudy onBack={handleBackToPractice} />}

            {status === 'history' && <AssessmentHistory onBack={handleBackToPractice} />}

            {status === 'lobby' && room && (
              <RoomLobby
                roomCode={roomCode}
                room={room}
                onStartAssessment={handleStartAssessment}
                onLeaveRoom={handleLeaveRoom}
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
              <Results results={results} roomCode={roomCode} kanaCards={kanaCards} username={username} user={user} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
