import { gameKey } from "./presets.js";

export const storageKeys = (pick, max) => {
  const k = gameKey(pick, max);
  return {
    excluded: `lotto-excluded-combos:${k}`,
    settings: `lotto-exclusion-settings:${k}`,
  };
};

const safeRead = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("storage read failed", key, err);
    return null;
  }
};

const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("storage write failed", key, err);
  }
};

export const loadExcluded = (pick, max) => {
  const data = safeRead(storageKeys(pick, max).excluded);
  if (!Array.isArray(data)) return [];
  return data.filter(
    (combo) =>
      Array.isArray(combo) &&
      combo.length === pick &&
      combo.every((n) => Number.isInteger(n) && n >= 1 && n <= max)
  );
};

export const saveExcluded = (pick, max, list) => {
  safeWrite(storageKeys(pick, max).excluded, list);
};

const DEFAULT_SETTINGS = { mode: "off", recentN: 50 };

export const loadSettings = (pick, max) => {
  const data = safeRead(storageKeys(pick, max).settings);
  if (!data || typeof data !== "object") return { ...DEFAULT_SETTINGS };
  const mode = ["off", "all-time", "recent"].includes(data.mode)
    ? data.mode
    : DEFAULT_SETTINGS.mode;
  const recentN = Number.isFinite(data.recentN)
    ? clampRecentN(data.recentN)
    : DEFAULT_SETTINGS.recentN;
  return { mode, recentN };
};

export const saveSettings = (pick, max, settings) => {
  safeWrite(storageKeys(pick, max).settings, settings);
};

export const clampRecentN = (n) => {
  const v = Math.floor(Number(n) || 50);
  return Math.max(10, Math.min(500, v));
};
