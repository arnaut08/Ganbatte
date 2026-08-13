import { useState } from 'react';
import './Results.css';
import { buildRomajiDiff, scoreRomajiAnswer } from '../utils/romaji';

function renderDifference(answer, expected, side) {
  const segments = buildRomajiDiff(answer, expected)[side];
  const tokenClass = side === 'given' ? 'answer-token-wrong' : 'answer-token-correct';

  return segments.map((segment, index) => (
    <span key={`${segment.type}-${index}`} className={segment.type === 'diff' ? tokenClass : undefined}>
      {segment.text}
    </span>
  ));
}

function renderCorrectAnswer(answer) {
  return <span className="answer-token-correct">{answer}</span>;
}

function Results({ results, roomCode, kanaCards }) {
  const [showDetails, setShowDetails] = useState(false);

  const computeStats = (answers) => {
    let correct = 0;
    let matchedTokens = 0;
    let totalTokens = 0;
    const total = kanaCards.length;
    for (let i = 0; i < total; i++) {
      const submitted = answers[i];
      const score = scoreRomajiAnswer(submitted, kanaCards[i]?.romaji);
      matchedTokens += score.matched;
      totalTokens += score.total;
      if (score.matched === score.total) correct++;
    }
    return {
      correct,
      incorrect: total - correct,
      total,
      matchedTokens,
      totalTokens,
      percentage: totalTokens === 0 ? 0 : Math.round((matchedTokens / totalTokens) * 100),
    };
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
                      Score: {stats.percentage}% • Correct questions: {stats.correct}/{stats.total}
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
                  <div className="kana-cell">#{i + 1} — {card.kana}</div>
                  <div className="common-correct-answer">
                    <span className="answer-diff-label">Correct answer</span>
                    <span className="answer-diff-value">
                      {renderCorrectAnswer(card.romaji)}
                    </span>
                  </div>
                  {results.map((player, pi) => (
                    <div key={pi} className="player-answer-cell">
                      <strong>{player.name}</strong>
                      <span className="answer-diff-value">
                        {player.answers[i]
                          ? renderDifference(player.answers[i], card.romaji, 'given')
                          : '-'}
                      </span>
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
