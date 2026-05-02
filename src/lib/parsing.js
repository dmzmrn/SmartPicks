export const parseLine = (line, pick, max) => {
  if (!line) return null;
  if (/^[#a-zA-Z]/.test(line) || line.startsWith("//")) return null;
  const cleaned = line.replace(/[^0-9\s,\-]/g, "");
  const nums = cleaned
    .split(/[\s,\-]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= max);
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

export const parseDrawsFromText = (text, pick, max) => {
  const { combos: draws, skipped } = parseCombosFromText(text, pick, max);
  return { draws, skipped };
};
