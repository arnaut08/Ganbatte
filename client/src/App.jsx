import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import RoomSelector from './components/RoomSelector';
import RoomLobby from './components/RoomLobby';
import Assessment from './components/Assessment';
import Results from './components/Results';
import './App.css';
import { SERVER_URL } from './config';
import logo from './assets/logo.svg';

function App() {
  const [socket, setSocket] = useState(null);
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
      newSocket.disconnect();
    };
  }, []);

  // Fetch kana cards
  useEffect(() => {
    fetch(`${SERVER_URL}/api/kana-cards`)
      .then((res) => res.json())
      .then((data) => setKanaCards(data))
      .catch((err) => console.error('Error fetching kana cards:', err));
  }, []);

  const handleGenerateCards = async (count = 10, startAfter = false) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/generate-cards?count=${count}`, { method: 'POST' });
      const json = await res.json();
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
      socket.emit('create-room', hostName, (code) => {
        setRoomCode(code);
        // Immediately request the full room from server so the host
        // has the same room object structure as a joined player and
        // the lobby can render correctly.
          socket.emit('get-room', code, (room) => {
            if (room) {
              setRoom(room);
              if (room.cards) setKanaCards(room.cards);
              setStatus('lobby');
              // If the host hasn't set a username, set it to the
              // name assigned by the server for this socket so the
              // assessment UI can find the current player correctly.
              const me = room.players.find((p) => p.id === socket.id);
              if (me) setUsername(me.name);
            }
          });
      });
    }
  };

  const handleJoinRoom = (code, name) => {
    if (socket) {
      setUsername(name);
      socket.emit('join-room', code, name, (response) => {
        if (response.success) {
          setRoomCode(code);
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
      <header className="app-header">
        <div className="brand-lockup">
          <img className="app-logo" src={logo} alt="Ganbatte logo" />
          <div>
            <h1>
              <span className="brand-name">GANBATTE</span>
              <span className="brand-kana" lang="ja">頑張って</span>
            </h1>
            <p>Stop saying 'Nani?' to everything.</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        {status === 'selector' && (
          <RoomSelector
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            prefillRoomCode={prefillRoomCode}
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
