import { useState, useEffect } from 'react';
import './Assessment.css';
import { buildRomajiDiff, scoreRomajiAnswer } from '../utils/romaji';

function Assessment({ room, kanaCards, onSubmitAnswer, onNextCard, username }) {
  const [answer, setAnswer] = useState('');
  const [showOpponentStatus, setShowOpponentStatus] = useState(true);

  const currentCard = kanaCards[room.currentCardIndex];
  const currentPlayer = room.players.find((p) => p.name === username);
  const otherPlayer = room.players.find((p) => p.name !== username);

  // Determine submission state from room data to avoid race between
  // local state and server-synced room updates.
  const submitted = currentPlayer?.answers[room.currentCardIndex] !== undefined;
  const otherSubmitted = otherPlayer?.answers[room.currentCardIndex] !== undefined;
  const currentReady = currentPlayer?.ready === true;
  const otherReady = otherPlayer?.ready === true;
  const otherAnswer = otherPlayer?.answers[room.currentCardIndex];
  const otherCorrect = otherAnswer !== undefined
    && scoreRomajiAnswer(otherAnswer, currentCard?.romaji).percentage === 100;

  useEffect(() => {
    setAnswer('');
  }, [room.currentCardIndex]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answer.trim()) {
      onSubmitAnswer(answer.toLowerCase().trim());
    }
  };

  const progress = ((room.currentCardIndex + 1) / kanaCards.length) * 100;
  const submittedAnswer = currentPlayer?.answers[room.currentCardIndex] || '';
  const answerScore = scoreRomajiAnswer(submittedAnswer, currentCard?.romaji);
  const isCorrect = answerScore.percentage === 100;
  const answerDiff = !isCorrect
    ? buildRomajiDiff(submittedAnswer, currentCard?.romaji)
    : null;

  const renderDifference = (segments, tokenClass) => segments.map((segment, index) => (
    <span key={`${segment.type}-${index}`} className={segment.type === 'diff' ? tokenClass : undefined}>
      {segment.text}
    </span>
  ));

  return (
    <div className="assessment">
      <div className="assessment-container">
        <div className="progress-section">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">
            Card {room.currentCardIndex + 1} of {kanaCards.length}
          </p>
        </div>

        <div className="cards-section">
          <div className="player-card">
            <h3>{username}</h3>
            <div className="card-content">
              <div className="kana-display">{currentCard?.kana}</div>
              {submitted && (
                <div className={`answer-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {isCorrect ? '✓ Correct!' : '✗ Try again next time'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="opponent-status-section">
          {showOpponentStatus && (
            <div className="opponent-bar">
              {otherPlayer ? (
                <div>
                  <strong>{otherPlayer.name}</strong>
                  <span className="op-status"> — {otherSubmitted ? (otherCorrect ? '✓ Submitted' : '✗ Submitted') : '⏳ Not submitted'}</span>
                  {otherReady && <span className="op-ready"> • ✅ Ready</span>}
                </div>
              ) : (
                <div className="op-status">Waiting for opponent...</div>
              )}
            </div>
          )}
          <label className="opponent-status-toggle">
            <input
              type="checkbox"
              checked={showOpponentStatus}
              onChange={(event) => setShowOpponentStatus(event.target.checked)}
            />
            Show opponent status
          </label>
        </div>

        <div className="input-section">
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type the romaji..."
                className="answer-input"
                autoFocus
              />
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </form>
          ) : (
            <div className="submitted-section">
              <div className="answer-review-grid">
                <div className="answer-review-row">
                  <span className="answer-review-label">Your answer</span>
                  <div className="answer-review-value diff-line">
                    {isCorrect || !answerDiff ? (
                      <span>{submittedAnswer}</span>
                    ) : (
                      <>
                        {renderDifference(answerDiff.given, 'answer-token-wrong')}
                      </>
                    )}
                  </div>
                </div>
                <div className="answer-review-row">
                  <span className="answer-review-label">Correct answer</span>
                  <div className="answer-review-value diff-line">
                    {isCorrect || !answerDiff ? (
                      <span>{currentCard?.romaji}</span>
                    ) : (
                      <>
                        {renderDifference(answerDiff.expected, 'answer-token-correct')}
                      </>
                    )}
                  </div>
                </div>
              </div>
              {currentCard?.english && (
                <p className="translation-text">English: <strong>{currentCard.english}</strong></p>
              )}
              <div className="continue-section">
                {!submitted ? (
                  <p className="waiting-text">Submit your answer to continue.</p>
                ) : (
                  <div>
                    <div className="continue-actions">
                      {!currentReady ? (
                        <button
                          type="button"
                          className="btn btn-primary ready-button"
                          onClick={() => onNextCard()}
                        >
                          Ready
                        </button>
                      ) : (
                        <span className="waiting-text">Waiting...</span>
                      )}
                      <span className="small-note">
                      {otherReady
                        ? 'Other player ready'
                        : otherSubmitted
                        ? 'Other player submitted'
                        : 'Other player not submitted'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hint-section">
          <p className="hint">💡 Tip: Type the romaji (Latin letters) for the kana character shown above</p>
        </div>
      </div>
    </div>
  );
}

export default Assessment;
