// Evenly spaced tickets are the most-shared combinations on record: PCSO
// Grand Lotto 6/55, 1 Oct 2022 — 09·18·27·36·45·54 split the jackpot 433 ways.
const MIN_PATTERN_LENGTH = 4;

// Length of the longest arithmetic progression (equally spaced numbers) that
// can be formed from a sorted set of distinct numbers, e.g. [5, 9, 10, 15, 20] → 4.
export const longestArithmeticProgression = (sorted) => {
  if (sorted.length < 3) return sorted.length;
  const members = new Set(sorted);
  let longest = 2;
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const step = sorted[j] - sorted[i];
      let length = 2;
      for (let next = sorted[j] + step; members.has(next); next += step) length++;
      longest = Math.max(longest, length);
    }
  }
  return longest;
};

// A combination reads as a pattern when all of its numbers, or all but one,
// are equally spaced (never fewer than MIN_PATTERN_LENGTH of them).
export const arithmeticPatternLength = (pick) => Math.max(MIN_PATTERN_LENGTH, pick - 1);

export const hasArithmeticPattern = (sorted) =>
  sorted.length >= MIN_PATTERN_LENGTH &&
  longestArithmeticProgression(sorted) >= arithmeticPatternLength(sorted.length);
