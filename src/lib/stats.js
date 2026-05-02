export const sumStats = (pick, max) => {
  const mean = (pick * (max + 1)) / 2;
  const singleVar = (max * max - 1) / 12;
  const fpc = max > 1 ? (max - pick) / (max - 1) : 0;
  return { mean, stddev: Math.sqrt(pick * singleVar * fpc) };
};

export const computeStats = (picks, max) => {
  const pick = picks.length;
  const sorted = [...picks].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const { mean, stddev } = sumStats(pick, max);
  const z = stddev > 0 ? (sum - mean) / stddev : 0;
  const half = max / 2;
  const lowCount = sorted.reduce((c, n) => c + (n <= half ? 1 : 0), 0);
  const evenCount = sorted.reduce((c, n) => c + (n % 2 === 0 ? 1 : 0), 0);
  const spread = sorted[sorted.length - 1] - sorted[0];
  return {
    sum,
    z,
    low: lowCount,
    high: pick - lowCount,
    even: evenCount,
    odd: pick - evenCount,
    spread,
  };
};

const factorial = (n) => {
  let r = 1n;
  for (let i = 2n; i <= BigInt(n); i++) r *= i;
  return r;
};

export const combinations = (n, k) => {
  if (k < 0 || k > n) return 0n;
  if (k === 0 || k === n) return 1n;
  const kk = Math.min(k, n - k);
  let num = 1n;
  let den = 1n;
  for (let i = 0n; i < BigInt(kk); i++) {
    num *= BigInt(n) - i;
    den *= i + 1n;
  }
  return num / den;
};

export const formatBigInt = (n) => {
  const s = n.toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export { factorial };
