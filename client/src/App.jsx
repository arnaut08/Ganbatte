import { useState, useEffect, useRef } from 'react';
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

function readRoomSession() {
  const raw = sessionStorage.getItem(ROOM_SESSION_STORAGE);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearRoomQueryParam() {
  const url = new URL(window.location.href);
  url.searchParams.delete('room');
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

function clearRoomSession() {
  sessionStorage.removeItem(ROOM_SESSION_STORAGE);
  clearRoomQueryParam();
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
  const [roomResumeAvailable, setRoomResumeAvailable] = useState(false);
  const [toast, setToast] = useState(null);
  const statusRef = useRef(status);
  const inviteJoinAttemptedRef = useRef(false);
  const authRequired = Boolean(supabase);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const savedSession = readRoomSession();
    const hasSavedRoom = Boolean(roomCode || savedSession?.roomCode);
    setRoomResumeAvailable(Boolean(hasSavedRoom && !ROOM_VIEW_STATUSES.includes(status)));
  }, [roomCode, room, status]);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const screenPriority = {
    selector: 0,
    'kanji-study': 0,
    history: 0,
    lobby: 1,
    assessment: 2,
    results: 3,
  };

  const ROOM_VIEW_STATUSES = ['lobby', 'assessment', 'results'];

  const transitionToStatus = (nextStatus) => {
    setStatus((current) => {
      if (!nextStatus) return current;

      const currentPriority = screenPriority[current] ?? 0;
      const nextPriority = screenPriority[nextStatus] ?? 0;

      if (nextPriority < currentPriority) return current;

      const isRoomScreen = ['lobby', 'assessment', 'results'].includes(current);
      const isRoomTransition = ['lobby', 'assessment', 'results'].includes(nextStatus);

      if (!isRoomScreen && current !== 'selector' && isRoomTransition) {
        return current;
      }

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
    const savedSession = readRoomSession();
    const savedRoomCode = (savedSession?.roomCode || '').trim().toUpperCase();

    if (savedRoomCode) {
      setPrefillRoomCode(savedRoomCode);
    }
  }, []);

  useEffect(() => {
    if (!socket || !isSocketReady || inviteJoinAttemptedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = (params.get('room') || '').trim().toUpperCase();

    if (!roomFromUrl) return;

    inviteJoinAttemptedRef.current = true;
    handleJoinRoom(roomFromUrl, getDisplayName());
  }, [socket, isSocketReady, user]);

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

      const savedSession = readRoomSession();
      const shouldRestoreRoomSession = ROOM_VIEW_STATUSES.includes(statusRef.current) && Boolean(savedSession?.roomCode && savedSession?.username);

      if (!shouldRestoreRoomSession) {
        return;
      }

      try {
        const { roomCode: savedRoomCode, username: savedUsername } = savedSession;
        if (savedRoomCode && savedUsername) {
          newSocket.emit('rejoin-room', savedRoomCode, savedUsername, getSessionKey(), user?.id, (response) => {
            if (response?.success) {
              setRoomCode(savedRoomCode);
              setUsername(savedUsername);
              setRoom(response.room);
              setKanaCards(response.room.cards || []);
              transitionToStatus(response.room.status === 'active' ? 'assessment' : 'lobby');
            } else {
              clearRoomSession();
            }
          });
        }
      } catch {
        clearRoomSession();
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

      const rawResults = (data && data.results)
        ? data.results
        : (data && data.room && Array.isArray(data.room.players))
          ? data.room.players
          : [];

      const resultsArr = rawResults.map((player) => ({
        name: player.name,
        userId: player.userId ?? player.user_id ?? null,
        answers: Array.isArray(player.answers) ? player.answers : [],
      }));
      console.log("resultsArr", resultsArr, rawResults);
      setResults(resultsArr);
      transitionToStatus('results');
    });

    newSocket.on('player-left', (data) => {
      const roomData = data?.room ?? { players: data?.players ?? [] };
      setRoom((prev) => {
        const nextRoom = roomData && Array.isArray(roomData.players)
          ? { ...(prev ?? {}), ...roomData, players: roomData.players }
          : prev;

        if (nextRoom && Array.isArray(roomData.players) && roomData.players.length <= 1) {
          setToast({ message: 'Your opponent left the room.', type: 'warning' });
        }

        return nextRoom;
      });
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

  const handleCreateRoom = async (name, deckOptions = {}) => {
    if (socket) {
      const hostName = (name || getDisplayName()).trim();
      if (!hostName) return;
      const normalizedDeckOptions = {
        type: deckOptions?.type === 'kanji' ? 'kanji' : 'kana',
        groups: Array.isArray(deckOptions?.groups) ? deckOptions.groups : [],
      };
      setUsername(hostName);
      setPrefillRoomCode('');
      clearRoomQueryParam();
      socket.emit('create-room', hostName, getSessionKey(), user?.id, normalizedDeckOptions, (code) => {
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
      setPrefillRoomCode('');
      clearRoomQueryParam();
      socket.emit('join-room', code, playerName, getSessionKey(), user?.id, (response) => {
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
      if (response?.success && roomCode && username) {
        saveRoomSession(roomCode, username);
      }
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

  const preserveRoomSessionForNavigation = (nextStatus) => {
    const storedSession = readRoomSession();
    const activeRoomCode = roomCode || storedSession?.roomCode;
    const activeUsername = username || storedSession?.username || '';

    if (socket && activeRoomCode) {
      socket.emit('leave-room', activeRoomCode, (response) => {
        if (response?.success && activeRoomCode && activeUsername) {
          saveRoomSession(activeRoomCode, activeUsername);
        }
        setRoomCode(null);
        setRoom(null);
        setUsername('');
        setResults(null);
        setPrefillRoomCode('');
        setStatus(nextStatus);
      });
      return;
    }

    if (activeRoomCode && activeUsername) {
      saveRoomSession(activeRoomCode, activeUsername);
    }

    setRoomCode(activeRoomCode || null);
    setRoom(null);
    setUsername(activeUsername);
    setResults(null);
    setPrefillRoomCode('');
    setStatus(nextStatus);
  };

  const handleDeclineRoomResume = () => {
    clearRoomSession();
    setRoomCode(null);
    setRoom(null);
    setUsername('');
    setResults(null);
    setPrefillRoomCode('');
    setStatus('selector');
  };

  const handleOpenKanjiStudy = () => {
    preserveRoomSessionForNavigation('kanji-study');
  };

  const handleOpenHistory = () => {
    preserveRoomSessionForNavigation('history');
  };

  const handleBackToPractice = () => {
    preserveRoomSessionForNavigation('selector');
  };

  const handleReturnToRoom = () => {
    const savedSession = readRoomSession();
    if (room && roomCode) {
      setStatus(room.status === 'active' ? 'assessment' : 'lobby');
      return;
    }

    if (!savedSession) {
      setStatus('selector');
      return;
    }

    try {
      const { roomCode: savedRoomCode, username: savedUsername } = savedSession;
      if (!savedRoomCode || !savedUsername || !socket) {
        setStatus('selector');
        return;
      }

      setRoomCode(savedRoomCode);
      setUsername(savedUsername);
      socket.emit('rejoin-room', savedRoomCode, savedUsername, getSessionKey(), user?.id, (response) => {
        if (!response?.success) {
          clearRoomSession();
          setRoomCode(null);
          setRoom(null);
          setUsername('');
          setStatus('selector');
          return;
        }

        setRoom(response.room);
        setKanaCards(response.room.cards || []);
        setStatus(response.room.status === 'active' ? 'assessment' : 'lobby');
      });
    } catch {
      setStatus('selector');
    }
  };

  const mainClassName = 'container mx-auto px-4 py-6';

  return (
    <div className="app-container min-h-screen">
      {toast && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 max-w-sm rounded-md border border-amber-500/30 bg-slate-900/95 px-4 py-3 text-sm text-white shadow-lg backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

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
                onCreateRoom={(deckOptions) => handleCreateRoom(getDisplayName(), deckOptions)}
                onJoinRoom={(code) => handleJoinRoom(code, getDisplayName())}
                onOpenKanjiStudy={handleOpenKanjiStudy}
                onReturnToRoom={handleReturnToRoom}
                onDeclineRoomResume={handleDeclineRoomResume}
                prefillRoomCode={prefillRoomCode}
                isSocketReady={isSocketReady}
                canReturnToRoom={roomResumeAvailable}
                roomCode={roomCode || readRoomSession()?.roomCode || ''}
                resumeUsername={readRoomSession()?.username || username}
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
