// Re-fits the crowd model used by src/lib/scoring.js from draw files that
// carry jackpot winner counts (one draw per line, count as the last field).
//
//   node scripts/calibrate-crowd-model.mjs 6/55=6-55.txt 6/58=6-58.txt
//
// Model: winners_d ~ Poisson(λ_d), log λ_d = α_game + β·B_d + γ·[B_d = pick],
// B_d = numbers in 1–31. Ticket sales vary by draw but are independent of the
// (random) winning combination, so β and γ stay consistent; a within-game
// permutation test guards the p-values against that overdispersion.
// Evenly spaced draws are excluded — the score handles them separately.
import { readFileSync } from "node:fs";
import { parseDrawsFromText } from "../src/lib/parsing.js";
import { hasArithmeticPattern } from "../src/lib/patterns.js";
import { BIRTHDAY_RANGE_MAX } from "../src/lib/scoring.js";
import { randUnit } from "../src/lib/generator.js";

const PERMUTATIONS = 500;
const IRLS_TOLERANCE = 1e-10;
const IRLS_MAX_ITERATIONS = 100;

const loadDataset = (arg) => {
  const [game, file] = arg.split("=");
  const [pick, max] = game.split("/").map(Number);
  const { draws, winners } = parseDrawsFromText(readFileSync(file, "utf8"), pick, max);
  const rows = draws
    .map((numbers, i) => ({ numbers, winners: winners[i] }))
    .filter((row) => row.winners !== null);
  const patterned = rows.filter((row) => hasArithmeticPattern(row.numbers));
  return { game, pick, rows: rows.filter((row) => !patterned.includes(row)), patterned };
};

const invert = (matrix) => {
  const n = matrix.length;
  const m = matrix.map((row, i) => [...row, ...row.map((_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < n; col++) {
    const pivot = m[col][col];
    for (let c = 0; c < 2 * n; c++) m[col][c] /= pivot;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = m[r][col];
      for (let c = 0; c < 2 * n; c++) m[r][c] -= factor * m[col][c];
    }
  }
  return m.map((row) => row.slice(n));
};

const fitPoisson = (X, y) => {
  const p = X[0].length;
  let beta = new Array(p).fill(0);
  let information;
  for (let iter = 0; iter < IRLS_MAX_ITERATIONS; iter++) {
    information = Array.from({ length: p }, () => new Array(p).fill(0));
    const score = new Array(p).fill(0);
    X.forEach((x, i) => {
      const mu = Math.exp(x.reduce((s, v, j) => s + v * beta[j], 0));
      for (let j = 0; j < p; j++) {
        score[j] += (y[i] - mu) * x[j];
        for (let k = 0; k < p; k++) information[j][k] += mu * x[j] * x[k];
      }
    });
    const inverse = invert(information);
    const step = inverse.map((row) => row.reduce((s, v, k) => s + v * score[k], 0));
    beta = beta.map((b, j) => b + step[j]);
    if (Math.max(...step.map(Math.abs)) < IRLS_TOLERANCE) break;
  }
  const se = invert(information).map((row, j) => Math.sqrt(row[j]));
  const logLik = X.reduce((s, x, i) => {
    const eta = x.reduce((t, v, j) => t + v * beta[j], 0);
    return s + y[i] * eta - Math.exp(eta);
  }, 0);
  return { beta, se, logLik };
};

const buildDesign = (datasets, withAllBirthday) =>
  datasets.flatMap((ds, g) =>
    ds.rows.map((row) => {
      const birthdayCount = row.numbers.filter((n) => n <= BIRTHDAY_RANGE_MAX).length;
      const intercepts = datasets.map((_, h) => (h === g ? 1 : 0));
      const allBirthday = birthdayCount === ds.pick ? 1 : 0;
      return withAllBirthday ? [...intercepts, birthdayCount, allBirthday] : [...intercepts, birthdayCount];
    })
  );

const shuffledWithinGames = (datasets) =>
  datasets.flatMap((ds) => {
    const values = ds.rows.map((row) => row.winners);
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(randUnit() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  });

const datasets = process.argv.slice(2).map(loadDataset);
if (datasets.length === 0) {
  console.error("usage: node scripts/calibrate-crowd-model.mjs <pick>/<max>=<file> ...");
  process.exit(1);
}

const y = datasets.flatMap((ds) => ds.rows.map((row) => row.winners));
const X = buildDesign(datasets, true);
const full = fitPoisson(X, y);
const countOnly = fitPoisson(buildDesign(datasets, false), y);
const offset = datasets.length;

const exceed = [0, 0];
for (let t = 0; t < PERMUTATIONS; t++) {
  const permuted = fitPoisson(X, shuffledWithinGames(datasets));
  [0, 1].forEach((k) => {
    if (permuted.beta[offset + k] >= full.beta[offset + k]) exceed[k]++;
  });
}

for (const ds of datasets) {
  const total = ds.rows.reduce((s, row) => s + row.winners, 0);
  console.log(
    `${ds.game}: ${ds.rows.length} draws, ${total} jackpot winners (mean ${(total / ds.rows.length).toFixed(4)}/draw); ` +
      `excluded evenly spaced: ${ds.patterned.map((r) => `${r.numbers.join("-")} (${r.winners} winners)`).join(", ") || "none"}`
  );
}
["β  per birthday number", "γ  all-birthday combo"].forEach((name, k) => {
  const b = full.beta[offset + k];
  const se = full.se[offset + k];
  console.log(
    `${name}: ${b.toFixed(3)} ± ${se.toFixed(3)}  (rate ratio ×${Math.exp(b).toFixed(2)}, ` +
      `permutation p ≤ ${((exceed[k] + 1) / (PERMUTATIONS + 1)).toFixed(4)})`
  );
});
console.log(`likelihood-ratio statistic for γ: ${(2 * (full.logLik - countOnly.logLik)).toFixed(2)} (1 df)`);
