# 📊 Lotto Number Generator – Analysis & Reports Modules

## Overview

This project extends an existing lotto number generator app by adding **two key modules**:

1. **Analysis Module** – evaluates generated numbers
2. **Reports Module** – analyzes historical past draws and distributions

The goal is to provide **data visualization and statistical insights**, not prediction or guaranteed outcomes.

---

## ⚠️ Disclaimer

* This app is **not affiliated with any official lottery organization**
* It does **not guarantee winnings**
* Lottery results are inherently random
* This app is for **analysis and entertainment purposes only**

---

# 🧩 Architecture Overview

```
Generator Module → Generates numbers

Analysis Module → Evaluates generated numbers

Reports Module → Analyzes historical draw data
```

Each module is **independent and modular**.

---

# 📦 Modules

## 1. Analysis Module (Generated Numbers)

### Purpose

Analyzes a generated number set using statistical indicators.

### Input Props

```js
generatedNumbers: number[]
pastDraws: number[][]
excludedNumbers: number[]
zScore: number
```

### Features

* Z-score classification (anti-public vs common)
* Odd vs Even ratio
* High vs Low split
* Gap analysis
* Exclusion conflict detection
* Frequency comparison vs past draws

---

### Structure

```
/analysis-module
  /components
    ZScoreBadge.jsx
    FrequencyMiniChart.jsx
    StatsBreakdown.jsx
    ExclusionCheck.jsx

  /utils
    calculations.js

  AnalysisModule.jsx
```

---

### Usage

```jsx
import AnalysisModule from "./analysis-module/AnalysisModule";

<AnalysisModule
  generatedNumbers={numbers}
  pastDraws={history}
  excludedNumbers={excluded}
  zScore={z}
/>
```

---

---

## 2. Reports Module (Past Draw Analysis)

### Purpose

Provides **historical insights and distribution analysis** across all past draws.

### Input Props

```js
pastDraws: number[][]
```

---

### Features

### A. Per-Draw Analysis

* Sum of each draw
* Odd/Even ratio
* High/Low split

### B. Cross-Draw Analysis

* Frequency distribution of numbers
* Trend analysis over time
* Pattern visualization

---

### Components

#### 1. DrawDistributionList

* Displays each draw
* Shows:

  * numbers
  * sum
  * ratios
* Supports sorting

---

#### 2. SumDistributionChart

* Visualizes sum trends per draw

---

#### 3. FrequencyDistributionChart

* Shows most/least frequent numbers

---

#### 4. PatternAnalysisChart

* Tracks:

  * odd/even trends
  * high/low trends

---

#### 5. ClusterHeatmap

* Grid-based number frequency visualization

---

### Structure

```
/reports-module
  /components
    DrawDistributionList.jsx
    SumDistributionChart.jsx
    FrequencyDistributionChart.jsx
    PatternAnalysisChart.jsx
    ClusterHeatmap.jsx

  /utils
    reportCalculations.js

  ReportsModule.jsx
```

---

### Usage

```jsx
import ReportsModule from "./reports-module/ReportsModule";

<ReportsModule pastDraws={history} />
```

---

# 🧠 Core Concepts

## Z-Score Classification

Used to measure how “unusual” a number set is:

| Range       | Meaning                   |
| ----------- | ------------------------- |
| ≥ +0.5      | Less common (anti-public) |
| -0.5 to 0.5 | Typical                   |
| ≤ -0.5      | More common               |

---

## Analysis Philosophy

* Focus on **distribution and patterns**
* Avoid claims of prediction
* Provide **visual insights for users**

---

# ⚙️ Utilities

## analysis-module/utils/calculations.js

* getFrequencyMap()
* getOddEven()
* getHighLow()
* getGaps()
* checkExclusions()

---

## reports-module/utils/reportCalculations.js

* getDrawSum()
* getOddEvenRatio()
* getHighLowSplit()
* getFrequencyMap()
* getDrawStats()
* normalizeFrequency()

---

# 🎨 UI Guidelines

* Modular, plug-and-play components
* No full-page layout assumptions
* Tailwind-based styling
* Responsive and lightweight

---

# 💰 Monetization Strategy

Recommended options:

* One-time purchase (low price)
* Freemium (basic vs advanced analytics)
* Ads with optional removal

---

# ⚠️ Important Constraints

* Do NOT present as a “winning system”
* Do NOT imply increased odds
* Keep positioning as:

  * analysis tool
  * number generator
  * statistical viewer

---

# 🚀 Future Enhancements

* Time filters (last N draws)
* Per-draw detail modal
* Saved user number tracking
* Custom pattern filters
* Advanced statistical scoring

---

# 🧠 Summary

This project is structured to:

* Generate numbers
* Analyze outputs
* Provide historical insights

The **Reports Module** is the key value driver, offering users:

* visibility into patterns
* understanding of distributions
* confidence in number selection (without prediction claims)

---
