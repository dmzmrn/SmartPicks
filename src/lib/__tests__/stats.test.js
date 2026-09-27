import { describe, it, expect } from "vitest";
import { sumStats, computeStats, combinations } from "../stats.js";

// Exhaustively enumerate every k-combination of 1..max and return the exact
// mean and stddev of the combination sums. This is ground truth for the
// closed-form sumStats used by the sum-window filter (spec §5).
const enumerateSumMoments = (pick, max) => {
  const sums = [];
  const combo = [];
  const walk = (start) => {
    if (combo.length === pick) {
      sums.push(combo.reduce((a, b) => a + b, 0));
      return;
    }
    for (let n = start; n <= max; n++) {
      combo.push(n);
      walk(n + 1);
      combo.pop();
    }
  };
  walk(1);
  const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
  const variance =
    sums.reduce((acc, s) => acc + (s - mean) ** 2, 0) / sums.length;
  return { mean, stddev: Math.sqrt(variance), count: sums.length };
};

describe("sumStats (closed form vs exact enumeration)", () => {
  it.each([
    [6, 10],
    [5, 12],
    [3, 20],
  ])("matches exact moments for a %i/%i game", (pick, max) => {
    const exact = enumerateSumMoments(pick, max);
    const formula = sumStats(pick, max);
    expect(formula.mean).toBeCloseTo(exact.mean, 9);
    expect(formula.stddev).toBeCloseTo(exact.stddev, 9);
  });
});

describe("computeStats", () => {
  it("reports sum, parity, low/high and spread correctly", () => {
    const stats = computeStats([3, 14, 27, 33, 41, 52], 58);
    expect(stats.sum).toBe(170);
    expect(stats.even).toBe(2); // 14, 52
    expect(stats.odd).toBe(4); // 3, 27, 33, 41
    expect(stats.low).toBe(3); // ≤ 29
    expect(stats.high).toBe(3);
    expect(stats.spread).toBe(49);
  });
});

describe("combinations", () => {
  it("computes exact binomial coefficients with BigInt", () => {
    expect(combinations(58, 6)).toBe(40475358n);
    expect(combinations(49, 6)).toBe(13983816n);
    expect(combinations(10, 0)).toBe(1n);
    expect(combinations(5, 6)).toBe(0n);
  });
});
