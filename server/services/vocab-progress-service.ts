export interface SrsProgress {
  srs_stage: number;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
}

export interface SrsUpdate extends SrsProgress {
  next_review_at: string;
  last_reviewed_at: string;
}

export function calculateSrsUpdate(
  current: Partial<SrsProgress> | null | undefined,
  rating: 1 | 2 | 3 | 4,
  now: Date = new Date(),
): SrsUpdate {
  const previousEase = Number(current?.ease_factor) || 2.5;
  const previousInterval = Number(current?.interval_days) || 0;
  const previousRepetitions = Number(current?.repetitions) || 0;
  const easeFactor = Math.max(
    1.3,
    previousEase + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)),
  );

  if (rating < 3) {
    const nextReview = new Date(now);
    nextReview.setUTCDate(nextReview.getUTCDate() + 1);
    return {
      srs_stage: 0,
      interval_days: 1,
      ease_factor: Number(easeFactor.toFixed(2)),
      repetitions: 0,
      next_review_at: nextReview.toISOString(),
      last_reviewed_at: now.toISOString(),
    };
  }

  const repetitions = previousRepetitions + 1;
  const intervalDays = repetitions === 1
    ? 1
    : repetitions === 2
      ? 6
      : Math.max(1, Math.round(previousInterval * easeFactor));
  const nextReview = new Date(now);
  nextReview.setUTCDate(nextReview.getUTCDate() + intervalDays);

  return {
    srs_stage: repetitions,
    interval_days: intervalDays,
    ease_factor: Number(easeFactor.toFixed(2)),
    repetitions,
    next_review_at: nextReview.toISOString(),
    last_reviewed_at: now.toISOString(),
  };
}