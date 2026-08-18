import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import RoomSelector from './components/RoomSelector';
import RoomLobby from './components/RoomLobby';
import Assessment from './components/Assessment';
import Results from './components/Results';
import AuthPage from './components/AuthPage';
import KanjiStudy from './components/KanjiStudy';
import AssessmentHistory from './components/AssessmentHistory';
import GrammarPractice from './components/GrammarPractice';
import AppHeader from './components/layout/AppHeader';
import FriendsPanel from './components/FriendsPanel';
import './App.css';
import {
  acceptFriendRequest,
  generateCards,
  generateGrammarAssessment,
  getFriendRequests,
  getFriends,
  getKanaCards,
  getRoom,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} from './services/api';
import { SERVER_URL } from './config';
import { supabase } from './config/supabase';
import { createFriendRefreshGuard } from './utils/friendRefresh';

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
  const [friends, setFriends] = useState([]);
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [isFriendSearchLoading, setIsFriendSearchLoading] = useState(false);
  const [grammarQuestions, setGrammarQuestions] = useState([]);
  const [isPreparingAssessment, setIsPreparingAssessment] = useState(false);
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
    friends: 0,
    'kanji-study': 0,
    'grammar-practice': 0,
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

  const friendRefreshGuardRef = useRef(createFriendRefreshGuard());

  const refreshFriends = useCallback(() => {
    if (!user) {
      setFriends([]);
      setFriendSearchResults([]);
      return;
    }

    if (!friendRefreshGuardRef.current(user.id, 'friends')) {
      return;
    }

    getFriends()
      .then((data) => setFriends(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error('Failed to fetch friends:', error);
      });
  }, [user]);

  const refreshFriendRequests = useCallback(() => {
    if (!user) {
      setFriendRequests([]);
      return;
    }

    if (!friendRefreshGuardRef.current(user.id, 'requests')) {
      return;
    }

    getFriendRequests()
      .then((data) => setFriendRequests(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error('Failed to fetch friend requests:', error);
      });
  }, [user]);

  const refreshFriendData = useCallback(() => {
    if (!user) {
      setFriends([]);
      setFriendSearchResults([]);
      setFriendRequests([]);
      friendRefreshGuardRef.current?.reset?.();
      return;
    }

    if (!friendRefreshGuardRef.current(user.id, 'combined')) {
      return;
    }

    Promise.all([
      getFriends().then((data) => (Array.isArray(data) ? data : [])),
      getFriendRequests().then((data) => (Array.isArray(data) ? data : [])),
    ])
      .then(([nextFriends, nextRequests]) => {
        setFriends(nextFriends);
        setFriendRequests(nextRequests);
      })
      .catch((error) => {
        console.error('Failed to refresh friends and requests:', error);
      });
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFriends([]);
      setFriendSearchResults([]);
      setFriendRequests([]);
      friendRefreshGuardRef.current?.reset?.();
      return undefined;
    }

    refreshFriendData();

    const presenceRefreshTimer = window.setInterval(() => {
      refreshFriendData();
    }, 30 * 1000);

    return () => {
      window.clearInterval(presenceRefreshTimer);
    };
  }, [refreshFriendData, user]);

  const handleSearchUsers = useCallback(async (query) => {
    if (!user) {
      setFriendSearchResults([]);
      return;
    }

    const trimmed = String(query || '').trim();
    setIsFriendSearchLoading(Boolean(trimmed));

    try {
      const results = trimmed ? await searchUsers(trimmed) : [];
      setFriendSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Failed to search users:', error);
      setFriendSearchResults([]);
    } finally {
      setIsFriendSearchLoading(false);
    }
  }, [user]);

  const handleSendFriendRequest = async (userId) => {
    if (!userId || !user) return;

    try {
      await sendFriendRequest(userId);
      setToast({ message: 'Friend request sent.', type: 'success' });
      refreshFriendRequests();
    } catch (error) {
      console.error('Failed to send friend request:', error);
      setToast({ message: error.message || 'Unable to send friend request.', type: 'error' });
    }
  };

  const handleAcceptFriendRequest = async (requestId) => {
    if (!requestId) return;

    try {
      const response = await acceptFriendRequest(requestId);
      const nextFriend = response?.friend;
      if (nextFriend) {
        setFriends((current) => {
          if (!current.some((friend) => (friend.user_id || friend.id) === (nextFriend.user_id || nextFriend.id))) {
            return [...current, nextFriend];
          }
          return current;
        });
      }
      setToast({ message: 'Friend request accepted.', type: 'success' });
      setFriendRequests((current) => current.filter((request) => request.id !== requestId));
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      setToast({ message: error.message || 'Unable to accept friend request.', type: 'error' });
    }
  };

  const handleRejectFriendRequest = async (requestId) => {
    if (!requestId) return;

    try {
      await rejectFriendRequest(requestId);
      setToast({ message: 'Friend request rejected.', type: 'warning' });
      setFriendRequests((current) => current.filter((request) => request.id !== requestId));
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      setToast({ message: error.message || 'Unable to reject friend request.', type: 'error' });
    }
  };

  const handleRemoveFriend = async (userId) => {
    if (!userId) return;

    try {
      await removeFriend(userId);
      setFriends((current) => current.filter((friend) => (friend.user_id || friend.id) !== userId));
      setToast({ message: 'Friend removed.', type: 'warning' });
    } catch (error) {
      console.error('Failed to remove friend:', error);
      setToast({ message: error.message || 'Unable to remove friend.', type: 'error' });
    }
  };

  useEffect(() => {
    if (room?.status !== 'completed' || !room.players?.length || results) return;

    setResults(room.players.map((player) => ({
      name: player.name,
      userId: player.userId,
      answers: player.answers,
      hintsUsed: player.hintsUsed || [],
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
    if (authRequired && authLoading) return undefined;
    if (authRequired && !user) return undefined;

    const newSocket = io(SERVER_URL, {
      auth: async (callback) => {
        const { data } = await supabase?.auth.getSession() || { data: { session: null } };
        callback({ accessToken: data.session?.access_token || null });
      },
      reconnection: !authRequired || Boolean(user),
      reconnectionAttempts: authRequired ? 2 : 5,
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
              const nextRoom = response.room;
              setRoomCode(savedRoomCode);
              setUsername(savedUsername);
              setRoom(nextRoom);
              setKanaCards(nextRoom.cards || []);

              if (nextRoom.status === 'completed') {
                setResults(normalizeRoomResults(nextRoom.players));
                transitionToStatus('results');
                return;
              }

              transitionToStatus(nextRoom.status === 'active' ? 'assessment' : 'lobby');
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
      friendRefreshGuardRef.current = createFriendRefreshGuard();
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
      setIsPreparingAssessment(false);
      if (data && data.room) {
        setRoom(data.room);
        if (data.room.cards) setKanaCards(data.room.cards);
      }
      transitionToStatus('assessment');
    });

    newSocket.on('answer-submitted', (data) => {
      if (data && data.room) setRoom(data.room);
    });

    newSocket.on('hint-used', (data) => {
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

      const resultsArr = normalizeRoomResults(rawResults);
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

    newSocket.on('friend-request-received', () => {
      refreshFriendRequests();
      setToast({ message: 'You received a new friend request.', type: 'success' });
    });

    newSocket.on('friend-request-accepted', (data) => {
      refreshFriendData();
      const friendName = data?.friend?.display_name || 'Your friend';
      setToast({ message: `${friendName} accepted your friend request.`, type: 'success' });
    });

    newSocket.on('friend-request-rejected', (data) => {
      refreshFriendRequests();
      const receiverName = data?.receiver?.display_name || 'Your friend request';
      setToast({ message: `${receiverName} declined your friend request.`, type: 'warning' });
    });

    return () => {
      setIsSocketReady(false);
      newSocket.disconnect();
    };
  }, [authLoading, authRequired, refreshFriendData, user]);

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
    window.generateGrammarAssessment = (maxLesson = 12, count = 10) => handleOpenGrammarPractice(maxLesson, count);
    return () => {
      try {
        delete window.generateCards;
      } catch (e) {}
      try {
        delete window.generateGrammarAssessment;
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
        type: deckOptions?.type === 'grammar' ? 'grammar' : deckOptions?.type === 'kanji' ? 'kanji' : 'kana',
        groups: Array.isArray(deckOptions?.groups) ? deckOptions.groups : [],
        maxLesson: deckOptions?.type === 'grammar' ? Number(deckOptions.maxLesson) || 3 : undefined,
        count: deckOptions?.type === 'grammar' ? Number(deckOptions.count) || 5 : undefined,
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
    if (!socket || !roomCode) return;

    if (room?.deckType === 'grammar') {
      setIsPreparingAssessment(true);
    }

    socket.emit('start-assessment', roomCode);
  };

  const handleSubmitAnswer = (answer) => {
    if (socket && roomCode) {
      socket.emit('submit-answer', roomCode, answer);
    }
  };

  const handleUseHint = (cardIndex) => {
    if (socket && roomCode) {
      socket.emit('use-hint', roomCode, cardIndex);
    }
  };

  const handleNextCard = () => {
    if (socket && roomCode) {
      socket.emit('player-ready', roomCode);
    }
  };

  const normalizeRoomResults = (rawResults = []) => rawResults.map((player) => ({
    name: player.name,
    userId: player.userId ?? player.user_id ?? null,
    answers: Array.isArray(player.answers) ? player.answers : [],
  }));

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

  const handleOpenGrammarPractice = async (maxLesson = 12, count = 10) => {
    try {
      const response = await generateGrammarAssessment(maxLesson, count);
      const questions = Array.isArray(response?.questions) ? response.questions : [];

      if (questions.length === 0) {
        setToast({ message: 'No grammar questions were generated.', type: 'warning' });
        return;
      }

      setGrammarQuestions(questions);
      setStatus('grammar-practice');
    } catch (error) {
      console.error('Failed to generate grammar assessment:', error);
      setToast({ message: error.message || 'Unable to generate grammar assessment.', type: 'error' });
    }
  };

  const handleOpenHistory = () => {
    preserveRoomSessionForNavigation('history');
  };

  const handleOpenFriends = () => {
    preserveRoomSessionForNavigation('friends');
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
        onOpenFriends={handleOpenFriends}
        onLogout={handleLogout}
        onOpenHistory={handleOpenHistory}
        isAuthenticated={Boolean(user)}
        user={user}
        pendingFriendRequestCount={friendRequests.filter((request) => request?.direction !== 'outgoing').length}
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
                onOpenGrammarPractice={handleOpenGrammarPractice}
                onReturnToRoom={handleReturnToRoom}
                onDeclineRoomResume={handleDeclineRoomResume}
                prefillRoomCode={prefillRoomCode}
                isSocketReady={isSocketReady}
                canReturnToRoom={roomResumeAvailable}
                roomCode={roomCode || readRoomSession()?.roomCode || ''}
                resumeUsername={readRoomSession()?.username || username}
                user={user}
                friends={friends}
                friendSearchResults={friendSearchResults}
                isFriendSearchLoading={isFriendSearchLoading}
                onSearchUsers={handleSearchUsers}
                onRemoveFriend={handleRemoveFriend}
              />
            )}

            {status === 'friends' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleBackToPractice}
                    className="h-9 w-9 rounded-full"
                    aria-label="Back to home"
                    title="Back to home"
                  >
                    ←
                  </Button>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      Social
                    </p>
                    <h2 className="text-xl font-bold">Friends</h2>
                  </div>
                </div>

                <FriendsPanel
                  friends={friends}
                  searchResults={friendSearchResults}
                  friendRequests={friendRequests}
                  onSearchUsers={handleSearchUsers}
                  onSendFriendRequest={handleSendFriendRequest}
                  onAcceptFriendRequest={handleAcceptFriendRequest}
                  onRejectFriendRequest={handleRejectFriendRequest}
                  onRemoveFriend={handleRemoveFriend}
                  isSearching={isFriendSearchLoading}
                />
              </div>
            )}

            {status === 'kanji-study' && <KanjiStudy onBack={handleBackToPractice} />}

            {status === 'grammar-practice' && (
              <GrammarPractice
                questions={grammarQuestions}
                onBack={handleBackToPractice}
              />
            )}

            {status === 'history' && <AssessmentHistory onBack={handleBackToPractice} />}

            {status === 'lobby' && room && (
              <RoomLobby
                roomCode={roomCode}
                room={room}
                onStartAssessment={handleStartAssessment}
                onLeaveRoom={handleLeaveRoom}
                currentSocketId={socket?.id || ''}
                currentUserId={user?.id || null}
                friends={friends}
                friendRequests={friendRequests}
                onSendFriendRequest={handleSendFriendRequest}
                isPreparingAssessment={isPreparingAssessment}
              />
            )}

            {status === 'assessment' && room && (
              room.deckType === 'grammar' ? (
                <GrammarPractice
                  questions={room.cards || grammarQuestions}
                  room={room}
                  username={username}
                  onBack={handleBackToPractice}
                  onNextCard={handleNextCard}
                  onSubmitAnswer={handleSubmitAnswer}
                />
              ) : (
                <Assessment
                  room={room}
                  kanaCards={kanaCards}
                  onSubmitAnswer={handleSubmitAnswer}
                  onUseHint={handleUseHint}
                  onNextCard={handleNextCard}
                  username={username}
                />
              )
            )}

            {status === 'results' && results && room?.deckType === 'grammar' && (
              <GrammarPractice
                questions={room.cards || grammarQuestions}
                room={room}
                username={username}
                onBack={handleBackToPractice}
                onNextCard={handleNextCard}
                onSubmitAnswer={handleSubmitAnswer}
                forceShowResults
              />
            )}

            {status === 'results' && results && room?.deckType !== 'grammar' && (
              <Results
                results={results}
                roomCode={roomCode}
                kanaCards={kanaCards}
                username={username}
                user={user}
                room={room}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
