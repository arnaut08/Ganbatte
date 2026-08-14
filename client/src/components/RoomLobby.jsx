import { useState } from 'react';
import './RoomLobby.css';

function RoomLobby({ roomCode, room, onStartAssessment, onLeaveRoom, currentSocketId }) {
  const isReady = room.players.length === 2 && room.players.every((player) => player.connected !== false);
  const [copied, setCopied] = useState(false);
  const joinLink = `${window.location.origin}?room=${encodeURIComponent(roomCode || '')}`;
  const isHost = room.players[0]?.id === currentSocketId;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op: clipboard API may be unavailable in some environments
    }
  };

  return (
    <div className="room-lobby">
      <div className="lobby-container">
        <div className="room-code-display">
          <h2>Room Code</h2>
          <div className="code-box">{roomCode}</div>
          {isHost && (
            <>
              <p className="code-instruction">Share this code with your friend</p>
              <div className="share-link-wrap">
                <p className="share-link-label">Direct join link</p>
                <div className="share-link-row">
                  <input className="share-link-input" value={joinLink} readOnly />
                  <button type="button" className="btn btn-secondary" onClick={handleCopyLink}>
                    {copied ? 'Copied' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="players-section">
          <h2>Players ({room.players.length}/2)</h2>
          <div className="players-list">
            {room.players.map((player, idx) => (
              <div key={player.id} className="player-card">
                <div className="player-avatar">{idx + 1}</div>
                <div className="player-info">
                  <p className="player-name">{player.name}</p>
                  <p className="player-status">
                    {idx === 0 ? 'Host' : 'Guest'}
                  </p>
                </div>
              </div>
            ))}
            {room.players.length === 1 && (
              <div className="player-card waiting">
                <div className="player-avatar">?</div>
                <div className="player-info">
                  <p className="player-name">Waiting...</p>
                  <p className="player-status">Waiting for opponent</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lobby-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={onStartAssessment}
            disabled={!isReady}
          >
            {isReady ? 'Start Assessment' : 'Waiting for Player 2...'}
          </button>
          <button type="button" className="btn btn-secondary leave-room-button" onClick={onLeaveRoom}>
            Leave Room
          </button>
        </div>

        <div className="instructions">
          <h3>How it works:</h3>
          <ul>
            <li>The host shares the room code or invite link, then both players join</li>
            <li>Each round shows the same kana sentence to both players</li>
            <li>Type your romaji answer and submit (spacing is flexible for checking)</li>
            <li>After both submissions, answers/translation are revealed and the next card starts automatically</li>
            <li>At the end, you get per-player accuracy stats and answer review</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RoomLobby;
