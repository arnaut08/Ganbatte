/**
 * Base types shared across the client. Kept deliberately loose so server
 * payloads (which are validated/parsed on the wire) remain assignable without
 * forcing narrow contracts at the API boundary.
 */

/** A raw record that may carry arbitrary server-supplied fields. */
export type ApiRecord = Record<string, unknown>;

/**
 * The deck/assessment types supported across study screens, rooms and the
 * grammar/kana/kanji APIs.
 */
export type Deck = 'kana' | 'kanji' | 'vocab' | 'grammar';

/** A stored confidence attempt record for a character/kanji. */
export type CharacterAttempt = ApiRecord & {
  character?: string;
  confidence?: string | null;
  /** Consecutive correct answers for this character (>= 3 means mastered). */
  correct_streak?: number;
  /** Lifetime number of attempts recorded for this character. */
  total_attempts?: number;
};

/** Raw input used when recording a character/kanji attempt. */
export type AttemptInput = ApiRecord;

/** One highlighted segment produced when diffing an answer against the expected one. */
export type DiffSegment = { type: string; text: string };