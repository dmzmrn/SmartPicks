# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

**Follow** BRIEF.md as the single source of truth

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## 5. Project Specification: Anti-Jackpot-Splitting Lottery Engine

### Core Philosophy
This tool does NOT predict future lottery numbers. It uses game-theory optimization to generate picks that systematically avoid common human biases (birthdays, visual patterns, narrow clusters), maximizing Expected Value (EV) by minimizing the probability of splitting a prize if a win occurs.

### Technical & Mathematical Constraints
- **Sampling & Randomness:** Cryptographically secure randomness only (`crypto.getRandomValues`) paired with the **Efraimidis–Spirakis weighted reservoir sampling algorithm** for provably correct sampling without replacement.
- **Tiered Weights (Anti-Birthday Filter):** Numbers 1–12 (Weight = `0.18`), Numbers 13–31 (Weight = `0.40`), Numbers 32+ (Weight = `1.00`).
- **Combination Filters (Strict Rejection Criteria):**
  - **Consecutive Runs:** Reject any sorted run of 3+ consecutive integers (e.g., `[11, 12, 13]`).
  - **Statistical Balance:** Reject if the sum falls outside the asymmetric window of $\mu - 1.5\sigma \le \text{Sum} \le \mu + 2.75\sigma$.
  - **Parity/Range Rows:** Reject all-even, all-odd, and all-low rows. *(All-high rows allowed only when birthday weights are active).*
  - **Number Spread:** Combined picks must span $\ge 40\%$ of the game's maximum number matrix (e.g., span $\ge 23$ for a 6/58 game).
  - **Ending-Digit Diversity:** No single trailing digit (`0–9`) can appear in 4 or more picks within a single combination.

### Instructions for Fable 5 Execution
1. **Maintain Rule Integrity:** Never optimize or refactor code in a way that relaxes or bypasses any of the constraints listed above (aligns with *Section 3: Surgical Changes*).
2. **Verification Loop:** When writing or editing functions, always provide or update a corresponding statistical test harness to prove the output distributions perfectly match these algorithmic rules over 10,000 simulated iterations (aligns with *Section 4: Goal-Driven Execution*).