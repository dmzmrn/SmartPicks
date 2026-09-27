# Lotto Smart Pick — Project Brief

A React single-page app that generates statistically-tuned lottery numbers and analyzes historical draw data. Designed to **minimize jackpot splitting** (not predict winners — every combination has identical odds). UI uses **shadcn/ui** throughout.

---

## 1. Project goal

Two co-located capabilities behind one UI:

1. **Smart pick generator** — produces lottery combinations using weighted sampling and statistical filters that avoid the patterns the public over-picks (birthday ranges, narrow clusters, all-same parity, etc.).
2. **Reports & distribution module** — analyzes uploaded historical draw data with charts, frequency heatmaps, and pattern trends.

Both modules respect a shared **game preset** (6/58, 6/55, 6/49, 6/45, 6/42, or custom).

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite (JavaScript, no TS unless preferred) |
| Styling | Tailwind CSS, dark mode default (Light / Dark / System available) |
| Components | **shadcn/ui** — initialize via `npx shadcn-ui@latest init` |
| Charts | `recharts` (lazy-loaded only when Reports tab is opened) |
| RNG | `crypto.getRandomValues()` only — throws if unavailable (CLAUDE.md §5) |
| State | `useState` / `useEffect` / `useCallback` only — no Redux/Zustand |
| Persistence | `localStorage` (per-game keys) |
| Toasts | `sonner` (shipped with shadcn) |

**shadcn components to install:**
```
card button input label slider switch select tabs badge
toggle-group separator sonner tooltip scroll-area dialog
alert table
```

**Other npm deps:**
```
recharts
```

---

## 3. Theme & design system

Clean, professional, restrained: neutral surfaces, **one** accent, no gradients or glows.
Every color is a CSS token in `src/index.css`; components never hardcode colors.

### Tokens & presets
- shadcn HSL tokens (`--background`, `--card`, `--primary`, `--muted-foreground`, `--border`, …) plus `--warning` and chart tokens.
- **Mode:** `.dark` on `<html>` — Light / Dark / System (System follows `prefers-color-scheme`). Default **Dark**.
- **Accent preset:** `data-theme` on `<html>` — **Slate** (default), Blue, Teal. Only `--primary` / `--ring` change.
- Persisted in `localStorage["lotto-theme"]` as `{ mode, preset }`; an inline script in `index.html` applies it before first paint.

### Typography
- **Inter** (Google Fonts) for all UI text, `tabular-nums` for figures; system monospace only for paste/separator inputs.

### Surfaces
- Page `bg-background`; cards `bg-card` + 1px `border` + `shadow-sm`, radius `0.5rem`.
- Stat strips are one bordered card split by 1px gaps (`gap-px bg-border`), not separate cards.

### Layout
- Sticky top bar (logo, name, settings) · game title + game `Select` · stats strip · tabs.
- Container `max-w-6xl` for every tab. Generate is two columns on `lg` (settings 320px | results).

## 4. Game presets

```js
export const PRESETS = {
  "6/58": { pick: 6, max: 58, label: "Ultra Lotto 6/58", schedule: "Tue, Fri, Sun" },
  "6/55": { pick: 6, max: 55, label: "Grand Lotto 6/55", schedule: "Mon, Wed, Sat" },
  "6/49": { pick: 6, max: 49, label: "Super Lotto 6/49", schedule: "Tue, Thu, Sun" },
  "6/45": { pick: 6, max: 45, label: "Mega Lotto 6/45", schedule: "Mon, Wed, Fri" },
  "6/42": { pick: 6, max: 42, label: "Lotto 6/42", schedule: "Tue, Thu, Sat" },
  custom: { pick: 6, max: 58, label: "Custom Game" },
};
```

**Custom game:** user-configurable. Clamp `pick ∈ [1, 20]`, `max ∈ [2, 99]`, `pick ≤ max`.

---

## 5. Generator algorithm

### Crypto-backed RNG
```js
const randUnit = () => {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("crypto.getRandomValues is unavailable; secure randomness is required.");
  }
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 0x100000000;
};
```

### Efraimidis–Spirakis weighted sampling without replacement
```js
const weightedSample = (items, weights, k) => {
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
```

### Theoretical sum stats (game-parametric)
```js
// Mean and stddev of the sum of `pick` distinct draws from {1..max}
// with finite-population correction.
const sumStats = (pick, max) => {
  const mean = (pick * (max + 1)) / 2;
  const singleVar = (max * max - 1) / 12;
  const fpc = max > 1 ? (max - pick) / (max - 1) : 0;
  return { mean, stddev: Math.sqrt(pick * singleVar * fpc) };
};
```

### Filter cascade
Per attempt budget = **1000** attempts per stage. If a stage exhausts, drop filters in this order and retry: **digit → spread → consecutive → sum → pattern**. Hard filters (parity, all-low, excluded set) never drop.

Return `{ picks: number[], relaxed: string[] } | null`.

### Filter specifications

| # | Filter | When | Behavior |
|---|---|---|---|
| 1 | **Tiered birthday weights** | toggle ON | `n ≤ 12 → 0.18`, `13–31 → 0.40`, `n ≥ 32 → 1.0`. Toggle OFF → all weights 1.0. |
| 2 | **Asymmetric sum window** | always on, droppable | Reject if `sum < μ − 1.5σ` OR `sum > μ + 2.75σ`. Asymmetric because public skews low. |
| 3 | **All-even / all-odd** | always on, hard | Reject if `evenCount === 0 || evenCount === pick`. |
| 4 | **All-low / all-high** | conditional, hard | Always reject all-low (`lowCount === pick`). Reject all-high (`lowCount === 0`) **only when avoidBirthdays is OFF** — under bias, all-high is the goal. |
| 5 | **Spread** | always on, droppable | `max(picks) − min(picks) ≥ ⌊0.4 × max⌋` |
| 6 | **Last-digit diversity** | always on, droppable | No last digit (`n % 10`) appears in ≥ 4 picks |
| 7 | **3+ consecutive run** | toggle ON, droppable | No run of 3 consecutive integers in sorted picks |
| 8 | **Excluded set** | always on, hard | Reject if `picks.join("-")` is in active excluded Set |
| 9 | **Arithmetic pattern** | always on, droppable (last) | Reject if ≥ `max(4, pick − 1)` numbers are evenly spaced (e.g. 09·18·27·36·45·54 — 433 PCSO jackpot winners, 1 Oct 2022). `src/lib/patterns.js` |

**Reporting `relaxed[]`:** filter out `"consecutive"` if `avoidSequential` was OFF (not a real relaxation).

### Per-result statistics (for the badge)
```js
const computeStats = (picks, max) => {
  const pick = picks.length;
  const sum = picks.reduce((a, b) => a + b, 0);
  const { mean, stddev } = sumStats(pick, max);
  const z = stddev > 0 ? (sum - mean) / stddev : 0;
  const half = max / 2;
  const lowCount = picks.reduce((c, n) => c + (n <= half ? 1 : 0), 0);
  const evenCount = picks.reduce((c, n) => c + (n % 2 === 0 ? 1 : 0), 0);
  const spread = picks[picks.length - 1] - picks[0];
  return {
    sum, z,
    low: lowCount, high: pick - lowCount,
    even: evenCount, odd: pick - evenCount,
    spread,
  };
};
```

---

## 6. UI structure (generator app)

shadcn `Tabs`: `generate` | `excluded` | `reports` | `info`.

### 6.1 Header
- Sticky top bar: accent logo tile + "Smart Pick" + tagline "Lottery numbers the crowd doesn't play" + settings (Appearance dialog: Mode, Accent, Reset)
- Page heading: game label as `<h1>`, subline "Pick {pick} from 1–{max} · Draws {schedule} at 9:00 PM"

### 6.2 Game preset selector (right of the page heading)
- shadcn `Select` listing every preset label
- When `custom` selected: two `Input type="number"` for pick and max beside it

### 6.3 Stats bar (3 small Cards)
- **Jackpot Odds:** `1 in C(max, pick)` — use `BigInt` for factorials
- **Excluded Combos:** count of stored
- **Ticket Price:** `₱25`

### 6.4 Generate tab

**Options Card:**
- shadcn `Switch` "Avoid birthday range (1–31)" — defaults ON
- shadcn `Switch` "Avoid 3+ consecutive" — defaults ON
- shadcn `Slider` "Sets" range `[1, 20]`, default `5`, with right-aligned numeric label

**Generate Button:** full-width primary `Button` inside the settings card, label `Generate {n} pick{s}`. Disabled while loading. Loading state label: "Generating…".

**Warning banner** (`Alert variant="warning"`, conditional): "Filters relaxed: <list>. The generator couldn't satisfy every constraint within its attempt budget — try reducing your exclusion list or loosening the toggles for stricter output."

**Copy controls Card** (visible when results > 0):
- `ToggleGroup` (single): Horizontal | Vertical
- `Input` (separator, max 8 chars, default `", "`, disabled when vertical with `title` attr explaining why)
- "Copy all" `Button` right-aligned (changes to "✓ Copied" for 1.5s)

**Result row** (per generated set):
- Monospace index `#01`
- Column container holding:
  - **Ball row:** 40px circles; numbers 32+ use the accent fill (`bg-primary`), 1–31 stay neutral (`bg-secondary` + border). A legend under the list explains it.
  - **Stats line** (12px, muted labels, foreground values): `Sum` `z` `Low/High` `Even/Odd` `Span`
- **Crowd score** (`src/lib/scoring.js`): 0–100 number + label + thin accent meter. Score = share of all combinations more crowded than this one (calibrated model — see `docs/RESEARCH_LOG.md`, 2026-09-27)
- Per-row Copy icon button (tooltip) → check icon for 1.5s
- Per-row Exclude icon button (tooltip) → check icon + disabled when in excluded set

### 6.5 Excluded tab — three Cards

**1. Exclusion Mode Card**
- Pill `Button` group: Off | All-time | Recent only
- When Recent: `Input type="number"` N (range 10–500, default 50) + `(10–500)` hint
- Status line: `"Excluding X of Y stored combinations"` (or `"X stored (none active)"` for Off)

**Active set logic:**
```js
const effectiveExcludedList =
  mode === "off" ? []
  : mode === "recent" ? excluded.slice(-recentN)
  : excluded;
```

**2. Import / Export Card**
- "Import from File" button (hidden `<input type="file" accept=".txt,.csv">`)
- Parser: split on `\n`, trim, skip lines starting with `#`/`//`/letters, accept `[\s,\-]+` separators, must yield exactly `pick` distinct numbers in `[1, max]`
- "Export to File" button → blob download `excluded-{pick}-{max}-{timestamp}.txt` with header:
  ```
  # Lotto Smart Pick - Excluded Combinations
  # Game: 6/58
  # Exported: {locale string}
  # {N} combinations
  ```
  followed by space-separated numbers per line
- `sonner` toast on import: "filename.txt: N combos added, M duplicates skipped" (auto-dismiss after 5s)

**3. Manual Paste Card**
- shadcn `Textarea` (4 rows, monospace font), placeholder:
  ```
  e.g.
  14 08 22 50 58 19
  02, 18, 47, 12, 32, 11
  31-16-45-10-47-32
  ```
- "Add to Excluded List" button (disabled when textarea empty)

**Stored combos list** — `ScrollArea` max-height 320px:
- Each entry: small balls (size `sm`, 32px) + ✕ remove button
- "Clear All" button at top (`variant="destructive"`)

### 6.6 Reports tab
Render the Reports module — see Section 7. Pass current preset:
```jsx
<ReportsModule
  pick={effectiveConfig.pick}
  max={effectiveConfig.max}
  gameLabel={effectiveConfig.label}
/>
```
Lazy-load: `const ReportsModule = lazy(() => import("./modules/reports/ReportsModule"))`.

### 6.7 How It Works tab
Vertical Cards. Required sections (in order):

1. **What this tool does** — Anti-jackpot-splitting framing
2. **The crowd score** — calibrated model, what the number means
3. **Avoid birthday range (tiered weights)** — Explain the 0.18/0.40/1.0 scheme with marginal probabilities
4. **Avoid 3+ consecutive** — Visual pattern avoidance
5. **Evenly spaced patterns (always on)** — the 433-winner draw
6. **Statistical balance (always on)** — Asymmetric sum window, parity, low/high
7. **Number spread (always on)** — 40% of max threshold
8. **Ending-digit diversity (always on)** — ≥4 share rejection
9. **Sampling method** — Crypto-only RNG + Efraimidis–Spirakis explanation
10. **Excluding past winners** — Honest framing: independent draws, recent mode is preference not edge
11. **Sources** — linked references
12. **Honest disclaimer** — destructive `Alert`: "No tool can predict lotto numbers. Every combo has the same odds. Treat lotto as entertainment."

---

## 7. Reports & Distribution Module

A self-contained module. Lives at `src/modules/reports/`. Designed to be embedded — **no global headers or navigation**.

### 7.1 Props
```ts
ReportsModule({
  pick: number,        // game pick count (default 6)
  max: number,         // game max number (default 58)
  gameLabel: string,   // human-readable (default "Lotto")
})
```

### 7.2 State machine
1. **Initial:** no draws loaded → upload card visible, Generate Report disabled, empty state below
2. **Loaded:** draws parsed → upload card shows file chip + count, Generate Report enabled
3. **Generated:** Generate clicked → all charts render below upload card

**Reset rules:**
- Switching the parent's `pick`/`max` resets state (the file isn't valid for a different game)
- Clicking "Clear" resets state but keeps preset

### 7.3 File upload card
- `Card` with shadcn `Button` (`variant="outline"` initially, `"secondary"` once loaded → "Replace file")
- `Button variant="ghost" size="sm"` "Load demo data" — uses `sampleDraws6_58` for 6/58, otherwise `generateMockDraws(pick, max, 30)`
- `Button variant="ghost" size="sm"` "Clear" (when loaded)
- Inline file-chip after upload: `{filename} · {N} draws loaded`
- Inline error (red bordered alert) if no valid draws found
- Footer row: status hint left, "Generate Report" button right (`disabled={!hasDraws}`)

### 7.4 Parser
```js
const parseDrawsFromText = (text, pick, max) => {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const draws = [];
  let skipped = 0;
  for (const line of lines) {
    if (/^[#a-zA-Z]/.test(line) || line.startsWith("//")) continue;
    const nums = line
      .replace(/[^0-9\s,\-]/g, "")
      .split(/[\s,\-]+/)
      .map(Number)
      .filter(n => Number.isInteger(n) && n >= 1 && n <= max);
    const unique = [...new Set(nums)].sort((a, b) => a - b);
    if (unique.length === pick) draws.push(unique);
    else if (nums.length > 0) skipped++;
  }
  return { draws, skipped };
};
```

### 7.5 Module layout (after Generate clicked)

```
┌─ Summary stats (6 cards in 2/3/6 grid) ─────────────────┐
│ Total draws  Mean sum  Sum range  Hottest  Coldest  O/E │
└─────────────────────────────────────────────────────────┘
┌─ Sum per draw (full width area chart) ───────────────────┐
└──────────────────────────────────────────────────────────┘
┌─ Number frequency (2/3 wide) ────┐ ┌─ Pattern trends ──┐
└──────────────────────────────────┘ └────────────────────┘
┌─ Frequency heatmap (full width) ─────────────────────────┐
└──────────────────────────────────────────────────────────┘
┌─ Past draws table (sortable, scrollable) ────────────────┐
└──────────────────────────────────────────────────────────┘
```

### 7.6 Subcomponents

| File | Purpose |
|---|---|
| `ReportsModule.jsx` | Container with state machine; coordinates upload → generate → render |
| `FileUploadCard.jsx` | Upload UI + Generate Report button |
| `SummaryStats.jsx` | 6-card stat strip (total, mean ± σ, range, hottest, coldest, mode O/E) |
| `SumDistributionChart.jsx` | Recharts `AreaChart` with gradient fill + reference line at mean |
| `FrequencyDistributionChart.jsx` | Recharts `BarChart`; hottest and coldest bars highlighted (full opacity), others muted |
| `PatternAnalysisChart.jsx` | Stacked `BarChart` with `ToggleGroup` to switch Odd/Even ↔ Low/High |
| `ClusterHeatmap.jsx` | CSS grid (14 cols), each cell = number, opacity intensity by frequency |
| `DrawDistributionList.jsx` | Sortable `<table>` with sticky header inside `ScrollArea`. Columns: # / Numbers / Sum / O/E / L/H |
| `reportCalculations.js` | Pure utility functions (see 7.7) |
| `sampleDraws.js` | 40-row 6/58 demo dataset |

### 7.7 Calculations

```js
export const getDrawSum = (draw) => …
export const getOddEvenRatio = (draw) => ({ odd, even })
export const getHighLowSplit = (draw, max) => ({ low, high })
export const getFrequencyMap = (pastDraws) => Map<number, count>
export const getMaxNumber = (pastDraws) => number
export const getDrawStats = (pastDraws, max) => Array<{ index, numbers, sum, odd, even, low, high }>
export const normalizeFrequency = (freqMap, max) => Array<{ number, count, frequency }>
export const getFrequencyExtremes = (frequencyData) => ({ max, min })
export const getAggregateStats = (drawStats, frequencyData) => {
  totalDraws, meanSum, stddevSum, minSum, maxSum,
  hottest: number[], coldest: number[], hottestCount, coldestCount,
  modeOddEven: "odd/even string", modeLowHigh: "low/high string",
}
export const parseDrawsFromText = (text, pick, max) => { draws, skipped }
export const generateMockDraws = (pick, max, count) => Array<number[]>
```

### 7.8 Chart styling conventions
- All charts wrapped in `<Card>` with `<CardHeader>` (title + description) and `<CardContent>`
- Shared theme: `src/lib/chartTheme.jsx` — colors are CSS variables, so charts follow light/dark automatically
- Palette (dataviz reference, validated for CVD + ≥ 3:1 contrast on the card surface in both modes): slot 1 blue `--chart-1`, slot 2 orange `--chart-2`, gray reference `--chart-reference`
- Dashboard entity colors: your picks = blue, real draws = orange, uniform baseline = gray
- Tooltip and legend text use text tokens, never the series color
- Solid horizontal gridlines (`--chart-grid`); dashed lines only for thresholds
- Chart height `h-64`–`h-72`; bars `radius={[4, 4, 0, 0]}`
- Frequency chart: one hue, most/least-drawn bars at full opacity, others 35%. Heatmap: one-hue sequential ramp

### 7.9 Component constraints
- Each component file < 120 lines
- No heavy logic inside JSX (extract to helpers or `useMemo`)
- Charts receive pre-computed data via props (no fetching, no async inside)
- All calculations pure and exported from `reportCalculations.js`

---

## 8. Persistence (localStorage)

Per game key (`{pick}-{max}`):
```
lotto-excluded-combos:{key}      → JSON array of combos (number[][])
lotto-exclusion-settings:{key}   → JSON { mode: "off"|"all-time"|"recent", recentN: number }
```

**Load on mount + on preset change.** Validate parsed JSON shape; fall back to defaults on error. Log `console.error` on write failure (storage full / private mode).

---

## 9. Edge cases & validation

- **Custom game inputs:** clamp pick `[1, 20]`, max `[2, 99]`, enforce `pick ≤ max` on submit
- **Empty results:** if all stages exhaust → return `null`, omit that row, don't error
- **File import:** skip lines starting with `#`/`//`/letters; reject lines that don't yield exactly `pick` distinct in-range numbers (count as "skipped")
- **Recent N input:** clamp `[10, 500]` on every change
- **localStorage failures:** silent fallback with `console.error`, never crash
- **Clipboard API:** if `navigator.clipboard` unavailable, fall back to hidden-textarea + `document.execCommand("copy")`
- **Crypto API:** if `crypto.getRandomValues` is unavailable, generation throws — no `Math.random()` fallback (CLAUDE.md §5)
- **Game switch in Reports:** auto-reset uploaded draws (a 6/58 file isn't valid for 6/42)
- **BigInt formatting:** for jackpot odds `C(58, 6)`, use BigInt factorials and `Number()` only at format time

---

## 10. File structure

```
project-root/
├── package.json
├── vite.config.js
├── tailwind.config.js              (with shadcn preset, content paths)
├── postcss.config.js
├── components.json                 (shadcn config)
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx                     (orchestrator + tabs + game preset state)
    ├── index.css                   (Tailwind directives + CSS vars + body gradient)
    ├── components/
    │   ├── ui/                     (shadcn — installed via CLI)
    │   ├── ball.jsx                (HSL gradient circle)
    │   ├── result-stats.jsx        (per-row z-score badge)
    │   ├── game-preset-selector.jsx
    │   ├── stats-bar.jsx
    │   └── tabs/
    │       ├── generate-tab.jsx
    │       ├── excluded-tab.jsx
    │       └── info-tab.jsx
    ├── lib/
    │   ├── generator.js            (rng, weighted sample, filter cascade)
    │   ├── stats.js                (sumStats, computeStats, factorial, combinations)
    │   ├── storage.js              (load/save helpers, key constants, clamp)
    │   ├── parsing.js              (parseDrawsFromText, parse helpers)
    │   ├── clipboard.js            (handleCopy with fallback)
    │   └── presets.js              (PRESETS constant)
    └── modules/
        └── reports/
            ├── ReportsModule.jsx
            ├── FileUploadCard.jsx
            ├── SummaryStats.jsx
            ├── SumDistributionChart.jsx
            ├── FrequencyDistributionChart.jsx
            ├── PatternAnalysisChart.jsx
            ├── ClusterHeatmap.jsx
            ├── DrawDistributionList.jsx
            ├── reportCalculations.js
            └── sampleDraws.js
```

---

## 11. Acceptance criteria

### Generator
- [ ] All 6 game presets switch correctly; switching resets results but preserves stored combos & settings per game
- [ ] Custom game accepts pick `[1, 20]`, max `[2, 99]`, with `pick ≤ max`
- [ ] Generate produces N sets respecting both toggles
- [ ] Warning banner appears when any filter was relaxed (and only mentions filters that were actually on)
- [ ] Per-row stats line shows correct z-score; crowd score matches `scoreRow`
- [ ] Copy works in both orientations with custom separator; separator field disabled in vertical mode
- [ ] Per-row Exclude button toggles to "✓ Saved"; Excluded tab badge count updates immediately
- [ ] Recent-only mode honors N; switching modes is instant; status line updates correctly

### Excluded
- [ ] File import handles `.txt`/`.csv` with comments, multiple separators
- [ ] Export round-trips correctly (export then import yields identical state)
- [ ] Manual paste validates per current preset
- [ ] Toast appears on import with accurate counts

### Reports
- [ ] Generate Report button is `disabled` until a file is loaded OR demo data is loaded
- [ ] All 5 charts render correctly with sample data
- [ ] Switching the parent's preset resets the Reports state
- [ ] Frequency chart highlights hottest and coldest numbers
- [ ] Heatmap intensity scales with frequency; cells have hover effect
- [ ] Sort pills in Past Draws table cycle asc/desc on second click

### Build
- [ ] `npm run build` succeeds with no warnings (chunk-size warning for recharts is acceptable)
- [ ] Reports module is in a separate lazy chunk (verify in `dist/assets/`)
- [ ] Lighthouse accessibility score ≥ 90

---

## 12. Out of scope

- Real-time jackpot data — no public PCSO API exists; mention in info tab disclaimer
- "Hot/cold number" predictions — explicitly call out as folklore (each draw is independent)
- Multi-language UI (English only)
- Mobile app wrappers (web-only, but must be responsive)
- Backend / server (entirely client-side)
- Authentication / user accounts

---

## 13. Bootstrapping commands

```bash
npm create vite@latest lotto-smart-pick -- --template react
cd lotto-smart-pick
npm install

npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p

# Configure tailwind.config.js: content: ["./index.html", "./src/**/*.{js,jsx}"]
# Add @tailwind directives to src/index.css

npx shadcn-ui@latest init
npx shadcn-ui@latest add card button input label slider switch select tabs \
  badge toggle-group separator sonner tooltip scroll-area dialog alert table

npm install recharts
```

Then build out `src/lib/`, `src/modules/reports/`, `src/components/`, then `App.jsx`. Verify with `npm run build` at the end.
