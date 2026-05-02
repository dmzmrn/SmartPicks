import { sumStats } from "./stats.js";

export const randUnit = () => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 0x100000000;
  }
  return Math.random();
};

export const weightedSample = (items, weights, k) => {
  const keyed = items.map((item, i) => {
    const w = weights[i];
    if (w <= 0) return { item, key: -Infinity };
    let u = randUnit();
    if (u <= 0) u = Number.MIN_VALUE;
    return { item, key: Math.log(u) / w };
  });
  keyed.sort((a, b) => b.key - a.key);
  return keyed.slice(0, k).map((x) => x.item);
};

const buildWeights = (max, avoidBirthdays) => {
  const w = new Array(max);
  for (let i = 0; i < max; i++) {
    const n = i + 1;
    if (!avoidBirthdays) {
      w[i] = 1.0;
    } else if (n <= 12) w[i] = 0.18;
    else if (n <= 31) w[i] = 0.40;
    else w[i] = 1.0;
  }
  return w;
};

const hasConsecutiveRun = (sorted, run = 3) => {
  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      count++;
      if (count >= run) return true;
    } else {
      count = 1;
    }
  }
  return false;
};

const hasDigitRepeat = (picks, threshold = 4) => {
  const counts = new Array(10).fill(0);
  for (const n of picks) counts[n % 10]++;
  return counts.some((c) => c >= threshold);
};

const FILTER_DROP_ORDER = ["digit", "spread", "consecutive", "sum"];
const ATTEMPT_BUDGET = 1000;

const passesFilters = ({
  picks,
  max,
  pick,
  avoidBirthdays,
  avoidSequential,
  excludedSet,
  active,
}) => {
  const sorted = [...picks].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const half = max / 2;
  const lowCount = sorted.reduce((c, n) => c + (n <= half ? 1 : 0), 0);
  const evenCount = sorted.reduce((c, n) => c + (n % 2 === 0 ? 1 : 0), 0);

  if (excludedSet.has(sorted.join("-"))) return false;
  if (evenCount === 0 || evenCount === pick) return false;
  if (lowCount === pick) return false;
  if (!avoidBirthdays && lowCount === 0) return false;

  if (active.sum) {
    const { mean, stddev } = sumStats(pick, max);
    if (sum < mean - 1.5 * stddev || sum > mean + 2.75 * stddev) return false;
  }
  if (active.spread) {
    const spread = sorted[sorted.length - 1] - sorted[0];
    if (spread < Math.floor(0.4 * max)) return false;
  }
  if (active.digit && hasDigitRepeat(sorted, 4)) return false;
  if (active.consecutive && avoidSequential && hasConsecutiveRun(sorted, 3)) {
    return false;
  }

  return true;
};

export const generatePick = ({
  pick,
  max,
  avoidBirthdays,
  avoidSequential,
  excludedSet,
}) => {
  if (pick > max) return null;

  const items = Array.from({ length: max }, (_, i) => i + 1);
  const weights = buildWeights(max, avoidBirthdays);

  const active = { sum: true, spread: true, digit: true, consecutive: true };
  const relaxed = [];

  for (let stage = 0; stage <= FILTER_DROP_ORDER.length; stage++) {
    for (let attempt = 0; attempt < ATTEMPT_BUDGET; attempt++) {
      const sample = weightedSample(items, weights, pick);
      if (
        passesFilters({
          picks: sample,
          max,
          pick,
          avoidBirthdays,
          avoidSequential,
          excludedSet,
          active,
        })
      ) {
        const reportedRelaxed = relaxed.filter(
          (r) => !(r === "consecutive" && !avoidSequential)
        );
        return { picks: [...sample].sort((a, b) => a - b), relaxed: reportedRelaxed };
      }
    }
    const next = FILTER_DROP_ORDER[stage];
    if (!next) break;
    active[next] = false;
    relaxed.push(next);
  }

  return null;
};

export const generateMany = ({
  count,
  pick,
  max,
  avoidBirthdays,
  avoidSequential,
  excludedSet,
}) => {
  const results = [];
  const allRelaxed = new Set();
  for (let i = 0; i < count; i++) {
    const r = generatePick({
      pick,
      max,
      avoidBirthdays,
      avoidSequential,
      excludedSet,
    });
    if (r) {
      results.push(r);
      r.relaxed.forEach((x) => allRelaxed.add(x));
    }
  }
  return { results, relaxed: [...allRelaxed] };
};
