import { describe, it, expect } from "vitest";
import {
  getLatestBatch,
  getMatchDistribution,
  getTierDistribution,
  getDrawScoreAnalysis,
} from "../dashboardCalculations";

describe("getLatestBatch", () => {
  it("returns only the entries from the most recent generation", () => {
    const history = [
      { ts: 100, picks: [1, 2, 3], relaxed: [] },
      { ts: 100, picks: [4, 5, 6], relaxed: [] },
      { ts: 200, picks: [7, 8, 9], relaxed: [] },
      { ts: 200, picks: [10, 11, 12], relaxed: [] },
    ];
    const batch = getLatestBatch(history);
    expect(batch).toHaveLength(2);
    expect(batch.every((e) => e.ts === 200)).toBe(true);
  });

  it("returns empty for empty history", () => {
    expect(getLatestBatch([])).toEqual([]);
  });
});

describe("getMatchDistribution", () => {
  it("counts intersections exactly on a known fixture", () => {
    const rows = [[1, 2, 3, 4, 5, 6]];
    const draws = [
      [1, 2, 3, 10, 11, 12], // 3 matches
      [7, 8, 9, 10, 11, 12], // 0 matches
      [1, 2, 3, 4, 5, 6], // 6 matches
    ];
    const { distribution, best, totalPairs } = getMatchDistribution(rows, draws, 6);
    expect(totalPairs).toBe(3);
    expect(best).toBe(6);
    expect(distribution[0].count).toBe(1);
    expect(distribution[3].count).toBe(1);
    expect(distribution[6].count).toBe(1);
  });
});

describe("getTierDistribution", () => {
  it("generated tier shares sum to 100% and baseline reflects tier sizes", () => {
    const rows = [[3, 15, 33, 40, 45, 50]];
    const tiers = getTierDistribution(rows, 58);
    const generatedTotal = tiers.reduce((a, t) => a + t.generated, 0);
    expect(generatedTotal).toBeCloseTo(100, 6);
    expect(tiers[0].baseline).toBeCloseTo((12 / 58) * 100, 6);
    expect(tiers[2].baseline).toBeCloseTo((27 / 58) * 100, 6);
  });
});

describe("getDrawScoreAnalysis", () => {
  // Crowd-like draw (birthday-heavy, scores < 60) vs uncommon draw (scores ≥ 60)
  const crowdDraw = [1, 3, 7, 12, 21, 31];
  const uncommonDraw = [12, 33, 38, 44, 51, 57];

  it("buckets draws by score and averages winner counts per bucket", () => {
    const draws = [crowdDraw, crowdDraw, uncommonDraw, uncommonDraw];
    const winners = [3, 1, 0, 0];
    const a = getDrawScoreAnalysis(draws, winners, 6, 58);
    expect(a.hasWinnerData).toBe(true);
    expect(a.withWinnerCount).toBe(4);
    expect(a.crowdLike.draws).toBe(2);
    expect(a.crowdLike.avgWinners).toBeCloseTo(2, 9);
    expect(a.crowdLike.jackpotHitShare).toBeCloseTo(100, 9);
    expect(a.uncommon.draws).toBe(2);
    expect(a.uncommon.avgWinners).toBeCloseTo(0, 9);
    expect(a.uncommon.jackpotHitShare).toBeCloseTo(0, 9);
  });

  it("treats null winner entries as unknown, not zero", () => {
    const a = getDrawScoreAnalysis([crowdDraw, uncommonDraw], [null, 2], 6, 58);
    expect(a.withWinnerCount).toBe(1);
    expect(a.crowdLike.draws).toBe(0);
    expect(a.uncommon.draws).toBe(1);
    expect(a.uncommon.avgWinners).toBeCloseTo(2, 9);
  });

  it("reports hasWinnerData=false when no counts exist", () => {
    const a = getDrawScoreAnalysis([crowdDraw], [null], 6, 58);
    expect(a.hasWinnerData).toBe(false);
    expect(a.totalDraws).toBe(1);
    expect(a.bands.reduce((s, b) => s + b.count, 0)).toBe(1);
  });
});
