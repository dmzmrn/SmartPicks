import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const Section = ({ title, description, children }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent className="space-y-2 text-sm leading-relaxed text-slate-300">
      {children}
    </CardContent>
  </Card>
);

export default function InfoTab() {
  return (
    <div className="space-y-3">
      <Section
        title="What this tool does"
        description="Anti-jackpot-splitting, not prediction."
      >
        <p>
          Every combination has the same odds. This generator helps you avoid combinations
          most people pick — birthdays, narrow clusters, all-even rows. If you do hit, you
          split with fewer people.
        </p>
      </Section>

      <Section title="Avoid birthday range (tiered weights)">
        <p>
          Numbers ≤ 12 weighted <span className="accent-text-soft">0.18</span>, 13–31 weighted{" "}
          <span className="accent-text-soft">0.40</span>, 32+ weighted{" "}
          <span className="accent-text-soft">1.0</span>. Nudges the marginal probability of
          each pick toward the underused upper range without forbidding low numbers entirely.
        </p>
      </Section>

      <Section title="Avoid 3+ consecutive">
        <p>
          Patterns like 11·12·13 are visually attractive and often picked. This filter
          rejects any sorted run of three consecutive integers.
        </p>
      </Section>

      <Section title="Statistical balance (always on)">
        <ul className="list-disc space-y-1 pl-5 text-slate-300">
          <li>Asymmetric sum window: μ − 1.5σ to μ + 2.75σ — public skews low, so we lean high.</li>
          <li>Reject all-even / all-odd rows.</li>
          <li>Reject all-low rows. All-high allowed only when "avoid birthdays" is on.</li>
        </ul>
      </Section>

      <Section title="Number spread (always on)">
        <p>
          Picks must span at least <span className="accent-text-soft">40% of the max number</span>{" "}
          (e.g., ≥ 23 for 6/58). Compact clusters get rejected.
        </p>
      </Section>

      <Section title="Ending-digit diversity (always on)">
        <p>
          No single last digit (0–9) appears in 4+ picks. Avoids "all numbers ending in 7"
          coincidence rows.
        </p>
      </Section>

      <Section title="Sampling method">
        <p>
          Uses <code className="accent-text-soft">crypto.getRandomValues</code> (falls back
          to <code className="accent-text-soft">Math.random</code>) plus the
          <span className="accent-text-soft"> Efraimidis–Spirakis </span>
          weighted reservoir algorithm — provably correct sampling without replacement.
        </p>
      </Section>

      <Section title="Excluding past winners">
        <p>
          Lotto draws are independent — past winners are not less likely. The exclusion
          list is a <em>preference</em> tool: pick your own definition of "already taken"
          and skip those combos. "Recent only" mode is a convenience, not an edge.
        </p>
      </Section>

      <Section title="Honest disclaimer">
        <p className="text-red-400">
          No tool can predict lotto numbers. Every combo has the same odds. Treat lotto as
          entertainment — never wager money you can't afford to lose.
        </p>
      </Section>
    </div>
  );
}
