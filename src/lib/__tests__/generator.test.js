import { describe, it, expect, vi, afterEach } from "vitest";
import { randUnit, weightedSample, generatePick, generateMany } from "../generator.js";
import { sumStats } from "../stats.js";

// Spec §5.2 verification loop: every statistical claim is tested over
// ITERATIONS simulated runs. Tolerances are 5σ bands (binomial/normal), so a
// correct implementation fails any single check with p ≈ 5.7e-7.
const ITERATIONS = 10000;

const sigmaBound = (p, n, k = 5) => k * Math.sqrt((p * (1 - p)) / n);

describe("randUnit (spec: cryptographically secure randomness only)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns values in [0, 1) with mean ≈ 0.5 over 10k draws", () => {
    let sum = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const u = randUnit();
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
      sum += u;
    }
    const mean = sum / ITERATIONS;
    // stddev of the mean of U(0,1) over n draws = sqrt(1/12)/sqrt(n)
    const tolerance = (5 * Math.sqrt(1 / 12)) / Math.sqrt(ITERATIONS);
    expect(Math.abs(mean - 0.5)).toBeLessThan(tolerance);
  });

  it("throws instead of falling back when crypto is unavailable", () => {
    vi.stubGlobal("crypto", undefined);
    expect(() => randUnit()).toThrow(/crypto\.getRandomValues/);
  });
});

describe("weightedSample (Efraimidis–Spirakis correctness)", () => {
  it("k=1 selection frequencies match exact probabilities w_i/Σw over 10k draws", () => {
    const items = [1, 2, 3];
    const weights = [1, 2, 3];
    const totalW = 6;
    const counts = new Map(items.map((i) => [i, 0]));
    for (let i = 0; i < ITERATIONS; i++) {
      const [picked] = weightedSample(items, weights, 1);
      counts.set(picked, counts.get(picked) + 1);
    }
    for (let idx = 0; idx < items.length; idx++) {
      const p = weights[idx] / totalW;
      const observed = counts.get(items[idx]) / ITERATIONS;
      expect(Math.abs(observed - p)).toBeLessThan(sigmaBound(p, ITERATIONS));
    }
  });

  it("k=2 pair frequencies match sequential weighted sampling without replacement over 10k draws", () => {
    // E–S theorem: top-k by key u^(1/w) has the same distribution as drawing
    // sequentially with probability proportional to remaining weights.
    // P({i,j}) = (wi/W)·(wj/(W−wi)) + (wj/W)·(wi/(W−wj))
    const items = [1, 2, 3, 4];
    const weights = [1, 2, 3, 4];
    const W = 10;
    const expected = new Map();
    for (let a = 0; a < items.length; a++) {
      for (let b = a + 1; b < items.length; b++) {
        const [wa, wb] = [weights[a], weights[b]];
        const p = (wa / W) * (wb / (W - wa)) + (wb / W) * (wa / (W - wb));
        expected.set(`${items[a]}-${items[b]}`, p);
      }
    }
    const counts = new Map([...expected.keys()].map((k) => [k, 0]));
    for (let i = 0; i < ITERATIONS; i++) {
      const pair = weightedSample(items, weights, 2).sort((x, y) => x - y);
      const key = pair.join("-");
      counts.set(key, counts.get(key) + 1);
    }
    for (const [key, p] of expected) {
      const observed = counts.get(key) / ITERATIONS;
      expect(Math.abs(observed - p)).toBeLessThan(sigmaBound(p, ITERATIONS));
    }
  });

  it("never selects zero-weight items when positive-weight items suffice", () => {
    const items = [1, 2, 3, 4];
    const weights = [0, 1, 1, 0];
    for (let i = 0; i < 1000; i++) {
      const picked = weightedSample(items, weights, 2);
      expect(picked.sort((a, b) => a - b)).toEqual([2, 3]);
    }
  });
});

// Independent re-implementations of every spec §5 constraint. These must NOT
// import from generator.js — they are the harness's second opinion.
const TIER_WEIGHTS = { tier1: 0.18, tier2: 0.4, tier3: 1.0 };

const checkNoConsecutiveRun = (sorted) => {
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
    if (run >= 3) return false;
  }
  return true;
};

const checkSumWindow = (sorted, pick, max) => {
  const sum = sorted.reduce((a, b) => a + b, 0);
  const { mean, stddev } = sumStats(pick, max);
  return sum >= mean - 1.5 * stddev && sum <= mean + 2.75 * stddev;
};

const checkSpread = (sorted, max) =>
  sorted[sorted.length - 1] - sorted[0] >= Math.floor(0.4 * max);

const checkDigitDiversity = (sorted) => {
  const counts = new Array(10).fill(0);
  for (const n of sorted) counts[n % 10]++;
  return counts.every((c) => c < 4);
};

const checkParityAndRange = (sorted, pick, max, avoidBirthdays) => {
  const even = sorted.filter((n) => n % 2 === 0).length;
  const low = sorted.filter((n) => n <= max / 2).length;
  if (even === 0 || even === pick) return false;
  if (low === pick) return false;
  if (!avoidBirthdays && low === 0) return false;
  return true;
};

const subsetsOfSize = (arr, size, start = 0) => {
  if (size === 0) return [[]];
  const out = [];
  for (let i = start; i <= arr.length - size; i++) {
    for (const rest of subsetsOfSize(arr, size - 1, i + 1)) out.push([arr[i], ...rest]);
  }
  return out;
};

// No subset of max(4, pick − 1) numbers may be evenly spaced.
const checkNoArithmeticPattern = (sorted) => {
  if (sorted.length < 4) return true;
  const patternLength = Math.max(4, sorted.length - 1);
  return !subsetsOfSize(sorted, patternLength).some((s) =>
    s.every((v, i) => i < 2 || v - s[i - 1] === s[1] - s[0])
  );
};

describe("generatePick — 10k-row filter compliance (6/58, all filters on)", () => {
  const PICK = 6;
  const MAX = 58;
  const rows = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const r = generatePick({
      pick: PICK,
      max: MAX,
      avoidBirthdays: true,
      avoidSequential: true,
      excludedSet: new Set(),
    });
    rows.push(r);
  }

  it("produces 10k valid rows with no relaxation", () => {
    for (const r of rows) {
      expect(r).not.toBeNull();
      expect(r.relaxed).toEqual([]);
    }
  });

  it("every row is sorted, unique, in range", () => {
    for (const { picks } of rows) {
      expect(picks).toHaveLength(PICK);
      expect(new Set(picks).size).toBe(PICK);
      for (let i = 0; i < picks.length; i++) {
        expect(picks[i]).toBeGreaterThanOrEqual(1);
        expect(picks[i]).toBeLessThanOrEqual(MAX);
        if (i > 0) expect(picks[i]).toBeGreaterThan(picks[i - 1]);
      }
    }
  });

  it("every row passes all strict rejection criteria (independent checks)", () => {
    for (const { picks } of rows) {
      expect(checkNoConsecutiveRun(picks)).toBe(true);
      expect(checkSumWindow(picks, PICK, MAX)).toBe(true);
      expect(checkSpread(picks, MAX)).toBe(true);
      expect(checkDigitDiversity(picks)).toBe(true);
      expect(checkParityAndRange(picks, PICK, MAX, true)).toBe(true);
      expect(checkNoArithmeticPattern(picks)).toBe(true);
    }
  });

  it("tiered weights bias per-number frequency in weight order: 32+ > 13–31 > 1–12", () => {
    const freq = new Array(MAX + 1).fill(0);
    for (const { picks } of rows) for (const n of picks) freq[n]++;
    const tierAvg = (lo, hi) => {
      let sum = 0;
      for (let n = lo; n <= hi; n++) sum += freq[n];
      return sum / (hi - lo + 1);
    };
    const avg1 = tierAvg(1, 12);
    const avg2 = tierAvg(13, 31);
    const avg3 = tierAvg(32, MAX);
    expect(avg3).toBeGreaterThan(avg2);
    expect(avg2).toBeGreaterThan(avg1);
    // Weight ratios (0.18 / 0.40 / 1.00) must show up directionally with wide
    // margin: tier3 numbers should appear at least 1.5× as often as tier1.
    expect(avg3 / avg1).toBeGreaterThan(1.5);
  });

  it("mean count of 32+ numbers per row sits in a sane anti-birthday band", () => {
    let highTotal = 0;
    for (const { picks } of rows) {
      highTotal += picks.filter((n) => n >= 32).length;
    }
    const meanHigh = highTotal / rows.length;
    // Uniform baseline would be 6 × 27/58 ≈ 2.79. Weighted sampling must lift
    // this clearly, without degenerating into all-high rows.
    expect(meanHigh).toBeGreaterThan(3.0);
    expect(meanHigh).toBeLessThan(5.9);
  });
});

describe("generatePick — unweighted baseline (avoidBirthdays off)", () => {
  it("10k rows: all-high and all-low rows are both rejected", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const r = generatePick({
        pick: 6,
        max: 58,
        avoidBirthdays: false,
        avoidSequential: true,
        excludedSet: new Set(),
      });
      expect(r).not.toBeNull();
      const low = r.picks.filter((n) => n <= 29).length;
      expect(low).toBeGreaterThan(0);
      expect(low).toBeLessThan(6);
    }
  });
});

describe("generatePick — arithmetic-pattern filter is exercised, not vacuous", () => {
  it("10k rows of a 4/12 game never return an evenly spaced ticket", () => {
    // Unweighted sampling + rejection is uniform over the combinations that
    // pass the other filters, so the expected pattern count WITHOUT the filter
    // is ITERATIONS × (patterned survivors / all survivors) — computed exactly.
    const PICK = 4;
    const MAX = 12;
    const survivors = subsetsOfSize(
      Array.from({ length: MAX }, (_, i) => i + 1),
      PICK
    ).filter(
      (c) =>
        checkSumWindow(c, PICK, MAX) &&
        checkSpread(c, MAX) &&
        checkDigitDiversity(c) &&
        checkParityAndRange(c, PICK, MAX, false)
    );
    const patterned = survivors.filter((c) => !checkNoArithmeticPattern(c)).length;
    const expectedWithoutFilter = (ITERATIONS * patterned) / survivors.length;
    expect(expectedWithoutFilter).toBeGreaterThan(30);

    let patternRows = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const r = generatePick({
        pick: PICK,
        max: MAX,
        avoidBirthdays: false,
        avoidSequential: false,
        excludedSet: new Set(),
      });
      expect(r).not.toBeNull();
      expect(r.relaxed).not.toContain("pattern");
      if (!checkNoArithmeticPattern(r.picks)) patternRows++;
    }
    expect(patternRows).toBe(0);
  });
});

describe("generateMany — batch integrity", () => {
  it("never returns duplicate rows within one batch", () => {
    // Small space (C(10,3) = 120) over many rows makes collisions likely
    // without dedupe; filters may relax on this config, which is irrelevant
    // to the uniqueness guarantee under test.
    const { results } = generateMany({
      count: 30,
      pick: 3,
      max: 10,
      avoidBirthdays: false,
      avoidSequential: false,
      excludedSet: new Set(),
    });
    const keys = results.map((r) => r.picks.join("-"));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("respects the exclusion set and does not mutate it", () => {
    // 2/5 game: whole space is 10 combos; exclude 8, only 2 remain reachable.
    const all = [];
    for (let a = 1; a <= 5; a++) {
      for (let b = a + 1; b <= 5; b++) all.push(`${a}-${b}`);
    }
    const allowed = new Set(["1-4", "2-5"]);
    const excludedSet = new Set(all.filter((k) => !allowed.has(k)));
    const sizeBefore = excludedSet.size;
    const { results } = generateMany({
      count: 10,
      pick: 2,
      max: 5,
      avoidBirthdays: false,
      avoidSequential: false,
      excludedSet,
    });
    expect(excludedSet.size).toBe(sizeBefore);
    expect(results.length).toBeLessThanOrEqual(allowed.size);
    for (const r of results) {
      expect(allowed.has(r.picks.join("-"))).toBe(true);
    }
  });
});
