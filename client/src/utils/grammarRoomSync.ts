export type MatchingPair = {
  left: string;
  right: string;
};

export type MatchingAnswerState = {
  selectedLeft: string | null;
  selectedRight: string | null;
  pairs: MatchingPair[];
};

export type GrammarAnswer = string | MatchingPair[] | MatchingAnswerState;
export type AnswerMap = Record<number, GrammarAnswer>;

function isMatchingAnswerState(value: unknown): value is MatchingAnswerState {
  return Boolean(
    value
      && typeof value === 'object'
      && !Array.isArray(value)
      && 'pairs' in value
      && Array.isArray(value.pairs),
  );
}

export function mergePlayerAnswers(
  previousAnswers: AnswerMap = {},
  roomAnswers: Array<GrammarAnswer | null | undefined> = [],
): AnswerMap {
  const merged: AnswerMap = { ...previousAnswers };

  roomAnswers.forEach((value, index) => {
    if (value === undefined || value === null) return;

    const previousValue = previousAnswers[index];
    if (isMatchingAnswerState(previousValue) && Array.isArray(value)) {
      merged[index] = {
        ...previousValue,
        pairs: value,
        selectedLeft: null,
        selectedRight: null,
      };
      return;
    }

    merged[index] = value;
  });

  return merged;
}
