export function mergePlayerAnswers(previousAnswers = {}, roomAnswers = []) {
  const merged = { ...previousAnswers };

  roomAnswers.forEach((value, index) => {
    if (value !== undefined && value !== null) {
      merged[index] = value;
    }
  });

  return merged;
}
