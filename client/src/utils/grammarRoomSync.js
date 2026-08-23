export function mergePlayerAnswers(previousAnswers = {}, roomAnswers = []) {
  const merged = { ...previousAnswers };

  roomAnswers.forEach((value, index) => {
    if (value !== undefined && value !== null) {
      const previousValue = previousAnswers[index];
      if (previousValue && typeof previousValue === 'object'
        && Array.isArray(previousValue.pairs) && Array.isArray(value)) {
        merged[index] = {
          ...previousValue,
          pairs: value,
          selectedLeft: null,
          selectedRight: null,
        };
        return;
      }

      merged[index] = value;
    }
  });

  return merged;
}
