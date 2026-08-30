/** Feedback banner kinds for the grammar practice results screen. */
export type GrammarResultFeedbackKind = 'mastered' | 'passed' | 'retry';

export type GrammarResultFeedback = {
  kind: GrammarResultFeedbackKind;
  message: string;
};

/** A grammar practice quiz passes at 80% and masters at a perfect score. */
export const GRAMMAR_PASS_MARK = 80;

/**
 * Maps a finished grammar quiz onto its post-quiz banner:
 * - 100%: mastered immediately with a perfect score.
 * - >= 80%: passed. Mastery completes by re-passing on the day after a
 *   previous pass; `alreadyMastered` reflects the lesson's live
 *   `get_grammar_overview` state right after the result was saved, so a pass
 *   that just completed the consecutive-day streak reports mastery too.
 * - < 80%: standard retry prompt (failed quizzes earn no streak progression).
 */
export function getGrammarResultFeedback(scorePercent: number, alreadyMastered: boolean): GrammarResultFeedback {
  if (scorePercent >= 100) {
    return { kind: 'mastered', message: 'Mastered (Perfect Score)!' };
  }
  if (scorePercent >= GRAMMAR_PASS_MARK) {
    return alreadyMastered
      ? { kind: 'mastered', message: 'Mastered (Consecutive-Day Passes)!' }
      : { kind: 'passed', message: 'Passed (>=80%)! Pass again tomorrow to achieve mastery.' };
  }
  return { kind: 'retry', message: 'Below the 80% pass mark. Review the lesson and try again.' };
}