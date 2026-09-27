import { describe, it, expect } from "vitest";
import { scoreRow, crowdIndex } from "../scoring.js";
import { generatePick, weightedSample } from "../generator.js";

const ITERATIONS = 10000;
const BIRTHDAY_MAX = 31;

// Every k-combination of 1..max, visited without materializing the list.
const forEachCombination = (pick, max, visit) => {
  const combo = [];
  const walk = (start) => {
    if (combo.length === pick) return visit(combo);
    for (let n = start; n <= max; n++) {
      combo.push(n);
      walk(n + 1);
      combo.pop();
    }
  };
  walk(1);
};

const birthdayCount = (combo) => combo.filter((n) => n <= BIRTHDAY_MAX).length;

// Non-patterned representatives of a 5/40 game, indexed by birthday count.
const REPRESENTATIVES_5_40 = [
  [32, 33, 35, 38, 40],
  [7, 32, 34, 37, 40],
  [3, 20, 33, 36, 40],
  [2, 11, 25, 34, 39],
  [1, 9, 16, 30, 37],
  [4, 12, 19, 23, 31],
];

describe("scoreRow — exact percentile semantics (enumeration of all 658,008 5/40 combos)", () => {
  const counts = new Array(6).fill(0);
  let crowdIndexSum = 0;
  let total = 0;
  forEachCombination(5, 40, (combo) => {
    counts[birthdayCount(combo)]++;
    crowdIndexSum += crowdIndex(combo, 5, 40);
    total++;
  });

  it("score = share of combinations more crowded (ties count half)", () => {
    REPRESENTATIVES_5_40.forEach((combo, k) => {
      expect(birthdayCount(combo)).toBe(k);
      const moreCrowded = counts.slice(k + 1).reduce((a, b) => a + b, 0);
      const expected = Math.round((100 * (moreCrowded + counts[k] / 2)) / total);
      expect(scoreRow(combo, [], 5, 40).score).toBe(expected);
    });
  });

  it("crowd index averages exactly 1 over every combination", () => {
    expect(crowdIndexSum / total).toBeCloseTo(1, 9);
  });
});

describe("scoreRow — calibration over 10k simulated draws (6/58)", () => {
  const items = Array.from({ length: 58 }, (_, i) => i + 1);
  const uniformWeights = items.map(() => 1);

  it("a uniformly random combination averages a score of 50 (5σ band)", () => {
    const scores = [];
    for (let i = 0; i < ITERATIONS; i++) {
      scores.push(scoreRow(weightedSample(items, uniformWeights, 6), [], 6, 58).score);
    }
    const mean = scores.reduce((a, b) => a + b, 0) / ITERATIONS;
    const sd = Math.sqrt(scores.reduce((a, s) => a + (s - mean) ** 2, 0) / (ITERATIONS - 1));
    expect(Math.abs(mean - 50)).toBeLessThan((5 * sd) / Math.sqrt(ITERATIONS));
  });

  it("generated picks are far less crowded than random ones", () => {
    let scoreSum = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const { picks, relaxed } = generatePick({
        pick: 6,
        max: 58,
        avoidBirthdays: true,
        avoidSequential: true,
        excludedSet: new Set(),
      });
      scoreSum += scoreRow(picks, relaxed, 6, 58).score;
    }
    expect(scoreSum / ITERATIONS).toBeGreaterThan(70);
  });
});

describe("scoreRow — crowd model shape", () => {
  const byBirthdayCount = [
    [32, 38, 41, 47, 52, 57],
    [12, 33, 38, 44, 51, 57],
    [3, 20, 33, 38, 49, 58],
    [2, 11, 25, 34, 43, 56],
    [1, 9, 16, 30, 37, 50],
    [4, 12, 19, 23, 31, 46],
    [1, 3, 7, 12, 21, 31],
  ];

  it("each extra birthday-range number strictly lowers the score", () => {
    const scores = byBirthdayCount.map((c) => scoreRow(c, [], 6, 58).score);
    for (let k = 1; k < scores.length; k++) expect(scores[k]).toBeLessThan(scores[k - 1]);
  });

  it("applies the fitted rate ratios: ×e^0.49 per number, ×e^1.40 extra when all are 1–31", () => {
    const index = byBirthdayCount.map((c) => crowdIndex(c, 6, 58));
    expect(index[4] / index[3]).toBeCloseTo(Math.exp(0.49), 9);
    expect(index[6] / index[5]).toBeCloseTo(Math.exp(0.49 + 1.4), 9);
  });

  it("labels follow the score bands", () => {
    expect(scoreRow(byBirthdayCount[1], [], 6, 58).label).toBe("Excellent");
    expect(scoreRow(byBirthdayCount[6], [], 6, 58).label).toBe("Weak");
  });

  it("scores the 433-winner PCSO combination 0 — evenly spaced tickets rank last", () => {
    const { score, label, reasons } = scoreRow([9, 45, 36, 27, 18, 54], [], 6, 55);
    expect(score).toBe(0);
    expect(label).toBe("Weak");
    expect(reasons[0]).toMatch(/evenly spaced/);
  });

  it("scores the combination, not how it was generated", () => {
    const picks = [12, 33, 38, 44, 51, 57];
    const clean = scoreRow(picks, [], 6, 58);
    const relaxed = scoreRow(picks, ["digit", "spread"], 6, 58);
    expect(relaxed.score).toBe(clean.score);
    expect(relaxed.reasons.at(-1)).toMatch(/loosened rules \(digit, spread\)/);
  });

  it("rates every non-patterned combination as average when the whole game is 1–31", () => {
    expect(scoreRow([1, 5, 11, 14, 20], [], 5, 20).score).toBe(50);
    expect(scoreRow([2, 3, 9, 17, 19], [], 5, 20).score).toBe(50);
  });
});
