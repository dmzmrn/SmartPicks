# Research Log — Anti-Jackpot-Splitting Lottery Engine

Running record of engine changes, verification results, and open questions.
Every entry states **what changed, why, and how it was verified**, so future
work can trace any behavior back to a decision. Spec references point to
`CLAUDE.md` §5 (Project Specification).

---

## 2026-07-02 — Engine hardening, statistical test harness, analytics dashboard

### 1. Engine: crypto-only randomness (spec §5 compliance fix)

**File:** `src/lib/generator.js` → `randUnit()`

**Before:** silently fell back to `Math.random()` when
`crypto.getRandomValues` was unavailable.
**After:** throws an error instead. No fallback path exists.

**Why:** spec §5 mandates *"cryptographically secure randomness only"*. The
fallback was dead code in any modern browser, but a silent degradation to a
non-crypto PRNG would invalidate every statistical guarantee the engine makes
without any visible signal. Failing loudly is the only spec-compliant
behavior.

**Verified by:** `generator.test.js` — stubs out `crypto` and asserts the
throw; separately asserts 10k draws land in `[0, 1)` with mean within a 5σ
band of 0.5.

### 2. Engine: batch-level duplicate prevention

**File:** `src/lib/generator.js` → `generateMany()`

**Before:** each row in a batch was drawn independently against the caller's
exclusion set only, so one batch could (with low but nonzero probability)
contain the same combination twice.
**After:** rows produced within a batch are added to a batch-local copy of
the exclusion set before the next row is drawn. The caller's set is never
mutated.

**Why:** the engine's entire purpose is minimizing prize-splitting. A batch
that can hand the player two identical rows would split a prize *with
itself* — a direct contradiction of the core philosophy, trivially cheap to
prevent.

**Verified by:** `generator.test.js` — 30 rows drawn from a 120-combination
space (3/10) must all be unique; a 2/5 game with 8 of 10 combinations
excluded must only ever return the 2 remaining ones, and the input set's size
must be unchanged afterward.

### 3. Statistical test harness (spec §5.2 — previously missing entirely)

**Files:** `src/lib/__tests__/generator.test.js`,
`src/lib/__tests__/stats.test.js`
**Dependency added:** `vitest` (dev-only). Rationale: the project had no test
runner at all; vitest is the zero-config standard for Vite projects and
reuses the existing `vite.config.js` (aliases, plugins). Installed with
`--legacy-peer-deps` because the existing tree already pairs `vite@8` with
`@vitejs/plugin-react@4` (which declares a peer range up to vite 7) — a
pre-existing condition, not introduced here.
**Run with:** `npm test`

**Methodology:** every statistical claim is tested over **10,000 iterations**
(spec requirement). Tolerances are **5σ binomial/normal bands**, so a correct
implementation fails a given check with p ≈ 5.7×10⁻⁷ — failures mean real
bugs, not flake. Where exact math is feasible, enumeration replaces
simulation entirely.

| Test | Method | Result |
|---|---|---|
| `randUnit` bounds + mean | 10k draws, 5σ band | ✅ |
| `randUnit` crypto-only | `crypto` stubbed out → must throw | ✅ |
| Efraimidis–Spirakis, k=1 | exact P(i) = wᵢ/Σw vs 10k empirical | ✅ |
| Efraimidis–Spirakis, k=2 | exact sequential-WR pair probabilities vs 10k empirical | ✅ |
| Zero-weight exclusion | 1k draws never select weight-0 items | ✅ |
| Filter compliance 6/58 | 10k rows × independent re-implementations of every §5 filter (sum window, spread ≥ 23, no 3+ runs, digit < 4, parity/range) — zero relaxation | ✅ |
| Tier weighting direction | per-number frequency: 32+ > 13–31 > 1–12, ratio > 1.5× | ✅ |
| Anti-birthday band | mean 32+ count per row in (3.0, 5.9); uniform baseline is 2.79 | ✅ |
| Unweighted baseline | 10k rows: all-high and all-low both rejected | ✅ |
| Batch uniqueness + exclusion respect | see §2 above | ✅ |
| `sumStats` closed form | exact enumeration of all C(10,6), C(12,5), C(20,3) combos — matches to 9 decimal places (incl. finite population correction) | ✅ |
| `combinations` | known values (C(58,6) = 40,475,358 etc.) | ✅ |

**Result: 18/18 passing** (vitest 4.1.9, Node 24). The harness doubles as the
spec's *"verification loop"*: any future edit to `generator.js` or `stats.js`
must keep these green, and new constraints must add a matching test.

**Design note:** the compliance tests re-implement each filter independently
inside the test file rather than importing the engine's `passesFilters` —
the harness is a second opinion, not a mirror.

### 4. Analytics dashboard (new feature)

**New folder:** `src/modules/dashboard/` —
`DashboardModule.jsx` (container), `dashboardCalculations.js` (pure metric
functions), `KpiRow.jsx`, `TierDistributionChart.jsx`, `SumWindowChart.jsx`,
`GeneratedFrequencyChart.jsx`, `MatchDistributionChart.jsx`, `chartTheme.js`.

**What it shows** (new "Dashboard" tab, between Generate and Excluded):

- **KPI row** — picks generated, mean sum vs theoretical μ and acceptance
  window, average spread vs the 40% floor, share of 32+ numbers vs uniform
  baseline, draws fed, relaxed-row count.
- **Weight-tier distribution** — share of generated numbers per spec tier
  (1–12 / 13–31 / 32+) against a uniform-game baseline: the anti-birthday
  shift, made visible.
- **Sum distribution** — histogram of generated sums with μ−1.5σ / μ /
  μ+2.75σ reference lines: every sum must sit inside the window.
- **Number frequency** — per-number share of generated picks (bars) overlaid
  with per-number share in fed historical draws (line), when data is fed.
- **Backtest** — every generated row scored against every fed draw;
  distribution of match counts (0…pick) and best match found.

**Data flow changes:**

- `src/lib/storage.js` — new persisted **generation history**
  (`lotto-generation-history:<pick>-<max>`, capped at `HISTORY_LIMIT = 1000`
  entries, validated on load like the exclusion list). Each entry:
  `{ ts, picks, relaxed }`.
- `src/App.jsx` — appends every generated batch to the history; lifts the
  fed-draws state out of the Reports tab so **one uploaded file feeds both
  Reports and Dashboard**; adds the Dashboard tab (lazy-loaded, wide layout).
- `src/modules/reports/ReportsModule.jsx` — now controlled: receives
  `draws`/`fileName`/`onDrawsChange` from App instead of holding them
  locally. No behavioral change inside the Reports tab itself.

**Chart palette** (validated with the dataviz six-checks validator against
the app's dark surface `#0d1322` — lightness band, chroma floor, CVD
ΔE 57.8, ≥3:1 contrast, all pass):

| Role | Hex | Meaning |
|---|---|---|
| series-generated | `#6366f1` | generated picks (matches app accent) |
| series-baseline | `#0d9488` | uniform/theoretical baseline |
| series-historical | `#d97706` | fed historical draws |

Colors follow the entity, never the rank; two-series charts carry a legend;
dashed strokes are used only for threshold reference lines (the filter
bounds), never for gridlines.

### 5. Verification of this session's work

- `npm test` → **18/18 pass**.
- `npm run build` → production build succeeds; dashboard is its own lazy
  chunk (32.9 kB, 9.7 kB gzip).
- Dev server boot + HTTP smoke test → app shell and all modified modules
  transform and serve without errors.

### Known limitations / open questions for future research

1. **Filter-relaxation ladder kept (deliberate).** `generatePick` drops
   filters in order (digit → spread → consecutive → sum) after 1000 failed
   attempts per stage. Strictly read, spec §5 calls the criteria
   *"strict rejection"*; the ladder exists so small/custom games (where the
   constraints can be unsatisfiable) still produce output, and every
   relaxation is reported to the UI and recorded per-row in the history
   (`relaxed`). For standard 6/42–6/58 games the harness proves relaxation
   never triggers (10k rows, zero relaxed). **Open question:** should custom
   games hard-fail instead? Decision deferred to the project owner.
2. **Parity/range filters are never relaxed** — all-even/all-odd/all-low
   rejection sits outside the ladder. Intentional, mirrors pre-existing
   behavior.
3. **Fed draws are session-only** — uploads are not persisted to
   localStorage (files can be large; re-upload is cheap). Generation history
   *is* persisted. Revisit if draw datasets grow.
4. **History cap = 1000 rows per game** — oldest entries are dropped first.
   Statistical displays remain valid but are then a moving window, not
   all-time.
5. **No table-view twins for charts yet** — values are reachable via
   tooltips and KPIs; a full accessible table view per chart is future work.
6. **Uniform baseline, not E–S-exact expectation** — the tier chart compares
   against a uniform game because exact first-order inclusion probabilities
   under weighted sampling *plus* rejection filters have no closed form. A
   Monte-Carlo-derived expected band could replace it later.

---

## 2026-07-02 (later) — Pick scorecard, dashboard regenerate, plain-language copy

### 1. Split-risk score per generated set (new)

**Files:** `src/modules/dashboard/dashboardCalculations.js` → `scoreRow()`,
`getLatestBatch()`; new `src/modules/dashboard/BatchScorecard.jsx`.

The dashboard now scores every set in the **latest batch** 0–100 with a
verdict (Excellent ≥ 80, Good ≥ 60, Fair ≥ 40, else Weak) and a plain-language
reason line.

**What the score means — and deliberately does not mean:** spec §5 states the
tool never predicts outcomes, so the score does **not** rate winning chances
(every combination is equally likely, and the UI says so verbatim). It rates
*split risk*: how well a set avoids numbers and shapes human players commonly
choose. Formula (fixed weights, documented so future work can recalibrate):

| Component | Points | Definition |
|---|---|---|
| Crowd avoidance | 55 | share of numbers past the birthday range (> 31); games with max < 32 use the upper half (> ⌊max/2⌋) instead |
| Spread margin | 15 | linear from the 40% filter floor up to the max possible spread |
| Rule compliance | 30 | −10 per filter the generator had to relax for that row |

**Why these weights:** crowd avoidance dominates because birthday-range
avoidance is the spec's primary anti-split mechanism (weights 0.18/0.40/1.00);
compliance is second because a relaxed row bypassed a strict criterion;
spread is a minor tiebreaker. The weights are a presentation-layer heuristic,
not an engine constraint — changing them cannot affect generation.

**Verified by:** `src/modules/dashboard/__tests__/dashboardCalculations.test.js` —
score bounds, monotonicity in beyond-birthday count, exact −10-per-relaxation
penalty, band labels, small-game (max < 32) rule, latest-batch selection,
exact match-count fixture, tier shares summing to 100%.

### 2. Regenerate from the dashboard (new)

**Files:** `src/modules/dashboard/DashboardModule.jsx`, `src/App.jsx`.

"Generate new picks" button in the dashboard header reuses the *same*
`handleGenerate` as the Generate tab (same set count, toggles, and exclusion
settings — one code path, no drift). New batches append to history and every
chart, KPI, and the scorecard recompute immediately. The Generate tab's
results list updates too, since both views share App state.

### 3. Plain-language copy pass (all dashboard surfaces)

**Files:** all `src/modules/dashboard/*.jsx`.

Rewritten for a non-technical reader: no σ/μ jargon in labels (the acceptance
window is "the healthy zone", spread is "number spacing", tier avoidance is
"beyond birthdays" / "dodging the crowd"). A permanent honesty note sits at
the top of the dashboard: *every draw is pure chance, no number is ever
"due", there is no lucky time to play* — answering the natural user question
("when is the best time to pick?") truthfully inside the product. Empty
states follow the what + why + how-to-start pattern.

### 4. Tooling note

`@vitejs/plugin-react` was upgraded 4.x → 6.x (project owner change),
resolving the Vite 8 peer mismatch recorded in the previous entry — the
`jsx` build warnings are gone and installs no longer need
`--legacy-peer-deps`.

### 5. Verification of this session's work

- `npm test` → **27/27 pass** (harness grew from 18 to 27 tests).
- `npm run build` → clean, no warnings; dashboard chunk 36.9 kB (11.3 kB gzip).

### Open questions added

7. **Score calibration** — the 55/15/30 weights are heuristic. With enough
   fed draw data plus published "popular numbers played" datasets (if a
   source is ever found), the crowd-avoidance component could be fit to real
   player-behavior distributions instead of the birthday proxy.

---

## 2026-07-02 (later still) — Scores on Generate tab, winner-column support, draw analysis

### 1. Split-risk score moved to the shared layer and shown on Generate

**Files:** new `src/lib/scoring.js` (moved verbatim from
`dashboardCalculations.js` — now used by two features, so it lives in `lib/`);
new shared `src/components/score-badge.jsx`;
`src/components/tabs/generate-tab.jsx` now shows the score badge on every
result row, next to Copy/Exclude, so users see quality before copying.
Scoring tests moved to `src/lib/__tests__/scoring.test.js` unchanged.

### 2. Winner-column parsing (new data format capability)

**File:** `src/lib/parsing.js` → `parseDrawsFromText` now returns
`{ draws, winners, skipped, hasWinnerData }`.

**Format contract:** a draw line is `pick` numbers, optionally followed by
**one** trailing winner count — `01-42-23-26-46-32 0` means that draw had 0
jackpot winners (rollover); `… 2` means 2 winners. Lines without the column
parse as before (`winners: null` = unknown, never treated as zero).
Safeguards: the trailing token must be 0–9999 to be read as a winner count;
otherwise the lenient legacy path applies (out-of-range junk like draw IDs is
ignored). One behavioral improvement: junk characters now become separators
instead of being deleted, so `23.26` reads as 23 and 26 — under the old
cleaner it fused into `2326` and the line was skipped.
`parseCombosFromText` (exclusion import) keeps its old contract.

**Why winner counts matter (answer to the project owner's question):** yes —
this is the most on-thesis data the tool can consume. The engine's premise is
that crowd-like combinations split prizes; winner counts per draw are the
only real-world observable that can test that premise directly.

### 3. Draw analysis card (new dashboard section)

**Files:** `src/modules/dashboard/DrawAnalysisCard.jsx`,
`dashboardCalculations.js` → `getDrawScoreAnalysis()`.

Every fed draw's winning combination is scored with the same 0–100
split-risk score as generated picks. Two modes, controlled by a
**"Use winner counts" toggle** (shown only when the file has winner data;
defaults on):

- **Winners on:** draws are bucketed into crowd-like (score < 60) vs
  uncommon (score ≥ 60); the card compares average winners per draw and
  jackpot-hit share per bucket, with an auto-written plain-language
  conclusion. When the data supports the thesis it says so; when it doesn't
  (small samples), the card says that too rather than overclaiming.
- **Winners off / absent:** distribution of winning-combination scores by
  band, with honest framing ("low-scoring draws prove crowd numbers get
  drawn too — the score only changes who you'd share with").

Data flow: `winners` runs parallel to `draws` (same index), lifted through
App state; Reports ignores it, Dashboard consumes it. Demo data carries no
winner info by design (kept honest).

**Verified by:** `src/lib/__tests__/parsing.test.js` (the exact
user-documented line format incl. `0` rollovers, dot separators, legacy
junk-ID lines, comment headers) and bucket/average fixtures in
`dashboardCalculations.test.js` (null = unknown, never zero).

### 4. Verification

- `npm test` → **37/37 pass** (harness: 27 → 37).
- `npm run build` → clean.

### Open questions added

8. **Bucket threshold (score 60)** for crowd-like vs uncommon is the Good/Fair
   boundary — revisit once enough winner-annotated draws accumulate to fit
   the threshold empirically (e.g., maximize winner-count separation).

---

## 2026-07-02 (fix) — Winner detection for real-world export files

**Problem reported:** the "Use winner counts" toggle never appeared. Root
cause: the parser only recognized the bare documented shape (`pick` numbers +
optional trailing count). Real lottery exports carry extra columns — game
label, draw date, jackpot amount — so those lines fell into the lenient
fallback and the winner count was silently discarded.

### 1. Combo-group parsing layer (`src/lib/parsing.js`)

A line containing exactly **one** run of `pick` numbers joined by dashes/dots
(standard combination notation, e.g. `01-42-23-26-46-32`) is now parsed from
that group; the winner count is the **last whitespace-separated field** when
it is a bare integer 0–9999. Dates (`09/15/2024`) and amounts
(`49,500,000.00`) can't collide: slashes and commas are not join characters,
and an amount's decimal tail (`000.00`) is a 2-number group, below any real
`pick`. Ordering matters and is deliberate: the combo-group check runs
**before** the token-count paths, so a leading row index can't be absorbed as
a number and the last drawn number can't be misread as a winner count
(`17 01-42-23-26-46-32` was previously parsed wrong). Lines with two
combination groups are ambiguous → skipped. Fully-space-separated lines with
a leading index (`17 1 42 23 26 46 32`) remain inherently ambiguous with the
"numbers + count" contract and parse per the documented format.

### 2. Detection made visible (UI)

- Reports upload chip now permanently shows `winner counts found` /
  `no winner column` next to the draw count — feedback at the moment of upload.
- The dashboard's "Use winner counts" toggle is now **always visible** when
  draws are loaded; without winner data it renders disabled with the hint
  "no winner column detected in your file" instead of vanishing (the
  invisible toggle was indistinguishable from a missing feature).

### 3. Verification

- New tests: PCSO-style rows (game/combo/date/jackpot/winners), jackpot-amount
  last column not misread, leading row index not misread, ambiguous
  double-combo lines skipped. `npm test` → **41/41 pass**; build clean.

---

## 2026-09-27 — Calibrated crowd model, arithmetic-pattern filter, UI redesign

Closes open questions **7** (score calibration) and **8** (bucket threshold)
with a model fitted to real data, and closes a generator hole the data exposed.

### 1. Crowd score recalibrated on 3,086 real draws (`src/lib/scoring.js`)

**Before:** heuristic 55/15/30 points (share of numbers > 31, spread margin,
−10 per relaxed filter). Uncalibrated, and demonstrably wrong: it rated the
most-shared combination on record, 09·18·27·36·45·54 (433 jackpot winners),
**68 / "Good"**.

**Method.** Poisson regression of jackpot winner counts on the winning
combination's features — the log-linear combination-preference approach of
Baker & McHale (JRSS A 2011, 174(4):1071–1086). For draw *d*:
`winners_d ~ Poisson(λ_d)`, `log λ_d = α_game + β·B_d + γ·[B_d = pick]`,
`B_d` = numbers in 1–31. Ticket sales vary by draw (rollovers) but are
independent of the random winning combination, so β and γ stay consistent;
Poisson standard errors are backed by a within-game permutation test.
Evenly spaced draws are excluded from the fit (handled by §2).

**Data:** the project owner's PCSO files `6-55.txt` (1,572 draws, 75
winners, excl. the 433-winner draw) and `6-58.txt` (1,514 draws, 64 winners).
Both are gitignored personal data. Reproduce with:
`node scripts/calibrate-crowd-model.mjs 6/55=6-55.txt 6/58=6-58.txt`

| Term | Estimate | Rate ratio | Permutation p |
|---|---|---|---|
| β — per birthday-range number | 0.487 ± 0.098 | ×1.63 | ≤ 0.002 |
| γ — every number in 1–31 | 1.404 ± 0.294 | ×4.07 | ≤ 0.018 |

Adding γ improves the log-likelihood by 11.2 (LR 22.4, 1 df). Mean winners
per draw by birthday count (6/58): B ≤ 5 → 0.00–0.07; **B = 6 → 0.64**, i.e.
the effect is a gradient plus a jump for all-birthday tickets. Features tested
and **not** significant (|z| < 2): contains 7, consecutive pairs, multiples of
5, max shared last digit, spread, odd count, month numbers 1–12 vs 13–31
(z = 1.8). They are not scored.

**New score:** `100 × P(a random combination is more crowded)`, ties half,
computed **exactly** from the hypergeometric distribution of B (BigInt
binomials). Popularity rises strictly with B, so this is a mid-rank
percentile: a uniformly random combination averages 50. Evenly spaced
combinations score 0 (433 co-winners vs ≤ 10 in every other recorded draw).
`relaxed` now only feeds the explanation: identical combinations carry
identical split risk however they were generated.

6/58 score levels: B=0 → 100, 1 → 96, 2 → 83, 3 → 57, 4 → 27, 5 → 7, 6 → 1.
Crowd index (popularity vs average combination): 0.15× … 11.4×.
Generated picks (6/58, all filters) average **81**; random ones 50.

**Verified by** `src/lib/__tests__/scoring.test.js`: exact percentile vs full
enumeration of all 658,008 5/40 combinations; crowd index averages exactly 1
over that enumeration; 10k uniform draws average 50 (5σ band); 10k generated
rows average > 70; fitted rate ratios; 433-draw → 0; small games → 50.
Real-data check in the dashboard: the 1,515 loaded 6/58 winning combinations
average a score of exactly 50, and crowd-like (< 60) winners average 0.05
co-winners vs 0.02 for uncommon (≥ 60) — the split effect, confirmed.

### 2. Generator: arithmetic-pattern filter (`src/lib/patterns.js`, `generator.js`)

**Hole:** 09·18·27·36·45·54 passed every existing filter (sum 189 inside
[112, 270] for 6/55, spread 45, distinct last digits, mixed parity).

**New strict filter** — reject when the longest evenly spaced subset has
≥ max(4, pick − 1) numbers (6/58: 5+). Adds a rejection; relaxes nothing in
CLAUDE.md §5. Cost: ≈ 0.05% of 6/58 combinations. It drops **last** in the
relaxation ladder (digit → spread → consecutive → sum → pattern).

**Verified by:** `patterns.test.js` (433-draw fixture, interleaved
progressions, brute-force subset cross-check on 2,000 random combinations);
`generator.test.js` — the 10k 6/58 compliance run now also checks patterns
(independent subset re-implementation), and a 10k 4/12 run proves the filter
is exercised: 73.3 patterned rows expected without it (3 of 409 survivors, computed exactly by
enumerating the survivors of the other filters), 0 observed, never relaxed.

### 3. Spec note — tier weights vs the data

The fitted per-number rate ratio (×1.63 for any 1–31 number) sits between the
spec's 13–31 ratio (1.00/0.40 = 2.5) and is far below its 1–12 ratio
(1.00/0.18 ≈ 5.6); months-vs-days was not significant. The weights are a
locked spec constraint and were **not** changed — recorded for the owner.

### 4. UI redesign (all components)

One neutral palette plus a single accent (presets Slate / Blue / Teal; mode
Light / Dark / System, default Dark per BRIEF), Inter instead of all-monospace,
no gradients or glows, token-only colors (every hardcoded white/slate/indigo/
green/red class removed). Balls: accent fill = 32+ (rarely played), neutral =
1–31 — color now carries meaning. Charts use the dataviz reference palette
(blue = your picks, orange = real draws, gray = uniform baseline; validated
for CVD separation and ≥ 3:1 contrast on both card surfaces), text in text
tokens, colors via CSS variables so charts follow the theme. Chart theme moved
to `src/lib/chartTheme.jsx` (shared by Dashboard and Reports).
Verified in Edge (headless) at 1400px and 390px, light and dark: no console
errors; Reports/Dashboard (and recharts) still load lazily.

### 5. Verification

- `npm test` → **54/54 pass** (41 → 54).
- `npm run build` → clean.

### Open questions added

9. **Pattern threshold** — "all or all but one evenly spaced" is anchored on
   one extreme event. Ticket-slip geometry (rows, columns, diagonals of the
   PCSO slip) is the other classic popular pattern (Henze & Riedwyl 1998) and
   is not modeled; it needs the slip layout.
10. **Expected jackpot share** — with λ̄ = mean winners per draw (0.048 /
    0.042), the expected share of a win is (1 − e^(−λ̄·r))/(λ̄·r) for crowd
    index r. Not surfaced yet; it would turn the score into a peso EV figure.

---

## Template for future entries

```markdown
## YYYY-MM-DD — <title>

### <n>. <change>
**File(s):** …
**Before / After:** …
**Why:** … (spec reference)
**Verified by:** … (test name + method, or exact math)
```
