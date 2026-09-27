import { describe, it, expect } from "vitest";
import {
  longestArithmeticProgression,
  arithmeticPatternLength,
  hasArithmeticPattern,
} from "../patterns.js";
import { weightedSample } from "../generator.js";

// Brute-force second opinion: the longest evenly spaced subset, found by
// checking every subset of the combination.
const bruteForceLongestProgression = (sorted) => {
  let longest = Math.min(sorted.length, 2);
  const subsetCount = 1 << sorted.length;
  for (let mask = 0; mask < subsetCount; mask++) {
    const subset = sorted.filter((_, i) => mask & (1 << i));
    if (subset.length <= longest) continue;
    const step = subset[1] - subset[0];
    if (subset.every((v, i) => i === 0 || v - subset[i - 1] === step)) longest = subset.length;
  }
  return longest;
};

describe("longestArithmeticProgression", () => {
  it("finds the full 6-term progression of the 433-winner PCSO draw", () => {
    expect(longestArithmeticProgression([9, 18, 27, 36, 45, 54])).toBe(6);
  });

  it("finds progressions that are interleaved with another number", () => {
    expect(longestArithmeticProgression([5, 10, 13, 15, 20, 25])).toBe(5);
    expect(longestArithmeticProgression([4, 7, 10, 13, 16, 34])).toBe(5);
  });

  it("returns 3 for a typical combination with one short progression", () => {
    expect(longestArithmeticProgression([3, 14, 27, 33, 41, 52])).toBe(3); // 14·33·52
  });

  it("matches brute-force subset enumeration on 2,000 random 6/58 combinations", () => {
    const items = Array.from({ length: 58 }, (_, i) => i + 1);
    const weights = items.map(() => 1);
    for (let i = 0; i < 2000; i++) {
      const sorted = weightedSample(items, weights, 6).sort((a, b) => a - b);
      expect(longestArithmeticProgression(sorted)).toBe(bruteForceLongestProgression(sorted));
    }
  });
});

describe("hasArithmeticPattern", () => {
  it("needs all numbers, or all but one, evenly spaced (never fewer than 4)", () => {
    expect(arithmeticPatternLength(3)).toBe(4);
    expect(arithmeticPatternLength(4)).toBe(4);
    expect(arithmeticPatternLength(6)).toBe(5);
    expect(arithmeticPatternLength(20)).toBe(19);
  });

  it("flags patterned 6-number tickets and passes ordinary ones", () => {
    expect(hasArithmeticPattern([9, 18, 27, 36, 45, 54])).toBe(true);
    expect(hasArithmeticPattern([5, 10, 13, 15, 20, 25])).toBe(true);
    expect(hasArithmeticPattern([3, 10, 17, 24, 40, 52])).toBe(false); // only 4 evenly spaced
    expect(hasArithmeticPattern([3, 14, 27, 33, 41, 52])).toBe(false);
  });

  it("never flags games that pick fewer than 4 numbers", () => {
    expect(hasArithmeticPattern([1, 2, 3])).toBe(false);
  });
});
