import { useEffect, useState } from 'react';
import { getKanjiCards } from '../services/api';
import './KanjiStudy.css';

function KanjiStudy({ onBack }) {
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [kanjiData, setKanjiData] = useState({ cards: [], groups: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getKanjiCards()
      .then(setKanjiData)
      .catch(() => setError('Unable to load Kanji cards. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  const cards = selectedGroups.length === 0
    ? kanjiData.cards
    : kanjiData.cards.filter((card) => selectedGroups.includes(card.groupId));
  const card = cards[cardIndex];

  const selectGroup = (groupId) => {
    setSelectedGroups((current) => current.includes(groupId)
      ? current.filter((selected) => selected !== groupId)
      : [...current, groupId]);
    setCardIndex(0);
    setIsRevealed(false);
  };

  const moveCard = (direction) => {
    setCardIndex((current) => (current + direction + cards.length) % cards.length);
    setIsRevealed(false);
  };

  return (
    <main className="kanji-study">
      <div className="kanji-study-header">
        <div>
          <p className="study-kicker">Kanji practice</p>
          <h2>Build your reading foundation</h2>
          <p className="study-description">Study 100 beginner kanji, grouped by everyday themes.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={onBack}>Back to home</button>
      </div>

      <div className="kanji-filter">
        <button
          type="button"
          className="kanji-filter-trigger"
          aria-expanded={isFilterOpen}
          aria-label="Filter Kanji groups"
          title="Filter Kanji groups"
          onClick={() => setIsFilterOpen((current) => !current)}
        >
          <span>{selectedGroups.length === 0 ? 'All kanji' : `${selectedGroups.length} groups selected`}</span>
          <span className="filter-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        {isFilterOpen && (
          <div className="kanji-filter-menu" role="group" aria-label="Kanji groups">
            <button
              type="button"
              className={`kanji-filter-option ${selectedGroups.length === 0 ? 'active' : ''}`}
              onClick={() => {
                setSelectedGroups([]);
                setCardIndex(0);
                setIsRevealed(false);
                setIsFilterOpen(false);
              }}
            >
              <span className="filter-check" aria-hidden="true">{selectedGroups.length === 0 ? '✓' : ''}</span>
              All kanji
            </button>
            {kanjiData.groups.map((group) => (
              <button
                type="button"
                key={group.id}
                className={`kanji-filter-option ${selectedGroups.includes(group.id) ? 'active' : ''}`}
                onClick={() => selectGroup(group.id)}
              >
                <span className="filter-check" aria-hidden="true">{selectedGroups.includes(group.id) ? '✓' : ''}</span>
                {group.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && <section className="kanji-card"><p>Loading Kanji cards...</p></section>}
      {error && <section className="kanji-card"><p className="auth-message">{error}</p></section>}
      {!isLoading && !error && card && <section className="kanji-card" aria-live="polite">
        <p className="kanji-card-group">{card.groupName}</p>
        <div className="kanji-character">{card.kanji}</div>
        {isRevealed ? (
          <div className="kanji-answer">
            <p><span>Reading</span>{card.reading}</p>
            <p><span>Meaning</span>{card.meaning}</p>
            <p className="kanji-example"><span>Example</span>{card.example[0]}<small>{card.example[1]}</small></p>
          </div>
        ) : (
          <button type="button" className="btn btn-primary reveal-button" onClick={() => setIsRevealed(true)}>
            Show reading
          </button>
        )}
        <p className="kanji-progress">Card {cardIndex + 1} of {cards.length}</p>
      </section>}

      {!isLoading && !error && card && <div className="kanji-controls">
        <button type="button" className="btn btn-secondary" onClick={() => moveCard(-1)}>Previous</button>
        <button type="button" className="btn btn-primary" onClick={() => moveCard(1)}>Next</button>
      </div>}
    </main>
  );
}

export default KanjiStudy;
