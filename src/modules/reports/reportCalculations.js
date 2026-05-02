import { parseDrawsFromText } from "@/lib/parsing";
import { randUnit } from "@/lib/generator";

export const getDrawSum = (draw) => draw.reduce((a, b) => a + b, 0);

export const getOddEvenRatio = (draw) => {
  let odd = 0;
  let even = 0;
  for (const n of draw) (n % 2 === 0 ? even++ : odd++);
  return { odd, even };
};

export const getHighLowSplit = (draw, max) => {
  const half = max / 2;
  let low = 0;
  let high = 0;
  for (const n of draw) (n <= half ? low++ : high++);
  return { low, high };
};

export const getFrequencyMap = (pastDraws) => {
  const map = new Map();
  for (const draw of pastDraws) {
    for (const n of draw) map.set(n, (map.get(n) || 0) + 1);
  }
  return map;
};

export const getMaxNumber = (pastDraws) => {
  let m = 0;
  for (const draw of pastDraws) for (const n of draw) if (n > m) m = n;
  return m;
};

export const getDrawStats = (pastDraws, max) =>
  pastDraws.map((numbers, idx) => {
    const sum = getDrawSum(numbers);
    const { odd, even } = getOddEvenRatio(numbers);
    const { low, high } = getHighLowSplit(numbers, max);
    return { index: idx + 1, numbers, sum, odd, even, low, high };
  });

export const normalizeFrequency = (freqMap, max) => {
  const totalDraws = [...freqMap.values()].reduce((a, b) => a + b, 0);
  const out = [];
  for (let n = 1; n <= max; n++) {
    const count = freqMap.get(n) || 0;
    out.push({ number: n, count, frequency: totalDraws > 0 ? count / totalDraws : 0 });
  }
  return out;
};

export const getFrequencyExtremes = (frequencyData) => {
  if (frequencyData.length === 0) return { max: 0, min: 0 };
  let max = -Infinity;
  let min = Infinity;
  for (const d of frequencyData) {
    if (d.count > max) max = d.count;
    if (d.count < min) min = d.count;
  }
  return { max, min };
};

const modeOf = (counter) => {
  let best = null;
  let bestCount = -1;
  for (const [k, v] of counter) {
    if (v > bestCount) {
      bestCount = v;
      best = k;
    }
  }
  return best;
};

export const getAggregateStats = (drawStats, frequencyData) => {
  const totalDraws = drawStats.length;
  if (totalDraws === 0) {
    return {
      totalDraws: 0,
      meanSum: 0,
      stddevSum: 0,
      minSum: 0,
      maxSum: 0,
      hottest: [],
      coldest: [],
      hottestCount: 0,
      coldestCount: 0,
      modeOddEven: "—",
      modeLowHigh: "—",
    };
  }
  const sums = drawStats.map((d) => d.sum);
  const meanSum = sums.reduce((a, b) => a + b, 0) / totalDraws;
  const variance =
    sums.reduce((acc, s) => acc + (s - meanSum) ** 2, 0) / totalDraws;
  const stddevSum = Math.sqrt(variance);

  const { max: maxFreq, min: minFreq } = getFrequencyExtremes(frequencyData);
  const drawnOnly = frequencyData.filter((d) => d.count > 0);
  const colderPool = drawnOnly.length > 0 ? drawnOnly : frequencyData;
  const hottest = frequencyData.filter((d) => d.count === maxFreq).map((d) => d.number);
  const coldest = colderPool
    .filter((d) => d.count === Math.min(...colderPool.map((x) => x.count)))
    .map((d) => d.number);

  const oeCounter = new Map();
  const lhCounter = new Map();
  for (const d of drawStats) {
    const oe = `${d.odd}/${d.even}`;
    const lh = `${d.low}/${d.high}`;
    oeCounter.set(oe, (oeCounter.get(oe) || 0) + 1);
    lhCounter.set(lh, (lhCounter.get(lh) || 0) + 1);
  }

  return {
    totalDraws,
    meanSum,
    stddevSum,
    minSum: Math.min(...sums),
    maxSum: Math.max(...sums),
    hottest,
    coldest,
    hottestCount: maxFreq,
    coldestCount: Math.min(...colderPool.map((x) => x.count)),
    modeOddEven: modeOf(oeCounter) || "—",
    modeLowHigh: modeOf(lhCounter) || "—",
  };
};

export { parseDrawsFromText };

export const generateMockDraws = (pick, max, count) => {
  const draws = [];
  for (let d = 0; d < count; d++) {
    const set = new Set();
    while (set.size < pick) {
      const n = Math.floor(randUnit() * max) + 1;
      set.add(n);
    }
    draws.push([...set].sort((a, b) => a - b));
  }
  return draws;
};
