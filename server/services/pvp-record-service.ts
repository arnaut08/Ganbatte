/** One `assessment_results` row, as needed to compute the 1v1 record. */
export type PvpResultRow = {
  id: string;
  assessment_type: string;
  score_percentage: number;
  total_questions: number;
  created_at: string;
  companion_user_id: string | null;
};

/** Aggregated multiplayer 1v1 record shown on the Mastery Passport. */
export type PvpRecord = {
  totalMatches: number;
  wins: number;
  losses: number;
  ties: number;
  /** Rounded percentage of decided matches (wins / wins + losses + ties). */
  winRate: number;
};

/**
 * Both players of a match save their own row shortly after finishing, so a
 * counterpart save is expected within this window of the player's own.
 */
const MATCH_TIME_WINDOW_MS = 10 * 60 * 1000;

function toTimestamp(value: string): number | null {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

/**
 * Pair each of the player's 1v1 rows with the opponent's counterpart row.
 * A pair must share the assessment type and question count, and the saves
 * must fall within the same session window; the closest save in time wins
 * and each opponent row is consumed at most once. Rows with no surviving
 * counterpart (the opponent's save failed) pair with `null`.
 */
export function pairPvpResults(
  myRows: PvpResultRow[],
  opponentRows: PvpResultRow[],
): Array<{ mine: PvpResultRow; opponent: PvpResultRow | null }> {
  const availableOpponents = [...opponentRows];

  return myRows.map((mine) => {
    const myTime = toTimestamp(mine.created_at);

    let bestIndex = -1;
    let bestDiff = Number.POSITIVE_INFINITY;
    availableOpponents.forEach((candidate, index) => {
      if (candidate.assessment_type !== mine.assessment_type) return;
      if (Number(candidate.total_questions) !== Number(mine.total_questions)) return;
      if (myTime === null) return;
      const candidateTime = toTimestamp(candidate.created_at);
      if (candidateTime === null) return;
      const diff = Math.abs(myTime - candidateTime);
      if (diff > MATCH_TIME_WINDOW_MS || diff >= bestDiff) return;
      bestIndex = index;
      bestDiff = diff;
    });

    const opponent = bestIndex >= 0 ? availableOpponents.splice(bestIndex, 1)[0] : null;
    return { mine, opponent };
  });
}

/**
 * Aggregate paired rows into the passport's 1v1 record. Matches whose
 * opponent row is missing still count toward `totalMatches`, but cannot be
 * decided and are excluded from the win-rate denominator.
 */
export function computePvpRecord(myRows: PvpResultRow[], opponentRows: PvpResultRow[]): PvpRecord {
  const pairs = pairPvpResults(myRows, opponentRows);

  let wins = 0;
  let losses = 0;
  let ties = 0;
  pairs.forEach(({ mine, opponent }) => {
    if (!opponent) return;
    const myScore = Number(mine.score_percentage) || 0;
    const opponentScore = Number(opponent.score_percentage) || 0;
    if (myScore > opponentScore) wins += 1;
    else if (myScore < opponentScore) losses += 1;
    else ties += 1;
  });

  const decided = wins + losses + ties;
  return {
    totalMatches: pairs.length,
    wins,
    losses,
    ties,
    winRate: decided > 0 ? Math.round((wins / decided) * 100) : 0,
  };
}