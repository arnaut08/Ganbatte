import { useEffect, useRef, useState } from 'react';
import './RoomSelector.css';
import { getRoom } from '../services/api';

function RoomSelector({ onCreateRoom, onJoinRoom, prefillRoomCode = '' }) {
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const joinNameInputRef = useRef(null);
  const hasInviteCode = Boolean(prefillRoomCode);

  useEffect(() => {
    if (prefillRoomCode) {
      setJoinCode(prefillRoomCode);
      joinNameInputRef.current?.focus();
    }
  }, [prefillRoomCode]);

  useEffect(() => {
    if (!hasInviteCode) {
      setOwnerName('');
      return;
    }

    let cancelled = false;
    getRoom(prefillRoomCode)
      .then((room) => {
        if (cancelled) return;
        const owner = room?.players?.[0]?.name?.trim?.();
        setOwnerName(owner || '');
      })
      .catch(() => {
        if (!cancelled) setOwnerName('');
      });

    return () => {
      cancelled = true;
    };
  }, [hasInviteCode, prefillRoomCode]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (createName.trim()) {
      onCreateRoom(createName.trim());
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const targetCode = (hasInviteCode ? prefillRoomCode : joinCode).trim();
    if (targetCode && joinName.trim()) {
      onJoinRoom(targetCode.toUpperCase(), joinName.trim());
      if (!hasInviteCode) setJoinCode('');
      setJoinName('');
    }
  };

  return (
    <div className="room-selector">
      <div className={`selector-container ${hasInviteCode ? 'invite-mode' : ''}`}>
        {hasInviteCode ? (
          <div className="selector-card join-card active-card invite-only-card">
            <h2>Join a Room</h2>
            <p>
              {ownerName
                ? `Invited to ${ownerName}'s room. Enter your name to join directly.`
                : `Invited to a room. Enter your name to join directly.`}
            </p>
            <form onSubmit={handleJoin}>
              <input
                ref={joinNameInputRef}
                type="text"
                placeholder="Enter your name"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                className="input"
              />
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={!joinName.trim()}
              >
                Join Room
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="selector-card create-card active-card">
              <h2>Create a Room</h2>
              <p>Start a new assessment session</p>
              <form onSubmit={handleCreate}>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="input"
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!createName.trim()}
                >
                  Create Room
                </button>
              </form>
            </div>

            <div className="divider">OR</div>

            <div className="selector-card join-card">
              <h2>Join a Room</h2>
              <p>Enter the room code your friend shared</p>
              <form onSubmit={handleJoin}>
                <input
                  ref={joinNameInputRef}
                  type="text"
                  placeholder="Enter your name"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Room Code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="input"
                />
                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={!joinCode.trim() || !joinName.trim()}
                >
                  Join Room
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RoomSelector;
