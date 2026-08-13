import { useState, useEffect } from 'react';
import './Assessment.css';
import { scoreRomajiAnswer } from '../utils/romaji';

function normalizeRomaji(value) {
  return (value || '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((part) => (part === 'wo' ? 'o' : part))
    .join('');
}

const ROMAJI_SYLLABLES = [
  'kyo', 'kyu', 'kya', 'gyo', 'gyu', 'gya', 'sho', 'shu', 'sha',
  'jyo', 'jyu', 'jya', 'jo', 'ju', 'ja', 'cho', 'chu', 'cha',
  'nyo', 'nyu', 'nya', 'hyo', 'hyu', 'hya', 'byo', 'byu', 'bya',
  'pyo', 'pyu', 'pya', 'myo', 'myu', 'mya', 'ryo', 'ryu', 'rya',
  'shi', 'chi', 'tsu', 'fu',
  'ka', 'ki', 'ku', 'ke', 'ko', 'ga', 'gi', 'gu', 'ge', 'go',
  'sa', 'si', 'su', 'se', 'so', 'za', 'zi', 'zu', 'ze', 'zo',
  'ta', 'ti', 'tu', 'te', 'to', 'da', 'di', 'du', 'de', 'do',
  'na', 'ni', 'nu', 'ne', 'no', 'ha', 'hi', 'hu', 'he', 'ho',
  'ba', 'bi', 'bu', 'be', 'bo', 'pa', 'pi', 'pu', 'pe', 'po',
  'ma', 'mi', 'mu', 'me', 'mo', 'ya', 'yu', 'yo',
  'ra', 'ri', 'ru', 're', 'ro', 'wa', 'we', 'wi',
  'a', 'i', 'u', 'e', 'o', 'n',
];

function tokenizeRomaji(value) {
  const normalized = normalizeRomaji(value);
  return tokenizeNormalizedRomaji(normalized).map((token) => token.value);
}

function tokenizeNormalizedRomaji(normalized) {
  const tokens = [];
  let i = 0;

  while (i < normalized.length) {
    let matched = null;

    for (const syllable of ROMAJI_SYLLABLES) {
      if (normalized.startsWith(syllable, i)) {
        matched = syllable;
        break;
      }
    }

    if (matched) {
      tokens.push({ value: matched, start: i, end: i + matched.length });
      i += matched.length;
      continue;
    }

    tokens.push({ value: normalized[i], start: i, end: i + 1 });
    i += 1;
  }

  return tokens;
}

function buildNormalizedMap(rawValue) {
  const raw = rawValue || '';
  const lower = raw.toLowerCase();
  const words = [...lower.matchAll(/\S+/g)];
  let normalized = '';
  const spans = [];

  words.forEach((match) => {
    const word = match[0];
    const start = match.index;
    if (start === undefined) {
      return;
    }

    if (word === 'wo') {
      normalized += 'o';
      spans.push([start, start + word.length]);
      return;
    }

    for (let i = 0; i < word.length; i++) {
      normalized += word[i];
      spans.push([start + i, start + i + 1]);
    }
  });

  return { raw, normalized, spans };
}

function splitRawAroundDiff(raw, spans, diffStart, diffEnd) {
  const normalizedLength = spans.length;
  const safeStart = Math.max(0, Math.min(diffStart, normalizedLength));
  const safeEnd = Math.max(safeStart, Math.min(diffEnd, normalizedLength));

  const rawStart = safeStart >= normalizedLength ? raw.length : spans[safeStart][0];
  const rawEnd = safeEnd === 0
    ? 0
    : safeEnd > normalizedLength
    ? raw.length
    : spans[safeEnd - 1][1];

  return {
    prefix: raw.slice(0, rawStart),
    diff: raw.slice(rawStart, rawEnd),
    suffix: raw.slice(rawEnd),
  };
}

function buildRomajiDiff(givenRaw, expectedRaw) {
  const givenMapped = buildNormalizedMap(givenRaw);
  const expectedMapped = buildNormalizedMap(expectedRaw);
  const given = tokenizeNormalizedRomaji(givenMapped.normalized);
  const expected = tokenizeNormalizedRomaji(expectedMapped.normalized);

  let left = 0;
  while (
    left < given.length
    && left < expected.length
    && given[left].value === expected[left].value
  ) {
    left++;
  }

  let rightGiven = given.length - 1;
  let rightExpected = expected.length - 1;
  while (
    rightGiven >= left
    && rightExpected >= left
    && given[rightGiven].value === expected[rightExpected].value
  ) {
    rightGiven--;
    rightExpected--;
  }

  const givenDiffStart = left < given.length ? given[left].start : givenMapped.normalized.length;
  const givenDiffEnd = rightGiven >= left ? given[rightGiven].end : givenDiffStart;
  const expectedDiffStart = left < expected.length ? expected[left].start : expectedMapped.normalized.length;
  const expectedDiffEnd = rightExpected >= left ? expected[rightExpected].end : expectedDiffStart;

  const givenSplit = splitRawAroundDiff(
    givenMapped.raw,
    givenMapped.spans,
    givenDiffStart,
    givenDiffEnd,
  );
  const expectedSplit = splitRawAroundDiff(
    expectedMapped.raw,
    expectedMapped.spans,
    expectedDiffStart,
    expectedDiffEnd,
  );

  return {
    givenPrefix: givenSplit.prefix,
    givenDiff: givenSplit.diff,
    givenSuffix: givenSplit.suffix,
    expectedPrefix: expectedSplit.prefix,
    expectedDiff: expectedSplit.diff,
    expectedSuffix: expectedSplit.suffix,
  };
}

function Assessment({ room, kanaCards, onSubmitAnswer, onNextCard, username }) {
  const [answer, setAnswer] = useState('');

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
                        <span>{answerDiff.givenPrefix}</span>
                        <span className="answer-token-wrong">{answerDiff.givenDiff || '∅'}</span>
                        <span>{answerDiff.givenSuffix}</span>
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
                        <span>{answerDiff.expectedPrefix}</span>
                        <span className="answer-token-correct">{answerDiff.expectedDiff || '∅'}</span>
                        <span>{answerDiff.expectedSuffix}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {currentCard?.english && (
                <p className="translation-text">English: <strong>{currentCard.english}</strong></p>
              )}
              {room.currentCardIndex === kanaCards.length - 1 ? (
                <p className="completion-text">Assessment Complete!</p>
              ) : (
                // After submission, allow the user to mark themselves ready to
                // continue; server will advance only when all players are ready.
                <div className="continue-section">
                  {!submitted ? (
                    <p className="waiting-text">Submit your answer to continue.</p>
                  ) : (
                    <div>
                      {!currentReady ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => onNextCard()}
                          // onNextCard is wired to emit player-ready in App
                        >
                          I'm ready — Continue
                        </button>
                      ) : (
                        <p className="waiting-text">Waiting for the other player to continue...</p>
                      )}
                      <p className="small-note">
                        {otherReady
                          ? 'Other player is ready.'
                          : otherSubmitted
                          ? 'Other player submitted. Waiting for them to mark ready.'
                          : 'Other player has not submitted yet.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
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
