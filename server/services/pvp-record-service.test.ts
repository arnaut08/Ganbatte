import test from 'node:test';
import assert from 'node:assert/strict';
import { computePvpRecord, pairPvpResults, type PvpResultRow } from './pvp-record-service.js';

function row(overrides: Partial<PvpResultRow> & { id: string; score_percentage: number }): PvpResultRow {
  return {
    assessment_type: 'kana-reading',
    total_questions: 10,
    created_at: '2026-01-01T12:00:00.000Z',
    companion_user_id: 'opponent',
    ...overrides,
  };
}

test('pairPvpResults pairs each row with the closest same-session opponent save', () => {
  const mine = [
    row({ id: 'mine-1', score_percentage: 80, created_at: '2026-01-01T12:00:00.000Z' }),
    row({ id: 'mine-2', score_percentage: 60, created_at: '2026-01-02T09:00:00.000Z' }),
  ];
  const opponents = [
    row({ id: 'opp-2', score_percentage: 90, created_at: '2026-01-02T09:01:00.000Z' }),
    row({ id: 'opp-1', score_percentage: 70, created_at: '2026-01-01T12:02:00.000Z' }),
  ];

  const pairs = pairPvpResults(mine, opponents);

  assert.deepEqual(
    pairs.map(({ mine: m, opponent }) => [m.id, opponent?.id ?? null]),
    [['mine-1', 'opp-1'], ['mine-2', 'opp-2']],
  );
});

test('pairPvpResults ignores opponents from a different assessment or question count', () => {
  const mine = [row({ id: 'mine-1', score_percentage: 80 })];
  const opponents = [
    row({ id: 'opp-grammar', score_percentage: 70, assessment_type: 'grammar' }),
    row({ id: 'opp-length', score_percentage: 70, total_questions: 25 }),
  ];

  const pairs = pairPvpResults(mine, opponents);

  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].opponent, null);
});

test('pairPvpResults rejects opponent saves outside the session window', () => {
  const mine = [row({ id: 'mine-1', score_percentage: 80, created_at: '2026-01-01T12:00:00.000Z' })];
  const opponents = [row({ id: 'opp-late', score_percentage: 70, created_at: '2026-01-01T12:11:00.000Z' })];

  const pairs = pairPvpResults(mine, opponents);

  assert.equal(pairs[0].opponent, null);
});

test('pairPvpResults consumes each opponent row at most once', () => {
  const mine = [
    row({ id: 'mine-1', score_percentage: 80, created_at: '2026-01-01T12:00:00.000Z' }),
    row({ id: 'mine-2', score_percentage: 60, created_at: '2026-01-01T12:01:00.000Z' }),
  ];
  const opponents = [row({ id: 'opp-1', score_percentage: 70, created_at: '2026-01-01T12:00:30.000Z' })];

  const pairs = pairPvpResults(mine, opponents);

  // The closest save wins; the second match of the session has no counterpart.
  assert.equal(pairs[0].opponent?.id, 'opp-1');
  assert.equal(pairs[1].opponent, null);
});

test('computePvpRecord counts wins, losses, and ties from paired scores', () => {
  const mine = [
    row({ id: 'mine-1', score_percentage: 90 }),
    row({ id: 'mine-2', score_percentage: 40 }),
    row({ id: 'mine-3', score_percentage: 70 }),
  ];
  const opponents = [
    row({ id: 'opp-1', score_percentage: 80 }),
    row({ id: 'opp-2', score_percentage: 80 }),
    row({ id: 'opp-3', score_percentage: 70 }),
  ];

  const record = computePvpRecord(mine, opponents);

  assert.deepEqual(record, { totalMatches: 3, wins: 1, losses: 1, ties: 1, winRate: 33 });
});

test('computePvpRecord excludes undecided matches from the win rate', () => {
  const mine = [
    row({ id: 'mine-1', score_percentage: 90 }),
    row({ id: 'mine-2', score_percentage: 50 }),
  ];
  const opponents = [row({ id: 'opp-1', score_percentage: 30 })];

  const record = computePvpRecord(mine, opponents);

  assert.deepEqual(record, { totalMatches: 2, wins: 1, losses: 0, ties: 0, winRate: 100 });
});

test('computePvpRecord returns zeroes when there are no matches', () => {
  assert.deepEqual(computePvpRecord([], []), { totalMatches: 0, wins: 0, losses: 0, ties: 0, winRate: 0 });
});