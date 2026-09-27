import { describe, it, expect } from "vitest";
import { parseDrawsFromText, parseCombosFromText } from "../parsing.js";

describe("parseDrawsFromText — winner column support", () => {
  it("parses the documented format: numbers plus trailing winner count", () => {
    const text = [
      "01-42-23.26-46-32 0", // user's exact format: 0 = rollover, no winner
      "05 11 22 33 44 55 2", // 2 jackpot winners
      "03-08-19-27-38-49", // no winner column
    ].join("\n");
    const { draws, winners, skipped, hasWinnerData } = parseDrawsFromText(text, 6, 58);
    expect(skipped).toBe(0);
    expect(hasWinnerData).toBe(true);
    expect(draws).toEqual([
      [1, 23, 26, 32, 42, 46],
      [5, 11, 22, 33, 44, 55],
      [3, 8, 19, 27, 38, 49],
    ]);
    expect(winners).toEqual([0, 2, null]);
  });

  it("reports hasWinnerData=false when no line carries a count", () => {
    const { hasWinnerData, winners } = parseDrawsFromText("1 2 13 24 35 46", 6, 58);
    expect(hasWinnerData).toBe(false);
    expect(winners).toEqual([null]);
  });

  it("treats dots as separators, never digit glue", () => {
    // "23.26" must read as 23 and 26 — not 2326
    const { draws } = parseDrawsFromText("23.26 1 42 46 32", 6, 58);
    expect(draws).toEqual([[1, 23, 26, 32, 42, 46]]);
  });

  it("keeps the lenient legacy path: out-of-range junk is ignored", () => {
    // a 5-digit draw ID can't be a winner count and gets filtered out
    const { draws, winners } = parseDrawsFromText("98765 4 12 23 34 45 56", 6, 58);
    expect(draws).toEqual([[4, 12, 23, 34, 45, 56]]);
    expect(winners).toEqual([null]);
  });

  it("skips lines that can't form a valid draw", () => {
    const { draws, skipped } = parseDrawsFromText("1 2 3\n7 7 7 7 7 7 1", 6, 58);
    expect(draws).toEqual([]);
    expect(skipped).toBe(2);
  });

  it("ignores comment and header lines", () => {
    const { draws, skipped } = parseDrawsFromText(
      "# draws export\nDate Numbers Winners\n9 18 27 36 45 54 1",
      6,
      58
    );
    expect(draws).toEqual([[9, 18, 27, 36, 45, 54]]);
    expect(skipped).toBe(0);
  });
});

describe("parseDrawsFromText — export-style lines with extra columns", () => {
  it("parses PCSO-style rows: game, combo, date, jackpot, winners", () => {
    const text = [
      "6/58 01-42-23-26-46-32 09/15/2024 49,500,000.00 0",
      "6/58 05-11-22-33-44-55 09/17/2024 51,120,000.00 2",
    ].join("\n");
    const { draws, winners, hasWinnerData } = parseDrawsFromText(text, 6, 58);
    expect(hasWinnerData).toBe(true);
    expect(draws).toEqual([
      [1, 23, 26, 32, 42, 46],
      [5, 11, 22, 33, 44, 55],
    ]);
    expect(winners).toEqual([0, 2]);
  });

  it("leaves winners unknown when the last column is not a bare count", () => {
    // line ends with the jackpot amount — must not be misread as winners
    const { draws, winners } = parseDrawsFromText(
      "6/58 01-42-23-26-46-32 09/15/2024 49,500,000.00",
      6,
      58
    );
    expect(draws).toEqual([[1, 23, 26, 32, 42, 46]]);
    expect(winners).toEqual([null]);
  });

  it("does not misread a leading row index as a winner count", () => {
    const { draws, winners } = parseDrawsFromText("17 01-42-23-26-46-32", 6, 58);
    expect(draws).toEqual([[1, 23, 26, 32, 42, 46]]);
    expect(winners).toEqual([null]);
  });

  it("skips lines with two ambiguous combination groups", () => {
    const { draws, skipped } = parseDrawsFromText(
      "01-02-13-24-35-46 05-11-22-33-44-55",
      6,
      58
    );
    expect(draws).toEqual([]);
    expect(skipped).toBe(1);
  });
});

describe("parseCombosFromText (exclusion import — unchanged contract)", () => {
  it("still parses plain combos and skips partial lines", () => {
    const { combos, skipped } = parseCombosFromText("1 2 13 24 35 46\n5 6", 6, 58);
    expect(combos).toEqual([[1, 2, 13, 24, 35, 46]]);
    expect(skipped).toBe(1);
  });
});
