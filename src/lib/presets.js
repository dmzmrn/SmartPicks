export const PRESETS = {
  "6/58": { pick: 6, max: 58, label: "Ultra Lotto 6/58", schedule: "Tue, Fri, Sun" },
  "6/55": { pick: 6, max: 55, label: "Grand Lotto 6/55", schedule: "Mon, Wed, Sat" },
  "6/49": { pick: 6, max: 49, label: "Super Lotto 6/49", schedule: "Tue, Thu, Sun" },
  "6/45": { pick: 6, max: 45, label: "Mega Lotto 6/45", schedule: "Mon, Wed, Fri" },
  "6/42": { pick: 6, max: 42, label: "Lotto 6/42", schedule: "Tue, Thu, Sat" },
  custom: { pick: 6, max: 58, label: "Custom Game" },
};

export const PRESET_KEYS = ["6/58", "6/55", "6/49", "6/45", "6/42", "custom"];

export const PICK_MIN = 1;
export const PICK_MAX = 20;
export const NUM_MIN = 2;
export const NUM_MAX = 99;

export const clampPick = (n) =>
  Math.max(PICK_MIN, Math.min(PICK_MAX, Math.floor(Number(n) || 1)));

export const clampMax = (n) =>
  Math.max(NUM_MIN, Math.min(NUM_MAX, Math.floor(Number(n) || NUM_MIN)));

export const resolveConfig = (key, customPick, customMax) => {
  if (key === "custom") {
    const pick = clampPick(customPick);
    let max = clampMax(customMax);
    if (max < pick) max = pick;
    return { pick, max, label: "Custom Game", schedule: null };
  }
  return PRESETS[key];
};

export const gameKey = (pick, max) => `${pick}-${max}`;
