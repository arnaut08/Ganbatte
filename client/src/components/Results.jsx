import { useState } from 'react';
import './Results.css';

function Results({ results, roomCode, kanaCards }) {
  const [showDetails, setShowDetails] = useState(false);

  const computeStats = (answers) => {
    let correct = 0;
    let incorrect = 0;
    const total = kanaCards.length;
    for (let i = 0; i < total; i++) {
      const submitted = answers[i];
      if (submitted === undefined || submitted === null || submitted === '') continue;
      if (kanaCards[i] && submitted.toLowerCase().trim() === kanaCards[i].romaji) correct++;
      else incorrect++;
    }
    return { correct, incorrect, total };
  };

  return (
    <div className="results">
      <div className="results-container">
        <div className="results-header">
          <h2>Assessment Complete! 🎉</h2>
          <p>Great job! You've completed the Kana assessment.</p>
        </div>

        <div className="results-leaderboard">
          <h3>Summary</h3>
          <div className="leaderboard-table">
            {results.map((player, idx) => {
              const stats = computeStats(player.answers || []);
              return (
                <div key={idx} className="player-result">
                  <div className="rank-badge">{idx + 1}</div>
                  <div className="player-result-info">
                    <h4>{player.name}</h4>
                    <p className="player-score">
                      Correct: {stats.correct} • Incorrect: {stats.incorrect} • Total: {stats.total}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="results-actions">
          <div className="results-actions-row">
            <button
              className="btn btn-secondary"
              onClick={() => setShowDetails((s) => !s)}
            >
              {showDetails ? 'Hide Submitted Answers' : 'Show Submitted Answers'}
            </button>

            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Start New Session
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                if (typeof window.generateCards === 'function') {
                  // generate a fresh set and immediately start the assessment
                  window.generateCards(10, true);
                }
              }}
            >
              Generate New Set & Replay
            </button>
          </div>

          <p className="room-code-info">
            Your room code was: <strong>{roomCode}</strong>
          </p>
        </div>

        {showDetails && (
          <div className="results-details">
            <h3>Submitted Answers</h3>
            <div className="answers-grid">
              {kanaCards.map((card, i) => (
                <div key={i} className="answer-row">
                  <div className="kana-cell">#{i + 1} — {card.kana} ({card.romaji})</div>
                  {results.map((player, pi) => (
                    <div key={pi} className="player-answer-cell">
                      <strong>{player.name}:</strong> {player.answers[i] || '-'}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Results;
