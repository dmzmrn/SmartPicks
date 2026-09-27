// Junk characters become separators (not deleted) so "23.26" reads as two
// numbers, never as 2326.
const extractTokens = (line) =>
  line
    .replace(/[^0-9\s,\-]/g, " ")
    .split(/[\s,\-]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isInteger(n));

const isCommentLine = (line) =>
  !line || /^[#a-zA-Z]/.test(line) || line.startsWith("//");

export const parseLine = (line, pick, max) => {
  if (isCommentLine(line)) return null;
  const nums = extractTokens(line).filter((n) => n >= 1 && n <= max);
  const unique = [...new Set(nums)].sort((a, b) => a - b);
  if (unique.length === pick) return unique;
  return nums.length > 0 ? "skip" : null;
};

export const parseCombosFromText = (text, pick, max) => {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const combos = [];
  let skipped = 0;
  for (const line of lines) {
    const result = parseLine(line, pick, max);
    if (Array.isArray(result)) combos.push(result);
    else if (result === "skip") skipped++;
  }
  return { combos, skipped };
};

// A draw line is `pick` numbers, optionally followed by ONE winner count:
//   "01-42-23-26-46-32"     → draw, winner count unknown
//   "01-42-23-26-46-32 0"   → draw, 0 jackpot winners (rollover)
//   "01-42-23-26-46-32 2"   → draw, 2 jackpot winners
// Real-world exports with extra columns are also supported, as long as the
// combination is one joined group (dashes or dots) and the winner count is
// the LAST field on the line:
//   "6/58 01-42-23-26-46-32 09/15/2024 49,500,000.00 0" → draw, 0 winners
const MAX_WINNER_COUNT = 9999;

// Finds exactly one run of `pick` numbers joined by dashes/dots (the standard
// combination notation). Dates use slashes and amounts use commas, so neither
// can collide with a pick≥3 group.
const findComboGroup = (line, pick, max) => {
  const groups = [];
  for (const m of line.matchAll(/(?<!\d)\d{1,3}(?:[-.]\d{1,3})+(?!\d)/g)) {
    const nums = m[0].split(/[-.]/).map(Number);
    if (nums.length === pick) groups.push({ text: m[0], nums });
  }
  if (groups.length !== 1) return null;
  const { text, nums } = groups[0];
  const valid =
    new Set(nums).size === pick && nums.every((n) => n >= 1 && n <= max);
  return valid ? { text, nums } : null;
};

const parseDrawLine = (line, pick, max) => {
  if (isCommentLine(line)) return null;
  const tokens = extractTokens(line);
  if (tokens.length === 0) return null;

  const isValidDraw = (nums) =>
    nums.length === pick &&
    new Set(nums).size === pick &&
    nums.every((n) => n >= 1 && n <= max);

  // A single joined combination group (dashes/dots) is the strongest signal —
  // check it before the token-count paths so extra columns (row indexes,
  // dates, amounts) can't be mistaken for numbers or winner counts.
  // The winner count, when present, is the last whitespace-separated field.
  const group = findComboGroup(line, pick, max);
  if (group) {
    const fields = line.trim().split(/\s+/);
    const lastField = fields[fields.length - 1];
    const winners =
      lastField !== group.text && /^\d{1,4}$/.test(lastField)
        ? Number(lastField)
        : null;
    return { numbers: [...group.nums].sort((a, b) => a - b), winners };
  }

  if (isValidDraw(tokens)) {
    return { numbers: [...tokens].sort((a, b) => a - b), winners: null };
  }

  if (tokens.length === pick + 1) {
    const numbers = tokens.slice(0, pick);
    const last = tokens[tokens.length - 1];
    if (isValidDraw(numbers) && last >= 0 && last <= MAX_WINNER_COUNT) {
      return { numbers: [...numbers].sort((a, b) => a - b), winners: last };
    }
  }

  // Lenient fallback (pre-winner-column behavior): ignore out-of-range
  // tokens like draw IDs or dates, keep the line if exactly `pick` valid
  // unique numbers remain.
  const filtered = [...new Set(tokens.filter((n) => n >= 1 && n <= max))].sort(
    (a, b) => a - b
  );
  if (filtered.length === pick) return { numbers: filtered, winners: null };
  return "skip";
};

export const parseDrawsFromText = (text, pick, max) => {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const draws = [];
  const winners = [];
  let skipped = 0;
  for (const line of lines) {
    const result = parseDrawLine(line, pick, max);
    if (result && result !== "skip") {
      draws.push(result.numbers);
      winners.push(result.winners);
    } else if (result === "skip") {
      skipped++;
    }
  }
  return {
    draws,
    winners,
    skipped,
    hasWinnerData: winners.some((w) => w !== null),
  };
};
