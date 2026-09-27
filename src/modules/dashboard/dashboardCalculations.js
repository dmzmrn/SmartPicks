import { sumStats } from "@/lib/stats";
import { scoreRow } from "@/lib/scoring";

// Weight tiers from spec §5 (CLAUDE.md): 1–12 = 0.18, 13–31 = 0.40, 32+ = 1.00.
export const TIER_DEFS = [
  { key: "tier1", label: "1–12", lo: 1, hi: 12 },
  { key: "tier2", label: "13–31", lo: 13, hi: 31 },
  { key: "tier3", label: "32+", lo: 32, hi: Infinity },
];

const allNumbers = (rows) => rows.flat();

// Shared frequency counter for both generated picks and fed draws:
// `rows` is an array of number arrays.
export const frequencyShare = (rows, max) => {
  const counts = new Array(max + 1).fill(0);
  let total = 0;
  for (const row of rows) {
    for (const n of row) {
      if (n >= 1 && n <= max) {
        counts[n]++;
        total++;
      }
    }
  }
  const out = [];
  for (let n = 1; n <= max; n++) {
    out.push({ number: n, count: counts[n], share: total > 0 ? counts[n] / total : 0 });
  }
  return out;
};

export const getTierDistribution = (pickRows, max) => {
  const nums = allNumbers(pickRows);
  const total = nums.length;
  return TIER_DEFS.map(({ label, lo, hi }) => {
    const cappedHi = Math.min(hi, max);
    if (cappedHi < lo) return null;
    const size = cappedHi - lo + 1;
    const count = nums.filter((n) => n >= lo && n <= cappedHi).length;
    return {
      tier: label,
      generated: total > 0 ? (count / total) * 100 : 0,
      baseline: (size / max) * 100,
    };
  }).filter(Boolean);
};

export const getSumHistogram = (pickRows, pick, max, binCount = 18) => {
  const { mean, stddev } = sumStats(pick, max);
  const window = {
    low: mean - 1.5 * stddev,
    mean,
    high: mean + 2.75 * stddev,
  };
  const minSum = (pick * (pick + 1)) / 2;
  const maxSum = pick * max - (pick * (pick - 1)) / 2;
  const binSize = Math.max(1, Math.ceil((maxSum - minSum + 1) / binCount));
  const bins = [];
  for (let from = minSum; from <= maxSum; from += binSize) {
    bins.push({ mid: from + binSize / 2, from, to: from + binSize - 1, count: 0 });
  }
  for (const row of pickRows) {
    const sum = row.reduce((a, b) => a + b, 0);
    const idx = Math.min(bins.length - 1, Math.floor((sum - minSum) / binSize));
    if (idx >= 0) bins[idx].count++;
  }
  return { bins, window, minSum, maxSum };
};

export const getMatchDistribution = (pickRows, draws, pick) => {
  const dist = new Array(pick + 1).fill(0);
  let best = 0;
  const drawSets = draws.map((d) => new Set(d));
  for (const row of pickRows) {
    for (const set of drawSets) {
      let matches = 0;
      for (const n of row) if (set.has(n)) matches++;
      dist[matches]++;
      if (matches > best) best = matches;
    }
  }
  const totalPairs = pickRows.length * draws.length;
  return {
    totalPairs,
    best,
    distribution: dist.map((count, matches) => ({
      matches,
      count,
      share: totalPairs > 0 ? (count / totalPairs) * 100 : 0,
    })),
  };
};

// The most recent generation batch: all history entries sharing the last
// timestamp (generateMany stamps a whole batch with one ts).
export const getLatestBatch = (history) => {
  if (history.length === 0) return [];
  const lastTs = history[history.length - 1].ts;
  return history.filter((h) => h.ts === lastTs);
};

// Scores every fed draw's winning combination with the same split-risk score
// used for generated picks, then relates score to real winner counts when the
// file provides them. This is the empirical check of the split-avoidance
// thesis: crowd-like winning combos should average MORE winners than
// uncommon ones.
export const getDrawScoreAnalysis = (draws, winners, pick, max) => {
  const scored = draws.map((numbers, i) => ({
    score: scoreRow(numbers, [], pick, max).score,
    winners: Array.isArray(winners) && Number.isFinite(winners[i]) ? winners[i] : null,
  }));

  const bands = [
    { band: "0–39", lo: 0, hi: 39 },
    { band: "40–59", lo: 40, hi: 59 },
    { band: "60–79", lo: 60, hi: 79 },
    { band: "80–100", lo: 80, hi: 100 },
  ].map(({ band, lo, hi }) => ({
    band,
    count: scored.filter((s) => s.score >= lo && s.score <= hi).length,
  }));

  const avgScore =
    scored.length > 0 ? scored.reduce((a, s) => a + s.score, 0) / scored.length : 0;

  const withWinners = scored.filter((s) => s.winners !== null);
  const bucketOf = (items) => ({
    draws: items.length,
    avgWinners:
      items.length > 0 ? items.reduce((a, s) => a + s.winners, 0) / items.length : 0,
    jackpotHitShare:
      items.length > 0
        ? (items.filter((s) => s.winners > 0).length / items.length) * 100
        : 0,
  });

  return {
    totalDraws: scored.length,
    avgScore,
    bands,
    hasWinnerData: withWinners.length > 0,
    withWinnerCount: withWinners.length,
    crowdLike: bucketOf(withWinners.filter((s) => s.score < 60)),
    uncommon: bucketOf(withWinners.filter((s) => s.score >= 60)),
  };
};

export const getDashboardSummary = (history, draws, pick, max) => {
  const rows = history.map((h) => h.picks);
  const { mean, stddev } = sumStats(pick, max);
  let sumTotal = 0;
  let spreadTotal = 0;
  let highCount = 0;
  let numTotal = 0;
  for (const row of rows) {
    sumTotal += row.reduce((a, b) => a + b, 0);
    spreadTotal += row[row.length - 1] - row[0];
    for (const n of row) {
      numTotal++;
      if (n >= 32) highCount++;
    }
  }
  const relaxedRows = history.filter((h) => h.relaxed.length > 0).length;
  return {
    totalRows: rows.length,
    totalDraws: draws.length,
    meanSum: rows.length > 0 ? sumTotal / rows.length : 0,
    theoreticalMean: mean,
    window: { low: mean - 1.5 * stddev, high: mean + 2.75 * stddev },
    meanSpread: rows.length > 0 ? spreadTotal / rows.length : 0,
    minSpread: Math.floor(0.4 * max),
    highShare: max >= 32 && numTotal > 0 ? (highCount / numTotal) * 100 : null,
    highBaseline: max >= 32 ? ((max - 31) / max) * 100 : null,
    relaxedRows,
    lastGeneratedTs: history.length > 0 ? history[history.length - 1].ts : null,
  };
};
