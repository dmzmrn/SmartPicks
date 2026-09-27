import { combinations } from "./stats.js";
import { hasArithmeticPattern } from "./patterns.js";

// Split-risk score, 0–100. This does NOT rate winning chances (spec §5: the
// tool never predicts) — it rates how many other players are likely to hold
// the same combination, i.e. how unlikely a win is to be shared.
//
// Crowd model (log-linear combination-preference model, cf. Baker & McHale,
// JRSS A 2011), calibrated by Poisson regression of jackpot winner counts on
// 3,086 real PCSO draws — scripts/calibrate-crowd-model.mjs, docs/RESEARCH_LOG.md:
//   log popularity = 0.49 × (numbers in 1–31) + 1.40 × [every number in 1–31]
// Each birthday-range number multiplies expected co-winners by ≈1.6×; a
// combination drawn entirely from 1–31 carries a further ≈4.1×.
//
// Score = share of all possible combinations that are MORE crowded (ties
// count half), computed exactly from the hypergeometric distribution of the
// birthday-range count. A uniformly random combination averages 50.
export const BIRTHDAY_RANGE_MAX = 31;
const LOG_POPULARITY_PER_BIRTHDAY_NUMBER = 0.49;
const LOG_POPULARITY_ALL_BIRTHDAY = 1.4;

const SCORE_BANDS = [
  { min: 80, label: "Excellent" },
  { min: 60, label: "Good" },
  { min: 40, label: "Fair" },
  { min: 0, label: "Weak" },
];

const countBirthdayNumbers = (picks) =>
  picks.filter((n) => n <= BIRTHDAY_RANGE_MAX).length;

const logPopularity = (birthdayCount, pick) =>
  LOG_POPULARITY_PER_BIRTHDAY_NUMBER * birthdayCount +
  (birthdayCount === pick ? LOG_POPULARITY_ALL_BIRTHDAY : 0);

// distribution[k] = P(a uniformly random combination has exactly k numbers
// in 1–31), exact via BigInt binomials; cached per game.
const referenceCache = new Map();

const crowdReference = (pick, max) => {
  const key = `${pick}-${max}`;
  if (!referenceCache.has(key)) {
    const birthdayPool = Math.min(BIRTHDAY_RANGE_MAX, max);
    const total = Number(combinations(max, pick));
    const distribution = Array.from(
      { length: pick + 1 },
      (_, k) =>
        Number(combinations(birthdayPool, k) * combinations(max - birthdayPool, pick - k)) /
        total
    );
    const meanPopularity = distribution.reduce(
      (sum, p, k) => sum + p * Math.exp(logPopularity(k, pick)),
      0
    );
    referenceCache.set(key, { distribution, meanPopularity });
  }
  return referenceCache.get(key);
};

// How often other players choose this combination relative to an average
// combination (1 = average). Covers combinations without an arithmetic
// pattern; patterned ones are off the scale (scoreRow handles them).
export const crowdIndex = (picks, pick, max) =>
  Math.exp(logPopularity(countBirthdayNumbers(picks), pick)) /
  crowdReference(pick, max).meanPopularity;

// Popularity rises strictly with the birthday-range count, so "more crowded"
// means "more numbers in 1–31".
const lessCrowdedShare = (distribution, birthdayCount) => {
  const moreCrowded = distribution
    .slice(birthdayCount + 1)
    .reduce((sum, p) => sum + p, 0);
  return moreCrowded + distribution[birthdayCount] / 2;
};

const formatMultiplier = (x) => (x >= 10 ? Math.round(x) : x.toFixed(x < 1 ? 2 : 1));

const labelFor = (score) => SCORE_BANDS.find((band) => score >= band.min).label;

const ruleReason = (relaxed) =>
  relaxed.length === 0
    ? "passes every rule"
    : `made with loosened rules (${relaxed.join(", ")})`;

// Shared by the Generate tab, the dashboard scorecard, and draw analysis.
// `relaxed` only feeds the explanation: two identical combinations carry the
// same split risk however they were generated.
export const scoreRow = (picks, relaxed, pick, max) => {
  const sorted = [...picks].sort((a, b) => a - b);

  // An evenly spaced ticket outranks every other combination in popularity
  // (433 co-winners vs ≤ 10 in every other recorded draw), so nothing is
  // more crowded than it.
  if (hasArithmeticPattern(sorted)) {
    return {
      score: 0,
      label: labelFor(0),
      reasons: [
        "numbers are evenly spaced — the most-shared kind of ticket",
        ruleReason(relaxed),
      ],
    };
  }

  const birthdayCount = countBirthdayNumbers(sorted);
  const { distribution } = crowdReference(pick, max);
  const score = Math.round(100 * lessCrowdedShare(distribution, birthdayCount));

  return {
    score,
    label: labelFor(score),
    reasons: [
      `${birthdayCount} of ${pick} numbers in the birthday range (1–${BIRTHDAY_RANGE_MAX})`,
      `played ~${formatMultiplier(crowdIndex(sorted, pick, max))}× as often as an average combination`,
      ruleReason(relaxed),
    ],
  };
};
